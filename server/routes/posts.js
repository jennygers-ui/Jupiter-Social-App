import { Router } from "express";
import { db, pub, uid, POST_LIMIT } from "../models/db.js";
import { auth } from "../middleware/auth.js";

const router = Router();
router.use(auth);

function enrich(post, meId) {
  const author = db.users.find((u) => u.id === post.userId);
  return {
    id: post.id,
    text: post.text,
    createdAt: post.createdAt,
    author: author ? pub(author) : null,
    likes: post.likes.length,
    likedByMe: post.likes.includes(meId),
    comments: post.comments.map((c) => {
      const cu = db.users.find((u) => u.id === c.userId);
      return { id: c.id, text: c.text, createdAt: c.createdAt, author: cu ? pub(cu) : null };
    }),
  };
}

// GET /api/posts/ — feed: my posts + friends' posts
router.get("/", (req, res) => {
  const me = req.user.id;
  const friendIds = db.friendships
    .filter((f) => f.status === "accepted" && (f.from === me || f.to === me))
    .map((f) => (f.from === me ? f.to : f.from));
  const visible = new Set([me, ...friendIds]);
  res.json(
    db.posts.filter((p) => visible.has(p.userId)).sort((a, b) => b.createdAt - a.createdAt).map((p) => enrich(p, me))
  );
});

// POST /api/posts/
router.post("/", (req, res) => {
  const text = (req.body.text || "").trim();
  if (!text) return res.status(422).json({ error: "Write something first" });
  if (text.length > POST_LIMIT) return res.status(422).json({ error: `Posts are limited to ${POST_LIMIT} characters` });
  const post = { id: uid("p"), userId: req.user.id, text, createdAt: Date.now(), likes: [], comments: [] };
  db.posts.push(post);
  res.status(201).json(enrich(post, req.user.id));
});

// DELETE /api/posts/:id
router.delete("/:id", (req, res) => {
  const post = db.posts.find((p) => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: "Post not found" });
  if (post.userId !== req.user.id) return res.status(403).json({ error: "You can only delete your own posts" });
  db.posts = db.posts.filter((p) => p.id !== req.params.id);
  res.json({ ok: true });
});

// POST /api/posts/:id/like — toggle
router.post("/:id/like", (req, res) => {
  const post = db.posts.find((p) => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: "Post not found" });
  const i = post.likes.indexOf(req.user.id);
  if (i >= 0) post.likes.splice(i, 1);
  else post.likes.push(req.user.id);
  res.json({ likes: post.likes.length, likedByMe: i < 0 });
});

// GET /api/posts/:id/comments
router.get("/:id/comments", (req, res) => {
  const post = db.posts.find((p) => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: "Post not found" });
  res.json(enrich(post, req.user.id).comments);
});

// POST /api/posts/:id/comments
router.post("/:id/comments", (req, res) => {
  const text = (req.body.text || "").trim();
  if (!text) return res.status(422).json({ error: "Comment can't be empty" });
  if (text.length > POST_LIMIT) return res.status(422).json({ error: "Keep it under 280 characters" });
  const post = db.posts.find((p) => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: "Post not found" });
  post.comments.push({ id: uid("c"), userId: req.user.id, text, createdAt: Date.now() });
  res.json(enrich(post, req.user.id));
});

export default router;

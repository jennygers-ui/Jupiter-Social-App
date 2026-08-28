import { Router } from "express";
import { db, pub, relation, ensureConversation, uid } from "../models/db.js";
import { auth } from "../middleware/auth.js";

const router = Router();
router.use(auth);

const userOf = (me, id) => {
  const u = db.users.find((x) => x.id === id);
  return u && { ...pub(u), relation: relation(me, id) };
};

// GET /api/friends/
router.get("/", (req, res) => {
  const ids = db.friendships
    .filter((f) => f.status === "accepted" && (f.from === req.user.id || f.to === req.user.id))
    .map((f) => (f.from === req.user.id ? f.to : f.from));
  res.json(db.users.filter((u) => ids.includes(u.id)).map((u) => ({ ...pub(u), relation: "friends" })));
});

// GET /api/friends/requests
router.get("/requests", (req, res) => {
  res.json({
    incoming: db.friendships
      .filter((f) => f.status === "pending" && f.to === req.user.id)
      .map((f) => userOf(req.user.id, f.from)).filter(Boolean),
    outgoing: db.friendships
      .filter((f) => f.status === "pending" && f.from === req.user.id)
      .map((f) => userOf(req.user.id, f.to)).filter(Boolean),
  });
});

// POST /api/friends/:id — send a friend request (accepts if one is incoming)
router.post("/:id", (req, res) => {
  const me = req.user.id;
  const other = req.params.id;
  if (other === me) return res.status(422).json({ error: "You already know yourself quite well" });
  const rel = relation(me, other);
  if (rel === "friends") return res.status(409).json({ error: "Already friends" });
  if (rel === "outgoing") return res.status(409).json({ error: "Request already sent" });

  if (rel === "incoming") {
    db.friendships.find((f) => f.from === other && f.to === me).status = "accepted";
    ensureConversation(me, other);
    return res.json({ relation: "friends" });
  }
  db.friendships.push({ id: uid("f"), from: me, to: other, status: "pending", at: Date.now() });
  res.status(201).json({ relation: "outgoing" });
});

// PATCH /api/friends/:id — accept an incoming request
router.patch("/:id", (req, res) => {
  const f = db.friendships.find(
    (f) => f.from === req.params.id && f.to === req.user.id && f.status === "pending"
  );
  if (!f) return res.status(404).json({ error: "Request not found" });
  f.status = "accepted";
  ensureConversation(req.user.id, req.params.id);
  res.json({ relation: "friends" });
});

// DELETE /api/friends/:id — decline incoming, cancel outgoing, or unfriend
router.delete("/:id", (req, res) => {
  const me = req.user.id;
  const other = req.params.id;
  db.friendships = db.friendships.filter(
    (f) =>
      !(
        (f.status === "pending" && ((f.from === other && f.to === me) || (f.from === me && f.to === other))) ||
        (f.status === "accepted" && ((f.from === me && f.to === other) || (f.from === other && f.to === me)))
      )
  );
  res.json({ relation: "none" });
});

export default router;

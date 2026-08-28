import { Router } from "express";
import { db, pub, uid } from "../models/db.js";
import { auth } from "../middleware/auth.js";

const router = Router();
router.use(auth);

// GET /api/messages/conversations
router.get("/conversations", (req, res) => {
  const me = req.user.id;
  const out = db.conversations
    .filter((c) => c.members.includes(me))
    .map((c) => {
      const otherId = c.members.find((m) => m !== me);
      const other = db.users.find((u) => u.id === otherId);
      const msgs = db.messages.filter((m) => m.conversationId === c.id);
      const last = msgs[msgs.length - 1] || null;
      const lastRead = c.reads[me] || 0;
      return {
        id: c.id,
        user: other ? pub(other) : null,
        lastMessage: last
          ? { id: last.id, text: last.text, senderId: last.senderId, createdAt: last.createdAt }
          : null,
        unread: msgs.filter((m) => m.senderId !== me && m.createdAt > lastRead).length,
      };
    })
    .sort((a, b) => (b.lastMessage?.createdAt || 0) - (a.lastMessage?.createdAt || 0));
  res.json(out);
});

// GET /api/messages/:conversationId
router.get("/:conversationId", (req, res) => {
  const conv = db.conversations.find((c) => c.id === req.params.conversationId);
  if (!conv || !conv.members.includes(req.user.id))
    return res.status(404).json({ error: "Conversation not found" });
  res.json(
    db.messages
      .filter((m) => m.conversationId === conv.id)
      .sort((a, b) => a.createdAt - b.createdAt)
  );
});

// POST /api/messages/:conversationId — also broadcast over Socket.IO in server.js
router.post("/:conversationId", (req, res) => {
  const text = (req.body.text || "").trim();
  if (!text) return res.status(422).json({ error: "Message can't be empty" });
  const conv = db.conversations.find((c) => c.id === req.params.conversationId);
  if (!conv || !conv.members.includes(req.user.id))
    return res.status(404).json({ error: "Conversation not found" });

  const message = { id: uid("m"), conversationId: conv.id, senderId: req.user.id, text, createdAt: Date.now() };
  db.messages.push(message);
  conv.lastMessageAt = message.createdAt;
  conv.reads[req.user.id] = message.createdAt;

  // realtime push to the conversation room (if io was attached by server.js)
  const io = req.app.get("io");
  if (io) io.to(`conv:${conv.id}`).emit("message:new", message);

  res.status(201).json(message);
});

// POST /api/messages/:conversationId/read — mark as read
router.post("/:conversationId/read", (req, res) => {
  const conv = db.conversations.find((c) => c.id === req.params.conversationId);
  if (!conv) return res.status(404).json({ error: "Conversation not found" });
  conv.reads[req.user.id] = Date.now();
  res.json({ ok: true });
});

export default router;

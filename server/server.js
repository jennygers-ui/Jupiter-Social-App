// Jupiter — Express + Socket.IO server (in-memory data, JWT auth).
//
//   cd server && npm install && npm run dev
//   -> REST API on http://localhost:3001/api
//   -> Socket.IO on the same origin (handshake: { auth: { token } })
//
import express from "express";
import cors from "cors";
import http from "http";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { Server } from "socket.io";
import { db, uid, ensureConversation } from "./models/db.js";
import { socketAuth } from "./middleware/auth.js";

import authRoutes from "./routes/auth.js";
import usersRoutes from "./routes/users.js";
import friendsRoutes from "./routes/friends.js";
import postsRoutes from "./routes/posts.js";
import messagesRoutes from "./routes/messages.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: true } });

app.use(cors());
app.use(express.json());
app.set("io", io);

app.get("/api/health", (_req, res) => res.json({ ok: true, name: "jupiter" }));
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/friends", friendsRoutes);
app.use("/api/posts", postsRoutes);
app.use("/api/messages", messagesRoutes);

/* --------------------- root route / frontend serving --------------------- */

// If the client has been built (cd client && npm run build -> client/dist),
// serve the whole app from this server on :3001.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLIENT_DIST = path.join(__dirname, "..", "client", "dist");
const hasClientBuild = fs.existsSync(path.join(CLIENT_DIST, "index.html"));

if (hasClientBuild) {
  app.use(express.static(CLIENT_DIST));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/") || req.path.startsWith("/socket.io/")) return next();
    res.sendFile(path.join(CLIENT_DIST, "index.html")); // SPA fallback
  });
} else {
  app.get("/", (_req, res) => {
    res.type("html").send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>j. — Jupiter API</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400..700;1,9..144,400..700&family=DM+Sans:opsz,wght@9..40,400..700&display=swap" rel="stylesheet" />
  <style>
    body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
           background: #f5f1e9; color: #1f2b25; font-family: "DM Sans", system-ui, sans-serif; }
    .card { background: #fff; border: 1px solid #eae3d4; border-radius: 16px; padding: 40px 44px;
            max-width: 460px; box-shadow: 0 24px 60px -32px rgba(23,63,44,.35); }
    .word { font-family: "Fraunces", Georgia, serif; font-style: italic; font-weight: 600;
            font-size: 56px; line-height: 1; color: #173f2c; }
    .word span { color: #d66b4b; }
    h1 { font-family: "Fraunces", Georgia, serif; font-size: 22px; margin: 18px 0 6px; color: #173f2c; }
    p { margin: 6px 0; font-size: 14.5px; line-height: 1.55; color: #64716a; }
    .row { display: flex; justify-content: space-between; gap: 12px; padding: 9px 0;
           border-top: 1px solid #f5f1e9; font-size: 13.5px; }
    .row b { color: #1f2b25; font-weight: 600; }
    .ok { color: #286149; font-weight: 700; }
    code { background: #f5f1e9; border-radius: 6px; padding: 2px 7px; font-size: 12.5px; color: #173f2c; }
    a { color: #286149; font-weight: 600; }
  </style>
</head>
<body>
  <div class="card">
    <div class="word">j<span>.</span></div>
    <h1>Jupiter API is running</h1>
    <p>This is the backend (REST + Socket.IO) — the app interface lives on the <b>frontend dev server</b>.</p>
    <div class="row"><b>REST API</b><span class="ok">online · /api</span></div>
    <div class="row"><b>Socket.IO</b><span class="ok">online · this origin</span></div>
    <div class="row"><b>Demo login</b><span>noa@example.com / password</span></div>
    <p style="margin-top:16px">To see the app UI, in a second terminal run:<br />
      <code>cd client</code> &nbsp;<code>npm install</code> &nbsp;<code>npm run dev</code><br />
      then open <a href="http://localhost:3000">http://localhost:3000</a>.</p>
    <p>Tip: after <code>npm run build</code> in <code>client/</code>, restart this server and the whole app is served right here on port 3001.</p>
  </div>
</body>
</html>`);
  });
}

/* ------------------------------ realtime ------------------------------ */

// userId -> Set<socketId>
const online = new Map();

function setPresence(userId, isOnline) {
  const u = db.users.find((x) => x.id === userId);
  if (u) u.online = isOnline;
  io.emit("presence", { userId, online: isOnline });
}

io.use(socketAuth);

io.on("connection", (socket) => {
  const userId = socket.userId;

  // join personal + conversation rooms
  socket.join(`user:${userId}`);
  db.conversations
    .filter((c) => c.members.includes(userId))
    .forEach((c) => socket.join(`conv:${c.id}`));

  if (!online.has(userId)) online.set(userId, new Set());
  const firstTab = online.get(userId).size === 0;
  online.get(userId).add(socket.id);
  if (firstTab) setPresence(userId, true);

  // realtime message send: { conversationId, text }
  socket.on("message:send", ({ conversationId, text }, ack) => {
    text = String(text || "").trim();
    if (!text) return ack && ack({ error: "Message can't be empty" });
    const conv = db.conversations.find((c) => c.id === conversationId);
    if (!conv || !conv.members.includes(userId))
      return ack && ack({ error: "Conversation not found" });

    const message = { id: uid("m"), conversationId: conv.id, senderId: userId, text, createdAt: Date.now() };
    db.messages.push(message);
    conv.lastMessageAt = message.createdAt;
    conv.reads[userId] = message.createdAt;

    io.to(`conv:${conv.id}`).emit("message:new", message);
    ack && ack({ message });
  });

  // open a conversation with a friend (creates it if needed)
  socket.on("conversation:open", ({ userId: otherId }, ack) => {
    const conv = ensureConversation(userId, otherId);
    socket.join(`conv:${conv.id}`);
    ack && ack({ conversationId: conv.id });
  });

  // typing indicator, relayed to the conversation room
  socket.on("typing", ({ conversationId }) => {
    socket.to(`conv:${conversationId}`).emit("typing", { conversationId, userId });
  });

  socket.on("disconnect", () => {
    const tabs = online.get(userId);
    if (tabs) {
      tabs.delete(socket.id);
      if (tabs.size === 0) {
        online.delete(userId);
        setPresence(userId, false);
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`\n  j.  Jupiter server listening on http://localhost:${PORT}`);
  if (hasClientBuild) {
    console.log(`  Serving the built frontend — open http://localhost:${PORT} in your browser`);
  } else {
    console.log(`  API ready on /api — the app UI runs on the frontend dev server:`);
    console.log(`  cd client && npm run dev  ->  http://localhost:3000`);
  }
  console.log(`  Demo login: noa@example.com / password\n`);
});

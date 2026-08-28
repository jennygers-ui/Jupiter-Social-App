# j. — Jupiter

A social network built as a Jenny Gershengoren final project for full-stack course.

**Stack:** React + Vite + TailwindCSS v4 on the frontend · Node.js + Express + Socket.IO with JWT auth and in-memory storage on the backend.

## Project structure

```
client/                 React + Vite frontend (standalone: has its own package.json)
  index.html            entry HTML (fonts, favicon, title)
  vite.config.js        React + Tailwind v4 plugins
  src/
    main.jsx            React bootstrap
    App.jsx             ALL components: Auth, Feed, People, Messages/Chat, Profile, Avatar
    api.js              client-side mirror of the REST API + real-time bus (BroadcastChannel)
    App.css             textures, motion system, component styles
    index.css           Tailwind v4 theme (Jupiter palette, Fraunces + DM Sans)

server/                 Express + Socket.IO backend (standalone: has its own package.json)
  server.js             HTTP server, Socket.IO rooms, JWT handshake, presence
  middleware/auth.js    JWT middleware for REST + socket handshake
  models/db.js          in-memory database with seeded demo data
  routes/
    auth.js             POST /api/auth/register, POST /api/auth/login
    users.js            GET /api/users/me, PATCH /api/users/me, GET /api/users/?search=
    friends.js          GET /api/friends/, GET /api/friends/requests, POST|PATCH|DELETE /api/friends/:id
    posts.js            GET|POST /api/posts/, DELETE /api/posts/:id, POST /api/posts/:id/like, GET|POST /api/posts/:id/comments
    messages.js         GET /api/messages/conversations, GET|POST /api/messages/:conversationId

index.html              root entry used by this workspace's build tool (points into client/src)
```

## Demo account

```
noa@example.com
password
```

(Other seeded users — Yoni, Tal, Omri, Shir, Eitan, Dana — use the password `password`. Try `yoni@example.com` in a second tab to chat live with Noa.)

## Feature map (matches the flowchart)

- **Auth flow** — Login/Register → validate → JWT stored in `localStorage` → main app
- **Main app** — sidebar navigation (Home / People / Messages / Profile) with content areas
- **Feed** — create posts (280 chars), like, comment, delete own posts
- **People** — search users, send / accept / decline / cancel friend requests, unfriend
- **Real-time chat** — select friend → open conversation → socket connection → message exchange, typing indicators, presence, unread badges
- **Profile** — edit name & bio, stats, your posts

## Run it

### Frontend (client/)

```bash
cd client
npm install
npm run dev     # http://localhost:3000
```

The frontend ships with an in-browser API layer (`client/src/api.js`) that mirrors the
Express routes one-to-one and persists to `localStorage`, so it runs fully
standalone. Real-time events travel over a `BroadcastChannel`
(the browser stand-in for Socket.IO) — open two tabs as two users and the chat
is live.

### Backend (server/)

```bash
cd server
npm install
npm run dev     # http://localhost:3001
```

### Socket.IO events

`message:send`, `message:new`, `typing`, `conversation:open`, `presence` — handshake with `{ auth: { token } }`.

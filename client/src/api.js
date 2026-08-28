/**
 * Jupiter — client-side API layer.
 *
 * This module mirrors the Express + Socket.IO backend in /server one-to-one
 * (same routes, same payload shapes) and runs entirely in the browser so the
 * app works as a static demo build. Data lives in memory and is persisted to
 * localStorage; real-time events travel over a BroadcastChannel, which plays
 * the role Socket.IO plays on the real server (open two tabs, log in as two
 * users, and chat live between them).
 *
 *   POST   /api/auth/register            -> api.register()
 *   POST   /api/auth/login               -> api.login()
 *   GET    /api/users/me                 -> api.me()
 *   PATCH  /api/users/me                 -> api.updateProfile()
 *   GET    /api/users/?search=           -> api.searchUsers()
 *   GET    /api/friends/                 -> api.getFriends()
 *   GET    /api/friends/requests         -> api.getRequests()
 *   POST   /api/friends/:id              -> api.sendRequest()
 *   DELETE /api/friends/:id              -> api.cancelRequest() / declineRequest() / removeFriend()
 *   PATCH  /api/friends/:id              -> api.acceptRequest()
 *   GET    /api/posts/                   -> api.getFeed()
 *   POST   /api/posts/                   -> api.createPost()
 *   DELETE /api/posts/:id                -> api.deletePost()
 *   POST   /api/posts/:id/like           -> api.toggleLike()
 *   GET    /api/posts/:id/comments       -> (included in feed payload)
 *   POST   /api/posts/:id/comments       -> api.addComment()
 *   GET    /api/messages/conversations   -> api.getConversations()
 *   GET    /api/messages/:convId         -> api.getMessages()
 *   POST   /api/messages/:convId         -> api.sendMessage()
 *   socket "typing"                      -> api.emitTyping()
 */

const DB_KEY = "jupiter-db-v5";
const MIN = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;

export const DEMO = { email: "noa@example.com", password: "password" };

let counter = 0;
function uid(prefix) {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/* ------------------------------ seed data ------------------------------ */

function seed() {
  const now = Date.now();
  const users = [
    { id: "u_maya", name: "Noa Levi", email: "noa@example.com", password: "password", bio: "Design student collecting small moments. Film photos, flat whites, long walks.", color: "coral", online: true, joined: now - 240 * DAY },
    { id: "u_jonas", name: "Yoni Katz", email: "yoni@example.com", password: "password", bio: "Architecture nerd. I sketch buildings I will never build.", color: "pine", online: true, joined: now - 300 * DAY },
    { id: "u_priya", name: "Tal Barak", email: "tal@example.com", password: "password", bio: "CS + cognitive science. Currently debugging a plant-watering bot.", color: "moss", online: true, joined: now - 190 * DAY },
    { id: "u_theo", name: "Omri Dahan", email: "omri@example.com", password: "password", bio: "Bass player in three bands. Finished one song.", color: "gold", online: false, joined: now - 150 * DAY },
    { id: "u_sofia", name: "Shir Mizrahi", email: "shir@example.com", password: "password", bio: "Journalism. Ask me about the campus radio revival.", color: "clay", online: true, joined: now - 90 * DAY },
    { id: "u_elias", name: "Eitan Roth", email: "eitan@example.com", password: "password", bio: "Physics PhD. Mostly here for the memes.", color: "slate", online: false, joined: now - 400 * DAY },
    { id: "u_june", name: "Dana Peretz", email: "dana@example.com", password: "password", bio: "Illustrator. Drawing the same fox for 90 days straight.", color: "moss", online: false, joined: now - 60 * DAY },
  ];

  const friendships = [
    { id: "f_1", from: "u_maya", to: "u_jonas", status: "accepted", at: now - 200 * DAY },
    { id: "f_2", from: "u_priya", to: "u_maya", status: "accepted", at: now - 160 * DAY },
    { id: "f_3", from: "u_maya", to: "u_theo", status: "accepted", at: now - 120 * DAY },
    { id: "f_4", from: "u_jonas", to: "u_priya", status: "accepted", at: now - 140 * DAY },
    { id: "f_5", from: "u_sofia", to: "u_maya", status: "pending", at: now - 2 * DAY },
    { id: "f_6", from: "u_maya", to: "u_elias", status: "pending", at: now - 3 * DAY },
  ];

  const posts = [
    {
      id: "p_1", userId: "u_jonas", createdAt: now - 2 * HOUR,
      text: "Finished the model for my pavilion project at 3am. The laser cutter and I are on speaking terms again.",
      likes: ["u_maya", "u_priya"],
      comments: [
        { id: "c_a1", userId: "u_priya", text: "the 3am club, congratulations", createdAt: now - 1.6 * HOUR },
        { id: "c_a2", userId: "u_maya", text: "photos or it didn't happen", createdAt: now - 1.2 * HOUR },
      ],
    },
    {
      id: "p_2", userId: "u_priya", createdAt: now - 5 * HOUR,
      text: "Day 12: the plant-bot watered the fern exactly on schedule. The fern remains unimpressed.",
      likes: ["u_maya", "u_jonas", "u_theo"],
      comments: [
        { id: "c_b1", userId: "u_jonas", text: "the fern is a critic", createdAt: now - 4 * HOUR },
      ],
    },
    {
      id: "p_3", userId: "u_maya", createdAt: now - 9 * HOUR,
      text: "Shot a roll of Portra on the way to campus. The light through the library stairs was ridiculous this morning.",
      likes: ["u_jonas", "u_priya", "u_theo"],
      comments: [
        { id: "c_c1", userId: "u_theo", text: "frame 12 is the one, trust me", createdAt: now - 8 * HOUR },
      ],
    },
    {
      id: "p_4", userId: "u_theo", createdAt: now - 1 * DAY - 3 * HOUR,
      text: "Band practice ran four hours because we kept arguing about one chord. Spoiler: it was the wrong chord.",
      likes: ["u_maya"],
      comments: [],
    },
    {
      id: "p_5", userId: "u_june", createdAt: now - 1 * DAY - 6 * HOUR,
      text: "Fox day 47. He has learned to sit. I have learned patience.",
      likes: ["u_maya", "u_jonas"],
      comments: [],
    },
    {
      id: "p_6", userId: "u_elias", createdAt: now - 2 * DAY - 4 * HOUR,
      text: "Reviewer 2 said my paper needs more citations. Fine. Adding all 47 of your statuses as sources.",
      likes: ["u_priya", "u_june"],
      comments: [],
    },
    {
      id: "p_7", userId: "u_jonas", createdAt: now - 2 * DAY - 9 * HOUR,
      text: "Concrete, plywood, and one very patient supervisor. Thesis semester, week one.",
      likes: ["u_maya", "u_priya"],
      comments: [],
    },
    {
      id: "p_8", userId: "u_priya", createdAt: now - 3 * DAY - 2 * HOUR,
      text: "Hot take: the best debugging tool is explaining your code to someone who doesn't code.",
      likes: ["u_maya", "u_jonas", "u_june"],
      comments: [
        { id: "c_d1", userId: "u_maya", text: "this is exactly why I call you", createdAt: now - 3 * DAY },
      ],
    },
  ];

  const conversations = [
    { id: "cv_mj", members: ["u_maya", "u_jonas"], lastMessageAt: now - 2 * HOUR + 12 * MIN, reads: { u_maya: now - 2 * HOUR + 13 * MIN, u_jonas: now - 3 * HOUR } },
    { id: "cv_mp", members: ["u_maya", "u_priya"], lastMessageAt: now - 40 * MIN, reads: { u_maya: now - 25 * HOUR, u_priya: now - 39 * MIN } },
    { id: "cv_mt", members: ["u_maya", "u_theo"], lastMessageAt: now - 3 * DAY + 6 * MIN, reads: { u_maya: now - 3 * DAY + 10 * MIN, u_theo: now - 3 * DAY + 8 * MIN } },
    { id: "cv_jp", members: ["u_jonas", "u_priya"], lastMessageAt: now - 6 * HOUR, reads: { u_jonas: now - 5 * HOUR, u_priya: now - 5.5 * HOUR } },
  ];

  const messages = [
    { id: "m_1", conversationId: "cv_mj", senderId: "u_jonas", text: "did you see the pavilion render?", createdAt: now - 3 * HOUR },
    { id: "m_2", conversationId: "cv_mj", senderId: "u_maya", text: "YES. the cantilever is insane", createdAt: now - 3 * HOUR + 2 * MIN },
    { id: "m_3", conversationId: "cv_mj", senderId: "u_jonas", text: "professor says it might not stand up. emotionally or physically", createdAt: now - 2 * HOUR + 8 * MIN },
    { id: "m_4", conversationId: "cv_mj", senderId: "u_maya", text: "both are fixable", createdAt: now - 2 * HOUR + 12 * MIN },
    { id: "m_5", conversationId: "cv_mp", senderId: "u_priya", text: "the bot watered the fern!!", createdAt: now - 26 * HOUR },
    { id: "m_6", conversationId: "cv_mp", senderId: "u_maya", text: "proud plant-parent moment", createdAt: now - 25 * HOUR },
    { id: "m_7", conversationId: "cv_mp", senderId: "u_priya", text: "lunch tomorrow? new ramen place by the library", createdAt: now - 40 * MIN },
    { id: "m_8", conversationId: "cv_mt", senderId: "u_theo", text: "sending you the demo track, be gentle", createdAt: now - 3 * DAY },
    { id: "m_9", conversationId: "cv_mt", senderId: "u_maya", text: "this is actually so good? that bass line", createdAt: now - 3 * DAY + 6 * MIN },
    { id: "m_10", conversationId: "cv_jp", senderId: "u_jonas", text: "study room 4 is free at noon", createdAt: now - 6 * HOUR },
  ];

  return { users, friendships, posts, conversations, messages };
}

/* --------------------------- storage + realtime --------------------------- */

// Safe wrappers: sandboxed iframes / private modes can throw on storage access.
export const storage = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* unavailable */ } },
  del(k) { try { localStorage.removeItem(k); } catch { /* unavailable */ } },
};

function load() {
  try {
    const raw = storage.get(DB_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* corrupted -> reseed */ }
  const fresh = seed();
  save(fresh);
  return fresh;
}

function save(next = db) {
  storage.set(DB_KEY, JSON.stringify(next));
}

let db = load();

const listeners = {};
let bc = null;
try {
  bc = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("jupiter-rt") : null;
} catch {
  bc = null; // opaque-origin sandbox — realtime falls back to same-tab only
}

export function subscribe(event, cb) {
  (listeners[event] ||= new Set()).add(cb);
  return () => listeners[event].delete(cb);
}

function emit(event, payload) {
  (listeners[event] && [...listeners[event]].forEach((cb) => cb(payload)));
  try { bc && bc.postMessage({ event, payload }); } catch { /* closed */ }
}

if (bc) {
  bc.onmessage = (e) => {
    db = load(); // another tab mutated the store — resync before notifying
    const { event, payload } = e.data || {};
    if (event) (listeners[event] && [...listeners[event]].forEach((cb) => cb(payload)));
  };
}

/* ------------------------------- internals ------------------------------- */

const wait = (ms = 200) => new Promise((r) => setTimeout(r, ms + Math.random() * 160));
const clone = (v) => JSON.parse(JSON.stringify(v));
const fail = (status, message) => Object.assign(new Error(message), { status });

function sign(user) {
  const body = btoa(JSON.stringify({ sub: user.id, iat: Date.now(), exp: Date.now() + 7 * DAY }));
  return `${body}.jupiter-dev-signature`;
}

function auth(token) {
  if (!token) throw fail(401, "Missing token");
  let body;
  try { body = JSON.parse(atob(token.split(".")[0])); } catch { throw fail(401, "Malformed token"); }
  if (body.exp < Date.now()) throw fail(401, "Session expired — log in again");
  const user = db.users.find((u) => u.id === body.sub);
  if (!user) throw fail(401, "Unknown user");
  return user;
}

const pub = (u) => ({ id: u.id, name: u.name, email: u.email, bio: u.bio, color: u.color, online: !!u.online, joined: u.joined });

function relation(meId, otherId) {
  const f = db.friendships.find(
    (f) => (f.from === meId && f.to === otherId) || (f.from === otherId && f.to === meId)
  );
  if (!f) return "none";
  if (f.status === "accepted") return "friends";
  return f.from === meId ? "outgoing" : "incoming";
}

function findConversation(a, b) {
  return db.conversations.find((c) => c.members.includes(a) && c.members.includes(b));
}

function ensureConversation(a, b) {
  let conv = findConversation(a, b);
  if (!conv) {
    conv = { id: uid("cv"), members: [a, b], lastMessageAt: Date.now(), reads: {} };
    db.conversations.push(conv);
  }
  return conv;
}

function enrichPost(post, meId) {
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

const POST_LIMIT = 280;
const BIO_LIMIT = 160;

/* --------------------------------- api --------------------------------- */

export const api = {
  /* ---- auth ---- */
  async register(name, email, password) {
    await wait(320);
    name = (name || "").trim();
    email = (email || "").trim().toLowerCase();
    if (name.length < 2) throw fail(422, "Name needs at least 2 characters");
    if (!/^\S+@\S+\.\S+$/.test(email)) throw fail(422, "That email doesn't look right");
    if ((password || "").length < 6) throw fail(422, "Password needs at least 6 characters");
    if (db.users.some((u) => u.email === email)) throw fail(409, "An account with this email already exists");
    const colors = ["pine", "moss", "coral", "gold", "clay", "slate"];
    const user = {
      id: uid("u"), name, email, password,
      bio: "", color: colors[name.length % colors.length],
      online: true, joined: Date.now(),
    };
    db.users.push(user);
    save();
    return { token: sign(user), user: pub(user) };
  },

  async login(email, password) {
    await wait(320);
    const user = db.users.find((u) => u.email === (email || "").trim().toLowerCase());
    if (!user || user.password !== password) throw fail(401, "Wrong email or password");
    return { token: sign(user), user: pub(user) };
  },

  /* ---- users ---- */
  async me(token) {
    await wait(140);
    return pub(auth(token));
  },

  async updateProfile(token, { name, bio }) {
    await wait(260);
    const me = auth(token);
    if (name !== undefined) {
      name = name.trim();
      if (name.length < 2) throw fail(422, "Name needs at least 2 characters");
      me.name = name;
    }
    if (bio !== undefined) {
      if (bio.length > BIO_LIMIT) throw fail(422, `Bio is limited to ${BIO_LIMIT} characters`);
      me.bio = bio.trim();
    }
    save();
    emit("feed");
    return pub(me);
  },

  async searchUsers(token, search = "") {
    await wait(200);
    const me = auth(token);
    const q = search.trim().toLowerCase();
    return db.users
      .filter((u) => u.id !== me.id)
      .filter((u) => !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
      .map((u) => ({ ...pub(u), relation: relation(me.id, u.id) }));
  },

  /* ---- friends ---- */
  async getFriends(token) {
    await wait(180);
    const me = auth(token);
    const ids = db.friendships
      .filter((f) => f.status === "accepted" && (f.from === me.id || f.to === me.id))
      .map((f) => (f.from === me.id ? f.to : f.from));
    return db.users.filter((u) => ids.includes(u.id)).map((u) => ({ ...pub(u), relation: "friends" }));
  },

  async getRequests(token) {
    await wait(180);
    const me = auth(token);
    const userOf = (id) => { const u = db.users.find((x) => x.id === id); return u && { ...pub(u), relation: relation(me.id, id) }; };
    return {
      incoming: db.friendships.filter((f) => f.status === "pending" && f.to === me.id).map((f) => userOf(f.from)).filter(Boolean),
      outgoing: db.friendships.filter((f) => f.status === "pending" && f.from === me.id).map((f) => userOf(f.to)).filter(Boolean),
    };
  },

  async sendRequest(token, userId) {
    await wait(240);
    const me = auth(token);
    if (userId === me.id) throw fail(422, "You already know yourself quite well");
    const rel = relation(me.id, userId);
    if (rel === "friends") throw fail(409, "Already friends");
    if (rel === "outgoing") throw fail(409, "Request already sent");
    if (rel === "incoming") {
      const f = db.friendships.find((f) => f.from === userId && f.to === me.id);
      f.status = "accepted";
      save(); emit("friends"); emit("feed");
      return { relation: "friends" };
    }
    db.friendships.push({ id: uid("f"), from: me.id, to: userId, status: "pending", at: Date.now() });
    save(); emit("friends");
    return { relation: "outgoing" };
  },

  async acceptRequest(token, userId) {
    await wait(240);
    const me = auth(token);
    const f = db.friendships.find((f) => f.from === userId && f.to === me.id && f.status === "pending");
    if (!f) throw fail(404, "Request not found");
    f.status = "accepted";
    ensureConversation(me.id, userId);
    save(); emit("friends"); emit("feed");
    return { relation: "friends" };
  },

  async declineRequest(token, userId) {
    await wait(200);
    const me = auth(token);
    db.friendships = db.friendships.filter(
      (f) => !(f.status === "pending" && f.from === userId && f.to === me.id)
    );
    save(); emit("friends");
    return { relation: "none" };
  },

  async cancelRequest(token, userId) {
    await wait(200);
    const me = auth(token);
    db.friendships = db.friendships.filter(
      (f) => !(f.status === "pending" && f.from === me.id && f.to === userId)
    );
    save(); emit("friends");
    return { relation: "none" };
  },

  async removeFriend(token, userId) {
    await wait(220);
    const me = auth(token);
    db.friendships = db.friendships.filter(
      (f) => !(f.status === "accepted" && ((f.from === me.id && f.to === userId) || (f.from === userId && f.to === me.id)))
    );
    save(); emit("friends"); emit("feed");
    return { relation: "none" };
  },

  /* ---- posts ---- */
  async getFeed(token) {
    await wait(240);
    const me = auth(token);
    const friendIds = db.friendships
      .filter((f) => f.status === "accepted" && (f.from === me.id || f.to === me.id))
      .map((f) => (f.from === me.id ? f.to : f.from));
    const visible = new Set([me.id, ...friendIds]);
    return db.posts
      .filter((p) => visible.has(p.userId))
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((p) => enrichPost(p, me.id));
  },

  async createPost(token, text) {
    await wait(280);
    const me = auth(token);
    text = (text || "").trim();
    if (!text) throw fail(422, "Write something first");
    if (text.length > POST_LIMIT) throw fail(422, `Posts are limited to ${POST_LIMIT} characters`);
    const post = { id: uid("p"), userId: me.id, text, createdAt: Date.now(), likes: [], comments: [] };
    db.posts.push(post);
    save(); emit("feed");
    return enrichPost(post, me.id);
  },

  async deletePost(token, postId) {
    await wait(220);
    const me = auth(token);
    const post = db.posts.find((p) => p.id === postId);
    if (!post) throw fail(404, "Post not found");
    if (post.userId !== me.id) throw fail(403, "You can only delete your own posts");
    db.posts = db.posts.filter((p) => p.id !== postId);
    save(); emit("feed");
    return { ok: true };
  },

  async toggleLike(token, postId) {
    await wait(160);
    const me = auth(token);
    const post = db.posts.find((p) => p.id === postId);
    if (!post) throw fail(404, "Post not found");
    const i = post.likes.indexOf(me.id);
    if (i >= 0) post.likes.splice(i, 1);
    else post.likes.push(me.id);
    save(); emit("feed");
    return { likes: post.likes.length, likedByMe: i < 0 };
  },

  async addComment(token, postId, text) {
    await wait(220);
    const me = auth(token);
    text = (text || "").trim();
    if (!text) throw fail(422, "Comment can't be empty");
    if (text.length > POST_LIMIT) throw fail(422, "Keep it under 280 characters");
    const post = db.posts.find((p) => p.id === postId);
    if (!post) throw fail(404, "Post not found");
    post.comments.push({ id: uid("c"), userId: me.id, text, createdAt: Date.now() });
    save(); emit("feed");
    return enrichPost(post, me.id);
  },

  /* ---- messages ---- */
  async getConversations(token) {
    await wait(200);
    const me = auth(token);
    const out = db.conversations
      .filter((c) => c.members.includes(me.id))
      .map((c) => {
        const otherId = c.members.find((m) => m !== me.id);
        const other = db.users.find((u) => u.id === otherId);
        const msgs = db.messages.filter((m) => m.conversationId === c.id);
        const last = msgs[msgs.length - 1] || null;
        const lastRead = c.reads[me.id] || 0;
        const unread = msgs.filter((m) => m.senderId !== me.id && m.createdAt > lastRead).length;
        return {
          id: c.id,
          user: other ? pub(other) : null,
          lastMessage: last ? { id: last.id, text: last.text, senderId: last.senderId, createdAt: last.createdAt } : null,
          unread,
        };
      })
      .sort((a, b) => (b.lastMessage?.createdAt || 0) - (a.lastMessage?.createdAt || 0));
    return out;
  },

  async getMessages(token, conversationId) {
    await wait(220);
    const me = auth(token);
    const conv = db.conversations.find((c) => c.id === conversationId);
    if (!conv || !conv.members.includes(me.id)) throw fail(404, "Conversation not found");
    return db.messages
      .filter((m) => m.conversationId === conversationId)
      .sort((a, b) => a.createdAt - b.createdAt)
      .map((m) => clone(m));
  },

  async sendMessage(token, conversationId, text) {
    await wait(160);
    const me = auth(token);
    text = (text || "").trim();
    if (!text) throw fail(422, "Message can't be empty");
    const conv = db.conversations.find((c) => c.id === conversationId);
    if (!conv || !conv.members.includes(me.id)) throw fail(404, "Conversation not found");
    const message = { id: uid("m"), conversationId, senderId: me.id, text, createdAt: Date.now() };
    db.messages.push(message);
    conv.lastMessageAt = message.createdAt;
    conv.reads[me.id] = message.createdAt;
    save();
    emit("message", { conversationId, message: clone(message) });
    return clone(message);
  },

  async startConversation(token, userId) {
    await wait(160);
    const me = auth(token);
    if (userId === me.id) throw fail(422, "That's just you");
    const conv = ensureConversation(me.id, userId);
    save();
    return conv.id;
  },

  async markRead(token, conversationId) {
    const me = auth(token);
    const conv = db.conversations.find((c) => c.id === conversationId);
    if (!conv) return { ok: true };
    conv.reads[me.id] = Date.now();
    save();
    emit("read", { conversationId, userId: me.id });
    return { ok: true };
  },

  async emitTyping(token, conversationId) {
    const me = auth(token);
    emit("typing", { conversationId, userId: me.id });
  },
};

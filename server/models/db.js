// Jupiter — in-memory data store (resets on server restart).
import bcrypt from "bcryptjs";

const MIN = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;

let counter = 0;
export function uid(prefix) {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

const hash = (pw) => bcrypt.hashSync(pw, 8);
const now = Date.now();

export const db = {
  users: [
    { id: "u_maya", name: "Noa Levi", email: "noa@example.com", password: hash("password"), bio: "Design student collecting small moments. Film photos, flat whites, long walks.", color: "coral", online: false, joined: now - 240 * DAY },
    { id: "u_jonas", name: "Yoni Katz", email: "yoni@example.com", password: hash("password"), bio: "Architecture nerd. I sketch buildings I will never build.", color: "pine", online: false, joined: now - 300 * DAY },
    { id: "u_priya", name: "Tal Barak", email: "tal@example.com", password: hash("password"), bio: "CS + cognitive science. Currently debugging a plant-watering bot.", color: "moss", online: false, joined: now - 190 * DAY },
    { id: "u_theo", name: "Omri Dahan", email: "omri@example.com", password: hash("password"), bio: "Bass player in three bands. Finished one song.", color: "gold", online: false, joined: now - 150 * DAY },
    { id: "u_sofia", name: "Shir Mizrahi", email: "shir@example.com", password: hash("password"), bio: "Journalism. Ask me about the campus radio revival.", color: "clay", online: false, joined: now - 90 * DAY },
    { id: "u_elias", name: "Eitan Roth", email: "eitan@example.com", password: hash("password"), bio: "Physics PhD. Mostly here for the memes.", color: "slate", online: false, joined: now - 400 * DAY },
    { id: "u_june", name: "Dana Peretz", email: "dana@example.com", password: hash("password"), bio: "Illustrator. Drawing the same fox for 90 days straight.", color: "moss", online: false, joined: now - 60 * DAY },
  ],

  friendships: [
    { id: "f_1", from: "u_maya", to: "u_jonas", status: "accepted", at: now - 200 * DAY },
    { id: "f_2", from: "u_priya", to: "u_maya", status: "accepted", at: now - 160 * DAY },
    { id: "f_3", from: "u_maya", to: "u_theo", status: "accepted", at: now - 120 * DAY },
    { id: "f_4", from: "u_jonas", to: "u_priya", status: "accepted", at: now - 140 * DAY },
    { id: "f_5", from: "u_sofia", to: "u_maya", status: "pending", at: now - 2 * DAY },
    { id: "f_6", from: "u_maya", to: "u_elias", status: "pending", at: now - 3 * DAY },
  ],

  posts: [
    { id: "p_1", userId: "u_jonas", createdAt: now - 2 * HOUR, text: "Finished the model for my pavilion project at 3am. The laser cutter and I are on speaking terms again.", likes: ["u_maya", "u_priya"], comments: [
      { id: "c_a1", userId: "u_priya", text: "the 3am club, congratulations", createdAt: now - 1.6 * HOUR },
      { id: "c_a2", userId: "u_maya", text: "photos or it didn't happen", createdAt: now - 1.2 * HOUR },
    ] },
    { id: "p_2", userId: "u_priya", createdAt: now - 5 * HOUR, text: "Day 12: the plant-bot watered the fern exactly on schedule. The fern remains unimpressed.", likes: ["u_maya", "u_jonas", "u_theo"], comments: [
      { id: "c_b1", userId: "u_jonas", text: "the fern is a critic", createdAt: now - 4 * HOUR },
    ] },
    { id: "p_3", userId: "u_maya", createdAt: now - 9 * HOUR, text: "Shot a roll of Portra on the way to campus. The light through the library stairs was ridiculous this morning.", likes: ["u_jonas", "u_priya", "u_theo"], comments: [
      { id: "c_c1", userId: "u_theo", text: "frame 12 is the one, trust me", createdAt: now - 8 * HOUR },
    ] },
    { id: "p_4", userId: "u_theo", createdAt: now - DAY - 3 * HOUR, text: "Band practice ran four hours because we kept arguing about one chord. Spoiler: it was the wrong chord.", likes: ["u_maya"], comments: [] },
    { id: "p_5", userId: "u_june", createdAt: now - DAY - 6 * HOUR, text: "Fox day 47. He has learned to sit. I have learned patience.", likes: ["u_maya", "u_jonas"], comments: [] },
    { id: "p_6", userId: "u_elias", createdAt: now - 2 * DAY - 4 * HOUR, text: "Reviewer 2 said my paper needs more citations. Fine. Adding all 47 of your statuses as sources.", likes: ["u_priya", "u_june"], comments: [] },
    { id: "p_7", userId: "u_jonas", createdAt: now - 2 * DAY - 9 * HOUR, text: "Concrete, plywood, and one very patient supervisor. Thesis semester, week one.", likes: ["u_maya", "u_priya"], comments: [] },
    { id: "p_8", userId: "u_priya", createdAt: now - 3 * DAY - 2 * HOUR, text: "Hot take: the best debugging tool is explaining your code to someone who doesn't code.", likes: ["u_maya", "u_jonas", "u_june"], comments: [
      { id: "c_d1", userId: "u_maya", text: "this is exactly why I call you", createdAt: now - 3 * DAY },
    ] },
  ],

  conversations: [
    { id: "cv_mj", members: ["u_maya", "u_jonas"], lastMessageAt: now - 2 * HOUR + 12 * MIN, reads: { u_maya: now - 2 * HOUR + 13 * MIN, u_jonas: now - 3 * HOUR } },
    { id: "cv_mp", members: ["u_maya", "u_priya"], lastMessageAt: now - 40 * MIN, reads: { u_maya: now - 25 * HOUR, u_priya: now - 39 * MIN } },
    { id: "cv_mt", members: ["u_maya", "u_theo"], lastMessageAt: now - 3 * DAY + 6 * MIN, reads: { u_maya: now - 3 * DAY + 10 * MIN, u_theo: now - 3 * DAY + 8 * MIN } },
    { id: "cv_jp", members: ["u_jonas", "u_priya"], lastMessageAt: now - 6 * HOUR, reads: { u_jonas: now - 5 * HOUR, u_priya: now - 5.5 * HOUR } },
  ],

  messages: [
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
  ],
};

/* ------------------------------ helpers ------------------------------ */

export const pub = (u) => ({
  id: u.id, name: u.name, email: u.email, bio: u.bio,
  color: u.color, online: !!u.online, joined: u.joined,
});

export function relation(meId, otherId) {
  const f = db.friendships.find(
    (f) => (f.from === meId && f.to === otherId) || (f.from === otherId && f.to === meId)
  );
  if (!f) return "none";
  if (f.status === "accepted") return "friends";
  return f.from === meId ? "outgoing" : "incoming";
}

export function findConversation(a, b) {
  return db.conversations.find((c) => c.members.includes(a) && c.members.includes(b));
}

export function ensureConversation(a, b) {
  let conv = findConversation(a, b);
  if (!conv) {
    conv = { id: uid("cv"), members: [a, b], lastMessageAt: Date.now(), reads: {} };
    db.conversations.push(conv);
  }
  return conv;
}

export const POST_LIMIT = 280;
export const BIO_LIMIT = 160;

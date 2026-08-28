import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db, pub, uid } from "../models/db.js";
import { JWT_SECRET } from "../middleware/auth.js";

const router = Router();
const sign = (user) => jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: "7d" });

// POST /api/auth/register
router.post("/register", (req, res) => {
  const name = (req.body.name || "").trim();
  const email = (req.body.email || "").trim().toLowerCase();
  const password = req.body.password || "";

  if (name.length < 2) return res.status(422).json({ error: "Name needs at least 2 characters" });
  if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(422).json({ error: "That email doesn't look right" });
  if (password.length < 6) return res.status(422).json({ error: "Password needs at least 6 characters" });
  if (db.users.some((u) => u.email === email))
    return res.status(409).json({ error: "An account with this email already exists" });

  const colors = ["pine", "moss", "coral", "gold", "clay", "slate"];
  const user = {
    id: uid("u"), name, email,
    password: bcrypt.hashSync(password, 8),
    bio: "", color: colors[name.length % colors.length],
    online: false, joined: Date.now(),
  };
  db.users.push(user);
  res.status(201).json({ token: sign(user), user: pub(user) });
});

// POST /api/auth/login
router.post("/login", (req, res) => {
  const email = (req.body.email || "").trim().toLowerCase();
  const user = db.users.find((u) => u.email === email);
  if (!user || !bcrypt.compareSync(req.body.password || "", user.password))
    return res.status(401).json({ error: "Wrong email or password" });
  res.json({ token: sign(user), user: pub(user) });
});

export default router;

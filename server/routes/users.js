import { Router } from "express";
import { db, pub, relation, BIO_LIMIT } from "../models/db.js";
import { auth } from "../middleware/auth.js";

const router = Router();

// GET /api/users/me
router.get("/me", auth, (req, res) => {
  res.json(pub(req.user));
});

// PATCH /api/users/me  — update name / bio
router.patch("/me", auth, (req, res) => {
  const { name, bio } = req.body || {};
  if (name !== undefined) {
    const trimmed = String(name).trim();
    if (trimmed.length < 2) return res.status(422).json({ error: "Name needs at least 2 characters" });
    req.user.name = trimmed;
  }
  if (bio !== undefined) {
    if (String(bio).length > BIO_LIMIT)
      return res.status(422).json({ error: `Bio is limited to ${BIO_LIMIT} characters` });
    req.user.bio = String(bio).trim();
  }
  res.json(pub(req.user));
});

// GET /api/users/?search=
router.get("/", auth, (req, res) => {
  const q = (req.query.search || "").trim().toLowerCase();
  const users = db.users
    .filter((u) => u.id !== req.user.id)
    .filter((u) => !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
    .map((u) => ({ ...pub(u), relation: relation(req.user.id, u.id) }));
  res.json(users);
});

export default router;

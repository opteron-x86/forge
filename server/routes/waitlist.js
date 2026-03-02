// ═══════════════════════════════════════════════════════════════
//  TALOS — Waitlist Routes
//  POST /api/waitlist        — public signup
//  GET  /api/waitlist        — admin: list all signups
//  GET  /api/waitlist/count  — public: total signups (for social proof)
// ═══════════════════════════════════════════════════════════════

import { Router } from "express";
import { getDb } from "../db.js";
import { requireAuth, requireAdmin, handler } from "../middleware.js";

const router = Router();

// ===================== PUBLIC: JOIN WAITLIST =====================

router.post("/", handler(async (req, res) => {
  const db = getDb();
  const { email } = req.body;

  if (!email || typeof email !== "string") {
    return res.status(400).json({ error: "Email is required" });
  }

  const normalized = email.trim().toLowerCase();

  // Basic email format check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  // Check for existing signup
  const existing = await db.get(
    "SELECT id FROM waitlist WHERE email = $1",
    [normalized]
  );

  if (existing) {
    // Don't reveal whether email exists — just return success
    return res.json({ ok: true, message: "You're on the list." });
  }

  // Capture referral source from query param or body
  const source = req.body.source || req.query.ref || null;

  await db.run(
    "INSERT INTO waitlist (id, email, source) VALUES ($1, $2, $3)",
    [crypto.randomUUID(), normalized, source]
  );

  res.json({ ok: true, message: "You're on the list." });
}));

// ===================== PUBLIC: SIGNUP COUNT =====================

router.get("/count", handler(async (req, res) => {
  const db = getDb();
  const row = await db.get("SELECT COUNT(*) as count FROM waitlist");
  res.json({ count: row.count });
}));

// ===================== ADMIN: LIST SIGNUPS =====================

router.get("/", requireAuth, requireAdmin, handler(async (req, res) => {
  const db = getDb();
  const signups = await db.all(
    "SELECT id, email, source, created_at FROM waitlist ORDER BY created_at DESC"
  );
  res.json(signups);
}));

export default router;
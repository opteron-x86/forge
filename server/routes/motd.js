// ═══════════════════════════════════════════════════════════════
//  TALOS — MOTD (Message of the Day) Routes
//  GET  /api/motd          — current MOTD + dismissed status
//  POST /api/motd/dismiss  — dismiss current MOTD
//  PUT  /api/motd          — set MOTD (admin)
//  DELETE /api/motd        — clear MOTD (admin)
// ═══════════════════════════════════════════════════════════════

import { Router } from "express";
import crypto from "crypto";
import { getDb } from "../db.js";
import { requireAuth, requireAdmin, handler } from "../middleware.js";

const router = Router();

// ─── User-facing ─────────────────────────────────────────────

// Get current MOTD + whether this user dismissed it
router.get("/", requireAuth, handler(async (req, res) => {
  const db = getDb();

  const textRow  = await db.get("SELECT value FROM ai_config WHERE key = 'motd_text'");
  const idRow    = await db.get("SELECT value FROM ai_config WHERE key = 'motd_id'");
  const atRow    = await db.get("SELECT value FROM ai_config WHERE key = 'motd_updated_at'");

  if (!textRow?.value) {
    return res.json({ active: false, text: null, id: null, updatedAt: null, dismissed: true });
  }

  const motdId = idRow?.value || null;
  const profile = await db.get(
    "SELECT motd_dismissed_id FROM profiles WHERE user_id = $1",
    [req.user.id]
  );
  const dismissed = profile?.motd_dismissed_id === motdId;

  res.json({
    active: true,
    text: textRow.value,
    id: motdId,
    updatedAt: atRow?.value || null,
    dismissed,
  });
}));

// Dismiss current MOTD
router.post("/dismiss", requireAuth, handler(async (req, res) => {
  const db = getDb();
  const idRow = await db.get("SELECT value FROM ai_config WHERE key = 'motd_id'");
  if (!idRow?.value) return res.json({ ok: true });

  await db.run(
    "UPDATE profiles SET motd_dismissed_id = $1 WHERE user_id = $2",
    [idRow.value, req.user.id]
  );
  res.json({ ok: true });
}));

// ─── Admin ───────────────────────────────────────────────────

// Set / update MOTD
router.put("/", requireAuth, requireAdmin, handler(async (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: "MOTD text required" });
  }

  const db = getDb();
  const motdId = crypto.randomBytes(8).toString("hex");
  const now = new Date().toISOString();

  const upsert = "INSERT INTO ai_config (key, value) VALUES ($1, $2) ON CONFLICT(key) DO UPDATE SET value = EXCLUDED.value";
  await db.run(upsert, ["motd_text", text.trim()]);
  await db.run(upsert, ["motd_id", motdId]);
  await db.run(upsert, ["motd_updated_at", now]);

  res.json({ ok: true, id: motdId, updatedAt: now });
}));

// Clear MOTD
router.delete("/", requireAuth, requireAdmin, handler(async (req, res) => {
  const db = getDb();
  await db.run("DELETE FROM ai_config WHERE key IN ('motd_text', 'motd_id', 'motd_updated_at')");
  res.json({ ok: true });
}));

export default router;
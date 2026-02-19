// ═══════════════════════════════════════════════════════════════
//  TALOS — Program Routes
//  GET/POST/PUT/DELETE /api/programs, POST /api/programs/:id/adopt
// ═══════════════════════════════════════════════════════════════

import { Router } from "express";
import db from "../db.js";
import { genId, trackEvent } from "../db.js";
import { requireAuth, handler } from "../middleware.js";

const router = Router();

router.get("/", requireAuth, handler((req, res) => {
  const own = db.prepare("SELECT * FROM programs WHERE user_id = ? ORDER BY created_at DESC").all(req.user.id);
  const shared = db.prepare("SELECT * FROM programs WHERE shared = 1 AND user_id != ? ORDER BY created_at DESC").all(req.user.id);
  const all = [...own, ...shared].map(p => ({ ...p, days: JSON.parse(p.days) }));
  res.json(all);
}));

router.post("/", requireAuth, handler((req, res) => {
  const { name, description, days, shared, forked_from } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: "Program name required" });
  const id = genId();
  db.prepare(
    "INSERT INTO programs (id, user_id, name, description, days, shared, forked_from) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(id, req.user.id, name.trim(), description || "", JSON.stringify(days || []), shared ? 1 : 0, forked_from || null);
  trackEvent(req.user.id, "program_created", { name: name.trim() });
  res.json({ ok: true, id });
}));

router.put("/:id", requireAuth, handler((req, res) => {
  const { name, description, days, shared } = req.body;
  const existing = db.prepare("SELECT id FROM programs WHERE id = ? AND user_id = ?").get(req.params.id, req.user.id);
  if (!existing) return res.status(404).json({ error: "Program not found" });
  db.prepare(
    "UPDATE programs SET name = ?, description = ?, days = ?, shared = ? WHERE id = ? AND user_id = ?"
  ).run(name, description || "", JSON.stringify(days || []), shared ? 1 : 0, req.params.id, req.user.id);
  res.json({ ok: true });
}));

router.delete("/:id", requireAuth, handler((req, res) => {
  db.prepare("DELETE FROM programs WHERE id = ? AND user_id = ?").run(req.params.id, req.user.id);
  res.json({ ok: true });
}));

// Adopt (fork) a shared program
router.post("/:id/adopt", requireAuth, handler((req, res) => {
  const source = db.prepare("SELECT * FROM programs WHERE id = ? AND shared = 1").get(req.params.id);
  if (!source) return res.status(404).json({ error: "Program not found or not shared" });
  const newId = genId();
  db.prepare(
    "INSERT INTO programs (id, user_id, name, description, days, shared, forked_from) VALUES (?, ?, ?, ?, ?, 0, ?)"
  ).run(newId, req.user.id, source.name, source.description, source.days, source.id);
  trackEvent(req.user.id, "program_adopted", { source_id: source.id, name: source.name });
  res.json({ ok: true, id: newId });
}));

export default router;

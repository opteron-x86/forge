// ═══════════════════════════════════════════════════════════════
//  TALOS — Program Routes
//  GET/POST/PUT/DELETE /api/programs, POST /api/programs/:id/adopt
// ═══════════════════════════════════════════════════════════════

import { Router } from "express";
import { getDb, genId, trackEvent } from "../db.js";
import { requireAuth, handler } from "../middleware.js";

const router = Router();

router.get("/", requireAuth, handler(async (req, res) => {
  const db = getDb();
  const own = await db.all(
    "SELECT * FROM programs WHERE user_id = $1 ORDER BY created_at DESC", [req.user.id]
  );
  const shared = await db.all(
    "SELECT * FROM programs WHERE shared = TRUE AND user_id != $1 ORDER BY created_at DESC", [req.user.id]
  );
  const all = [...own, ...shared].map(p => ({
    ...p,
    days: typeof p.days === "string" ? JSON.parse(p.days) : p.days,
  }));
  res.json(all);
}));

router.post("/", requireAuth, handler(async (req, res) => {
  const db = getDb();
  const { name, description, days, shared, forked_from } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: "Program name required" });
  const id = genId();
  await db.run(
    "INSERT INTO programs (id, user_id, name, description, days, shared, forked_from) VALUES ($1, $2, $3, $4, $5, $6, $7)",
    [id, req.user.id, name.trim(), description || "", JSON.stringify(days || []), !!shared, forked_from || null]
  );
  trackEvent(req.user.id, "program_created", { name: name.trim() });
  res.json({ ok: true, id });
}));

router.put("/:id", requireAuth, handler(async (req, res) => {
  const db = getDb();
  const { name, description, days, shared } = req.body;
  const existing = await db.get(
    "SELECT id FROM programs WHERE id = $1 AND user_id = $2", [req.params.id, req.user.id]
  );
  if (!existing) return res.status(404).json({ error: "Program not found" });
  await db.run(
    "UPDATE programs SET name = $1, description = $2, days = $3, shared = $4 WHERE id = $5 AND user_id = $6",
    [name, description || "", JSON.stringify(days || []), !!shared, req.params.id, req.user.id]
  );
  res.json({ ok: true });
}));

router.delete("/:id", requireAuth, handler(async (req, res) => {
  const db = getDb();
  await db.run("DELETE FROM programs WHERE id = $1 AND user_id = $2", [req.params.id, req.user.id]);
  res.json({ ok: true });
}));

// Adopt (fork) a shared program
router.post("/:id/adopt", requireAuth, handler(async (req, res) => {
  const db = getDb();
  const source = await db.get(
    "SELECT * FROM programs WHERE id = $1 AND shared = TRUE", [req.params.id]
  );
  if (!source) return res.status(404).json({ error: "Program not found or not shared" });
  const newId = genId();
  await db.run(
    "INSERT INTO programs (id, user_id, name, description, days, shared, forked_from) VALUES ($1, $2, $3, $4, $5, FALSE, $6)",
    [newId, req.user.id, source.name, source.description, source.days, source.id]
  );
  trackEvent(req.user.id, "program_adopted", { source_id: source.id, name: source.name });
  res.json({ ok: true, id: newId });
}));

export default router;

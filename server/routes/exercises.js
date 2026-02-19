// ═══════════════════════════════════════════════════════════════
//  TALOS — Exercise Routes
//  GET /api/exercises, POST /api/exercises, DELETE /api/exercises/:id
// ═══════════════════════════════════════════════════════════════

import { Router } from "express";
import db from "../db.js";
import { genId } from "../db.js";
import { requireAuth, handler } from "../middleware.js";

const router = Router();

// Get all custom exercises
router.get("/", requireAuth, handler((req, res) => {
  const exercises = db.prepare("SELECT * FROM custom_exercises ORDER BY name ASC").all();
  res.json(exercises);
}));

// Create custom exercise
router.post("/", requireAuth, handler((req, res) => {
  const { name, muscle, equipment, type } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: "Exercise name required" });
  const id = genId();
  try {
    db.prepare(
      "INSERT INTO custom_exercises (id, name, muscle, equipment, type, created_by) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(id, name.trim(), muscle || "other", equipment || "other", type || "isolation", req.user.id);
    res.json({ ok: true, id });
  } catch (e) {
    if (e.message.includes("UNIQUE")) return res.status(409).json({ error: "Exercise already exists" });
    throw e;
  }
}));

// Delete custom exercise — S8 fix: only creator or admin
router.delete("/:id", requireAuth, handler((req, res) => {
  const exercise = db.prepare("SELECT id, created_by FROM custom_exercises WHERE id = ?").get(req.params.id);
  if (!exercise) return res.status(404).json({ error: "Exercise not found" });
  if (exercise.created_by !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({ error: "You can only delete exercises you created" });
  }
  db.prepare("DELETE FROM custom_exercises WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
}));

export default router;

// ═══════════════════════════════════════════════════════════════
//  TALOS — Exercise Routes
//  GET /api/exercises, POST /api/exercises, DELETE /api/exercises/:id
// ═══════════════════════════════════════════════════════════════

import { Router } from "express";
import { getDb, genId } from "../db.js";
import { requireAuth, handler } from "../middleware.js";

const router = Router();

// Get all custom exercises
router.get("/", requireAuth, handler(async (req, res) => {
  const db = getDb();
  const exercises = await db.all("SELECT * FROM custom_exercises ORDER BY name ASC");
  res.json(exercises);
}));

// Create custom exercise
router.post("/", requireAuth, handler(async (req, res) => {
  const db = getDb();
  const { name, muscle, equipment, type } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: "Exercise name required" });
  const id = genId();
  try {
    await db.run(
      "INSERT INTO custom_exercises (id, name, muscle, equipment, type, created_by) VALUES ($1, $2, $3, $4, $5, $6)",
      [id, name.trim(), muscle || "other", equipment || "other", type || "isolation", req.user.id]
    );
    res.json({ ok: true, id });
  } catch (e) {
    if (e.message.includes("UNIQUE") || e.message.includes("unique") || e.message.includes("duplicate")) {
      return res.status(409).json({ error: "Exercise already exists" });
    }
    throw e;
  }
}));

// Delete custom exercise — S8 fix: only creator or admin
router.delete("/:id", requireAuth, handler(async (req, res) => {
  const db = getDb();
  const exercise = await db.get(
    "SELECT id, created_by FROM custom_exercises WHERE id = $1", [req.params.id]
  );
  if (!exercise) return res.status(404).json({ error: "Exercise not found" });
  if (exercise.created_by !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({ error: "You can only delete exercises you created" });
  }
  await db.run("DELETE FROM custom_exercises WHERE id = $1", [req.params.id]);
  res.json({ ok: true });
}));

export default router;

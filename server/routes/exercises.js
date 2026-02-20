// ═══════════════════════════════════════════════════════════════
//  TALOS — Exercise Routes (v2 — Full Library from Database)
//
//  Replaces the original custom-exercises-only route with a
//  full exercise catalog served from the exercises table.
//
//  GET /api/exercises          — full catalog (builtin + free-exercise-db + custom)
//  GET /api/exercises/subs     — substitution map
//  POST /api/exercises         — create custom exercise
//  DELETE /api/exercises/:id   — delete custom exercise (creator or admin)
// ═══════════════════════════════════════════════════════════════

import { Router } from "express";
import { getDb, genId } from "../db.js";
import { requireAuth, handler } from "../middleware.js";

const router = Router();

// ─── GET FULL EXERCISE CATALOG ──────────────────────────────────
// Returns all exercises (built-in, free-exercise-db imports, and custom).
// Supports filtering by muscle, equipment, type, source.
// Response is aggressively cached (exercises rarely change mid-session).
router.get("/", requireAuth, handler(async (req, res) => {
  const db = getDb();
  const { muscle, equipment, type, source, search, full } = req.query;

  let query = "SELECT * FROM exercises";
  const conditions = [];
  const params = [];
  let paramIdx = 1;

  if (muscle) {
    conditions.push(`muscle = $${paramIdx++}`);
    params.push(muscle);
  }
  if (equipment) {
    conditions.push(`equipment = $${paramIdx++}`);
    params.push(equipment);
  }
  if (type) {
    conditions.push(`type = $${paramIdx++}`);
    params.push(type);
  }
  if (source) {
    conditions.push(`source = $${paramIdx++}`);
    params.push(source);
  }
  if (search) {
    conditions.push(`LOWER(name) LIKE $${paramIdx++}`);
    params.push(`%${search.toLowerCase()}%`);
  }

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }
  query += " ORDER BY name ASC";

  const exercises = await db.all(query, params);

  // Parse JSONB fields if they come back as strings (SQLite compat)
  const parsed = exercises.map(e => ({
    ...e,
    primary_muscles: typeof e.primary_muscles === "string" ? JSON.parse(e.primary_muscles) : e.primary_muscles,
    secondary_muscles: typeof e.secondary_muscles === "string" ? JSON.parse(e.secondary_muscles) : e.secondary_muscles,
    images: typeof e.images === "string" ? JSON.parse(e.images) : e.images,
  }));

  // If `full` query param is not set, return slim response for exercise picker
  // (name, muscle, equipment, type only — smaller payload for mobile)
  if (!full) {
    const slim = parsed.map(e => ({
      name: e.name,
      muscle: e.muscle,
      equipment: e.equipment,
      type: e.type,
      source: e.source,
    }));
    res.set("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
    return res.json(slim);
  }

  res.set("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
  res.json(parsed);
}));

// ─── GET SUBSTITUTION MAP ───────────────────────────────────────
// Returns substitutions grouped by exercise name, ordered by rank.
router.get("/subs", requireAuth, handler(async (req, res) => {
  const db = getDb();
  const rows = await db.all(
    "SELECT exercise_name, substitute_name, rank FROM exercise_substitutions ORDER BY exercise_name, rank ASC"
  );

  // Group into map format: { "Bench Press": ["DB Bench Press", ...] }
  const map = {};
  for (const row of rows) {
    if (!map[row.exercise_name]) map[row.exercise_name] = [];
    map[row.exercise_name].push(row.substitute_name);
  }

  res.set("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
  res.json(map);
}));

// ─── GET EXERCISE DETAIL ────────────────────────────────────────
// Returns full detail for a single exercise (for exercise info modal).
router.get("/:id", requireAuth, handler(async (req, res) => {
  const db = getDb();
  const exercise = await db.get("SELECT * FROM exercises WHERE id = $1", [req.params.id]);
  if (!exercise) return res.status(404).json({ error: "Exercise not found" });

  // Parse JSONB fields
  exercise.primary_muscles = typeof exercise.primary_muscles === "string" ? JSON.parse(exercise.primary_muscles) : exercise.primary_muscles;
  exercise.secondary_muscles = typeof exercise.secondary_muscles === "string" ? JSON.parse(exercise.secondary_muscles) : exercise.secondary_muscles;
  exercise.images = typeof exercise.images === "string" ? JSON.parse(exercise.images) : exercise.images;

  // Get substitutions for this exercise
  const subs = await db.all(
    "SELECT substitute_name, rank FROM exercise_substitutions WHERE exercise_name = $1 ORDER BY rank ASC",
    [exercise.name]
  );
  exercise.substitutions = subs.map(s => s.substitute_name);

  res.json(exercise);
}));

// ─── CREATE CUSTOM EXERCISE ─────────────────────────────────────
router.post("/", requireAuth, handler(async (req, res) => {
  const db = getDb();
  const { name, muscle, equipment, type } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: "Exercise name required" });

  const id = genId();
  try {
    await db.run(
      `INSERT INTO exercises (id, name, muscle, equipment, type, source, created_by)
       VALUES ($1, $2, $3, $4, $5, 'custom', $6)`,
      [id, name.trim(), muscle || "other", equipment || "other", type || "isolation", req.user.id]
    );

    // Also insert into legacy custom_exercises for backward compat during transition
    try {
      await db.run(
        "INSERT INTO custom_exercises (id, name, muscle, equipment, type, created_by) VALUES ($1, $2, $3, $4, $5, $6)",
        [id, name.trim(), muscle || "other", equipment || "other", type || "isolation", req.user.id]
      );
    } catch (e) { /* legacy table may not exist or exercise already there */ }

    res.json({ ok: true, id });
  } catch (e) {
    if (e.message.includes("UNIQUE") || e.message.includes("unique") || e.message.includes("duplicate")) {
      return res.status(409).json({ error: "Exercise already exists" });
    }
    throw e;
  }
}));

// ─── DELETE CUSTOM EXERCISE ─────────────────────────────────────
// Only creator or admin can delete, and only custom exercises.
router.delete("/:id", requireAuth, handler(async (req, res) => {
  const db = getDb();
  const exercise = await db.get(
    "SELECT id, created_by, source FROM exercises WHERE id = $1", [req.params.id]
  );
  if (!exercise) return res.status(404).json({ error: "Exercise not found" });
  if (exercise.source !== "custom") {
    return res.status(403).json({ error: "Can only delete custom exercises" });
  }
  if (exercise.created_by !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({ error: "You can only delete exercises you created" });
  }

  await db.run("DELETE FROM exercises WHERE id = $1", [req.params.id]);

  // Also remove from legacy table
  try {
    await db.run("DELETE FROM custom_exercises WHERE id = $1", [req.params.id]);
  } catch (e) { /* legacy table may not exist */ }

  res.json({ ok: true });
}));

export default router;
// ═══════════════════════════════════════════════════════════════
//  TALOS — Workout Routes
//  GET/POST/PUT/DELETE /api/workouts, GET/POST/DELETE /api/workout-reviews
// ═══════════════════════════════════════════════════════════════

import { Router } from "express";
import { getDb, genId, trackEvent } from "../db.js";
import { requireAuth, handler } from "../middleware.js";

const router = Router();

// ===================== WORKOUTS =====================

router.get("/", requireAuth, handler(async (req, res) => {
  const db = getDb();
  const rows = await db.all(
    "SELECT * FROM workouts WHERE user_id = $1 ORDER BY date ASC, created_at ASC",
    [req.user.id]
  );
  res.json(rows.map(r => ({
    ...r,
    exercises: typeof r.exercises === "string" ? JSON.parse(r.exercises) : r.exercises,
  })));
}));

router.post("/", requireAuth, handler(async (req, res) => {
  const db = getDb();
  const { id, date, program_id, day_id, day_label, feel, sleepHours, duration, notes, exercises, finished_at } = req.body;
  await db.run(
    `INSERT INTO workouts (id, user_id, date, program_id, day_id, day_label, feel, sleep_hours, duration, notes, exercises, finished_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
    [
      id || genId(), req.user.id, date, program_id || null, day_id || null,
      day_label || null, feel || 3, sleepHours || null, duration || null,
      notes || "", JSON.stringify(exercises), finished_at || null,
    ]
  );

  const exArr = Array.isArray(exercises) ? exercises : [];
  trackEvent(req.user.id, "workout_completed", {
    day_label: day_label || "Freestyle",
    exercises: exArr.length,
    sets: exArr.reduce((sum, e) => sum + (e.sets?.length || 0), 0),
    duration: duration || null,
  });
  res.json({ ok: true });
}));

router.put("/:id", requireAuth, handler(async (req, res) => {
  const db = getDb();
  const { date, program_id, day_id, day_label, feel, sleepHours, duration, notes, exercises, finished_at } = req.body;
  const existing = await db.get(
    "SELECT id FROM workouts WHERE id = $1 AND user_id = $2", [req.params.id, req.user.id]
  );
  if (!existing) return res.status(404).json({ error: "Workout not found" });
  await db.run(
    `UPDATE workouts SET date = $1, program_id = $2, day_id = $3, day_label = $4,
     feel = $5, sleep_hours = $6, duration = $7, notes = $8, exercises = $9,
     finished_at = $10
     WHERE id = $11 AND user_id = $12`,
    [
      date, program_id || null, day_id || null, day_label || null,
      feel || 3, sleepHours || null, duration || null, notes || "",
      JSON.stringify(exercises), finished_at || null,
      req.params.id, req.user.id,
    ]
  );
  res.json({ ok: true });
}));

router.delete("/:id", requireAuth, handler(async (req, res) => {
  const db = getDb();
  await db.run("DELETE FROM workout_reviews WHERE workout_id = $1 AND user_id = $2", [req.params.id, req.user.id]);
  await db.run("DELETE FROM workouts WHERE id = $1 AND user_id = $2", [req.params.id, req.user.id]);
  res.json({ ok: true });
}));

export default router;

// ===================== WORKOUT REVIEWS =====================
// Exported as a separate router — mounted at /api/workout-reviews

export const reviewRouter = Router();

reviewRouter.get("/", requireAuth, handler(async (req, res) => {
  const db = getDb();
  const { workout_id } = req.query;
  if (workout_id) {
    const review = await db.get(
      "SELECT * FROM workout_reviews WHERE workout_id = $1 AND user_id = $2", [workout_id, req.user.id]
    );
    return res.json(review || null);
  }
  const reviews = await db.all("SELECT * FROM workout_reviews WHERE user_id = $1", [req.user.id]);
  return res.json(reviews);
}));

reviewRouter.post("/", requireAuth, handler(async (req, res) => {
  const db = getDb();
  const { id, workout_id, review } = req.body;
  if (!workout_id || !review) return res.status(400).json({ error: "workout_id and review required" });
  const reviewId = id || genId();
  await db.run(
    `INSERT INTO workout_reviews (id, workout_id, user_id, review) VALUES ($1, $2, $3, $4)
     ON CONFLICT (id) DO UPDATE SET workout_id = EXCLUDED.workout_id, user_id = EXCLUDED.user_id, review = EXCLUDED.review`,
    [reviewId, workout_id, req.user.id, review]
  );
  res.json({ ok: true });
}));

reviewRouter.delete("/:workout_id", requireAuth, handler(async (req, res) => {
  const db = getDb();
  await db.run(
    "DELETE FROM workout_reviews WHERE workout_id = $1 AND user_id = $2",
    [req.params.workout_id, req.user.id]
  );
  res.json({ ok: true });
}));

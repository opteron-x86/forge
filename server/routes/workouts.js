// ═══════════════════════════════════════════════════════════════
//  TALOS — Workout Routes
//  GET/POST/PUT/DELETE /api/workouts, GET/POST/DELETE /api/workout-reviews
// ═══════════════════════════════════════════════════════════════

import { Router } from "express";
import db from "../db.js";
import { genId, trackEvent } from "../db.js";
import { requireAuth, handler } from "../middleware.js";

const router = Router();

// ===================== WORKOUTS =====================

router.get("/", requireAuth, handler((req, res) => {
  const rows = db.prepare(
    "SELECT * FROM workouts WHERE user_id = ? ORDER BY date ASC, created_at ASC"
  ).all(req.user.id);
  res.json(rows.map(r => ({ ...r, exercises: JSON.parse(r.exercises) })));
}));

router.post("/", requireAuth, handler((req, res) => {
  const { id, date, program_id, day_id, day_label, feel, sleepHours, duration, notes, exercises, finished_at } = req.body;
  db.prepare(
    `INSERT INTO workouts (id, user_id, date, program_id, day_id, day_label, feel, sleep_hours, duration, notes, exercises, finished_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id || genId(), req.user.id, date, program_id || null, day_id || null,
    day_label || null, feel || 3, sleepHours || null, duration || null,
    notes || "", JSON.stringify(exercises), finished_at || null
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

router.put("/:id", requireAuth, handler((req, res) => {
  const { date, program_id, day_id, day_label, feel, sleepHours, duration, notes, exercises, finished_at } = req.body;
  const existing = db.prepare("SELECT id FROM workouts WHERE id = ? AND user_id = ?").get(req.params.id, req.user.id);
  if (!existing) return res.status(404).json({ error: "Workout not found" });
  db.prepare(
    `UPDATE workouts SET date = ?, program_id = ?, day_id = ?, day_label = ?,
     feel = ?, sleep_hours = ?, duration = ?, notes = ?, exercises = ?,
     finished_at = ?
     WHERE id = ? AND user_id = ?`
  ).run(
    date, program_id || null, day_id || null, day_label || null,
    feel || 3, sleepHours || null, duration || null, notes || "",
    JSON.stringify(exercises), finished_at || null,
    req.params.id, req.user.id
  );
  res.json({ ok: true });
}));

router.delete("/:id", requireAuth, handler((req, res) => {
  db.prepare("DELETE FROM workout_reviews WHERE workout_id = ? AND user_id = ?").run(req.params.id, req.user.id);
  db.prepare("DELETE FROM workouts WHERE id = ? AND user_id = ?").run(req.params.id, req.user.id);
  res.json({ ok: true });
}));

export default router;

// ===================== WORKOUT REVIEWS =====================
// Exported as a separate router — mounted at /api/workout-reviews
// for backward compatibility with existing frontend paths.

export const reviewRouter = Router();

reviewRouter.get("/", requireAuth, handler((req, res) => {
  const { workout_id } = req.query;
  if (workout_id) {
    const review = db.prepare("SELECT * FROM workout_reviews WHERE workout_id = ? AND user_id = ?").get(workout_id, req.user.id);
    return res.json(review || null);
  }
  const reviews = db.prepare("SELECT * FROM workout_reviews WHERE user_id = ?").all(req.user.id);
  return res.json(reviews);
}));

reviewRouter.post("/", requireAuth, handler((req, res) => {
  const { id, workout_id, review } = req.body;
  if (!workout_id || !review) return res.status(400).json({ error: "workout_id and review required" });
  db.prepare(
    "INSERT OR REPLACE INTO workout_reviews (id, workout_id, user_id, review) VALUES (?, ?, ?, ?)"
  ).run(id || genId(), workout_id, req.user.id, review);
  res.json({ ok: true });
}));

reviewRouter.delete("/:workout_id", requireAuth, handler((req, res) => {
  db.prepare("DELETE FROM workout_reviews WHERE workout_id = ? AND user_id = ?").run(req.params.workout_id, req.user.id);
  res.json({ ok: true });
}));

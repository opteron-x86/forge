// ═══════════════════════════════════════════════════════════════
//  TALOS — Profile Routes
//  GET/PUT /api/profile, GET/POST /api/profile/bio-history
// ═══════════════════════════════════════════════════════════════

import { Router } from "express";
import { getDb, trackEvent } from "../db.js";
import { requireAuth, handler } from "../middleware.js";

const router = Router();

// ===================== PROFILE =====================

router.get("/", requireAuth, handler(async (req, res) => {
  const db = getDb();
  const profile = await db.get("SELECT * FROM profiles WHERE user_id = $1", [req.user.id]);
  const bioHistory = await db.all("SELECT * FROM bio_history WHERE user_id = $1 ORDER BY date ASC", [req.user.id]);

  // Parse JSON fields (SQLite returns strings, PG returns objects)
  const targetPrs = profile?.target_prs
    ? (typeof profile.target_prs === "string" ? JSON.parse(profile.target_prs) : profile.target_prs)
    : {};

  res.json({
    height: profile?.height || "",
    weight: profile?.weight || null,
    bodyFat: profile?.body_fat || null,
    restTimerCompound: profile?.rest_timer_compound || 150,
    restTimerIsolation: profile?.rest_timer_isolation || 90,
    sex: profile?.sex || "",
    dateOfBirth: profile?.date_of_birth || "",
    goal: profile?.goal || "",
    targetWeight: profile?.target_weight || null,
    experienceLevel: profile?.experience_level || "",
    trainingIntensity: profile?.training_intensity || "",
    targetPrs,
    injuriesNotes: profile?.injuries_notes || "",
    caloriesTarget: profile?.calories_target || null,
    proteinTarget: profile?.protein_target || null,
    activeProgramId: profile?.active_program_id || null,
    onboardingComplete: !!profile?.onboarding_complete,
    intensityScale: profile?.intensity_scale || "rpe",
    bioHistory,
  });
}));

router.put("/", requireAuth, handler(async (req, res) => {
  const db = getDb();
  const {
    height, weight, bodyFat, restTimerCompound, restTimerIsolation,
    sex, dateOfBirth, goal, targetWeight, experienceLevel,
    trainingIntensity, targetPrs, injuriesNotes, caloriesTarget,
    proteinTarget, activeProgramId, onboardingComplete, intensityScale,
  } = req.body;

  await db.run(`
    INSERT INTO profiles (user_id, height, weight, body_fat, rest_timer_compound, rest_timer_isolation,
      sex, date_of_birth, goal, target_weight, experience_level, training_intensity, target_prs,
      injuries_notes, calories_target, protein_target, active_program_id, onboarding_complete, intensity_scale)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
    ON CONFLICT(user_id) DO UPDATE SET
      height = EXCLUDED.height, weight = EXCLUDED.weight, body_fat = EXCLUDED.body_fat,
      rest_timer_compound = EXCLUDED.rest_timer_compound, rest_timer_isolation = EXCLUDED.rest_timer_isolation,
      sex = EXCLUDED.sex, date_of_birth = EXCLUDED.date_of_birth, goal = EXCLUDED.goal,
      target_weight = EXCLUDED.target_weight, experience_level = EXCLUDED.experience_level,
      training_intensity = EXCLUDED.training_intensity, target_prs = EXCLUDED.target_prs,
      injuries_notes = EXCLUDED.injuries_notes, calories_target = EXCLUDED.calories_target,
      protein_target = EXCLUDED.protein_target, active_program_id = EXCLUDED.active_program_id,
      onboarding_complete = EXCLUDED.onboarding_complete, intensity_scale = EXCLUDED.intensity_scale
  `, [
    req.user.id,
    height || "", weight || null, bodyFat || null,
    restTimerCompound || 150, restTimerIsolation || 90,
    sex || "", dateOfBirth || "", goal || "", targetWeight || null,
    experienceLevel || "", trainingIntensity || "",
    targetPrs ? JSON.stringify(targetPrs) : "{}",
    injuriesNotes || "", caloriesTarget || null, proteinTarget || null,
    activeProgramId || null, onboardingComplete ? 1 : 0,
    intensityScale || "rpe",
  ]);

  // Log weight to bio history if present
  if (weight) {
    const today = new Date().toISOString().split("T")[0];
    const existing = await db.get(
      "SELECT id FROM bio_history WHERE user_id = $1 AND date = $2",
      [req.user.id, today]
    );
    if (existing) {
      await db.run("UPDATE bio_history SET weight = $1, body_fat = $2 WHERE id = $3",
        [weight, bodyFat || null, existing.id]);
    } else {
      await db.run("INSERT INTO bio_history (user_id, date, weight, body_fat) VALUES ($1, $2, $3, $4)",
        [req.user.id, today, weight, bodyFat || null]);
    }
  }

  trackEvent(req.user.id, "profile_updated");
  res.json({ ok: true });
}));

export default router;

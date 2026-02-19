// ═══════════════════════════════════════════════════════════════
//  TALOS — Profile Routes
//  GET/PUT /api/profile, GET/POST /api/profile/bio-history
// ═══════════════════════════════════════════════════════════════

import { Router } from "express";
import db from "../db.js";
import { trackEvent } from "../db.js";
import { requireAuth, handler } from "../middleware.js";

const router = Router();

// ===================== PROFILE =====================

router.get("/", requireAuth, handler((req, res) => {
  const profile = db.prepare("SELECT * FROM profiles WHERE user_id = ?").get(req.user.id);
  const bioHistory = db.prepare("SELECT * FROM bio_history WHERE user_id = ? ORDER BY date ASC").all(req.user.id);
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
    targetPrs: profile?.target_prs ? JSON.parse(profile.target_prs) : {},
    injuriesNotes: profile?.injuries_notes || "",
    caloriesTarget: profile?.calories_target || null,
    proteinTarget: profile?.protein_target || null,
    activeProgramId: profile?.active_program_id || null,
    onboardingComplete: !!profile?.onboarding_complete,
    intensityScale: profile?.intensity_scale || "rpe",
    bioHistory,
  });
}));

router.put("/", requireAuth, handler((req, res) => {
  const {
    height, weight, bodyFat, restTimerCompound, restTimerIsolation,
    sex, dateOfBirth, goal, targetWeight, experienceLevel,
    trainingIntensity, targetPrs, injuriesNotes, caloriesTarget,
    proteinTarget, activeProgramId, onboardingComplete, intensityScale,
  } = req.body;

  db.prepare(`
    INSERT INTO profiles (user_id, height, weight, body_fat, rest_timer_compound, rest_timer_isolation,
      sex, date_of_birth, goal, target_weight, experience_level, training_intensity, target_prs,
      injuries_notes, calories_target, protein_target, active_program_id, onboarding_complete, intensity_scale)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      height = excluded.height, weight = excluded.weight, body_fat = excluded.body_fat,
      rest_timer_compound = excluded.rest_timer_compound, rest_timer_isolation = excluded.rest_timer_isolation,
      sex = excluded.sex, date_of_birth = excluded.date_of_birth, goal = excluded.goal,
      target_weight = excluded.target_weight, experience_level = excluded.experience_level,
      training_intensity = excluded.training_intensity, target_prs = excluded.target_prs,
      injuries_notes = excluded.injuries_notes, calories_target = excluded.calories_target,
      protein_target = excluded.protein_target, active_program_id = excluded.active_program_id,
      onboarding_complete = excluded.onboarding_complete, intensity_scale = excluded.intensity_scale
  `).run(
    req.user.id,
    height || "", weight || null, bodyFat || null,
    restTimerCompound || 150, restTimerIsolation || 90,
    sex || "", dateOfBirth || "", goal || "", targetWeight || null,
    experienceLevel || "", trainingIntensity || "",
    targetPrs ? JSON.stringify(targetPrs) : "{}",
    injuriesNotes || "", caloriesTarget || null, proteinTarget || null,
    activeProgramId || null, onboardingComplete ? 1 : 0,
    intensityScale || "rpe"
  );

  // Log weight to bio history if present
  if (weight) {
    const today = new Date().toISOString().split("T")[0];
    const existing = db.prepare(
      "SELECT id FROM bio_history WHERE user_id = ? AND date = ?"
    ).get(req.user.id, today);
    if (existing) {
      db.prepare("UPDATE bio_history SET weight = ?, body_fat = ? WHERE id = ?")
        .run(weight, bodyFat || null, existing.id);
    } else {
      db.prepare("INSERT INTO bio_history (user_id, date, weight, body_fat) VALUES (?, ?, ?, ?)")
        .run(req.user.id, today, weight, bodyFat || null);
    }
  }

  trackEvent(req.user.id, "profile_updated");
  res.json({ ok: true });
}));

export default router;

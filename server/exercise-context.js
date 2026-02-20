// ═══════════════════════════════════════════════════════════════
//  TALOS — Exercise Context for AI Coach
//
//  Replaces static imports from src/lib/exercises.js with
//  database-backed exercise data. Provides rich context for
//  AI coaching prompts including secondary muscles, force
//  direction, and difficulty levels.
//
//  Cache is populated on first call and refreshed periodically.
// ═══════════════════════════════════════════════════════════════

import { getDb } from "./db.js";

// ─── CACHE ──────────────────────────────────────────────────────
let _cache = null;
let _cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get exercise context (cached).
 * Returns: { exercises, exerciseNames, exercisesByMuscle, substitutions }
 */
export async function getExerciseContext() {
  const now = Date.now();
  if (_cache && (now - _cacheTime) < CACHE_TTL) return _cache;

  const db = getDb();

  // Load all exercises
  const exercises = await db.all(
    "SELECT name, muscle, equipment, type, primary_muscles, secondary_muscles, force, level FROM exercises ORDER BY name ASC"
  );

  // Parse JSONB fields
  for (const ex of exercises) {
    ex.primary_muscles = typeof ex.primary_muscles === "string" ? JSON.parse(ex.primary_muscles) : ex.primary_muscles;
    ex.secondary_muscles = typeof ex.secondary_muscles === "string" ? JSON.parse(ex.secondary_muscles) : ex.secondary_muscles;
  }

  // Build indexes
  const exerciseNames = exercises.map(e => e.name);

  const exercisesByMuscle = {};
  for (const ex of exercises) {
    if (!exercisesByMuscle[ex.muscle]) exercisesByMuscle[ex.muscle] = [];
    exercisesByMuscle[ex.muscle].push(ex.name);
  }

  // Load substitutions
  const subRows = await db.all(
    "SELECT exercise_name, substitute_name FROM exercise_substitutions ORDER BY exercise_name, rank ASC"
  );
  const substitutions = {};
  for (const row of subRows) {
    if (!substitutions[row.exercise_name]) substitutions[row.exercise_name] = [];
    substitutions[row.exercise_name].push(row.substitute_name);
  }

  _cache = { exercises, exerciseNames, exercisesByMuscle, substitutions };
  _cacheTime = now;
  return _cache;
}

/**
 * Build exercise library string for AI system prompts.
 * Groups exercises by muscle group.
 */
export async function buildExerciseLibraryPrompt() {
  const { exercisesByMuscle } = await getExerciseContext();
  return Object.entries(exercisesByMuscle)
    .map(([muscle, exs]) => `${muscle.toUpperCase()}: ${exs.join(", ")}`)
    .join("\n");
}

/**
 * Build detailed exercise info for a specific exercise (for substitution context).
 */
export async function getExerciseDetail(name) {
  const { exercises } = await getExerciseContext();
  return exercises.find(e => e.name === name) || null;
}

/**
 * Get substitutions for an exercise.
 * Falls back to empty array if none found.
 */
export async function getSubstitutions(exerciseName) {
  const { substitutions } = await getExerciseContext();
  return substitutions[exerciseName] || [];
}

/**
 * Build rich context for deep analysis.
 * Returns exercise info with secondary muscles for volume analysis.
 */
export async function buildAnalysisContext() {
  const { exercises } = await getExerciseContext();

  // Group by muscle with secondary muscle info
  const muscleDetail = {};
  for (const ex of exercises) {
    if (!muscleDetail[ex.muscle]) muscleDetail[ex.muscle] = [];
    const detail = { name: ex.name, type: ex.type, equipment: ex.equipment };
    if (ex.force) detail.force = ex.force;
    if (ex.secondary_muscles?.length) detail.secondaryMuscles = ex.secondary_muscles;
    muscleDetail[ex.muscle].push(detail);
  }

  return muscleDetail;
}

/**
 * Invalidate the exercise cache (call after exercise creation/deletion).
 */
export function invalidateExerciseCache() {
  _cache = null;
  _cacheTime = 0;
}

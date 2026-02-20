#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════
//  TALOS — Generate Static Exercise Fallback
//
//  Exports the current database exercise catalog to a static
//  JavaScript file for offline PWA fallback. This runs as a
//  build step so the PWA always has a recent snapshot.
//
//  Usage:
//    node scripts/generate-exercise-fallback.js
//
//  Output:
//    src/lib/exercises-fallback.js
//
//  The frontend imports this as a fallback when the /api/exercises
//  endpoint is unreachable (offline, slow connection, etc.)
// ═══════════════════════════════════════════════════════════════

import { createDb } from "../server/db/index.js";
import fs from "fs";

async function main() {
  console.log("Generating exercise fallback from database...");

  const db = await createDb();

  // Fetch all exercises (slim format for bundle size)
  const exercises = await db.all(
    "SELECT name, muscle, equipment, type FROM exercises ORDER BY name ASC"
  );

  // Fetch substitution map
  const subRows = await db.all(
    "SELECT exercise_name, substitute_name FROM exercise_substitutions ORDER BY exercise_name, rank ASC"
  );
  const substitutions = {};
  for (const row of subRows) {
    if (!substitutions[row.exercise_name]) substitutions[row.exercise_name] = [];
    substitutions[row.exercise_name].push(row.substitute_name);
  }

  // Fetch taxonomy constants
  const muscleGroups = [...new Set(exercises.map(e => e.muscle))].sort();
  const equipmentTypes = [...new Set(exercises.map(e => e.equipment))].sort();
  const types = [...new Set(exercises.map(e => e.type))].sort();

  const output = `// ═══════════════════════════════════════════════════════════════
// AUTO-GENERATED — Do not edit manually!
// Generated from database on ${new Date().toISOString()}
// Total exercises: ${exercises.length}
// Total substitution pairs: ${subRows.length}
//
// This file serves as the offline fallback for the exercise library.
// The frontend prefers /api/exercises when online.
// ═══════════════════════════════════════════════════════════════

export const MUSCLE_GROUPS = ${JSON.stringify(muscleGroups)};
export const EQUIPMENT = ${JSON.stringify(equipmentTypes)};
export const TYPES = ${JSON.stringify(types)};

export const EXERCISES = ${JSON.stringify(exercises, null, 2)};

export const SUBSTITUTIONS = ${JSON.stringify(substitutions, null, 2)};

// Helper to merge built-in + custom exercises
export function getAllExercises(customExercises = []) {
  const merged = [...EXERCISES];
  customExercises.forEach(ce => {
    if (!merged.find(e => e.name.toLowerCase() === ce.name.toLowerCase())) {
      merged.push(ce);
    }
  });
  return merged.sort((a, b) => a.name.localeCompare(b.name));
}

// Filter exercises
export function filterExercises(exercises, { muscle, equipment, type, search } = {}) {
  return exercises.filter(e => {
    if (muscle && e.muscle !== muscle) return false;
    if (equipment && e.equipment !== equipment) return false;
    if (type && e.type !== type) return false;
    if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
}
`;

  fs.writeFileSync("src/lib/exercises-fallback.js", output);
  console.log(`✅ Generated src/lib/exercises-fallback.js (${exercises.length} exercises, ${subRows.length} substitution pairs)`);

  await db.close();
}

main().catch(e => {
  console.error("Failed to generate fallback:", e);
  process.exit(1);
});

#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════
//  TALOS — Exercise Library Seed & Merge Script
//
//  Phase 1: Seed exercises table from src/lib/exercises.js
//  Phase 2: Fetch free-exercise-db, fuzzy-match, enrich
//  Phase 3: Import unmatched strength exercises as new entries
//  Phase 4: Seed exercise_substitutions from SUBSTITUTION_MAP
//
//  Usage:
//    node scripts/seed-exercises.js                    # dry run (match report only)
//    node scripts/seed-exercises.js --apply            # write to database
//    node scripts/seed-exercises.js --report-only      # just output match report JSON
//
//  Requires: DATABASE_URL or DATABASE_PATH in env
// ═══════════════════════════════════════════════════════════════

import { EXERCISES, SUBSTITUTIONS, MUSCLE_GROUPS, EQUIPMENT, TYPES } from "../src/lib/exercises.js";
import { createDb, genId } from "../server/db/index.js";
import fs from "fs";
import path from "path";

// ─── CONFIG ─────────────────────────────────────────────────────
const DRY_RUN = !process.argv.includes("--apply");
const REPORT_ONLY = process.argv.includes("--report-only");
const FREE_DB_URL = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json";
const FREE_DB_LOCAL = "../public/data/free-exercise-db.json"; // fallback if already downloaded
const IMAGE_BASE = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";

// Categories from free-exercise-db we want to import
const IMPORT_CATEGORIES = new Set(["strength", "powerlifting"]);

// ─── MUSCLE GROUP MAPPING ───────────────────────────────────────
// Maps free-exercise-db muscle names → TALOS muscle group
const MUSCLE_MAP = {
  // Direct mappings
  "chest": "chest",
  "biceps": "biceps",
  "triceps": "triceps",
  "calves": "calves",
  "forearms": "forearms",
  "glutes": "glutes",
  "quadriceps": "quads",
  "hamstrings": "hamstrings",
  "abdominals": "core",

  // Back sub-groups → back
  "lats": "back",
  "middle back": "back",
  "lower back": "back",
  "traps": "back",        // debatable — could be shoulders for some exercises
  "neck": "back",

  // Shoulder mappings
  "shoulders": "shoulders",

  // Edge cases
  "abductors": "glutes",  // hip abductors → glutes family
  "adductors": "quads",   // hip adductors → quads family (inner thigh)
};

// ─── EQUIPMENT MAPPING ──────────────────────────────────────────
// Maps free-exercise-db equipment → TALOS equipment categories
const EQUIP_MAP = {
  "barbell": "barbell",
  "dumbbell": "dumbbell",
  "cable": "cable",
  "machine": "machine",
  "body only": "bodyweight",
  "other": "other",
  "e-z curl bar": "barbell",
  "kettlebells": "other",
  "medicine ball": "other",
  "exercise ball": "other",
  "foam roll": "other",
  "bands": "other",
  null: "other",
  undefined: "other",
};

// ─── NAME NORMALIZATION ─────────────────────────────────────────

/** Normalize an exercise name for comparison */
function normalize(name) {
  return name
    .toLowerCase()
    .replace(/\bdumbbell\b/g, "db")
    .replace(/\bbarbell\b/g, "")
    .replace(/\be-z curl bar\b/g, "ez-bar")
    .replace(/\bez curl bar\b/g, "ez-bar")
    .replace(/\bbodyweight\b/g, "")
    .replace(/\bbody only\b/g, "")
    .replace(/\s*-\s*medium grip\b/g, "")   // "Barbell Bench Press - Medium Grip" → "Bench Press"
    .replace(/\s*-\s*narrow stance\b/g, "")
    .replace(/\s*-\s*wide grip\b/g, "wide grip")
    .replace(/\bstanding\b/g, "")           // often implicit
    .replace(/\bseated\b/g, "")             // sometimes different, but helps matching
    .replace(/[^a-z0-9 ]/g, "")            // strip special chars
    .replace(/\s+/g, " ")
    .trim();
}

/** Calculate simple word-overlap similarity (Jaccard-ish) */
function similarity(a, b) {
  const wordsA = new Set(normalize(a).split(" ").filter(Boolean));
  const wordsB = new Set(normalize(b).split(" ").filter(Boolean));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  let intersection = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) intersection++;
  }
  const union = new Set([...wordsA, ...wordsB]).size;
  return intersection / union;
}

/** Check if names are likely the same exercise */
function isMatch(talosName, freeDbName) {
  // Exact match after normalization
  const na = normalize(talosName);
  const nb = normalize(freeDbName);
  if (na === nb) return { score: 1.0, type: "exact" };

  // One contains the other
  if (na.includes(nb) || nb.includes(na)) return { score: 0.9, type: "contains" };

  // High word overlap
  const sim = similarity(talosName, freeDbName);
  if (sim >= 0.7) return { score: sim, type: "fuzzy" };

  return null;
}

// ─── MANUAL OVERRIDES ───────────────────────────────────────────
// Known matches that fuzzy matching might miss or get wrong
const MANUAL_MATCHES = {
  "Bench Press": "Barbell_Bench_Press_-_Medium_Grip",
  "Incline Bench Press": "Barbell_Incline_Bench_Press_-_Medium_Grip",
  "Back Squat": "Barbell_Squat",
  "Conventional Deadlift": "Barbell_Deadlift",
  "Barbell Row": "Bent_Over_Barbell_Row",
  "Barbell Hip Thrust": "Barbell_Hip_Thrust",
  "Overhead Press": "Barbell_Shoulder_Press",
  "Barbell Shrug": "Barbell_Shrug",
  "EZ-Bar Curl": "Barbell_Curl",  // close enough — EZ bar is a barbell variant
  "Guillotine Press": "Barbell_Guillotine_Bench_Press",
  "DB Bench Press": "Dumbbell_Bench_Press",
  "DB Fly": "Dumbbell_Flyes",
  "Incline DB Fly": "Incline_Dumbbell_Flyes",
  "DB Pullover": "Bent-Arm_Dumbbell_Pullover",
  "Cable Fly (Mid)": "Cable_Crossover",
  "Pec Deck Machine": "Butterfly",
  "Pull-ups": "Pullups",
  "Chin-ups": "Chin-Up",
  "One-Arm DB Row": "One-Arm_Dumbbell_Row",
  "Hammer Curl": "Alternate_Hammer_Curl",
  "Incline DB Curl": "Alternate_Incline_Dumbbell_Curl",
  "Barbell Curl": "Barbell_Curl",
  "Preacher Curl": "Preacher_Curl",
  "Cable Crunch": "Cable_Crunch",
  "Cable Rear Delt Fly": "Cable_Rear_Delt_Fly",
  "Bodyweight Squat": "Bodyweight_Squat",
  "Bench Dips": "Bench_Dips",
  "Box Squat": "Box_Squat",
  "Barbell Lunge": "Barbell_Lunge",
  "Barbell Step-up": "Barbell_Step_Ups",
  "Walking Lunge (Barbell)": "Barbell_Walking_Lunge",
  "Ab Wheel Rollout": "Ab_Roller",
  "Barbell Rollout": "Barbell_Ab_Rollout_-_On_Knees",
  "Cable Wrist Curl": "Cable_Wrist_Curl",
  "Seated Calf Raise": "Barbell_Seated_Calf_Raise",
  "Arnold Press": "Arnold_Dumbbell_Press",
  "Skull Crushers": "Lying_Triceps_Press",
  "Floor Press": "Dumbbell_Floor_Press", // might not be perfect
  "Face Pull": "Face_Pull",
};

// ─── FETCH FREE EXERCISE DB ────────────────────────────────────

async function fetchFreeExerciseDb() {
  // Try local file first
  if (fs.existsSync(FREE_DB_LOCAL)) {
    console.log(`📂 Loading free-exercise-db from local: ${FREE_DB_LOCAL}`);
    return JSON.parse(fs.readFileSync(FREE_DB_LOCAL, "utf-8"));
  }

  // Try the bundled exercise-reference.json (already processed in public/data/)
  const refPath = "./public/data/exercise-reference.json";
  if (fs.existsSync(refPath)) {
    console.log(`📂 Loading from exercise-reference.json`);
    const data = JSON.parse(fs.readFileSync(refPath, "utf-8"));
    // This file is keyed by id — convert to array format
    if (!Array.isArray(data)) {
      return Object.entries(data).map(([id, ex]) => ({ ...ex, id, name: ex.name || id.replace(/_/g, " ") }));
    }
    return data;
  }

  // Fetch from GitHub
  console.log(`🌐 Fetching free-exercise-db from GitHub...`);
  try {
    const res = await fetch(FREE_DB_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    // Cache locally
    fs.mkdirSync(path.dirname(FREE_DB_LOCAL), { recursive: true });
    fs.writeFileSync(FREE_DB_LOCAL, JSON.stringify(data, null, 2));
    console.log(`💾 Cached ${data.length} exercises to ${FREE_DB_LOCAL}`);
    return data;
  } catch (e) {
    console.error(`❌ Could not fetch free-exercise-db: ${e.message}`);
    console.error(`   Place the file at ${FREE_DB_LOCAL} or ensure network access.`);
    return null;
  }
}

// ─── MAIN ───────────────────────────────────────────────────────

async function main() {
  console.log("═══════════════════════════════════════════════════════");
  console.log("  TALOS Exercise Library Seed & Merge");
  console.log(`  Mode: ${DRY_RUN ? "DRY RUN (use --apply to write)" : "🔴 LIVE — writing to database"}`);
  console.log("═══════════════════════════════════════════════════════\n");

  // ─── Phase 0: Load data ───────────────────────────────────────
  const freeDb = await fetchFreeExerciseDb();
  const freeDbById = {};
  const freeDbByNorm = {};

  if (freeDb) {
    for (const ex of freeDb) {
      freeDbById[ex.id] = ex;
      freeDbByNorm[normalize(ex.name)] = ex;
    }
    console.log(`\n📊 TALOS exercises: ${EXERCISES.length}`);
    console.log(`📊 free-exercise-db exercises: ${freeDb.length}`);

    // Category breakdown
    const cats = {};
    for (const ex of freeDb) {
      const c = ex.category || "unknown";
      cats[c] = (cats[c] || 0) + 1;
    }
    console.log(`📊 free-exercise-db categories:`, cats);
  }

  // ─── Phase 1: Match TALOS exercises against free-exercise-db ──
  console.log("\n─── Phase 1: Matching TALOS → free-exercise-db ───\n");

  const matches = [];       // { talos, freeDb, score, type }
  const unmatched = [];     // TALOS exercises with no match
  const usedFreeIds = new Set();

  for (const talosEx of EXERCISES) {
    let bestMatch = null;

    // Check manual overrides first
    if (MANUAL_MATCHES[talosEx.name] && freeDbById[MANUAL_MATCHES[talosEx.name]]) {
      const freeEx = freeDbById[MANUAL_MATCHES[talosEx.name]];
      bestMatch = { talos: talosEx, freeDb: freeEx, score: 1.0, type: "manual" };
    }

    // Try fuzzy matching
    if (!bestMatch && freeDb) {
      let topScore = 0;
      let topMatch = null;
      let topType = null;

      for (const freeEx of freeDb) {
        if (usedFreeIds.has(freeEx.id)) continue; // already matched

        const m = isMatch(talosEx.name, freeEx.name);
        if (m && m.score > topScore) {
          topScore = m.score;
          topMatch = freeEx;
          topType = m.type;
        }
      }

      if (topMatch && topScore >= 0.7) {
        bestMatch = { talos: talosEx, freeDb: topMatch, score: topScore, type: topType };
      }
    }

    if (bestMatch) {
      matches.push(bestMatch);
      usedFreeIds.add(bestMatch.freeDb.id);
    } else {
      unmatched.push(talosEx);
    }
  }

  console.log(`✅ Matched: ${matches.length}/${EXERCISES.length}`);
  console.log(`❌ Unmatched: ${unmatched.length}/${EXERCISES.length}`);

  // ─── Phase 2: Identify new exercises to import from free-exercise-db
  const newFromFreeDb = [];
  if (freeDb) {
    for (const freeEx of freeDb) {
      if (usedFreeIds.has(freeEx.id)) continue;
      if (!IMPORT_CATEGORIES.has(freeEx.category)) continue;

      // Map muscle group
      const primaryMuscle = freeEx.primaryMuscles?.[0];
      const talosMuscle = MUSCLE_MAP[primaryMuscle];
      if (!talosMuscle) continue; // skip if we can't map the muscle

      newFromFreeDb.push(freeEx);
    }
    console.log(`\n📥 New exercises to import from free-exercise-db: ${newFromFreeDb.length}`);
  }

  // ─── Generate match report ────────────────────────────────────
  const report = {
    summary: {
      talos_total: EXERCISES.length,
      freeDb_total: freeDb?.length || 0,
      matched: matches.length,
      unmatched_talos: unmatched.length,
      new_from_freeDb: newFromFreeDb.length,
      substitution_pairs: Object.entries(SUBSTITUTIONS).reduce(
        (sum, [, subs]) => sum + subs.length, 0
      ),
    },
    matches: matches.map(m => ({
      talos_name: m.talos.name,
      freeDb_name: m.freeDb.name,
      freeDb_id: m.freeDb.id,
      score: Math.round(m.score * 100) / 100,
      type: m.type,
      enrichment: {
        has_instructions: (m.freeDb.instructions?.length || 0) > 0,
        has_images: (m.freeDb.images?.length || 0) > 0,
        primary_muscles: m.freeDb.primaryMuscles,
        secondary_muscles: m.freeDb.secondaryMuscles,
        level: m.freeDb.level,
        force: m.freeDb.force,
      },
    })),
    unmatched_talos: unmatched.map(e => ({
      name: e.name,
      muscle: e.muscle,
      equipment: e.equipment,
    })),
    new_from_freeDb_sample: newFromFreeDb.slice(0, 30).map(e => ({
      name: e.name,
      id: e.id,
      primaryMuscles: e.primaryMuscles,
      equipment: e.equipment,
      category: e.category,
      mapped_muscle: MUSCLE_MAP[e.primaryMuscles?.[0]] || "unknown",
    })),
  };

  // Save report
  const reportPath = "./scripts/exercise-match-report.json";
  if (!REPORT_ONLY) {
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  }
  fs.writeFileSync(
    REPORT_ONLY ? "/dev/stdout" : reportPath,
    JSON.stringify(report, null, 2)
  );
  if (!REPORT_ONLY) {
    console.log(`\n📋 Match report saved to: ${reportPath}`);
  }

  if (REPORT_ONLY) return;

  // ─── Print match quality breakdown ────────────────────────────
  const byType = { manual: 0, exact: 0, contains: 0, fuzzy: 0 };
  for (const m of matches) byType[m.type] = (byType[m.type] || 0) + 1;
  console.log(`\n   Match quality: manual=${byType.manual} exact=${byType.exact} contains=${byType.contains} fuzzy=${byType.fuzzy}`);

  // Show fuzzy matches for manual review
  const fuzzyMatches = matches.filter(m => m.type === "fuzzy");
  if (fuzzyMatches.length > 0) {
    console.log(`\n⚠️  Fuzzy matches (review these for accuracy):`);
    for (const m of fuzzyMatches) {
      console.log(`   ${m.score.toFixed(2)} │ "${m.talos.name}" → "${m.freeDb.name}"`);
    }
  }

  // Show unmatched TALOS exercises
  if (unmatched.length > 0) {
    console.log(`\n📝 Unmatched TALOS exercises (will be seeded without enrichment):`);
    for (const e of unmatched.slice(0, 20)) {
      console.log(`   ${e.name} (${e.muscle}/${e.equipment})`);
    }
    if (unmatched.length > 20) console.log(`   ... and ${unmatched.length - 20} more`);
  }

  if (DRY_RUN) {
    console.log("\n═══════════════════════════════════════════════════════");
    console.log("  DRY RUN complete. Review the match report, then run:");
    console.log("  node scripts/seed-exercises.js --apply");
    console.log("═══════════════════════════════════════════════════════");
    return;
  }

  // ─── Phase 3: Write to database ───────────────────────────────
  console.log("\n─── Phase 3: Writing to database ───\n");

  const db = await createDb();

  // Run schema migration
  const schemaSql = fs.readFileSync("./scripts/001-exercises-table.sql", "utf-8");
  for (const stmt of schemaSql.split(";").filter(s => s.trim())) {
    await db.exec(stmt.trim());
  }
  console.log("✅ Schema created (exercises + exercise_substitutions tables)");

  // Seed TALOS built-in exercises
  let seeded = 0;
  let enriched = 0;

  for (const talosEx of EXERCISES) {
    const id = genId();
    const match = matches.find(m => m.talos.name === talosEx.name);

    const description = match?.freeDb?.instructions?.join("\n\n") || null;
    const primaryMuscles = match?.freeDb?.primaryMuscles || null;
    const secondaryMuscles = match?.freeDb?.secondaryMuscles || null;
    const force = match?.freeDb?.force || null;
    const level = match?.freeDb?.level || null;
    const category = match?.freeDb?.category || "strength";
    const externalId = match?.freeDb?.id || null;
    const images = match?.freeDb?.images?.map(img =>
      img.startsWith("http") ? img : `${IMAGE_BASE}${img}`
    ) || null;

    try {
      await db.run(
        `INSERT INTO exercises (id, name, muscle, equipment, type, source, external_id, description, primary_muscles, secondary_muscles, force, level, category, images)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         ON CONFLICT (name) DO UPDATE SET
           external_id = EXCLUDED.external_id,
           description = EXCLUDED.description,
           primary_muscles = EXCLUDED.primary_muscles,
           secondary_muscles = EXCLUDED.secondary_muscles,
           force = EXCLUDED.force,
           level = EXCLUDED.level,
           category = EXCLUDED.category,
           images = EXCLUDED.images,
           updated_at = NOW()`,
        [
          id, talosEx.name, talosEx.muscle, talosEx.equipment, talosEx.type,
          "builtin", externalId, description,
          primaryMuscles ? JSON.stringify(primaryMuscles) : null,
          secondaryMuscles ? JSON.stringify(secondaryMuscles) : null,
          force, level, category,
          images ? JSON.stringify(images) : null,
        ]
      );
      seeded++;
      if (match) enriched++;
    } catch (e) {
      console.error(`   ⚠️  Failed to seed "${talosEx.name}": ${e.message}`);
    }
  }
  console.log(`✅ Seeded ${seeded} TALOS exercises (${enriched} enriched with free-exercise-db data)`);

  // Import new exercises from free-exercise-db
  let imported = 0;
  for (const freeEx of newFromFreeDb) {
    const id = genId();
    const primaryMuscle = freeEx.primaryMuscles?.[0];
    const talosMuscle = MUSCLE_MAP[primaryMuscle] || "other";
    const talosEquip = EQUIP_MAP[freeEx.equipment] || "other";
    const talosType = freeEx.mechanic === "compound" ? "compound" : "isolation";
    const description = freeEx.instructions?.join("\n\n") || null;
    const images = freeEx.images?.map(img =>
      img.startsWith("http") ? img : `${IMAGE_BASE}${img}`
    ) || null;

    try {
      await db.run(
        `INSERT INTO exercises (id, name, muscle, equipment, type, source, external_id, description, primary_muscles, secondary_muscles, force, level, category, images)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         ON CONFLICT (name) DO NOTHING`,
        [
          id, freeEx.name, talosMuscle, talosEquip, talosType,
          "free-exercise-db", freeEx.id, description,
          freeEx.primaryMuscles ? JSON.stringify(freeEx.primaryMuscles) : null,
          freeEx.secondaryMuscles ? JSON.stringify(freeEx.secondaryMuscles) : null,
          freeEx.force || null, freeEx.level || null, freeEx.category || null,
          images ? JSON.stringify(images) : null,
        ]
      );
      imported++;
    } catch (e) {
      // Likely duplicate name — skip silently
    }
  }
  console.log(`✅ Imported ${imported} new exercises from free-exercise-db`);

  // Migrate existing custom_exercises into the exercises table
  try {
    const customExs = await db.all("SELECT * FROM custom_exercises");
    let customMigrated = 0;
    for (const ce of customExs) {
      try {
        await db.run(
          `INSERT INTO exercises (id, name, muscle, equipment, type, source, created_by)
           VALUES ($1, $2, $3, $4, $5, 'custom', $6)
           ON CONFLICT (name) DO NOTHING`,
          [ce.id, ce.name, ce.muscle || "other", ce.equipment || "other", ce.type || "isolation", ce.created_by]
        );
        customMigrated++;
      } catch (e) { /* skip duplicates */ }
    }
    if (customMigrated > 0) {
      console.log(`✅ Migrated ${customMigrated} custom exercises`);
    }
  } catch (e) {
    console.log(`ℹ️  No custom_exercises table found (or empty) — skipping migration`);
  }

  // ─── Phase 4: Seed substitution map ───────────────────────────
  console.log("\n─── Phase 4: Seeding substitution map ───\n");

  let subPairs = 0;
  for (const [exerciseName, substitutes] of Object.entries(SUBSTITUTIONS)) {
    for (let i = 0; i < substitutes.length; i++) {
      try {
        await db.run(
          `INSERT INTO exercise_substitutions (exercise_name, substitute_name, rank, source)
           VALUES ($1, $2, $3, 'curated')
           ON CONFLICT (exercise_name, substitute_name) DO UPDATE SET rank = EXCLUDED.rank`,
          [exerciseName, substitutes[i], i]
        );
        subPairs++;
      } catch (e) {
        console.error(`   ⚠️  Sub pair "${exerciseName}" → "${substitutes[i]}": ${e.message}`);
      }
    }
  }
  console.log(`✅ Seeded ${subPairs} substitution pairs`);

  // ─── Summary ──────────────────────────────────────────────────
  const totalExercises = await db.get("SELECT COUNT(*) as count FROM exercises");
  const totalSubs = await db.get("SELECT COUNT(*) as count FROM exercise_substitutions");

  console.log("\n═══════════════════════════════════════════════════════");
  console.log("  Seed complete!");
  console.log(`  Total exercises in database: ${totalExercises.count}`);
  console.log(`  Total substitution pairs: ${totalSubs.count}`);
  console.log("═══════════════════════════════════════════════════════");

  await db.close();
}

main().catch(e => {
  console.error("Fatal error:", e);
  process.exit(1);
});

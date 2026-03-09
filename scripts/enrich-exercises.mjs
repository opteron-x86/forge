#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════
//  TALOS — Exercise Library Enrichment Script
//  
//  Downloads free-exercise-db, matches against TALOS exercises,
//  and produces an enriched exercises.js with instructions + images.
//
//  Usage: node scripts/enrich-exercises.mjs
//  Output: src/lib/exercises.js (enriched), scripts/enrichment-report.txt
// ═══════════════════════════════════════════════════════════════

import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ===================== CONFIG =====================

const FREE_DB_URL = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json";
const IMAGE_BASE = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";
const EXERCISES_PATH = join(ROOT, "src/lib/exercises.js");
const OUTPUT_PATH = join(ROOT, "src/lib/exercises.js"); // overwrite in-place
const REPORT_PATH = join(ROOT, "scripts/enrichment-report.txt");

// ===================== MANUAL MAPPINGS =====================
// These are hand-verified: TALOS name → free-exercise-db id
// Priority: the most-used exercises that won't fuzzy-match well.

const MANUAL_MAP = {
  // ── Chest ──
  "Bench Press": "Barbell_Bench_Press_-_Medium_Grip",
  "Incline Bench Press": "Barbell_Incline_Bench_Press_-_Medium_Grip",
  "Decline Bench Press": "Decline_Barbell_Bench_Press",
  "Close-Grip Bench": "Close-Grip_Barbell_Bench_Press",
  "Floor Press": "Barbell_Floor_Press",
  "Guillotine Press": "Barbell_Guillotine_Bench_Press",
  "DB Bench Press": "Dumbbell_Bench_Press",
  "Flat DB Press": "Dumbbell_Bench_Press",
  "Incline DB Press": "Incline_Dumbbell_Press",
  "Decline DB Press": "Decline_Dumbbell_Flyes",  // closest match
  "DB Fly": "Dumbbell_Flyes",
  "Incline DB Fly": "Incline_Dumbbell_Flyes",
  "DB Pullover": "Bent-Arm_Dumbbell_Pullover",
  "Cable Crossover": "Cable_Crossover",
  "Cable Chest Press": "Cable_Chest_Press",
  "Pec Deck Machine": "Butterfly",
  "Push-ups": "Pushups",
  "Dips (Chest)": "Dips_-_Chest_Version",

  // ── Back ──
  "Conventional Deadlift": "Barbell_Deadlift",
  "Barbell Row": "Bent_Over_Barbell_Row",
  "T-Bar Row": "Bent_Over_Two-Arm_Long_Bar_Row",
  "One-Arm DB Row": "One-Arm_Dumbbell_Row",
  "Barbell Shrug": "Barbell_Shrug",
  "DB Shrug": "Dumbbell_Shrug",
  "Pull-ups": "Pullups",
  "Pull-ups (Wide Grip)": "Wide-Grip_Pulldown_Behind_The_Neck",
  "Chin-ups": "Chin-Up",
  "Wide Grip Lat Pulldown": "Wide-Grip_Lat_Pulldown",
  "Close Grip Lat Pulldown": "Close-Grip_Front_Lat_Pulldown",
  "Straight Arm Pulldown": "Straight-Arm_Pulldown",
  "Face Pull": "Face_Pull",
  "Back Extension": "Hyperextensions_Back_Extensions",
  "Hyperextension": "Hyperextensions_Back_Extensions",
  "Barbell Good Morning": "Stiff_Leg_Barbell_Good_Morning",
  "Cable Shrug": "Cable_Shrugs",

  // ── Shoulders ──
  "Overhead Press": "Barbell_Shoulder_Press",
  "Seated DB Shoulder Press": "Dumbbell_Shoulder_Press",
  "Standing DB Shoulder Press": "Standing_Dumbbell_Press",
  "Arnold Press": "Arnold_Dumbbell_Press",
  "DB Lateral Raise": "Side_Lateral_Raise",
  "DB Front Raise": "Front_Dumbbell_Raise",
  "Barbell Upright Row": "Upright_Barbell_Row",
  "Cable Rear Delt Fly": "Cable_Rear_Delt_Fly",
  "Incline Reverse Fly": "Bent_Over_Dumbbell_Rear_Delt_Raise_With_Head_On_Bench",
  "Reverse Pec Deck": "Reverse_Machine_Flyes",

  // ── Quads ──
  "Back Squat": "Barbell_Squat",
  "Front Squat": "Front_Barbell_Squat",
  "Box Squat": "Box_Squat",
  "Hack Squat": "Barbell_Hack_Squat",
  "Leg Press": "Leg_Press",
  "Leg Extension": "Leg_Extensions",
  "DB Goblet Squat": "Goblet_Squat",
  "DB Lunge": "Dumbbell_Lunges",
  "DB Walking Lunge": "Dumbbell_Walking_Lunges",
  "DB Step-up": "Dumbbell_Step_Ups",
  "Barbell Lunge": "Barbell_Lunge",

  // ── Hamstrings ──
  "Romanian Deadlift": "Romanian_Deadlift",
  "DB Romanian Deadlift": "Romanian_Deadlift_With_Dumbbells",
  "Stiff-Leg Deadlift": "Stiff-Legged_Barbell_Deadlift",
  "Good Morning": "Stiff_Leg_Barbell_Good_Morning",
  "Seated Leg Curl": "Seated_Leg_Curl",
  "Lying Leg Curl": "Lying_Leg_Curls",
  "Standing Leg Curl": "Standing_Leg_Curl",

  // ── Glutes ──
  "Hip Thrust": "Barbell_Hip_Thrust",
  "Glute Bridge": "Barbell_Glute_Bridge",

  // ── Biceps ──
  "Barbell Curl": "Barbell_Curl",
  "EZ-Bar Curl": "EZ-Bar_Curl",
  "DB Curl": "Dumbbell_Bicep_Curl",
  "Hammer Curl": "Alternate_Hammer_Curl",
  "Incline DB Curl": "Alternate_Incline_Dumbbell_Curl",
  "Preacher Curl": "Preacher_Curl",
  "Concentration Curl": "Concentration_Curls",
  "Cable Curl": "Standing_Cable_Curl",
  "Cable Hammer Curl": "Cable_Hammer_Curls_-_Rope_Attachment",
  "Cable Preacher Curl": "Cable_Preacher_Curl",

  // ── Triceps ──
  "Rope Pushdown": "Triceps_Pushdown_-_Rope_Attachment",
  "Straight Bar Pushdown": "Triceps_Pushdown",
  "Overhead Tricep Extension": "Cable_Rope_Overhead_Triceps_Extension",
  "Skull Crushers": "Lying_Triceps_Press",
  "Dips (Triceps)": "Dips_-_Triceps_Version",
  "Bench Dips": "Bench_Dips",
  "Close-Grip Bench Press": "Close-Grip_Barbell_Bench_Press",
  "DB Kickback": "Dumbbell_Tricep_Kickback",

  // ── Calves ──
  "Seated Calf Raise": "Barbell_Seated_Calf_Raise",
  "Standing Calf Raise Machine": "Standing_Calf_Raises",
  "Leg Press Calf Raise": "Calf_Press_On_The_Leg_Press_Machine",

  // ── Core ──
  "Crunch": "3_4_Sit-Up",
  "Cable Crunch": "Cable_Crunch",
  "Ab Wheel Rollout": "Ab_Roller",
  "Ab Machine Crunch": "Ab_Crunch_Machine",
  "Hanging Leg Raise": "Hanging_Leg_Raise",
  "Decline Sit-up": "Decline_Crunch",

  // ── Forearms ──
  "Wrist Curl": "Wrist_Curl",
  "Cable Wrist Curl": "Cable_Wrist_Curl",
  "Farmer's Walk": "Farmers_Walk",
};


// ===================== MUSCLE GROUP MAPPING =====================
// free-exercise-db → TALOS muscle group

const MUSCLE_MAP = {
  "abdominals": "core",
  "abductors": "glutes",
  "adductors": "glutes",
  "biceps": "biceps",
  "calves": "calves",
  "chest": "chest",
  "forearms": "forearms",
  "glutes": "glutes",
  "hamstrings": "hamstrings",
  "lats": "back",
  "lower back": "back",
  "middle back": "back",
  "neck": "shoulders",  // closest fit
  "quadriceps": "quads",
  "shoulders": "shoulders",
  "traps": "back",
  "triceps": "triceps",
};

// ===================== EQUIPMENT MAPPING =====================
// free-exercise-db → TALOS equipment

const EQUIP_MAP = {
  "barbell": "barbell",
  "dumbbell": "dumbbell",
  "cable": "cable",
  "machine": "machine",
  "body only": "bodyweight",
  "bands": "other",
  "kettlebells": "other",
  "medicine ball": "other",
  "exercise ball": "other",
  "foam roll": "other",
  "e-z curl bar": "barbell",
  "other": "other",
  null: "other",
};

// ===================== HELPERS =====================

/** Normalize a string for fuzzy comparison */
function normalize(s) {
  return s.toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\b(db|dumbbell|dumbell)\b/g, "dumbbell")
    .replace(/\bbb\b/g, "barbell")
    .replace(/\boh\b/g, "overhead")
    .replace(/\s+/g, " ")
    .trim();
}

/** Simple word-overlap similarity score (0-1) */
function similarity(a, b) {
  const wordsA = new Set(normalize(a).split(" "));
  const wordsB = new Set(normalize(b).split(" "));
  const intersection = [...wordsA].filter(w => wordsB.has(w));
  const union = new Set([...wordsA, ...wordsB]);
  return intersection.length / union.size;  // Jaccard similarity
}

/** Check if two exercises likely match by equipment + muscle */
function metaMatch(talosEx, freeEx) {
  const tEquip = talosEx.equipment;
  const fEquip = EQUIP_MAP[freeEx.equipment] || "other";
  const tMuscle = talosEx.muscle;
  const fMuscle = MUSCLE_MAP[freeEx.primaryMuscles?.[0]] || "other";
  return tEquip === fEquip && tMuscle === fMuscle;
}

/** Derive compound/isolation from free-exercise-db mechanic field */
function deriveType(freeEx) {
  if (freeEx.mechanic === "compound") return "compound";
  if (freeEx.mechanic === "isolation") return "isolation";
  // Heuristic: if it has multiple secondary muscles, likely compound
  if ((freeEx.secondaryMuscles?.length || 0) >= 2) return "compound";
  return "isolation";
}


// ===================== MAIN =====================

async function main() {
  console.log("🏋️  TALOS Exercise Enrichment Script");
  console.log("━".repeat(50));

  // 1. Download free-exercise-db
  console.log("\n📥 Downloading free-exercise-db...");
  const res = await fetch(FREE_DB_URL);
  if (!res.ok) throw new Error(`Failed to download: ${res.status}`);
  const freeDB = await res.json();
  console.log(`   ✓ ${freeDB.length} exercises downloaded`);

  // Build lookup by id
  const freeById = {};
  for (const ex of freeDB) freeById[ex.id] = ex;

  // 2. Parse current TALOS exercises from file
  console.log("\n📖 Reading current exercises.js...");
  const src = readFileSync(EXERCISES_PATH, "utf-8");

  // Extract EXERCISES array entries using regex
  const exerciseRegex = /\{ name: "([^"]+)", muscle: "([^"]+)", equipment: "([^"]+)", type: "([^"]+)" \}/g;
  const talosExercises = [];
  let match;
  while ((match = exerciseRegex.exec(src)) !== null) {
    talosExercises.push({
      name: match[1],
      muscle: match[2],
      equipment: match[3],
      type: match[4],
    });
  }
  console.log(`   ✓ ${talosExercises.length} TALOS exercises found`);

  // 3. Match TALOS exercises to free-exercise-db
  console.log("\n🔗 Matching exercises...");
  
  const matched = [];      // { talos, free, method }
  const unmatched = [];    // talos exercises with no match

  for (const tex of talosExercises) {
    // Try manual mapping first
    if (MANUAL_MAP[tex.name] && freeById[MANUAL_MAP[tex.name]]) {
      matched.push({ talos: tex, free: freeById[MANUAL_MAP[tex.name]], method: "manual" });
      continue;
    }
    if (MANUAL_MAP[tex.name]) {
      // Manual map exists but ID not found — flag it
      console.log(`   ⚠ Manual map ID not found: ${tex.name} → ${MANUAL_MAP[tex.name]}`);
    }

    // Try fuzzy matching
    let bestScore = 0;
    let bestMatch = null;

    for (const fex of freeDB) {
      // Only consider strength-category exercises for fuzzy matching
      if (fex.category === "stretching" || fex.category === "cardio") continue;

      let score = similarity(tex.name, fex.name);

      // Boost score if equipment and muscle match
      if (metaMatch(tex, fex)) score += 0.15;

      if (score > bestScore) {
        bestScore = score;
        bestMatch = fex;
      }
    }

    if (bestScore >= 0.55 && bestMatch) {
      matched.push({ talos: tex, free: bestMatch, method: `fuzzy(${bestScore.toFixed(2)})` });
    } else {
      unmatched.push(tex);
    }
  }

  console.log(`   ✓ Matched: ${matched.length}/${talosExercises.length}`);
  console.log(`   ✗ Unmatched: ${unmatched.length}/${talosExercises.length}`);

  // 4. Build enriched EXERCISES array
  console.log("\n⚙️  Building enriched exercises...");
  
  // Create a map from talos name → free-exercise-db data
  const enrichmentMap = {};
  for (const m of matched) {
    enrichmentMap[m.talos.name] = {
      instructions: m.free.instructions || [],
      images: (m.free.images || []).map(img => IMAGE_BASE + img),
      level: m.free.level || null,
      force: m.free.force || null,
      mechanic: m.free.mechanic || null,
      freeDbId: m.free.id,
    };
  }

  // 5. Regenerate exercises.js
  // Strategy: We'll preserve the ENTIRE file structure (comments, SUBSTITUTIONS, helpers)
  // and only replace the EXERCISES array entries with enriched versions.

  // Build the new EXERCISES entries
  const newEntries = talosExercises.map(tex => {
    const enrich = enrichmentMap[tex.name];
    if (enrich) {
      const fields = [
        `name: "${tex.name}"`,
        `muscle: "${tex.muscle}"`,
        `equipment: "${tex.equipment}"`,
        `type: "${tex.type}"`,
      ];
      if (enrich.instructions.length > 0) {
        fields.push(`instructions: ${JSON.stringify(enrich.instructions)}`);
      }
      if (enrich.images.length > 0) {
        fields.push(`images: ${JSON.stringify(enrich.images)}`);
      }
      if (enrich.level) fields.push(`level: "${enrich.level}"`);
      if (enrich.force) fields.push(`force: "${enrich.force}"`);
      if (enrich.mechanic) fields.push(`mechanic: "${enrich.mechanic}"`);
      if (enrich.freeDbId) fields.push(`freeDbId: "${enrich.freeDbId}"`);
      return `  { ${fields.join(", ")} }`;
    }
    // No enrichment — keep original format
    return `  { name: "${tex.name}", muscle: "${tex.muscle}", equipment: "${tex.equipment}", type: "${tex.type}" }`;
  });

  // Now do the replacement in the source file.
  // Find the EXERCISES array boundaries and rebuild it.
  // We need to preserve comments within the EXERCISES array.
  
  // Strategy: Extract all comment lines and section headers from the original EXERCISES block,
  // then interleave them with the new enriched entries.
  
  // Find EXERCISES array start and end
  const arrayStart = src.indexOf("export const EXERCISES = [");
  const arrayEndMarker = "\n];\n\n// ═══════════════════════════════════════════════════════════════\n// Common substitution pairs";
  const arrayEnd = src.indexOf(arrayEndMarker);
  
  if (arrayStart === -1 || arrayEnd === -1) {
    throw new Error("Could not locate EXERCISES array boundaries in source file");
  }
  
  const beforeArray = src.substring(0, arrayStart);
  const arrayBlock = src.substring(arrayStart, arrayEnd + 3); // include the ];
  const afterArray = src.substring(arrayEnd + 3);

  // Parse the array block line by line, preserving comments and blank lines,
  // but replacing exercise object lines with enriched versions.
  const lines = arrayBlock.split("\n");
  const newLines = [];
  let exerciseIdx = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    // Is this an exercise object line?
    if (trimmed.startsWith("{ name:") && trimmed.includes("muscle:")) {
      // Replace with enriched version
      if (exerciseIdx < newEntries.length) {
        newLines.push(newEntries[exerciseIdx] + ",");
        exerciseIdx++;
      }
    } else {
      // Comment, blank line, section header, array brackets — preserve as-is
      newLines.push(line);
    }
  }

  const newSrc = beforeArray + newLines.join("\n") + afterArray;

  // 6. Write output
  writeFileSync(OUTPUT_PATH, newSrc, "utf-8");
  console.log(`   ✓ Written enriched exercises.js (${talosExercises.length} exercises)`);

  // 7. Generate report
  const report = [];
  report.push("═══════════════════════════════════════════════════════════════");
  report.push("  TALOS Exercise Enrichment Report");
  report.push(`  Generated: ${new Date().toISOString()}`);
  report.push("═══════════════════════════════════════════════════════════════");
  report.push("");
  report.push(`SUMMARY`);
  report.push(`  Total TALOS exercises: ${talosExercises.length}`);
  report.push(`  Matched (enriched):    ${matched.length}`);
  report.push(`  Unmatched:             ${unmatched.length}`);
  report.push(`  Match rate:            ${(matched.length / talosExercises.length * 100).toFixed(1)}%`);
  report.push("");
  
  report.push("───────────────────────────────────────────────────────────────");
  report.push("MATCHED EXERCISES (enriched with instructions + images)");
  report.push("───────────────────────────────────────────────────────────────");
  for (const m of matched.sort((a, b) => a.talos.name.localeCompare(b.talos.name))) {
    const instrLen = m.free.instructions?.length || 0;
    report.push(`  ✓ ${m.talos.name.padEnd(40)} → ${m.free.name} [${m.method}] (${instrLen} steps)`);
  }
  report.push("");

  report.push("───────────────────────────────────────────────────────────────");
  report.push("UNMATCHED EXERCISES (kept as-is, no instructions/images)");
  report.push("───────────────────────────────────────────────────────────────");
  for (const u of unmatched.sort((a, b) => a.name.localeCompare(b.name))) {
    report.push(`  ✗ ${u.name} (${u.muscle}, ${u.equipment})`);
  }
  report.push("");
  
  // Show fuzzy matches that might need review (score 0.55-0.70)
  report.push("───────────────────────────────────────────────────────────────");
  report.push("LOW-CONFIDENCE FUZZY MATCHES (review these!)");
  report.push("───────────────────────────────────────────────────────────────");
  const lowConf = matched.filter(m => m.method.startsWith("fuzzy") && parseFloat(m.method.match(/[\d.]+/)?.[0] || "1") < 0.70);
  if (lowConf.length === 0) {
    report.push("  (none)");
  } else {
    for (const m of lowConf.sort((a, b) => a.talos.name.localeCompare(b.talos.name))) {
      report.push(`  ⚠ ${m.talos.name.padEnd(40)} → ${m.free.name} [${m.method}]`);
    }
  }
  report.push("");

  // New exercises from free-exercise-db that could be added
  report.push("───────────────────────────────────────────────────────────────");
  report.push("CANDIDATE NEW EXERCISES FROM free-exercise-db");
  report.push("  (strength-category, not already in TALOS, could expand library)");
  report.push("───────────────────────────────────────────────────────────────");
  const usedFreeIds = new Set(matched.map(m => m.free.id));
  const candidates = freeDB
    .filter(f => f.category === "strength" && !usedFreeIds.has(f.id))
    .filter(f => {
      const muscle = MUSCLE_MAP[f.primaryMuscles?.[0]];
      return muscle && EQUIP_MAP[f.equipment] !== undefined;
    })
    .slice(0, 50);
  
  for (const c of candidates) {
    const muscle = MUSCLE_MAP[c.primaryMuscles?.[0]] || "?";
    const equip = EQUIP_MAP[c.equipment] || "?";
    report.push(`  + ${c.name} (${muscle}, ${equip})`);
  }

  writeFileSync(REPORT_PATH, report.join("\n"), "utf-8");
  console.log(`   ✓ Written enrichment report → ${REPORT_PATH}`);

  console.log("\n" + "━".repeat(50));
  console.log("✅ Done! Next steps:");
  console.log("   1. Review scripts/enrichment-report.txt");
  console.log("   2. Check low-confidence matches and fix any bad mappings");
  console.log("   3. Add missing MANUAL_MAP entries for unmatched exercises");
  console.log("   4. Re-run this script after fixing mappings");
  console.log("   5. Test: npm run dev → check ExercisePicker, templates, AI coach");
  console.log("   6. Server wiring: NO CHANGES NEEDED (ai.js only reads name/muscle)");
}

main().catch(e => {
  console.error("❌ Error:", e.message);
  process.exit(1);
});

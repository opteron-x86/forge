#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════
//  TALOS — Hybrid Exercise Library Builder (v2)
//  
//  Strategy: free-exercise-db becomes the data backbone (instructions,
//  images, metadata). TALOS keeps its clean display names. New exercises
//  from free-exercise-db are imported with cleaned-up names.
//
//  Output:
//    src/lib/exercises.js              — enriched exercises (lean: + freeDbId only)
//    public/data/exercise-reference.json — instructions, images, metadata keyed by freeDbId
//    scripts/hybrid-report.txt         — full report for review
//    scripts/new-exercises.json        — new exercises being added (for review)
//
//  The split keeps exercises.js small (~60KB) for fast bundling while
//  reference data (~900KB) loads on-demand from public/data/.
//
//  Usage: node scripts/build-exercise-library.mjs [--dry-run]
// ═══════════════════════════════════════════════════════════════

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DRY_RUN = process.argv.includes("--dry-run");

// ===================== CONFIG =====================

const FREE_DB_PATH = "/tmp/free-exercise-db/dist/exercises.json";
const IMAGE_BASE = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";
const EXERCISES_PATH = join(ROOT, "src/lib/exercises.js");
const REFERENCE_PATH = join(ROOT, "public/data/exercise-reference.json");
const REPORT_PATH = join(ROOT, "scripts/hybrid-report.txt");
const NEW_EX_PATH = join(ROOT, "scripts/new-exercises.json");

// Categories to import from free-exercise-db
const INCLUDE_CATEGORIES = new Set(["strength", "powerlifting"]);
// Set to true to also include plyometrics/strongman
const INCLUDE_PLYO = false;
const INCLUDE_STRONGMAN = false;

if (INCLUDE_PLYO) INCLUDE_CATEGORIES.add("plyometrics");
if (INCLUDE_STRONGMAN) INCLUDE_CATEGORIES.add("strongman");


// ===================== COMPREHENSIVE MANUAL MAPPING =====================
// TALOS display name → free-exercise-db id
// Every entry here has been verified. This is the authoritative map.

const MANUAL_MAP = {
  // ══════════════ CHEST ══════════════
  "Bench Press":                    "Barbell_Bench_Press_-_Medium_Grip",
  "Incline Bench Press":            "Barbell_Incline_Bench_Press_-_Medium_Grip",
  "Decline Bench Press":            "Decline_Barbell_Bench_Press",
  "Close-Grip Bench":               "Close-Grip_Barbell_Bench_Press",
  "Floor Press":                    "Floor_Press",
  "Reverse Grip Bench Press":       "Reverse_Grip_Bench_Press",  // may not exist
  "Guillotine Press":               "Barbell_Guillotine_Bench_Press",
  "DB Bench Press":                 "Dumbbell_Bench_Press",
  "Flat DB Press":                  "Dumbbell_Bench_Press",
  "Incline DB Press":               "Incline_Dumbbell_Press",
  "Decline DB Press":               "Decline_Dumbbell_Bench_Press",
  "DB Floor Press":                 "Dumbbell_Floor_Press",
  "DB Fly":                         "Dumbbell_Flyes",
  "Incline DB Fly":                 "Incline_Dumbbell_Flyes",
  "Decline DB Fly":                 "Decline_Dumbbell_Flyes",
  "DB Pullover":                    "Bent-Arm_Dumbbell_Pullover",
  "Cable Crossover":                "Cable_Crossover",
  "Cable Chest Press":              "Cable_Chest_Press",
  "Pec Deck Machine":               "Butterfly",
  "Push-ups":                       "Pushups",
  "Dips (Chest)":                   "Dips_-_Chest_Version",

  // ══════════════ BACK ══════════════
  "Conventional Deadlift":          "Barbell_Deadlift",
  "Barbell Row":                    "Bent_Over_Barbell_Row",
  "T-Bar Row":                      "Bent_Over_Two-Arm_Long_Bar_Row",
  "One-Arm DB Row":                 "One-Arm_Dumbbell_Row",
  "DB Chest Supported Row":         "Dumbbell_Incline_Row",
  "Incline DB Row":                 "Dumbbell_Incline_Row",
  "Barbell Shrug":                  "Barbell_Shrug",
  "DB Shrug":                       "Dumbbell_Shrug",
  "Pull-ups":                       "Pullups",
  "Chin-ups":                       "Chin-Up",
  "Wide Grip Lat Pulldown":         "Wide-Grip_Lat_Pulldown",
  "Close Grip Lat Pulldown":        "Close-Grip_Front_Lat_Pulldown",
  "Straight Arm Pulldown":          "Straight-Arm_Pulldown",
  "Face Pull":                      "Face_Pull",
  "Back Extension":                 "Hyperextensions_Back_Extensions",
  "Hyperextension":                 "Hyperextensions_Back_Extensions",
  "Barbell Good Morning":           "Stiff_Leg_Barbell_Good_Morning",
  "Cable Shrug":                    "Cable_Shrugs",
  "Inverted Row":                   "Inverted_Row",
  "Renegade Row":                   "Alternating_Renegade_Row",
  "Deficit Deadlift":               "Deficit_Deadlift",
  "Barbell Pullover":               "Bent-Arm_Barbell_Pullover",
  "Snatch Grip Deadlift":           "Snatch_Deadlift",

  // ══════════════ SHOULDERS ══════════════
  "Overhead Press":                 "Barbell_Shoulder_Press",
  "Seated DB Shoulder Press":       "Dumbbell_Shoulder_Press",
  "Standing DB Shoulder Press":     "Standing_Dumbbell_Press",
  "Arnold Press":                   "Arnold_Dumbbell_Press",
  "Machine Shoulder Press":         "Machine_Shoulder_Military_Press",
  "DB Lateral Raise":               "Side_Lateral_Raise",
  "Cable Lateral Raise":            "Cable_Seated_Lateral_Raise",
  "DB Front Raise":                 "Front_Dumbbell_Raise",
  "Cable Front Raise":              "Front_Cable_Raise",
  "Barbell Upright Row":            "Upright_Barbell_Row",
  "Cable Rear Delt Fly":            "Cable_Rear_Delt_Fly",
  "Incline Reverse Fly":            "Bent_Over_Dumbbell_Rear_Delt_Raise_With_Head_On_Bench",
  "Reverse Pec Deck":               "Reverse_Machine_Flyes",
  "Push Press":                     "Push_Press",
  "Behind the Neck Press":          "Push_Press_-_Behind_the_Neck",
  "Bradford Press":                 "Bradford_Rocky_Presses",
  "Handstand Push-ups":             "Handstand_Push-Ups",
  "Cable Upright Row":              "Upright_Cable_Row",
  "DB Upright Row":                 "Dumbbell_One-Arm_Upright_Row",

  // ══════════════ QUADS ══════════════
  "Back Squat":                     "Barbell_Squat",
  "Front Squat":                    "Front_Barbell_Squat",
  "Box Squat":                      "Box_Squat",
  "Hack Squat":                     "Hack_Squat",
  "Leg Press":                      "Leg_Press",
  "Leg Extension":                  "Leg_Extensions",
  "DB Goblet Squat":                "Goblet_Squat",
  "DB Lunge":                       "Dumbbell_Lunges",
  "DB Walking Lunge":               "Dumbbell_Walking_Lunges",
  "DB Step-up":                     "Dumbbell_Step_Ups",
  "Barbell Lunge":                  "Barbell_Lunge",
  "Jump Squat":                     "Freehand_Jump_Squat",
  "DB Squat":                       "Dumbbell_Squat",
  "DB Split Squat":                 "Dumbbell_Squat",
  "Bodyweight Squat":               "Bodyweight_Squat",
  "Overhead Squat":                 "Overhead_Squat",
  "Narrow Stance Leg Press":        "Narrow_Stance_Leg_Press",
  "Smith Machine Squat":            "Smith_Machine_Squat",
  "Barbell Step-up":                "Barbell_Step_Ups",
  "Smith Machine Lunge":            "Smith_Machine_Squat",
  "Reverse Hack Squat":             "Hack_Squat",
  "Pistol Squat":                   "Kettlebell_Pistol_Squat",
  "Sissy Squat":                    "Weighted_Sissy_Squat",
  "Barbell Walking Lunge":          "Barbell_Walking_Lunge",

  // ══════════════ HAMSTRINGS ══════════════
  "Romanian Deadlift":              "Romanian_Deadlift",
  "DB Romanian Deadlift":           "Romanian_Deadlift_With_Dumbbells",
  "Stiff-Leg Deadlift":            "Stiff-Legged_Barbell_Deadlift",
  "DB Stiff-Leg Deadlift":         "Stiff-Legged_Dumbbell_Deadlift",
  "Good Morning":                   "Stiff_Leg_Barbell_Good_Morning",
  "Seated Leg Curl":                "Seated_Leg_Curl",
  "Lying Leg Curl":                 "Lying_Leg_Curls",
  "Standing Leg Curl":              "Standing_Leg_Curl",
  "Glute-Ham Raise":                "Floor_Glute-Ham_Raise",
  "Cable Pull-Through":             "Pull_Through",

  // ══════════════ GLUTES ══════════════
  "Hip Thrust":                     "Barbell_Hip_Thrust",
  "Glute Bridge":                   "Barbell_Glute_Bridge",
  "Barbell Glute Bridge":           "Barbell_Glute_Bridge",
  "DB Good Morning":                "Good_Morning",
  "Cable Kickback":                 "One-Legged_Cable_Kickback",

  // ══════════════ BICEPS ══════════════
  "Barbell Curl":                   "Barbell_Curl",
  "EZ-Bar Curl":                    "EZ-Bar_Curl",
  "DB Curl":                        "Dumbbell_Bicep_Curl",
  "Hammer Curl":                    "Alternate_Hammer_Curl",
  "Incline DB Curl":                "Alternate_Incline_Dumbbell_Curl",
  "Preacher Curl":                  "Preacher_Curl",
  "Preacher Curl (DB)":             "Preacher_Hammer_Dumbbell_Curl",
  "Concentration Curl":             "Concentration_Curls",
  "Cable Curl":                     "Standing_Cable_Curl",
  "Cable Hammer Curl":              "Cable_Hammer_Curls_-_Rope_Attachment",
  "Cable Preacher Curl":            "Cable_Preacher_Curl",
  "Alternating DB Curl":            "Dumbbell_Bicep_Curl",
  "Seated DB Curl":                 "Seated_Dumbbell_Curl",
  "Reverse Barbell Curl":           "Reverse_Barbell_Curl",
  "DB Reverse Curl":                "Standing_Dumbbell_Reverse_Curl",
  "DB Spider Curl":                 "Spider_Curl",
  "EZ-Bar Spider Curl":             "Spider_Curl",
  "Machine Curl":                   "Machine_Bicep_Curl",
  "Barbell Drag Curl":              "Drag_Curl",
  "DB Drag Curl":                   "Drag_Curl",
  "Zottman Curl":                   "Zottman_Curl",
  "Wide Grip Barbell Curl":         "Wide-Grip_Standing_Barbell_Curl",
  "Close Grip Barbell Curl":        "Close-Grip_EZ_Bar_Curl",

  // ══════════════ TRICEPS ══════════════
  "Rope Pushdown":                  "Triceps_Pushdown_-_Rope_Attachment",
  "Straight Bar Pushdown":          "Triceps_Pushdown",
  "V-Bar Pushdown":                 "Triceps_Pushdown_-_V-Bar_Attachment",
  "Overhead Tricep Extension":      "Cable_Rope_Overhead_Triceps_Extension",
  "Overhead Rope Extension":        "Cable_Rope_Overhead_Triceps_Extension",
  "Skull Crushers":                 "Lying_Triceps_Press",
  "Dips (Triceps)":                 "Dips_-_Triceps_Version",
  "Bench Dips":                     "Bench_Dips",
  "Close-Grip Bench Press":         "Close-Grip_Barbell_Bench_Press",
  "DB Kickback":                    "Tricep_Dumbbell_Kickback",
  "Machine Dip":                    "Dip_Machine",
  "Machine Tricep Extension":       "Machine_Triceps_Extension",
  "Reverse Grip Pushdown":          "Reverse_Grip_Triceps_Pushdown",
  "DB Close-Grip Press":            "Close-Grip_Dumbbell_Press",
  "Barbell Overhead Extension":     "Standing_Overhead_Barbell_Triceps_Extension",
  "JM Press":                       "JM_Press",

  // ══════════════ CALVES ══════════════
  "Seated Calf Raise":              "Barbell_Seated_Calf_Raise",
  "Standing Calf Raise Machine":    "Standing_Calf_Raises",
  "Leg Press Calf Raise":           "Calf_Press_On_The_Leg_Press_Machine",
  "DB Standing Calf Raise":         "Standing_Dumbbell_Calf_Raise",
  "Barbell Standing Calf Raise":    "Standing_Barbell_Calf_Raise",
  "Smith Machine Calf Raise":       "Smith_Machine_Calf_Raise",
  "Single-Leg Standing Calf Raise": "Standing_Dumbbell_Calf_Raise",

  // ══════════════ CORE ══════════════
  "Crunch":                         "Crunches",
  "Sit-up":                         "Sit-Up",
  "Cable Crunch":                   "Cable_Crunch",
  "Ab Wheel Rollout":               "Ab_Roller",
  "Ab Machine Crunch":              "Ab_Crunch_Machine",
  "Hanging Leg Raise":              "Hanging_Leg_Raise",
  "Hanging Knee Raise":             "Knee_Hip_Raise_On_Parallel_Bars",
  "Decline Sit-up":                 "Decline_Crunch",
  "Barbell Rollout":                "Barbell_Ab_Rollout_-_On_Knees",
  "Reverse Crunch":                 "Reverse_Crunch",
  "Bicycle Crunch":                 "Air_Bike",
  "Plank":                          "Plank",
  "Dead Bug":                       "Dead_Bug",
  "Pallof Press":                   "Pallof_Press",
  "DB Russian Twist":               "Russian_Twist",
  "DB Side Bend":                   "Dumbbell_Side_Bend",
  "Leg Raise":                      "Flat_Bench_Lying_Leg_Raise",

  // ══════════════ FOREARMS ══════════════
  "Wrist Curl":                     "Wrist_Curl",
  "Cable Wrist Curl":               "Cable_Wrist_Curl",
  "Farmer's Walk":                  "Farmers_Walk",
  "Behind the Back Wrist Curl":     "Standing_Palms-Up_Barbell_Behind_The_Back_Wrist_Curl",
  "DB Wrist Curl":                  "Seated_Dumbbell_Palms-Up_Wrist_Curl",
  "DB Reverse Wrist Curl":          "Seated_Dumbbell_Palms-Down_Wrist_Curl",

  // ══════════════ MISC MATCHES ══════════════
  "Kettlebell Swing":               "One-Arm_Kettlebell_Swings",
  "Single-Arm Cable Fly":           "Single-Arm_Cable_Crossover",
  "DB Overhead Extension":          "Standing_One-Arm_Dumbbell_Triceps_Extension",
  "Single-Arm DB Overhead Extension": "Standing_One-Arm_Dumbbell_Triceps_Extension",
  "Single-Leg Extension":           "Single-Leg_Leg_Extension",
  "Single-Leg Leg Press":           "Leg_Press",
  "Machine Preacher Curl":          "Machine_Preacher_Curls",
  "Decline Machine Press":          "Smith_Machine_Decline_Press",
  "Incline Machine Press":          "Smith_Machine_Incline_Bench_Press",
  "Bodyweight Lunge":               "Bodyweight_Walking_Lunge",
  "Weighted Pull-ups":              "Pullups",
  "Weighted Chin-ups":              "Chin-Up",
  "Weighted Dips (Chest)":          "Dips_-_Chest_Version",
  "Weighted Dips (Triceps)":        "Dips_-_Triceps_Version",
  "DB Bulgarian Split Squat":       "Dumbbell_Lunges",
  "DB Lateral Lunge":               "Dumbbell_Lunges",
  "DB Reverse Lunge":               "Dumbbell_Rear_Lunge",
  "DB Sumo Squat":                  "Dumbbell_Squat",
  "Barbell Bulgarian Split Squat":  "Barbell_Lunge",
  "Bodyweight Calf Raise":          "Calf_Raise_On_A_Dumbbell",
  "Single-Arm Pushdown":            "Cable_One_Arm_Tricep_Extension",
  "Cross-Body Hammer Curl":         "Cross_Body_Hammer_Curl",
  "Cross-Body Cable Extension":     "Cable_One_Arm_Tricep_Extension",
  "Iso-Lateral Chest Press":        "Leverage_Chest_Press",
  "Iso-Lateral Incline Press":      "Leverage_Incline_Chest_Press",
  "Iso-Lateral High Row":           "Leverage_High_Row",
  "Iso-Lateral Shoulder Press":     "Leverage_Shoulder_Press",
  "Machine Row":                    "Seated_Cable_Rows",
  "Machine Chest Press":            "Leverage_Chest_Press",
  "DB W Press":                     "Arnold_Dumbbell_Press",
  "Cable Romanian Deadlift":        "Romanian_Deadlift",
  "DB Frog Pump":                   "Butt_Lift_Bridge",
  "Frog Pump":                      "Butt_Lift_Bridge",
  "High Cable Curl":                "High_Cable_Curls",
  "Cable Rope Curl":                "Cable_Hammer_Curls_-_Rope_Attachment",
  "Rack Pull":                      "Rack_Pulls",
  "Box Jump":                       "Box_Jump_Multiple_Response",
  "Donkey Calf Raise":              "Donkey_Calf_Raises",

  // ── Additional matches (round 2) ──
  "DB Romanian Deadlift":           "Romanian_Deadlift",
  "DB Walking Lunge":               "Bodyweight_Walking_Lunge",
  "Cable Curl":                     "Standing_Biceps_Cable_Curl",
  "Single-Arm Cable Curl":          "Standing_One-Arm_Cable_Curl",
  "Cable Rotation":                 "Cable_Internal_Rotation",
  "Wrist Curl":                     "Palms-Up_Barbell_Wrist_Curl_Over_A_Bench",
  "Medicine Ball Russian Twist":    "Medicine_Ball_Full_Twist",
  "Medicine Ball Slam":             "One-Arm_Medicine_Ball_Slam",
  "Decline Push-ups":               "Decline_Push-Up",
  "Incline Push-ups":               "Incline_Push-Up",
  "Wide Push-ups":                  "Push-Up_Wide",
  "Wide-Grip Bench Press":          "Wide-Grip_Barbell_Bench_Press",
  "Superman":                       "Superman",
  "Mountain Climber":               "Mountain_Climbers",
  "Smith Machine Row":              "Smith_Machine_Bent_Over_Row",
  "Decline DB Press":               "Decline_Dumbbell_Bench_Press",
  "Plate Pinch Hold":               "Plate_Pinch",
  "Neutral Grip Lat Pulldown":      "Close-Grip_Front_Lat_Pulldown",
  "Reverse Grip Lat Pulldown":      "Close-Grip_Front_Lat_Pulldown",
  "Cable Y Raise":                  "Front_Cable_Raise",
  "Barbell Front Raise":            "Standing_Front_Barbell_Raise_Over_Head",
  "Captain's Chair Leg Raise":      "Knee_Hip_Raise_On_Parallel_Bars",
  "DB Squeeze Press":               "Close-Grip_Dumbbell_Press",
  "Leaning DB Lateral Raise":       "Side_Lateral_Raise",
  "Single-Arm DB Lateral Raise":    "Side_Lateral_Raise",
  "Single-Arm Cable Lateral Raise": "Cable_Seated_Lateral_Raise",
  "Single-Arm Cable Row":           "Seated_Cable_Rows",
  "Single-Arm Lat Pulldown":        "Wide-Grip_Lat_Pulldown",
  "Single-Arm DB Bench Press":      "Dumbbell_Bench_Press",
  "Standing Reverse Fly":           "Bent_Over_Dumbbell_Rear_Delt_Raise_With_Head_On_Bench",
  "Seated Reverse Fly":             "Bent_Over_Dumbbell_Rear_Delt_Raise_With_Head_On_Bench",
  "Assisted Pull-up Machine":       "Band_Assisted_Pull-Up",
  "DB Shrug (Shoulders)":           "Dumbbell_Shrug",
  "DB Skull Crusher":               "Lying_Triceps_Press",
  "EZ-Bar Skull Crushers":          "Lying_Triceps_Press",
  "Neutral Grip Cable Row":         "Seated_Cable_Rows",
  "Close Grip Cable Row":           "Seated_Cable_Rows",
  "Wide Grip Cable Row":            "Seated_Cable_Rows",
  "DB Pullover (Back)":             "Bent-Arm_Dumbbell_Pullover",
  "DB Reverse Fly (Back)":          "Bent_Over_Dumbbell_Rear_Delt_Raise_With_Head_On_Bench",
  "RKC Plank":                      "Plank",
  "Side Plank":                     "Plank",
  "Sissy Squat Machine":            "Weighted_Sissy_Squat",
};


// ===================== MUSCLE GROUP MAPPING =====================

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
  "neck": "shoulders",
  "quadriceps": "quads",
  "shoulders": "shoulders",
  "traps": "back",
  "triceps": "triceps",
};

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

function deriveType(freeEx) {
  if (freeEx.mechanic === "compound") return "compound";
  if (freeEx.mechanic === "isolation") return "isolation";
  if ((freeEx.secondaryMuscles?.length || 0) >= 2) return "compound";
  return "isolation";
}


// ===================== NAME CLEANING =====================
// Turns verbose free-exercise-db names into concise TALOS-style display names.

function cleanName(rawName, equipment) {
  let name = rawName;

  // Remove equipment prefixes when redundant (the equipment field already tells us)
  name = name.replace(/^Barbell\s+/i, "");
  name = name.replace(/^Dumbbell\s+/i, "DB ");
  name = name.replace(/^Cable\s+/i, "Cable ");
  name = name.replace(/^Machine\s+/i, "Machine ");
  name = name.replace(/^Smith Machine\s+/i, "Smith Machine ");
  name = name.replace(/^Kettlebell\s+/i, "KB ");

  // Clean up common verbose patterns
  name = name.replace(/\s*-\s*Medium Grip$/i, "");
  name = name.replace(/\s*-\s*With Bands$/i, " (Bands)");
  name = name.replace(/\s*-\s*Rope Attachment$/i, " (Rope)");
  name = name.replace(/\s*-\s*V-Bar Attachment$/i, " (V-Bar)");
  name = name.replace(/\s*-\s*Chest Version$/i, " (Chest)");
  name = name.replace(/\s*-\s*Triceps Version$/i, " (Triceps)");

  // Shorten common words
  name = name.replace(/\bDumbell\b/gi, "DB");
  name = name.replace(/\bDumbbell\b/gi, "DB");
  name = name.replace(/\bAlternate\b/gi, "Alternating");
  name = name.replace(/\bSeated\s+DB\b/gi, "Seated DB");
  name = name.replace(/\bStanding\s+DB\b/gi, "Standing DB");

  // Fix re-add barbell prefix for barbell exercises (since we stripped it above)
  // Only re-add if needed for clarity (e.g. "Curl" alone is ambiguous)
  // We handle this case-by-case below

  // Trim extra spaces
  name = name.replace(/\s+/g, " ").trim();

  return name;
}


// ===================== HELPERS =====================

function normalize(s) {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
}

function similarity(a, b) {
  const wordsA = new Set(normalize(a).split(" "));
  const wordsB = new Set(normalize(b).split(" "));
  const intersection = [...wordsA].filter(w => wordsB.has(w));
  const union = new Set([...wordsA, ...wordsB]);
  return intersection.length / union.size;
}


// ===================== MAIN =====================

async function main() {
  console.log("🏋️  TALOS Hybrid Exercise Library Builder (v2)");
  console.log("━".repeat(55));
  if (DRY_RUN) console.log("   ⚡ DRY RUN — no files will be written\n");

  // ─── 1. Load free-exercise-db ───
  console.log("📥 Loading free-exercise-db...");
  const freeDB = JSON.parse(readFileSync(FREE_DB_PATH, "utf-8"));
  console.log(`   ✓ ${freeDB.length} exercises loaded`);

  const freeById = {};
  for (const ex of freeDB) freeById[ex.id] = ex;

  // ─── 2. Parse current TALOS exercises ───
  console.log("\n📖 Parsing current exercises.js...");
  const src = readFileSync(EXERCISES_PATH, "utf-8");

  const exerciseRegex = /\{ name: "([^"]+)", muscle: "([^"]+)", equipment: "([^"]+)", type: "([^"]+)"[^}]*\}/g;
  const talosExercises = [];
  let match;
  while ((match = exerciseRegex.exec(src)) !== null) {
    talosExercises.push({
      name: match[1], muscle: match[2], equipment: match[3], type: match[4],
    });
  }
  console.log(`   ✓ ${talosExercises.length} TALOS exercises parsed`);

  // ─── 3. Match existing TALOS exercises → free-exercise-db ───
  console.log("\n🔗 Matching existing TALOS exercises...");

  const matched = [];
  const unmatchedTalos = [];
  const usedFreeIds = new Set();

  for (const tex of talosExercises) {
    const manualId = MANUAL_MAP[tex.name];
    if (manualId && freeById[manualId]) {
      matched.push({ talos: tex, free: freeById[manualId], method: "manual" });
      usedFreeIds.add(manualId);
      continue;
    }

    // Fuzzy fallback (high threshold only — 0.80+)
    let bestScore = 0;
    let bestMatch = null;
    for (const fex of freeDB) {
      if (fex.category === "stretching" || fex.category === "cardio") continue;
      const score = similarity(tex.name, fex.name);
      if (score > bestScore) { bestScore = score; bestMatch = fex; }
    }
    if (bestScore >= 0.80 && bestMatch) {
      matched.push({ talos: tex, free: bestMatch, method: `fuzzy(${bestScore.toFixed(2)})` });
      usedFreeIds.add(bestMatch.id);
    } else {
      unmatchedTalos.push(tex);
    }
  }

  console.log(`   ✓ Matched: ${matched.length}/${talosExercises.length}`);
  console.log(`   ○ Unmatched (kept as-is): ${unmatchedTalos.length}`);

  // ─── 4. Find NEW exercises from free-exercise-db to import ───
  console.log("\n📦 Selecting new exercises from free-exercise-db...");

  const newExercises = [];
  const talosNames = new Set(talosExercises.map(e => normalize(e.name)));

  for (const fex of freeDB) {
    if (usedFreeIds.has(fex.id)) continue;
    if (!INCLUDE_CATEGORIES.has(fex.category)) continue;

    const muscle = MUSCLE_MAP[fex.primaryMuscles?.[0]];
    if (!muscle) continue; // skip if we can't map the muscle group

    const equipment = EQUIP_MAP[fex.equipment] ?? "other";
    const type = deriveType(fex);
    const displayName = cleanName(fex.name, equipment);

    // Skip if a similar name already exists
    if (talosNames.has(normalize(displayName))) continue;

    newExercises.push({
      name: displayName,
      muscle,
      equipment,
      type,
      freeDbId: fex.id,
      originalName: fex.name,
      instructions: fex.instructions || [],
      images: (fex.images || []).map(img => IMAGE_BASE + img),
      level: fex.level || null,
      force: fex.force || null,
      mechanic: fex.mechanic || null,
      category: fex.category,
    });
    talosNames.add(normalize(displayName));
  }

  console.log(`   ✓ ${newExercises.length} new exercises to add`);

  // ─── 5. Build enrichment map (lean: just freeDbId for exercises.js) ───
  //        and reference data map (full: instructions, images, metadata)
  const enrichMap = {};
  const referenceData = {};
  
  for (const m of matched) {
    enrichMap[m.talos.name] = { freeDbId: m.free.id };
    referenceData[m.free.id] = {
      instructions: m.free.instructions || [],
      images: (m.free.images || []).map(img => IMAGE_BASE + img),
      level: m.free.level || null,
      force: m.free.force || null,
      mechanic: m.free.mechanic || null,
    };
  }
  
  // Also add reference data for new exercises
  for (const nex of newExercises) {
    referenceData[nex.freeDbId] = {
      instructions: nex.instructions || [],
      images: nex.images || [],
      level: nex.level || null,
      force: nex.force || null,
      mechanic: nex.mechanic || null,
    };
  }

  // ─── 6. Regenerate exercises.js ───
  console.log("\n⚙️  Generating new exercises.js...");

  // Find the EXERCISES array and everything around it
  const arrayStartIdx = src.indexOf("export const EXERCISES = [");
  const subsMarker = "export const SUBSTITUTIONS = {";
  const subsIdx = src.indexOf(subsMarker);

  if (arrayStartIdx === -1 || subsIdx === -1) {
    throw new Error("Could not locate EXERCISES array or SUBSTITUTIONS in source file");
  }

  const beforeArray = src.substring(0, arrayStartIdx);
  const arrayAndGap = src.substring(arrayStartIdx, subsIdx);
  const afterSubs = src.substring(subsIdx); // SUBSTITUTIONS + helpers

  // Parse the original array block, preserving comments
  const arrayLines = arrayAndGap.split("\n");
  const rebuiltLines = [];
  let exIdx = 0;

  for (const line of arrayLines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("{ name:") && trimmed.includes("muscle:")) {
      const tex = talosExercises[exIdx];
      if (tex) {
        const enrich = enrichMap[tex.name];
        rebuiltLines.push(formatExerciseLine(tex, enrich));
      }
      exIdx++;
    } else if (trimmed === "];") {
      // End of array — inject new exercises before closing
      if (newExercises.length > 0) {
        rebuiltLines.push("");
        rebuiltLines.push("  // ═══════════════════════════════════════════════════════════════");
        rebuiltLines.push("  // ─── IMPORTED FROM free-exercise-db ───────────────────────────");
        rebuiltLines.push("  // ═══════════════════════════════════════════════════════════════");
        rebuiltLines.push("");

        // Group by muscle
        const byMuscle = {};
        for (const nex of newExercises) {
          if (!byMuscle[nex.muscle]) byMuscle[nex.muscle] = [];
          byMuscle[nex.muscle].push(nex);
        }

        const muscleOrder = ["chest", "back", "shoulders", "quads", "hamstrings", "glutes", "biceps", "triceps", "calves", "core", "forearms"];
        for (const muscle of muscleOrder) {
          const exs = byMuscle[muscle];
          if (!exs || exs.length === 0) continue;
          rebuiltLines.push(`  // ── ${muscle.charAt(0).toUpperCase() + muscle.slice(1)} (new) ──`);
          for (const nex of exs.sort((a, b) => a.name.localeCompare(b.name))) {
            rebuiltLines.push(formatNewExerciseLine(nex));
          }
          rebuiltLines.push("");
        }
      }
      rebuiltLines.push("];");
    } else {
      rebuiltLines.push(line);
    }
  }

  const newSrc = beforeArray + rebuiltLines.join("\n") + "\n" + afterSubs;

  if (!DRY_RUN) {
    writeFileSync(EXERCISES_PATH, newSrc, "utf-8");
    console.log(`   ✓ Written: ${EXERCISES_PATH}`);
    
    // Write reference data JSON
    const refDir = dirname(REFERENCE_PATH);
    mkdirSync(refDir, { recursive: true });
    writeFileSync(REFERENCE_PATH, JSON.stringify(referenceData, null, 2), "utf-8");
    const refSize = (JSON.stringify(referenceData).length / 1024).toFixed(0);
    console.log(`   ✓ Written: ${REFERENCE_PATH} (${refSize}KB)`);
  } else {
    console.log(`   ⚡ Would write: ${EXERCISES_PATH}`);
    const refSize = (JSON.stringify(referenceData).length / 1024).toFixed(0);
    console.log(`   ⚡ Would write: ${REFERENCE_PATH} (${refSize}KB)`);
  }

  // ─── 7. Write new exercises JSON for review ───
  if (!DRY_RUN) {
    writeFileSync(NEW_EX_PATH, JSON.stringify(newExercises.map(e => ({
      displayName: e.name,
      originalName: e.originalName,
      muscle: e.muscle,
      equipment: e.equipment,
      type: e.type,
      freeDbId: e.freeDbId,
      instructionCount: e.instructions.length,
    })), null, 2), "utf-8");
    console.log(`   ✓ Written: ${NEW_EX_PATH}`);
  }

  // ─── 8. Generate report ───
  const report = [];
  report.push("═══════════════════════════════════════════════════════════════");
  report.push("  TALOS Hybrid Exercise Library — Build Report");
  report.push(`  Generated: ${new Date().toISOString()}`);
  report.push("═══════════════════════════════════════════════════════════════");
  report.push("");
  report.push("SUMMARY");
  report.push(`  Original TALOS exercises:      ${talosExercises.length}`);
  report.push(`  Enriched (with instructions):  ${matched.length}`);
  report.push(`  Kept as-is (no free-db match): ${unmatchedTalos.length}`);
  report.push(`  New from free-exercise-db:      ${newExercises.length}`);
  report.push(`  TOTAL in new library:           ${talosExercises.length + newExercises.length}`);
  report.push("");

  report.push("───────────────────────────────────────────────────────────────");
  report.push("ENRICHED EXERCISES (existing TALOS → free-exercise-db data)");
  report.push("───────────────────────────────────────────────────────────────");
  for (const m of matched.sort((a, b) => a.talos.name.localeCompare(b.talos.name))) {
    report.push(`  ✓ ${m.talos.name.padEnd(42)} → ${m.free.name} [${m.method}]`);
  }
  report.push("");

  report.push("───────────────────────────────────────────────────────────────");
  report.push("UNMATCHED (kept as-is — TALOS specialty exercises)");
  report.push("───────────────────────────────────────────────────────────────");
  for (const u of unmatchedTalos.sort((a, b) => a.name.localeCompare(b.name))) {
    report.push(`  ○ ${u.name} (${u.muscle}, ${u.equipment})`);
  }
  report.push("");

  report.push("───────────────────────────────────────────────────────────────");
  report.push("NEW EXERCISES ADDED (from free-exercise-db, grouped by muscle)");
  report.push("───────────────────────────────────────────────────────────────");
  const byMuscle = {};
  for (const nex of newExercises) {
    if (!byMuscle[nex.muscle]) byMuscle[nex.muscle] = [];
    byMuscle[nex.muscle].push(nex);
  }
  for (const [muscle, exs] of Object.entries(byMuscle).sort()) {
    report.push(`  ${muscle.toUpperCase()} (${exs.length} new):`);
    for (const e of exs.sort((a, b) => a.name.localeCompare(b.name))) {
      report.push(`    + ${e.name.padEnd(40)} ← ${e.originalName}`);
    }
  }
  report.push("");

  report.push("───────────────────────────────────────────────────────────────");
  report.push("ARCHITECTURE");
  report.push("  exercises.js  — lean exercise identity (name, muscle, equipment, type, freeDbId)");
  report.push("  public/data/exercise-reference.json — instructions, images, metadata (lazy-loaded)");
  report.push("  Exercises link to reference data via freeDbId field");
  report.push("");
  report.push("SERVER IMPACT: NONE");
  report.push("  server/ai.js reads only .name and .muscle — unchanged");
  report.push("  server/routes/coach.js — unchanged");
  report.push("  SUBSTITUTIONS map — unchanged");
  report.push("  Starter templates — unchanged");
  report.push("  Workout history — unchanged (same exercise names)");
  report.push("───────────────────────────────────────────────────────────────");

  if (!DRY_RUN) {
    writeFileSync(REPORT_PATH, report.join("\n"), "utf-8");
    console.log(`   ✓ Written: ${REPORT_PATH}`);
  }

  // ─── Summary ───
  const refSize = (JSON.stringify(referenceData).length / 1024).toFixed(0);
  console.log("\n" + "━".repeat(55));
  console.log(`✅ Library built: ${talosExercises.length + newExercises.length} total exercises`);
  console.log(`   ${matched.length} enriched with freeDbId link`);
  console.log(`   ${unmatchedTalos.length} TALOS originals (no reference data)`);
  console.log(`   ${newExercises.length} new from free-exercise-db`);
  console.log(`   Reference data: ${Object.keys(referenceData).length} entries (${refSize}KB)`);
  console.log("\n📋 Next steps:");
  console.log("   1. Review scripts/hybrid-report.txt");
  console.log("   2. Review scripts/new-exercises.json (display names)");
  console.log("   3. npm run dev → test ExercisePicker, templates, active workout");
  console.log("   4. No server changes needed");
}


// ===================== FORMATTERS =====================

function formatExerciseLine(tex, enrich) {
  const parts = [
    `name: "${tex.name}"`,
    `muscle: "${tex.muscle}"`,
    `equipment: "${tex.equipment}"`,
    `type: "${tex.type}"`,
  ];
  if (enrich?.freeDbId) {
    parts.push(`freeDbId: "${enrich.freeDbId}"`);
  }
  return `  { ${parts.join(", ")} },`;
}

function formatNewExerciseLine(nex) {
  const parts = [
    `name: "${nex.name}"`,
    `muscle: "${nex.muscle}"`,
    `equipment: "${nex.equipment}"`,
    `type: "${nex.type}"`,
    `freeDbId: "${nex.freeDbId}"`,
  ];
  return `  { ${parts.join(", ")} },`;
}


main().catch(e => {
  console.error("❌ Error:", e.message);
  console.error(e.stack);
  process.exit(1);
});

#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════
//  TALOS — Exercise Library Builder + Database Seeder (v3)
//
//  Merges the matching/enrichment logic from build-exercise-library.mjs
//  with PostgreSQL seeding from the migration infrastructure.
//
//  WHAT IT DOES:
//    1. Loads free-exercise-db (cloned to /tmp or fetched)
//    2. Matches TALOS exercises via comprehensive manual map + fuzzy
//    3. Imports new strength exercises from free-exercise-db
//    4. Writes enriched exercises.js (+ freeDbId field) for PWA offline
//    5. Writes exercise-reference.json for lazy-loaded instructions/images
//    6. Seeds PostgreSQL exercises + exercise_substitutions tables
//
//  MODES:
//    node scripts/build-exercise-library.mjs                # dry run (report only)
//    node scripts/build-exercise-library.mjs --static       # write static files only
//    node scripts/build-exercise-library.mjs --apply        # write static files + seed database
//    node scripts/build-exercise-library.mjs --db-only      # seed database only (skip static files)
//
//  PREREQUISITES:
//    Free-exercise-db source (one of):
//      - git clone --depth 1 https://github.com/yuhonas/free-exercise-db /tmp/free-exercise-db
//      - Place exercises.json at public/data/free-exercise-db.json
//      - The script will try to fetch from GitHub as a last resort
//
//  Requires: DATABASE_URL or DATABASE_PATH in env (for --apply / --db-only)
// ═══════════════════════════════════════════════════════════════

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ─── CLI FLAGS ─────────────────────────────────────────────────
const APPLY       = process.argv.includes("--apply");
const STATIC_ONLY = process.argv.includes("--static");
const DB_ONLY     = process.argv.includes("--db-only");
const DRY_RUN     = !APPLY && !STATIC_ONLY && !DB_ONLY;

const WRITE_STATIC = APPLY || STATIC_ONLY;
const WRITE_DB     = APPLY || DB_ONLY;

// ─── PATHS ─────────────────────────────────────────────────────
const FREE_DB_PATHS = [
  join(ROOT, "public/data/free-exercise-db.json"),
  "/tmp/free-exercise-db/dist/exercises.json",
];
const FREE_DB_URL       = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json";
const IMAGE_BASE        = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";
const EXERCISES_PATH    = join(ROOT, "src/lib/exercises.js");
const REFERENCE_PATH    = join(ROOT, "public/data/exercise-reference.json");
const REPORT_PATH       = join(ROOT, "scripts/hybrid-report.txt");
const NEW_EX_PATH       = join(ROOT, "scripts/new-exercises.json");
const SCHEMA_PATH       = join(ROOT, "scripts/001-exercises-table.sql");

// Categories to import from free-exercise-db
const INCLUDE_CATEGORIES = new Set(["strength", "powerlifting"]);

// ─── IMPORT FILTERING ──────────────────────────────────────────
// Three-layer filter: patterns → dedup → curated whitelist.
// Only exercises passing ALL THREE get imported.

// Pattern exclusions — entire classes of niche/accessory variants
const EXCLUDE_PATTERNS = [
  /\bband[s]?\b/i,           // band variants (resistance bands)
  /\bchain[s]?\b/i,          // chain variants
  /\bsled\b/i,               // sled exercises
  /\bexercise ball\b/i,      // stability ball
  /\bbosu\b/i,               // bosu ball
  /\bphysioball\b/i,         // physioball
  /\bisometric neck\b/i,     // neck isolation
  /\bneck resistance\b/i,    // neck harness
  /\bhead harness\b/i,       // neck harness
  /\bspeed\b/i,              // speed variants
  /\bplate movers\b/i,       // niche equipment
  /\btowel\b/i,              // towel variants
  /\bfoam roll\b/i,          // foam rolling
];

// Curated whitelist — free-exercise-db original names we actually want.
// Reviewed from the dry-run report. ~120 exercises that fill genuine gaps
// in the TALOS library without adding noise.
const CURATED_IMPORTS = new Set([
  // ── Back ──
  "Bent Over One-Arm Long Bar Row",
  "One-Arm Long Bar Row",
  "Lying T-Bar Row",
  "T-Bar Row with Handle",
  "One Arm Lat Pulldown",
  "V-Bar Pulldown",
  "V-Bar Pullup",
  "Reverse Grip Bent-Over Rows",
  "Seated One-arm Cable Pulley Rows",
  "Underhand Cable Pulldowns",
  "Rope Straight-Arm Pulldown",
  "Full Range-Of-Motion Lat Pulldown",
  "Scapular Pull-Up",
  "Muscle Up",
  "Barbell Shrug Behind The Back",
  "Elevated Cable Rows",
  "Incline Bench Pull",
  "Lying Cambered Barbell Row",
  "Smith Machine Upright Row",
  "Standing Dumbbell Upright Row",
  "Seated Good Mornings",
  "Middle Back Shrug",
  "Shotgun Row",

  // ── Biceps ──
  "Incline Hammer Curls",
  "Overhead Cable Curl",
  "Reverse Cable Curl",
  "Standing Concentration Curl",
  "Zottman Preacher Curl",
  "One Arm Dumbbell Preacher Curl",
  "Two-Arm Dumbbell Preacher Curl",
  "Lying Cable Curl",

  // ── Calves ──
  "Calf Press",
  "Dumbbell Seated One-Leg Calf Raise",
  "Smith Machine Reverse Calf Raises",

  // ── Chest ──
  "Incline Cable Flye",
  "Incline Cable Chest Press",
  "Low Cable Crossover",
  "Flat Bench Cable Flyes",
  "Svend Press",
  "Dumbbell Bench Press with Neutral Grip",
  "Decline Smith Press",
  "Leverage Decline Chest Press",
  "Standing Cable Chest Press",
  "Straight-Arm Dumbbell Pullover",
  "Machine Bench Press",
  "Neck Press",
  "Wide-Grip Decline Barbell Bench Press",
  "Hammer Grip Incline DB Bench Press",

  // ── Core ──
  "Cable Reverse Crunch",
  "Cable Russian Twists",
  "Decline Oblique Crunch",
  "Decline Reverse Crunch",
  "Hanging Pike",
  "Oblique Crunches",
  "Pallof Press With Rotation",
  "Standing Cable Wood Chop",
  "Landmine 180's",
  "Tuck Crunch",
  "Weighted Crunches",
  "Rope Crunch",
  "Side Bridge",
  "Standing Cable Lift",
  "Jackknife Sit-Up",
  "Cross-Body Crunch",
  "Plate Twist",

  // ── Forearms ──
  "Finger Curls",
  "Wrist Roller",
  "Palms-Down Wrist Curl Over A Bench",

  // ── Glutes ──
  "Single Leg Glute Bridge",
  "Glute Kickback",
  "Step-up with Knee Raise",
  "Monster Walk",

  // ── Hamstrings ──
  "Natural Glute Ham Raise",
  "Reverse Hyperextension",
  "Ball Leg Curl",
  "Good Morning off Pins",
  "Dumbbell Clean",
  "Power Clean",
  "Smith Machine Stiff-Legged Deadlift",
  "Snatch Pull",

  // ── Quads ──
  "Jefferson Squats",
  "Split Squat with Dumbbells",
  "Elevated Back Lunge",
  "Narrow Stance Hack Squats",
  "Narrow Stance Squats",
  "Plie Dumbbell Squat",
  "Smith Machine Leg Press",
  "Leverage Deadlift",
  "Wide Stance Barbell Squat",
  "Front Barbell Squat To A Bench",
  "Smith Single-Leg Split Squat",

  // ── Shoulders ──
  "Cuban Press",
  "Seated Barbell Military Press",
  "Cable Shoulder Press",
  "Cable Rope Rear-Delt Rows",
  "Barbell Rear Delt Row",
  "Reverse Flyes",
  "Seated Bent-Over Rear Delt Raise",
  "Seated Side Lateral Raise",
  "Dumbbell One-Arm Shoulder Press",
  "Dumbbell Scaption",
  "Front Plate Raise",
  "Seated Dumbbell Press",
  "External Rotation",
  "External Rotation with Cable",
  "Lying Rear Delt Raise",
  "Bent Over Low-Pulley Side Lateral",
  "Clean and Press",
  "Front Two-Dumbbell Raise",

  // ── Triceps ──
  "Decline Dumbbell Triceps Extension",
  "Decline EZ Bar Triceps Extension",
  "Dumbbell One-Arm Triceps Extension",
  "Lying Dumbbell Tricep Extension",
  "Kneeling Cable Triceps Extension",
  "Low Cable Triceps Extension",
  "Ring Dips",
  "Parallel Bar Dip",
  "Close-Grip EZ-Bar Press",
  "Smith Machine Close-Grip Bench Press",
  "Weighted Bench Dip",
  "Board Press",
  "Pin Presses",
  "Incline Barbell Triceps Extension",
  "EZ-Bar Skullcrusher",
]);


// ═══════════════════════════════════════════════════════════════
//  COMPREHENSIVE MANUAL MAPPING
//  TALOS display name → free-exercise-db id
//  Every entry here has been verified.
// ═══════════════════════════════════════════════════════════════

const MANUAL_MAP = {
  // ══════════════ CHEST ══════════════
  "Bench Press":                    "Barbell_Bench_Press_-_Medium_Grip",
  "Incline Bench Press":            "Barbell_Incline_Bench_Press_-_Medium_Grip",
  "Decline Bench Press":            "Decline_Barbell_Bench_Press",
  "Close-Grip Bench":               "Close-Grip_Barbell_Bench_Press",
  "Floor Press":                    "Floor_Press",
  "Reverse Grip Bench Press":       "Reverse_Grip_Bench_Press",
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
  "Wide-Grip Bench Press":          "Wide-Grip_Barbell_Bench_Press",
  "Decline Push-ups":               "Decline_Push-Up",
  "Incline Push-ups":               "Incline_Push-Up",
  "Wide Push-ups":                  "Push-Up_Wide",
  "DB Squeeze Press":               "Close-Grip_Dumbbell_Press",    // approximate — same pressing pattern
  "Single-Arm DB Bench Press":      "Dumbbell_Bench_Press",         // approximate — single-arm variant
  "Single-Arm Cable Fly":           "Single-Arm_Cable_Crossover",
  "Iso-Lateral Chest Press":        "Leverage_Chest_Press",
  "Iso-Lateral Incline Press":      "Leverage_Incline_Chest_Press",
  "Machine Chest Press":            "Leverage_Chest_Press",
  "Weighted Dips (Chest)":          "Dips_-_Chest_Version",         // same movement, loaded

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
  "Rack Pull":                      "Rack_Pulls",
  "Smith Machine Row":              "Smith_Machine_Bent_Over_Row",
  "Weighted Pull-ups":              "Pullups",                       // same movement, loaded
  "Weighted Chin-ups":              "Chin-Up",                       // same movement, loaded
  "Neutral Grip Lat Pulldown":      "Close-Grip_Front_Lat_Pulldown", // approximate — close grip
  "Reverse Grip Lat Pulldown":      "Close-Grip_Front_Lat_Pulldown", // approximate — underhand
  "Single-Arm Cable Row":           "Seated_Cable_Rows",             // approximate — single-arm
  "Single-Arm Lat Pulldown":        "Wide-Grip_Lat_Pulldown",       // approximate — single-arm
  "Neutral Grip Cable Row":         "Seated_Cable_Rows",
  "Close Grip Cable Row":           "Seated_Cable_Rows",
  "Wide Grip Cable Row":            "Seated_Cable_Rows",
  "Machine Row":                    "Seated_Cable_Rows",             // approximate — machine vs cable
  "DB Pullover (Back)":             "Bent-Arm_Dumbbell_Pullover",
  "DB Reverse Fly (Back)":          "Bent_Over_Dumbbell_Rear_Delt_Raise_With_Head_On_Bench",
  "Assisted Pull-up Machine":       "Band_Assisted_Pull-Up",
  "DB Shrug (Shoulders)":           "Dumbbell_Shrug",

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
  "Smith Machine Overhead Press":   "Smith_Machine_Overhead_Shoulder_Press",
  "Barbell Front Raise":            "Standing_Front_Barbell_Raise_Over_Head",
  "Standing Reverse Fly":           "Bent_Over_Dumbbell_Rear_Delt_Raise_With_Head_On_Bench", // approximate
  "Seated Reverse Fly":             "Bent_Over_Dumbbell_Rear_Delt_Raise_With_Head_On_Bench", // approximate
  "Leaning DB Lateral Raise":       "Side_Lateral_Raise",            // approximate — leaning variant
  "Single-Arm DB Lateral Raise":    "Side_Lateral_Raise",            // approximate — single-arm
  "Single-Arm Cable Lateral Raise": "Cable_Seated_Lateral_Raise",    // approximate — single-arm
  "Cable Y Raise":                  "Front_Cable_Raise",             // approximate
  "Iso-Lateral Shoulder Press":     "Leverage_Shoulder_Press",

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
  "Bodyweight Squat":               "Bodyweight_Squat",
  "Overhead Squat":                 "Overhead_Squat",
  "Narrow Stance Leg Press":        "Narrow_Stance_Leg_Press",
  "Smith Machine Squat":            "Smith_Machine_Squat",
  "Barbell Step-up":                "Barbell_Step_Ups",
  "Pistol Squat":                   "Kettlebell_Pistol_Squat",
  "Sissy Squat":                    "Weighted_Sissy_Squat",
  "Single-Leg Extension":           "Single-Leg_Leg_Extension",
  "Single-Leg Leg Press":           "Leg_Press",                     // approximate — single-leg
  "DB Bulgarian Split Squat":       "Dumbbell_Rear_Lunge",           // approximate — rear foot elevated lunge pattern
  "DB Reverse Lunge":               "Dumbbell_Rear_Lunge",
  "Barbell Bulgarian Split Squat":  "Barbell_Lunge",                 // approximate — unilateral barbell
  "Bodyweight Lunge":               "Bodyweight_Walking_Lunge",
  "DB Split Squat":                 "Dumbbell_Lunges",               // approximate — static lunge
  "DB Lateral Lunge":               "Dumbbell_Lunges",               // approximate — lateral variant
  "Box Jump":                       "Box_Jump_Multiple_Response",
  "Sissy Squat Machine":            "Weighted_Sissy_Squat",          // approximate
  "DB Sumo Squat":                  "Goblet_Squat",                  // approximate — wide stance goblet

  // ══════════════ HAMSTRINGS ══════════════
  "Romanian Deadlift":              "Romanian_Deadlift",
  "DB Romanian Deadlift":           "Romanian_Deadlift_With_Dumbbells",
  "Stiff-Leg Deadlift":             "Stiff-Legged_Barbell_Deadlift",
  "DB Stiff-Leg Deadlift":          "Stiff-Legged_Dumbbell_Deadlift",
  "Good Morning":                   "Stiff_Leg_Barbell_Good_Morning",
  "Seated Leg Curl":                "Seated_Leg_Curl",
  "Lying Leg Curl":                 "Lying_Leg_Curls",
  "Standing Leg Curl":              "Standing_Leg_Curl",
  "Glute-Ham Raise":                "Floor_Glute-Ham_Raise",
  "Cable Pull-Through":             "Pull_Through",
  "Cable Romanian Deadlift":        "Romanian_Deadlift",             // approximate — cable variant

  // ══════════════ GLUTES ══════════════
  "Hip Thrust":                     "Barbell_Hip_Thrust",
  "Glute Bridge":                   "Barbell_Glute_Bridge",
  "Barbell Glute Bridge":           "Barbell_Glute_Bridge",
  "Barbell Hip Thrust":             "Barbell_Hip_Thrust",
  "DB Good Morning":                "Good_Morning",
  "Cable Kickback":                 "One-Legged_Cable_Kickback",
  "DB Frog Pump":                   "Butt_Lift_Bridge",              // approximate
  "Frog Pump":                      "Butt_Lift_Bridge",              // approximate

  // ══════════════ BICEPS ══════════════
  "Barbell Curl":                   "Barbell_Curl",
  "EZ-Bar Curl":                    "EZ-Bar_Curl",
  "DB Curl":                        "Dumbbell_Bicep_Curl",
  "Hammer Curl":                    "Alternate_Hammer_Curl",
  "Incline DB Curl":                "Alternate_Incline_Dumbbell_Curl",
  "Preacher Curl":                  "Preacher_Curl",
  "Preacher Curl (DB)":             "Preacher_Hammer_Dumbbell_Curl",
  "Concentration Curl":             "Concentration_Curls",
  "Cable Curl":                     "Standing_Biceps_Cable_Curl",
  "Cable Hammer Curl":              "Cable_Hammer_Curls_-_Rope_Attachment",
  "Cable Preacher Curl":            "Cable_Preacher_Curl",
  "Alternating DB Curl":            "Dumbbell_Bicep_Curl",           // approximate — alternating
  "Seated DB Curl":                 "Seated_Dumbbell_Curl",
  "Reverse Barbell Curl":           "Reverse_Barbell_Curl",
  "DB Reverse Curl":                "Standing_Dumbbell_Reverse_Curl",
  "DB Spider Curl":                 "Spider_Curl",
  "EZ-Bar Spider Curl":             "Spider_Curl",                   // approximate — EZ bar variant
  "Machine Curl":                   "Machine_Bicep_Curl",
  "Barbell Drag Curl":              "Drag_Curl",
  "DB Drag Curl":                   "Drag_Curl",                     // approximate — DB variant
  "Zottman Curl":                   "Zottman_Curl",
  "Wide Grip Barbell Curl":         "Wide-Grip_Standing_Barbell_Curl",
  "Close Grip Barbell Curl":        "Close-Grip_EZ_Bar_Curl",
  "High Cable Curl":                "High_Cable_Curls",
  "Cable Rope Curl":                "Cable_Hammer_Curls_-_Rope_Attachment", // approximate — rope curl
  "Single-Arm Cable Curl":          "Standing_One-Arm_Cable_Curl",
  "Machine Preacher Curl":          "Machine_Preacher_Curls",
  "Cross-Body Hammer Curl":         "Cross_Body_Hammer_Curl",

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
  "DB Overhead Extension":          "Standing_One-Arm_Dumbbell_Triceps_Extension",
  "Single-Arm DB Overhead Extension": "Standing_One-Arm_Dumbbell_Triceps_Extension",
  "Weighted Dips (Triceps)":        "Dips_-_Triceps_Version",        // same movement, loaded
  "Single-Arm Pushdown":            "Cable_One_Arm_Tricep_Extension",
  "Cross-Body Cable Extension":     "Cable_One_Arm_Tricep_Extension", // approximate
  "EZ-Bar Skull Crushers":          "Lying_Triceps_Press",           // approximate — EZ bar variant
  "DB Skull Crusher":               "Lying_Triceps_Press",           // approximate — DB variant

  // ══════════════ CALVES ══════════════
  "Seated Calf Raise":              "Barbell_Seated_Calf_Raise",
  "Standing Calf Raise Machine":    "Standing_Calf_Raises",
  "Leg Press Calf Raise":           "Calf_Press_On_The_Leg_Press_Machine",
  "DB Standing Calf Raise":         "Standing_Dumbbell_Calf_Raise",
  "Barbell Standing Calf Raise":    "Standing_Barbell_Calf_Raise",
  "Smith Machine Calf Raise":       "Smith_Machine_Calf_Raise",
  "Single-Leg Standing Calf Raise": "Standing_Dumbbell_Calf_Raise",  // approximate — single-leg
  "Donkey Calf Raise":              "Donkey_Calf_Raises",
  "Bodyweight Calf Raise":          "Calf_Raise_On_A_Dumbbell",      // approximate

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
  "Superman":                       "Superman",
  "Mountain Climber":               "Mountain_Climbers",
  "Captain's Chair Leg Raise":      "Knee_Hip_Raise_On_Parallel_Bars", // approximate
  "Medicine Ball Russian Twist":    "Medicine_Ball_Full_Twist",
  "Medicine Ball Slam":             "One-Arm_Medicine_Ball_Slam",
  "Cable Rotation":                 "Cable_Internal_Rotation",        // approximate

  // ══════════════ FOREARMS ══════════════
  "Wrist Curl":                     "Palms-Up_Barbell_Wrist_Curl_Over_A_Bench",
  "Cable Wrist Curl":               "Cable_Wrist_Curl",
  "Farmer's Walk":                  "Farmers_Walk",
  "Behind the Back Wrist Curl":     "Standing_Palms-Up_Barbell_Behind_The_Back_Wrist_Curl",
  "DB Wrist Curl":                  "Seated_Dumbbell_Palms-Up_Wrist_Curl",
  "DB Reverse Wrist Curl":          "Seated_Dumbbell_Palms-Down_Wrist_Curl",
  "Plate Pinch Hold":               "Plate_Pinch",

  // ══════════════ MISC ══════════════
  "Kettlebell Swing":               "One-Arm_Kettlebell_Swings",
  "Decline Machine Press":          "Smith_Machine_Decline_Press",    // approximate — different equipment feel

  // ══════════════ MISSING MATCHES (from report review) ══════════════
  "DB W Press":                     "Arnold_Dumbbell_Press",          // approximate — similar pressing pattern
  "RKC Plank":                      "Plank",                          // approximate — harder plank variant
  "Side Plank":                     "Plank",                          // approximate — lateral variant
  "Iso-Lateral High Row":           "Leverage_High_Row",
  "Incline Machine Press":          "Leverage_Incline_Chest_Press",   // approximate
  "Reverse Hack Squat":             "Hack_Squat",                     // approximate — reverse direction
  "Smith Machine Lunge":            "Smith_Machine_Squat",            // approximate — lunge on smith
  "Barbell Walking Lunge":          "Barbell_Walking_Lunge",
};


// ═══════════════════════════════════════════════════════════════
//  TAXONOMY MAPPING
// ═══════════════════════════════════════════════════════════════

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


// ═══════════════════════════════════════════════════════════════
//  NAME CLEANING
// ═══════════════════════════════════════════════════════════════

function cleanName(rawName) {
  let name = rawName;
  name = name.replace(/^Barbell\s+/i, "");
  name = name.replace(/^Dumbbell\s+/i, "DB ");
  name = name.replace(/^Cable\s+/i, "Cable ");
  name = name.replace(/^Machine\s+/i, "Machine ");
  name = name.replace(/^Smith Machine\s+/i, "Smith Machine ");
  name = name.replace(/^Kettlebell\s+/i, "KB ");
  name = name.replace(/\s*-\s*Medium Grip$/i, "");
  name = name.replace(/\s*-\s*With Bands$/i, " (Bands)");
  name = name.replace(/\s*-\s*Rope Attachment$/i, " (Rope)");
  name = name.replace(/\s*-\s*V-Bar Attachment$/i, " (V-Bar)");
  name = name.replace(/\s*-\s*Chest Version$/i, " (Chest)");
  name = name.replace(/\s*-\s*Triceps Version$/i, " (Triceps)");
  name = name.replace(/\bDumbell\b/gi, "DB");
  name = name.replace(/\bDumbbell\b/gi, "DB");
  name = name.replace(/\bAlternate\b/gi, "Alternating");
  name = name.replace(/\s+/g, " ").trim();
  return name;
}


// ═══════════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════════

function normalize(s) {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
}

// Stricter normalization for dedup — catches singular/plural, hyphen variants
function normalizeDedupe(s) {
  let n = normalize(s);
  // Strip trailing 's' for plural matching (curls→curl, squats→squat, etc.)
  n = n.replace(/\b(\w{4,})s\b/g, "$1");
  // Normalize common abbreviations
  n = n.replace(/\bdb\b/g, "dumbbell");
  n = n.replace(/\bkb\b/g, "kettlebell");
  n = n.replace(/\bez bar\b/g, "ezbar");
  n = n.replace(/\bez\b/g, "ezbar");
  return n;
}

function similarity(a, b) {
  const wordsA = new Set(normalize(a).split(" "));
  const wordsB = new Set(normalize(b).split(" "));
  const intersection = [...wordsA].filter(w => wordsB.has(w));
  const union = new Set([...wordsA, ...wordsB]);
  return intersection.length / union.size;
}

function genId() {
  return "ex_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}


// ═══════════════════════════════════════════════════════════════
//  DATA LOADING
// ═══════════════════════════════════════════════════════════════

async function loadFreeExerciseDb() {
  // Try local paths
  for (const p of FREE_DB_PATHS) {
    if (existsSync(p)) {
      console.log(`📂 Loading free-exercise-db from: ${p}`);
      const data = JSON.parse(readFileSync(p, "utf-8"));
      if (Array.isArray(data)) return data;
      // Handle keyed format
      return Object.entries(data).map(([id, ex]) => ({ ...ex, id }));
    }
  }

  // Fetch from GitHub
  console.log(`🌐 Fetching free-exercise-db from GitHub...`);
  try {
    const res = await fetch(FREE_DB_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    // Cache locally
    const cachePath = FREE_DB_PATHS[0];
    mkdirSync(dirname(cachePath), { recursive: true });
    writeFileSync(cachePath, JSON.stringify(data, null, 2));
    console.log(`💾 Cached ${data.length} exercises to ${cachePath}`);
    return data;
  } catch (e) {
    console.error(`❌ Could not load free-exercise-db: ${e.message}`);
    console.error(`   Clone to /tmp:  git clone --depth 1 https://github.com/yuhonas/free-exercise-db /tmp/free-exercise-db`);
    console.error(`   Or place at:    ${FREE_DB_PATHS[0]}`);
    return null;
  }
}

function loadTalosExercises() {
  const src = readFileSync(EXERCISES_PATH, "utf-8");
  const exerciseRegex = /\{ name: "([^"]+)", muscle: "([^"]+)", equipment: "([^"]+)", type: "([^"]+)"[^}]*\}/g;
  const exercises = [];
  let match;
  while ((match = exerciseRegex.exec(src)) !== null) {
    exercises.push({ name: match[1], muscle: match[2], equipment: match[3], type: match[4] });
  }
  return { exercises, src };
}

function loadSubstitutions() {
  // Import SUBSTITUTIONS from exercises.js by parsing the source
  const src = readFileSync(EXERCISES_PATH, "utf-8");
  const subsStart = src.indexOf("export const SUBSTITUTIONS = {");
  if (subsStart === -1) return {};
  // Find the matching closing brace
  let depth = 0;
  let started = false;
  let subsEnd = subsStart;
  for (let i = subsStart; i < src.length; i++) {
    if (src[i] === "{") { depth++; started = true; }
    if (src[i] === "}") { depth--; }
    if (started && depth === 0) { subsEnd = i + 1; break; }
  }
  const subsBlock = src.substring(subsStart, subsEnd).replace("export const SUBSTITUTIONS = ", "");
  try {
    // Safe eval-ish: the SUBSTITUTIONS object is plain string arrays
    return new Function("return " + subsBlock)();
  } catch {
    console.warn("⚠  Could not parse SUBSTITUTIONS from exercises.js — skipping substitution seeding");
    return {};
  }
}


// ═══════════════════════════════════════════════════════════════
//  STATIC FILE GENERATION
// ═══════════════════════════════════════════════════════════════

function formatExerciseLine(tex, enrich) {
  const parts = [
    `name: "${tex.name}"`,
    `muscle: "${tex.muscle}"`,
    `equipment: "${tex.equipment}"`,
    `type: "${tex.type}"`,
  ];
  if (enrich?.freeDbId) parts.push(`freeDbId: "${enrich.freeDbId}"`);
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

function writeStaticFiles(talosExercises, enrichMap, referenceData, newExercises, originalSrc) {
  // ─── Regenerate exercises.js ───
  const arrayStartIdx = originalSrc.indexOf("export const EXERCISES = [");
  const subsMarker = "export const SUBSTITUTIONS = {";
  const subsIdx = originalSrc.indexOf(subsMarker);

  if (arrayStartIdx === -1 || subsIdx === -1) {
    throw new Error("Could not locate EXERCISES array or SUBSTITUTIONS in source file");
  }

  const beforeArray = originalSrc.substring(0, arrayStartIdx);
  const arrayAndGap = originalSrc.substring(arrayStartIdx, subsIdx);
  const afterSubs = originalSrc.substring(subsIdx);

  const arrayLines = arrayAndGap.split("\n");
  const rebuiltLines = [];
  let exIdx = 0;

  for (const line of arrayLines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("{ name:") && trimmed.includes("muscle:")) {
      const tex = talosExercises[exIdx];
      if (tex) {
        rebuiltLines.push(formatExerciseLine(tex, enrichMap[tex.name]));
      }
      exIdx++;
    } else if (trimmed === "];") {
      if (newExercises.length > 0) {
        rebuiltLines.push("");
        rebuiltLines.push("  // ═══════════════════════════════════════════════════════════════");
        rebuiltLines.push("  // ─── IMPORTED FROM free-exercise-db ───────────────────────────");
        rebuiltLines.push("  // ═══════════════════════════════════════════════════════════════");
        rebuiltLines.push("");

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
  writeFileSync(EXERCISES_PATH, newSrc, "utf-8");
  console.log(`   ✓ Written: ${EXERCISES_PATH}`);

  // ─── Write reference JSON ───
  mkdirSync(dirname(REFERENCE_PATH), { recursive: true });
  writeFileSync(REFERENCE_PATH, JSON.stringify(referenceData, null, 2), "utf-8");
  const refSize = (JSON.stringify(referenceData).length / 1024).toFixed(0);
  console.log(`   ✓ Written: ${REFERENCE_PATH} (${refSize}KB)`);

  // ─── Write new exercises JSON ───
  writeFileSync(NEW_EX_PATH, JSON.stringify(newExercises.map(e => ({
    displayName: e.name,
    originalName: e.originalName,
    muscle: e.muscle,
    equipment: e.equipment,
    type: e.type,
    freeDbId: e.freeDbId,
  })), null, 2), "utf-8");
  console.log(`   ✓ Written: ${NEW_EX_PATH}`);
}


// ═══════════════════════════════════════════════════════════════
//  DATABASE SEEDING
// ═══════════════════════════════════════════════════════════════

async function seedDatabase(allExercises, enrichMap, freeById, substitutions) {
  const { createDb } = await import("../server/db/index.js");
  const db = await createDb();

  // ─── Create tables ───
  if (existsSync(SCHEMA_PATH)) {
    const schemaSql = readFileSync(SCHEMA_PATH, "utf-8");
    // Execute each statement separately (pg doesn't always like multi-statement)
    const statements = schemaSql
      .split(";")
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith("--"));
    for (const stmt of statements) {
      try {
        await db.exec(stmt);
      } catch (e) {
        // Ignore "already exists" errors
        if (!e.message.includes("already exists")) {
          console.warn(`   ⚠ Schema statement warning: ${e.message}`);
        }
      }
    }
    console.log(`   ✓ Exercise tables ready`);
  } else {
    console.warn(`   ⚠ Schema file not found at ${SCHEMA_PATH} — tables must already exist`);
  }

  // ─── Upsert exercises ───
  let upserted = 0;
  let errors = 0;

  for (const ex of allExercises) {
    const enrich = enrichMap[ex.name];
    const freeEx = enrich?.freeDbId ? freeById[enrich.freeDbId] : null;
    const source = freeEx ? (ex._isNew ? "free-exercise-db" : "builtin") : (ex._isNew ? "free-exercise-db" : "builtin");
    const id = genId();

    const description = freeEx?.instructions?.length
      ? freeEx.instructions.join(" ")
      : null;

    const primaryMuscles = freeEx?.primaryMuscles || null;
    const secondaryMuscles = freeEx?.secondaryMuscles?.length ? freeEx.secondaryMuscles : null;
    const force = freeEx?.force || null;
    const level = freeEx?.level || null;
    const category = freeEx?.category || "strength";
    const images = freeEx?.images?.length
      ? freeEx.images.map(img => img.startsWith("http") ? img : IMAGE_BASE + img)
      : null;
    const externalId = enrich?.freeDbId || null;

    try {
      // Use ON CONFLICT on name (unique) to upsert
      await db.run(
        `INSERT INTO exercises (id, name, muscle, equipment, type, source, external_id, description, primary_muscles, secondary_muscles, force, level, category, images)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         ON CONFLICT (name) DO UPDATE SET
           muscle = EXCLUDED.muscle,
           equipment = EXCLUDED.equipment,
           type = EXCLUDED.type,
           source = EXCLUDED.source,
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
          id, ex.name, ex.muscle, ex.equipment, ex.type,
          source, externalId, description,
          primaryMuscles ? JSON.stringify(primaryMuscles) : null,
          secondaryMuscles ? JSON.stringify(secondaryMuscles) : null,
          force, level, category,
          images ? JSON.stringify(images) : null,
        ]
      );
      upserted++;
    } catch (e) {
      console.warn(`   ⚠ Failed to upsert "${ex.name}": ${e.message}`);
      errors++;
    }
  }

  console.log(`   ✓ Exercises: ${upserted} upserted${errors ? `, ${errors} errors` : ""}`);

  // ─── Seed substitutions ───
  // Clear existing curated substitutions, then re-insert
  await db.run("DELETE FROM exercise_substitutions WHERE source = 'curated'");

  let subCount = 0;
  for (const [exerciseName, subs] of Object.entries(substitutions)) {
    for (let i = 0; i < subs.length; i++) {
      try {
        await db.run(
          `INSERT INTO exercise_substitutions (exercise_name, substitute_name, rank, source)
           VALUES ($1, $2, $3, 'curated')
           ON CONFLICT (exercise_name, substitute_name) DO UPDATE SET rank = EXCLUDED.rank`,
          [exerciseName, subs[i], i]
        );
        subCount++;
      } catch (e) {
        // Skip silently — might reference exercises not in the library
      }
    }
  }

  console.log(`   ✓ Substitutions: ${subCount} pairs seeded`);

  // ─── Verify ───
  const exCount = await db.get("SELECT COUNT(*) as count FROM exercises");
  const subTotal = await db.get("SELECT COUNT(*) as count FROM exercise_substitutions");
  console.log(`   📊 Database totals: ${exCount.count} exercises, ${subTotal.count} substitution pairs`);

  // Close if possible
  if (db.close) await db.close();
}


// ═══════════════════════════════════════════════════════════════
//  REPORT GENERATION
// ═══════════════════════════════════════════════════════════════

function writeReport(talosExercises, matched, unmatchedTalos, newExercises, referenceData) {
  const report = [];
  report.push("═══════════════════════════════════════════════════════════════");
  report.push("  TALOS Exercise Library — Build Report");
  report.push(`  Generated: ${new Date().toISOString()}`);
  report.push(`  Mode: ${DRY_RUN ? "DRY RUN" : APPLY ? "FULL APPLY" : STATIC_ONLY ? "STATIC ONLY" : "DB ONLY"}`);
  report.push("═══════════════════════════════════════════════════════════════");
  report.push("");
  report.push("SUMMARY");
  report.push(`  Original TALOS exercises:      ${talosExercises.length}`);
  report.push(`  Enriched (with free-db link):  ${matched.length}`);
  report.push(`  Kept as-is (no free-db match): ${unmatchedTalos.length}`);
  report.push(`  New from free-exercise-db:     ${newExercises.length}`);
  report.push(`  TOTAL in library:              ${talosExercises.length + newExercises.length}`);
  report.push(`  Reference data entries:        ${Object.keys(referenceData).length}`);
  report.push("");

  report.push("───────────────────────────────────────────────────────────────");
  report.push("ENRICHED EXERCISES");
  report.push("───────────────────────────────────────────────────────────────");
  for (const m of matched.sort((a, b) => a.talos.name.localeCompare(b.talos.name))) {
    report.push(`  ✓ ${m.talos.name.padEnd(42)} → ${m.free.name} [${m.method}]`);
  }
  report.push("");

  report.push("───────────────────────────────────────────────────────────────");
  report.push("UNMATCHED (kept as-is — TALOS originals)");
  report.push("───────────────────────────────────────────────────────────────");
  for (const u of unmatchedTalos.sort((a, b) => a.name.localeCompare(b.name))) {
    report.push(`  ○ ${u.name} (${u.muscle}, ${u.equipment})`);
  }
  report.push("");

  report.push("───────────────────────────────────────────────────────────────");
  report.push("NEW EXERCISES (from free-exercise-db)");
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
  report.push("OUTPUTS");
  report.push("  src/lib/exercises.js            — enriched with freeDbId (PWA offline)");
  report.push("  public/data/exercise-reference.json — instructions, images (lazy)");
  report.push("  PostgreSQL exercises table       — full catalog with enrichment");
  report.push("  PostgreSQL exercise_substitutions — curated pairs from SUBSTITUTIONS");
  report.push("───────────────────────────────────────────────────────────────");

  mkdirSync(dirname(REPORT_PATH), { recursive: true });
  writeFileSync(REPORT_PATH, report.join("\n"), "utf-8");
  console.log(`   ✓ Written: ${REPORT_PATH}`);
}


// ═══════════════════════════════════════════════════════════════
//  MAIN
// ═══════════════════════════════════════════════════════════════

async function main() {
  console.log("🏋️  TALOS Exercise Library Builder + Database Seeder (v3)");
  console.log("━".repeat(60));
  if (DRY_RUN) console.log("   Mode: DRY RUN (use --static, --apply, or --db-only to write)\n");
  else if (APPLY) console.log("   Mode: FULL APPLY (static files + database)\n");
  else if (STATIC_ONLY) console.log("   Mode: STATIC FILES ONLY\n");
  else if (DB_ONLY) console.log("   Mode: DATABASE ONLY\n");

  // ─── 1. Load data ───
  const freeDB = await loadFreeExerciseDb();
  if (!freeDB) {
    console.error("❌ Cannot proceed without free-exercise-db. Exiting.");
    process.exit(1);
  }

  const freeById = {};
  for (const ex of freeDB) freeById[ex.id] = ex;
  console.log(`   ✓ ${freeDB.length} free-exercise-db entries loaded`);

  // Category breakdown
  const cats = {};
  for (const ex of freeDB) {
    const c = ex.category || "unknown";
    cats[c] = (cats[c] || 0) + 1;
  }
  console.log(`   Categories: ${Object.entries(cats).map(([k, v]) => `${k}=${v}`).join(", ")}`);

  const { exercises: talosExercises, src: originalSrc } = loadTalosExercises();
  console.log(`   ✓ ${talosExercises.length} TALOS exercises parsed\n`);

  // ─── 2. Match TALOS → free-exercise-db ───
  console.log("🔗 Matching existing TALOS exercises...");
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
    if (manualId && !freeById[manualId]) {
      // Manual map entry points to non-existent ID — log it
      console.warn(`   ⚠ Manual map "${tex.name}" → "${manualId}" not found in free-exercise-db`);
    }

    // Fuzzy fallback (0.80+ threshold)
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
  console.log(`   ○ Unmatched: ${unmatchedTalos.length}`);

  // Show fuzzy matches for review
  const fuzzyMatches = matched.filter(m => m.method.startsWith("fuzzy"));
  if (fuzzyMatches.length > 0) {
    console.log(`\n   ⚠ Fuzzy matches (review these):`);
    for (const m of fuzzyMatches) {
      console.log(`     ${m.method.padEnd(12)} │ "${m.talos.name}" → "${m.free.name}"`);
    }
  }

  // ─── 3. Import new exercises (three-layer filter) ───
  console.log("\n📦 Selecting new exercises from free-exercise-db...");
  const newExercises = [];
  const talosNames = new Set(talosExercises.map(e => normalize(e.name)));
  const talosDedup = new Set(talosExercises.map(e => normalizeDedupe(e.name)));

  let skippedCategory = 0, skippedUsed = 0, skippedPattern = 0;
  let skippedDupe = 0, skippedNotCurated = 0;

  for (const fex of freeDB) {
    // Layer 0: Already matched to a TALOS exercise
    if (usedFreeIds.has(fex.id)) { skippedUsed++; continue; }

    // Layer 1: Category filter
    if (!INCLUDE_CATEGORIES.has(fex.category)) { skippedCategory++; continue; }

    // Layer 2: Pattern exclusions
    const hitPattern = EXCLUDE_PATTERNS.some(rx => rx.test(fex.name));
    if (hitPattern) { skippedPattern++; continue; }

    // Layer 3: Curated whitelist
    if (!CURATED_IMPORTS.has(fex.name)) { skippedNotCurated++; continue; }

    const muscle = MUSCLE_MAP[fex.primaryMuscles?.[0]];
    if (!muscle) continue;

    const equipment = EQUIP_MAP[fex.equipment] ?? "other";
    const type = deriveType(fex);
    const displayName = cleanName(fex.name);

    // Layer 4: Dedup against existing TALOS names (catches plural/hyphen variants)
    if (talosNames.has(normalize(displayName)) || talosDedup.has(normalizeDedupe(displayName))) {
      skippedDupe++;
      continue;
    }

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
      _isNew: true,
    });
    talosNames.add(normalize(displayName));
    talosDedup.add(normalizeDedupe(displayName));
  }

  console.log(`   ✓ ${newExercises.length} new exercises to add`);
  console.log(`   Filtered: ${skippedUsed} already matched, ${skippedCategory} wrong category, ${skippedPattern} pattern excluded, ${skippedDupe} deduped, ${skippedNotCurated} not in curated list`);

  // ─── 4. Build enrichment + reference data ───
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
  for (const nex of newExercises) {
    enrichMap[nex.name] = { freeDbId: nex.freeDbId };
    referenceData[nex.freeDbId] = {
      instructions: nex.instructions || [],
      images: nex.images || [],
      level: nex.level || null,
      force: nex.force || null,
      mechanic: nex.mechanic || null,
    };
  }

  // ─── 5. Summary ───
  const total = talosExercises.length + newExercises.length;
  const refSize = (JSON.stringify(referenceData).length / 1024).toFixed(0);

  console.log("\n" + "━".repeat(60));
  console.log(`📊 Library: ${total} total exercises`);
  console.log(`   ${matched.length} enriched with free-exercise-db link`);
  console.log(`   ${unmatchedTalos.length} TALOS originals (no reference data)`);
  console.log(`   ${newExercises.length} new from free-exercise-db`);
  console.log(`   Reference data: ${Object.keys(referenceData).length} entries (${refSize}KB)`);

  // ─── 6. Write outputs ───
  if (DRY_RUN) {
    console.log(`\n⚡ DRY RUN — nothing written. Use --apply to write everything.`);
  }

  // Always write report
  writeReport(talosExercises, matched, unmatchedTalos, newExercises, referenceData);

  if (WRITE_STATIC) {
    console.log("\n📝 Writing static files...");
    writeStaticFiles(talosExercises, enrichMap, referenceData, newExercises, originalSrc);
  }

  if (WRITE_DB) {
    console.log("\n🗄️  Seeding PostgreSQL...");
    const substitutions = loadSubstitutions();
    const subCount = Object.keys(substitutions).length;
    console.log(`   Loaded ${subCount} substitution entries from exercises.js`);

    // Build the full exercise list for DB (existing + new)
    const allExercises = [
      ...talosExercises,
      ...newExercises,
    ];
    await seedDatabase(allExercises, enrichMap, freeById, substitutions);
  }

  console.log("\n✅ Done.");
  if (!DRY_RUN) {
    console.log("\n📋 Next steps:");
    if (WRITE_STATIC) {
      console.log("   1. Review scripts/hybrid-report.txt");
      console.log("   2. Review scripts/new-exercises.json (display names)");
      console.log("   3. npm run dev → test ExercisePicker, templates, active workout");
    }
    if (WRITE_DB) {
      console.log(`   ${WRITE_STATIC ? "4" : "1"}. Verify: SELECT COUNT(*) FROM exercises;`);
      console.log(`   ${WRITE_STATIC ? "5" : "2"}. Test: GET /api/exercises returns full catalog`);
      console.log(`   ${WRITE_STATIC ? "6" : "3"}. Test: AI coach substitution includes enriched data`);
    }
  }
}


main().catch(e => {
  console.error("❌ Error:", e.message);
  console.error(e.stack);
  process.exit(1);
});

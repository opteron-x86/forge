// Master exercise library — built-in exercises categorized by muscle group, equipment, type
// Custom exercises added by users are stored in the database and merged at runtime
//
// Expanded: ~300+ exercises covering comprehensive movement patterns,
// equipment variations, unilateral work, and specialty exercises.

export const MUSCLE_GROUPS = ["chest", "back", "shoulders", "quads", "hamstrings", "glutes", "biceps", "triceps", "calves", "core", "forearms"];
export const EQUIPMENT = ["barbell", "dumbbell", "cable", "machine", "bodyweight", "other"];
export const TYPES = ["compound", "isolation"];

export const EXERCISES = [
  // ═══════════════════════════════════════════════════════════════
  // ─── CHEST ────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════

  // Barbell
  { name: "Bench Press", muscle: "chest", equipment: "barbell", type: "compound" },
  { name: "Incline Bench Press", muscle: "chest", equipment: "barbell", type: "compound" },
  { name: "Decline Bench Press", muscle: "chest", equipment: "barbell", type: "compound" },
  { name: "Close-Grip Bench", muscle: "chest", equipment: "barbell", type: "compound" },
  { name: "Wide-Grip Bench Press", muscle: "chest", equipment: "barbell", type: "compound" },
  { name: "Floor Press", muscle: "chest", equipment: "barbell", type: "compound" },
  { name: "Larsen Press", muscle: "chest", equipment: "barbell", type: "compound" },
  { name: "Spoto Press", muscle: "chest", equipment: "barbell", type: "compound" },
  { name: "Pin Press", muscle: "chest", equipment: "barbell", type: "compound" },
  { name: "Reverse Grip Bench Press", muscle: "chest", equipment: "barbell", type: "compound" },
  { name: "Guillotine Press", muscle: "chest", equipment: "barbell", type: "compound" },

  // Dumbbell
  { name: "DB Bench Press", muscle: "chest", equipment: "dumbbell", type: "compound" },
  { name: "Flat DB Press", muscle: "chest", equipment: "dumbbell", type: "compound" },
  { name: "Incline DB Press", muscle: "chest", equipment: "dumbbell", type: "compound" },
  { name: "Decline DB Press", muscle: "chest", equipment: "dumbbell", type: "compound" },
  { name: "DB Floor Press", muscle: "chest", equipment: "dumbbell", type: "compound" },
  { name: "DB Squeeze Press", muscle: "chest", equipment: "dumbbell", type: "compound" },
  { name: "Single-Arm DB Bench Press", muscle: "chest", equipment: "dumbbell", type: "compound" },
  { name: "DB Fly", muscle: "chest", equipment: "dumbbell", type: "isolation" },
  { name: "Incline DB Fly", muscle: "chest", equipment: "dumbbell", type: "isolation" },
  { name: "Decline DB Fly", muscle: "chest", equipment: "dumbbell", type: "isolation" },
  { name: "DB Pullover", muscle: "chest", equipment: "dumbbell", type: "isolation" },

  // Cable
  { name: "Cable Fly (High to Low)", muscle: "chest", equipment: "cable", type: "isolation" },
  { name: "Cable Fly (Low to High)", muscle: "chest", equipment: "cable", type: "isolation" },
  { name: "Cable Fly (Mid)", muscle: "chest", equipment: "cable", type: "isolation" },
  { name: "Cable Crossover", muscle: "chest", equipment: "cable", type: "isolation" },
  { name: "Single-Arm Cable Fly", muscle: "chest", equipment: "cable", type: "isolation" },
  { name: "Cable Chest Press", muscle: "chest", equipment: "cable", type: "compound" },

  // Machine
  { name: "Machine Chest Press", muscle: "chest", equipment: "machine", type: "compound" },
  { name: "Incline Machine Press", muscle: "chest", equipment: "machine", type: "compound" },
  { name: "Decline Machine Press", muscle: "chest", equipment: "machine", type: "compound" },
  { name: "Pec Deck Machine", muscle: "chest", equipment: "machine", type: "isolation" },
  { name: "Machine Fly", muscle: "chest", equipment: "machine", type: "isolation" },
  { name: "Iso-Lateral Chest Press", muscle: "chest", equipment: "machine", type: "compound" },
  { name: "Iso-Lateral Incline Press", muscle: "chest", equipment: "machine", type: "compound" },
  { name: "Smith Machine Bench Press", muscle: "chest", equipment: "machine", type: "compound" },
  { name: "Smith Machine Incline Press", muscle: "chest", equipment: "machine", type: "compound" },

  // Bodyweight
  { name: "Push-ups", muscle: "chest", equipment: "bodyweight", type: "compound" },
  { name: "Incline Push-ups", muscle: "chest", equipment: "bodyweight", type: "compound" },
  { name: "Decline Push-ups", muscle: "chest", equipment: "bodyweight", type: "compound" },
  { name: "Diamond Push-ups", muscle: "chest", equipment: "bodyweight", type: "compound" },
  { name: "Wide Push-ups", muscle: "chest", equipment: "bodyweight", type: "compound" },
  { name: "Dips (Chest)", muscle: "chest", equipment: "bodyweight", type: "compound" },
  { name: "Weighted Dips (Chest)", muscle: "chest", equipment: "bodyweight", type: "compound" },

  // ═══════════════════════════════════════════════════════════════
  // ─── BACK ─────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════

  // Barbell
  { name: "Conventional Deadlift", muscle: "back", equipment: "barbell", type: "compound" },
  { name: "Sumo Deadlift", muscle: "back", equipment: "barbell", type: "compound" },
  { name: "Trap Bar Deadlift", muscle: "back", equipment: "barbell", type: "compound" },
  { name: "Deficit Deadlift", muscle: "back", equipment: "barbell", type: "compound" },
  { name: "Rack Pull", muscle: "back", equipment: "barbell", type: "compound" },
  { name: "Block Pull", muscle: "back", equipment: "barbell", type: "compound" },
  { name: "Barbell Row", muscle: "back", equipment: "barbell", type: "compound" },
  { name: "Pendlay Row", muscle: "back", equipment: "barbell", type: "compound" },
  { name: "Meadows Row", muscle: "back", equipment: "barbell", type: "compound" },
  { name: "T-Bar Row", muscle: "back", equipment: "barbell", type: "compound" },
  { name: "Seal Row", muscle: "back", equipment: "barbell", type: "compound" },
  { name: "Yates Row", muscle: "back", equipment: "barbell", type: "compound" },
  { name: "Barbell Shrug", muscle: "back", equipment: "barbell", type: "isolation" },
  { name: "Snatch Grip Deadlift", muscle: "back", equipment: "barbell", type: "compound" },
  { name: "Barbell Pullover", muscle: "back", equipment: "barbell", type: "isolation" },
  { name: "Barbell Good Morning", muscle: "back", equipment: "barbell", type: "compound" },

  // Dumbbell
  { name: "One-Arm DB Row", muscle: "back", equipment: "dumbbell", type: "compound" },
  { name: "DB Chest Supported Row", muscle: "back", equipment: "dumbbell", type: "compound" },
  { name: "Incline DB Row", muscle: "back", equipment: "dumbbell", type: "compound" },
  { name: "Kroc Row", muscle: "back", equipment: "dumbbell", type: "compound" },
  { name: "DB Shrug", muscle: "back", equipment: "dumbbell", type: "isolation" },
  { name: "DB Pullover (Back)", muscle: "back", equipment: "dumbbell", type: "isolation" },
  { name: "Renegade Row", muscle: "back", equipment: "dumbbell", type: "compound" },
  { name: "DB Reverse Fly (Back)", muscle: "back", equipment: "dumbbell", type: "isolation" },
  { name: "Helms Row", muscle: "back", equipment: "dumbbell", type: "compound" },

  // Cable
  { name: "Neutral Grip Cable Row", muscle: "back", equipment: "cable", type: "compound" },
  { name: "Wide Grip Cable Row", muscle: "back", equipment: "cable", type: "compound" },
  { name: "Close Grip Cable Row", muscle: "back", equipment: "cable", type: "compound" },
  { name: "Single-Arm Cable Row", muscle: "back", equipment: "cable", type: "compound" },
  { name: "Wide Grip Lat Pulldown", muscle: "back", equipment: "cable", type: "compound" },
  { name: "Close Grip Lat Pulldown", muscle: "back", equipment: "cable", type: "compound" },
  { name: "Neutral Grip Lat Pulldown", muscle: "back", equipment: "cable", type: "compound" },
  { name: "Reverse Grip Lat Pulldown", muscle: "back", equipment: "cable", type: "compound" },
  { name: "Behind the Neck Pulldown", muscle: "back", equipment: "cable", type: "compound" },
  { name: "Single-Arm Lat Pulldown", muscle: "back", equipment: "cable", type: "compound" },
  { name: "Straight Arm Pulldown", muscle: "back", equipment: "cable", type: "isolation" },
  { name: "Cable Shrug", muscle: "back", equipment: "cable", type: "isolation" },
  { name: "Cable Pullover", muscle: "back", equipment: "cable", type: "isolation" },
  { name: "Face Pull", muscle: "back", equipment: "cable", type: "isolation" },

  // Machine
  { name: "Machine Row", muscle: "back", equipment: "machine", type: "compound" },
  { name: "Iso-Lateral Row", muscle: "back", equipment: "machine", type: "compound" },
  { name: "Iso-Lateral High Row", muscle: "back", equipment: "machine", type: "compound" },
  { name: "Iso-Lateral Low Row", muscle: "back", equipment: "machine", type: "compound" },
  { name: "Machine Lat Pulldown", muscle: "back", equipment: "machine", type: "compound" },
  { name: "Assisted Pull-up Machine", muscle: "back", equipment: "machine", type: "compound" },
  { name: "Smith Machine Row", muscle: "back", equipment: "machine", type: "compound" },
  { name: "Reverse Hyper", muscle: "back", equipment: "machine", type: "compound" },
  { name: "Machine Shrug", muscle: "back", equipment: "machine", type: "isolation" },

  // Bodyweight
  { name: "Pull-ups", muscle: "back", equipment: "bodyweight", type: "compound" },
  { name: "Pull-ups (Neutral Grip)", muscle: "back", equipment: "bodyweight", type: "compound" },
  { name: "Pull-ups (Wide Grip)", muscle: "back", equipment: "bodyweight", type: "compound" },
  { name: "Chin-ups", muscle: "back", equipment: "bodyweight", type: "compound" },
  { name: "Weighted Pull-ups", muscle: "back", equipment: "bodyweight", type: "compound" },
  { name: "Weighted Chin-ups", muscle: "back", equipment: "bodyweight", type: "compound" },
  { name: "Inverted Row", muscle: "back", equipment: "bodyweight", type: "compound" },
  { name: "Back Extension", muscle: "back", equipment: "bodyweight", type: "compound" },
  { name: "Hyperextension", muscle: "back", equipment: "bodyweight", type: "compound" },

  // ═══════════════════════════════════════════════════════════════
  // ─── SHOULDERS ────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════

  // Barbell
  { name: "Overhead Press", muscle: "shoulders", equipment: "barbell", type: "compound" },
  { name: "Push Press", muscle: "shoulders", equipment: "barbell", type: "compound" },
  { name: "Behind the Neck Press", muscle: "shoulders", equipment: "barbell", type: "compound" },
  { name: "Z Press", muscle: "shoulders", equipment: "barbell", type: "compound" },
  { name: "Bradford Press", muscle: "shoulders", equipment: "barbell", type: "compound" },
  { name: "Barbell Front Raise", muscle: "shoulders", equipment: "barbell", type: "isolation" },
  { name: "Barbell Upright Row", muscle: "shoulders", equipment: "barbell", type: "compound" },
  { name: "Viking Press", muscle: "shoulders", equipment: "barbell", type: "compound" },

  // Dumbbell
  { name: "Seated DB Shoulder Press", muscle: "shoulders", equipment: "dumbbell", type: "compound" },
  { name: "Standing DB Shoulder Press", muscle: "shoulders", equipment: "dumbbell", type: "compound" },
  { name: "Arnold Press", muscle: "shoulders", equipment: "dumbbell", type: "compound" },
  { name: "DB Lateral Raise", muscle: "shoulders", equipment: "dumbbell", type: "isolation" },
  { name: "DB Front Raise", muscle: "shoulders", equipment: "dumbbell", type: "isolation" },
  { name: "Incline Reverse Fly", muscle: "shoulders", equipment: "dumbbell", type: "isolation" },
  { name: "Seated Reverse Fly", muscle: "shoulders", equipment: "dumbbell", type: "isolation" },
  { name: "Standing Reverse Fly", muscle: "shoulders", equipment: "dumbbell", type: "isolation" },
  { name: "DB Upright Row", muscle: "shoulders", equipment: "dumbbell", type: "compound" },
  { name: "DB Shrug (Shoulders)", muscle: "shoulders", equipment: "dumbbell", type: "isolation" },
  { name: "Lu Raise", muscle: "shoulders", equipment: "dumbbell", type: "isolation" },
  { name: "Prone Y Raise", muscle: "shoulders", equipment: "dumbbell", type: "isolation" },
  { name: "Leaning DB Lateral Raise", muscle: "shoulders", equipment: "dumbbell", type: "isolation" },
  { name: "DB W Press", muscle: "shoulders", equipment: "dumbbell", type: "compound" },
  { name: "Single-Arm DB Lateral Raise", muscle: "shoulders", equipment: "dumbbell", type: "isolation" },
  { name: "Bus Driver Raise", muscle: "shoulders", equipment: "dumbbell", type: "isolation" },

  // Cable
  { name: "Cable Lateral Raise", muscle: "shoulders", equipment: "cable", type: "isolation" },
  { name: "Cable Front Raise", muscle: "shoulders", equipment: "cable", type: "isolation" },
  { name: "Cable Rear Delt Fly", muscle: "shoulders", equipment: "cable", type: "isolation" },
  { name: "Cable Upright Row", muscle: "shoulders", equipment: "cable", type: "compound" },
  { name: "Cable Y Raise", muscle: "shoulders", equipment: "cable", type: "isolation" },
  { name: "Single-Arm Cable Lateral Raise", muscle: "shoulders", equipment: "cable", type: "isolation" },

  // Machine
  { name: "Machine Shoulder Press", muscle: "shoulders", equipment: "machine", type: "compound" },
  { name: "Iso-Lateral Shoulder Press", muscle: "shoulders", equipment: "machine", type: "compound" },
  { name: "Machine Lateral Raise", muscle: "shoulders", equipment: "machine", type: "isolation" },
  { name: "Reverse Pec Deck", muscle: "shoulders", equipment: "machine", type: "isolation" },
  { name: "Smith Machine Overhead Press", muscle: "shoulders", equipment: "machine", type: "compound" },
  { name: "Smith Machine Behind Neck Press", muscle: "shoulders", equipment: "machine", type: "compound" },

  // Bodyweight
  { name: "Handstand Push-ups", muscle: "shoulders", equipment: "bodyweight", type: "compound" },
  { name: "Pike Push-ups", muscle: "shoulders", equipment: "bodyweight", type: "compound" },

  // ═══════════════════════════════════════════════════════════════
  // ─── QUADS ────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════

  // Barbell
  { name: "Back Squat", muscle: "quads", equipment: "barbell", type: "compound" },
  { name: "Front Squat", muscle: "quads", equipment: "barbell", type: "compound" },
  { name: "Box Squat", muscle: "quads", equipment: "barbell", type: "compound" },
  { name: "Pause Squat", muscle: "quads", equipment: "barbell", type: "compound" },
  { name: "Pin Squat", muscle: "quads", equipment: "barbell", type: "compound" },
  { name: "Tempo Squat", muscle: "quads", equipment: "barbell", type: "compound" },
  { name: "Safety Bar Squat", muscle: "quads", equipment: "barbell", type: "compound" },
  { name: "Zercher Squat", muscle: "quads", equipment: "barbell", type: "compound" },
  { name: "Barbell Lunge", muscle: "quads", equipment: "barbell", type: "compound" },
  { name: "Walking Lunge (Barbell)", muscle: "quads", equipment: "barbell", type: "compound" },
  { name: "Barbell Step-up", muscle: "quads", equipment: "barbell", type: "compound" },
  { name: "Barbell Bulgarian Split Squat", muscle: "quads", equipment: "barbell", type: "compound" },
  { name: "Overhead Squat", muscle: "quads", equipment: "barbell", type: "compound" },

  // Dumbbell
  { name: "DB Goblet Squat", muscle: "quads", equipment: "dumbbell", type: "compound" },
  { name: "DB Lunge", muscle: "quads", equipment: "dumbbell", type: "compound" },
  { name: "DB Walking Lunge", muscle: "quads", equipment: "dumbbell", type: "compound" },
  { name: "DB Reverse Lunge", muscle: "quads", equipment: "dumbbell", type: "compound" },
  { name: "DB Bulgarian Split Squat", muscle: "quads", equipment: "dumbbell", type: "compound" },
  { name: "DB Step-up", muscle: "quads", equipment: "dumbbell", type: "compound" },
  { name: "DB Split Squat", muscle: "quads", equipment: "dumbbell", type: "compound" },
  { name: "DB Squat", muscle: "quads", equipment: "dumbbell", type: "compound" },
  { name: "DB Lateral Lunge", muscle: "quads", equipment: "dumbbell", type: "compound" },

  // Machine
  { name: "Leg Press", muscle: "quads", equipment: "machine", type: "compound" },
  { name: "Single-Leg Leg Press", muscle: "quads", equipment: "machine", type: "compound" },
  { name: "Narrow Stance Leg Press", muscle: "quads", equipment: "machine", type: "compound" },
  { name: "Wide Stance Leg Press", muscle: "quads", equipment: "machine", type: "compound" },
  { name: "Hack Squat", muscle: "quads", equipment: "machine", type: "compound" },
  { name: "Reverse Hack Squat", muscle: "quads", equipment: "machine", type: "compound" },
  { name: "V-Squat Machine", muscle: "quads", equipment: "machine", type: "compound" },
  { name: "Leg Extension", muscle: "quads", equipment: "machine", type: "isolation" },
  { name: "Single-Leg Extension", muscle: "quads", equipment: "machine", type: "isolation" },
  { name: "Smith Machine Squat", muscle: "quads", equipment: "machine", type: "compound" },
  { name: "Smith Machine Front Squat", muscle: "quads", equipment: "machine", type: "compound" },
  { name: "Smith Machine Lunge", muscle: "quads", equipment: "machine", type: "compound" },
  { name: "Belt Squat", muscle: "quads", equipment: "machine", type: "compound" },
  { name: "Pendulum Squat", muscle: "quads", equipment: "machine", type: "compound" },
  { name: "Sissy Squat Machine", muscle: "quads", equipment: "machine", type: "isolation" },

  // Bodyweight
  { name: "Bodyweight Squat", muscle: "quads", equipment: "bodyweight", type: "compound" },
  { name: "Pistol Squat", muscle: "quads", equipment: "bodyweight", type: "compound" },
  { name: "Sissy Squat", muscle: "quads", equipment: "bodyweight", type: "isolation" },
  { name: "Wall Sit", muscle: "quads", equipment: "bodyweight", type: "isolation" },
  { name: "Jump Squat", muscle: "quads", equipment: "bodyweight", type: "compound" },
  { name: "Bodyweight Lunge", muscle: "quads", equipment: "bodyweight", type: "compound" },
  { name: "Box Jump", muscle: "quads", equipment: "bodyweight", type: "compound" },

  // ═══════════════════════════════════════════════════════════════
  // ─── HAMSTRINGS ───────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════

  // Barbell
  { name: "Romanian Deadlift", muscle: "hamstrings", equipment: "barbell", type: "compound" },
  { name: "Stiff-Leg Deadlift", muscle: "hamstrings", equipment: "barbell", type: "compound" },
  { name: "Good Morning", muscle: "hamstrings", equipment: "barbell", type: "compound" },
  { name: "Barbell Hip Thrust", muscle: "hamstrings", equipment: "barbell", type: "compound" },

  // Dumbbell
  { name: "DB Romanian Deadlift", muscle: "hamstrings", equipment: "dumbbell", type: "compound" },
  { name: "DB Stiff-Leg Deadlift", muscle: "hamstrings", equipment: "dumbbell", type: "compound" },
  { name: "Single-Leg DB RDL", muscle: "hamstrings", equipment: "dumbbell", type: "compound" },
  { name: "DB Good Morning", muscle: "hamstrings", equipment: "dumbbell", type: "compound" },

  // Cable
  { name: "Cable Pull-Through", muscle: "hamstrings", equipment: "cable", type: "compound" },
  { name: "Cable Romanian Deadlift", muscle: "hamstrings", equipment: "cable", type: "compound" },
  { name: "Cable Leg Curl", muscle: "hamstrings", equipment: "cable", type: "isolation" },

  // Machine
  { name: "Seated Leg Curl", muscle: "hamstrings", equipment: "machine", type: "isolation" },
  { name: "Lying Leg Curl", muscle: "hamstrings", equipment: "machine", type: "isolation" },
  { name: "Standing Leg Curl", muscle: "hamstrings", equipment: "machine", type: "isolation" },
  { name: "Single-Leg Curl", muscle: "hamstrings", equipment: "machine", type: "isolation" },

  // Bodyweight
  { name: "Nordic Hamstring Curl", muscle: "hamstrings", equipment: "bodyweight", type: "isolation" },
  { name: "Glute-Ham Raise", muscle: "hamstrings", equipment: "bodyweight", type: "compound" },
  { name: "Slider Leg Curl", muscle: "hamstrings", equipment: "bodyweight", type: "isolation" },
  { name: "Single-Leg Glute Bridge", muscle: "hamstrings", equipment: "bodyweight", type: "compound" },

  // Other
  { name: "Kettlebell Swing", muscle: "hamstrings", equipment: "other", type: "compound" },

  // ═══════════════════════════════════════════════════════════════
  // ─── GLUTES ───────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════

  // Barbell
  { name: "Hip Thrust", muscle: "glutes", equipment: "barbell", type: "compound" },
  { name: "Barbell Glute Bridge", muscle: "glutes", equipment: "barbell", type: "compound" },
  { name: "Sumo Squat", muscle: "glutes", equipment: "barbell", type: "compound" },

  // Dumbbell
  { name: "DB Hip Thrust", muscle: "glutes", equipment: "dumbbell", type: "compound" },
  { name: "DB Frog Pump", muscle: "glutes", equipment: "dumbbell", type: "isolation" },
  { name: "DB Sumo Squat", muscle: "glutes", equipment: "dumbbell", type: "compound" },

  // Cable
  { name: "Cable Kickback", muscle: "glutes", equipment: "cable", type: "isolation" },
  { name: "Cable Hip Abduction", muscle: "glutes", equipment: "cable", type: "isolation" },

  // Machine
  { name: "Hip Thrust Machine", muscle: "glutes", equipment: "machine", type: "compound" },
  { name: "Glute Drive Machine", muscle: "glutes", equipment: "machine", type: "compound" },
  { name: "Hip Abduction Machine", muscle: "glutes", equipment: "machine", type: "isolation" },
  { name: "Hip Adduction Machine", muscle: "glutes", equipment: "machine", type: "isolation" },

  // Bodyweight
  { name: "Glute Bridge", muscle: "glutes", equipment: "bodyweight", type: "compound" },
  { name: "Donkey Kick", muscle: "glutes", equipment: "bodyweight", type: "isolation" },
  { name: "Fire Hydrant", muscle: "glutes", equipment: "bodyweight", type: "isolation" },
  { name: "Clamshell", muscle: "glutes", equipment: "bodyweight", type: "isolation" },
  { name: "Frog Pump", muscle: "glutes", equipment: "bodyweight", type: "isolation" },

  // Other
  { name: "Banded Walk", muscle: "glutes", equipment: "other", type: "isolation" },
  { name: "Banded Clamshell", muscle: "glutes", equipment: "other", type: "isolation" },
  { name: "Banded Hip Thrust", muscle: "glutes", equipment: "other", type: "compound" },
  { name: "Kettlebell Sumo Squat", muscle: "glutes", equipment: "other", type: "compound" },

  // ═══════════════════════════════════════════════════════════════
  // ─── BICEPS ───────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════

  // Barbell
  { name: "Barbell Curl", muscle: "biceps", equipment: "barbell", type: "isolation" },
  { name: "EZ-Bar Curl", muscle: "biceps", equipment: "barbell", type: "isolation" },
  { name: "Reverse Barbell Curl", muscle: "biceps", equipment: "barbell", type: "isolation" },
  { name: "Wide Grip Barbell Curl", muscle: "biceps", equipment: "barbell", type: "isolation" },
  { name: "Close Grip Barbell Curl", muscle: "biceps", equipment: "barbell", type: "isolation" },
  { name: "EZ-Bar Spider Curl", muscle: "biceps", equipment: "barbell", type: "isolation" },
  { name: "Barbell Drag Curl", muscle: "biceps", equipment: "barbell", type: "isolation" },
  { name: "Barbell 21s", muscle: "biceps", equipment: "barbell", type: "isolation" },

  // Dumbbell
  { name: "DB Curl", muscle: "biceps", equipment: "dumbbell", type: "isolation" },
  { name: "Hammer Curl", muscle: "biceps", equipment: "dumbbell", type: "isolation" },
  { name: "Incline DB Curl", muscle: "biceps", equipment: "dumbbell", type: "isolation" },
  { name: "Preacher Curl (DB)", muscle: "biceps", equipment: "dumbbell", type: "isolation" },
  { name: "Concentration Curl", muscle: "biceps", equipment: "dumbbell", type: "isolation" },
  { name: "Cross-Body Hammer Curl", muscle: "biceps", equipment: "dumbbell", type: "isolation" },
  { name: "Zottman Curl", muscle: "biceps", equipment: "dumbbell", type: "isolation" },
  { name: "DB Spider Curl", muscle: "biceps", equipment: "dumbbell", type: "isolation" },
  { name: "Alternating DB Curl", muscle: "biceps", equipment: "dumbbell", type: "isolation" },
  { name: "Seated DB Curl", muscle: "biceps", equipment: "dumbbell", type: "isolation" },
  { name: "DB Reverse Curl", muscle: "biceps", equipment: "dumbbell", type: "isolation" },
  { name: "DB Drag Curl", muscle: "biceps", equipment: "dumbbell", type: "isolation" },
  { name: "Waiter Curl", muscle: "biceps", equipment: "dumbbell", type: "isolation" },

  // Cable
  { name: "Cable Curl", muscle: "biceps", equipment: "cable", type: "isolation" },
  { name: "Cable Hammer Curl", muscle: "biceps", equipment: "cable", type: "isolation" },
  { name: "Cable Rope Curl", muscle: "biceps", equipment: "cable", type: "isolation" },
  { name: "High Cable Curl", muscle: "biceps", equipment: "cable", type: "isolation" },
  { name: "Cable Bayesian Curl", muscle: "biceps", equipment: "cable", type: "isolation" },
  { name: "Single-Arm Cable Curl", muscle: "biceps", equipment: "cable", type: "isolation" },
  { name: "Cable Preacher Curl", muscle: "biceps", equipment: "cable", type: "isolation" },

  // Machine
  { name: "Preacher Curl", muscle: "biceps", equipment: "machine", type: "isolation" },
  { name: "Machine Curl", muscle: "biceps", equipment: "machine", type: "isolation" },
  { name: "Machine Preacher Curl", muscle: "biceps", equipment: "machine", type: "isolation" },

  // ═══════════════════════════════════════════════════════════════
  // ─── TRICEPS ──────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════

  // Barbell
  { name: "Skull Crushers", muscle: "triceps", equipment: "barbell", type: "isolation" },
  { name: "EZ-Bar Skull Crushers", muscle: "triceps", equipment: "barbell", type: "isolation" },
  { name: "Close-Grip Bench Press", muscle: "triceps", equipment: "barbell", type: "compound" },
  { name: "JM Press", muscle: "triceps", equipment: "barbell", type: "compound" },
  { name: "Barbell Overhead Extension", muscle: "triceps", equipment: "barbell", type: "isolation" },

  // Dumbbell
  { name: "DB Overhead Extension", muscle: "triceps", equipment: "dumbbell", type: "isolation" },
  { name: "Single-Arm DB Overhead Extension", muscle: "triceps", equipment: "dumbbell", type: "isolation" },
  { name: "DB Kickback", muscle: "triceps", equipment: "dumbbell", type: "isolation" },
  { name: "DB Skull Crusher", muscle: "triceps", equipment: "dumbbell", type: "isolation" },
  { name: "Tate Press", muscle: "triceps", equipment: "dumbbell", type: "isolation" },
  { name: "DB Close-Grip Press", muscle: "triceps", equipment: "dumbbell", type: "compound" },

  // Cable
  { name: "Rope Pushdown", muscle: "triceps", equipment: "cable", type: "isolation" },
  { name: "Straight Bar Pushdown", muscle: "triceps", equipment: "cable", type: "isolation" },
  { name: "V-Bar Pushdown", muscle: "triceps", equipment: "cable", type: "isolation" },
  { name: "Reverse Grip Pushdown", muscle: "triceps", equipment: "cable", type: "isolation" },
  { name: "Single-Arm Pushdown", muscle: "triceps", equipment: "cable", type: "isolation" },
  { name: "Overhead Tricep Extension", muscle: "triceps", equipment: "cable", type: "isolation" },
  { name: "Overhead Rope Extension", muscle: "triceps", equipment: "cable", type: "isolation" },
  { name: "Cable Tricep Kickback", muscle: "triceps", equipment: "cable", type: "isolation" },
  { name: "Cross-Body Cable Extension", muscle: "triceps", equipment: "cable", type: "isolation" },

  // Machine
  { name: "Machine Tricep Extension", muscle: "triceps", equipment: "machine", type: "isolation" },
  { name: "Assisted Dips Machine", muscle: "triceps", equipment: "machine", type: "compound" },
  { name: "Machine Dip", muscle: "triceps", equipment: "machine", type: "compound" },

  // Bodyweight
  { name: "Dips (Triceps)", muscle: "triceps", equipment: "bodyweight", type: "compound" },
  { name: "Weighted Dips (Triceps)", muscle: "triceps", equipment: "bodyweight", type: "compound" },
  { name: "Bench Dips", muscle: "triceps", equipment: "bodyweight", type: "compound" },
  { name: "Close-Grip Push-ups", muscle: "triceps", equipment: "bodyweight", type: "compound" },

  // ═══════════════════════════════════════════════════════════════
  // ─── CALVES ───────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════

  // Machine
  { name: "Seated Calf Raise", muscle: "calves", equipment: "machine", type: "isolation" },
  { name: "Standing Calf Raise Machine", muscle: "calves", equipment: "machine", type: "isolation" },
  { name: "Leg Press Calf Raise", muscle: "calves", equipment: "machine", type: "isolation" },
  { name: "Donkey Calf Raise", muscle: "calves", equipment: "machine", type: "isolation" },
  { name: "Smith Machine Calf Raise", muscle: "calves", equipment: "machine", type: "isolation" },
  { name: "Hack Squat Calf Raise", muscle: "calves", equipment: "machine", type: "isolation" },
  { name: "Tibialis Raise Machine", muscle: "calves", equipment: "machine", type: "isolation" },

  // Dumbbell
  { name: "Single-Leg Standing Calf Raise", muscle: "calves", equipment: "dumbbell", type: "isolation" },
  { name: "DB Standing Calf Raise", muscle: "calves", equipment: "dumbbell", type: "isolation" },

  // Barbell
  { name: "Barbell Standing Calf Raise", muscle: "calves", equipment: "barbell", type: "isolation" },

  // Bodyweight
  { name: "Bodyweight Calf Raise", muscle: "calves", equipment: "bodyweight", type: "isolation" },
  { name: "Single-Leg Bodyweight Calf Raise", muscle: "calves", equipment: "bodyweight", type: "isolation" },

  // ═══════════════════════════════════════════════════════════════
  // ─── CORE ─────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════

  // Bodyweight
  { name: "Crunch", muscle: "core", equipment: "bodyweight", type: "isolation" },
  { name: "Sit-up", muscle: "core", equipment: "bodyweight", type: "isolation" },
  { name: "Decline Sit-up", muscle: "core", equipment: "bodyweight", type: "isolation" },
  { name: "Bicycle Crunch", muscle: "core", equipment: "bodyweight", type: "isolation" },
  { name: "Reverse Crunch", muscle: "core", equipment: "bodyweight", type: "isolation" },
  { name: "Leg Raise", muscle: "core", equipment: "bodyweight", type: "isolation" },
  { name: "Hanging Leg Raise", muscle: "core", equipment: "bodyweight", type: "isolation" },
  { name: "Hanging Knee Raise", muscle: "core", equipment: "bodyweight", type: "isolation" },
  { name: "Captain's Chair Leg Raise", muscle: "core", equipment: "bodyweight", type: "isolation" },
  { name: "Toes to Bar", muscle: "core", equipment: "bodyweight", type: "isolation" },
  { name: "Windshield Wiper", muscle: "core", equipment: "bodyweight", type: "isolation" },
  { name: "Plank", muscle: "core", equipment: "bodyweight", type: "isolation" },
  { name: "Side Plank", muscle: "core", equipment: "bodyweight", type: "isolation" },
  { name: "RKC Plank", muscle: "core", equipment: "bodyweight", type: "isolation" },
  { name: "Mountain Climber", muscle: "core", equipment: "bodyweight", type: "isolation" },
  { name: "Dead Bug", muscle: "core", equipment: "bodyweight", type: "isolation" },
  { name: "Bird Dog", muscle: "core", equipment: "bodyweight", type: "isolation" },
  { name: "Hollow Body Hold", muscle: "core", equipment: "bodyweight", type: "isolation" },
  { name: "V-up", muscle: "core", equipment: "bodyweight", type: "isolation" },
  { name: "Stomach Vacuum", muscle: "core", equipment: "bodyweight", type: "isolation" },
  { name: "Flutter Kick", muscle: "core", equipment: "bodyweight", type: "isolation" },
  { name: "Scissor Kick", muscle: "core", equipment: "bodyweight", type: "isolation" },
  { name: "Superman", muscle: "core", equipment: "bodyweight", type: "isolation" },
  { name: "Dragon Flag", muscle: "core", equipment: "bodyweight", type: "isolation" },
  { name: "Ab Wheel Rollout", muscle: "core", equipment: "bodyweight", type: "isolation" },
  { name: "L-Sit", muscle: "core", equipment: "bodyweight", type: "isolation" },

  // Cable
  { name: "Cable Crunch", muscle: "core", equipment: "cable", type: "isolation" },
  { name: "Pallof Press", muscle: "core", equipment: "cable", type: "isolation" },
  { name: "Cable Woodchop", muscle: "core", equipment: "cable", type: "isolation" },
  { name: "Cable Side Bend", muscle: "core", equipment: "cable", type: "isolation" },
  { name: "Cable Rotation", muscle: "core", equipment: "cable", type: "isolation" },

  // Machine
  { name: "Ab Machine Crunch", muscle: "core", equipment: "machine", type: "isolation" },
  { name: "Machine Torso Rotation", muscle: "core", equipment: "machine", type: "isolation" },

  // Dumbbell
  { name: "DB Side Bend", muscle: "core", equipment: "dumbbell", type: "isolation" },
  { name: "DB Russian Twist", muscle: "core", equipment: "dumbbell", type: "isolation" },
  { name: "Weighted Sit-up", muscle: "core", equipment: "dumbbell", type: "isolation" },
  { name: "Turkish Get-up", muscle: "core", equipment: "dumbbell", type: "compound" },
  { name: "Suitcase Carry", muscle: "core", equipment: "dumbbell", type: "compound" },

  // Barbell
  { name: "Barbell Rollout", muscle: "core", equipment: "barbell", type: "isolation" },
  { name: "Landmine Rotation", muscle: "core", equipment: "barbell", type: "isolation" },

  // Other
  { name: "Medicine Ball Slam", muscle: "core", equipment: "other", type: "compound" },
  { name: "Medicine Ball Russian Twist", muscle: "core", equipment: "other", type: "isolation" },

  // ═══════════════════════════════════════════════════════════════
  // ─── FOREARMS ─────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════

  // Barbell
  { name: "Wrist Curl", muscle: "forearms", equipment: "barbell", type: "isolation" },
  { name: "Reverse Wrist Curl", muscle: "forearms", equipment: "barbell", type: "isolation" },
  { name: "Behind the Back Wrist Curl", muscle: "forearms", equipment: "barbell", type: "isolation" },

  // Dumbbell
  { name: "DB Wrist Curl", muscle: "forearms", equipment: "dumbbell", type: "isolation" },
  { name: "DB Reverse Wrist Curl", muscle: "forearms", equipment: "dumbbell", type: "isolation" },
  { name: "Farmer's Walk", muscle: "forearms", equipment: "dumbbell", type: "compound" },
  { name: "DB Pinch Hold", muscle: "forearms", equipment: "dumbbell", type: "isolation" },

  // Cable
  { name: "Cable Wrist Curl", muscle: "forearms", equipment: "cable", type: "isolation" },

  // Other
  { name: "Plate Pinch Hold", muscle: "forearms", equipment: "other", type: "isolation" },
  { name: "Fat Grip Hold", muscle: "forearms", equipment: "other", type: "isolation" },
  { name: "Dead Hang", muscle: "forearms", equipment: "other", type: "isolation" },
  { name: "Gripper", muscle: "forearms", equipment: "other", type: "isolation" },
  { name: "Towel Pull-up", muscle: "forearms", equipment: "other", type: "compound" },
  { name: "Trap Bar Carry", muscle: "forearms", equipment: "other", type: "compound" },
];

// ═══════════════════════════════════════════════════════════════
// Common substitution pairs (bidirectional where applicable)
// ═══════════════════════════════════════════════════════════════
export const SUBSTITUTIONS = {
  // ── Chest ──
  "Bench Press": ["DB Bench Press", "Machine Chest Press", "Smith Machine Bench Press", "Floor Press"],
  "Incline Bench Press": ["Incline DB Press", "Incline Machine Press", "Smith Machine Incline Press", "Cable Fly (Low to High)"],
  "Decline Bench Press": ["Decline DB Press", "Decline Machine Press", "Dips (Chest)", "Cable Fly (High to Low)"],
  "DB Bench Press": ["Bench Press", "Machine Chest Press", "Flat DB Press"],
  "Flat DB Press": ["DB Bench Press", "Bench Press", "Machine Chest Press"],
  "Incline DB Press": ["Incline Bench Press", "Incline Machine Press", "Cable Fly (Low to High)"],
  "Decline DB Press": ["Decline Bench Press", "Decline Machine Press", "Dips (Chest)"],
  "DB Fly": ["Cable Fly (Mid)", "Pec Deck Machine", "Machine Fly"],
  "Incline DB Fly": ["Cable Fly (Low to High)", "Pec Deck Machine"],
  "Cable Fly (High to Low)": ["Pec Deck Machine", "DB Fly", "Decline DB Fly"],
  "Cable Fly (Low to High)": ["Incline DB Fly", "Pec Deck Machine"],
  "Cable Fly (Mid)": ["DB Fly", "Pec Deck Machine", "Machine Fly"],
  "Cable Crossover": ["Pec Deck Machine", "DB Fly", "Machine Fly"],
  "Pec Deck Machine": ["Cable Crossover", "DB Fly", "Cable Fly (Mid)"],
  "Machine Chest Press": ["Bench Press", "DB Bench Press", "Iso-Lateral Chest Press"],
  "Iso-Lateral Chest Press": ["Machine Chest Press", "DB Bench Press"],
  "Push-ups": ["Bench Press", "Machine Chest Press", "DB Bench Press"],
  "Dips (Chest)": ["Decline Bench Press", "Decline DB Press", "Machine Dip"],
  "DB Pullover": ["Cable Pullover", "DB Pullover (Back)"],

  // ── Back ──
  "Conventional Deadlift": ["Trap Bar Deadlift", "Sumo Deadlift", "Rack Pull"],
  "Sumo Deadlift": ["Conventional Deadlift", "Trap Bar Deadlift"],
  "Trap Bar Deadlift": ["Conventional Deadlift", "Sumo Deadlift"],
  "Barbell Row": ["Iso-Lateral High Row", "T-Bar Row", "Machine Row", "DB Chest Supported Row"],
  "Pendlay Row": ["Barbell Row", "Seal Row", "T-Bar Row"],
  "T-Bar Row": ["Barbell Row", "Machine Row", "Iso-Lateral Row"],
  "One-Arm DB Row": ["Kroc Row", "Machine Row", "Single-Arm Cable Row"],
  "DB Chest Supported Row": ["Helms Row", "Incline DB Row", "Seal Row", "Machine Row"],
  "Helms Row": ["DB Chest Supported Row", "Incline DB Row"],
  "Neutral Grip Cable Row": ["T-Bar Row", "Machine Row", "Close Grip Cable Row"],
  "Wide Grip Cable Row": ["Barbell Row", "Wide Grip Lat Pulldown"],
  "Wide Grip Lat Pulldown": ["Pull-ups", "Pull-ups (Wide Grip)", "Machine Lat Pulldown"],
  "Close Grip Lat Pulldown": ["Chin-ups", "Neutral Grip Lat Pulldown", "Reverse Grip Lat Pulldown"],
  "Neutral Grip Lat Pulldown": ["Pull-ups (Neutral Grip)", "Close Grip Lat Pulldown"],
  "Straight Arm Pulldown": ["Cable Pullover", "DB Pullover (Back)"],
  "Pull-ups": ["Wide Grip Lat Pulldown", "Close Grip Lat Pulldown", "Assisted Pull-up Machine"],
  "Pull-ups (Neutral Grip)": ["Neutral Grip Lat Pulldown", "Close Grip Lat Pulldown", "Chin-ups"],
  "Pull-ups (Wide Grip)": ["Wide Grip Lat Pulldown", "Pull-ups"],
  "Chin-ups": ["Close Grip Lat Pulldown", "Reverse Grip Lat Pulldown", "Neutral Grip Lat Pulldown"],
  "Iso-Lateral High Row": ["Barbell Row", "T-Bar Row", "Machine Row"],
  "Iso-Lateral Row": ["Machine Row", "Neutral Grip Cable Row", "T-Bar Row"],
  "Machine Row": ["Neutral Grip Cable Row", "T-Bar Row", "Iso-Lateral Row"],
  "Face Pull": ["Cable Rear Delt Fly", "Reverse Pec Deck", "Incline Reverse Fly"],
  "Back Extension": ["Hyperextension", "Reverse Hyper", "Good Morning"],
  "Hyperextension": ["Back Extension", "Reverse Hyper"],
  "Barbell Shrug": ["DB Shrug", "Machine Shrug", "Cable Shrug"],
  "DB Shrug": ["Barbell Shrug", "Machine Shrug", "Cable Shrug"],

  // ── Shoulders ──
  "Overhead Press": ["Machine Shoulder Press", "Seated DB Shoulder Press", "Smith Machine Overhead Press", "Push Press"],
  "Push Press": ["Overhead Press", "Standing DB Shoulder Press"],
  "Seated DB Shoulder Press": ["Machine Shoulder Press", "Overhead Press", "Arnold Press"],
  "Standing DB Shoulder Press": ["Overhead Press", "Push Press", "Seated DB Shoulder Press"],
  "Arnold Press": ["Seated DB Shoulder Press", "Machine Shoulder Press"],
  "Machine Shoulder Press": ["Overhead Press", "Seated DB Shoulder Press", "Iso-Lateral Shoulder Press"],
  "Iso-Lateral Shoulder Press": ["Machine Shoulder Press", "Seated DB Shoulder Press"],
  "DB Lateral Raise": ["Cable Lateral Raise", "Machine Lateral Raise", "Leaning DB Lateral Raise"],
  "Cable Lateral Raise": ["DB Lateral Raise", "Machine Lateral Raise"],
  "Machine Lateral Raise": ["DB Lateral Raise", "Cable Lateral Raise"],
  "Leaning DB Lateral Raise": ["DB Lateral Raise", "Cable Lateral Raise"],
  "DB Front Raise": ["Cable Front Raise", "Barbell Front Raise"],
  "Cable Front Raise": ["DB Front Raise", "Barbell Front Raise"],
  "Incline Reverse Fly": ["Reverse Pec Deck", "Cable Rear Delt Fly", "Seated Reverse Fly"],
  "Seated Reverse Fly": ["Incline Reverse Fly", "Reverse Pec Deck", "Cable Rear Delt Fly"],
  "Reverse Pec Deck": ["Incline Reverse Fly", "Cable Rear Delt Fly", "Seated Reverse Fly"],
  "Cable Rear Delt Fly": ["Reverse Pec Deck", "Incline Reverse Fly", "Face Pull"],

  // ── Quads ──
  "Back Squat": ["Box Squat", "Hack Squat", "Front Squat", "Safety Bar Squat", "Leg Press", "Smith Machine Squat"],
  "Front Squat": ["Back Squat", "Hack Squat", "Smith Machine Front Squat", "DB Goblet Squat"],
  "Box Squat": ["Back Squat", "Hack Squat", "Safety Bar Squat"],
  "Hack Squat": ["Back Squat", "Leg Press", "V-Squat Machine", "Pendulum Squat"],
  "V-Squat Machine": ["Hack Squat", "Leg Press", "Leg Extension", "Pendulum Squat"],
  "Leg Press": ["Hack Squat", "Back Squat", "V-Squat Machine", "Smith Machine Squat"],
  "Leg Extension": ["V-Squat Machine", "Sissy Squat", "Sissy Squat Machine"],
  "Belt Squat": ["Hack Squat", "Leg Press", "Back Squat"],
  "Pendulum Squat": ["Hack Squat", "V-Squat Machine", "Leg Press"],
  "DB Goblet Squat": ["Front Squat", "DB Squat", "Back Squat"],
  "DB Bulgarian Split Squat": ["DB Lunge", "DB Reverse Lunge", "Barbell Bulgarian Split Squat", "Smith Machine Lunge"],
  "DB Lunge": ["DB Walking Lunge", "DB Reverse Lunge", "DB Bulgarian Split Squat"],
  "DB Walking Lunge": ["DB Lunge", "DB Reverse Lunge", "Barbell Lunge"],
  "DB Step-up": ["DB Lunge", "DB Bulgarian Split Squat", "Barbell Step-up"],
  "Smith Machine Squat": ["Back Squat", "Hack Squat", "Leg Press"],

  // ── Hamstrings ──
  "Romanian Deadlift": ["DB Romanian Deadlift", "Stiff-Leg Deadlift", "Cable Romanian Deadlift", "Good Morning"],
  "DB Romanian Deadlift": ["Romanian Deadlift", "Single-Leg DB RDL", "DB Stiff-Leg Deadlift"],
  "Stiff-Leg Deadlift": ["Romanian Deadlift", "DB Stiff-Leg Deadlift", "Good Morning"],
  "Good Morning": ["Romanian Deadlift", "Stiff-Leg Deadlift", "Cable Pull-Through"],
  "Seated Leg Curl": ["Lying Leg Curl", "Standing Leg Curl", "Single-Leg Curl", "Cable Leg Curl"],
  "Lying Leg Curl": ["Seated Leg Curl", "Standing Leg Curl", "Single-Leg Curl"],
  "Standing Leg Curl": ["Seated Leg Curl", "Lying Leg Curl", "Cable Leg Curl"],
  "Nordic Hamstring Curl": ["Glute-Ham Raise", "Slider Leg Curl", "Lying Leg Curl"],
  "Glute-Ham Raise": ["Nordic Hamstring Curl", "Back Extension", "Lying Leg Curl"],
  "Cable Pull-Through": ["Kettlebell Swing", "Good Morning", "Romanian Deadlift"],

  // ── Glutes ──
  "Hip Thrust": ["DB Hip Thrust", "Hip Thrust Machine", "Glute Drive Machine", "Barbell Glute Bridge"],
  "DB Hip Thrust": ["Hip Thrust", "Hip Thrust Machine", "Glute Bridge"],
  "Hip Thrust Machine": ["Hip Thrust", "Glute Drive Machine", "DB Hip Thrust"],
  "Glute Bridge": ["Hip Thrust", "DB Hip Thrust", "Single-Leg Glute Bridge"],
  "Cable Kickback": ["Donkey Kick", "Hip Abduction Machine"],
  "Hip Abduction Machine": ["Cable Hip Abduction", "Banded Walk", "Clamshell"],

  // ── Biceps ──
  "Barbell Curl": ["EZ-Bar Curl", "Cable Curl", "Machine Curl", "DB Curl"],
  "EZ-Bar Curl": ["Barbell Curl", "Cable Curl", "DB Curl"],
  "DB Curl": ["Cable Curl", "Barbell Curl", "EZ-Bar Curl", "Machine Curl"],
  "Hammer Curl": ["Cable Hammer Curl", "Cross-Body Hammer Curl", "Cable Rope Curl"],
  "Cable Hammer Curl": ["Hammer Curl", "Cable Rope Curl", "Cross-Body Hammer Curl"],
  "Incline DB Curl": ["DB Curl", "Cable Bayesian Curl", "Seated DB Curl"],
  "Cable Bayesian Curl": ["Incline DB Curl", "Cable Curl"],
  "Preacher Curl": ["Machine Preacher Curl", "Cable Preacher Curl", "EZ-Bar Spider Curl"],
  "Preacher Curl (DB)": ["Preacher Curl", "Concentration Curl", "Machine Preacher Curl"],
  "Machine Curl": ["Cable Curl", "DB Curl", "Barbell Curl"],
  "Concentration Curl": ["Preacher Curl (DB)", "Cable Curl", "DB Spider Curl"],
  "Zottman Curl": ["DB Curl", "DB Reverse Curl"],
  "Cable Curl": ["DB Curl", "Barbell Curl", "EZ-Bar Curl", "Machine Curl"],

  // ── Triceps ──
  "Rope Pushdown": ["Straight Bar Pushdown", "V-Bar Pushdown", "Machine Tricep Extension"],
  "Straight Bar Pushdown": ["Rope Pushdown", "V-Bar Pushdown", "Reverse Grip Pushdown"],
  "V-Bar Pushdown": ["Rope Pushdown", "Straight Bar Pushdown"],
  "Overhead Tricep Extension": ["Overhead Rope Extension", "DB Overhead Extension", "Single-Arm DB Overhead Extension"],
  "Overhead Rope Extension": ["Overhead Tricep Extension", "DB Overhead Extension"],
  "DB Overhead Extension": ["Overhead Tricep Extension", "Overhead Rope Extension", "Single-Arm DB Overhead Extension"],
  "Single-Arm DB Overhead Extension": ["DB Overhead Extension", "Overhead Tricep Extension", "Single-Arm Pushdown"],
  "Skull Crushers": ["EZ-Bar Skull Crushers", "DB Skull Crusher", "JM Press"],
  "EZ-Bar Skull Crushers": ["Skull Crushers", "DB Skull Crusher"],
  "Close-Grip Bench Press": ["Close-Grip Bench", "Machine Dip", "JM Press", "Dips (Triceps)"],
  "Close-Grip Bench": ["Close-Grip Bench Press", "Machine Dip", "JM Press"],
  "DB Kickback": ["Cable Tricep Kickback", "Single-Arm Pushdown"],
  "Dips (Triceps)": ["Close-Grip Bench Press", "Machine Dip", "Assisted Dips Machine", "Bench Dips"],
  "Machine Tricep Extension": ["Rope Pushdown", "Straight Bar Pushdown"],

  // ── Calves ──
  "Seated Calf Raise": ["Leg Press Calf Raise", "Smith Machine Calf Raise"],
  "Standing Calf Raise Machine": ["Smith Machine Calf Raise", "Barbell Standing Calf Raise", "DB Standing Calf Raise"],
  "Leg Press Calf Raise": ["Seated Calf Raise", "Hack Squat Calf Raise"],
  "Single-Leg Standing Calf Raise": ["DB Standing Calf Raise", "Standing Calf Raise Machine", "Single-Leg Bodyweight Calf Raise"],
  "Smith Machine Calf Raise": ["Standing Calf Raise Machine", "Barbell Standing Calf Raise"],

  // ── Core ──
  "Cable Crunch": ["Ab Machine Crunch", "Decline Sit-up", "Weighted Sit-up"],
  "Hanging Leg Raise": ["Captain's Chair Leg Raise", "Hanging Knee Raise", "Toes to Bar", "Leg Raise"],
  "Hanging Knee Raise": ["Hanging Leg Raise", "Captain's Chair Leg Raise", "Leg Raise"],
  "Captain's Chair Leg Raise": ["Hanging Leg Raise", "Hanging Knee Raise"],
  "Pallof Press": ["Cable Woodchop", "Cable Rotation"],
  "Ab Machine Crunch": ["Cable Crunch", "Decline Sit-up"],
  "Ab Wheel Rollout": ["Barbell Rollout", "Plank", "RKC Plank"],
  "Plank": ["RKC Plank", "Dead Bug", "Hollow Body Hold"],
  "Decline Sit-up": ["Cable Crunch", "Ab Machine Crunch", "Weighted Sit-up"],

  // ── Forearms ──
  "Wrist Curl": ["DB Wrist Curl", "Cable Wrist Curl"],
  "Reverse Wrist Curl": ["DB Reverse Wrist Curl"],
  "Farmer's Walk": ["Trap Bar Carry", "Suitcase Carry", "DB Pinch Hold"],
};

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

// Master exercise library — built-in exercises categorized by muscle group, equipment, type
// Custom exercises added by users are stored in the database and merged at runtime

export const MUSCLE_GROUPS = ["chest", "back", "shoulders", "quads", "hamstrings", "glutes", "biceps", "triceps", "calves", "core", "forearms"];
export const EQUIPMENT = ["barbell", "dumbbell", "cable", "machine", "bodyweight", "other"];
export const TYPES = ["compound", "isolation"];

export const EXERCISES = [
  // ─── CHEST ───
  { name: "Bench Press", muscle: "chest", equipment: "barbell", type: "compound" },
  { name: "Incline Bench Press", muscle: "chest", equipment: "barbell", type: "compound" },
  { name: "Decline Bench Press", muscle: "chest", equipment: "barbell", type: "compound" },
  { name: "Close-Grip Bench", muscle: "chest", equipment: "barbell", type: "compound" },
  { name: "DB Bench Press", muscle: "chest", equipment: "dumbbell", type: "compound" },
  { name: "Flat DB Press", muscle: "chest", equipment: "dumbbell", type: "compound" },
  { name: "Incline DB Press", muscle: "chest", equipment: "dumbbell", type: "compound" },
  { name: "Decline DB Press", muscle: "chest", equipment: "dumbbell", type: "compound" },
  { name: "DB Fly", muscle: "chest", equipment: "dumbbell", type: "isolation" },
  { name: "Incline DB Fly", muscle: "chest", equipment: "dumbbell", type: "isolation" },
  { name: "Cable Fly (High to Low)", muscle: "chest", equipment: "cable", type: "isolation" },
  { name: "Cable Fly (Low to High)", muscle: "chest", equipment: "cable", type: "isolation" },
  { name: "Cable Crossover", muscle: "chest", equipment: "cable", type: "isolation" },
  { name: "Pec Deck Machine", muscle: "chest", equipment: "machine", type: "isolation" },
  { name: "Machine Chest Press", muscle: "chest", equipment: "machine", type: "compound" },
  { name: "Push-ups", muscle: "chest", equipment: "bodyweight", type: "compound" },
  { name: "Dips (Chest)", muscle: "chest", equipment: "bodyweight", type: "compound" },

  // ─── BACK ───
  { name: "Conventional Deadlift", muscle: "back", equipment: "barbell", type: "compound" },
  { name: "Sumo Deadlift", muscle: "back", equipment: "barbell", type: "compound" },
  { name: "Barbell Row", muscle: "back", equipment: "barbell", type: "compound" },
  { name: "Pendlay Row", muscle: "back", equipment: "barbell", type: "compound" },
  { name: "T-Bar Row", muscle: "back", equipment: "barbell", type: "compound" },
  { name: "One-Arm DB Row", muscle: "back", equipment: "dumbbell", type: "compound" },
  { name: "DB Chest Supported Row", muscle: "back", equipment: "dumbbell", type: "compound" },
  { name: "DB Shrug", muscle: "back", equipment: "dumbbell", type: "isolation" },
  { name: "Neutral Grip Cable Row", muscle: "back", equipment: "cable", type: "compound" },
  { name: "Wide Grip Cable Row", muscle: "back", equipment: "cable", type: "compound" },
  { name: "Straight Arm Pulldown", muscle: "back", equipment: "cable", type: "isolation" },
  { name: "Wide Grip Lat Pulldown", muscle: "back", equipment: "cable", type: "compound" },
  { name: "Close Grip Lat Pulldown", muscle: "back", equipment: "cable", type: "compound" },
  { name: "Iso-Lateral High Row", muscle: "back", equipment: "machine", type: "compound" },
  { name: "Machine Row", muscle: "back", equipment: "machine", type: "compound" },
  { name: "Pull-ups", muscle: "back", equipment: "bodyweight", type: "compound" },
  { name: "Pull-ups (Neutral Grip)", muscle: "back", equipment: "bodyweight", type: "compound" },
  { name: "Chin-ups", muscle: "back", equipment: "bodyweight", type: "compound" },
  { name: "Inverted Row", muscle: "back", equipment: "bodyweight", type: "compound" },

  // ─── SHOULDERS ───
  { name: "Overhead Press", muscle: "shoulders", equipment: "barbell", type: "compound" },
  { name: "Push Press", muscle: "shoulders", equipment: "barbell", type: "compound" },
  { name: "Seated DB Shoulder Press", muscle: "shoulders", equipment: "dumbbell", type: "compound" },
  { name: "Arnold Press", muscle: "shoulders", equipment: "dumbbell", type: "compound" },
  { name: "DB Lateral Raise", muscle: "shoulders", equipment: "dumbbell", type: "isolation" },
  { name: "DB Front Raise", muscle: "shoulders", equipment: "dumbbell", type: "isolation" },
  { name: "Incline Reverse Fly", muscle: "shoulders", equipment: "dumbbell", type: "isolation" },
  { name: "Cable Lateral Raise", muscle: "shoulders", equipment: "cable", type: "isolation" },
  { name: "Cable Front Raise", muscle: "shoulders", equipment: "cable", type: "isolation" },
  { name: "Face Pull", muscle: "shoulders", equipment: "cable", type: "isolation" },
  { name: "Reverse Pec Deck", muscle: "shoulders", equipment: "machine", type: "isolation" },
  { name: "Machine Shoulder Press", muscle: "shoulders", equipment: "machine", type: "compound" },
  { name: "Upright Row", muscle: "shoulders", equipment: "barbell", type: "compound" },

  // ─── QUADS ───
  { name: "Back Squat", muscle: "quads", equipment: "barbell", type: "compound" },
  { name: "Front Squat", muscle: "quads", equipment: "barbell", type: "compound" },
  { name: "Box Squat", muscle: "quads", equipment: "barbell", type: "compound" },
  { name: "Goblet Squat", muscle: "quads", equipment: "dumbbell", type: "compound" },
  { name: "Bulgarian Split Squat", muscle: "quads", equipment: "dumbbell", type: "compound" },
  { name: "Walking Lunges", muscle: "quads", equipment: "dumbbell", type: "compound" },
  { name: "Leg Press", muscle: "quads", equipment: "machine", type: "compound" },
  { name: "Hack Squat", muscle: "quads", equipment: "machine", type: "compound" },
  { name: "V-Squat Machine", muscle: "quads", equipment: "machine", type: "compound" },
  { name: "Leg Extension", muscle: "quads", equipment: "machine", type: "isolation" },
  { name: "Sissy Squat", muscle: "quads", equipment: "bodyweight", type: "isolation" },

  // ─── HAMSTRINGS ───
  { name: "Romanian Deadlift", muscle: "hamstrings", equipment: "barbell", type: "compound" },
  { name: "Stiff-Leg Deadlift", muscle: "hamstrings", equipment: "barbell", type: "compound" },
  { name: "DB Romanian Deadlift", muscle: "hamstrings", equipment: "dumbbell", type: "compound" },
  { name: "Seated Leg Curl", muscle: "hamstrings", equipment: "machine", type: "isolation" },
  { name: "Lying Leg Curl", muscle: "hamstrings", equipment: "machine", type: "isolation" },
  { name: "Nordic Curl", muscle: "hamstrings", equipment: "bodyweight", type: "isolation" },
  { name: "Glute Ham Raise", muscle: "hamstrings", equipment: "bodyweight", type: "compound" },

  // ─── GLUTES ───
  { name: "Hip Thrust", muscle: "glutes", equipment: "barbell", type: "compound" },
  { name: "Cable Pull-Through", muscle: "glutes", equipment: "cable", type: "compound" },
  { name: "Glute Kickback", muscle: "glutes", equipment: "cable", type: "isolation" },
  { name: "Hip Abduction Machine", muscle: "glutes", equipment: "machine", type: "isolation" },

  // ─── BICEPS ───
  { name: "Barbell Curl", muscle: "biceps", equipment: "barbell", type: "isolation" },
  { name: "EZ-Bar Curl", muscle: "biceps", equipment: "barbell", type: "isolation" },
  { name: "DB Curl", muscle: "biceps", equipment: "dumbbell", type: "isolation" },
  { name: "Hammer Curl", muscle: "biceps", equipment: "dumbbell", type: "isolation" },
  { name: "Incline DB Curl", muscle: "biceps", equipment: "dumbbell", type: "isolation" },
  { name: "Concentration Curl", muscle: "biceps", equipment: "dumbbell", type: "isolation" },
  { name: "Preacher Curl", muscle: "biceps", equipment: "dumbbell", type: "isolation" },
  { name: "Cable Curl", muscle: "biceps", equipment: "cable", type: "isolation" },
  { name: "Machine Curl", muscle: "biceps", equipment: "machine", type: "isolation" },

  // ─── TRICEPS ───
  { name: "Tricep Rope Pulldown", muscle: "triceps", equipment: "cable", type: "isolation" },
  { name: "Tricep Bar Pushdown", muscle: "triceps", equipment: "cable", type: "isolation" },
  { name: "Overhead Tricep Extension", muscle: "triceps", equipment: "cable", type: "isolation" },
  { name: "Skull Crusher", muscle: "triceps", equipment: "barbell", type: "isolation" },
  { name: "DB Overhead Extension", muscle: "triceps", equipment: "dumbbell", type: "isolation" },
  { name: "DB Kickback", muscle: "triceps", equipment: "dumbbell", type: "isolation" },
  { name: "Dips (Triceps)", muscle: "triceps", equipment: "bodyweight", type: "compound" },

  // ─── CALVES ───
  { name: "Seated Calf Raise", muscle: "calves", equipment: "machine", type: "isolation" },
  { name: "Standing Calf Raise", muscle: "calves", equipment: "machine", type: "isolation" },
  { name: "Single-Leg Calf Raise", muscle: "calves", equipment: "other", type: "isolation" },
  { name: "Leg Press Calf Raise", muscle: "calves", equipment: "machine", type: "isolation" },

  // ─── CORE ───
  { name: "Plank", muscle: "core", equipment: "bodyweight", type: "isolation" },
  { name: "Cable Crunch", muscle: "core", equipment: "cable", type: "isolation" },
  { name: "Hanging Leg Raise", muscle: "core", equipment: "bodyweight", type: "isolation" },
  { name: "Ab Wheel Rollout", muscle: "core", equipment: "other", type: "isolation" },
  { name: "Russian Twist", muscle: "core", equipment: "other", type: "isolation" },
  { name: "Stomach Vacuum", muscle: "core", equipment: "bodyweight", type: "isolation" },
  { name: "Decline Sit-up", muscle: "core", equipment: "bodyweight", type: "isolation" },
  { name: "Pallof Press", muscle: "core", equipment: "cable", type: "isolation" },

  // ─── FOREARMS ───
  { name: "Wrist Curl", muscle: "forearms", equipment: "barbell", type: "isolation" },
  { name: "Reverse Wrist Curl", muscle: "forearms", equipment: "barbell", type: "isolation" },
  { name: "Farmer's Walk", muscle: "forearms", equipment: "dumbbell", type: "compound" },
];

// Common substitution pairs (bidirectional)
export const SUBSTITUTIONS = {
  "Leg Extension": ["V-Squat Machine"],
  "V-Squat Machine": ["Leg Extension"],
  "Barbell Row": ["Iso-Lateral High Row", "T-Bar Row"],
  "Neutral Grip Cable Row": ["T-Bar Row", "Machine Row"],
  "Reverse Pec Deck": ["Incline Reverse Fly"],
  "Incline Reverse Fly": ["Reverse Pec Deck"],
  "Wide Grip Lat Pulldown": ["Pull-ups", "Pull-ups (Neutral Grip)"],
  "Cable Fly (High to Low)": ["Pec Deck Machine", "DB Fly"],
  "Seated Leg Curl": ["Lying Leg Curl"],
  "Lying Leg Curl": ["Seated Leg Curl"],
  "Box Squat": ["Back Squat"],
  "Back Squat": ["Box Squat", "Hack Squat"],
  "Bench Press": ["DB Bench Press", "Machine Chest Press"],
  "Overhead Press": ["Machine Shoulder Press", "Seated DB Shoulder Press"],
  "Pull-ups": ["Wide Grip Lat Pulldown", "Close Grip Lat Pulldown"],
  "Pull-ups (Neutral Grip)": ["Close Grip Lat Pulldown"],
  "DB Lateral Raise": ["Cable Lateral Raise"],
  "Cable Lateral Raise": ["DB Lateral Raise"],
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

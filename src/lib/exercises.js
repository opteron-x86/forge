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
  { name: "Bench Press", muscle: "chest", equipment: "barbell", type: "compound", freeDbId: "Barbell_Bench_Press_-_Medium_Grip" },
  { name: "Incline Bench Press", muscle: "chest", equipment: "barbell", type: "compound", freeDbId: "Barbell_Incline_Bench_Press_-_Medium_Grip" },
  { name: "Decline Bench Press", muscle: "chest", equipment: "barbell", type: "compound", freeDbId: "Decline_Barbell_Bench_Press" },
  { name: "Close-Grip Bench", muscle: "chest", equipment: "barbell", type: "compound", freeDbId: "Close-Grip_Barbell_Bench_Press" },
  { name: "Wide-Grip Bench Press", muscle: "chest", equipment: "barbell", type: "compound", freeDbId: "Wide-Grip_Barbell_Bench_Press" },
  { name: "Floor Press", muscle: "chest", equipment: "barbell", type: "compound", freeDbId: "Floor_Press" },
  { name: "Larsen Press", muscle: "chest", equipment: "barbell", type: "compound" },
  { name: "Spoto Press", muscle: "chest", equipment: "barbell", type: "compound" },
  { name: "Pin Press", muscle: "chest", equipment: "barbell", type: "compound" },
  { name: "Reverse Grip Bench Press", muscle: "chest", equipment: "barbell", type: "compound" },
  { name: "Guillotine Press", muscle: "chest", equipment: "barbell", type: "compound", freeDbId: "Barbell_Guillotine_Bench_Press" },

  // Dumbbell
  { name: "DB Bench Press", muscle: "chest", equipment: "dumbbell", type: "compound", freeDbId: "Dumbbell_Bench_Press" },
  { name: "Flat DB Press", muscle: "chest", equipment: "dumbbell", type: "compound", freeDbId: "Dumbbell_Bench_Press" },
  { name: "Incline DB Press", muscle: "chest", equipment: "dumbbell", type: "compound", freeDbId: "Incline_Dumbbell_Press" },
  { name: "Decline DB Press", muscle: "chest", equipment: "dumbbell", type: "compound", freeDbId: "Decline_Dumbbell_Bench_Press" },
  { name: "DB Floor Press", muscle: "chest", equipment: "dumbbell", type: "compound", freeDbId: "Dumbbell_Floor_Press" },
  { name: "DB Squeeze Press", muscle: "chest", equipment: "dumbbell", type: "compound", freeDbId: "Close-Grip_Dumbbell_Press" },
  { name: "Single-Arm DB Bench Press", muscle: "chest", equipment: "dumbbell", type: "compound", freeDbId: "Dumbbell_Bench_Press" },
  { name: "DB Fly", muscle: "chest", equipment: "dumbbell", type: "isolation", freeDbId: "Dumbbell_Flyes" },
  { name: "Incline DB Fly", muscle: "chest", equipment: "dumbbell", type: "isolation", freeDbId: "Incline_Dumbbell_Flyes" },
  { name: "Decline DB Fly", muscle: "chest", equipment: "dumbbell", type: "isolation", freeDbId: "Decline_Dumbbell_Flyes" },
  { name: "DB Pullover", muscle: "chest", equipment: "dumbbell", type: "isolation", freeDbId: "Bent-Arm_Dumbbell_Pullover" },

  // Cable
  { name: "Cable Fly (High to Low)", muscle: "chest", equipment: "cable", type: "isolation" },
  { name: "Cable Fly (Low to High)", muscle: "chest", equipment: "cable", type: "isolation" },
  { name: "Cable Fly (Mid)", muscle: "chest", equipment: "cable", type: "isolation" },
  { name: "Cable Crossover", muscle: "chest", equipment: "cable", type: "isolation", freeDbId: "Cable_Crossover" },
  { name: "Single-Arm Cable Fly", muscle: "chest", equipment: "cable", type: "isolation", freeDbId: "Single-Arm_Cable_Crossover" },
  { name: "Cable Chest Press", muscle: "chest", equipment: "cable", type: "compound", freeDbId: "Cable_Chest_Press" },

  // Machine
  { name: "Machine Chest Press", muscle: "chest", equipment: "machine", type: "compound", freeDbId: "Leverage_Chest_Press" },
  { name: "Incline Machine Press", muscle: "chest", equipment: "machine", type: "compound", freeDbId: "Smith_Machine_Incline_Bench_Press" },
  { name: "Decline Machine Press", muscle: "chest", equipment: "machine", type: "compound", freeDbId: "Smith_Machine_Decline_Press" },
  { name: "Pec Deck Machine", muscle: "chest", equipment: "machine", type: "isolation", freeDbId: "Butterfly" },
  { name: "Machine Fly", muscle: "chest", equipment: "machine", type: "isolation" },
  { name: "Iso-Lateral Chest Press", muscle: "chest", equipment: "machine", type: "compound", freeDbId: "Leverage_Chest_Press" },
  { name: "Iso-Lateral Incline Press", muscle: "chest", equipment: "machine", type: "compound", freeDbId: "Leverage_Incline_Chest_Press" },
  { name: "Smith Machine Bench Press", muscle: "chest", equipment: "machine", type: "compound", freeDbId: "Smith_Machine_Bench_Press" },
  { name: "Smith Machine Incline Press", muscle: "chest", equipment: "machine", type: "compound", freeDbId: "Smith_Machine_Incline_Bench_Press" },

  // Bodyweight
  { name: "Push-ups", muscle: "chest", equipment: "bodyweight", type: "compound", freeDbId: "Pushups" },
  { name: "Incline Push-ups", muscle: "chest", equipment: "bodyweight", type: "compound", freeDbId: "Incline_Push-Up" },
  { name: "Decline Push-ups", muscle: "chest", equipment: "bodyweight", type: "compound", freeDbId: "Decline_Push-Up" },
  { name: "Diamond Push-ups", muscle: "chest", equipment: "bodyweight", type: "compound" },
  { name: "Wide Push-ups", muscle: "chest", equipment: "bodyweight", type: "compound", freeDbId: "Push-Up_Wide" },
  { name: "Dips (Chest)", muscle: "chest", equipment: "bodyweight", type: "compound", freeDbId: "Dips_-_Chest_Version" },
  { name: "Weighted Dips (Chest)", muscle: "chest", equipment: "bodyweight", type: "compound", freeDbId: "Dips_-_Chest_Version" },

  // ═══════════════════════════════════════════════════════════════
  // ─── BACK ─────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════

  // Barbell
  { name: "Conventional Deadlift", muscle: "back", equipment: "barbell", type: "compound", freeDbId: "Barbell_Deadlift" },
  { name: "Sumo Deadlift", muscle: "back", equipment: "barbell", type: "compound", freeDbId: "Sumo_Deadlift" },
  { name: "Trap Bar Deadlift", muscle: "back", equipment: "barbell", type: "compound", freeDbId: "Trap_Bar_Deadlift" },
  { name: "Deficit Deadlift", muscle: "back", equipment: "barbell", type: "compound", freeDbId: "Deficit_Deadlift" },
  { name: "Rack Pull", muscle: "back", equipment: "barbell", type: "compound", freeDbId: "Rack_Pulls" },
  { name: "Block Pull", muscle: "back", equipment: "barbell", type: "compound" },
  { name: "Barbell Row", muscle: "back", equipment: "barbell", type: "compound", freeDbId: "Bent_Over_Barbell_Row" },
  { name: "Pendlay Row", muscle: "back", equipment: "barbell", type: "compound" },
  { name: "Meadows Row", muscle: "back", equipment: "barbell", type: "compound" },
  { name: "T-Bar Row", muscle: "back", equipment: "barbell", type: "compound", freeDbId: "Bent_Over_Two-Arm_Long_Bar_Row" },
  { name: "Seal Row", muscle: "back", equipment: "barbell", type: "compound" },
  { name: "Yates Row", muscle: "back", equipment: "barbell", type: "compound" },
  { name: "Barbell Shrug", muscle: "back", equipment: "barbell", type: "isolation", freeDbId: "Barbell_Shrug" },
  { name: "Snatch Grip Deadlift", muscle: "back", equipment: "barbell", type: "compound", freeDbId: "Snatch_Deadlift" },
  { name: "Barbell Pullover", muscle: "back", equipment: "barbell", type: "isolation", freeDbId: "Bent-Arm_Barbell_Pullover" },
  { name: "Barbell Good Morning", muscle: "back", equipment: "barbell", type: "compound", freeDbId: "Stiff_Leg_Barbell_Good_Morning" },

  // Dumbbell
  { name: "One-Arm DB Row", muscle: "back", equipment: "dumbbell", type: "compound", freeDbId: "One-Arm_Dumbbell_Row" },
  { name: "DB Chest Supported Row", muscle: "back", equipment: "dumbbell", type: "compound", freeDbId: "Dumbbell_Incline_Row" },
  { name: "Incline DB Row", muscle: "back", equipment: "dumbbell", type: "compound", freeDbId: "Dumbbell_Incline_Row" },
  { name: "Kroc Row", muscle: "back", equipment: "dumbbell", type: "compound" },
  { name: "DB Shrug", muscle: "back", equipment: "dumbbell", type: "isolation", freeDbId: "Dumbbell_Shrug" },
  { name: "DB Pullover (Back)", muscle: "back", equipment: "dumbbell", type: "isolation", freeDbId: "Bent-Arm_Dumbbell_Pullover" },
  { name: "Renegade Row", muscle: "back", equipment: "dumbbell", type: "compound", freeDbId: "Alternating_Renegade_Row" },
  { name: "DB Reverse Fly (Back)", muscle: "back", equipment: "dumbbell", type: "isolation", freeDbId: "Bent_Over_Dumbbell_Rear_Delt_Raise_With_Head_On_Bench" },
  { name: "Helms Row", muscle: "back", equipment: "dumbbell", type: "compound" },

  // Cable
  { name: "Neutral Grip Cable Row", muscle: "back", equipment: "cable", type: "compound", freeDbId: "Seated_Cable_Rows" },
  { name: "Wide Grip Cable Row", muscle: "back", equipment: "cable", type: "compound", freeDbId: "Seated_Cable_Rows" },
  { name: "Close Grip Cable Row", muscle: "back", equipment: "cable", type: "compound", freeDbId: "Seated_Cable_Rows" },
  { name: "Single-Arm Cable Row", muscle: "back", equipment: "cable", type: "compound", freeDbId: "Seated_Cable_Rows" },
  { name: "Wide Grip Lat Pulldown", muscle: "back", equipment: "cable", type: "compound", freeDbId: "Wide-Grip_Lat_Pulldown" },
  { name: "Close Grip Lat Pulldown", muscle: "back", equipment: "cable", type: "compound", freeDbId: "Close-Grip_Front_Lat_Pulldown" },
  { name: "Neutral Grip Lat Pulldown", muscle: "back", equipment: "cable", type: "compound", freeDbId: "Close-Grip_Front_Lat_Pulldown" },
  { name: "Reverse Grip Lat Pulldown", muscle: "back", equipment: "cable", type: "compound", freeDbId: "Close-Grip_Front_Lat_Pulldown" },
  { name: "Behind the Neck Pulldown", muscle: "back", equipment: "cable", type: "compound", freeDbId: "Wide-Grip_Pulldown_Behind_The_Neck" },
  { name: "Single-Arm Lat Pulldown", muscle: "back", equipment: "cable", type: "compound", freeDbId: "Wide-Grip_Lat_Pulldown" },
  { name: "Straight Arm Pulldown", muscle: "back", equipment: "cable", type: "isolation", freeDbId: "Straight-Arm_Pulldown" },
  { name: "Cable Shrug", muscle: "back", equipment: "cable", type: "isolation", freeDbId: "Cable_Shrugs" },
  { name: "Cable Pullover", muscle: "back", equipment: "cable", type: "isolation" },
  { name: "Face Pull", muscle: "back", equipment: "cable", type: "isolation", freeDbId: "Face_Pull" },

  // Machine
  { name: "Machine Row", muscle: "back", equipment: "machine", type: "compound", freeDbId: "Seated_Cable_Rows" },
  { name: "Iso-Lateral Row", muscle: "back", equipment: "machine", type: "compound" },
  { name: "Iso-Lateral High Row", muscle: "back", equipment: "machine", type: "compound", freeDbId: "Leverage_High_Row" },
  { name: "Iso-Lateral Low Row", muscle: "back", equipment: "machine", type: "compound" },
  { name: "Machine Lat Pulldown", muscle: "back", equipment: "machine", type: "compound" },
  { name: "Assisted Pull-up Machine", muscle: "back", equipment: "machine", type: "compound", freeDbId: "Band_Assisted_Pull-Up" },
  { name: "Smith Machine Row", muscle: "back", equipment: "machine", type: "compound", freeDbId: "Smith_Machine_Bent_Over_Row" },
  { name: "Reverse Hyper", muscle: "back", equipment: "machine", type: "compound" },
  { name: "Machine Shrug", muscle: "back", equipment: "machine", type: "isolation" },

  // Bodyweight
  { name: "Pull-ups", muscle: "back", equipment: "bodyweight", type: "compound", freeDbId: "Pullups" },
  { name: "Pull-ups (Neutral Grip)", muscle: "back", equipment: "bodyweight", type: "compound" },
  { name: "Pull-ups (Wide Grip)", muscle: "back", equipment: "bodyweight", type: "compound" },
  { name: "Chin-ups", muscle: "back", equipment: "bodyweight", type: "compound", freeDbId: "Chin-Up" },
  { name: "Weighted Pull-ups", muscle: "back", equipment: "bodyweight", type: "compound", freeDbId: "Pullups" },
  { name: "Weighted Chin-ups", muscle: "back", equipment: "bodyweight", type: "compound", freeDbId: "Chin-Up" },
  { name: "Inverted Row", muscle: "back", equipment: "bodyweight", type: "compound", freeDbId: "Inverted_Row" },
  { name: "Back Extension", muscle: "back", equipment: "bodyweight", type: "compound", freeDbId: "Hyperextensions_Back_Extensions" },
  { name: "Hyperextension", muscle: "back", equipment: "bodyweight", type: "compound", freeDbId: "Hyperextensions_Back_Extensions" },

  // ═══════════════════════════════════════════════════════════════
  // ─── SHOULDERS ────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════

  // Barbell
  { name: "Overhead Press", muscle: "shoulders", equipment: "barbell", type: "compound", freeDbId: "Barbell_Shoulder_Press" },
  { name: "Push Press", muscle: "shoulders", equipment: "barbell", type: "compound", freeDbId: "Push_Press" },
  { name: "Behind the Neck Press", muscle: "shoulders", equipment: "barbell", type: "compound", freeDbId: "Push_Press_-_Behind_the_Neck" },
  { name: "Z Press", muscle: "shoulders", equipment: "barbell", type: "compound" },
  { name: "Bradford Press", muscle: "shoulders", equipment: "barbell", type: "compound", freeDbId: "Bradford_Rocky_Presses" },
  { name: "Barbell Front Raise", muscle: "shoulders", equipment: "barbell", type: "isolation", freeDbId: "Standing_Front_Barbell_Raise_Over_Head" },
  { name: "Barbell Upright Row", muscle: "shoulders", equipment: "barbell", type: "compound", freeDbId: "Upright_Barbell_Row" },
  { name: "Viking Press", muscle: "shoulders", equipment: "barbell", type: "compound" },

  // Dumbbell
  { name: "Seated DB Shoulder Press", muscle: "shoulders", equipment: "dumbbell", type: "compound", freeDbId: "Dumbbell_Shoulder_Press" },
  { name: "Standing DB Shoulder Press", muscle: "shoulders", equipment: "dumbbell", type: "compound", freeDbId: "Standing_Dumbbell_Press" },
  { name: "Arnold Press", muscle: "shoulders", equipment: "dumbbell", type: "compound", freeDbId: "Arnold_Dumbbell_Press" },
  { name: "DB Lateral Raise", muscle: "shoulders", equipment: "dumbbell", type: "isolation", freeDbId: "Side_Lateral_Raise" },
  { name: "DB Front Raise", muscle: "shoulders", equipment: "dumbbell", type: "isolation", freeDbId: "Front_Dumbbell_Raise" },
  { name: "Incline Reverse Fly", muscle: "shoulders", equipment: "dumbbell", type: "isolation", freeDbId: "Bent_Over_Dumbbell_Rear_Delt_Raise_With_Head_On_Bench" },
  { name: "Seated Reverse Fly", muscle: "shoulders", equipment: "dumbbell", type: "isolation", freeDbId: "Bent_Over_Dumbbell_Rear_Delt_Raise_With_Head_On_Bench" },
  { name: "Standing Reverse Fly", muscle: "shoulders", equipment: "dumbbell", type: "isolation", freeDbId: "Bent_Over_Dumbbell_Rear_Delt_Raise_With_Head_On_Bench" },
  { name: "DB Upright Row", muscle: "shoulders", equipment: "dumbbell", type: "compound", freeDbId: "Dumbbell_One-Arm_Upright_Row" },
  { name: "DB Shrug (Shoulders)", muscle: "shoulders", equipment: "dumbbell", type: "isolation", freeDbId: "Dumbbell_Shrug" },
  { name: "Lu Raise", muscle: "shoulders", equipment: "dumbbell", type: "isolation" },
  { name: "Prone Y Raise", muscle: "shoulders", equipment: "dumbbell", type: "isolation" },
  { name: "Leaning DB Lateral Raise", muscle: "shoulders", equipment: "dumbbell", type: "isolation", freeDbId: "Side_Lateral_Raise" },
  { name: "DB W Press", muscle: "shoulders", equipment: "dumbbell", type: "compound", freeDbId: "Arnold_Dumbbell_Press" },
  { name: "Single-Arm DB Lateral Raise", muscle: "shoulders", equipment: "dumbbell", type: "isolation", freeDbId: "Side_Lateral_Raise" },
  { name: "Bus Driver Raise", muscle: "shoulders", equipment: "dumbbell", type: "isolation" },

  // Cable
  { name: "Cable Lateral Raise", muscle: "shoulders", equipment: "cable", type: "isolation", freeDbId: "Cable_Seated_Lateral_Raise" },
  { name: "Cable Front Raise", muscle: "shoulders", equipment: "cable", type: "isolation", freeDbId: "Front_Cable_Raise" },
  { name: "Cable Rear Delt Fly", muscle: "shoulders", equipment: "cable", type: "isolation", freeDbId: "Cable_Rear_Delt_Fly" },
  { name: "Cable Upright Row", muscle: "shoulders", equipment: "cable", type: "compound", freeDbId: "Upright_Cable_Row" },
  { name: "Cable Y Raise", muscle: "shoulders", equipment: "cable", type: "isolation", freeDbId: "Front_Cable_Raise" },
  { name: "Single-Arm Cable Lateral Raise", muscle: "shoulders", equipment: "cable", type: "isolation", freeDbId: "Cable_Seated_Lateral_Raise" },

  // Machine
  { name: "Machine Shoulder Press", muscle: "shoulders", equipment: "machine", type: "compound", freeDbId: "Machine_Shoulder_Military_Press" },
  { name: "Iso-Lateral Shoulder Press", muscle: "shoulders", equipment: "machine", type: "compound", freeDbId: "Leverage_Shoulder_Press" },
  { name: "Machine Lateral Raise", muscle: "shoulders", equipment: "machine", type: "isolation" },
  { name: "Reverse Pec Deck", muscle: "shoulders", equipment: "machine", type: "isolation", freeDbId: "Reverse_Machine_Flyes" },
  { name: "Smith Machine Overhead Press", muscle: "shoulders", equipment: "machine", type: "compound", freeDbId: "Smith_Machine_Overhead_Shoulder_Press" },
  { name: "Smith Machine Behind Neck Press", muscle: "shoulders", equipment: "machine", type: "compound" },

  // Bodyweight
  { name: "Handstand Push-ups", muscle: "shoulders", equipment: "bodyweight", type: "compound", freeDbId: "Handstand_Push-Ups" },
  { name: "Pike Push-ups", muscle: "shoulders", equipment: "bodyweight", type: "compound" },

  // ═══════════════════════════════════════════════════════════════
  // ─── QUADS ────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════

  // Barbell
  { name: "Back Squat", muscle: "quads", equipment: "barbell", type: "compound", freeDbId: "Barbell_Squat" },
  { name: "Front Squat", muscle: "quads", equipment: "barbell", type: "compound", freeDbId: "Front_Barbell_Squat" },
  { name: "Box Squat", muscle: "quads", equipment: "barbell", type: "compound", freeDbId: "Box_Squat" },
  { name: "Pause Squat", muscle: "quads", equipment: "barbell", type: "compound" },
  { name: "Pin Squat", muscle: "quads", equipment: "barbell", type: "compound" },
  { name: "Tempo Squat", muscle: "quads", equipment: "barbell", type: "compound" },
  { name: "Safety Bar Squat", muscle: "quads", equipment: "barbell", type: "compound" },
  { name: "Zercher Squat", muscle: "quads", equipment: "barbell", type: "compound" },
  { name: "Barbell Lunge", muscle: "quads", equipment: "barbell", type: "compound", freeDbId: "Barbell_Lunge" },
  { name: "Walking Lunge (Barbell)", muscle: "quads", equipment: "barbell", type: "compound", freeDbId: "Barbell_Walking_Lunge" },
  { name: "Barbell Step-up", muscle: "quads", equipment: "barbell", type: "compound", freeDbId: "Barbell_Step_Ups" },
  { name: "Barbell Bulgarian Split Squat", muscle: "quads", equipment: "barbell", type: "compound", freeDbId: "Barbell_Lunge" },
  { name: "Overhead Squat", muscle: "quads", equipment: "barbell", type: "compound", freeDbId: "Overhead_Squat" },

  // Dumbbell
  { name: "DB Goblet Squat", muscle: "quads", equipment: "dumbbell", type: "compound", freeDbId: "Goblet_Squat" },
  { name: "DB Lunge", muscle: "quads", equipment: "dumbbell", type: "compound", freeDbId: "Dumbbell_Lunges" },
  { name: "DB Walking Lunge", muscle: "quads", equipment: "dumbbell", type: "compound", freeDbId: "Bodyweight_Walking_Lunge" },
  { name: "DB Reverse Lunge", muscle: "quads", equipment: "dumbbell", type: "compound", freeDbId: "Dumbbell_Rear_Lunge" },
  { name: "DB Bulgarian Split Squat", muscle: "quads", equipment: "dumbbell", type: "compound", freeDbId: "Dumbbell_Lunges" },
  { name: "DB Step-up", muscle: "quads", equipment: "dumbbell", type: "compound", freeDbId: "Dumbbell_Step_Ups" },
  { name: "DB Split Squat", muscle: "quads", equipment: "dumbbell", type: "compound", freeDbId: "Dumbbell_Squat" },
  { name: "DB Squat", muscle: "quads", equipment: "dumbbell", type: "compound", freeDbId: "Dumbbell_Squat" },
  { name: "DB Lateral Lunge", muscle: "quads", equipment: "dumbbell", type: "compound", freeDbId: "Dumbbell_Lunges" },

  // Machine
  { name: "Leg Press", muscle: "quads", equipment: "machine", type: "compound", freeDbId: "Leg_Press" },
  { name: "Single-Leg Leg Press", muscle: "quads", equipment: "machine", type: "compound", freeDbId: "Leg_Press" },
  { name: "Narrow Stance Leg Press", muscle: "quads", equipment: "machine", type: "compound", freeDbId: "Narrow_Stance_Leg_Press" },
  { name: "Wide Stance Leg Press", muscle: "quads", equipment: "machine", type: "compound" },
  { name: "Hack Squat", muscle: "quads", equipment: "machine", type: "compound", freeDbId: "Hack_Squat" },
  { name: "Reverse Hack Squat", muscle: "quads", equipment: "machine", type: "compound", freeDbId: "Hack_Squat" },
  { name: "V-Squat Machine", muscle: "quads", equipment: "machine", type: "compound" },
  { name: "Leg Extension", muscle: "quads", equipment: "machine", type: "isolation", freeDbId: "Leg_Extensions" },
  { name: "Single-Leg Extension", muscle: "quads", equipment: "machine", type: "isolation", freeDbId: "Single-Leg_Leg_Extension" },
  { name: "Smith Machine Squat", muscle: "quads", equipment: "machine", type: "compound", freeDbId: "Smith_Machine_Squat" },
  { name: "Smith Machine Front Squat", muscle: "quads", equipment: "machine", type: "compound" },
  { name: "Smith Machine Lunge", muscle: "quads", equipment: "machine", type: "compound", freeDbId: "Smith_Machine_Squat" },
  { name: "Belt Squat", muscle: "quads", equipment: "machine", type: "compound" },
  { name: "Pendulum Squat", muscle: "quads", equipment: "machine", type: "compound" },
  { name: "Sissy Squat Machine", muscle: "quads", equipment: "machine", type: "isolation", freeDbId: "Weighted_Sissy_Squat" },

  // Bodyweight
  { name: "Bodyweight Squat", muscle: "quads", equipment: "bodyweight", type: "compound", freeDbId: "Bodyweight_Squat" },
  { name: "Pistol Squat", muscle: "quads", equipment: "bodyweight", type: "compound", freeDbId: "Kettlebell_Pistol_Squat" },
  { name: "Sissy Squat", muscle: "quads", equipment: "bodyweight", type: "isolation", freeDbId: "Weighted_Sissy_Squat" },
  { name: "Wall Sit", muscle: "quads", equipment: "bodyweight", type: "isolation" },
  { name: "Jump Squat", muscle: "quads", equipment: "bodyweight", type: "compound", freeDbId: "Freehand_Jump_Squat" },
  { name: "Bodyweight Lunge", muscle: "quads", equipment: "bodyweight", type: "compound", freeDbId: "Bodyweight_Walking_Lunge" },
  { name: "Box Jump", muscle: "quads", equipment: "bodyweight", type: "compound", freeDbId: "Box_Jump_Multiple_Response" },

  // ═══════════════════════════════════════════════════════════════
  // ─── HAMSTRINGS ───────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════

  // Barbell
  { name: "Romanian Deadlift", muscle: "hamstrings", equipment: "barbell", type: "compound", freeDbId: "Romanian_Deadlift" },
  { name: "Stiff-Leg Deadlift", muscle: "hamstrings", equipment: "barbell", type: "compound", freeDbId: "Stiff-Legged_Barbell_Deadlift" },
  { name: "Good Morning", muscle: "hamstrings", equipment: "barbell", type: "compound", freeDbId: "Stiff_Leg_Barbell_Good_Morning" },
  { name: "Barbell Hip Thrust", muscle: "hamstrings", equipment: "barbell", type: "compound", freeDbId: "Barbell_Hip_Thrust" },

  // Dumbbell
  { name: "DB Romanian Deadlift", muscle: "hamstrings", equipment: "dumbbell", type: "compound", freeDbId: "Romanian_Deadlift" },
  { name: "DB Stiff-Leg Deadlift", muscle: "hamstrings", equipment: "dumbbell", type: "compound", freeDbId: "Stiff-Legged_Dumbbell_Deadlift" },
  { name: "Single-Leg DB RDL", muscle: "hamstrings", equipment: "dumbbell", type: "compound" },
  { name: "DB Good Morning", muscle: "hamstrings", equipment: "dumbbell", type: "compound", freeDbId: "Good_Morning" },

  // Cable
  { name: "Cable Pull-Through", muscle: "hamstrings", equipment: "cable", type: "compound", freeDbId: "Pull_Through" },
  { name: "Cable Romanian Deadlift", muscle: "hamstrings", equipment: "cable", type: "compound", freeDbId: "Romanian_Deadlift" },
  { name: "Cable Leg Curl", muscle: "hamstrings", equipment: "cable", type: "isolation" },

  // Machine
  { name: "Seated Leg Curl", muscle: "hamstrings", equipment: "machine", type: "isolation", freeDbId: "Seated_Leg_Curl" },
  { name: "Lying Leg Curl", muscle: "hamstrings", equipment: "machine", type: "isolation", freeDbId: "Lying_Leg_Curls" },
  { name: "Standing Leg Curl", muscle: "hamstrings", equipment: "machine", type: "isolation", freeDbId: "Standing_Leg_Curl" },
  { name: "Single-Leg Curl", muscle: "hamstrings", equipment: "machine", type: "isolation" },

  // Bodyweight
  { name: "Nordic Hamstring Curl", muscle: "hamstrings", equipment: "bodyweight", type: "isolation" },
  { name: "Glute-Ham Raise", muscle: "hamstrings", equipment: "bodyweight", type: "compound", freeDbId: "Floor_Glute-Ham_Raise" },
  { name: "Slider Leg Curl", muscle: "hamstrings", equipment: "bodyweight", type: "isolation" },
  { name: "Single-Leg Glute Bridge", muscle: "hamstrings", equipment: "bodyweight", type: "compound" },

  // Other
  { name: "Kettlebell Swing", muscle: "hamstrings", equipment: "other", type: "compound", freeDbId: "One-Arm_Kettlebell_Swings" },

  // ═══════════════════════════════════════════════════════════════
  // ─── GLUTES ───────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════

  // Barbell
  { name: "Hip Thrust", muscle: "glutes", equipment: "barbell", type: "compound", freeDbId: "Barbell_Hip_Thrust" },
  { name: "Barbell Glute Bridge", muscle: "glutes", equipment: "barbell", type: "compound", freeDbId: "Barbell_Glute_Bridge" },
  { name: "Sumo Squat", muscle: "glutes", equipment: "barbell", type: "compound" },

  // Dumbbell
  { name: "DB Hip Thrust", muscle: "glutes", equipment: "dumbbell", type: "compound" },
  { name: "DB Frog Pump", muscle: "glutes", equipment: "dumbbell", type: "isolation", freeDbId: "Butt_Lift_Bridge" },
  { name: "DB Sumo Squat", muscle: "glutes", equipment: "dumbbell", type: "compound", freeDbId: "Dumbbell_Squat" },

  // Cable
  { name: "Cable Kickback", muscle: "glutes", equipment: "cable", type: "isolation", freeDbId: "One-Legged_Cable_Kickback" },
  { name: "Cable Hip Abduction", muscle: "glutes", equipment: "cable", type: "isolation" },

  // Machine
  { name: "Hip Thrust Machine", muscle: "glutes", equipment: "machine", type: "compound" },
  { name: "Glute Drive Machine", muscle: "glutes", equipment: "machine", type: "compound" },
  { name: "Hip Abduction Machine", muscle: "glutes", equipment: "machine", type: "isolation" },
  { name: "Hip Adduction Machine", muscle: "glutes", equipment: "machine", type: "isolation" },

  // Bodyweight
  { name: "Glute Bridge", muscle: "glutes", equipment: "bodyweight", type: "compound", freeDbId: "Barbell_Glute_Bridge" },
  { name: "Donkey Kick", muscle: "glutes", equipment: "bodyweight", type: "isolation" },
  { name: "Fire Hydrant", muscle: "glutes", equipment: "bodyweight", type: "isolation" },
  { name: "Clamshell", muscle: "glutes", equipment: "bodyweight", type: "isolation" },
  { name: "Frog Pump", muscle: "glutes", equipment: "bodyweight", type: "isolation", freeDbId: "Butt_Lift_Bridge" },

  // Other
  { name: "Banded Walk", muscle: "glutes", equipment: "other", type: "isolation" },
  { name: "Banded Clamshell", muscle: "glutes", equipment: "other", type: "isolation" },
  { name: "Banded Hip Thrust", muscle: "glutes", equipment: "other", type: "compound" },
  { name: "Kettlebell Sumo Squat", muscle: "glutes", equipment: "other", type: "compound" },

  // ═══════════════════════════════════════════════════════════════
  // ─── BICEPS ───────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════

  // Barbell
  { name: "Barbell Curl", muscle: "biceps", equipment: "barbell", type: "isolation", freeDbId: "Barbell_Curl" },
  { name: "EZ-Bar Curl", muscle: "biceps", equipment: "barbell", type: "isolation", freeDbId: "EZ-Bar_Curl" },
  { name: "Reverse Barbell Curl", muscle: "biceps", equipment: "barbell", type: "isolation", freeDbId: "Reverse_Barbell_Curl" },
  { name: "Wide Grip Barbell Curl", muscle: "biceps", equipment: "barbell", type: "isolation", freeDbId: "Wide-Grip_Standing_Barbell_Curl" },
  { name: "Close Grip Barbell Curl", muscle: "biceps", equipment: "barbell", type: "isolation", freeDbId: "Close-Grip_EZ_Bar_Curl" },
  { name: "EZ-Bar Spider Curl", muscle: "biceps", equipment: "barbell", type: "isolation", freeDbId: "Spider_Curl" },
  { name: "Barbell Drag Curl", muscle: "biceps", equipment: "barbell", type: "isolation", freeDbId: "Drag_Curl" },
  { name: "Barbell 21s", muscle: "biceps", equipment: "barbell", type: "isolation" },

  // Dumbbell
  { name: "DB Curl", muscle: "biceps", equipment: "dumbbell", type: "isolation", freeDbId: "Dumbbell_Bicep_Curl" },
  { name: "Hammer Curl", muscle: "biceps", equipment: "dumbbell", type: "isolation", freeDbId: "Alternate_Hammer_Curl" },
  { name: "Incline DB Curl", muscle: "biceps", equipment: "dumbbell", type: "isolation", freeDbId: "Alternate_Incline_Dumbbell_Curl" },
  { name: "Preacher Curl (DB)", muscle: "biceps", equipment: "dumbbell", type: "isolation", freeDbId: "Preacher_Hammer_Dumbbell_Curl" },
  { name: "Concentration Curl", muscle: "biceps", equipment: "dumbbell", type: "isolation", freeDbId: "Concentration_Curls" },
  { name: "Cross-Body Hammer Curl", muscle: "biceps", equipment: "dumbbell", type: "isolation", freeDbId: "Cross_Body_Hammer_Curl" },
  { name: "Zottman Curl", muscle: "biceps", equipment: "dumbbell", type: "isolation", freeDbId: "Zottman_Curl" },
  { name: "DB Spider Curl", muscle: "biceps", equipment: "dumbbell", type: "isolation", freeDbId: "Spider_Curl" },
  { name: "Alternating DB Curl", muscle: "biceps", equipment: "dumbbell", type: "isolation", freeDbId: "Dumbbell_Bicep_Curl" },
  { name: "Seated DB Curl", muscle: "biceps", equipment: "dumbbell", type: "isolation", freeDbId: "Seated_Dumbbell_Curl" },
  { name: "DB Reverse Curl", muscle: "biceps", equipment: "dumbbell", type: "isolation", freeDbId: "Standing_Dumbbell_Reverse_Curl" },
  { name: "DB Drag Curl", muscle: "biceps", equipment: "dumbbell", type: "isolation", freeDbId: "Drag_Curl" },
  { name: "Waiter Curl", muscle: "biceps", equipment: "dumbbell", type: "isolation" },

  // Cable
  { name: "Cable Curl", muscle: "biceps", equipment: "cable", type: "isolation", freeDbId: "Standing_Biceps_Cable_Curl" },
  { name: "Cable Hammer Curl", muscle: "biceps", equipment: "cable", type: "isolation", freeDbId: "Cable_Hammer_Curls_-_Rope_Attachment" },
  { name: "Cable Rope Curl", muscle: "biceps", equipment: "cable", type: "isolation", freeDbId: "Cable_Hammer_Curls_-_Rope_Attachment" },
  { name: "High Cable Curl", muscle: "biceps", equipment: "cable", type: "isolation", freeDbId: "High_Cable_Curls" },
  { name: "Cable Bayesian Curl", muscle: "biceps", equipment: "cable", type: "isolation" },
  { name: "Single-Arm Cable Curl", muscle: "biceps", equipment: "cable", type: "isolation", freeDbId: "Standing_One-Arm_Cable_Curl" },
  { name: "Cable Preacher Curl", muscle: "biceps", equipment: "cable", type: "isolation", freeDbId: "Cable_Preacher_Curl" },

  // Machine
  { name: "Preacher Curl", muscle: "biceps", equipment: "machine", type: "isolation", freeDbId: "Preacher_Curl" },
  { name: "Machine Curl", muscle: "biceps", equipment: "machine", type: "isolation", freeDbId: "Machine_Bicep_Curl" },
  { name: "Machine Preacher Curl", muscle: "biceps", equipment: "machine", type: "isolation", freeDbId: "Machine_Preacher_Curls" },

  // ═══════════════════════════════════════════════════════════════
  // ─── TRICEPS ──────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════

  // Barbell
  { name: "Skull Crushers", muscle: "triceps", equipment: "barbell", type: "isolation", freeDbId: "Lying_Triceps_Press" },
  { name: "EZ-Bar Skull Crushers", muscle: "triceps", equipment: "barbell", type: "isolation", freeDbId: "Lying_Triceps_Press" },
  { name: "Close-Grip Bench Press", muscle: "triceps", equipment: "barbell", type: "compound", freeDbId: "Close-Grip_Barbell_Bench_Press" },
  { name: "JM Press", muscle: "triceps", equipment: "barbell", type: "compound", freeDbId: "JM_Press" },
  { name: "Barbell Overhead Extension", muscle: "triceps", equipment: "barbell", type: "isolation", freeDbId: "Standing_Overhead_Barbell_Triceps_Extension" },

  // Dumbbell
  { name: "DB Overhead Extension", muscle: "triceps", equipment: "dumbbell", type: "isolation", freeDbId: "Standing_One-Arm_Dumbbell_Triceps_Extension" },
  { name: "Single-Arm DB Overhead Extension", muscle: "triceps", equipment: "dumbbell", type: "isolation", freeDbId: "Standing_One-Arm_Dumbbell_Triceps_Extension" },
  { name: "DB Kickback", muscle: "triceps", equipment: "dumbbell", type: "isolation", freeDbId: "Tricep_Dumbbell_Kickback" },
  { name: "DB Skull Crusher", muscle: "triceps", equipment: "dumbbell", type: "isolation", freeDbId: "Lying_Triceps_Press" },
  { name: "Tate Press", muscle: "triceps", equipment: "dumbbell", type: "isolation", freeDbId: "Tate_Press" },
  { name: "DB Close-Grip Press", muscle: "triceps", equipment: "dumbbell", type: "compound", freeDbId: "Close-Grip_Dumbbell_Press" },

  // Cable
  { name: "Rope Pushdown", muscle: "triceps", equipment: "cable", type: "isolation", freeDbId: "Triceps_Pushdown_-_Rope_Attachment" },
  { name: "Straight Bar Pushdown", muscle: "triceps", equipment: "cable", type: "isolation", freeDbId: "Triceps_Pushdown" },
  { name: "V-Bar Pushdown", muscle: "triceps", equipment: "cable", type: "isolation", freeDbId: "Triceps_Pushdown_-_V-Bar_Attachment" },
  { name: "Reverse Grip Pushdown", muscle: "triceps", equipment: "cable", type: "isolation", freeDbId: "Reverse_Grip_Triceps_Pushdown" },
  { name: "Single-Arm Pushdown", muscle: "triceps", equipment: "cable", type: "isolation", freeDbId: "Cable_One_Arm_Tricep_Extension" },
  { name: "Overhead Tricep Extension", muscle: "triceps", equipment: "cable", type: "isolation", freeDbId: "Cable_Rope_Overhead_Triceps_Extension" },
  { name: "Overhead Rope Extension", muscle: "triceps", equipment: "cable", type: "isolation", freeDbId: "Cable_Rope_Overhead_Triceps_Extension" },
  { name: "Cable Tricep Kickback", muscle: "triceps", equipment: "cable", type: "isolation" },
  { name: "Cross-Body Cable Extension", muscle: "triceps", equipment: "cable", type: "isolation", freeDbId: "Cable_One_Arm_Tricep_Extension" },

  // Machine
  { name: "Machine Tricep Extension", muscle: "triceps", equipment: "machine", type: "isolation", freeDbId: "Machine_Triceps_Extension" },
  { name: "Assisted Dips Machine", muscle: "triceps", equipment: "machine", type: "compound" },
  { name: "Machine Dip", muscle: "triceps", equipment: "machine", type: "compound", freeDbId: "Dip_Machine" },

  // Bodyweight
  { name: "Dips (Triceps)", muscle: "triceps", equipment: "bodyweight", type: "compound", freeDbId: "Dips_-_Triceps_Version" },
  { name: "Weighted Dips (Triceps)", muscle: "triceps", equipment: "bodyweight", type: "compound", freeDbId: "Dips_-_Triceps_Version" },
  { name: "Bench Dips", muscle: "triceps", equipment: "bodyweight", type: "compound", freeDbId: "Bench_Dips" },
  { name: "Close-Grip Push-ups", muscle: "triceps", equipment: "bodyweight", type: "compound" },

  // ═══════════════════════════════════════════════════════════════
  // ─── CALVES ───────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════

  // Machine
  { name: "Seated Calf Raise", muscle: "calves", equipment: "machine", type: "isolation", freeDbId: "Barbell_Seated_Calf_Raise" },
  { name: "Standing Calf Raise Machine", muscle: "calves", equipment: "machine", type: "isolation", freeDbId: "Standing_Calf_Raises" },
  { name: "Leg Press Calf Raise", muscle: "calves", equipment: "machine", type: "isolation", freeDbId: "Calf_Press_On_The_Leg_Press_Machine" },
  { name: "Donkey Calf Raise", muscle: "calves", equipment: "machine", type: "isolation", freeDbId: "Donkey_Calf_Raises" },
  { name: "Smith Machine Calf Raise", muscle: "calves", equipment: "machine", type: "isolation", freeDbId: "Smith_Machine_Calf_Raise" },
  { name: "Hack Squat Calf Raise", muscle: "calves", equipment: "machine", type: "isolation" },
  { name: "Tibialis Raise Machine", muscle: "calves", equipment: "machine", type: "isolation" },

  // Dumbbell
  { name: "Single-Leg Standing Calf Raise", muscle: "calves", equipment: "dumbbell", type: "isolation", freeDbId: "Standing_Dumbbell_Calf_Raise" },
  { name: "DB Standing Calf Raise", muscle: "calves", equipment: "dumbbell", type: "isolation", freeDbId: "Standing_Dumbbell_Calf_Raise" },

  // Barbell
  { name: "Barbell Standing Calf Raise", muscle: "calves", equipment: "barbell", type: "isolation", freeDbId: "Standing_Barbell_Calf_Raise" },

  // Bodyweight
  { name: "Bodyweight Calf Raise", muscle: "calves", equipment: "bodyweight", type: "isolation", freeDbId: "Calf_Raise_On_A_Dumbbell" },
  { name: "Single-Leg Bodyweight Calf Raise", muscle: "calves", equipment: "bodyweight", type: "isolation" },

  // ═══════════════════════════════════════════════════════════════
  // ─── CORE ─────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════

  // Bodyweight
  { name: "Crunch", muscle: "core", equipment: "bodyweight", type: "isolation", freeDbId: "Crunches" },
  { name: "Sit-up", muscle: "core", equipment: "bodyweight", type: "isolation", freeDbId: "Sit-Up" },
  { name: "Decline Sit-up", muscle: "core", equipment: "bodyweight", type: "isolation", freeDbId: "Decline_Crunch" },
  { name: "Bicycle Crunch", muscle: "core", equipment: "bodyweight", type: "isolation", freeDbId: "Air_Bike" },
  { name: "Reverse Crunch", muscle: "core", equipment: "bodyweight", type: "isolation", freeDbId: "Reverse_Crunch" },
  { name: "Leg Raise", muscle: "core", equipment: "bodyweight", type: "isolation", freeDbId: "Flat_Bench_Lying_Leg_Raise" },
  { name: "Hanging Leg Raise", muscle: "core", equipment: "bodyweight", type: "isolation", freeDbId: "Hanging_Leg_Raise" },
  { name: "Hanging Knee Raise", muscle: "core", equipment: "bodyweight", type: "isolation", freeDbId: "Knee_Hip_Raise_On_Parallel_Bars" },
  { name: "Captain's Chair Leg Raise", muscle: "core", equipment: "bodyweight", type: "isolation", freeDbId: "Knee_Hip_Raise_On_Parallel_Bars" },
  { name: "Toes to Bar", muscle: "core", equipment: "bodyweight", type: "isolation" },
  { name: "Windshield Wiper", muscle: "core", equipment: "bodyweight", type: "isolation" },
  { name: "Plank", muscle: "core", equipment: "bodyweight", type: "isolation", freeDbId: "Plank" },
  { name: "Side Plank", muscle: "core", equipment: "bodyweight", type: "isolation", freeDbId: "Plank" },
  { name: "RKC Plank", muscle: "core", equipment: "bodyweight", type: "isolation", freeDbId: "Plank" },
  { name: "Mountain Climber", muscle: "core", equipment: "bodyweight", type: "isolation", freeDbId: "Mountain_Climbers" },
  { name: "Dead Bug", muscle: "core", equipment: "bodyweight", type: "isolation", freeDbId: "Dead_Bug" },
  { name: "Bird Dog", muscle: "core", equipment: "bodyweight", type: "isolation" },
  { name: "Hollow Body Hold", muscle: "core", equipment: "bodyweight", type: "isolation" },
  { name: "V-up", muscle: "core", equipment: "bodyweight", type: "isolation" },
  { name: "Stomach Vacuum", muscle: "core", equipment: "bodyweight", type: "isolation" },
  { name: "Flutter Kick", muscle: "core", equipment: "bodyweight", type: "isolation" },
  { name: "Scissor Kick", muscle: "core", equipment: "bodyweight", type: "isolation" },
  { name: "Superman", muscle: "core", equipment: "bodyweight", type: "isolation", freeDbId: "Superman" },
  { name: "Dragon Flag", muscle: "core", equipment: "bodyweight", type: "isolation" },
  { name: "Ab Wheel Rollout", muscle: "core", equipment: "bodyweight", type: "isolation", freeDbId: "Ab_Roller" },
  { name: "L-Sit", muscle: "core", equipment: "bodyweight", type: "isolation" },

  // Cable
  { name: "Cable Crunch", muscle: "core", equipment: "cable", type: "isolation", freeDbId: "Cable_Crunch" },
  { name: "Pallof Press", muscle: "core", equipment: "cable", type: "isolation", freeDbId: "Pallof_Press" },
  { name: "Cable Woodchop", muscle: "core", equipment: "cable", type: "isolation" },
  { name: "Cable Side Bend", muscle: "core", equipment: "cable", type: "isolation" },
  { name: "Cable Rotation", muscle: "core", equipment: "cable", type: "isolation", freeDbId: "Cable_Internal_Rotation" },

  // Machine
  { name: "Ab Machine Crunch", muscle: "core", equipment: "machine", type: "isolation", freeDbId: "Ab_Crunch_Machine" },
  { name: "Machine Torso Rotation", muscle: "core", equipment: "machine", type: "isolation" },

  // Dumbbell
  { name: "DB Side Bend", muscle: "core", equipment: "dumbbell", type: "isolation", freeDbId: "Dumbbell_Side_Bend" },
  { name: "DB Russian Twist", muscle: "core", equipment: "dumbbell", type: "isolation", freeDbId: "Russian_Twist" },
  { name: "Weighted Sit-up", muscle: "core", equipment: "dumbbell", type: "isolation" },
  { name: "Turkish Get-up", muscle: "core", equipment: "dumbbell", type: "compound" },
  { name: "Suitcase Carry", muscle: "core", equipment: "dumbbell", type: "compound" },

  // Barbell
  { name: "Barbell Rollout", muscle: "core", equipment: "barbell", type: "isolation", freeDbId: "Barbell_Ab_Rollout_-_On_Knees" },
  { name: "Landmine Rotation", muscle: "core", equipment: "barbell", type: "isolation" },

  // Other
  { name: "Medicine Ball Slam", muscle: "core", equipment: "other", type: "compound", freeDbId: "One-Arm_Medicine_Ball_Slam" },
  { name: "Medicine Ball Russian Twist", muscle: "core", equipment: "other", type: "isolation", freeDbId: "Medicine_Ball_Full_Twist" },

  // ═══════════════════════════════════════════════════════════════
  // ─── FOREARMS ─────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════

  // Barbell
  { name: "Wrist Curl", muscle: "forearms", equipment: "barbell", type: "isolation", freeDbId: "Palms-Up_Barbell_Wrist_Curl_Over_A_Bench" },
  { name: "Reverse Wrist Curl", muscle: "forearms", equipment: "barbell", type: "isolation" },
  { name: "Behind the Back Wrist Curl", muscle: "forearms", equipment: "barbell", type: "isolation", freeDbId: "Standing_Palms-Up_Barbell_Behind_The_Back_Wrist_Curl" },

  // Dumbbell
  { name: "DB Wrist Curl", muscle: "forearms", equipment: "dumbbell", type: "isolation", freeDbId: "Seated_Dumbbell_Palms-Up_Wrist_Curl" },
  { name: "DB Reverse Wrist Curl", muscle: "forearms", equipment: "dumbbell", type: "isolation", freeDbId: "Seated_Dumbbell_Palms-Down_Wrist_Curl" },
  { name: "Farmer's Walk", muscle: "forearms", equipment: "dumbbell", type: "compound", freeDbId: "Farmers_Walk" },
  { name: "DB Pinch Hold", muscle: "forearms", equipment: "dumbbell", type: "isolation" },

  // Cable
  { name: "Cable Wrist Curl", muscle: "forearms", equipment: "cable", type: "isolation", freeDbId: "Cable_Wrist_Curl" },

  // Other
  { name: "Plate Pinch Hold", muscle: "forearms", equipment: "other", type: "isolation", freeDbId: "Plate_Pinch" },
  { name: "Fat Grip Hold", muscle: "forearms", equipment: "other", type: "isolation" },
  { name: "Dead Hang", muscle: "forearms", equipment: "other", type: "isolation" },
  { name: "Gripper", muscle: "forearms", equipment: "other", type: "isolation" },
  { name: "Towel Pull-up", muscle: "forearms", equipment: "other", type: "compound" },
  { name: "Trap Bar Carry", muscle: "forearms", equipment: "other", type: "compound" },

  // ═══════════════════════════════════════════════════════════════
  // ─── IMPORTED FROM free-exercise-db ───────────────────────────
  // ═══════════════════════════════════════════════════════════════

  // ── Chest (new) ──
  { name: "Alternating Floor Press", muscle: "chest", equipment: "other", type: "compound", freeDbId: "Alternating_Floor_Press" },
  { name: "Around The Worlds", muscle: "chest", equipment: "dumbbell", type: "compound", freeDbId: "Around_The_Worlds" },
  { name: "Bench Press (Bands)", muscle: "chest", equipment: "other", type: "compound" },
  { name: "Bodyweight Flyes", muscle: "chest", equipment: "barbell", type: "isolation", freeDbId: "Bodyweight_Flyes" },
  { name: "Cable Iron Cross", muscle: "chest", equipment: "cable", type: "isolation", freeDbId: "Cable_Iron_Cross" },
  { name: "Chain Press", muscle: "chest", equipment: "other", type: "compound", freeDbId: "Chain_Press" },
  { name: "Clock Push-Up", muscle: "chest", equipment: "bodyweight", type: "compound", freeDbId: "Clock_Push-Up" },
  { name: "Cross Over (Bands)", muscle: "chest", equipment: "other", type: "compound" },
  { name: "DB Bench Press with Neutral Grip", muscle: "chest", equipment: "dumbbell", type: "compound" },
  { name: "Decline Smith Press", muscle: "chest", equipment: "machine", type: "compound", freeDbId: "Decline_Smith_Press" },
  { name: "Extended Range One-Arm Kettlebell Floor Press", muscle: "chest", equipment: "other", type: "compound", freeDbId: "Extended_Range_One-Arm_Kettlebell_Floor_Press" },
  { name: "Flat Bench Cable Flyes", muscle: "chest", equipment: "cable", type: "isolation", freeDbId: "Flat_Bench_Cable_Flyes" },
  { name: "Front Raise And Pullover", muscle: "chest", equipment: "barbell", type: "compound", freeDbId: "Front_Raise_And_Pullover" },
  { name: "Hammer Grip Incline DB Bench Press", muscle: "chest", equipment: "dumbbell", type: "compound", freeDbId: "Hammer_Grip_Incline_DB_Bench_Press" },
  { name: "Incline Cable Chest Press", muscle: "chest", equipment: "cable", type: "compound", freeDbId: "Incline_Cable_Chest_Press" },
  { name: "Incline Cable Flye", muscle: "chest", equipment: "cable", type: "isolation", freeDbId: "Incline_Cable_Flye" },
  { name: "Incline DB Bench With Palms Facing In", muscle: "chest", equipment: "dumbbell", type: "compound" },
  { name: "Incline DB Flyes - With A Twist", muscle: "chest", equipment: "dumbbell", type: "compound" },
  { name: "Incline Push-Up Medium", muscle: "chest", equipment: "bodyweight", type: "compound", freeDbId: "Incline_Push-Up_Medium" },
  { name: "Incline Push-Up Reverse Grip", muscle: "chest", equipment: "bodyweight", type: "compound", freeDbId: "Incline_Push-Up_Reverse_Grip" },
  { name: "Incline Push-Up Wide", muscle: "chest", equipment: "bodyweight", type: "compound", freeDbId: "Incline_Push-Up_Wide" },
  { name: "Isometric Wipers", muscle: "chest", equipment: "bodyweight", type: "compound", freeDbId: "Isometric_Wipers" },
  { name: "Leg-Over Floor Press", muscle: "chest", equipment: "other", type: "compound", freeDbId: "Leg-Over_Floor_Press" },
  { name: "Leverage Decline Chest Press", muscle: "chest", equipment: "machine", type: "compound", freeDbId: "Leverage_Decline_Chest_Press" },
  { name: "Low Cable Crossover", muscle: "chest", equipment: "cable", type: "isolation", freeDbId: "Low_Cable_Crossover" },
  { name: "Machine Bench Press", muscle: "chest", equipment: "machine", type: "compound", freeDbId: "Machine_Bench_Press" },
  { name: "Neck Press", muscle: "chest", equipment: "barbell", type: "compound", freeDbId: "Neck_Press" },
  { name: "One Arm DB Bench Press", muscle: "chest", equipment: "dumbbell", type: "compound" },
  { name: "One-Arm Flat Bench DB Flye", muscle: "chest", equipment: "dumbbell", type: "isolation" },
  { name: "One-Arm Kettlebell Floor Press", muscle: "chest", equipment: "other", type: "compound", freeDbId: "One-Arm_Kettlebell_Floor_Press" },
  { name: "Plyo Kettlebell Pushups", muscle: "chest", equipment: "other", type: "compound", freeDbId: "Plyo_Kettlebell_Pushups" },
  { name: "Push Up to Side Plank", muscle: "chest", equipment: "bodyweight", type: "compound", freeDbId: "Push_Up_to_Side_Plank" },
  { name: "Push-Ups With Feet Elevated", muscle: "chest", equipment: "bodyweight", type: "compound", freeDbId: "Push-Ups_With_Feet_Elevated" },
  { name: "Push-Ups With Feet On An Exercise Ball", muscle: "chest", equipment: "other", type: "compound", freeDbId: "Push-Ups_With_Feet_On_An_Exercise_Ball" },
  { name: "Pushups (Close and Wide Hand Positions)", muscle: "chest", equipment: "bodyweight", type: "compound", freeDbId: "Pushups_Close_and_Wide_Hand_Positions" },
  { name: "Single-Arm Push-Up", muscle: "chest", equipment: "bodyweight", type: "compound", freeDbId: "Single-Arm_Push-Up" },
  { name: "Standing Cable Chest Press", muscle: "chest", equipment: "cable", type: "compound", freeDbId: "Standing_Cable_Chest_Press" },
  { name: "Straight-Arm DB Pullover", muscle: "chest", equipment: "dumbbell", type: "compound" },
  { name: "Suspended Push-Up", muscle: "chest", equipment: "other", type: "compound", freeDbId: "Suspended_Push-Up" },
  { name: "Svend Press", muscle: "chest", equipment: "other", type: "compound", freeDbId: "Svend_Press" },
  { name: "Wide-Grip Decline Barbell Bench Press", muscle: "chest", equipment: "barbell", type: "compound", freeDbId: "Wide-Grip_Decline_Barbell_Bench_Press" },
  { name: "Wide-Grip Decline Barbell Pullover", muscle: "chest", equipment: "barbell", type: "compound", freeDbId: "Wide-Grip_Decline_Barbell_Pullover" },

  // ── Back (new) ──
  { name: "Alternating Kettlebell Row", muscle: "back", equipment: "other", type: "isolation", freeDbId: "Alternating_Kettlebell_Row" },
  { name: "Bent Over One-Arm Long Bar Row", muscle: "back", equipment: "barbell", type: "compound", freeDbId: "Bent_Over_One-Arm_Long_Bar_Row" },
  { name: "Bent Over Two-DB Row", muscle: "back", equipment: "dumbbell", type: "compound" },
  { name: "Bent Over Two-DB Row With Palms In", muscle: "back", equipment: "dumbbell", type: "compound" },
  { name: "Bodyweight Mid Row", muscle: "back", equipment: "other", type: "compound", freeDbId: "Bodyweight_Mid_Row" },
  { name: "Cable Incline Pushdown", muscle: "back", equipment: "cable", type: "isolation", freeDbId: "Cable_Incline_Pushdown" },
  { name: "Calf-Machine Shoulder Shrug", muscle: "back", equipment: "machine", type: "isolation", freeDbId: "Calf-Machine_Shoulder_Shrug" },
  { name: "Deadlift with Bands", muscle: "back", equipment: "barbell", type: "compound", freeDbId: "Deadlift_with_Bands" },
  { name: "Deadlift with Chains", muscle: "back", equipment: "barbell", type: "compound", freeDbId: "Deadlift_with_Chains" },
  { name: "Elevated Cable Rows", muscle: "back", equipment: "cable", type: "compound", freeDbId: "Elevated_Cable_Rows" },
  { name: "Full Range-Of-Motion Lat Pulldown", muscle: "back", equipment: "cable", type: "compound", freeDbId: "Full_Range-Of-Motion_Lat_Pulldown" },
  { name: "Gironda Sternum Chins", muscle: "back", equipment: "other", type: "compound", freeDbId: "Gironda_Sternum_Chins" },
  { name: "Hyperextensions With No Hyperextension Bench", muscle: "back", equipment: "bodyweight", type: "compound", freeDbId: "Hyperextensions_With_No_Hyperextension_Bench" },
  { name: "Incline Bench Pull", muscle: "back", equipment: "barbell", type: "isolation", freeDbId: "Incline_Bench_Pull" },
  { name: "Inverted Row with Straps", muscle: "back", equipment: "other", type: "compound", freeDbId: "Inverted_Row_with_Straps" },
  { name: "KB Sumo High Pull", muscle: "back", equipment: "other", type: "compound" },
  { name: "Kipping Muscle Up", muscle: "back", equipment: "other", type: "compound", freeDbId: "Kipping_Muscle_Up" },
  { name: "Kneeling High Pulley Row", muscle: "back", equipment: "cable", type: "compound", freeDbId: "Kneeling_High_Pulley_Row" },
  { name: "Kneeling Single-Arm High Pulley Row", muscle: "back", equipment: "cable", type: "compound", freeDbId: "Kneeling_Single-Arm_High_Pulley_Row" },
  { name: "Leverage Iso Row", muscle: "back", equipment: "machine", type: "compound", freeDbId: "Leverage_Iso_Row" },
  { name: "Leverage Shrug", muscle: "back", equipment: "machine", type: "isolation", freeDbId: "Leverage_Shrug" },
  { name: "London Bridges", muscle: "back", equipment: "other", type: "compound", freeDbId: "London_Bridges" },
  { name: "Lying Cambered Barbell Row", muscle: "back", equipment: "barbell", type: "isolation", freeDbId: "Lying_Cambered_Barbell_Row" },
  { name: "Lying T-Bar Row", muscle: "back", equipment: "machine", type: "compound", freeDbId: "Lying_T-Bar_Row" },
  { name: "Middle Back Shrug", muscle: "back", equipment: "dumbbell", type: "isolation", freeDbId: "Middle_Back_Shrug" },
  { name: "Mixed Grip Chin", muscle: "back", equipment: "other", type: "compound", freeDbId: "Mixed_Grip_Chin" },
  { name: "Muscle Up", muscle: "back", equipment: "other", type: "compound", freeDbId: "Muscle_Up" },
  { name: "One Arm Chin-Up", muscle: "back", equipment: "other", type: "compound", freeDbId: "One_Arm_Chin-Up" },
  { name: "One Arm Lat Pulldown", muscle: "back", equipment: "cable", type: "compound", freeDbId: "One_Arm_Lat_Pulldown" },
  { name: "One-Arm Kettlebell Row", muscle: "back", equipment: "other", type: "compound", freeDbId: "One-Arm_Kettlebell_Row" },
  { name: "One-Arm Long Bar Row", muscle: "back", equipment: "barbell", type: "compound", freeDbId: "One-Arm_Long_Bar_Row" },
  { name: "Rack Pull with Bands", muscle: "back", equipment: "barbell", type: "compound", freeDbId: "Rack_Pull_with_Bands" },
  { name: "Reverse Band Deadlift", muscle: "back", equipment: "barbell", type: "compound", freeDbId: "Reverse_Band_Deadlift" },
  { name: "Reverse Grip Bent-Over Rows", muscle: "back", equipment: "barbell", type: "compound", freeDbId: "Reverse_Grip_Bent-Over_Rows" },
  { name: "Rocky Pull-Ups/Pulldowns", muscle: "back", equipment: "other", type: "compound", freeDbId: "Rocky_Pull-Ups_Pulldowns" },
  { name: "Rope Climb", muscle: "back", equipment: "other", type: "compound", freeDbId: "Rope_Climb" },
  { name: "Rope Straight-Arm Pulldown", muscle: "back", equipment: "cable", type: "isolation", freeDbId: "Rope_Straight-Arm_Pulldown" },
  { name: "Scapular Pull-Up", muscle: "back", equipment: "other", type: "isolation", freeDbId: "Scapular_Pull-Up" },
  { name: "Seated Good Mornings", muscle: "back", equipment: "barbell", type: "compound", freeDbId: "Seated_Good_Mornings" },
  { name: "Seated One-arm Cable Pulley Rows", muscle: "back", equipment: "cable", type: "compound", freeDbId: "Seated_One-arm_Cable_Pulley_Rows" },
  { name: "Shotgun Row", muscle: "back", equipment: "cable", type: "compound", freeDbId: "Shotgun_Row" },
  { name: "Shrug Behind The Back", muscle: "back", equipment: "barbell", type: "isolation", freeDbId: "Barbell_Shrug_Behind_The_Back" },
  { name: "Side To Side Chins", muscle: "back", equipment: "other", type: "compound", freeDbId: "Side_To_Side_Chins" },
  { name: "Sled Row", muscle: "back", equipment: "other", type: "compound", freeDbId: "Sled_Row" },
  { name: "Smith Machine Behind the Back Shrug", muscle: "back", equipment: "machine", type: "isolation", freeDbId: "Smith_Machine_Behind_the_Back_Shrug" },
  { name: "Smith Machine Upright Row", muscle: "back", equipment: "machine", type: "compound", freeDbId: "Smith_Machine_Upright_Row" },
  { name: "Standing DB Upright Row", muscle: "back", equipment: "dumbbell", type: "compound" },
  { name: "Straight Bar Bench Mid Rows", muscle: "back", equipment: "barbell", type: "compound", freeDbId: "Straight_Bar_Bench_Mid_Rows" },
  { name: "Suspended Row", muscle: "back", equipment: "other", type: "compound", freeDbId: "Suspended_Row" },
  { name: "T-Bar Row with Handle", muscle: "back", equipment: "barbell", type: "compound", freeDbId: "T-Bar_Row_with_Handle" },
  { name: "Two-Arm Kettlebell Row", muscle: "back", equipment: "other", type: "compound", freeDbId: "Two-Arm_Kettlebell_Row" },
  { name: "Underhand Cable Pulldowns", muscle: "back", equipment: "cable", type: "compound", freeDbId: "Underhand_Cable_Pulldowns" },
  { name: "Upright Row (Bands)", muscle: "back", equipment: "other", type: "compound" },
  { name: "V-Bar Pulldown", muscle: "back", equipment: "cable", type: "compound", freeDbId: "V-Bar_Pulldown" },
  { name: "V-Bar Pullup", muscle: "back", equipment: "bodyweight", type: "compound", freeDbId: "V-Bar_Pullup" },
  { name: "Weighted Ball Hyperextension", muscle: "back", equipment: "other", type: "compound", freeDbId: "Weighted_Ball_Hyperextension" },
  { name: "Weighted Pull Ups", muscle: "back", equipment: "other", type: "compound", freeDbId: "Weighted_Pull_Ups" },
  { name: "Wide-Grip Rear Pull-Up", muscle: "back", equipment: "bodyweight", type: "compound", freeDbId: "Wide-Grip_Rear_Pull-Up" },

  // ── Shoulders (new) ──
  { name: "Alternating Cable Shoulder Press", muscle: "shoulders", equipment: "cable", type: "compound", freeDbId: "Alternating_Cable_Shoulder_Press" },
  { name: "Alternating Deltoid Raise", muscle: "shoulders", equipment: "dumbbell", type: "isolation", freeDbId: "Alternating_Deltoid_Raise" },
  { name: "Alternating Kettlebell Press", muscle: "shoulders", equipment: "other", type: "compound", freeDbId: "Alternating_Kettlebell_Press" },
  { name: "Anti-Gravity Press", muscle: "shoulders", equipment: "barbell", type: "compound", freeDbId: "Anti-Gravity_Press" },
  { name: "Back Flyes (Bands)", muscle: "shoulders", equipment: "other", type: "compound" },
  { name: "Band Pull Apart", muscle: "shoulders", equipment: "other", type: "isolation", freeDbId: "Band_Pull_Apart" },
  { name: "Battling Ropes", muscle: "shoulders", equipment: "other", type: "compound", freeDbId: "Battling_Ropes" },
  { name: "Bent Over Low-Pulley Side Lateral", muscle: "shoulders", equipment: "cable", type: "isolation", freeDbId: "Bent_Over_Low-Pulley_Side_Lateral" },
  { name: "Cable Rope Rear-Delt Rows", muscle: "shoulders", equipment: "cable", type: "compound", freeDbId: "Cable_Rope_Rear-Delt_Rows" },
  { name: "Cable Shoulder Press", muscle: "shoulders", equipment: "cable", type: "compound", freeDbId: "Cable_Shoulder_Press" },
  { name: "Car Drivers", muscle: "shoulders", equipment: "barbell", type: "isolation", freeDbId: "Car_Drivers" },
  { name: "Clean and Press", muscle: "shoulders", equipment: "barbell", type: "compound", freeDbId: "Clean_and_Press" },
  { name: "Cuban Press", muscle: "shoulders", equipment: "dumbbell", type: "compound", freeDbId: "Cuban_Press" },
  { name: "DB Incline Shoulder Raise", muscle: "shoulders", equipment: "dumbbell", type: "isolation" },
  { name: "DB Lying One-Arm Rear Lateral Raise", muscle: "shoulders", equipment: "dumbbell", type: "isolation" },
  { name: "DB Lying Rear Lateral Raise", muscle: "shoulders", equipment: "dumbbell", type: "isolation" },
  { name: "DB One-Arm Shoulder Press", muscle: "shoulders", equipment: "dumbbell", type: "compound" },
  { name: "DB Raise", muscle: "shoulders", equipment: "dumbbell", type: "compound" },
  { name: "DB Scaption", muscle: "shoulders", equipment: "dumbbell", type: "isolation" },
  { name: "Double Kettlebell Jerk", muscle: "shoulders", equipment: "other", type: "compound", freeDbId: "Double_Kettlebell_Jerk" },
  { name: "Double Kettlebell Push Press", muscle: "shoulders", equipment: "other", type: "compound", freeDbId: "Double_Kettlebell_Push_Press" },
  { name: "Double Kettlebell Snatch", muscle: "shoulders", equipment: "other", type: "compound", freeDbId: "Double_Kettlebell_Snatch" },
  { name: "External Rotation", muscle: "shoulders", equipment: "dumbbell", type: "isolation", freeDbId: "External_Rotation" },
  { name: "External Rotation with Band", muscle: "shoulders", equipment: "other", type: "compound", freeDbId: "External_Rotation_with_Band" },
  { name: "External Rotation with Cable", muscle: "shoulders", equipment: "cable", type: "isolation", freeDbId: "External_Rotation_with_Cable" },
  { name: "Front Incline DB Raise", muscle: "shoulders", equipment: "dumbbell", type: "isolation" },
  { name: "Front Plate Raise", muscle: "shoulders", equipment: "other", type: "isolation", freeDbId: "Front_Plate_Raise" },
  { name: "Front Two-DB Raise", muscle: "shoulders", equipment: "dumbbell", type: "isolation" },
  { name: "Incline Shoulder Raise", muscle: "shoulders", equipment: "barbell", type: "compound" },
  { name: "Internal Rotation with Band", muscle: "shoulders", equipment: "other", type: "isolation", freeDbId: "Internal_Rotation_with_Band" },
  { name: "Iron Cross", muscle: "shoulders", equipment: "dumbbell", type: "compound", freeDbId: "Iron_Cross" },
  { name: "Isometric Neck Exercise - Front And Back", muscle: "shoulders", equipment: "bodyweight", type: "isolation", freeDbId: "Isometric_Neck_Exercise_-_Front_And_Back" },
  { name: "Isometric Neck Exercise - Sides", muscle: "shoulders", equipment: "bodyweight", type: "isolation", freeDbId: "Isometric_Neck_Exercise_-_Sides" },
  { name: "KB Arnold Press", muscle: "shoulders", equipment: "other", type: "compound" },
  { name: "KB Pirate Ships", muscle: "shoulders", equipment: "other", type: "compound" },
  { name: "KB Seated Press", muscle: "shoulders", equipment: "other", type: "compound" },
  { name: "KB Seesaw Press", muscle: "shoulders", equipment: "other", type: "compound" },
  { name: "KB Thruster", muscle: "shoulders", equipment: "other", type: "compound" },
  { name: "KB Turkish Get-Up (Lunge style)", muscle: "shoulders", equipment: "other", type: "compound" },
  { name: "KB Turkish Get-Up (Squat style)", muscle: "shoulders", equipment: "other", type: "compound" },
  { name: "Landmine Linear Jammer", muscle: "shoulders", equipment: "barbell", type: "compound", freeDbId: "Landmine_Linear_Jammer" },
  { name: "Lateral Raise (Bands)", muscle: "shoulders", equipment: "other", type: "isolation" },
  { name: "Low Pulley Row To Neck", muscle: "shoulders", equipment: "cable", type: "compound", freeDbId: "Low_Pulley_Row_To_Neck" },
  { name: "Lying Face Down Plate Neck Resistance", muscle: "shoulders", equipment: "other", type: "isolation", freeDbId: "Lying_Face_Down_Plate_Neck_Resistance" },
  { name: "Lying Face Up Plate Neck Resistance", muscle: "shoulders", equipment: "other", type: "isolation", freeDbId: "Lying_Face_Up_Plate_Neck_Resistance" },
  { name: "Lying One-Arm Lateral Raise", muscle: "shoulders", equipment: "dumbbell", type: "isolation", freeDbId: "Lying_One-Arm_Lateral_Raise" },
  { name: "Lying Rear Delt Raise", muscle: "shoulders", equipment: "dumbbell", type: "isolation", freeDbId: "Lying_Rear_Delt_Raise" },
  { name: "One-Arm Incline Lateral Raise", muscle: "shoulders", equipment: "dumbbell", type: "isolation", freeDbId: "One-Arm_Incline_Lateral_Raise" },
  { name: "One-Arm Kettlebell Clean and Jerk", muscle: "shoulders", equipment: "other", type: "compound", freeDbId: "One-Arm_Kettlebell_Clean_and_Jerk" },
  { name: "One-Arm Kettlebell Jerk", muscle: "shoulders", equipment: "other", type: "compound", freeDbId: "One-Arm_Kettlebell_Jerk" },
  { name: "One-Arm Kettlebell Military Press To The Side", muscle: "shoulders", equipment: "other", type: "compound", freeDbId: "One-Arm_Kettlebell_Military_Press_To_The_Side" },
  { name: "One-Arm Kettlebell Para Press", muscle: "shoulders", equipment: "other", type: "compound", freeDbId: "One-Arm_Kettlebell_Para_Press" },
  { name: "One-Arm Kettlebell Push Press", muscle: "shoulders", equipment: "other", type: "compound", freeDbId: "One-Arm_Kettlebell_Push_Press" },
  { name: "One-Arm Kettlebell Snatch", muscle: "shoulders", equipment: "other", type: "compound", freeDbId: "One-Arm_Kettlebell_Snatch" },
  { name: "One-Arm Kettlebell Split Jerk", muscle: "shoulders", equipment: "other", type: "compound", freeDbId: "One-Arm_Kettlebell_Split_Jerk" },
  { name: "One-Arm Kettlebell Split Snatch", muscle: "shoulders", equipment: "other", type: "compound", freeDbId: "One-Arm_Kettlebell_Split_Snatch" },
  { name: "One-Arm Side Laterals", muscle: "shoulders", equipment: "dumbbell", type: "isolation", freeDbId: "One-Arm_Side_Laterals" },
  { name: "Power Partials", muscle: "shoulders", equipment: "dumbbell", type: "isolation", freeDbId: "Power_Partials" },
  { name: "Rear Delt Row", muscle: "shoulders", equipment: "barbell", type: "compound" },
  { name: "Reverse Flyes", muscle: "shoulders", equipment: "dumbbell", type: "isolation", freeDbId: "Reverse_Flyes" },
  { name: "Reverse Flyes With External Rotation", muscle: "shoulders", equipment: "dumbbell", type: "isolation", freeDbId: "Reverse_Flyes_With_External_Rotation" },
  { name: "Seated Barbell Military Press", muscle: "shoulders", equipment: "barbell", type: "compound", freeDbId: "Seated_Barbell_Military_Press" },
  { name: "Seated Bent-Over Rear Delt Raise", muscle: "shoulders", equipment: "dumbbell", type: "isolation", freeDbId: "Seated_Bent-Over_Rear_Delt_Raise" },
  { name: "Seated Cable Shoulder Press", muscle: "shoulders", equipment: "cable", type: "compound", freeDbId: "Seated_Cable_Shoulder_Press" },
  { name: "Seated DB Press", muscle: "shoulders", equipment: "dumbbell", type: "compound" },
  { name: "Seated Head Harness Neck Resistance", muscle: "shoulders", equipment: "other", type: "isolation", freeDbId: "Seated_Head_Harness_Neck_Resistance" },
  { name: "Seated Side Lateral Raise", muscle: "shoulders", equipment: "dumbbell", type: "isolation", freeDbId: "Seated_Side_Lateral_Raise" },
  { name: "See-Saw Press (Alternating Side Press)", muscle: "shoulders", equipment: "dumbbell", type: "compound", freeDbId: "See-Saw_Press_Alternating_Side_Press" },
  { name: "Shoulder Press (Bands)", muscle: "shoulders", equipment: "other", type: "compound" },
  { name: "Side Laterals to Front Raise", muscle: "shoulders", equipment: "dumbbell", type: "isolation", freeDbId: "Side_Laterals_to_Front_Raise" },
  { name: "Single DB Raise", muscle: "shoulders", equipment: "dumbbell", type: "isolation" },
  { name: "Single-Arm Linear Jammer", muscle: "shoulders", equipment: "barbell", type: "compound", freeDbId: "Single-Arm_Linear_Jammer" },
  { name: "Sled Overhead Backward Walk", muscle: "shoulders", equipment: "other", type: "compound", freeDbId: "Sled_Overhead_Backward_Walk" },
  { name: "Sled Reverse Flye", muscle: "shoulders", equipment: "other", type: "isolation", freeDbId: "Sled_Reverse_Flye" },
  { name: "Smith Incline Shoulder Raise", muscle: "shoulders", equipment: "barbell", type: "isolation", freeDbId: "Smith_Incline_Shoulder_Raise" },
  { name: "Smith Machine One-Arm Upright Row", muscle: "shoulders", equipment: "machine", type: "compound", freeDbId: "Smith_Machine_One-Arm_Upright_Row" },
  { name: "Standing Alternating DB Press", muscle: "shoulders", equipment: "dumbbell", type: "compound" },
  { name: "Standing Barbell Press Behind Neck", muscle: "shoulders", equipment: "barbell", type: "compound", freeDbId: "Standing_Barbell_Press_Behind_Neck" },
  { name: "Standing Bradford Press", muscle: "shoulders", equipment: "barbell", type: "compound", freeDbId: "Standing_Bradford_Press" },
  { name: "Standing DB Straight-Arm Front Delt Raise Above Head", muscle: "shoulders", equipment: "dumbbell", type: "isolation" },
  { name: "Standing Low-Pulley Deltoid Raise", muscle: "shoulders", equipment: "cable", type: "isolation", freeDbId: "Standing_Low-Pulley_Deltoid_Raise" },
  { name: "Standing Military Press", muscle: "shoulders", equipment: "barbell", type: "compound", freeDbId: "Standing_Military_Press" },
  { name: "Standing Palm-In One-Arm DB Press", muscle: "shoulders", equipment: "dumbbell", type: "compound" },
  { name: "Standing Palms-In DB Press", muscle: "shoulders", equipment: "dumbbell", type: "compound" },
  { name: "Straight Raises on Incline Bench", muscle: "shoulders", equipment: "barbell", type: "isolation", freeDbId: "Straight_Raises_on_Incline_Bench" },
  { name: "Two-Arm Kettlebell Clean", muscle: "shoulders", equipment: "other", type: "compound", freeDbId: "Two-Arm_Kettlebell_Clean" },
  { name: "Two-Arm Kettlebell Jerk", muscle: "shoulders", equipment: "other", type: "compound", freeDbId: "Two-Arm_Kettlebell_Jerk" },
  { name: "Two-Arm Kettlebell Military Press", muscle: "shoulders", equipment: "other", type: "compound", freeDbId: "Two-Arm_Kettlebell_Military_Press" },

  // ── Quads (new) ──
  { name: "Box Squat with Bands", muscle: "quads", equipment: "barbell", type: "compound", freeDbId: "Box_Squat_with_Bands" },
  { name: "Box Squat with Chains", muscle: "quads", equipment: "barbell", type: "compound", freeDbId: "Box_Squat_with_Chains" },
  { name: "Cable Deadlifts", muscle: "quads", equipment: "cable", type: "compound", freeDbId: "Cable_Deadlifts" },
  { name: "Cable Hip Adduction", muscle: "quads", equipment: "cable", type: "isolation", freeDbId: "Cable_Hip_Adduction" },
  { name: "Chair Squat", muscle: "quads", equipment: "machine", type: "compound", freeDbId: "Chair_Squat" },
  { name: "DB Squat To A Bench", muscle: "quads", equipment: "dumbbell", type: "compound" },
  { name: "Elevated Back Lunge", muscle: "quads", equipment: "barbell", type: "compound", freeDbId: "Elevated_Back_Lunge" },
  { name: "Front Barbell Squat To A Bench", muscle: "quads", equipment: "barbell", type: "compound", freeDbId: "Front_Barbell_Squat_To_A_Bench" },
  { name: "Front Squat (Clean Grip)", muscle: "quads", equipment: "barbell", type: "compound", freeDbId: "Front_Squat_Clean_Grip" },
  { name: "Front Squats With Two Kettlebells", muscle: "quads", equipment: "other", type: "compound", freeDbId: "Front_Squats_With_Two_Kettlebells" },
  { name: "Full Squat", muscle: "quads", equipment: "barbell", type: "compound" },
  { name: "Hip Flexion with Band", muscle: "quads", equipment: "other", type: "compound", freeDbId: "Hip_Flexion_with_Band" },
  { name: "Jefferson Squats", muscle: "quads", equipment: "barbell", type: "compound", freeDbId: "Jefferson_Squats" },
  { name: "Leverage Deadlift", muscle: "quads", equipment: "machine", type: "compound", freeDbId: "Leverage_Deadlift" },
  { name: "Lunge Sprint", muscle: "quads", equipment: "machine", type: "compound", freeDbId: "Lunge_Sprint" },
  { name: "Lying Machine Squat", muscle: "quads", equipment: "machine", type: "compound", freeDbId: "Lying_Machine_Squat" },
  { name: "Narrow Stance Hack Squats", muscle: "quads", equipment: "machine", type: "compound", freeDbId: "Narrow_Stance_Hack_Squats" },
  { name: "Narrow Stance Squats", muscle: "quads", equipment: "barbell", type: "compound", freeDbId: "Narrow_Stance_Squats" },
  { name: "One Leg Barbell Squat", muscle: "quads", equipment: "barbell", type: "compound", freeDbId: "One_Leg_Barbell_Squat" },
  { name: "One-Arm Overhead Kettlebell Squats", muscle: "quads", equipment: "other", type: "compound", freeDbId: "One-Arm_Overhead_Kettlebell_Squats" },
  { name: "One-Arm Side Deadlift", muscle: "quads", equipment: "barbell", type: "compound", freeDbId: "One-Arm_Side_Deadlift" },
  { name: "Plie DB Squat", muscle: "quads", equipment: "dumbbell", type: "compound" },
  { name: "Reverse Band Box Squat", muscle: "quads", equipment: "barbell", type: "compound", freeDbId: "Reverse_Band_Box_Squat" },
  { name: "Reverse Band Power Squat", muscle: "quads", equipment: "barbell", type: "compound", freeDbId: "Reverse_Band_Power_Squat" },
  { name: "Side Split Squat", muscle: "quads", equipment: "barbell", type: "compound" },
  { name: "Single-Leg High Box Squat", muscle: "quads", equipment: "other", type: "compound", freeDbId: "Single-Leg_High_Box_Squat" },
  { name: "Smith Machine Leg Press", muscle: "quads", equipment: "machine", type: "compound", freeDbId: "Smith_Machine_Leg_Press" },
  { name: "Smith Machine Pistol Squat", muscle: "quads", equipment: "machine", type: "compound", freeDbId: "Smith_Machine_Pistol_Squat" },
  { name: "Smith Single-Leg Split Squat", muscle: "quads", equipment: "machine", type: "compound", freeDbId: "Smith_Single-Leg_Split_Squat" },
  { name: "Speed Box Squat", muscle: "quads", equipment: "barbell", type: "compound", freeDbId: "Speed_Box_Squat" },
  { name: "Speed Squats", muscle: "quads", equipment: "barbell", type: "compound", freeDbId: "Speed_Squats" },
  { name: "Split Squat with Dumbbells", muscle: "quads", equipment: "dumbbell", type: "compound", freeDbId: "Split_Squat_with_Dumbbells" },
  { name: "Squat Jerk", muscle: "quads", equipment: "barbell", type: "compound", freeDbId: "Squat_Jerk" },
  { name: "Squat To A Bench", muscle: "quads", equipment: "barbell", type: "compound", freeDbId: "Barbell_Squat_To_A_Bench" },
  { name: "Squat with Bands", muscle: "quads", equipment: "barbell", type: "compound", freeDbId: "Squat_with_Bands" },
  { name: "Squat with Chains", muscle: "quads", equipment: "barbell", type: "compound", freeDbId: "Squat_with_Chains" },
  { name: "Squat with Plate Movers", muscle: "quads", equipment: "barbell", type: "compound", freeDbId: "Squat_with_Plate_Movers" },
  { name: "Squats (Bands)", muscle: "quads", equipment: "other", type: "compound" },
  { name: "Suspended Split Squat", muscle: "quads", equipment: "other", type: "compound", freeDbId: "Suspended_Split_Squat" },
  { name: "Weighted Jump Squat", muscle: "quads", equipment: "barbell", type: "compound", freeDbId: "Weighted_Jump_Squat" },
  { name: "Weighted Squat", muscle: "quads", equipment: "other", type: "compound", freeDbId: "Weighted_Squat" },
  { name: "Wide Stance Barbell Squat", muscle: "quads", equipment: "barbell", type: "compound", freeDbId: "Wide_Stance_Barbell_Squat" },
  { name: "Zercher Squats", muscle: "quads", equipment: "barbell", type: "compound", freeDbId: "Zercher_Squats" },

  // ── Hamstrings (new) ──
  { name: "Alternating Hang Clean", muscle: "hamstrings", equipment: "other", type: "compound", freeDbId: "Alternating_Hang_Clean" },
  { name: "Ball Leg Curl", muscle: "hamstrings", equipment: "other", type: "isolation", freeDbId: "Ball_Leg_Curl" },
  { name: "Band Good Morning", muscle: "hamstrings", equipment: "other", type: "compound", freeDbId: "Band_Good_Morning" },
  { name: "Band Good Morning (Pull Through)", muscle: "hamstrings", equipment: "other", type: "compound", freeDbId: "Band_Good_Morning_Pull_Through" },
  { name: "DB Clean", muscle: "hamstrings", equipment: "dumbbell", type: "compound" },
  { name: "Double Kettlebell Alternating Hang Clean", muscle: "hamstrings", equipment: "other", type: "compound", freeDbId: "Double_Kettlebell_Alternating_Hang_Clean" },
  { name: "Glute Ham Raise", muscle: "hamstrings", equipment: "machine", type: "compound", freeDbId: "Glute_Ham_Raise" },
  { name: "Good Morning off Pins", muscle: "hamstrings", equipment: "barbell", type: "compound", freeDbId: "Good_Morning_off_Pins" },
  { name: "Hanging Bar Good Morning", muscle: "hamstrings", equipment: "barbell", type: "compound", freeDbId: "Hanging_Bar_Good_Morning" },
  { name: "KB Dead Clean", muscle: "hamstrings", equipment: "other", type: "compound" },
  { name: "KB Hang Clean", muscle: "hamstrings", equipment: "other", type: "compound" },
  { name: "KB One-Legged Deadlift", muscle: "hamstrings", equipment: "other", type: "compound" },
  { name: "Lunge Pass Through", muscle: "hamstrings", equipment: "other", type: "compound", freeDbId: "Lunge_Pass_Through" },
  { name: "Natural Glute Ham Raise", muscle: "hamstrings", equipment: "bodyweight", type: "compound", freeDbId: "Natural_Glute_Ham_Raise" },
  { name: "One-Arm Kettlebell Clean", muscle: "hamstrings", equipment: "other", type: "compound", freeDbId: "One-Arm_Kettlebell_Clean" },
  { name: "One-Arm Open Palm Kettlebell Clean", muscle: "hamstrings", equipment: "other", type: "compound", freeDbId: "One-Arm_Open_Palm_Kettlebell_Clean" },
  { name: "Open Palm Kettlebell Clean", muscle: "hamstrings", equipment: "other", type: "compound", freeDbId: "Open_Palm_Kettlebell_Clean" },
  { name: "Platform Hamstring Slides", muscle: "hamstrings", equipment: "other", type: "isolation", freeDbId: "Platform_Hamstring_Slides" },
  { name: "Power Clean", muscle: "hamstrings", equipment: "barbell", type: "compound", freeDbId: "Power_Clean" },
  { name: "Prone Manual Hamstring", muscle: "hamstrings", equipment: "other", type: "isolation", freeDbId: "Prone_Manual_Hamstring" },
  { name: "Reverse Band Sumo Deadlift", muscle: "hamstrings", equipment: "barbell", type: "compound", freeDbId: "Reverse_Band_Sumo_Deadlift" },
  { name: "Reverse Hyperextension", muscle: "hamstrings", equipment: "machine", type: "compound", freeDbId: "Reverse_Hyperextension" },
  { name: "Seated Band Hamstring Curl", muscle: "hamstrings", equipment: "other", type: "isolation", freeDbId: "Seated_Band_Hamstring_Curl" },
  { name: "Smith Machine Hang Power Clean", muscle: "hamstrings", equipment: "machine", type: "compound", freeDbId: "Smith_Machine_Hang_Power_Clean" },
  { name: "Smith Machine Stiff-Legged Deadlift", muscle: "hamstrings", equipment: "machine", type: "compound", freeDbId: "Smith_Machine_Stiff-Legged_Deadlift" },
  { name: "Snatch Pull", muscle: "hamstrings", equipment: "barbell", type: "compound", freeDbId: "Snatch_Pull" },
  { name: "Sumo Deadlift with Bands", muscle: "hamstrings", equipment: "barbell", type: "compound", freeDbId: "Sumo_Deadlift_with_Bands" },
  { name: "Sumo Deadlift with Chains", muscle: "hamstrings", equipment: "barbell", type: "compound", freeDbId: "Sumo_Deadlift_with_Chains" },

  // ── Glutes (new) ──
  { name: "Band Hip Adductions", muscle: "glutes", equipment: "other", type: "isolation", freeDbId: "Band_Hip_Adductions" },
  { name: "Downward Facing Balance", muscle: "glutes", equipment: "other", type: "isolation", freeDbId: "Downward_Facing_Balance" },
  { name: "Flutter Kicks", muscle: "glutes", equipment: "bodyweight", type: "compound", freeDbId: "Flutter_Kicks" },
  { name: "Glute Kickback", muscle: "glutes", equipment: "bodyweight", type: "compound", freeDbId: "Glute_Kickback" },
  { name: "Hip Extension with Bands", muscle: "glutes", equipment: "other", type: "compound", freeDbId: "Hip_Extension_with_Bands" },
  { name: "Hip Lift with Band", muscle: "glutes", equipment: "other", type: "compound", freeDbId: "Hip_Lift_with_Band" },
  { name: "Kneeling Squat", muscle: "glutes", equipment: "barbell", type: "compound", freeDbId: "Kneeling_Squat" },
  { name: "Leg Lift", muscle: "glutes", equipment: "bodyweight", type: "isolation", freeDbId: "Leg_Lift" },
  { name: "Monster Walk", muscle: "glutes", equipment: "other", type: "compound", freeDbId: "Monster_Walk" },
  { name: "Physioball Hip Bridge", muscle: "glutes", equipment: "other", type: "compound", freeDbId: "Physioball_Hip_Bridge" },
  { name: "Single Leg Glute Bridge", muscle: "glutes", equipment: "bodyweight", type: "isolation", freeDbId: "Single_Leg_Glute_Bridge" },
  { name: "Step-up with Knee Raise", muscle: "glutes", equipment: "bodyweight", type: "compound", freeDbId: "Step-up_with_Knee_Raise" },
  { name: "Thigh Abductor", muscle: "glutes", equipment: "machine", type: "isolation", freeDbId: "Thigh_Abductor" },
  { name: "Thigh Adductor", muscle: "glutes", equipment: "machine", type: "isolation", freeDbId: "Thigh_Adductor" },

  // ── Biceps (new) ──
  { name: "Close-Grip EZ-Bar Curl with Band", muscle: "biceps", equipment: "barbell", type: "isolation", freeDbId: "Close-Grip_EZ-Bar_Curl_with_Band" },
  { name: "Close-Grip Standing Barbell Curl", muscle: "biceps", equipment: "barbell", type: "isolation", freeDbId: "Close-Grip_Standing_Barbell_Curl" },
  { name: "Curls Lying Against An Incline", muscle: "biceps", equipment: "barbell", type: "isolation", freeDbId: "Barbell_Curls_Lying_Against_An_Incline" },
  { name: "DB Alternating Bicep Curl", muscle: "biceps", equipment: "dumbbell", type: "isolation" },
  { name: "DB Prone Incline Curl", muscle: "biceps", equipment: "dumbbell", type: "isolation" },
  { name: "Flexor Incline DB Curls", muscle: "biceps", equipment: "dumbbell", type: "isolation" },
  { name: "Hammer Curls", muscle: "biceps", equipment: "dumbbell", type: "isolation", freeDbId: "Hammer_Curls" },
  { name: "Incline Hammer Curls", muscle: "biceps", equipment: "dumbbell", type: "isolation", freeDbId: "Incline_Hammer_Curls" },
  { name: "Incline Inner Biceps Curl", muscle: "biceps", equipment: "dumbbell", type: "isolation", freeDbId: "Incline_Inner_Biceps_Curl" },
  { name: "Lying Cable Curl", muscle: "biceps", equipment: "cable", type: "isolation", freeDbId: "Lying_Cable_Curl" },
  { name: "Lying Close-Grip Bar Curl On High Pulley", muscle: "biceps", equipment: "cable", type: "isolation", freeDbId: "Lying_Close-Grip_Bar_Curl_On_High_Pulley" },
  { name: "Lying High Bench Barbell Curl", muscle: "biceps", equipment: "barbell", type: "isolation", freeDbId: "Lying_High_Bench_Barbell_Curl" },
  { name: "Lying Supine DB Curl", muscle: "biceps", equipment: "dumbbell", type: "isolation" },
  { name: "One Arm DB Preacher Curl", muscle: "biceps", equipment: "dumbbell", type: "isolation" },
  { name: "Overhead Cable Curl", muscle: "biceps", equipment: "cable", type: "isolation", freeDbId: "Overhead_Cable_Curl" },
  { name: "Reverse Barbell Preacher Curls", muscle: "biceps", equipment: "barbell", type: "isolation", freeDbId: "Reverse_Barbell_Preacher_Curls" },
  { name: "Reverse Cable Curl", muscle: "biceps", equipment: "cable", type: "isolation", freeDbId: "Reverse_Cable_Curl" },
  { name: "Reverse Plate Curls", muscle: "biceps", equipment: "other", type: "isolation", freeDbId: "Reverse_Plate_Curls" },
  { name: "Seated Close-Grip Concentration Barbell Curl", muscle: "biceps", equipment: "barbell", type: "isolation", freeDbId: "Seated_Close-Grip_Concentration_Barbell_Curl" },
  { name: "Seated DB Inner Biceps Curl", muscle: "biceps", equipment: "dumbbell", type: "isolation" },
  { name: "Standing Concentration Curl", muscle: "biceps", equipment: "dumbbell", type: "isolation", freeDbId: "Standing_Concentration_Curl" },
  { name: "Standing Inner-Biceps Curl", muscle: "biceps", equipment: "dumbbell", type: "isolation", freeDbId: "Standing_Inner-Biceps_Curl" },
  { name: "Standing One-Arm DB Curl Over Incline Bench", muscle: "biceps", equipment: "dumbbell", type: "isolation" },
  { name: "Two-Arm DB Preacher Curl", muscle: "biceps", equipment: "dumbbell", type: "isolation" },
  { name: "Zottman Preacher Curl", muscle: "biceps", equipment: "dumbbell", type: "isolation", freeDbId: "Zottman_Preacher_Curl" },

  // ── Triceps (new) ──
  { name: "Band Skull Crusher", muscle: "triceps", equipment: "other", type: "isolation", freeDbId: "Band_Skull_Crusher" },
  { name: "Bench Press - Powerlifting", muscle: "triceps", equipment: "barbell", type: "compound", freeDbId: "Bench_Press_-_Powerlifting" },
  { name: "Bench Press with Chains", muscle: "triceps", equipment: "barbell", type: "compound", freeDbId: "Bench_Press_with_Chains" },
  { name: "Board Press", muscle: "triceps", equipment: "barbell", type: "compound", freeDbId: "Board_Press" },
  { name: "Body Tricep Press", muscle: "triceps", equipment: "bodyweight", type: "isolation", freeDbId: "Body_Tricep_Press" },
  { name: "Body-Up", muscle: "triceps", equipment: "bodyweight", type: "isolation", freeDbId: "Body-Up" },
  { name: "Cable Incline Triceps Extension", muscle: "triceps", equipment: "cable", type: "isolation", freeDbId: "Cable_Incline_Triceps_Extension" },
  { name: "Cable Lying Triceps Extension", muscle: "triceps", equipment: "cable", type: "isolation", freeDbId: "Cable_Lying_Triceps_Extension" },
  { name: "Chain Handle Extension", muscle: "triceps", equipment: "other", type: "isolation", freeDbId: "Chain_Handle_Extension" },
  { name: "Close-Grip EZ-Bar Press", muscle: "triceps", equipment: "barbell", type: "compound", freeDbId: "Close-Grip_EZ-Bar_Press" },
  { name: "Close-Grip Push-Up off of a DB", muscle: "triceps", equipment: "bodyweight", type: "compound" },
  { name: "DB One-Arm Triceps Extension", muscle: "triceps", equipment: "dumbbell", type: "isolation" },
  { name: "DB Tricep Extension -Pronated Grip", muscle: "triceps", equipment: "dumbbell", type: "isolation" },
  { name: "Decline Close-Grip Bench To Skull Crusher", muscle: "triceps", equipment: "barbell", type: "compound", freeDbId: "Decline_Close-Grip_Bench_To_Skull_Crusher" },
  { name: "Decline DB Triceps Extension", muscle: "triceps", equipment: "dumbbell", type: "isolation" },
  { name: "Decline EZ Bar Triceps Extension", muscle: "triceps", equipment: "barbell", type: "isolation", freeDbId: "Decline_EZ_Bar_Triceps_Extension" },
  { name: "EZ-Bar Skullcrusher", muscle: "triceps", equipment: "barbell", type: "isolation", freeDbId: "EZ-Bar_Skullcrusher" },
  { name: "Floor Press with Chains", muscle: "triceps", equipment: "barbell", type: "compound", freeDbId: "Floor_Press_with_Chains" },
  { name: "Incline Barbell Triceps Extension", muscle: "triceps", equipment: "barbell", type: "isolation", freeDbId: "Incline_Barbell_Triceps_Extension" },
  { name: "Incline Push-Up Close-Grip", muscle: "triceps", equipment: "bodyweight", type: "compound", freeDbId: "Incline_Push-Up_Close-Grip" },
  { name: "Kneeling Cable Triceps Extension", muscle: "triceps", equipment: "cable", type: "isolation", freeDbId: "Kneeling_Cable_Triceps_Extension" },
  { name: "Low Cable Triceps Extension", muscle: "triceps", equipment: "cable", type: "isolation", freeDbId: "Low_Cable_Triceps_Extension" },
  { name: "Lying Close-Grip Barbell Triceps Extension Behind The Head", muscle: "triceps", equipment: "barbell", type: "isolation", freeDbId: "Lying_Close-Grip_Barbell_Triceps_Extension_Behind_The_Head" },
  { name: "Lying Close-Grip Barbell Triceps Press To Chin", muscle: "triceps", equipment: "barbell", type: "isolation", freeDbId: "Lying_Close-Grip_Barbell_Triceps_Press_To_Chin" },
  { name: "Lying DB Tricep Extension", muscle: "triceps", equipment: "dumbbell", type: "isolation" },
  { name: "One Arm Floor Press", muscle: "triceps", equipment: "barbell", type: "compound", freeDbId: "One_Arm_Floor_Press" },
  { name: "One Arm Pronated DB Triceps Extension", muscle: "triceps", equipment: "dumbbell", type: "isolation" },
  { name: "One Arm Supinated DB Triceps Extension", muscle: "triceps", equipment: "dumbbell", type: "isolation" },
  { name: "Parallel Bar Dip", muscle: "triceps", equipment: "other", type: "compound", freeDbId: "Parallel_Bar_Dip" },
  { name: "Pin Presses", muscle: "triceps", equipment: "barbell", type: "compound", freeDbId: "Pin_Presses" },
  { name: "Push-Ups - Close Triceps Position", muscle: "triceps", equipment: "bodyweight", type: "compound", freeDbId: "Push-Ups_-_Close_Triceps_Position" },
  { name: "Reverse Band Bench Press", muscle: "triceps", equipment: "barbell", type: "compound", freeDbId: "Reverse_Band_Bench_Press" },
  { name: "Reverse Triceps Bench Press", muscle: "triceps", equipment: "barbell", type: "compound", freeDbId: "Reverse_Triceps_Bench_Press" },
  { name: "Ring Dips", muscle: "triceps", equipment: "other", type: "compound", freeDbId: "Ring_Dips" },
  { name: "Seated Bent-Over One-Arm DB Triceps Extension", muscle: "triceps", equipment: "dumbbell", type: "isolation" },
  { name: "Seated Bent-Over Two-Arm DB Triceps Extension", muscle: "triceps", equipment: "dumbbell", type: "isolation" },
  { name: "Seated Triceps Press", muscle: "triceps", equipment: "dumbbell", type: "isolation", freeDbId: "Seated_Triceps_Press" },
  { name: "Sled Overhead Triceps Extension", muscle: "triceps", equipment: "other", type: "isolation", freeDbId: "Sled_Overhead_Triceps_Extension" },
  { name: "Smith Machine Close-Grip Bench Press", muscle: "triceps", equipment: "machine", type: "compound", freeDbId: "Smith_Machine_Close-Grip_Bench_Press" },
  { name: "Speed Band Overhead Triceps", muscle: "triceps", equipment: "other", type: "isolation", freeDbId: "Speed_Band_Overhead_Triceps" },
  { name: "Standing Bent-Over One-Arm DB Triceps Extension", muscle: "triceps", equipment: "dumbbell", type: "isolation" },
  { name: "Standing Bent-Over Two-Arm DB Triceps Extension", muscle: "triceps", equipment: "dumbbell", type: "isolation" },
  { name: "Standing DB Triceps Extension", muscle: "triceps", equipment: "dumbbell", type: "isolation" },
  { name: "Standing Low-Pulley One-Arm Triceps Extension", muscle: "triceps", equipment: "cable", type: "isolation", freeDbId: "Standing_Low-Pulley_One-Arm_Triceps_Extension" },
  { name: "Standing Towel Triceps Extension", muscle: "triceps", equipment: "bodyweight", type: "isolation", freeDbId: "Standing_Towel_Triceps_Extension" },
  { name: "Triceps Overhead Extension with Rope", muscle: "triceps", equipment: "cable", type: "isolation", freeDbId: "Triceps_Overhead_Extension_with_Rope" },
  { name: "Weighted Bench Dip", muscle: "triceps", equipment: "other", type: "compound", freeDbId: "Weighted_Bench_Dip" },

  // ── Calves (new) ──
  { name: "Balance Board", muscle: "calves", equipment: "other", type: "compound", freeDbId: "Balance_Board" },
  { name: "Calf Press", muscle: "calves", equipment: "machine", type: "isolation", freeDbId: "Calf_Press" },
  { name: "Calf Raises (Bands)", muscle: "calves", equipment: "other", type: "isolation" },
  { name: "DB Seated One-Leg Calf Raise", muscle: "calves", equipment: "dumbbell", type: "isolation" },
  { name: "Rocking Standing Calf Raise", muscle: "calves", equipment: "barbell", type: "isolation", freeDbId: "Rocking_Standing_Calf_Raise" },
  { name: "Smith Machine Reverse Calf Raises", muscle: "calves", equipment: "machine", type: "isolation", freeDbId: "Smith_Machine_Reverse_Calf_Raises" },

  // ── Core (new) ──
  { name: "3/4 Sit-Up", muscle: "core", equipment: "bodyweight", type: "compound", freeDbId: "3_4_Sit-Up" },
  { name: "Ab Rollout", muscle: "core", equipment: "barbell", type: "compound" },
  { name: "Advanced Kettlebell Windmill", muscle: "core", equipment: "other", type: "isolation", freeDbId: "Advanced_Kettlebell_Windmill" },
  { name: "Alternating Heel Touchers", muscle: "core", equipment: "bodyweight", type: "isolation" },
  { name: "Bent Press", muscle: "core", equipment: "other", type: "compound", freeDbId: "Bent_Press" },
  { name: "Bent-Knee Hip Raise", muscle: "core", equipment: "bodyweight", type: "compound", freeDbId: "Bent-Knee_Hip_Raise" },
  { name: "Bosu Ball Cable Crunch With Side Bends", muscle: "core", equipment: "cable", type: "isolation", freeDbId: "Bosu_Ball_Cable_Crunch_With_Side_Bends" },
  { name: "Bottoms Up", muscle: "core", equipment: "bodyweight", type: "compound", freeDbId: "Bottoms_Up" },
  { name: "Butt-Ups", muscle: "core", equipment: "bodyweight", type: "compound", freeDbId: "Butt-Ups" },
  { name: "Cable Judo Flip", muscle: "core", equipment: "cable", type: "compound", freeDbId: "Cable_Judo_Flip" },
  { name: "Cable Reverse Crunch", muscle: "core", equipment: "cable", type: "isolation", freeDbId: "Cable_Reverse_Crunch" },
  { name: "Cable Russian Twists", muscle: "core", equipment: "cable", type: "compound", freeDbId: "Cable_Russian_Twists" },
  { name: "Cable Seated Crunch", muscle: "core", equipment: "cable", type: "isolation", freeDbId: "Cable_Seated_Crunch" },
  { name: "Cocoons", muscle: "core", equipment: "bodyweight", type: "compound", freeDbId: "Cocoons" },
  { name: "Cross-Body Crunch", muscle: "core", equipment: "bodyweight", type: "compound", freeDbId: "Cross-Body_Crunch" },
  { name: "Crunch - Hands Overhead", muscle: "core", equipment: "bodyweight", type: "isolation", freeDbId: "Crunch_-_Hands_Overhead" },
  { name: "Crunch - Legs On Exercise Ball", muscle: "core", equipment: "bodyweight", type: "isolation", freeDbId: "Crunch_-_Legs_On_Exercise_Ball" },
  { name: "Decline Oblique Crunch", muscle: "core", equipment: "bodyweight", type: "compound", freeDbId: "Decline_Oblique_Crunch" },
  { name: "Decline Reverse Crunch", muscle: "core", equipment: "bodyweight", type: "compound", freeDbId: "Decline_Reverse_Crunch" },
  { name: "Double Kettlebell Windmill", muscle: "core", equipment: "other", type: "compound", freeDbId: "Double_Kettlebell_Windmill" },
  { name: "Elbow to Knee", muscle: "core", equipment: "bodyweight", type: "compound", freeDbId: "Elbow_to_Knee" },
  { name: "Exercise Ball Crunch", muscle: "core", equipment: "other", type: "isolation", freeDbId: "Exercise_Ball_Crunch" },
  { name: "Exercise Ball Pull-In", muscle: "core", equipment: "other", type: "compound", freeDbId: "Exercise_Ball_Pull-In" },
  { name: "Flat Bench Leg Pull-In", muscle: "core", equipment: "bodyweight", type: "compound", freeDbId: "Flat_Bench_Leg_Pull-In" },
  { name: "Frog Sit-Ups", muscle: "core", equipment: "bodyweight", type: "isolation", freeDbId: "Frog_Sit-Ups" },
  { name: "Gorilla Chin/Crunch", muscle: "core", equipment: "bodyweight", type: "compound", freeDbId: "Gorilla_Chin_Crunch" },
  { name: "Hanging Pike", muscle: "core", equipment: "bodyweight", type: "compound", freeDbId: "Hanging_Pike" },
  { name: "Jackknife Sit-Up", muscle: "core", equipment: "bodyweight", type: "compound", freeDbId: "Jackknife_Sit-Up" },
  { name: "Janda Sit-Up", muscle: "core", equipment: "bodyweight", type: "isolation", freeDbId: "Janda_Sit-Up" },
  { name: "KB Figure 8", muscle: "core", equipment: "other", type: "compound" },
  { name: "KB Pass Between The Legs", muscle: "core", equipment: "other", type: "compound" },
  { name: "KB Windmill", muscle: "core", equipment: "other", type: "compound" },
  { name: "Kneeling Cable Crunch With Alternating Oblique Twists", muscle: "core", equipment: "cable", type: "isolation", freeDbId: "Kneeling_Cable_Crunch_With_Alternating_Oblique_Twists" },
  { name: "Landmine 180's", muscle: "core", equipment: "barbell", type: "compound", freeDbId: "Landmine_180s" },
  { name: "Leg Pull-In", muscle: "core", equipment: "bodyweight", type: "compound", freeDbId: "Leg_Pull-In" },
  { name: "Oblique Crunches", muscle: "core", equipment: "bodyweight", type: "isolation", freeDbId: "Oblique_Crunches" },
  { name: "Oblique Crunches - On The Floor", muscle: "core", equipment: "bodyweight", type: "isolation", freeDbId: "Oblique_Crunches_-_On_The_Floor" },
  { name: "One-Arm High-Pulley Cable Side Bends", muscle: "core", equipment: "cable", type: "isolation", freeDbId: "One-Arm_High-Pulley_Cable_Side_Bends" },
  { name: "Otis-Up", muscle: "core", equipment: "other", type: "compound", freeDbId: "Otis-Up" },
  { name: "Pallof Press With Rotation", muscle: "core", equipment: "cable", type: "compound", freeDbId: "Pallof_Press_With_Rotation" },
  { name: "Plate Twist", muscle: "core", equipment: "other", type: "compound", freeDbId: "Plate_Twist" },
  { name: "Press Sit-Up", muscle: "core", equipment: "barbell", type: "compound", freeDbId: "Press_Sit-Up" },
  { name: "Rollout from Bench", muscle: "core", equipment: "barbell", type: "compound" },
  { name: "Rope Crunch", muscle: "core", equipment: "cable", type: "isolation", freeDbId: "Rope_Crunch" },
  { name: "Seated Barbell Twist", muscle: "core", equipment: "barbell", type: "isolation", freeDbId: "Seated_Barbell_Twist" },
  { name: "Seated Flat Bench Leg Pull-In", muscle: "core", equipment: "bodyweight", type: "compound", freeDbId: "Seated_Flat_Bench_Leg_Pull-In" },
  { name: "Seated Leg Tucks", muscle: "core", equipment: "bodyweight", type: "isolation", freeDbId: "Seated_Leg_Tucks" },
  { name: "Side Bend", muscle: "core", equipment: "barbell", type: "isolation" },
  { name: "Side Bridge", muscle: "core", equipment: "bodyweight", type: "isolation", freeDbId: "Side_Bridge" },
  { name: "Side Jackknife", muscle: "core", equipment: "bodyweight", type: "compound", freeDbId: "Side_Jackknife" },
  { name: "Smith Machine Hip Raise", muscle: "core", equipment: "machine", type: "isolation", freeDbId: "Smith_Machine_Hip_Raise" },
  { name: "Spell Caster", muscle: "core", equipment: "dumbbell", type: "compound", freeDbId: "Spell_Caster" },
  { name: "Spider Crawl", muscle: "core", equipment: "bodyweight", type: "compound", freeDbId: "Spider_Crawl" },
  { name: "Standing Cable Lift", muscle: "core", equipment: "cable", type: "compound", freeDbId: "Standing_Cable_Lift" },
  { name: "Standing Cable Wood Chop", muscle: "core", equipment: "cable", type: "compound", freeDbId: "Standing_Cable_Wood_Chop" },
  { name: "Standing Rope Crunch", muscle: "core", equipment: "cable", type: "isolation", freeDbId: "Standing_Rope_Crunch" },
  { name: "Suspended Fallout", muscle: "core", equipment: "other", type: "isolation", freeDbId: "Suspended_Fallout" },
  { name: "Suspended Reverse Crunch", muscle: "core", equipment: "other", type: "isolation", freeDbId: "Suspended_Reverse_Crunch" },
  { name: "Tuck Crunch", muscle: "core", equipment: "bodyweight", type: "isolation", freeDbId: "Tuck_Crunch" },
  { name: "Weighted Ball Side Bend", muscle: "core", equipment: "other", type: "isolation", freeDbId: "Weighted_Ball_Side_Bend" },
  { name: "Weighted Crunches", muscle: "core", equipment: "other", type: "isolation", freeDbId: "Weighted_Crunches" },
  { name: "Weighted Sit-Ups (Bands)", muscle: "core", equipment: "other", type: "isolation" },
  { name: "Wind Sprints", muscle: "core", equipment: "bodyweight", type: "compound", freeDbId: "Wind_Sprints" },

  // ── Forearms (new) ──
  { name: "Bottoms-Up Clean From The Hang Position", muscle: "forearms", equipment: "other", type: "compound", freeDbId: "Bottoms-Up_Clean_From_The_Hang_Position" },
  { name: "DB Lying Pronation", muscle: "forearms", equipment: "dumbbell", type: "isolation" },
  { name: "DB Lying Supination", muscle: "forearms", equipment: "dumbbell", type: "isolation" },
  { name: "Finger Curls", muscle: "forearms", equipment: "barbell", type: "isolation", freeDbId: "Finger_Curls" },
  { name: "Palms-Down DB Wrist Curl Over A Bench", muscle: "forearms", equipment: "dumbbell", type: "isolation", freeDbId: "Palms-Down_Wrist_Curl_Over_A_Bench" },
  { name: "Palms-Down Wrist Curl Over A Bench", muscle: "forearms", equipment: "barbell", type: "isolation", freeDbId: "Palms-Down_Wrist_Curl_Over_A_Bench" },
  { name: "Palms-Up DB Wrist Curl Over A Bench", muscle: "forearms", equipment: "dumbbell", type: "isolation" },
  { name: "Seated One-Arm DB Palms-Down Wrist Curl", muscle: "forearms", equipment: "dumbbell", type: "isolation" },
  { name: "Seated One-Arm DB Palms-Up Wrist Curl", muscle: "forearms", equipment: "dumbbell", type: "isolation" },
  { name: "Seated Palm-Up Barbell Wrist Curl", muscle: "forearms", equipment: "barbell", type: "isolation", freeDbId: "Seated_Palm-Up_Barbell_Wrist_Curl" },
  { name: "Seated Palms-Down Barbell Wrist Curl", muscle: "forearms", equipment: "barbell", type: "isolation", freeDbId: "Seated_Palms-Down_Barbell_Wrist_Curl" },
  { name: "Seated Two-Arm Palms-Up Low-Pulley Wrist Curl", muscle: "forearms", equipment: "cable", type: "isolation", freeDbId: "Seated_Two-Arm_Palms-Up_Low-Pulley_Wrist_Curl" },
  { name: "Standing Olympic Plate Hand Squeeze", muscle: "forearms", equipment: "other", type: "isolation", freeDbId: "Standing_Olympic_Plate_Hand_Squeeze" },
  { name: "Wrist Roller", muscle: "forearms", equipment: "other", type: "isolation", freeDbId: "Wrist_Roller" },
  { name: "Wrist Rotations with Straight Bar", muscle: "forearms", equipment: "barbell", type: "isolation", freeDbId: "Wrist_Rotations_with_Straight_Bar" },

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

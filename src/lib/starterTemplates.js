// ═══════════════════════ STARTER TEMPLATES ═══════════════════════
// Pre-built programs for onboarding. Each follows the same structure
// as user-created programs: { name, description, tags, days[] }
// where each day has { label, subtitle, exercises[] } and each
// exercise has { name, defaultSets, targetReps }.
//
// Exercise names MUST match the EXERCISES library exactly.
// Tags are used for filtering: level (beginner/intermediate/advanced),
// goal (strength/hypertrophy/general), daysPerWeek (3/4/5/6),
// equipment (full_gym/dumbbells/minimal/bodyweight).

function ex(name, sets = 3, reps = "8-12") {
  return { name, defaultSets: sets, targetReps: reps, notes: "" };
}

export const STARTER_TEMPLATES = [

  // ════════════════════════════════════════════════════════════════
  // ─── FULL GYM TEMPLATES ───────────────────────────────────────
  // ════════════════════════════════════════════════════════════════

  // ────────────────────────────────────────────
  // 1. BEGINNER FULL BODY 3x
  // ────────────────────────────────────────────
  {
    name: "Full Body Basics",
    description: "3 days per week. Full body each session with linear progression on compound lifts. Perfect for your first 3-6 months of training.",
    tags: { level: "beginner", goal: "general", daysPerWeek: 3, equipment: "full_gym" },
    days: [
      {
        label: "Full Body A",
        subtitle: "Squat focus",
        exercises: [
          ex("Back Squat", 3, "5"),
          ex("Bench Press", 3, "8"),
          ex("Barbell Row", 3, "8"),
          ex("Seated DB Shoulder Press", 3, "10"),
          ex("DB Curl", 2, "12"),
          ex("Rope Pushdown", 2, "12"),
        ],
      },
      {
        label: "Full Body B",
        subtitle: "Deadlift focus",
        exercises: [
          ex("Conventional Deadlift", 3, "5"),
          ex("Incline DB Press", 3, "10"),
          ex("Wide Grip Lat Pulldown", 3, "10"),
          ex("DB Lateral Raise", 3, "15"),
          ex("Leg Press", 3, "12"),
          ex("Plank", 3, "30-60s"),
        ],
      },
      {
        label: "Full Body C",
        subtitle: "Bench focus",
        exercises: [
          ex("Bench Press", 3, "5"),
          ex("Front Squat", 3, "8"),
          ex("One-Arm DB Row", 3, "10"),
          ex("DB Romanian Deadlift", 3, "10"),
          ex("Cable Fly (Mid)", 2, "12"),
          ex("Hammer Curl", 2, "12"),
        ],
      },
    ],
  },

  // ────────────────────────────────────────────
  // 2. BEGINNER UPPER / LOWER 4x
  // ────────────────────────────────────────────
  {
    name: "Upper / Lower Split",
    description: "4 days per week. Two upper and two lower sessions, each with a strength and hypertrophy emphasis. Great bridge from beginner to intermediate.",
    tags: { level: "beginner", goal: "general", daysPerWeek: 4, equipment: "full_gym" },
    days: [
      {
        label: "Upper A",
        subtitle: "Strength emphasis",
        exercises: [
          ex("Bench Press", 4, "5-6"),
          ex("Barbell Row", 4, "6-8"),
          ex("Overhead Press", 3, "8"),
          ex("Wide Grip Lat Pulldown", 3, "10"),
          ex("EZ-Bar Curl", 3, "10"),
          ex("Skull Crushers", 3, "10"),
        ],
      },
      {
        label: "Lower A",
        subtitle: "Squat focus",
        exercises: [
          ex("Back Squat", 4, "5-6"),
          ex("Romanian Deadlift", 3, "8"),
          ex("Leg Press", 3, "10"),
          ex("Seated Leg Curl", 3, "10"),
          ex("Standing Calf Raise Machine", 4, "12"),
          ex("Hanging Knee Raise", 3, "12"),
        ],
      },
      {
        label: "Upper B",
        subtitle: "Hypertrophy emphasis",
        exercises: [
          ex("Incline DB Press", 3, "10"),
          ex("Neutral Grip Cable Row", 3, "10"),
          ex("Seated DB Shoulder Press", 3, "10"),
          ex("Cable Fly (Low to High)", 3, "12"),
          ex("Hammer Curl", 3, "12"),
          ex("Rope Pushdown", 3, "12"),
          ex("DB Lateral Raise", 3, "15"),
        ],
      },
      {
        label: "Lower B",
        subtitle: "Deadlift focus",
        exercises: [
          ex("Conventional Deadlift", 4, "5-6"),
          ex("DB Bulgarian Split Squat", 3, "10"),
          ex("Leg Extension", 3, "12"),
          ex("Lying Leg Curl", 3, "12"),
          ex("Hip Thrust Machine", 3, "10"),
          ex("Seated Calf Raise", 4, "15"),
        ],
      },
    ],
  },

  // ────────────────────────────────────────────
  // 3. PUSH / PULL / LEGS 3x
  // ────────────────────────────────────────────
  {
    name: "PPL — 3 Day",
    description: "Push, Pull, Legs once per week. Each muscle group gets dedicated focus with moderate volume. Ideal if you can only train 3 times per week but want focused sessions.",
    tags: { level: "intermediate", goal: "hypertrophy", daysPerWeek: 3, equipment: "full_gym" },
    days: [
      {
        label: "Push",
        subtitle: "Chest / Shoulders / Triceps",
        exercises: [
          ex("Bench Press", 4, "6-8"),
          ex("Incline DB Press", 3, "8-10"),
          ex("Overhead Press", 3, "8"),
          ex("Cable Fly (Low to High)", 3, "12"),
          ex("DB Lateral Raise", 4, "12-15"),
          ex("Rope Pushdown", 3, "12"),
          ex("DB Overhead Extension", 3, "12"),
        ],
      },
      {
        label: "Pull",
        subtitle: "Back / Biceps",
        exercises: [
          ex("Barbell Row", 4, "6-8"),
          ex("Wide Grip Lat Pulldown", 3, "8-10"),
          ex("Neutral Grip Cable Row", 3, "10"),
          ex("Face Pull", 3, "15"),
          ex("EZ-Bar Curl", 3, "10"),
          ex("Incline DB Curl", 3, "12"),
          ex("Hammer Curl", 2, "12"),
        ],
      },
      {
        label: "Legs",
        subtitle: "Quads / Hamstrings / Glutes",
        exercises: [
          ex("Back Squat", 4, "6-8"),
          ex("Romanian Deadlift", 3, "8-10"),
          ex("Leg Press", 3, "10-12"),
          ex("Seated Leg Curl", 3, "10"),
          ex("Leg Extension", 3, "12"),
          ex("Standing Calf Raise Machine", 4, "12"),
          ex("Hanging Leg Raise", 3, "12"),
        ],
      },
    ],
  },

  // ────────────────────────────────────────────
  // 4. PUSH / PULL / LEGS 6x
  // ────────────────────────────────────────────
  {
    name: "PPL — 6 Day",
    description: "The classic Push/Pull/Legs twice per week. High frequency, high volume — the gold standard for intermediate to advanced hypertrophy training.",
    tags: { level: "intermediate", goal: "hypertrophy", daysPerWeek: 6, equipment: "full_gym" },
    days: [
      {
        label: "Push 1",
        subtitle: "Chest focus",
        exercises: [
          ex("Bench Press", 4, "5-6"),
          ex("Incline DB Press", 3, "8-10"),
          ex("Cable Fly (Low to High)", 3, "12"),
          ex("Seated DB Shoulder Press", 3, "8-10"),
          ex("DB Lateral Raise", 4, "12-15"),
          ex("Rope Pushdown", 3, "10-12"),
          ex("DB Overhead Extension", 3, "12"),
        ],
      },
      {
        label: "Pull 1",
        subtitle: "Back width",
        exercises: [
          ex("Barbell Row", 4, "5-6"),
          ex("Wide Grip Lat Pulldown", 3, "8-10"),
          ex("Neutral Grip Cable Row", 3, "10"),
          ex("Straight Arm Pulldown", 3, "12"),
          ex("Face Pull", 3, "15"),
          ex("EZ-Bar Curl", 3, "8-10"),
          ex("Hammer Curl", 3, "12"),
        ],
      },
      {
        label: "Legs 1",
        subtitle: "Quad focus",
        exercises: [
          ex("Back Squat", 4, "5-6"),
          ex("Leg Press", 3, "10"),
          ex("Leg Extension", 3, "12"),
          ex("Romanian Deadlift", 3, "8-10"),
          ex("Seated Leg Curl", 3, "10"),
          ex("Standing Calf Raise Machine", 4, "12"),
          ex("Hanging Leg Raise", 3, "12"),
        ],
      },
      {
        label: "Push 2",
        subtitle: "Shoulder focus",
        exercises: [
          ex("Overhead Press", 4, "5-6"),
          ex("Incline Bench Press", 3, "8"),
          ex("DB Bench Press", 3, "10"),
          ex("Cable Fly (Mid)", 3, "12"),
          ex("DB Lateral Raise", 4, "12-15"),
          ex("Straight Bar Pushdown", 3, "10-12"),
          ex("Skull Crushers", 3, "10"),
        ],
      },
      {
        label: "Pull 2",
        subtitle: "Back thickness",
        exercises: [
          ex("Conventional Deadlift", 3, "5"),
          ex("One-Arm DB Row", 3, "8-10"),
          ex("Close Grip Lat Pulldown", 3, "10"),
          ex("Wide Grip Cable Row", 3, "10"),
          ex("Cable Rear Delt Fly", 3, "15"),
          ex("Incline DB Curl", 3, "10"),
          ex("Cable Hammer Curl", 3, "12"),
        ],
      },
      {
        label: "Legs 2",
        subtitle: "Hamstring / glute focus",
        exercises: [
          ex("Romanian Deadlift", 4, "6-8"),
          ex("Front Squat", 3, "8"),
          ex("DB Bulgarian Split Squat", 3, "10"),
          ex("Lying Leg Curl", 3, "10"),
          ex("Hip Thrust Machine", 3, "10"),
          ex("Leg Extension", 3, "12"),
          ex("Seated Calf Raise", 4, "15"),
        ],
      },
    ],
  },

  // ────────────────────────────────────────────
  // 5. INTERMEDIATE UPPER / LOWER 4x (PHUL)
  // ────────────────────────────────────────────
  {
    name: "Upper / Lower Power & Hypertrophy",
    description: "4 days per week. Pairs a heavy power day with a higher-rep hypertrophy day for both upper and lower body. The PHUL approach.",
    tags: { level: "intermediate", goal: "general", daysPerWeek: 4, equipment: "full_gym" },
    days: [
      {
        label: "Upper Power",
        subtitle: "Heavy compounds",
        exercises: [
          ex("Bench Press", 4, "4-6"),
          ex("Barbell Row", 4, "4-6"),
          ex("Overhead Press", 3, "6-8"),
          ex("Close Grip Lat Pulldown", 3, "6-8"),
          ex("Barbell Curl", 3, "8"),
          ex("Close-Grip Bench Press", 3, "8"),
        ],
      },
      {
        label: "Lower Power",
        subtitle: "Heavy compounds",
        exercises: [
          ex("Back Squat", 4, "4-6"),
          ex("Conventional Deadlift", 3, "4-6"),
          ex("Leg Press", 3, "8-10"),
          ex("Seated Leg Curl", 3, "8"),
          ex("Standing Calf Raise Machine", 4, "8-10"),
          ex("Hanging Leg Raise", 3, "12"),
        ],
      },
      {
        label: "Upper Hypertrophy",
        subtitle: "Volume / pump",
        exercises: [
          ex("Incline DB Press", 4, "10-12"),
          ex("Neutral Grip Cable Row", 4, "10-12"),
          ex("Seated DB Shoulder Press", 3, "10"),
          ex("Cable Fly (Mid)", 3, "12"),
          ex("DB Lateral Raise", 4, "15"),
          ex("Face Pull", 3, "15"),
          ex("Incline DB Curl", 3, "12"),
          ex("Rope Pushdown", 3, "12"),
        ],
      },
      {
        label: "Lower Hypertrophy",
        subtitle: "Volume / pump",
        exercises: [
          ex("Front Squat", 3, "8-10"),
          ex("DB Romanian Deadlift", 3, "10"),
          ex("DB Bulgarian Split Squat", 3, "12"),
          ex("Leg Extension", 3, "12-15"),
          ex("Lying Leg Curl", 3, "12"),
          ex("Hip Thrust Machine", 3, "12"),
          ex("Seated Calf Raise", 4, "15"),
        ],
      },
    ],
  },

  // ────────────────────────────────────────────
  // 6. BRO SPLIT 5x
  // ────────────────────────────────────────────
  {
    name: "Classic 5-Day Split",
    description: "One muscle group per day, 5 days per week. Chest / Back / Shoulders / Legs / Arms. Simple, proven, and high volume per muscle.",
    tags: { level: "intermediate", goal: "hypertrophy", daysPerWeek: 5, equipment: "full_gym" },
    days: [
      {
        label: "Chest",
        subtitle: "All angles",
        exercises: [
          ex("Bench Press", 4, "6-8"),
          ex("Incline DB Press", 4, "8-10"),
          ex("Cable Fly (Low to High)", 3, "12"),
          ex("Cable Fly (Mid)", 3, "12"),
          ex("Dips (Chest)", 3, "10-12"),
          ex("DB Pullover", 3, "12"),
        ],
      },
      {
        label: "Back",
        subtitle: "Width & thickness",
        exercises: [
          ex("Barbell Row", 4, "6-8"),
          ex("Wide Grip Lat Pulldown", 4, "8-10"),
          ex("Neutral Grip Cable Row", 3, "10"),
          ex("One-Arm DB Row", 3, "10"),
          ex("Straight Arm Pulldown", 3, "12"),
          ex("Face Pull", 3, "15"),
          ex("Barbell Shrug", 3, "10"),
        ],
      },
      {
        label: "Shoulders",
        subtitle: "All three heads",
        exercises: [
          ex("Overhead Press", 4, "6-8"),
          ex("Seated DB Shoulder Press", 3, "8-10"),
          ex("DB Lateral Raise", 4, "12-15"),
          ex("Cable Rear Delt Fly", 3, "15"),
          ex("Cable Lateral Raise", 3, "12"),
          ex("DB Front Raise", 3, "12"),
        ],
      },
      {
        label: "Legs",
        subtitle: "Quads / Hams / Calves",
        exercises: [
          ex("Back Squat", 4, "6-8"),
          ex("Romanian Deadlift", 4, "8-10"),
          ex("Leg Press", 3, "10"),
          ex("Leg Extension", 3, "12"),
          ex("Seated Leg Curl", 3, "10"),
          ex("Standing Calf Raise Machine", 4, "12"),
          ex("Seated Calf Raise", 3, "15"),
        ],
      },
      {
        label: "Arms",
        subtitle: "Bi's & Tri's",
        exercises: [
          ex("EZ-Bar Curl", 3, "8-10"),
          ex("Close-Grip Bench Press", 3, "8"),
          ex("Incline DB Curl", 3, "10"),
          ex("Skull Crushers", 3, "10"),
          ex("Hammer Curl", 3, "12"),
          ex("Rope Pushdown", 3, "12"),
          ex("Cable Hammer Curl", 2, "12"),
          ex("DB Overhead Extension", 2, "12"),
        ],
      },
    ],
  },

  // ────────────────────────────────────────────
  // 7. STRENGTH FOCUS 4x (5/3/1 style)
  // ────────────────────────────────────────────
  {
    name: "Strength Builder",
    description: "4 days per week. Each session built around one of the big four lifts with targeted accessories. Focused on getting stronger over time.",
    tags: { level: "advanced", goal: "strength", daysPerWeek: 4, equipment: "full_gym" },
    days: [
      {
        label: "Squat Day",
        subtitle: "Lower — quad dominant",
        exercises: [
          ex("Back Squat", 5, "3-5"),
          ex("Pause Squat", 3, "3-5"),
          ex("Leg Press", 3, "8"),
          ex("Leg Extension", 3, "10"),
          ex("Hanging Leg Raise", 3, "12"),
        ],
      },
      {
        label: "Bench Day",
        subtitle: "Upper — press dominant",
        exercises: [
          ex("Bench Press", 5, "3-5"),
          ex("Close-Grip Bench", 3, "6-8"),
          ex("Incline DB Press", 3, "8"),
          ex("DB Lateral Raise", 3, "12"),
          ex("Rope Pushdown", 3, "10"),
        ],
      },
      {
        label: "Deadlift Day",
        subtitle: "Lower — hip dominant",
        exercises: [
          ex("Conventional Deadlift", 5, "3-5"),
          ex("Deficit Deadlift", 3, "3-5"),
          ex("Romanian Deadlift", 3, "8"),
          ex("Barbell Row", 3, "6-8"),
          ex("Back Extension", 3, "12"),
        ],
      },
      {
        label: "Press Day",
        subtitle: "Upper — overhead dominant",
        exercises: [
          ex("Overhead Press", 5, "3-5"),
          ex("Push Press", 3, "5"),
          ex("Incline Bench Press", 3, "6-8"),
          ex("Wide Grip Lat Pulldown", 3, "10"),
          ex("Face Pull", 3, "15"),
          ex("EZ-Bar Curl", 3, "10"),
        ],
      },
    ],
  },

  // ────────────────────────────────────────────
  // 8. FULL BODY 4x (ADVANCED)
  // ────────────────────────────────────────────
  {
    name: "Full Body High Frequency",
    description: "4 sessions per week, each hitting all major muscle groups. High frequency for experienced lifters who respond well to training muscles multiple times per week.",
    tags: { level: "advanced", goal: "general", daysPerWeek: 4, equipment: "full_gym" },
    days: [
      {
        label: "Full Body A",
        subtitle: "Squat / Horizontal press",
        exercises: [
          ex("Back Squat", 4, "5"),
          ex("Bench Press", 4, "5"),
          ex("Barbell Row", 3, "8"),
          ex("DB Lateral Raise", 3, "12"),
          ex("Incline DB Curl", 3, "10"),
          ex("Rope Pushdown", 3, "10"),
        ],
      },
      {
        label: "Full Body B",
        subtitle: "Deadlift / Vertical press",
        exercises: [
          ex("Conventional Deadlift", 4, "5"),
          ex("Overhead Press", 4, "5"),
          ex("Wide Grip Lat Pulldown", 3, "8"),
          ex("Leg Extension", 3, "12"),
          ex("Face Pull", 3, "15"),
          ex("Hammer Curl", 3, "10"),
        ],
      },
      {
        label: "Full Body C",
        subtitle: "Squat / Hypertrophy",
        exercises: [
          ex("Front Squat", 3, "6-8"),
          ex("Incline DB Press", 3, "8-10"),
          ex("Neutral Grip Cable Row", 3, "10"),
          ex("DB Romanian Deadlift", 3, "10"),
          ex("Cable Fly (Mid)", 3, "12"),
          ex("DB Lateral Raise", 3, "15"),
        ],
      },
      {
        label: "Full Body D",
        subtitle: "Deadlift variation / Volume",
        exercises: [
          ex("Romanian Deadlift", 3, "6-8"),
          ex("DB Bench Press", 3, "8-10"),
          ex("One-Arm DB Row", 3, "10"),
          ex("DB Bulgarian Split Squat", 3, "10"),
          ex("EZ-Bar Curl", 3, "10"),
          ex("Skull Crushers", 3, "10"),
        ],
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════
  // ─── DUMBBELL-ONLY TEMPLATES ──────────────────────────────────
  // ════════════════════════════════════════════════════════════════

  // ────────────────────────────────────────────
  // 9. DB FULL BODY 3x (BEGINNER)
  // ────────────────────────────────────────────
  {
    name: "Dumbbell Full Body",
    description: "3 days per week using only dumbbells. Perfect for home gyms or when barbells aren't available. Covers all major muscle groups each session.",
    tags: { level: "beginner", goal: "general", daysPerWeek: 3, equipment: "dumbbells" },
    days: [
      {
        label: "Full Body A",
        subtitle: "Press focus",
        exercises: [
          ex("DB Bench Press", 3, "8-10"),
          ex("DB Romanian Deadlift", 3, "10"),
          ex("One-Arm DB Row", 3, "10"),
          ex("DB Goblet Squat", 3, "12"),
          ex("Seated DB Shoulder Press", 3, "10"),
          ex("DB Curl", 2, "12"),
          ex("DB Overhead Extension", 2, "12"),
        ],
      },
      {
        label: "Full Body B",
        subtitle: "Squat focus",
        exercises: [
          ex("DB Goblet Squat", 4, "10"),
          ex("Incline DB Press", 3, "10"),
          ex("DB Chest Supported Row", 3, "10"),
          ex("DB Lateral Raise", 3, "15"),
          ex("DB Stiff-Leg Deadlift", 3, "10"),
          ex("Hammer Curl", 2, "12"),
          ex("DB Kickback", 2, "12"),
        ],
      },
      {
        label: "Full Body C",
        subtitle: "Hinge focus",
        exercises: [
          ex("DB Romanian Deadlift", 3, "8"),
          ex("DB Floor Press", 3, "10"),
          ex("One-Arm DB Row", 3, "10"),
          ex("DB Bulgarian Split Squat", 3, "10"),
          ex("Arnold Press", 3, "10"),
          ex("Incline DB Curl", 2, "12"),
          ex("DB Skull Crusher", 2, "12"),
        ],
      },
    ],
  },

  // ────────────────────────────────────────────
  // 10. DB UPPER / LOWER 4x
  // ────────────────────────────────────────────
  {
    name: "Dumbbell Upper / Lower",
    description: "4 days per week, dumbbells only. Upper and lower splits with strength and hypertrophy days. Great for well-stocked home gyms.",
    tags: { level: "intermediate", goal: "hypertrophy", daysPerWeek: 4, equipment: "dumbbells" },
    days: [
      {
        label: "Upper A",
        subtitle: "Strength emphasis",
        exercises: [
          ex("DB Bench Press", 4, "6-8"),
          ex("DB Chest Supported Row", 4, "6-8"),
          ex("Standing DB Shoulder Press", 3, "8"),
          ex("One-Arm DB Row", 3, "8"),
          ex("DB Curl", 3, "10"),
          ex("DB Close-Grip Press", 3, "10"),
        ],
      },
      {
        label: "Lower A",
        subtitle: "Quad focus",
        exercises: [
          ex("DB Goblet Squat", 4, "8-10"),
          ex("DB Romanian Deadlift", 3, "10"),
          ex("DB Bulgarian Split Squat", 3, "10"),
          ex("DB Step Up", 3, "12"),
          ex("Single-Leg Standing Calf Raise", 3, "15"),
          ex("DB Russian Twist", 3, "15"),
        ],
      },
      {
        label: "Upper B",
        subtitle: "Hypertrophy emphasis",
        exercises: [
          ex("Incline DB Press", 3, "10-12"),
          ex("Helms Row", 3, "10-12"),
          ex("Arnold Press", 3, "10"),
          ex("DB Fly", 3, "12"),
          ex("DB Lateral Raise", 4, "12-15"),
          ex("Incline DB Curl", 3, "12"),
          ex("DB Overhead Extension", 3, "12"),
        ],
      },
      {
        label: "Lower B",
        subtitle: "Hamstring / glute focus",
        exercises: [
          ex("DB Stiff-Leg Deadlift", 4, "8-10"),
          ex("DB Goblet Squat", 3, "12"),
          ex("Single-Leg DB RDL", 3, "10"),
          ex("DB Lunge", 3, "12"),
          ex("DB Standing Calf Raise", 3, "15"),
          ex("Weighted Sit-up", 3, "12"),
        ],
      },
    ],
  },

  // ────────────────────────────────────────────
  // 11. DB PPL 6x
  // ────────────────────────────────────────────
  {
    name: "Dumbbell PPL — 6 Day",
    description: "Push/Pull/Legs twice per week using only dumbbells. High frequency hypertrophy training without needing barbells, cables, or machines.",
    tags: { level: "intermediate", goal: "hypertrophy", daysPerWeek: 6, equipment: "dumbbells" },
    days: [
      {
        label: "Push 1",
        subtitle: "Chest focus",
        exercises: [
          ex("DB Bench Press", 4, "6-8"),
          ex("Incline DB Press", 3, "8-10"),
          ex("DB Fly", 3, "12"),
          ex("Seated DB Shoulder Press", 3, "10"),
          ex("DB Lateral Raise", 4, "12-15"),
          ex("DB Overhead Extension", 3, "12"),
          ex("DB Kickback", 2, "12"),
        ],
      },
      {
        label: "Pull 1",
        subtitle: "Row focus",
        exercises: [
          ex("One-Arm DB Row", 4, "6-8"),
          ex("DB Chest Supported Row", 3, "10"),
          ex("Incline Reverse Fly", 3, "12"),
          ex("DB Shrug", 3, "10"),
          ex("DB Curl", 3, "8-10"),
          ex("Incline DB Curl", 3, "12"),
          ex("Hammer Curl", 2, "12"),
        ],
      },
      {
        label: "Legs 1",
        subtitle: "Quad focus",
        exercises: [
          ex("DB Goblet Squat", 4, "8-10"),
          ex("DB Bulgarian Split Squat", 3, "10"),
          ex("DB Lunge", 3, "12"),
          ex("DB Romanian Deadlift", 3, "10"),
          ex("DB Standing Calf Raise", 4, "15"),
          ex("DB Russian Twist", 3, "15"),
        ],
      },
      {
        label: "Push 2",
        subtitle: "Shoulder focus",
        exercises: [
          ex("Arnold Press", 4, "8-10"),
          ex("Incline DB Press", 3, "10"),
          ex("DB Floor Press", 3, "10"),
          ex("Incline DB Fly", 3, "12"),
          ex("DB Lateral Raise", 4, "12-15"),
          ex("DB Skull Crusher", 3, "10"),
          ex("DB Close-Grip Press", 2, "12"),
        ],
      },
      {
        label: "Pull 2",
        subtitle: "Upper back focus",
        exercises: [
          ex("Helms Row", 4, "8-10"),
          ex("One-Arm DB Row", 3, "10"),
          ex("Seated Reverse Fly", 3, "12"),
          ex("Prone Y Raise", 3, "12"),
          ex("DB Shrug (Shoulders)", 3, "12"),
          ex("Hammer Curl", 3, "10"),
          ex("DB Curl", 3, "12"),
        ],
      },
      {
        label: "Legs 2",
        subtitle: "Hamstring / glute focus",
        exercises: [
          ex("DB Romanian Deadlift", 4, "8-10"),
          ex("DB Goblet Squat", 3, "12"),
          ex("Single-Leg DB RDL", 3, "10"),
          ex("DB Step Up", 3, "12"),
          ex("Single-Leg Standing Calf Raise", 4, "15"),
          ex("Weighted Sit-up", 3, "12"),
        ],
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════
  // ─── MINIMAL EQUIPMENT TEMPLATES ──────────────────────────────
  // ════════════════════════════════════════════════════════════════

  // ────────────────────────────────────────────
  // 12. HOTEL / MINIMAL 3x
  // ────────────────────────────────────────────
  {
    name: "Minimal Gear Full Body",
    description: "3 days per week with light dumbbells and bodyweight. Designed for hotel gyms, travel, or getting started with minimal equipment.",
    tags: { level: "beginner", goal: "general", daysPerWeek: 3, equipment: "minimal" },
    days: [
      {
        label: "Full Body A",
        subtitle: "Push emphasis",
        exercises: [
          ex("DB Bench Press", 3, "10-12"),
          ex("DB Goblet Squat", 3, "12"),
          ex("One-Arm DB Row", 3, "10"),
          ex("Push-ups", 3, "max"),
          ex("DB Lateral Raise", 3, "15"),
          ex("Plank", 3, "30-60s"),
        ],
      },
      {
        label: "Full Body B",
        subtitle: "Lower emphasis",
        exercises: [
          ex("DB Romanian Deadlift", 3, "10"),
          ex("DB Bulgarian Split Squat", 3, "12"),
          ex("Incline DB Press", 3, "10"),
          ex("DB Chest Supported Row", 3, "12"),
          ex("Arnold Press", 3, "12"),
          ex("Dead Bug", 3, "12"),
        ],
      },
      {
        label: "Full Body C",
        subtitle: "Pull emphasis",
        exercises: [
          ex("One-Arm DB Row", 4, "8-10"),
          ex("DB Floor Press", 3, "10"),
          ex("DB Goblet Squat", 3, "12"),
          ex("DB Stiff-Leg Deadlift", 3, "12"),
          ex("DB Curl", 3, "12"),
          ex("DB Overhead Extension", 3, "12"),
          ex("Mountain Climber", 3, "20"),
        ],
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════
  // ─── BODYWEIGHT TEMPLATES ─────────────────────────────────────
  // ════════════════════════════════════════════════════════════════

  // ────────────────────────────────────────────
  // 13. BODYWEIGHT 3x (BEGINNER)
  // ────────────────────────────────────────────
  {
    name: "Bodyweight Foundations",
    description: "3 days per week with zero equipment. Build a base of strength and control using just your body. Great for beginners or when you have no gym access.",
    tags: { level: "beginner", goal: "general", daysPerWeek: 3, equipment: "bodyweight" },
    days: [
      {
        label: "Upper Focus",
        subtitle: "Push & pull",
        exercises: [
          ex("Push-ups", 3, "max"),
          ex("Inverted Row", 3, "max"),
          ex("Pike Push-ups", 3, "8-12"),
          ex("Dips (Triceps)", 3, "max"),
          ex("Plank", 3, "30-60s"),
          ex("Dead Bug", 3, "12"),
        ],
      },
      {
        label: "Lower Focus",
        subtitle: "Legs & core",
        exercises: [
          ex("Bodyweight Squat", 4, "15-20"),
          ex("Bodyweight Lunge", 3, "12"),
          ex("Glute Bridge", 3, "15"),
          ex("Bodyweight Calf Raise", 3, "20"),
          ex("Leg Raise", 3, "12"),
          ex("Side Plank", 3, "20-30s"),
        ],
      },
      {
        label: "Full Body",
        subtitle: "Conditioning",
        exercises: [
          ex("Push-ups", 3, "max"),
          ex("Bodyweight Squat", 3, "15"),
          ex("Inverted Row", 3, "max"),
          ex("Bodyweight Lunge", 3, "12"),
          ex("Mountain Climber", 3, "20"),
          ex("Hollow Body Hold", 3, "20-30s"),
        ],
      },
    ],
  },

  // ────────────────────────────────────────────
  // 14. BODYWEIGHT 4x (INTERMEDIATE)
  // ────────────────────────────────────────────
  {
    name: "Calisthenics Builder",
    description: "4 days per week. Intermediate bodyweight training with progressions toward advanced movements. Requires a pull-up bar.",
    tags: { level: "intermediate", goal: "general", daysPerWeek: 4, equipment: "bodyweight" },
    days: [
      {
        label: "Upper Push",
        subtitle: "Chest / Shoulders / Triceps",
        exercises: [
          ex("Dips (Chest)", 4, "max"),
          ex("Push-ups", 3, "max"),
          ex("Pike Push-ups", 3, "8-12"),
          ex("Close-Grip Push-ups", 3, "max"),
          ex("Bench Dips", 3, "12"),
          ex("Plank", 3, "45-60s"),
        ],
      },
      {
        label: "Lower A",
        subtitle: "Quad emphasis",
        exercises: [
          ex("Bodyweight Squat", 4, "20"),
          ex("Bodyweight Lunge", 3, "12"),
          ex("Jump Squat", 3, "10"),
          ex("Wall Sit", 3, "30-45s"),
          ex("Bodyweight Calf Raise", 4, "20"),
          ex("Hanging Knee Raise", 3, "12"),
        ],
      },
      {
        label: "Upper Pull",
        subtitle: "Back / Biceps",
        exercises: [
          ex("Pull-ups", 4, "max"),
          ex("Chin-ups", 3, "max"),
          ex("Inverted Row", 3, "12"),
          ex("Hyperextension", 3, "12"),
          ex("Dead Bug", 3, "12"),
          ex("Superman", 3, "12"),
        ],
      },
      {
        label: "Lower B",
        subtitle: "Posterior chain",
        exercises: [
          ex("Glute Bridge", 4, "15"),
          ex("Bodyweight Lunge", 3, "12"),
          ex("Sissy Squat", 3, "10"),
          ex("Single-Leg Bodyweight Calf Raise", 4, "15"),
          ex("Leg Raise", 3, "12"),
          ex("Bicycle Crunch", 3, "20"),
        ],
      },
    ],
  },
];

// ═══════════════════════ EQUIPMENT LABELS ═══════════════════════
// Human-readable labels for equipment tags, used in onboarding and filtering
export const EQUIPMENT_OPTIONS = [
  { id: "full_gym", label: "Full Gym", desc: "Barbells, dumbbells, cables, machines", icon: "🏋️" },
  { id: "dumbbells", label: "Dumbbells Only", desc: "Home gym or dumbbell-only setup", icon: "💪" },
  { id: "minimal", label: "Minimal / Travel", desc: "Light dumbbells, hotel gym basics", icon: "🏨" },
  { id: "bodyweight", label: "Bodyweight", desc: "No equipment needed", icon: "🤸" },
];
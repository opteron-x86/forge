// ═══════════════════════ STARTER TEMPLATES ═══════════════════════
// Pre-built programs for onboarding. Each follows the same structure
// as user-created programs: { name, description, tags, days[] }
// where each day has { label, subtitle, exercises[] } and each
// exercise has { name, defaultSets, targetReps }.
//
// Exercise names MUST match the EXERCISES library exactly.
// Tags are used for filtering: level (beginner/intermediate/advanced),
// goal (strength/hypertrophy/general), daysPerWeek (3/4/5/6).

function ex(name, sets = 3, reps = "8-12") {
  return { name, defaultSets: sets, targetReps: reps, notes: "" };
}

export const STARTER_TEMPLATES = [

  // ────────────────────────────────────────────
  // 1. BEGINNER FULL BODY 3x
  // ────────────────────────────────────────────
  {
    name: "Full Body Basics",
    description: "3 days per week. Full body each session with linear progression on compound lifts. Perfect for your first 3-6 months of training.",
    tags: { level: "beginner", goal: "general", daysPerWeek: 3 },
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
    tags: { level: "beginner", goal: "general", daysPerWeek: 4 },
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
    tags: { level: "intermediate", goal: "hypertrophy", daysPerWeek: 3 },
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
    tags: { level: "intermediate", goal: "hypertrophy", daysPerWeek: 6 },
    days: [
      {
        label: "Push 1",
        subtitle: "Chest focus",
        exercises: [
          ex("Bench Press", 4, "5-6"),
          ex("Incline DB Press", 3, "8-10"),
          ex("Cable Fly (Low to High)", 3, "12"),
          ex("Overhead Press", 3, "8"),
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
  // 5. INTERMEDIATE UPPER / LOWER 4x
  // ────────────────────────────────────────────
  {
    name: "Upper / Lower Power & Hypertrophy",
    description: "4 days per week. Pairs a heavy power day with a higher-rep hypertrophy day for both upper and lower body. The PHUL approach.",
    tags: { level: "intermediate", goal: "general", daysPerWeek: 4 },
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
    tags: { level: "intermediate", goal: "hypertrophy", daysPerWeek: 5 },
    days: [
      {
        label: "Chest",
        subtitle: "Pecs / front delts",
        exercises: [
          ex("Bench Press", 4, "6-8"),
          ex("Incline DB Press", 3, "8-10"),
          ex("Decline Bench Press", 3, "8-10"),
          ex("Cable Fly (Low to High)", 3, "12"),
          ex("Cable Fly (High to Low)", 3, "12"),
          ex("Dips (Chest)", 3, "10-12"),
        ],
      },
      {
        label: "Back",
        subtitle: "Lats / traps / rear delts",
        exercises: [
          ex("Barbell Row", 4, "6-8"),
          ex("Wide Grip Lat Pulldown", 3, "8-10"),
          ex("One-Arm DB Row", 3, "10"),
          ex("Neutral Grip Cable Row", 3, "10"),
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
          ex("Arnold Press", 3, "10"),
          ex("DB Lateral Raise", 4, "12-15"),
          ex("Cable Rear Delt Fly", 3, "15"),
          ex("Cable Lateral Raise", 3, "12"),
          ex("DB Front Raise", 3, "12"),
          ex("DB Shrug (Shoulders)", 3, "12"),
        ],
      },
      {
        label: "Legs",
        subtitle: "Quads / hams / glutes / calves",
        exercises: [
          ex("Back Squat", 4, "6-8"),
          ex("Romanian Deadlift", 4, "8"),
          ex("Leg Press", 3, "10"),
          ex("Leg Extension", 3, "12"),
          ex("Lying Leg Curl", 3, "12"),
          ex("Hip Thrust Machine", 3, "10"),
          ex("Standing Calf Raise Machine", 4, "12"),
          ex("Seated Calf Raise", 3, "15"),
        ],
      },
      {
        label: "Arms",
        subtitle: "Biceps / Triceps / Forearms",
        exercises: [
          ex("EZ-Bar Curl", 3, "8-10"),
          ex("Close-Grip Bench Press", 3, "8-10"),
          ex("Incline DB Curl", 3, "10"),
          ex("Skull Crushers", 3, "10"),
          ex("Hammer Curl", 3, "12"),
          ex("Rope Pushdown", 3, "12"),
          ex("Cable Curl", 2, "12"),
          ex("Overhead Rope Extension", 2, "12"),
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
    tags: { level: "advanced", goal: "strength", daysPerWeek: 4 },
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
    tags: { level: "advanced", goal: "hypertrophy", daysPerWeek: 4 },
    days: [
      {
        label: "Session A",
        subtitle: "Squat / horizontal press",
        exercises: [
          ex("Back Squat", 4, "6-8"),
          ex("Bench Press", 4, "6-8"),
          ex("Neutral Grip Cable Row", 3, "10"),
          ex("DB Romanian Deadlift", 3, "10"),
          ex("DB Lateral Raise", 3, "15"),
          ex("EZ-Bar Curl", 2, "12"),
          ex("Rope Pushdown", 2, "12"),
        ],
      },
      {
        label: "Session B",
        subtitle: "Deadlift / vertical press",
        exercises: [
          ex("Conventional Deadlift", 4, "5"),
          ex("Overhead Press", 4, "6-8"),
          ex("Wide Grip Lat Pulldown", 3, "10"),
          ex("Leg Press", 3, "10"),
          ex("Cable Fly (Low to High)", 3, "12"),
          ex("Hammer Curl", 2, "12"),
          ex("Skull Crushers", 2, "12"),
        ],
      },
      {
        label: "Session C",
        subtitle: "Front squat / incline press",
        exercises: [
          ex("Front Squat", 4, "6-8"),
          ex("Incline DB Press", 4, "8-10"),
          ex("One-Arm DB Row", 3, "10"),
          ex("Lying Leg Curl", 3, "10"),
          ex("Cable Lateral Raise", 3, "15"),
          ex("Incline DB Curl", 2, "12"),
          ex("Overhead Rope Extension", 2, "12"),
        ],
      },
      {
        label: "Session D",
        subtitle: "Hip thrust / rows",
        exercises: [
          ex("Barbell Row", 4, "6-8"),
          ex("DB Bulgarian Split Squat", 3, "10"),
          ex("DB Bench Press", 3, "10"),
          ex("Hip Thrust Machine", 3, "10"),
          ex("Seated DB Shoulder Press", 3, "10"),
          ex("Face Pull", 3, "15"),
          ex("Barbell Curl", 2, "10"),
        ],
      },
    ],
  },
];

export default STARTER_TEMPLATES;

-- ═══════════════════════════════════════════════════════════════
--  TALOS — Exercise Library Migration
--  Moves exercise data from src/lib/exercises.js to PostgreSQL
--
--  Tables created:
--    exercises            — full exercise catalog (built-in + enriched + custom)
--    exercise_substitutions — curated substitution pairs from SUBSTITUTION_MAP
--
--  Run AFTER existing schema init (users, workouts, etc.)
--  This is additive — does not modify existing tables.
-- ═══════════════════════════════════════════════════════════════

-- ─── EXERCISES TABLE ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS exercises (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,

  -- TALOS core fields (maps to current exercises.js schema)
  muscle TEXT NOT NULL,              -- primary TALOS muscle group
  equipment TEXT NOT NULL,           -- barbell, dumbbell, cable, machine, bodyweight, other
  type TEXT NOT NULL,                -- compound, isolation

  -- Source tracking
  source TEXT NOT NULL DEFAULT 'builtin',  -- builtin, free-exercise-db, custom
  created_by TEXT REFERENCES users(id),     -- null for built-in, user_id for custom

  -- Enrichment from free-exercise-db (nullable — only populated for matched/imported exercises)
  external_id TEXT,                  -- free-exercise-db id (e.g. "Barbell_Bench_Press_-_Medium_Grip")
  description TEXT,                  -- instructions joined as prose
  primary_muscles JSONB,             -- ["chest"] — anatomical terms from free-exercise-db
  secondary_muscles JSONB,           -- ["shoulders", "triceps"]
  force TEXT,                        -- push, pull, static
  level TEXT,                        -- beginner, intermediate, expert
  category TEXT,                     -- strength, stretching, plyometrics, etc.
  images JSONB,                      -- ["https://raw.githubusercontent.com/.../0.jpg", "...1.jpg"]

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── EXERCISE SUBSTITUTIONS TABLE ───────────────────────────────
CREATE TABLE IF NOT EXISTS exercise_substitutions (
  exercise_name TEXT NOT NULL,
  substitute_name TEXT NOT NULL,
  rank INTEGER DEFAULT 0,            -- lower = better substitute (0-indexed from SUBSTITUTION_MAP array order)
  source TEXT DEFAULT 'curated',     -- curated (from SUBSTITUTION_MAP), ai-generated, user
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (exercise_name, substitute_name)
);

-- ─── INDEXES ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_exercises_muscle ON exercises(muscle);
CREATE INDEX IF NOT EXISTS idx_exercises_equipment ON exercises(equipment);
CREATE INDEX IF NOT EXISTS idx_exercises_source ON exercises(source);
CREATE INDEX IF NOT EXISTS idx_exercises_category ON exercises(category);
CREATE INDEX IF NOT EXISTS idx_exercises_created_by ON exercises(created_by);
CREATE INDEX IF NOT EXISTS idx_exercise_subs_exercise ON exercise_substitutions(exercise_name);
CREATE INDEX IF NOT EXISTS idx_exercise_subs_substitute ON exercise_substitutions(substitute_name);

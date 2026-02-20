// ═══════════════════════════════════════════════════════════════
//  TALOS — Exercise Table Schema Migration
//
//  Called from initSchema() in server/db/schema.js
//  Adds exercises + exercise_substitutions tables.
//  Safe to run repeatedly (IF NOT EXISTS / ON CONFLICT).
// ═══════════════════════════════════════════════════════════════

/**
 * Add exercise library tables to the database schema.
 * @param {object} db - Database adapter (sqlite or postgres)
 */
export async function migrateExerciseTables(db) {
  const pg = db.type === "postgres";
  const d = (sqliteVal, pgVal) => (pg ? pgVal : sqliteVal);

  const TIMESTAMP = d("TEXT", "TIMESTAMPTZ");
  const NOW = d("datetime('now')", "NOW()");
  const JSON_TYPE = d("TEXT", "JSONB");

  // ─── EXERCISES TABLE ──────────────────────────────────────────
  await db.exec(`
    CREATE TABLE IF NOT EXISTS exercises (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      muscle TEXT NOT NULL,
      equipment TEXT NOT NULL,
      type TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'builtin',
      created_by TEXT REFERENCES users(id),
      external_id TEXT,
      description TEXT,
      primary_muscles ${JSON_TYPE},
      secondary_muscles ${JSON_TYPE},
      force TEXT,
      level TEXT,
      category TEXT,
      images ${JSON_TYPE},
      created_at ${TIMESTAMP} DEFAULT (${NOW}),
      updated_at ${TIMESTAMP} DEFAULT (${NOW})
    )
  `);

  // ─── EXERCISE SUBSTITUTIONS TABLE ─────────────────────────────
  await db.exec(`
    CREATE TABLE IF NOT EXISTS exercise_substitutions (
      exercise_name TEXT NOT NULL,
      substitute_name TEXT NOT NULL,
      rank INTEGER DEFAULT 0,
      source TEXT DEFAULT 'curated',
      created_at ${TIMESTAMP} DEFAULT (${NOW}),
      PRIMARY KEY (exercise_name, substitute_name)
    )
  `);

  // ─── INDEXES ──────────────────────────────────────────────────
  const indexes = [
    "CREATE INDEX IF NOT EXISTS idx_exercises_muscle ON exercises(muscle)",
    "CREATE INDEX IF NOT EXISTS idx_exercises_equipment ON exercises(equipment)",
    "CREATE INDEX IF NOT EXISTS idx_exercises_source ON exercises(source)",
    "CREATE INDEX IF NOT EXISTS idx_exercises_category ON exercises(category)",
    "CREATE INDEX IF NOT EXISTS idx_exercises_created_by ON exercises(created_by)",
    "CREATE INDEX IF NOT EXISTS idx_exercise_subs_exercise ON exercise_substitutions(exercise_name)",
    "CREATE INDEX IF NOT EXISTS idx_exercise_subs_substitute ON exercise_substitutions(substitute_name)",
  ];

  for (const idx of indexes) {
    try {
      await db.exec(idx);
    } catch (e) {
      // Index may already exist — safe to ignore
    }
  }
}
// ═══════════════════════════════════════════════════════════════
//  TALOS — Database Schema & Migrations
//
//  Dialect-aware schema initialization that works with both
//  SQLite and PostgreSQL. Called once at startup.
//
//  Tables: users, workouts, profiles, bio_history, programs,
//          custom_exercises, coach_messages, workout_reviews,
//          ai_config, analytics_events, exercises,
//          exercise_substitutions
// ═══════════════════════════════════════════════════════════════

import { migrateExerciseTables } from "./exercise-schema.js";

/**
 * Initialize the complete database schema.
 * @param {object} db - Database adapter (sqlite or postgres)
 */
export async function initSchema(db) {
  const pg = db.type === "postgres";

  // Helper: pick dialect-specific SQL
  const d = (sqliteVal, pgVal) => (pg ? pgVal : sqliteVal);

  // ─── Type aliases by dialect ───
  const TEXT_PK    = "TEXT PRIMARY KEY";
  const AUTO_ID    = d("INTEGER PRIMARY KEY AUTOINCREMENT", "INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY");
  const TIMESTAMP  = d("TEXT", "TIMESTAMPTZ");
  const NOW        = d("datetime('now')", "NOW()");
  const BOOL       = d("INTEGER", "BOOLEAN");
  const BOOL_FALSE = d("0", "FALSE");
  const BOOL_TRUE  = d("1", "TRUE");
  const JSON_TYPE  = d("TEXT", "JSONB");

  // ===================== TABLES =====================

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id ${TEXT_PK},
      name TEXT NOT NULL,
      email TEXT UNIQUE,
      password_hash TEXT,
      role TEXT DEFAULT 'user',
      color TEXT DEFAULT '#f97316',
      theme TEXT DEFAULT 'talos',
      is_active ${BOOL} DEFAULT ${BOOL_TRUE},
      reset_token TEXT,
      reset_token_expires ${TIMESTAMP},
      created_at ${TIMESTAMP} DEFAULT (${NOW})
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS workouts (
      id ${TEXT_PK},
      user_id TEXT NOT NULL REFERENCES users(id),
      date TEXT NOT NULL,
      program_id TEXT,
      day_id TEXT,
      day_label TEXT,
      feel INTEGER DEFAULT 3,
      sleep_hours REAL,
      duration INTEGER,
      notes TEXT DEFAULT '',
      exercises ${JSON_TYPE} DEFAULT '[]',
      finished_at ${TIMESTAMP},
      created_at ${TIMESTAMP} DEFAULT (${NOW})
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      user_id TEXT PRIMARY KEY REFERENCES users(id),
      height TEXT DEFAULT '',
      weight REAL,
      body_fat REAL,
      rest_timer_compound INTEGER DEFAULT 150,
      rest_timer_isolation INTEGER DEFAULT 90,
      sex TEXT DEFAULT '',
      date_of_birth TEXT DEFAULT '',
      goal TEXT DEFAULT '',
      target_weight REAL,
      experience_level TEXT DEFAULT '',
      training_intensity TEXT DEFAULT '',
      target_prs ${JSON_TYPE} DEFAULT '{}',
      injuries_notes TEXT DEFAULT '',
      calories_target INTEGER,
      protein_target INTEGER,
      active_program_id TEXT,
      onboarding_complete ${BOOL} DEFAULT ${BOOL_FALSE},
      intensity_scale TEXT DEFAULT 'rpe'
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS bio_history (
      id ${AUTO_ID},
      user_id TEXT NOT NULL REFERENCES users(id),
      date TEXT NOT NULL,
      weight REAL,
      body_fat REAL
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS programs (
      id ${TEXT_PK},
      user_id TEXT NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      days ${JSON_TYPE} DEFAULT '[]',
      shared ${BOOL} DEFAULT ${BOOL_FALSE},
      forked_from TEXT,
      created_at ${TIMESTAMP} DEFAULT (${NOW})
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS custom_exercises (
      id ${TEXT_PK},
      name TEXT NOT NULL UNIQUE,
      muscle TEXT DEFAULT 'other',
      equipment TEXT DEFAULT 'other',
      type TEXT DEFAULT 'isolation',
      created_by TEXT,
      created_at ${TIMESTAMP} DEFAULT (${NOW})
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS coach_messages (
      id ${TEXT_PK},
      user_id TEXT NOT NULL REFERENCES users(id),
      type TEXT DEFAULT 'chat',
      prompt TEXT,
      response TEXT,
      created_at ${TIMESTAMP} DEFAULT (${NOW})
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS workout_reviews (
      id ${TEXT_PK},
      workout_id TEXT NOT NULL,
      user_id TEXT NOT NULL REFERENCES users(id),
      review TEXT,
      created_at ${TIMESTAMP} DEFAULT (${NOW})
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS ai_config (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS analytics_events (
      id ${AUTO_ID},
      user_id TEXT,
      event TEXT NOT NULL,
      meta ${JSON_TYPE},
      created_at ${TIMESTAMP} DEFAULT (${NOW})
    )
  `);

  // ===================== INDEXES =====================

  const indexes = [
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email)",
    "CREATE INDEX IF NOT EXISTS idx_workouts_user_date ON workouts(user_id, date)",
    "CREATE INDEX IF NOT EXISTS idx_coach_messages_user ON coach_messages(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_workout_reviews_user ON workout_reviews(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_programs_user ON programs(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_bio_history_user ON bio_history(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_analytics_user_event ON analytics_events(user_id, event)",
  ];

  for (const sql of indexes) {
    try {
      await db.exec(sql);
    } catch (e) {
      // Index may already exist — safe to ignore
    }
  }

  // ===================== MIGRATIONS =====================
  // Safe column additions — try/catch each one individually.
  // These handle upgrades from older schema versions.
  // On a fresh PostgreSQL database, the columns already exist
  // from the CREATE TABLE above, so these are all no-ops.

  const migrations = [
    "ALTER TABLE programs ADD COLUMN forked_from TEXT",
    "ALTER TABLE workouts ADD COLUMN finished_at TEXT",
    `ALTER TABLE profiles ADD COLUMN intensity_scale TEXT DEFAULT 'rpe'`,
    `ALTER TABLE profiles ADD COLUMN onboarding_complete ${BOOL} DEFAULT ${BOOL_FALSE}`,
  ];

  for (const sql of migrations) {
    try {
      await db.exec(sql);
    } catch (e) {
      // Column already exists — expected
    }
  }

  // ===================== EXERCISE LIBRARY =====================
  await migrateExerciseTables(db);

  console.log(`[DB] Schema initialized (${db.type})`);
}

/**
 * Bootstrap the admin user if ADMIN_EMAIL is set.
 * @param {object} db - Database adapter
 */
export async function bootstrapAdmin(db) {
  const adminEmail = process.env.ADMIN_EMAIL || null;
  if (!adminEmail) return;

  const user = await db.get("SELECT id FROM users WHERE email = $1", [adminEmail]);
  if (user) {
    await db.run("UPDATE users SET role = 'admin' WHERE id = $1", [user.id]);
    console.log(`[DB] Admin bootstrapped: ${adminEmail}`);
  }
}
#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════
//  TALOS — SQLite → PostgreSQL Data Migration
//
//  One-time script to copy all data from an existing SQLite
//  database into a PostgreSQL database. Safe to run repeatedly
//  (uses INSERT ... ON CONFLICT DO UPDATE for upserts).
//
//  Prerequisites:
//    npm install pg better-sqlite3
//
//  Usage:
//    DATABASE_PATH=/data/talos.db DATABASE_URL=postgres://... node scripts/migrate-sqlite-to-pg.js
//
//  The script will:
//    1. Connect to both databases
//    2. Create PG schema if it doesn't exist
//    3. Migrate all rows table-by-table
//    4. Validate row counts
//    5. Report results
// ═══════════════════════════════════════════════════════════════

import Database from "better-sqlite3";
import pg from "pg";

const { Pool } = pg;

// ── Configuration ──
const SQLITE_PATH = process.env.DATABASE_PATH || "talos.db";
const PG_URL = process.env.DATABASE_URL;

if (!PG_URL) {
  console.error("❌ DATABASE_URL is required. Set it to your PostgreSQL connection string.");
  process.exit(1);
}

// ── Connect to both databases ──
console.log(`\n📦 Opening SQLite: ${SQLITE_PATH}`);
const sqlite = Database(SQLITE_PATH, { readonly: true });
sqlite.pragma("journal_mode = WAL");

console.log(`🐘 Connecting to PostgreSQL...`);
const pool = new Pool({
  connectionString: PG_URL,
  ssl: PG_URL.includes("localhost") ? false : { rejectUnauthorized: false },
});

// Test PG connection
try {
  const { rows } = await pool.query("SELECT NOW() as now");
  console.log(`   Connected at ${rows[0].now}\n`);
} catch (err) {
  console.error(`❌ PostgreSQL connection failed: ${err.message}`);
  process.exit(1);
}

// ── Schema creation (PostgreSQL) ──
console.log("🏗️  Creating PostgreSQL schema...");

await pool.query(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    password_hash TEXT,
    role TEXT DEFAULT 'user',
    color TEXT DEFAULT '#f97316',
    theme TEXT DEFAULT 'talos',
    is_active BOOLEAN DEFAULT TRUE,
    reset_token TEXT,
    reset_token_expires TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )
`);

await pool.query(`
  CREATE TABLE IF NOT EXISTS workouts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    date TEXT NOT NULL,
    program_id TEXT,
    day_id TEXT,
    day_label TEXT,
    feel INTEGER DEFAULT 3,
    sleep_hours REAL,
    duration INTEGER,
    notes TEXT DEFAULT '',
    exercises JSONB DEFAULT '[]',
    finished_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )
`);

await pool.query(`
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
    target_prs JSONB DEFAULT '{}',
    injuries_notes TEXT DEFAULT '',
    calories_target INTEGER,
    protein_target INTEGER,
    active_program_id TEXT,
    onboarding_complete BOOLEAN DEFAULT FALSE,
    intensity_scale TEXT DEFAULT 'rpe'
  )
`);

await pool.query(`
  CREATE TABLE IF NOT EXISTS bio_history (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    date TEXT NOT NULL,
    weight REAL,
    body_fat REAL
  )
`);

await pool.query(`
  CREATE TABLE IF NOT EXISTS programs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    days JSONB DEFAULT '[]',
    shared BOOLEAN DEFAULT FALSE,
    forked_from TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )
`);

await pool.query(`
  CREATE TABLE IF NOT EXISTS custom_exercises (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    muscle TEXT DEFAULT 'other',
    equipment TEXT DEFAULT 'other',
    type TEXT DEFAULT 'isolation',
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )
`);

await pool.query(`
  CREATE TABLE IF NOT EXISTS coach_messages (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    type TEXT DEFAULT 'chat',
    prompt TEXT,
    response TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )
`);

await pool.query(`
  CREATE TABLE IF NOT EXISTS workout_reviews (
    id TEXT PRIMARY KEY,
    workout_id TEXT NOT NULL,
    user_id TEXT NOT NULL REFERENCES users(id),
    review TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )
`);

await pool.query(`
  CREATE TABLE IF NOT EXISTS ai_config (
    key TEXT PRIMARY KEY,
    value TEXT
  )
`);

await pool.query(`
  CREATE TABLE IF NOT EXISTS analytics_events (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id TEXT,
    event TEXT NOT NULL,
    meta JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )
`);

// Indexes
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
  try { await pool.query(sql); } catch (e) { /* exists */ }
}

console.log("   Schema ready.\n");

// ═══════════════════════════════════════════════════════════════
//  DATA MIGRATION
// ═══════════════════════════════════════════════════════════════

const results = [];

/**
 * Migrate a table from SQLite to PostgreSQL.
 *
 * @param {string} table - Table name
 * @param {string[]} columns - Column names to migrate
 * @param {string} conflictKey - Column(s) for ON CONFLICT (e.g. "id")
 * @param {object} options
 * @param {object} options.transforms - Column-level transform functions
 * @param {boolean} options.identityInsert - If true, uses OVERRIDING SYSTEM VALUE for identity columns
 */
async function migrateTable(table, columns, conflictKey, options = {}) {
  const { transforms = {}, identityInsert = false } = options;
  const rows = sqlite.prepare(`SELECT ${columns.join(", ")} FROM ${table}`).all();

  if (rows.length === 0) {
    console.log(`   ⏭️  ${table}: empty, skipping`);
    results.push({ table, sqlite: 0, postgres: 0, status: "empty" });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    for (const row of rows) {
      // Apply transforms
      for (const [col, fn] of Object.entries(transforms)) {
        row[col] = fn(row[col]);
      }

      const values = columns.map((c) => row[c]);
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ");

      // Build upsert — update all columns except the conflict key
      const updateCols = columns.filter((c) => c !== conflictKey);
      const updateSet = updateCols
        .map((c, i) => `${c} = EXCLUDED.${c}`)
        .join(", ");

      const overriding = identityInsert ? "OVERRIDING SYSTEM VALUE" : "";

      const sql = updateCols.length > 0
        ? `INSERT INTO ${table} (${columns.join(", ")}) ${overriding}
           VALUES (${placeholders})
           ON CONFLICT (${conflictKey}) DO UPDATE SET ${updateSet}`
        : `INSERT INTO ${table} (${columns.join(", ")}) ${overriding}
           VALUES (${placeholders})
           ON CONFLICT (${conflictKey}) DO NOTHING`;

      await client.query(sql, values);
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(`   ❌ ${table}: FAILED — ${err.message}`);
    results.push({ table, sqlite: rows.length, postgres: 0, status: "FAILED" });
    return;
  } finally {
    client.release();
  }

  // Validate
  const { rows: countRows } = await pool.query(`SELECT COUNT(*) as cnt FROM ${table}`);
  const pgCount = parseInt(countRows[0].cnt);

  console.log(`   ✅ ${table}: ${rows.length} → ${pgCount} rows`);
  results.push({ table, sqlite: rows.length, postgres: pgCount, status: "ok" });
}

// ── Transforms ──
// SQLite stores booleans as 0/1 integers; PG uses true/false
const toBool = (v) => (v === 1 || v === "1" || v === true ? true : false);

// SQLite stores JSON as TEXT strings; PG JSONB needs parsed objects
// But pg driver handles JSON.stringify automatically for JSONB params,
// so we parse first then let pg re-serialize
const toJson = (v) => {
  if (v === null || v === undefined) return null;
  if (typeof v === "object") return JSON.stringify(v); // already parsed
  try {
    JSON.parse(v); // validate it's valid JSON
    return v;      // pass the string — pg driver handles JSONB
  } catch {
    return v;
  }
};

// ── Migrate tables in dependency order ──
console.log("📋 Migrating data...\n");

// 1. Users (no foreign key deps)
await migrateTable(
  "users",
  ["id", "name", "email", "password_hash", "role", "color", "theme", "is_active", "reset_token", "reset_token_expires", "created_at"],
  "id",
  { transforms: { is_active: toBool } }
);

// 2. Profiles (depends on users)
await migrateTable(
  "profiles",
  ["user_id", "height", "weight", "body_fat", "rest_timer_compound", "rest_timer_isolation", "sex", "date_of_birth", "goal", "target_weight", "experience_level", "training_intensity", "target_prs", "injuries_notes", "calories_target", "protein_target", "active_program_id", "onboarding_complete", "intensity_scale"],
  "user_id",
  { transforms: { onboarding_complete: toBool, target_prs: toJson } }
);

// 3. Workouts (depends on users)
await migrateTable(
  "workouts",
  ["id", "user_id", "date", "program_id", "day_id", "day_label", "feel", "sleep_hours", "duration", "notes", "exercises", "finished_at", "created_at"],
  "id",
  { transforms: { exercises: toJson } }
);

// 4. Bio history (depends on users) — has IDENTITY column
await migrateTable(
  "bio_history",
  ["id", "user_id", "date", "weight", "body_fat"],
  "id",
  { identityInsert: true }
);

// 5. Programs (depends on users)
await migrateTable(
  "programs",
  ["id", "user_id", "name", "description", "days", "shared", "forked_from", "created_at"],
  "id",
  { transforms: { shared: toBool, days: toJson } }
);

// 6. Custom exercises
await migrateTable(
  "custom_exercises",
  ["id", "name", "muscle", "equipment", "type", "created_by", "created_at"],
  "id"
);

// 7. Coach messages (depends on users)
await migrateTable(
  "coach_messages",
  ["id", "user_id", "type", "prompt", "response", "created_at"],
  "id"
);

// 8. Workout reviews (depends on users)
await migrateTable(
  "workout_reviews",
  ["id", "workout_id", "user_id", "review", "created_at"],
  "id"
);

// 9. AI config
await migrateTable(
  "ai_config",
  ["key", "value"],
  "key"
);

// 10. Analytics events — has IDENTITY column
await migrateTable(
  "analytics_events",
  ["id", "user_id", "event", "meta", "created_at"],
  "id",
  { identityInsert: true, transforms: { meta: toJson } }
);

// ── Reset identity sequences for tables with IDENTITY columns ──
console.log("\n🔄 Resetting identity sequences...");

for (const table of ["bio_history", "analytics_events"]) {
  try {
    const { rows } = await pool.query(`SELECT COALESCE(MAX(id), 0) + 1 as next_val FROM ${table}`);
    await pool.query(`ALTER TABLE ${table} ALTER COLUMN id RESTART WITH ${rows[0].next_val}`);
    console.log(`   ${table}: next id = ${rows[0].next_val}`);
  } catch (err) {
    console.error(`   ${table}: sequence reset failed — ${err.message}`);
  }
}

// ═══════════════════════════════════════════════════════════════
//  REPORT
// ═══════════════════════════════════════════════════════════════

console.log("\n" + "═".repeat(55));
console.log("  MIGRATION REPORT");
console.log("═".repeat(55));
console.log("");

let allOk = true;
for (const r of results) {
  const icon = r.status === "ok" ? "✅" : r.status === "empty" ? "⏭️ " : "❌";
  const match = r.sqlite === r.postgres ? "" : ` ⚠️  COUNT MISMATCH`;
  console.log(`  ${icon} ${r.table.padEnd(20)} SQLite: ${String(r.sqlite).padStart(6)}  →  PG: ${String(r.postgres).padStart(6)}${match}`);
  if (r.status === "FAILED" || r.sqlite !== r.postgres) allOk = false;
}

console.log("");
if (allOk) {
  console.log("  🎉 Migration complete — all tables verified!");
} else {
  console.log("  ⚠️  Migration completed with issues — review above.");
}
console.log("═".repeat(55) + "\n");

// ── Cleanup ──
sqlite.close();
await pool.end();

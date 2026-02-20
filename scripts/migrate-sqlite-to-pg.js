#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════
//  TALOS — Adaptive SQLite → PostgreSQL Migration
//
//  Reads the actual SQLite schema dynamically — no hardcoded
//  column lists. Discovers tables, reads columns, maps to PG,
//  and inserts only what exists in both databases.
//
//  Usage:
//    DATABASE_PATH=./talos-prod.db DATABASE_URL=postgres://... node scripts/migrate-sqlite-to-pg.js
// ═══════════════════════════════════════════════════════════════

import Database from "better-sqlite3";
import pg from "pg";

const { Pool } = pg;

const SQLITE_PATH = process.env.DATABASE_PATH || "talos.db";
const PG_URL = process.env.DATABASE_URL;

if (!PG_URL) {
  console.error("❌ DATABASE_URL is required.");
  process.exit(1);
}

// ── Connect ──
console.log(`\n📦 Opening SQLite: ${SQLITE_PATH}`);
const sqlite = Database(SQLITE_PATH, { readonly: true });

console.log(`🐘 Connecting to PostgreSQL...`);
const pool = new Pool({
  connectionString: PG_URL,
  ssl: PG_URL.includes("localhost") ? false : { rejectUnauthorized: false },
});

try {
  const { rows } = await pool.query("SELECT NOW() as now");
  console.log(`   Connected at ${rows[0].now}\n`);
} catch (err) {
  console.error(`❌ PostgreSQL connection failed: ${err.message}`);
  process.exit(1);
}

// ═══════════════════════════════════════════════════════════════
//  STEP 1: DISCOVER SQLITE SCHEMA
// ═══════════════════════════════════════════════════════════════

console.log("═".repeat(55));
console.log("  STEP 1: SQLITE SCHEMA DISCOVERY");
console.log("═".repeat(55) + "\n");

// Get all tables
const tables = sqlite.prepare(
  "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
).all().map(r => r.name);

console.log(`Found ${tables.length} tables: ${tables.join(", ")}\n`);

const sqliteSchema = {};

for (const table of tables) {
  const columns = sqlite.prepare(`PRAGMA table_info(${table})`).all();
  const rowCount = sqlite.prepare(`SELECT COUNT(*) as cnt FROM ${table}`).get().cnt;
  sqliteSchema[table] = {
    columns: columns.map(c => ({ name: c.name, type: c.type, pk: c.pk })),
    columnNames: columns.map(c => c.name),
    rowCount,
  };

  console.log(`  📋 ${table} (${rowCount} rows)`);
  for (const col of columns) {
    const pkTag = col.pk ? " 🔑" : "";
    console.log(`      ${col.name.padEnd(25)} ${col.type.padEnd(15)}${pkTag}`);
  }
  console.log();
}

// ═══════════════════════════════════════════════════════════════
//  STEP 2: CREATE PG SCHEMA
// ═══════════════════════════════════════════════════════════════

console.log("═".repeat(55));
console.log("  STEP 2: CREATE POSTGRESQL SCHEMA");
console.log("═".repeat(55) + "\n");

const pgDDL = [
  `CREATE TABLE IF NOT EXISTS users (
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
  )`,
  `CREATE TABLE IF NOT EXISTS workouts (
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
  )`,
  `CREATE TABLE IF NOT EXISTS profiles (
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
  )`,
  `CREATE TABLE IF NOT EXISTS bio_history (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    date TEXT NOT NULL,
    weight REAL,
    body_fat REAL
  )`,
  `CREATE TABLE IF NOT EXISTS programs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    days JSONB DEFAULT '[]',
    shared BOOLEAN DEFAULT FALSE,
    forked_from TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS custom_exercises (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    muscle TEXT DEFAULT 'other',
    equipment TEXT DEFAULT 'other',
    type TEXT DEFAULT 'isolation',
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS coach_messages (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    type TEXT DEFAULT 'chat',
    prompt TEXT,
    response TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS workout_reviews (
    id TEXT PRIMARY KEY,
    workout_id TEXT NOT NULL,
    user_id TEXT NOT NULL REFERENCES users(id),
    review TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS ai_config (
    key TEXT PRIMARY KEY,
    value TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS analytics_events (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id TEXT,
    event TEXT NOT NULL,
    meta JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,
];

for (const ddl of pgDDL) {
  await pool.query(ddl);
}

const pgIndexes = [
  "CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email)",
  "CREATE INDEX IF NOT EXISTS idx_workouts_user_date ON workouts(user_id, date)",
  "CREATE INDEX IF NOT EXISTS idx_coach_messages_user ON coach_messages(user_id)",
  "CREATE INDEX IF NOT EXISTS idx_workout_reviews_user ON workout_reviews(user_id)",
  "CREATE INDEX IF NOT EXISTS idx_programs_user ON programs(user_id)",
  "CREATE INDEX IF NOT EXISTS idx_bio_history_user ON bio_history(user_id)",
  "CREATE INDEX IF NOT EXISTS idx_analytics_user_event ON analytics_events(user_id, event)",
];
for (const sql of pgIndexes) {
  try { await pool.query(sql); } catch (e) { /* exists */ }
}

// Get PG column info for each table
const pgSchema = {};
for (const table of tables) {
  const { rows } = await pool.query(
    "SELECT column_name, data_type, is_identity FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position",
    [table]
  );
  if (rows.length > 0) {
    pgSchema[table] = {
      columnNames: rows.map(r => r.column_name),
      types: Object.fromEntries(rows.map(r => [r.column_name, r.data_type])),
      identityCols: rows.filter(r => r.is_identity === "YES").map(r => r.column_name),
    };
  }
}

console.log("   PG schema ready.\n");

// ═══════════════════════════════════════════════════════════════
//  STEP 3: MIGRATE DATA
// ═══════════════════════════════════════════════════════════════

console.log("═".repeat(55));
console.log("  STEP 3: MIGRATE DATA");
console.log("═".repeat(55) + "\n");

// Type transforms
const JSONB_COLUMNS = new Set(["exercises", "days", "target_prs", "meta"]);
const BOOL_COLUMNS = new Set(["is_active", "shared", "onboarding_complete"]);

function transformValue(colName, value, pgType) {
  if (value === null || value === undefined) return null;

  if (BOOL_COLUMNS.has(colName) || pgType === "boolean") {
    return value === 1 || value === "1" || value === true;
  }

  if (JSONB_COLUMNS.has(colName) || pgType === "jsonb") {
    if (typeof value === "object") return JSON.stringify(value);
    try { JSON.parse(value); return value; } catch { return value; }
  }

  return value;
}

// Migration order: respect foreign key dependencies
const MIGRATION_ORDER = [
  { table: "users", conflictKey: "id" },
  { table: "profiles", conflictKey: "user_id" },
  { table: "workouts", conflictKey: "id" },
  { table: "bio_history", conflictKey: "id" },
  { table: "programs", conflictKey: "id" },
  { table: "custom_exercises", conflictKey: "id" },
  { table: "coach_messages", conflictKey: "id" },
  { table: "workout_reviews", conflictKey: "id" },
  { table: "ai_config", conflictKey: "key" },
  { table: "analytics_events", conflictKey: "id" },
];

const results = [];

for (const { table, conflictKey } of MIGRATION_ORDER) {
  const sqliteInfo = sqliteSchema[table];
  const pgInfo = pgSchema[table];

  if (!sqliteInfo) {
    console.log(`   ⏭️  ${table}: not in SQLite, skipping`);
    results.push({ table, sqlite: 0, postgres: 0, status: "not-in-sqlite" });
    continue;
  }

  if (!pgInfo) {
    console.log(`   ⏭️  ${table}: not in PG schema, skipping`);
    results.push({ table, sqlite: 0, postgres: 0, status: "not-in-pg" });
    continue;
  }

  if (sqliteInfo.rowCount === 0) {
    console.log(`   ⏭️  ${table}: empty`);
    results.push({ table, sqlite: 0, postgres: 0, status: "empty" });
    continue;
  }

  // Find columns that exist in BOTH SQLite and PG
  const pgColSet = new Set(pgInfo.columnNames);
  const sharedColumns = sqliteInfo.columnNames.filter(c => pgColSet.has(c));
  const hasIdentity = sharedColumns.some(c => pgInfo.identityCols.includes(c));

  const sqliteOnly = sqliteInfo.columnNames.filter(c => !pgColSet.has(c));
  const pgOnly = pgInfo.columnNames.filter(c => !new Set(sqliteInfo.columnNames).has(c));

  if (sqliteOnly.length > 0) {
    console.log(`   ⚠️  ${table}: SQLite-only columns (ignored): ${sqliteOnly.join(", ")}`);
  }
  if (pgOnly.length > 0) {
    console.log(`   📌 ${table}: PG-only columns (will use defaults): ${pgOnly.join(", ")}`);
  }

  if (sharedColumns.length === 0) {
    console.log(`   ❌ ${table}: no shared columns between SQLite and PG, skipping`);
    results.push({ table, sqlite: sqliteInfo.rowCount, postgres: 0, status: "no-shared-columns" });
    continue;
  }

  console.log(`   🔄 ${table}: migrating ${sharedColumns.length} columns: ${sharedColumns.join(", ")}`);

  // Read all rows from SQLite
  const rows = sqlite.prepare(`SELECT ${sharedColumns.join(", ")} FROM ${table}`).all();

  // Insert into PG
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    for (const row of rows) {
      const values = sharedColumns.map(col =>
        transformValue(col, row[col], pgInfo.types[col])
      );
      const placeholders = sharedColumns.map((_, i) => `$${i + 1}`).join(", ");
      const overriding = hasIdentity ? "OVERRIDING SYSTEM VALUE" : "";

      const updateCols = sharedColumns.filter(c => c !== conflictKey);
      const updateSet = updateCols.map(c => `${c} = EXCLUDED.${c}`).join(", ");

      const sql = updateCols.length > 0
        ? `INSERT INTO ${table} (${sharedColumns.join(", ")}) ${overriding}
           VALUES (${placeholders})
           ON CONFLICT (${conflictKey}) DO UPDATE SET ${updateSet}`
        : `INSERT INTO ${table} (${sharedColumns.join(", ")}) ${overriding}
           VALUES (${placeholders})
           ON CONFLICT (${conflictKey}) DO NOTHING`;

      await client.query(sql, values);
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(`   ❌ ${table}: FAILED — ${err.message}`);
    results.push({ table, sqlite: rows.length, postgres: 0, status: "FAILED" });
    client.release();
    continue;
  } finally {
    client.release();
  }

  const { rows: countRows } = await pool.query(`SELECT COUNT(*) as cnt FROM ${table}`);
  const pgCount = parseInt(countRows[0].cnt);
  console.log(`   ✅ ${table}: ${rows.length} → ${pgCount} rows`);
  results.push({ table, sqlite: rows.length, postgres: pgCount, status: "ok" });
}

// ── Reset identity sequences ──
console.log("\n🔄 Resetting identity sequences...");
for (const { table } of MIGRATION_ORDER) {
  const pgInfo = pgSchema[table];
  if (!pgInfo || pgInfo.identityCols.length === 0) continue;
  for (const col of pgInfo.identityCols) {
    try {
      const { rows } = await pool.query(`SELECT COALESCE(MAX(${col}), 0) + 1 as next_val FROM ${table}`);
      await pool.query(`ALTER TABLE ${table} ALTER COLUMN ${col} RESTART WITH ${rows[0].next_val}`);
      console.log(`   ${table}.${col}: next = ${rows[0].next_val}`);
    } catch (err) {
      console.error(`   ${table}.${col}: reset failed — ${err.message}`);
    }
  }
}

// ═══════════════════════════════════════════════════════════════
//  REPORT
// ═══════════════════════════════════════════════════════════════

console.log("\n" + "═".repeat(55));
console.log("  MIGRATION REPORT");
console.log("═".repeat(55) + "\n");

let allOk = true;
for (const r of results) {
  const icon = r.status === "ok" ? "✅" :
               ["empty", "not-in-sqlite", "not-in-pg"].includes(r.status) ? "⏭️ " : "❌";
  const match = (r.status === "ok" && r.sqlite !== r.postgres) ? " ⚠️  COUNT MISMATCH" : "";
  console.log(`  ${icon} ${r.table.padEnd(20)} SQLite: ${String(r.sqlite).padStart(6)}  →  PG: ${String(r.postgres).padStart(6)}  ${r.status}${match}`);
  if (r.status === "FAILED" || r.status === "no-shared-columns") allOk = false;
}

console.log("");
if (allOk) {
  console.log("  🎉 Migration complete — all tables verified!");
} else {
  console.log("  ⚠️  Migration completed with issues — review above.");
}
console.log("═".repeat(55) + "\n");

sqlite.close();
await pool.end();

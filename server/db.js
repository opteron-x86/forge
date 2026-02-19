// ═══════════════════════════════════════════════════════════════
//  TALOS — Database Module
//  Extracted from server.js monolith (Phase 2 audit, commit 7e055db)
//
//  Handles: SQLite initialization, table creation, migrations,
//  indexes, and shared helper functions (genId, trackEvent).
// ═══════════════════════════════════════════════════════════════

import Database from "better-sqlite3";
import { mkdirSync } from "fs";
import { dirname } from "path";

// --- Database path ---
const DB_PATH = process.env.DATABASE_PATH || "talos.db";

// Ensure directory exists (Railway persistent volumes, etc.)
try {
  mkdirSync(dirname(DB_PATH), { recursive: true });
} catch (e) {
  // dirname(".") = "." — mkdirSync throws on existing dirs in some edge cases
}

// --- Initialize database ---
const db = Database(DB_PATH, { verbose: process.env.NODE_ENV === "development" ? console.log : undefined });
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// ===================== SCHEMA =====================

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    password_hash TEXT,
    role TEXT DEFAULT 'user',
    color TEXT DEFAULT '#f97316',
    theme TEXT DEFAULT 'talos',
    is_active INTEGER DEFAULT 1,
    reset_token TEXT,
    reset_token_expires TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS workouts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    date TEXT NOT NULL,
    program_id TEXT,
    day_id TEXT,
    day_label TEXT,
    feel INTEGER DEFAULT 3,
    sleep_hours REAL,
    duration INTEGER,
    notes TEXT DEFAULT '',
    exercises TEXT DEFAULT '[]',
    finished_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);

db.exec(`CREATE TABLE IF NOT EXISTS profiles (
  user_id TEXT PRIMARY KEY,
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
  target_prs TEXT DEFAULT '{}',
  injuries_notes TEXT DEFAULT '',
  calories_target INTEGER,
  protein_target INTEGER,
  active_program_id TEXT,
  onboarding_complete INTEGER DEFAULT 0,
  intensity_scale TEXT DEFAULT 'rpe',
  FOREIGN KEY (user_id) REFERENCES users(id)
)`);

db.exec(`CREATE TABLE IF NOT EXISTS bio_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,
  weight REAL,
  body_fat REAL,
  FOREIGN KEY (user_id) REFERENCES users(id)
)`);

db.exec(`CREATE TABLE IF NOT EXISTS programs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  days TEXT DEFAULT '[]',
  shared INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
)`);

db.exec(`CREATE TABLE IF NOT EXISTS custom_exercises (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  muscle TEXT DEFAULT 'other',
  equipment TEXT DEFAULT 'other',
  type TEXT DEFAULT 'isolation',
  created_by TEXT,
  created_at TEXT DEFAULT (datetime('now'))
)`);

db.exec(`CREATE TABLE IF NOT EXISTS coach_messages (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT DEFAULT 'chat',
  prompt TEXT,
  response TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
)`);

db.exec(`CREATE TABLE IF NOT EXISTS workout_reviews (
  id TEXT PRIMARY KEY,
  workout_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  review TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
)`);

db.exec(`CREATE TABLE IF NOT EXISTS ai_config (
  key TEXT PRIMARY KEY,
  value TEXT
)`);

db.exec(`CREATE TABLE IF NOT EXISTS analytics_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  event TEXT NOT NULL,
  meta TEXT,
  created_at TEXT DEFAULT (datetime('now'))
)`);

// ===================== INDEXES =====================

// Unique indexes
try { db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email)"); } catch (e) { /* already exists */ }

// Performance indexes (Phase 1 hardening audit)
try { db.exec("CREATE INDEX IF NOT EXISTS idx_workouts_user_date ON workouts(user_id, date)"); } catch (e) { /* exists */ }
try { db.exec("CREATE INDEX IF NOT EXISTS idx_coach_messages_user ON coach_messages(user_id)"); } catch (e) { /* exists */ }
try { db.exec("CREATE INDEX IF NOT EXISTS idx_workout_reviews_user ON workout_reviews(user_id)"); } catch (e) { /* exists */ }
try { db.exec("CREATE INDEX IF NOT EXISTS idx_programs_user ON programs(user_id)"); } catch (e) { /* exists */ }
try { db.exec("CREATE INDEX IF NOT EXISTS idx_bio_history_user ON bio_history(user_id)"); } catch (e) { /* exists */ }

// ===================== MIGRATIONS =====================

// --- Migrate programs table ---
const programMigrations = [
  "ALTER TABLE programs ADD COLUMN forked_from TEXT",
];
for (const sql of programMigrations) {
  try { db.exec(sql); } catch (e) { /* column already exists */ }
}

// --- Migrate workouts table ---
const workoutMigrations = [
  "ALTER TABLE workouts ADD COLUMN finished_at TEXT",
];
for (const sql of workoutMigrations) {
  try { db.exec(sql); } catch (e) { /* column already exists */ }
}

// --- Migrate profiles table ---
const profileMigrations = [
  "ALTER TABLE profiles ADD COLUMN intensity_scale TEXT DEFAULT 'rpe'",
  "ALTER TABLE profiles ADD COLUMN onboarding_complete INTEGER DEFAULT 0",
];
for (const sql of profileMigrations) {
  try { db.exec(sql); } catch (e) { /* column already exists */ }
}

// ===================== ADMIN BOOTSTRAP =====================

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || null;

if (ADMIN_EMAIL) {
  const adminUser = db.prepare("SELECT id FROM users WHERE email = ?").get(ADMIN_EMAIL);
  if (adminUser) {
    db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(adminUser.id);
  }
}

// ===================== HELPERS =====================

/** Generate a compact unique ID (timestamp + random) */
export function genId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
}

/** Track an analytics event for a user */
const trackEventStmt = db.prepare("INSERT INTO analytics_events (user_id, event, meta) VALUES (?, ?, ?)");
export function trackEvent(userId, event, meta = null) {
  try {
    trackEventStmt.run(userId, event, meta ? JSON.stringify(meta) : null);
  } catch (e) {
    console.error("Analytics tracking error:", e.message);
  }
}

// Export DB_PATH for startup banner
export { DB_PATH };
export default db;

// ═══════════════════════════════════════════════════════════════
//  TALOS — Database Factory
//
//  Single entry point for database access. Picks the correct
//  adapter based on environment variables:
//
//    DATABASE_URL  → PostgreSQL (takes priority)
//    DATABASE_PATH → SQLite (fallback, default: "talos.db")
//
//  Usage:
//    import { createDb, genId, trackEvent } from "./db/index.js";
//    const db = await createDb();
//    const user = await db.get("SELECT * FROM users WHERE id = $1", [id]);
//
//  All queries use $1, $2, $3 placeholder syntax regardless of
//  backend. The SQLite adapter converts these to ? automatically.
// ═══════════════════════════════════════════════════════════════

import { initSchema, bootstrapAdmin } from "./schema.js";

/**
 * Create and initialize a database connection.
 * Automatically selects PostgreSQL or SQLite based on env vars.
 *
 * @returns {Promise<object>} Initialized database adapter
 */
export async function createDb() {
  let db;

  if (process.env.DATABASE_URL) {
    // ── PostgreSQL ──
    const { createPostgresAdapter } = await import("./postgres.js");
    db = createPostgresAdapter(process.env.DATABASE_URL);
    console.log("[DB] Using PostgreSQL");
  } else {
    // ── SQLite (default) ──
    const { createSqliteAdapter } = await import("./sqlite.js");
    const dbPath = process.env.DATABASE_PATH || "talos.db";
    db = createSqliteAdapter(dbPath);
    console.log(`[DB] Using SQLite at ${dbPath}`);
  }

  // Initialize schema and run migrations
  await initSchema(db);
  await bootstrapAdmin(db);

  return db;
}

// ===================== SHARED HELPERS =====================

/**
 * Generate a compact unique ID (timestamp base36 + random).
 * Used for all entity IDs (users, workouts, programs, etc.)
 * @returns {string}
 */
export function genId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
}

/**
 * Track an analytics event for a user.
 * Requires a db instance — call after createDb().
 *
 * @param {object} db - Database adapter
 * @param {string} userId - User ID
 * @param {string} event - Event name
 * @param {object|null} meta - Optional metadata object
 */
export async function trackEvent(db, userId, event, meta = null) {
  try {
    await db.run(
      "INSERT INTO analytics_events (user_id, event, meta) VALUES ($1, $2, $3)",
      [userId, event, meta ? JSON.stringify(meta) : null]
    );
  } catch (e) {
    console.error("[Analytics] Tracking error:", e.message);
  }
}

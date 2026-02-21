// ═══════════════════════════════════════════════════════════════
//  TALOS — Database Module (v2 — Abstraction Layer)
//
//  Drop-in replacement for the original server/db.js.
//  Uses the db/ abstraction layer to support both SQLite and
//  PostgreSQL via the same async interface.
//
//  Env vars:
//    DATABASE_URL  → PostgreSQL (takes priority)
//    DATABASE_PATH → SQLite (fallback, default: "talos.db")
// ═══════════════════════════════════════════════════════════════

import { createDb, genId, trackEvent as _trackEvent } from "./db/index.js";

let _db = null;

/**
 * Initialize and return the database adapter.
 * Call once at startup, before mounting routes.
 * @returns {Promise<object>} The database adapter
 */
export async function initDatabase() {
  if (_db) return _db;
  _db = await createDb();
  return _db;
}

/**
 * Get the current database adapter.
 * Throws if initDatabase() hasn't been called yet.
 * @returns {object}
 */
export function getDb() {
  if (!_db) throw new Error("Database not initialized. Call initDatabase() first.");
  return _db;
}

// Re-export helpers
export { genId };

/**
 * Track an analytics event (fire-and-forget safe).
 * @param {string} userId
 * @param {string} event
 * @param {object|null} meta
 */
export async function trackEvent(userId, event, meta = null) {
  if (!_db) {
    console.error("[Analytics] Cannot track — database not initialized");
    return;
  }
  return _trackEvent(_db, userId, event, meta);
}

/**
 * Reset and optionally inject a database instance (testing only).
 * @param {object|null} testDb - Database adapter to use, or null to clear
 */
export function _resetForTesting(testDb = null) {
  _db = testDb;
}

// DB_PATH for startup banner
export const DB_PATH = process.env.DATABASE_URL
  ? "(PostgreSQL)"
  : (process.env.DATABASE_PATH || "talos.db");

// ═══════════════════════════════════════════════════════════════
//  TALOS — SQLite Database Adapter
//
//  Wraps better-sqlite3 (synchronous) in the same async interface
//  that the PostgreSQL adapter uses, so route handlers work with
//  either backend without changes.
//
//  Handles: $1/$2/$3 → ? placeholder conversion automatically.
// ═══════════════════════════════════════════════════════════════

import Database from "better-sqlite3";
import { mkdirSync } from "fs";
import { dirname } from "path";

/**
 * Convert PostgreSQL-style $1, $2, $3 placeholders to SQLite ? placeholders.
 * This lets all application code use $N style consistently.
 */
function convertPlaceholders(sql) {
  return sql.replace(/\$\d+/g, "?");
}

/**
 * Create a SQLite database adapter with async interface.
 * @param {string} dbPath - Path to SQLite database file
 * @returns {object} Database adapter with get/all/run/exec/close methods
 */
export function createSqliteAdapter(dbPath) {
  // Ensure directory exists (Railway persistent volumes, etc.)
  try {
    mkdirSync(dirname(dbPath), { recursive: true });
  } catch (e) {
    // dirname(".") = "." — mkdirSync throws on existing dirs in some edge cases
  }

  const db = Database(dbPath, {
    verbose: process.env.NODE_ENV === "development" ? console.log : undefined,
  });

  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  return {
    type: "sqlite",

    /**
     * Fetch a single row.
     * @param {string} sql - SQL query with $1, $2 placeholders
     * @param {Array} params - Parameter values
     * @returns {Promise<object|undefined>}
     */
    async get(sql, params = []) {
      return db.prepare(convertPlaceholders(sql)).get(...params);
    },

    /**
     * Fetch all matching rows.
     * @param {string} sql - SQL query with $1, $2 placeholders
     * @param {Array} params - Parameter values
     * @returns {Promise<Array>}
     */
    async all(sql, params = []) {
      return db.prepare(convertPlaceholders(sql)).all(...params);
    },

    /**
     * Execute a write query (INSERT, UPDATE, DELETE).
     * @param {string} sql - SQL query with $1, $2 placeholders
     * @param {Array} params - Parameter values
     * @returns {Promise<{changes: number, lastInsertRowid: number}>}
     */
    async run(sql, params = []) {
      const result = db.prepare(convertPlaceholders(sql)).run(...params);
      return {
        changes: result.changes,
        lastInsertRowid: result.lastInsertRowid,
        rowCount: result.changes, // PG-compatible alias
      };
    },

    /**
     * Execute raw SQL (schema creation, migrations, etc.)
     * @param {string} sql - Raw SQL string
     * @returns {Promise<void>}
     */
    async exec(sql) {
      return db.exec(sql);
    },

    /**
     * Close the database connection.
     * @returns {Promise<void>}
     */
    async close() {
      return db.close();
    },

    /** Expose raw better-sqlite3 instance for edge cases (e.g., backup) */
    get raw() {
      return db;
    },
  };
}

// ═══════════════════════════════════════════════════════════════
//  TALOS — sql.js Test Adapter
//
//  Pure WASM SQLite adapter for testing. Same async interface as
//  the production SQLite and PostgreSQL adapters, but requires
//  no native compilation (runs anywhere Node runs).
//
//  Usage (tests only):
//    import { createSqljsAdapter } from "./server/db/sqljs.js";
//    const db = await createSqljsAdapter();  // in-memory
// ═══════════════════════════════════════════════════════════════

import initSqlJs from "sql.js";

/**
 * Convert PostgreSQL-style $1, $2, $3 placeholders to SQLite ? placeholders.
 */
function convertPlaceholders(sql) {
  return sql.replace(/\$\d+/g, "?");
}

/**
 * Convert sql.js result format to row objects.
 * sql.js returns { columns: [...], values: [[...], ...] }
 * We need [{ col: val }, ...]
 */
function toRows(result) {
  if (!result || result.length === 0) return [];
  const { columns, values } = result[0];
  return values.map(row => {
    const obj = {};
    columns.forEach((col, i) => { obj[col] = row[i]; });
    return obj;
  });
}

/**
 * Create an in-memory sql.js database adapter for testing.
 * @returns {Promise<object>} Database adapter with get/all/run/exec/close methods
 */
export async function createSqljsAdapter() {
  const SQL = await initSqlJs();
  const db = new SQL.Database();

  // Enable foreign keys
  db.run("PRAGMA foreign_keys = ON");

  return {
    type: "sqlite",

    async get(sql, params = []) {
      const converted = convertPlaceholders(sql);
      const stmt = db.prepare(converted);
      stmt.bind(params);
      if (stmt.step()) {
        const cols = stmt.getColumnNames();
        const vals = stmt.get();
        stmt.free();
        const obj = {};
        cols.forEach((col, i) => { obj[col] = vals[i]; });
        return obj;
      }
      stmt.free();
      return undefined;
    },

    async all(sql, params = []) {
      const converted = convertPlaceholders(sql);
      const stmt = db.prepare(converted);
      stmt.bind(params);
      const rows = [];
      while (stmt.step()) {
        const cols = stmt.getColumnNames();
        const vals = stmt.get();
        const obj = {};
        cols.forEach((col, i) => { obj[col] = vals[i]; });
        rows.push(obj);
      }
      stmt.free();
      return rows;
    },

    async run(sql, params = []) {
      const converted = convertPlaceholders(sql);
      db.run(converted, params);
      const changes = db.getRowsModified();
      return { changes, rowCount: changes, lastInsertRowid: 0 };
    },

    async exec(sql) {
      db.exec(sql);
    },

    async close() {
      db.close();
    },

    get raw() {
      return db;
    },
  };
}

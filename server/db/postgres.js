// ═══════════════════════════════════════════════════════════════
//  TALOS — PostgreSQL Database Adapter
//
//  Wraps node-postgres (pg) Pool in the same async interface
//  that the SQLite adapter uses. Route handlers work identically
//  with either backend.
//
//  Uses $1, $2, $3 placeholders natively (PostgreSQL standard).
// ═══════════════════════════════════════════════════════════════

import pg from "pg";
const { Pool } = pg;

/**
 * Create a PostgreSQL database adapter with async interface.
 * @param {string} connectionString - PostgreSQL connection URL
 * @returns {object} Database adapter with get/all/run/exec/close methods
 */
export function createPostgresAdapter(connectionString) {
  const pool = new Pool({
    connectionString,
    // Railway PG uses SSL in production
    ssl: connectionString.includes("localhost")
      ? false
      : { rejectUnauthorized: false },
    max: 20,                  // connection pool size
    idleTimeoutMillis: 30000, // close idle connections after 30s
    connectionTimeoutMillis: 5000,
  });

  // Log pool errors (don't crash the process)
  pool.on("error", (err) => {
    console.error("[PG Pool] Unexpected error on idle client:", err.message);
  });

  return {
    type: "postgres",

    /**
     * Fetch a single row.
     * @param {string} sql - SQL query with $1, $2 placeholders
     * @param {Array} params - Parameter values
     * @returns {Promise<object|undefined>}
     */
    async get(sql, params = []) {
      const { rows } = await pool.query(sql, params);
      return rows[0] || undefined;
    },

    /**
     * Fetch all matching rows.
     * @param {string} sql - SQL query with $1, $2 placeholders
     * @param {Array} params - Parameter values
     * @returns {Promise<Array>}
     */
    async all(sql, params = []) {
      const { rows } = await pool.query(sql, params);
      return rows;
    },

    /**
     * Execute a write query (INSERT, UPDATE, DELETE).
     * @param {string} sql - SQL query with $1, $2 placeholders
     * @param {Array} params - Parameter values
     * @returns {Promise<{changes: number, rowCount: number}>}
     */
    async run(sql, params = []) {
      const result = await pool.query(sql, params);
      return {
        changes: result.rowCount,     // SQLite-compatible alias
        rowCount: result.rowCount,
        lastInsertRowid: null,        // PG doesn't have this; use RETURNING
      };
    },

    /**
     * Execute raw SQL (schema creation, migrations, etc.)
     * Can handle multiple statements separated by semicolons.
     * @param {string} sql - Raw SQL string
     * @returns {Promise<void>}
     */
    async exec(sql) {
      await pool.query(sql);
    },

    /**
     * Execute a transaction — runs callback with a dedicated client.
     * Automatically commits on success, rolls back on error.
     * @param {Function} fn - async function receiving (client) with query method
     * @returns {Promise<*>} Return value of fn
     */
    async transaction(fn) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const result = await fn({
          async get(sql, params = []) {
            const { rows } = await client.query(sql, params);
            return rows[0] || undefined;
          },
          async all(sql, params = []) {
            const { rows } = await client.query(sql, params);
            return rows;
          },
          async run(sql, params = []) {
            const res = await client.query(sql, params);
            return { changes: res.rowCount, rowCount: res.rowCount };
          },
          async exec(sql) {
            await client.query(sql);
          },
        });
        await client.query("COMMIT");
        return result;
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }
    },

    /**
     * Close all connections in the pool.
     * @returns {Promise<void>}
     */
    async close() {
      await pool.end();
    },

    /** Expose raw pg Pool for edge cases */
    get raw() {
      return pool;
    },
  };
}

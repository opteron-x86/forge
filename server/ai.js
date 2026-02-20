// ═══════════════════════════════════════════════════════════════
//  TALOS — AI Provider Module
//  Extracted from server.js monolith (Phase 2 audit, commit 7e055db)
//  + PostgreSQL migration: async database layer
//
//  Handles: AI provider initialization, config persistence,
//  and exercise library indexing for AI context.
//
//  NOTE: initAI() must be called after initDatabase() since
//  loadAIConfig reads from the database.
// ═══════════════════════════════════════════════════════════════

import { createProvider, resolveConfig, defaultModelFor, PROVIDERS } from "../ai-provider.js";
import { EXERCISES } from "../src/lib/exercises.js";
import { getDb } from "./db.js";

// ===================== EXERCISE INDEX =====================

/** All built-in exercise names */
export const exerciseNames = EXERCISES.map(e => e.name);

/** Exercises grouped by muscle group (for AI context) */
export const exercisesByMuscle = {};
for (const ex of EXERCISES) {
  if (!exercisesByMuscle[ex.muscle]) exercisesByMuscle[ex.muscle] = [];
  exercisesByMuscle[ex.muscle].push(ex.name);
}

// ===================== AI CONFIG =====================

/** Load AI config from the database */
export async function loadAIConfig() {
  const db = getDb();
  const rows = await db.all("SELECT key, value FROM ai_config");
  const config = {};
  for (const row of rows) config[row.key] = row.value;
  return config;
}

/** Initialize the AI provider from DB config + env vars */
async function initProvider() {
  const dbSettings = await loadAIConfig();
  const config = resolveConfig(dbSettings, process.env);
  if (!config) return null;
  try {
    return createProvider(config);
  } catch (e) {
    console.error("AI provider init error:", e.message);
    return null;
  }
}

// ===================== MUTABLE STATE =====================

// The AI provider is a mutable singleton — it can be reconfigured
// at runtime via the admin AI config endpoint.
// Initialized via initAI() after database is ready.
let aiProvider = null;

/**
 * Initialize the AI provider. Must be called after initDatabase().
 * Called once at startup from server.js.
 */
export async function initAI() {
  aiProvider = await initProvider();
  return aiProvider;
}

/**
 * Get the current AI provider instance.
 * @returns {object|null}
 */
export function getAIProvider() {
  return aiProvider;
}

/**
 * Reinitialize the AI provider (called after config changes).
 * Returns the new provider instance (or null).
 */
export async function reinitProvider() {
  aiProvider = await initProvider();
  return aiProvider;
}

// Re-export for route modules that need provider metadata
export { PROVIDERS, defaultModelFor, resolveConfig };

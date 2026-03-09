// ═══════════════════════════════════════════════════════════════
//  TALOS — Tiered AI Model Routing (OpenRouter)
//
//  Maps (user tier, AI feature) → specific OpenRouter model.
//
//  Model assignments are stored in the database (ai_model_routing)
//  and configurable from the admin panel. Defaults are provided
//  for all features so the system works out of the box.
//
//  Free tier:  Cheaper/faster models (Gemini Flash, DeepSeek, etc.)
//  Pro tier:   Premium models (Claude Sonnet, GPT-4.1, Gemini Pro)
// ═══════════════════════════════════════════════════════════════

import { getDb } from "./db.js";

// ─── Feature Definitions ────────────────────────────────────────

export const AI_FEATURES = {
  chat:          { label: "Coach Chat",        freeTier: true  },
  analyze:       { label: "Workout Review",    freeTier: true  },
  weekly:        { label: "Weekly Report",     freeTier: true  },
  substitute:    { label: "Exercise Swap",     freeTier: true  },
  program:       { label: "Program Builder",   freeTier: false },
  deep_analysis: { label: "Deep Analysis",     freeTier: false },
  pre_workout:   { label: "Pre-Workout",       freeTier: false },
};

// ─── Default Model Assignments ──────────────────────────────────
// Used when no DB override exists. Sensible defaults for cost/quality.

const DEFAULT_MODELS = {
  chat:          { free: "google/gemini-2.5-flash",  pro: "anthropic/claude-sonnet-4" },
  analyze:       { free: "google/gemini-2.5-flash",  pro: "anthropic/claude-sonnet-4" },
  weekly:        { free: "google/gemini-2.5-flash",  pro: "anthropic/claude-sonnet-4" },
  substitute:    { free: "google/gemini-2.5-flash",  pro: "google/gemini-2.5-flash" },
  program:       { free: null,                        pro: "anthropic/claude-sonnet-4" },
  deep_analysis: { free: null,                        pro: "anthropic/claude-sonnet-4" },
  pre_workout:   { free: null,                        pro: "google/gemini-2.5-flash" },
};

// ─── In-Memory Cache ────────────────────────────────────────────
// Loaded from DB at startup and refreshed on admin save.

let _modelRouting = {};

/**
 * Load model routing from the database into memory.
 * Called at startup and after admin config changes.
 */
export async function loadModelRouting() {
  try {
    const db = getDb();
    const rows = await db.all("SELECT feature, tier, model FROM ai_model_routing");
    _modelRouting = {};
    for (const row of rows) {
      if (!_modelRouting[row.feature]) _modelRouting[row.feature] = {};
      _modelRouting[row.feature][row.tier] = row.model;
    }
    console.log(`[AI-Tier] Loaded ${rows.length} model routing rules from DB`);
  } catch (e) {
    console.warn("[AI-Tier] Could not load routing (table may not exist yet):", e.message);
    _modelRouting = {};
  }
}

/**
 * Save a model routing rule to the database and refresh cache.
 */
export async function saveModelRoute(feature, tier, model) {
  const db = getDb();
  await db.run(
    `INSERT INTO ai_model_routing (feature, tier, model)
     VALUES ($1, $2, $3)
     ON CONFLICT (feature, tier) DO UPDATE SET model = EXCLUDED.model`,
    [feature, tier, model]
  );
  // Refresh cache
  if (!_modelRouting[feature]) _modelRouting[feature] = {};
  _modelRouting[feature][tier] = model;
}

/**
 * Save multiple model routing rules at once.
 * @param {Array<{feature, tier, model}>} routes
 */
export async function saveModelRoutes(routes) {
  const db = getDb();
  for (const { feature, tier, model } of routes) {
    await db.run(
      `INSERT INTO ai_model_routing (feature, tier, model)
       VALUES ($1, $2, $3)
       ON CONFLICT (feature, tier) DO UPDATE SET model = EXCLUDED.model`,
      [feature, tier, model]
    );
  }
  await loadModelRouting(); // Full refresh
}

// ─── Model Resolution ───────────────────────────────────────────

/**
 * Get the OpenRouter model ID for a given feature and user tier.
 *
 * Resolution order: DB override → default → null (blocked)
 *
 * @param {string} feature - Feature key from AI_FEATURES
 * @param {string} tier - User tier ("free" or "pro")
 * @returns {string|null} OpenRouter model ID or null
 */
export function getModelForFeature(feature, tier) {
  // DB override first
  const dbModel = _modelRouting[feature]?.[tier];
  if (dbModel) return dbModel;

  // Fall back to defaults
  return DEFAULT_MODELS[feature]?.[tier] || null;
}

/**
 * Resolve the model for a request, checking tier access and feature availability.
 *
 * @param {string} tier - User tier
 * @param {string} feature - Feature key
 * @returns {{ model: string|null, blocked: boolean, reason: string|null }}
 */
export function resolveModel(tier, feature) {
  const featureConfig = AI_FEATURES[feature];
  if (!featureConfig) {
    return { model: null, blocked: true, reason: "Unknown AI feature" };
  }

  // Free tier — check if feature is available
  if (tier !== "pro" && !featureConfig.freeTier) {
    return {
      model: null,
      blocked: true,
      reason: `${featureConfig.label} requires a Pro subscription`,
    };
  }

  const model = getModelForFeature(feature, tier);
  if (!model) {
    return { model: null, blocked: false, reason: "No model configured for this feature" };
  }

  return { model, blocked: false, reason: null };
}

// ─── Rate Limit Config ──────────────────────────────────────────

export const TIER_LIMITS = {
  free: {
    daily:   parseInt(process.env.AI_FREE_DAILY_LIMIT)   || 15,
    monthly: parseInt(process.env.AI_FREE_MONTHLY_LIMIT) || 200,
  },
  pro: {
    daily:   parseInt(process.env.AI_PRO_DAILY_LIMIT)    || 50,
    monthly: parseInt(process.env.AI_PRO_MONTHLY_LIMIT)  || 500,
  },
};

export function getLimitsForTier(tier) {
  return TIER_LIMITS[tier] || TIER_LIMITS.free;
}

// ─── Tier Info (for API responses) ──────────────────────────────

/**
 * Build a tier info object for the frontend.
 * Includes per-feature model assignments for admin visibility.
 */
export function getTierInfo(tier) {
  const limits = getLimitsForTier(tier);
  const features = {};
  for (const [key, config] of Object.entries(AI_FEATURES)) {
    features[key] = {
      label: config.label,
      available: tier === "pro" || config.freeTier,
      model: getModelForFeature(key, tier),
    };
  }

  return { tier, limits, features };
}

/**
 * Get the full model routing table for admin display.
 * Returns all features with their free and pro model assignments.
 */
export function getFullRoutingTable() {
  const table = {};
  for (const [feature, config] of Object.entries(AI_FEATURES)) {
    table[feature] = {
      label: config.label,
      freeTier: config.freeTier,
      freeModel: getModelForFeature(feature, "free"),
      proModel: getModelForFeature(feature, "pro"),
    };
  }
  return table;
}

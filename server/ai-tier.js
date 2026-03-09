// ═══════════════════════════════════════════════════════════════
//  TALOS — Tiered AI Model Routing (OpenRouter)
//
//  Maps (user tier, AI feature) → specific OpenRouter model.
//
//  Three things are admin-configurable from the dashboard:
//    1. Model routing:  which model serves each feature × tier
//    2. Feature access: which features are available on free tier
//    3. Rate limits:    daily/monthly caps per tier
//
//  All config is persisted in the ai_config table (key/value)
//  and the ai_model_routing table (feature/tier/model).
// ═══════════════════════════════════════════════════════════════

import { getDb } from "./db.js";

// ─── Feature Definitions (defaults) ─────────────────────────────
// freeTier can be overridden per-feature from the admin panel.

const DEFAULT_FEATURES = {
  chat:          { label: "Coach Chat",        freeTier: true  },
  analyze:       { label: "Workout Review",    freeTier: true  },
  weekly:        { label: "Weekly Report",     freeTier: true  },
  substitute:    { label: "Exercise Swap",     freeTier: true  },
  program:       { label: "Program Builder",   freeTier: false },
  deep_analysis: { label: "Deep Analysis",     freeTier: false },
  pre_workout:   { label: "Pre-Workout",       freeTier: false },
};

// ─── Default Model Assignments ──────────────────────────────────

const DEFAULT_MODELS = {
  chat:          { free: "google/gemini-2.5-flash",  pro: "anthropic/claude-sonnet-4" },
  analyze:       { free: "google/gemini-2.5-flash",  pro: "anthropic/claude-sonnet-4" },
  weekly:        { free: "google/gemini-2.5-flash",  pro: "anthropic/claude-sonnet-4" },
  substitute:    { free: "google/gemini-2.5-flash",  pro: "google/gemini-2.5-flash" },
  program:       { free: null,                        pro: "anthropic/claude-sonnet-4" },
  deep_analysis: { free: null,                        pro: "anthropic/claude-sonnet-4" },
  pre_workout:   { free: null,                        pro: "google/gemini-2.5-flash" },
};

// ─── Default Rate Limits ────────────────────────────────────────

const DEFAULT_LIMITS = {
  free: { daily: 15, monthly: 200 },
  pro:  { daily: 50, monthly: 500 },
};

// ─── In-Memory State (loaded from DB at startup) ────────────────

let _modelRouting = {};
let _featureOverrides = {};   // { feature: { freeTier: bool } }
let _rateLimits = null;       // null = use defaults

// ─── Load All Config ────────────────────────────────────────────

/**
 * Load model routing, feature overrides, and rate limits from DB.
 * Called at startup and after admin saves.
 */
export async function loadModelRouting() {
  const db = getDb();

  // Model routing
  try {
    const rows = await db.all("SELECT feature, tier, model FROM ai_model_routing");
    _modelRouting = {};
    for (const row of rows) {
      if (!_modelRouting[row.feature]) _modelRouting[row.feature] = {};
      _modelRouting[row.feature][row.tier] = row.model;
    }
    console.log(`[AI-Tier] Loaded ${rows.length} model routing rules`);
  } catch (e) {
    console.warn("[AI-Tier] Could not load routing:", e.message);
    _modelRouting = {};
  }

  // Feature overrides + rate limits from ai_config
  try {
    const rows = await db.all("SELECT key, value FROM ai_config WHERE key LIKE 'feature_%' OR key LIKE 'limit_%'");
    _featureOverrides = {};
    _rateLimits = null;
    const limits = {};
    for (const row of rows) {
      if (row.key.startsWith("feature_")) {
        const feature = row.key.replace("feature_", "");
        _featureOverrides[feature] = { freeTier: row.value === "true" };
      } else if (row.key.startsWith("limit_")) {
        const [, tier, period] = row.key.split("_"); // limit_free_daily, limit_pro_monthly
        if (!limits[tier]) limits[tier] = {};
        limits[tier][period] = parseInt(row.value) || DEFAULT_LIMITS[tier]?.[period] || 0;
      }
    }
    if (Object.keys(limits).length > 0) {
      _rateLimits = {
        free: { daily: limits.free?.daily ?? DEFAULT_LIMITS.free.daily, monthly: limits.free?.monthly ?? DEFAULT_LIMITS.free.monthly },
        pro:  { daily: limits.pro?.daily ?? DEFAULT_LIMITS.pro.daily, monthly: limits.pro?.monthly ?? DEFAULT_LIMITS.pro.monthly },
      };
    }
  } catch (e) {
    console.warn("[AI-Tier] Could not load feature/limit config:", e.message);
  }
}

// ─── Feature Access ─────────────────────────────────────────────

/** Get merged feature config (defaults + DB overrides) */
function getFeatureConfig(feature) {
  const base = DEFAULT_FEATURES[feature];
  if (!base) return null;
  const override = _featureOverrides[feature];
  return {
    label: base.label,
    freeTier: override ? override.freeTier : base.freeTier,
  };
}

/** Exported for resolveModel and route guards */
export function getAIFeatures() {
  const features = {};
  for (const [key, def] of Object.entries(DEFAULT_FEATURES)) {
    features[key] = getFeatureConfig(key);
  }
  return features;
}

/** Save free-tier feature toggles */
export async function saveFeatureAccess(toggles) {
  const db = getDb();
  for (const { feature, freeTier } of toggles) {
    if (!DEFAULT_FEATURES[feature]) continue;
    await db.run(
      "INSERT INTO ai_config (key, value) VALUES ($1, $2) ON CONFLICT(key) DO UPDATE SET value = EXCLUDED.value",
      [`feature_${feature}`, String(freeTier)]
    );
  }
  await loadModelRouting();
}

// ─── Model Routing ──────────────────────────────────────────────

export function getModelForFeature(feature, tier) {
  const dbModel = _modelRouting[feature]?.[tier];
  if (dbModel) return dbModel;
  return DEFAULT_MODELS[feature]?.[tier] || null;
}

export function resolveModel(tier, feature) {
  const featureConfig = getFeatureConfig(feature);
  if (!featureConfig) {
    return { model: null, blocked: true, reason: "Unknown AI feature" };
  }

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
  await loadModelRouting();
}

// ─── Rate Limits ────────────────────────────────────────────────

export function getLimitsForTier(tier) {
  if (_rateLimits) return _rateLimits[tier] || _rateLimits.free || DEFAULT_LIMITS.free;
  // Env var fallback for backward compat
  if (tier === "pro") {
    return {
      daily:   parseInt(process.env.AI_PRO_DAILY_LIMIT)    || DEFAULT_LIMITS.pro.daily,
      monthly: parseInt(process.env.AI_PRO_MONTHLY_LIMIT)  || DEFAULT_LIMITS.pro.monthly,
    };
  }
  return {
    daily:   parseInt(process.env.AI_FREE_DAILY_LIMIT)   || DEFAULT_LIMITS.free.daily,
    monthly: parseInt(process.env.AI_FREE_MONTHLY_LIMIT) || DEFAULT_LIMITS.free.monthly,
  };
}

export function getAllLimits() {
  return {
    free: getLimitsForTier("free"),
    pro:  getLimitsForTier("pro"),
  };
}

export async function saveRateLimits(limits) {
  const db = getDb();
  for (const tier of ["free", "pro"]) {
    if (!limits[tier]) continue;
    for (const period of ["daily", "monthly"]) {
      if (limits[tier][period] === undefined) continue;
      await db.run(
        "INSERT INTO ai_config (key, value) VALUES ($1, $2) ON CONFLICT(key) DO UPDATE SET value = EXCLUDED.value",
        [`limit_${tier}_${period}`, String(limits[tier][period])]
      );
    }
  }
  await loadModelRouting();
}

// ─── API Response Builders ──────────────────────────────────────

export function getTierInfo(tier) {
  const limits = getLimitsForTier(tier);
  const features = {};
  for (const [key] of Object.entries(DEFAULT_FEATURES)) {
    const cfg = getFeatureConfig(key);
    features[key] = {
      label: cfg.label,
      available: tier === "pro" || cfg.freeTier,
      model: getModelForFeature(key, tier),
    };
  }
  return { tier, limits, features };
}

export function getFullRoutingTable() {
  const table = {};
  for (const [feature] of Object.entries(DEFAULT_FEATURES)) {
    const cfg = getFeatureConfig(feature);
    table[feature] = {
      label: cfg.label,
      freeTier: cfg.freeTier,
      freeModel: getModelForFeature(feature, "free"),
      proModel: getModelForFeature(feature, "pro"),
    };
  }
  return table;
}

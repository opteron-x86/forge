// ═══════════════════════════════════════════════════════════════
//  TALOS — Tiered AI Provider Resolution
//
//  Maps (user tier, AI feature) → provider instance + model.
//
//  Free tier:  Gemini (via GEMINI_API_KEY) — chat, review, weekly, substitute
//  Pro tier:   Admin-configured provider — all features including
//              program builder and deep analysis
//
//  The free provider is separate from the admin-configured provider
//  so that free-tier API costs stay on the cheap Gemini key while
//  Pro users get the full Anthropic experience.
// ═══════════════════════════════════════════════════════════════

import { createProvider } from "../ai-provider.js";

// ─── Feature Definitions ────────────────────────────────────────
// Each AI feature declares whether it's available on the free tier
// and what model to use for free users.

export const AI_FEATURES = {
  chat:          { label: "Coach Chat",        freeTier: true  },
  analyze:       { label: "Workout Review",    freeTier: true  },
  weekly:        { label: "Weekly Report",     freeTier: true  },
  substitute:    { label: "Exercise Swap",     freeTier: true  },
  program:       { label: "Program Builder",   freeTier: false },
  deep_analysis: { label: "Deep Analysis",     freeTier: false },
};

// ─── Free Provider (Gemini) ─────────────────────────────────────

let _freeProvider = null;

const FREE_MODEL = process.env.GEMINI_FREE_MODEL || "gemini-2.0-flash";

/**
 * Initialize the free-tier Gemini provider.
 * Call once at startup alongside the pro provider.
 * @returns {object|null} Provider instance or null if no key configured
 */
export function initFreeProvider() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log("[AI-Tier] No GEMINI_API_KEY — free tier AI disabled");
    _freeProvider = null;
    return null;
  }

  try {
    _freeProvider = createProvider({
      provider: "gemini",
      apiKey,
      model: FREE_MODEL,
    });
    console.log(`[AI-Tier] Free tier: Gemini (${FREE_MODEL})`);
    return _freeProvider;
  } catch (e) {
    console.error("[AI-Tier] Free provider init error:", e.message);
    _freeProvider = null;
    return null;
  }
}

/**
 * Get the free-tier provider instance.
 * @returns {object|null}
 */
export function getFreeProvider() {
  return _freeProvider;
}

// ─── Provider Resolution ────────────────────────────────────────

/**
 * Resolve the AI provider for a given user tier and feature.
 *
 * @param {string} tier - User tier ("free" or "pro")
 * @param {string} feature - Feature key from AI_FEATURES
 * @param {object|null} proProvider - The admin-configured pro provider
 * @returns {{ provider: object|null, blocked: boolean, reason: string|null }}
 */
export function resolveProvider(tier, feature, proProvider) {
  const featureConfig = AI_FEATURES[feature];
  if (!featureConfig) {
    return { provider: null, blocked: true, reason: "Unknown AI feature" };
  }

  // Pro users always get the admin-configured provider
  if (tier === "pro") {
    if (!proProvider) {
      return { provider: null, blocked: false, reason: "AI provider not configured" };
    }
    return { provider: proProvider, blocked: false, reason: null };
  }

  // Free tier — check if feature is available
  if (!featureConfig.freeTier) {
    return {
      provider: null,
      blocked: true,
      reason: `${featureConfig.label} requires a Pro subscription`,
    };
  }

  // Free tier, feature allowed — use Gemini
  if (!_freeProvider) {
    return { provider: null, blocked: false, reason: "Free-tier AI not configured" };
  }

  return { provider: _freeProvider, blocked: false, reason: null };
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

/**
 * Get rate limits for a user's tier.
 * @param {string} tier
 * @returns {{ daily: number, monthly: number }}
 */
export function getLimitsForTier(tier) {
  return TIER_LIMITS[tier] || TIER_LIMITS.free;
}

// ─── Tier Info (for API responses) ──────────────────────────────

/**
 * Build a tier info object for the frontend.
 * @param {string} tier
 * @returns {object}
 */
export function getTierInfo(tier) {
  const limits = getLimitsForTier(tier);
  const features = {};
  for (const [key, config] of Object.entries(AI_FEATURES)) {
    features[key] = {
      label: config.label,
      available: tier === "pro" || config.freeTier,
    };
  }

  return {
    tier,
    limits,
    features,
    freeProviderEnabled: !!_freeProvider,
  };
}

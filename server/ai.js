// ═══════════════════════════════════════════════════════════════
//  TALOS — AI Module (OpenRouter Gateway)
//
//  Single OpenRouter provider serves all tiers and features.
//  Model selection happens per-request based on the routing table
//  in ai-tier.js, not at the provider level.
//
//  Env vars: OPENROUTER_API_KEY (required for AI features)
//
//  NOTE: initAI() must be called after initDatabase().
// ═══════════════════════════════════════════════════════════════

import { OpenRouterProvider, OPENROUTER_MODELS } from "../ai-provider.js";
import { loadModelRouting, getFullRoutingTable } from "./ai-tier.js";

// ===================== MUTABLE STATE =====================

let _provider = null;

/**
 * Initialize the OpenRouter provider and load model routing.
 * Called once at startup from server.js after database is ready.
 */
export async function initAI() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.log("[AI] No OPENROUTER_API_KEY — AI features disabled");
    _provider = null;
  } else {
    try {
      _provider = new OpenRouterProvider(apiKey);
      console.log("[AI] OpenRouter provider initialized");
    } catch (e) {
      console.error("[AI] Provider init error:", e.message);
      _provider = null;
    }
  }

  // Load per-feature model routing from database
  await loadModelRouting();

  return _provider;
}

/**
 * Get the OpenRouter provider instance.
 * @returns {OpenRouterProvider|null}
 */
export function getAIProvider() {
  return _provider;
}

/**
 * Check if AI is available (provider exists).
 */
export function isAIEnabled() {
  return !!_provider;
}

// Re-export for route modules
export { OPENROUTER_MODELS };

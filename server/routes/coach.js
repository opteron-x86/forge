// ═══════════════════════════════════════════════════════════════
//  TALOS — Coach & AI Routes (v2 — Database-Backed Exercises)
//  POST /api/coach, POST /api/coach/program, POST /api/coach/analyze,
//  POST /api/coach/substitute, POST /api/coach/weekly,
//  POST /api/coach/analysis, GET/POST/DELETE /api/coach/messages,
//  GET/PUT /api/ai/config, GET /api/ai/status, GET /api/ai/quota
//
//  Changes from v1:
//  - Removed static imports of EXERCISES and exercisesByMuscle
//  - All exercise lookups now async via exercise-context.js
//  - AI coach gets enriched data (secondary muscles, force, level)
//  - Substitution route uses database-backed substitution map
// ═══════════════════════════════════════════════════════════════

import { Router } from "express";
import { getDb, genId, trackEvent } from "../db.js";
import {
  requireAuth, requireAdmin, requireAIQuota, requirePro, handler,
  checkAIRateLimit,
} from "../middleware.js";
import {
  getAIProvider, reinitProvider,
  loadAIConfig, resolveConfig, PROVIDERS,
} from "../ai.js";
import { resolveProvider, getTierInfo, AI_FEATURES } from "../ai-tier.js";
import {
  getExerciseContext, buildExerciseLibraryPrompt,
  getExerciseDetail, getSubstitutions,
} from "../exercise-context.js";

const router = Router();

// ===================== AI CONFIG ENDPOINTS =====================

// AI status (any authenticated user)
router.get("/ai/status", requireAuth, handler(async (req, res) => {
  res.json({ enabled: !!getAIProvider() });
}));

// AI config details (admin only)
router.get("/ai/config", requireAuth, requireAdmin, handler(async (req, res) => {
  const aiProvider = getAIProvider();
  const dbSettings = await loadAIConfig();
  const config = resolveConfig(dbSettings, process.env);
  res.json({
    provider: config?.provider || "",
    model: config?.model || "",
    baseUrl: dbSettings.baseUrl || process.env.AI_BASE_URL || "",
    hasKey: !!(config?.apiKey),
    keySource: config?.apiKey ? "environment" : "none",
    supportsTools: dbSettings.supportsTools !== "false",
    enabled: !!aiProvider,
    providerName: aiProvider?.providerName || "",
    providers: PROVIDERS,
  });
}));

router.put("/ai/config", requireAuth, requireAdmin, handler(async (req, res) => {
  const db = getDb();
  const { provider, model, baseUrl, supportsTools } = req.body;

  const upsert = async (key, value) => {
    await db.run(
      "INSERT INTO ai_config (key, value) VALUES ($1, $2) ON CONFLICT(key) DO UPDATE SET value = EXCLUDED.value",
      [key, value]
    );
  };

  if (provider !== undefined) await upsert("provider", provider);
  if (model !== undefined) await upsert("model", model);
  if (baseUrl !== undefined) await upsert("baseUrl", baseUrl);
  if (supportsTools !== undefined) await upsert("supportsTools", String(supportsTools));

  const newProvider = await reinitProvider();
  res.json({ ok: true, enabled: !!newProvider, providerName: newProvider?.providerName || "" });
}));

// AI usage quota (tier-aware)
router.get("/ai/quota", requireAuth, handler(async (req, res) => {
  const tier = req.user.tier || "free";
  const check = await checkAIRateLimit(req.user.id, tier);
  res.json({ remaining: check.remaining, dailyLimit: check.daily, monthlyLimit: check.monthly, tier });
}));

// AI tier info (features, limits, availability)
router.get("/ai/tier", requireAuth, handler(async (req, res) => {
  const tier = req.user.tier || "free";
  const info = getTierInfo(tier);
  info.proProviderEnabled = !!getAIProvider();
  res.json(info);
}));

// ===================== COACH MESSAGES (PERSISTENCE) =====================

router.get("/coach/messages", requireAuth, handler(async (req, res) => {
  const db = getDb();
  const { limit = 100 } = req.query;
  const messages = await db.all(
    "SELECT * FROM coach_messages WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2",
    [req.user.id, limit]
  );
  res.json(messages.reverse());
}));

router.post("/coach/messages", requireAuth, handler(async (req, res) => {
  const db = getDb();
  const { id, type, prompt, response } = req.body;
  if (!id) return res.status(400).json({ error: "id required" });
  await db.run(
    `INSERT INTO coach_messages (id, user_id, type, prompt, response) VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (id) DO UPDATE SET user_id = EXCLUDED.user_id, type = EXCLUDED.type, prompt = EXCLUDED.prompt, response = EXCLUDED.response`,
    [id, req.user.id, type || "chat", prompt || null, response || null]
  );
  res.json({ ok: true });
}));

router.delete("/coach/messages/:id", requireAuth, handler(async (req, res) => {
  const db = getDb();
  await db.run("DELETE FROM coach_messages WHERE id = $1 AND user_id = $2", [req.params.id, req.user.id]);
  res.json({ ok: true });
}));

router.delete("/coach/messages", requireAuth, handler(async (req, res) => {
  const db = getDb();
  await db.run("DELETE FROM coach_messages WHERE user_id = $1", [req.user.id]);
  res.json({ ok: true });
}));

// ===================== AI COACH (CHAT) =====================

/**
 * Resolve the AI provider for a request based on user tier and feature.
 * Returns the provider or sends an error response.
 * @returns {object|null} provider instance, or null if response was sent
 */
function getProviderForRequest(req, res, feature) {
  const tier = req.user?.tier || "free";
  const { provider, blocked, reason } = resolveProvider(tier, feature, getAIProvider());
  if (blocked) {
    res.status(403).json({ error: reason, upgrade: true });
    return null;
  }
  if (!provider) {
    res.status(503).json({ error: reason || "AI coach unavailable — no provider configured" });
    return null;
  }
  return provider;
}

const COACH_SYSTEM = `You are a knowledgeable, confident strength training coach with deep expertise in exercise science and program design.

YOUR PERSONALITY:
- Direct and confident — give clear recommendations, not wishy-washy "it depends" answers
- Data-driven — reference the user's actual workout history when relevant
- Encouraging but honest — celebrate progress, but flag real issues
- Concise — gym conversations should be efficient

IMPORTANT: The user's "rpe" field represents their chosen INTENSITY SCALE (specified in their profile context). If RIR (Reps In Reserve): @1 = 1 rep left (near maximal), @0 = absolute failure. If RPE: @10 = maximal effort. Always interpret values according to their scale.

YOU HAVE ACCESS TO:
- User's workout history (exercises, sets, reps, weights, RPE)
- Their profile (goals, experience level, injuries, body metrics)
- Their current program structure

KEEP RESPONSES UNDER 200 WORDS unless the user asks for detailed analysis. Use markdown formatting for clarity.`;

router.post("/coach", requireAuth, requireAIQuota, handler(async (req, res) => {
  const aiProvider = getProviderForRequest(req, res, "chat");
  if (!aiProvider) return;
  const { messages, prompt, context, history } = req.body;

  // Support both formats: { messages } or { prompt, history }
  let chatMessages = messages;
  if (!chatMessages) {
    chatMessages = [];
    if (Array.isArray(history)) {
      for (const h of history) {
        if (h.prompt) chatMessages.push({ role: "user", content: h.prompt });
        if (h.response) chatMessages.push({ role: "assistant", content: h.response });
      }
    }
    if (prompt) chatMessages.push({ role: "user", content: prompt });
  }

  if (!chatMessages || chatMessages.length === 0) {
    return res.status(400).json({ error: "No message provided" });
  }

  const systemWithContext = context ? `${COACH_SYSTEM}\n\nUSER CONTEXT:\n${context}` : COACH_SYSTEM;

  const result = await aiProvider.chat(systemWithContext, chatMessages, { maxTokens: 1000 });
  trackEvent(req.user.id, "coach_chat");
  res.json({ response: result.text });
}));

// ===================== AI PROGRAM BUILDER =====================

const PROGRAM_TOOL = {
  name: "create_program",
  description: "Create a structured workout program with named days and exercises. Use ONLY exercises from the provided library. Each exercise needs sets and rep targets.",
  input_schema: {
    type: "object",
    properties: {
      name: { type: "string", description: "Program name (e.g. 'Push/Pull/Legs', '4-Day Upper/Lower')" },
      description: { type: "string", description: "Brief program description" },
      days: {
        type: "array",
        description: "The training days in the program",
        items: {
          type: "object",
          properties: {
            label: { type: "string", description: "Day name (e.g. 'Push 1', 'Upper A', 'Leg Day')" },
            subtitle: { type: "string", description: "Optional focus note (e.g. 'Chest/Triceps Focus', 'Heavy Compounds')" },
            exercises: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string", description: "Exercise name — MUST match an exercise from the provided library exactly" },
                  defaultSets: { type: "integer", description: "Number of working sets (typically 3-5)" },
                  targetReps: { type: "string", description: "Rep target or range (e.g. '5', '8-12', '12-15')" },
                  notes: { type: "string", description: "Optional coaching notes for this exercise" },
                },
                required: ["name", "defaultSets", "targetReps"],
              },
            },
          },
          required: ["label", "exercises"],
        },
      },
    },
    required: ["name", "days"],
  },
};

router.post("/coach/program", requireAuth, requirePro("Program Builder"), requireAIQuota, handler(async (req, res) => {
  const db = getDb();
  const aiProvider = getProviderForRequest(req, res, "program");
  if (!aiProvider) return;
  const { prompt, context } = req.body;

  // Build exercise library context from database
  const exerciseLib = await buildExerciseLibraryPrompt();
  const { exerciseNames } = await getExerciseContext();

  const system = `You are an expert strength training coach creating a workout program. You MUST use the create_program tool to build the program.

CRITICAL: Only use exercise names that EXACTLY match the provided library. Do not invent exercises or modify names.

Based on the user's profile, goals, experience level, and training history, design an appropriate program.

EXERCISE LIBRARY:
${exerciseLib}`;

  const systemWithContext = context ? `${system}\n\nUSER CONTEXT:\n${context}` : system;

  const result = await aiProvider.chatWithTools(systemWithContext, [
    { role: "user", content: prompt || "Create a program based on my goals and experience." },
  ], [PROGRAM_TOOL], { maxTokens: 3000 });

  const toolCall = result.toolCalls?.find(tc => tc.name === "create_program");
  if (toolCall) {
    // Validate exercise names against the full library
    const allNames = new Set(exerciseNames);
    const program = toolCall.input;
    for (const day of program.days || []) {
      for (const ex of day.exercises || []) {
        if (!allNames.has(ex.name)) {
          ex.notes = `⚠ "${ex.name}" not in library — ${ex.notes || ""}`.trim();
        }
      }
    }
    trackEvent(req.user.id, "coach_program");
    res.json({ program, commentary: result.text || null });
  } else {
    trackEvent(req.user.id, "coach_program");
    res.json({ program: null, commentary: result.text || "Could not generate program. Try being more specific." });
  }
}));

// ===================== AI SESSION ANALYSIS =====================

router.post("/coach/analyze", requireAuth, requireAIQuota, handler(async (req, res) => {
  const db = getDb();
  const aiProvider = getProviderForRequest(req, res, "analyze");
  if (!aiProvider) return;
  const { workout, context, workout_id } = req.body;

  const system = `You are a concise strength training coach providing a post-workout session analysis. Analyze the just-completed workout and give brief, specific feedback.

IMPORTANT: The "rpe" field in set data represents the user's chosen INTENSITY SCALE, which will be specified in the user context. If the user uses RIR (Reps In Reserve), then @1 means 1 rep left in the tank (NEAR MAXIMAL), @0 means absolute failure. If RPE (Rate of Perceived Exertion), @10 means maximal effort. Always interpret intensity values according to the specified scale.

FORMAT YOUR RESPONSE IN THESE SECTIONS (skip any that aren't relevant):
**Session Summary** — One line overview (duration, volume, energy)
**PRs & Wins** — Any personal records or notable improvements
**Flags** — Any regressions, concerning patterns, or things to watch
**Next Session** — One specific, actionable recommendation for next time

Keep it tight — max 150 words total. Be encouraging but honest. Use the user's actual numbers.

COACHING INTEGRITY:
- Provide honest assessment of the workout. If the user under-performed relative to their recent history, note it constructively.
- If exercise selection in the session had issues (e.g. missing muscle groups, imbalanced volume), mention it.
- Don't be unnecessarily harsh, but don't just tell the user what they want to hear either. A good coach is honest.`;

  const result = await aiProvider.chat(system, [
    { role: "user", content: `${context}\n\nJUST COMPLETED:\n${JSON.stringify(workout, null, 2)}` },
  ], { maxTokens: 800 });

  // Persist the review if workout_id provided
  if (workout_id && result.text) {
    await db.run(
      `INSERT INTO workout_reviews (id, workout_id, user_id, review) VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET workout_id = EXCLUDED.workout_id, user_id = EXCLUDED.user_id, review = EXCLUDED.review`,
      [genId(), workout_id, req.user.id, result.text]
    );
  }

  trackEvent(req.user.id, "coach_analyze");
  res.json({ analysis: result.text });
}));

// ===================== AI SMART SUBSTITUTION =====================

const SUBSTITUTE_TOOL = {
  name: "suggest_substitutions",
  description: "Suggest 3-5 exercise substitutions ranked by suitability. Only use exercises from the provided library.",
  input_schema: {
    type: "object",
    properties: {
      substitutions: {
        type: "array",
        description: "Ranked list of substitute exercises, best first",
        items: {
          type: "object",
          properties: {
            name: { type: "string", description: "Exercise name — MUST exactly match the exercise library" },
            reason: { type: "string", description: "One-line reason this is a good substitute (e.g. 'Same movement pattern, uses cables instead')" },
            rating: { type: "integer", description: "Suitability rating 1-5 (5 = near-identical stimulus)" },
          },
          required: ["name", "reason", "rating"],
        },
      },
    },
    required: ["substitutions"],
  },
};

router.post("/coach/substitute", requireAuth, requireAIQuota, handler(async (req, res) => {
  const aiProvider = getProviderForRequest(req, res, "substitute");
  if (!aiProvider) return;
  const { exercise, reason, context } = req.body;

  // Build exercise library context from database
  const exerciseLib = await buildExerciseLibraryPrompt();
  const { exerciseNames } = await getExerciseContext();

  // Get exercise metadata from database
  const exMeta = await getExerciseDetail(exercise);
  const exInfo = exMeta
    ? `${exercise} — muscle: ${exMeta.muscle}, equipment: ${exMeta.equipment}, type: ${exMeta.type}${exMeta.secondary_muscles?.length ? `, secondary muscles: ${exMeta.secondary_muscles.join(", ")}` : ""}${exMeta.force ? `, force: ${exMeta.force}` : ""}`
    : exercise;

  // Get curated substitutions to hint to AI
  const curatedSubs = await getSubstitutions(exercise);
  const subsHint = curatedSubs.length > 0
    ? `\nKNOWN GOOD SUBSTITUTIONS (consider these first): ${curatedSubs.join(", ")}`
    : "";

  const system = `You are a strength training coach suggesting exercise substitutions during a live workout. Use the suggest_substitutions tool.

EXERCISE TO REPLACE: ${exInfo}
REASON FOR SWAP: ${reason || "Equipment unavailable or preference"}
${subsHint}

CRITICAL: Only suggest exercises that EXACTLY match names in the library below. Prioritize:
1. Same primary muscle group and movement pattern
2. Similar stimulus and loading potential
3. Equipment the user has used before (check their history)
4. Respect any injuries or limitations
5. Prefer compound over isolation if replacing a compound, and vice versa

EXERCISE LIBRARY:
${exerciseLib}`;

  const result = await aiProvider.chatWithTools(system, [
    { role: "user", content: `${context}\n\nFind substitutes for: ${exercise}` },
  ], [SUBSTITUTE_TOOL], { maxTokens: 1500 });

  const toolCall = result.toolCalls?.find(tc => tc.name === "suggest_substitutions");
  if (toolCall) {
    const allNames = new Set(exerciseNames);
    const subs = toolCall.input.substitutions?.filter(s => allNames.has(s.name)) || [];
    trackEvent(req.user.id, "coach_substitute", { exercise: exercise || null });
    res.json({ substitutions: subs, commentary: result.text || null });
  } else {
    trackEvent(req.user.id, "coach_substitute", { exercise: exercise || null });
    res.json({ substitutions: [], commentary: result.text || "Could not generate substitutions." });
  }
}));

// ===================== AI WEEKLY REPORT =====================

router.post("/coach/weekly", requireAuth, requireAIQuota, handler(async (req, res) => {
  const aiProvider = getProviderForRequest(req, res, "weekly");
  if (!aiProvider) return;
  const { context } = req.body;

  const system = `You are a strength training coach providing a concise weekly training report. Analyze the past 7 days of training data.

FORMAT YOUR RESPONSE IN THESE SECTIONS (skip any that aren't relevant):
**Week Overview** — Sessions count, total volume, average feel, consistency vs target frequency
**Volume by Muscle** — Quick breakdown of sets per muscle group this week (estimate from exercises). Flag any imbalances.
**Progression Watch** — Lifts that went up, stayed flat, or regressed vs previous weeks
**Recovery Signal** — Interpret feel ratings, sleep hours, session duration trends
**Body Composition** — Comment on weight trend if data available, relate to stated goal
**Action Items** — 2-3 specific, numbered recommendations for next week

Be data-driven. Reference actual numbers from the workout logs. Keep the whole report under 300 words.`;

  const result = await aiProvider.chat(system, [
    { role: "user", content: context },
  ], { maxTokens: 1500 });

  trackEvent(req.user.id, "coach_weekly");
  res.json({ report: result.text });
}));

// ===================== AI DEEP ANALYSIS =====================

router.post("/coach/analysis", requireAuth, requirePro("Deep Analysis"), requireAIQuota, handler(async (req, res) => {
  const aiProvider = getProviderForRequest(req, res, "deep_analysis");
  if (!aiProvider) return;
  const { context } = req.body;

  const system = `You are an expert strength training coach providing a comprehensive training analysis. This is a premium, detailed assessment — not a quick chat response.

Analyze the user's complete training history and provide a thorough report covering:

**Strength Progression**
- Track key compound lift trends (bench, squat, deadlift, OHP, row). Calculate estimated 1RMs where possible.
- Identify which lifts are progressing, stalled, or regressing.
- Compare current performance to their stated goals and experience level.

**Volume Analysis**
- Weekly sets per muscle group — is volume adequate for their goal?
- Compare actual volume to evidence-based recommendations.
- Identify underdeveloped areas or muscle groups getting disproportionate attention.

**Training Patterns**
- Frequency analysis: sessions per week, consistency, any gaps or clustering.
- Program adherence: are they following their program or deviating? Is deviation helping or hurting?
- Exercise selection quality for their stated goals.

**Recovery & Fatigue**
- Interpret feel ratings over time — trending up (adapting well) or down (accumulating fatigue)?
- Sleep data trends if available.
- Session duration trends — are workouts getting longer (junk volume?) or staying efficient?
- Any signs of overreaching: declining performance + declining feel ratings.

**Periodization Assessment**
- Are they cycling intensity/volume appropriately, or just grinding the same stimulus?
- Recommend a deload if indicators suggest one is needed.
- Suggest when to change programming phases based on progression data.

**Action Plan**
5-7 specific, prioritized recommendations for the next 2-4 weeks. Each should reference the data point that drove the recommendation. Format as numbered items with clear rationale.

IMPORTANT GUIDELINES:
- Be brutally data-driven. Every claim must reference actual numbers from the logs.
- Don't pad with generic advice. Everything should be specific to THIS user's data.
- If data is insufficient for a section, say so briefly and move on — don't fabricate analysis.
- Use their stated goal to frame all recommendations (e.g., if goal is hypertrophy, prioritize volume analysis; if strength, prioritize 1RM trends).
- Be direct and confident in your coaching voice. This is a premium analysis, not a chatbot response.`;

  const result = await aiProvider.chat(system, [
    { role: "user", content: context },
  ], { maxTokens: 4000 });

  trackEvent(req.user.id, "coach_deep_analysis");
  res.json({ report: result.text });
}));

export default router;
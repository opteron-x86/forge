// ═══════════════════════════════════════════════════════════════
//  TALOS — Coach & AI Routes
//  POST /api/coach, POST /api/coach/program, POST /api/coach/analyze,
//  POST /api/coach/substitute, POST /api/coach/weekly,
//  POST /api/coach/analysis, GET/POST/DELETE /api/coach/messages,
//  GET/PUT /api/ai/config, GET /api/ai/status, GET /api/ai/quota
// ═══════════════════════════════════════════════════════════════

import { Router } from "express";
import db from "../db.js";
import { genId, trackEvent } from "../db.js";
import {
  requireAuth, requireAdmin, requireAIQuota, handler,
  checkAIRateLimit, AI_DAILY_LIMIT, AI_MONTHLY_LIMIT,
} from "../middleware.js";
import {
  aiProvider, reinitProvider, exerciseNames, exercisesByMuscle,
  loadAIConfig, resolveConfig, PROVIDERS,
} from "../ai.js";
import { EXERCISES } from "../../src/lib/exercises.js";

const router = Router();

// ===================== AI CONFIG ENDPOINTS =====================

// AI status (any authenticated user)
router.get("/ai/status", requireAuth, handler((req, res) => {
  res.json({ enabled: !!aiProvider });
}));

// AI config details (admin only)
router.get("/ai/config", requireAuth, requireAdmin, handler((req, res) => {
  const dbSettings = loadAIConfig();
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

router.put("/ai/config", requireAuth, requireAdmin, handler((req, res) => {
  const { provider, model, baseUrl, supportsTools } = req.body;
  const upsert = db.prepare(
    "INSERT INTO ai_config (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
  );
  if (provider !== undefined) upsert.run("provider", provider);
  if (model !== undefined) upsert.run("model", model);
  if (baseUrl !== undefined) upsert.run("baseUrl", baseUrl);
  if (supportsTools !== undefined) upsert.run("supportsTools", String(supportsTools));

  const newProvider = reinitProvider();
  res.json({ ok: true, enabled: !!newProvider, providerName: newProvider?.providerName || "" });
}));

// AI usage quota
router.get("/ai/quota", requireAuth, handler((req, res) => {
  const check = checkAIRateLimit(req.user.id);
  res.json({ remaining: check.remaining, dailyLimit: AI_DAILY_LIMIT, monthlyLimit: AI_MONTHLY_LIMIT });
}));

// ===================== COACH MESSAGES (PERSISTENCE) =====================

router.get("/coach/messages", requireAuth, handler((req, res) => {
  const { limit = 100 } = req.query;
  const messages = db.prepare(
    "SELECT * FROM coach_messages WHERE user_id = ? ORDER BY created_at DESC LIMIT ?"
  ).all(req.user.id, limit).reverse();
  res.json(messages);
}));

router.post("/coach/messages", requireAuth, handler((req, res) => {
  const { id, type, prompt, response } = req.body;
  if (!id) return res.status(400).json({ error: "id required" });
  db.prepare(
    "INSERT OR REPLACE INTO coach_messages (id, user_id, type, prompt, response) VALUES (?, ?, ?, ?, ?)"
  ).run(id, req.user.id, type || "chat", prompt || null, response || null);
  res.json({ ok: true });
}));

router.delete("/coach/messages/:id", requireAuth, handler((req, res) => {
  db.prepare("DELETE FROM coach_messages WHERE id = ? AND user_id = ?").run(req.params.id, req.user.id);
  res.json({ ok: true });
}));

router.delete("/coach/messages", requireAuth, handler((req, res) => {
  db.prepare("DELETE FROM coach_messages WHERE user_id = ?").run(req.user.id);
  res.json({ ok: true });
}));

// ===================== AI COACH (CHAT) =====================

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
  if (!aiProvider) return res.status(503).json({ error: "AI coach unavailable — no provider configured" });
  const { messages, context } = req.body;

  const systemWithContext = context ? `${COACH_SYSTEM}\n\nUSER CONTEXT:\n${context}` : COACH_SYSTEM;

  const result = await aiProvider.chat(systemWithContext, messages, { maxTokens: 1000 });
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

router.post("/coach/program", requireAuth, requireAIQuota, handler(async (req, res) => {
  if (!aiProvider) return res.status(503).json({ error: "AI coach unavailable — no provider configured" });
  const { prompt, context } = req.body;

  // Build exercise library context
  const exerciseLib = Object.entries(exercisesByMuscle).map(([muscle, exs]) =>
    `${muscle.toUpperCase()}: ${exs.join(", ")}`
  ).join("\n");

  const customExs = db.prepare("SELECT name, muscle, equipment, type FROM custom_exercises").all();
  const customLib = customExs.length > 0
    ? `\nCUSTOM EXERCISES: ${customExs.map(e => `${e.name} (${e.muscle}, ${e.equipment}, ${e.type})`).join(", ")}`
    : "";

  const system = `You are an expert strength training coach creating a workout program. You MUST use the create_program tool to build the program.

CRITICAL: Only use exercise names that EXACTLY match the provided library. Do not invent exercises or modify names.

EXERCISE LIBRARY:
${exerciseLib}${customLib}

PROGRAM DESIGN PRINCIPLES:
- Consider the user's experience level, goals, injuries, and available equipment
- Place compound lifts first in each day
- Balance push/pull volume within a session and across the week
- Use appropriate rep ranges for the exercise type (compounds: 3-8, accessories: 8-15)
- Add helpful notes for exercises that need form cues or injury modifications
- Respect any injuries or limitations mentioned

EXERCISE SELECTION — AVOID REAL REDUNDANCY:
- Within a session, vary exercises by movement pattern (vertical pull vs horizontal pull, press vs fly, hip hinge vs squat pattern)
- Two exercises can target the same muscle group if they use different angles, grips, or movement planes — this is COMPLEMENTARY, not redundant
- TRUE redundancy: two exercises with near-identical mechanics in the same session (e.g. barbell row AND pendlay row, OR flat bench AND flat DB press as the first two exercises)
- When selecting exercises, mentally justify why each is included and how it differs from others in the session
- In the notes field, briefly explain the purpose of key exercises (especially when two exercises target similar muscles), e.g. "Vertical pull — lat stretch and width" or "Horizontal row — mid-back thickness"`;

  const result = await aiProvider.chatWithTools(system, [
    { role: "user", content: `${context}\n\nPROGRAM REQUEST: ${prompt}` },
  ], [PROGRAM_TOOL], { maxTokens: 4000 });

  const programCall = result.toolCalls?.find(tc => tc.name === "create_program");
  if (programCall) {
    const allNames = new Set([...exerciseNames, ...customExs.map(e => e.name)]);
    const program = programCall.input;
    const unknowns = [];
    program.days?.forEach(day => {
      day.exercises?.forEach(ex => {
        if (!allNames.has(ex.name)) unknowns.push(ex.name);
      });
      day.id = genId();
    });

    trackEvent(req.user.id, "coach_program_builder");
    res.json({ program, unknownExercises: unknowns, commentary: result.text || null });
  } else {
    trackEvent(req.user.id, "coach_program_builder");
    res.json({ program: null, commentary: result.text || "Could not generate program. Try being more specific." });
  }
}));

// ===================== AI SESSION ANALYSIS =====================

router.post("/coach/analyze", requireAuth, requireAIQuota, handler(async (req, res) => {
  if (!aiProvider) return res.status(503).json({ error: "AI coach unavailable — no provider configured" });
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
    db.prepare(
      "INSERT OR REPLACE INTO workout_reviews (id, workout_id, user_id, review) VALUES (?, ?, ?, ?)"
    ).run(genId(), workout_id, req.user.id, result.text);
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
  if (!aiProvider) return res.status(503).json({ error: "AI coach unavailable — no provider configured" });
  const { exercise, reason, context } = req.body;

  const exerciseLib = Object.entries(exercisesByMuscle).map(([muscle, exs]) =>
    `${muscle.toUpperCase()}: ${exs.join(", ")}`
  ).join("\n");
  const customExs = db.prepare("SELECT name, muscle, equipment, type FROM custom_exercises").all();
  const customLib = customExs.length > 0
    ? `\nCUSTOM EXERCISES: ${customExs.map(e => `${e.name} (${e.muscle}, ${e.equipment}, ${e.type})`).join(", ")}`
    : "";

  const exMeta = EXERCISES.find(e => e.name === exercise) || customExs.find(e => e.name === exercise);
  const exInfo = exMeta
    ? `${exercise} — muscle: ${exMeta.muscle}, equipment: ${exMeta.equipment}, type: ${exMeta.type}`
    : exercise;

  const system = `You are a strength training coach suggesting exercise substitutions during a live workout. Use the suggest_substitutions tool.

EXERCISE TO REPLACE: ${exInfo}
REASON FOR SWAP: ${reason || "Equipment unavailable or preference"}

CRITICAL: Only suggest exercises that EXACTLY match names in the library below. Prioritize:
1. Same primary muscle group and movement pattern
2. Similar stimulus and loading potential
3. Equipment the user has used before (check their history)
4. Respect any injuries or limitations
5. Prefer compound over isolation if replacing a compound, and vice versa

EXERCISE LIBRARY:
${exerciseLib}${customLib}`;

  const result = await aiProvider.chatWithTools(system, [
    { role: "user", content: `${context}\n\nFind substitutes for: ${exercise}` },
  ], [SUBSTITUTE_TOOL], { maxTokens: 1500 });

  const toolCall = result.toolCalls?.find(tc => tc.name === "suggest_substitutions");
  if (toolCall) {
    const allNames = new Set([...exerciseNames, ...customExs.map(e => e.name)]);
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
  if (!aiProvider) return res.status(503).json({ error: "AI coach unavailable — no provider configured" });
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

router.post("/coach/analysis", requireAuth, requireAIQuota, handler(async (req, res) => {
  if (!aiProvider) return res.status(503).json({ error: "AI coach unavailable — no provider configured" });
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

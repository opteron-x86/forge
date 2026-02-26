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

// ═══════════════════════════════════════════════════════════════
//  TALOS — Pre-Workout AI Assessment
//
//  Generates a context-aware workout briefing using training
//  history, scheduled day, profile, and real-time check-in data.
// ═══════════════════════════════════════════════════════════════

// ─── SYSTEM PROMPT ──────────────────────────────────────────────

const PRE_WORKOUT_SYSTEM = `You are TALOS, an expert strength training coach generating a pre-workout assessment. You have access to the athlete's full training history, profile, and today's check-in data.

YOUR TASK: Generate a focused, actionable pre-workout briefing for TODAY'S session.

RESPOND IN VALID JSON ONLY (no markdown fences, no preamble) with this exact structure:
{
  "readiness_score": <1-10 integer — overall training readiness based on check-in + recent trends>,
  "readiness_label": "<one of: 'Locked In', 'Good to Go', 'Moderate', 'Go Easy', 'Consider Rest'>",
  "summary": "<1-2 sentence overview of today's assessment>",
  "target_weights": [
    {
      "exercise": "<exercise name — must exactly match scheduled exercises>",
      "sets": <number>,
      "reps": "<rep range string, e.g. '5' or '8-10'>",
      "weight": <target weight number>,
      "unit": "lbs",
      "basis": "<brief explanation, e.g. 'Last session: 225x5 @RPE 8 — progress to 230'>",
      "adjustment": "<null or explanation if adjusted from normal progression>"
    }
  ],
  "intensity_guidance": {
    "approach": "<e.g. 'Push hard — week 3 of progression', 'Autoregulate down — fatigue signals'>",
    "rpe_target": "<e.g. 'RPE 7-8 working sets' or 'Stay below RPE 8 today'>",
    "rationale": "<1 sentence why>"
  },
  "alerts": [
    {
      "type": "<one of: 'deload', 'injury', 'volume_imbalance', 'recovery', 'plateau', 'pr_opportunity'>",
      "severity": "<one of: 'info', 'warning', 'critical'>",
      "title": "<short alert title>",
      "message": "<actionable 1-2 sentence recommendation>",
      "substitutions": ["<exercise name>"]
    }
  ],
  "session_adjustments": "<null or paragraph with specific modifications for today based on check-in>",
  "focus_cue": "<one motivational/technical cue for the session>"
}

RULES:
1. Target weights MUST be realistic — bars are 45lbs, plates come in 2.5/5/10/25/35/45. Dumbbells go in 5lb increments. Cable machines use fixed pin increments. Never suggest weights that can't be loaded.
2. Base target weights on the athlete's ACTUAL recent performance. Small progressions (5lbs on compounds, 2.5-5lbs on isolations) are the default.
3. If check-in shows poor sleep (<6h), high stress (4-5), or pain — adjust weights DOWN 5-15% and note it in the adjustment field.
4. If an injury or pain area is mentioned, provide exercise substitutions.
5. Detect deload need: if RPE has trended up 1.5+ points over 3-4 weeks with stalling weights, flag it.
6. Detect volume imbalances: compare push vs pull, anterior vs posterior volume over 4+ weeks.
7. Detect PR opportunities: if recent trend shows consistent progression and readiness is high, flag exercises where a PR attempt is realistic.
8. The user's intensity values use their chosen INTENSITY SCALE (specified in profile). Interpret accordingly.
9. Keep everything actionable and specific — no generic advice.
10. If limited training data (<2 weeks), say so honestly and give conservative recommendations.
11. alerts array can be empty if nothing notable. Don't invent alerts.
12. Only include target_weights for exercises in the scheduled workout. If no workout scheduled, return empty array.`;


// ─── PRE-WORKOUT CONTEXT BUILDER ────────────────────────────────

/**
 * Build focused context string for the pre-workout AI prompt.
 * Server-side counterpart to CoachPage's buildDeepContext(),
 * but tuned for pre-workout assessment needs.
 */
async function buildPreWorkoutContext(db, userId, checkin, scheduledDay, programId) {
  // ── Profile ──
  const profile = await db.get("SELECT * FROM profiles WHERE user_id = $1", [userId]);
  const user = await db.get("SELECT name FROM users WHERE id = $1", [userId]);

  // ── Recent workouts (6 weeks for trend analysis) ──
  const recentWorkouts = await db.all(
    `SELECT * FROM workouts WHERE user_id = $1
     AND date >= CURRENT_DATE - INTERVAL '42 days'
     ORDER BY date DESC`,
    [userId]
  );

  const workouts = recentWorkouts.map(w => ({
    ...w,
    exercises: typeof w.exercises === "string" ? JSON.parse(w.exercises) : (w.exercises || []),
  }));

  // ── Active program ──
  let program = null;
  const activeId = programId || profile?.active_program_id;
  if (activeId) {
    program = await db.get("SELECT * FROM programs WHERE id = $1 AND user_id = $2", [activeId, userId]);
    if (program) program.days = typeof program.days === "string" ? JSON.parse(program.days) : program.days;
  }

  // ── Body weight trend ──
  const bioHistory = await db.all(
    `SELECT date, weight, body_fat FROM bio_history
     WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '42 days'
     ORDER BY date DESC LIMIT 10`,
    [userId]
  );

  // ── Parse profile JSON fields ──
  const intensityScale = profile?.intensity_scale || "rpe";
  const targetPrs = typeof profile?.target_prs === "string"
    ? JSON.parse(profile?.target_prs || "{}") : (profile?.target_prs || {});
  const injuries = profile?.injuries_notes || "";

  // ── Compute helpers ──
  const prs = {};
  workouts.forEach(w => (w.exercises || []).forEach(ex => (ex.sets || []).forEach(s => {
    if (!s.weight || !s.reps) return;
    const e1rm = s.weight * (1 + s.reps / 30);
    if (!prs[ex.name] || e1rm > (prs[ex.name].e1rm || 0)) {
      prs[ex.name] = { weight: s.weight, reps: s.reps, e1rm, date: w.date };
    }
  })));

  // RPE trend per session
  const rpeTrend = workouts.slice(0, 10).map(w => {
    let total = 0, count = 0;
    (w.exercises || []).forEach(ex => (ex.sets || []).forEach(s => {
      if (s.rpe != null && s.rpe !== "") { total += Number(s.rpe); count++; }
    }));
    return { date: w.date, avgRpe: count > 0 ? total / count : 0, sets: count };
  }).filter(e => e.sets > 0);

  // Weekly volume by muscle (using exercise-context if available, fallback to heuristic)
  const weeklyVolume = {};
  workouts.forEach(w => {
    const d = new Date(w.date);
    const weekStart = new Date(d); weekStart.setDate(d.getDate() - d.getDay());
    const wk = weekStart.toISOString().slice(0, 10);
    if (!weeklyVolume[wk]) weeklyVolume[wk] = { sessions: 0, muscles: {} };
    weeklyVolume[wk].sessions++;
    (w.exercises || []).forEach(ex => {
      const muscle = ex.muscle || guessMuscle(ex.name);
      const sets = ex.sets?.length || 0;
      weeklyVolume[wk].muscles[muscle] = (weeklyVolume[wk].muscles[muscle] || 0) + sets;
    });
  });

  // Find last workout for this specific day
  let lastDayWorkout = null;
  if (scheduledDay) {
    lastDayWorkout = workouts.find(w =>
      w.day_id === scheduledDay.id || w.day_label === scheduledDay.label
    );
  }

  // Session frequency
  const now = Date.now();
  const sessionsLast7 = workouts.filter(w => (now - new Date(w.date).getTime()) < 7 * 86400000).length;
  const sessionsLast14 = workouts.filter(w => (now - new Date(w.date).getTime()) < 14 * 86400000).length;
  const daysSinceLast = workouts.length > 0
    ? Math.floor((now - new Date(workouts[0].date).getTime()) / 86400000) : null;

  // Feel trend
  const feelTrend = workouts.slice(0, 10).filter(w => w.feel).map(w => ({ date: w.date, feel: w.feel }));

  // ── Assemble context string ──
  const lines = [];

  lines.push("=== ATHLETE PROFILE ===");
  lines.push(`Name: ${user?.name || "Athlete"}`);
  if (profile?.experience_level) lines.push(`Experience: ${profile.experience_level}`);
  if (profile?.goal) lines.push(`Goal: ${profile.goal}`);
  if (profile?.sex) lines.push(`Sex: ${profile.sex}`);
  lines.push(`Intensity scale: ${intensityScale} (${intensityScale === "rir" ? "lower = harder, 0 = failure" : "higher = harder, 10 = failure"})`);
  if (injuries) lines.push(`Injuries/notes: ${injuries}`);
  if (Object.keys(targetPrs).length > 0) {
    lines.push(`Target PRs: ${Object.entries(targetPrs).filter(([,v]) => v).map(([k, v]) => `${k}: ${v}`).join(", ")}`);
  }

  if (bioHistory.length > 0) {
    lines.push(`\nBody weight: ${bioHistory[0].weight} lbs (${bioHistory[0].date})`);
    if (bioHistory.length > 1) {
      const delta = (bioHistory[0].weight - bioHistory[bioHistory.length - 1].weight).toFixed(1);
      lines.push(`Weight trend: ${delta > 0 ? "+" : ""}${delta} lbs over ${bioHistory.length} readings`);
    }
  }

  lines.push("\n=== TODAY'S CHECK-IN ===");
  lines.push(`Sleep: ${checkin.sleep_hours ?? "not reported"} hours`);
  lines.push(`Sleep quality: ${checkin.sleep_quality ?? "not reported"}/5`);
  lines.push(`Energy: ${checkin.energy ?? "not reported"}/5`);
  lines.push(`Stress: ${checkin.stress ?? "not reported"}/5`);
  lines.push(`Soreness: ${checkin.soreness ?? "not reported"}/5`);
  if (checkin.pain_notes) lines.push(`Pain/discomfort: ${checkin.pain_notes}`);
  if (checkin.time_available) lines.push(`Time available: ${checkin.time_available} minutes`);

  lines.push("\n=== TRAINING FREQUENCY ===");
  lines.push(`Last 7 days: ${sessionsLast7} sessions`);
  lines.push(`Last 14 days: ${sessionsLast14} sessions`);
  if (daysSinceLast !== null) lines.push(`Days since last session: ${daysSinceLast}`);
  lines.push(`Total sessions (6-week window): ${workouts.length}`);

  if (feelTrend.length > 0) {
    lines.push(`\nFeel trend: ${feelTrend.map(f => `${f.date}:${f.feel}/5`).join(", ")}`);
  }

  if (scheduledDay) {
    lines.push("\n=== SCHEDULED WORKOUT ===");
    lines.push(`Day: ${scheduledDay.label || "Unnamed"}`);
    if (scheduledDay.subtitle) lines.push(`Focus: ${scheduledDay.subtitle}`);
    if (scheduledDay.exercises) {
      lines.push("Planned exercises:");
      scheduledDay.exercises.forEach(ex => {
        const sets = ex.defaultSets || ex.sets || 3;
        const reps = ex.reps || ex.targetReps || "?";
        lines.push(`  - ${ex.name}: ${sets}×${reps}`);
      });
    }
  }

  if (lastDayWorkout) {
    lines.push("\n=== LAST TIME THIS DAY WAS PERFORMED ===");
    lines.push(`Date: ${lastDayWorkout.date} (Feel: ${lastDayWorkout.feel || "?"}/5)`);
    (lastDayWorkout.exercises || []).forEach(ex => {
      const setStr = ex.sets?.map(s => {
        let str = `${s.weight || 0}×${s.reps || 0}`;
        if (s.rpe != null && s.rpe !== "") str += ` @${s.rpe}`;
        return str;
      }).join(", ") || "no sets";
      lines.push(`  ${ex.name}: ${setStr}`);
    });
  }

  // Recent 14 days detailed
  const twoWeeksAgo = new Date(); twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  const recentDetailed = workouts.filter(w => new Date(w.date) >= twoWeeksAgo);
  if (recentDetailed.length > 0) {
    lines.push("\n=== RECENT SESSIONS (14 days) ===");
    recentDetailed.forEach(w => {
      lines.push(`\n${w.date} — ${w.day_label || "Freestyle"} (Feel: ${w.feel || "?"}/5, Duration: ${w.duration ? Math.round(w.duration / 60) : "?"}min)`);
      (w.exercises || []).forEach(ex => {
        const setStr = ex.sets?.map(s => {
          let str = `${s.weight || 0}×${s.reps || 0}`;
          if (s.rpe != null && s.rpe !== "") str += ` @${s.rpe}`;
          return str;
        }).join(", ") || "no sets";
        lines.push(`  ${ex.name}: ${setStr}`);
      });
    });
  }

  // Relevant PRs
  if (scheduledDay?.exercises && Object.keys(prs).length > 0) {
    lines.push("\n=== RELEVANT PRs ===");
    scheduledDay.exercises.forEach(ex => {
      const pr = prs[ex.name];
      if (pr) lines.push(`${ex.name}: ${pr.weight}×${pr.reps} (e1RM: ${Math.round(pr.e1rm)}) — ${pr.date}`);
    });
  }

  if (rpeTrend.length > 0) {
    const scaleLabel = intensityScale === "rir" ? "RIR" : "RPE";
    lines.push(`\n=== INTENSITY TREND (avg ${scaleLabel} per session) ===`);
    rpeTrend.slice(0, 6).forEach(e => {
      lines.push(`${e.date}: avg ${e.avgRpe.toFixed(1)} across ${e.sets} sets`);
    });
  }

  const sortedWeeks = Object.entries(weeklyVolume).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 4);
  if (sortedWeeks.length > 0) {
    lines.push("\n=== WEEKLY VOLUME (sets per muscle, last 4 weeks) ===");
    sortedWeeks.forEach(([wk, data]) => {
      const muscles = Object.entries(data.muscles).map(([m, s]) => `${m}:${s}`).join(", ");
      lines.push(`${wk} (${data.sessions} sessions): ${muscles || "no data"}`);
    });
  }

  if (program) {
    lines.push(`\n=== ACTIVE PROGRAM ===`);
    lines.push(`${program.name}: ${program.description || ""}`);
    lines.push(`Days: ${(program.days || []).map(d => d.label).join(", ")}`);
  }

  return lines.join("\n");
}

/** Heuristic muscle group guess from exercise name */
function guessMuscle(name) {
  const n = (name || "").toLowerCase();
  if (/bench|push.?up|chest\s?fly|pec/i.test(n)) return "chest";
  if (/squat|leg\s?press|lunge|quad|leg\s?ext/i.test(n)) return "quads";
  if (/deadlift|row|pull.?up|lat\s?pull|back/i.test(n)) return "back";
  if (/shoulder|ohp|press.*overhead|lateral\s?raise|delt/i.test(n)) return "shoulders";
  if (/curl|bicep/i.test(n)) return "biceps";
  if (/tricep|pushdown|skull/i.test(n)) return "triceps";
  if (/hamstring|rdl|leg\s?curl|romanian/i.test(n)) return "hamstrings";
  if (/calf|calves/i.test(n)) return "calves";
  if (/ab|crunch|plank|core/i.test(n)) return "core";
  if (/glute|hip\s?thrust/i.test(n)) return "glutes";
  return "other";
}


// ─── ROUTE HANDLER ──────────────────────────────────────────────

/**
 * POST /api/coach/pre-workout
 *
 * Body: {
 *   checkin: { sleep_hours, sleep_quality, energy, stress, soreness, pain_notes, time_available },
 *   day_id: string|null,
 *   day_label: string|null,
 *   program_id: string|null,
 * }
 */
router.post("/coach/pre-workout", requireAuth, requireAIQuota, handler(async (req, res) => {
  const aiProvider = getProviderForRequest(req, res, "pre_workout");
  if (!aiProvider) return;

  const db = getDb();
  const { checkin = {}, day_id, day_label, program_id } = req.body;

  if (!checkin || typeof checkin !== "object") {
    return res.status(400).json({ error: "Check-in data required" });
  }

  // Resolve scheduled day from program
  let scheduledDay = null;
  const profileRow = await db.get("SELECT active_program_id FROM profiles WHERE user_id = $1", [req.user.id]);
  const activeId = program_id || profileRow?.active_program_id;

  if (activeId && (day_id || day_label)) {
    const prog = await db.get("SELECT days FROM programs WHERE id = $1 AND user_id = $2", [activeId, req.user.id]);
    if (prog) {
      const days = typeof prog.days === "string" ? JSON.parse(prog.days) : prog.days;
      scheduledDay = days.find(d => d.id === day_id) || days.find(d => d.label === day_label) || null;
    }
  }

  // Build context
  const context = await buildPreWorkoutContext(db, req.user.id, checkin, scheduledDay, activeId);

  const userMessage = scheduledDay
    ? `Generate a pre-workout assessment for today's "${scheduledDay.label}" session.`
    : `Generate a pre-workout assessment for today's training session. No specific program day selected — provide general guidance based on recent training and check-in.`;

  try {
    const result = await aiProvider.chat(
      PRE_WORKOUT_SYSTEM,
      [{ role: "user", content: `${userMessage}\n\n${context}` }],
      { maxTokens: 2000 }
    );

    // Parse JSON response
    let assessment;
    try {
      const cleaned = result.text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      assessment = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("[Pre-Workout] JSON parse failed:", parseErr.message);
      return res.status(500).json({ error: "Failed to parse assessment", raw: result.text });
    }

    // Persist check-in
    try {
      await db.run(
        `INSERT INTO pre_workout_checkins (id, user_id, date, sleep_hours, sleep_quality, energy, stress, soreness, pain_notes, time_available, readiness_score, assessment)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          genId(), req.user.id, new Date().toISOString().split("T")[0],
          checkin.sleep_hours ?? null, checkin.sleep_quality ?? null,
          checkin.energy ?? null, checkin.stress ?? null, checkin.soreness ?? null,
          checkin.pain_notes || null, checkin.time_available ?? null,
          assessment.readiness_score ?? null, JSON.stringify(assessment),
        ]
      );
    } catch (e) {
      console.error("[Pre-Workout] Failed to persist check-in:", e.message);
      // Non-fatal — still return the assessment
    }

    trackEvent(req.user.id, "coach_pre_workout");

    res.json({
      assessment,
      generated_at: new Date().toISOString(),
      model: aiProvider.providerName || "unknown",
    });
  } catch (err) {
    console.error("[Pre-Workout] AI error:", err.message);
    res.status(500).json({ error: "Failed to generate assessment: " + err.message });
  }
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
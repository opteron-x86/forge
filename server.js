import express from "express";
import cors from "cors";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import Database from "better-sqlite3";
import dotenv from "dotenv";
import { createProvider, resolveConfig, defaultModelFor, PROVIDERS } from "./ai-provider.js";
import { EXERCISES } from "./src/exercises.js";

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// --- Database ---
const db = new Database(join(__dirname, "talos.db"));
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    pin_hash TEXT,
    color TEXT DEFAULT '#f97316',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS workouts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    date TEXT NOT NULL,
    program_id TEXT,
    day_id TEXT,
    day_label TEXT,
    feel INTEGER DEFAULT 3,
    sleep_hours REAL,
    duration INTEGER,
    notes TEXT,
    exercises TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS profiles (
    user_id TEXT PRIMARY KEY,
    height TEXT,
    weight REAL,
    body_fat REAL,
    rest_timer_compound INTEGER DEFAULT 150,
    rest_timer_isolation INTEGER DEFAULT 90,
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS bio_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    date TEXT NOT NULL,
    weight REAL,
    body_fat REAL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS programs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    days TEXT NOT NULL,
    shared INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS custom_exercises (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    muscle TEXT,
    equipment TEXT,
    type TEXT,
    created_by TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS ai_config (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

// --- Migrate profiles table (safe — ignores if columns already exist) ---
const profileMigrations = [
  "ALTER TABLE profiles ADD COLUMN sex TEXT",
  "ALTER TABLE profiles ADD COLUMN date_of_birth TEXT",
  "ALTER TABLE profiles ADD COLUMN goal TEXT",
  "ALTER TABLE profiles ADD COLUMN target_weight REAL",
  "ALTER TABLE profiles ADD COLUMN experience_level TEXT",
  "ALTER TABLE profiles ADD COLUMN training_intensity TEXT",
  "ALTER TABLE profiles ADD COLUMN target_prs TEXT",
  "ALTER TABLE profiles ADD COLUMN injuries_notes TEXT",
  "ALTER TABLE profiles ADD COLUMN calories_target INTEGER",
  "ALTER TABLE profiles ADD COLUMN protein_target INTEGER",
];
for (const sql of profileMigrations) {
  try { db.exec(sql); } catch (e) { /* column already exists */ }
}

function hashPin(pin) {
  return crypto.createHash("sha256").update(pin).digest("hex");
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
}

// --- AI Provider ---
function loadAIConfig() {
  const rows = db.prepare("SELECT key, value FROM ai_config").all();
  const dbSettings = {};
  rows.forEach(r => { dbSettings[r.key] = r.value; });
  return dbSettings;
}

function initProvider() {
  const dbSettings = loadAIConfig();
  const config = resolveConfig(dbSettings, process.env);
  if (!config) {
    console.warn("⚠️  No AI provider configured — AI coach unavailable");
    return null;
  }
  try {
    const p = createProvider(config);
    console.log(`✅ AI: ${config.provider} (${config.model})`);
    return p;
  } catch (e) {
    console.error("❌ AI provider init failed:", e.message);
    return null;
  }
}

let aiProvider = initProvider();

// Exercise list for AI context
const exerciseNames = EXERCISES.map(e => e.name).sort();
const exercisesByMuscle = {};
EXERCISES.forEach(e => {
  if (!exercisesByMuscle[e.muscle]) exercisesByMuscle[e.muscle] = [];
  exercisesByMuscle[e.muscle].push(`${e.name} (${e.equipment}, ${e.type})`);
});

// --- Middleware ---
app.use(cors());
app.use(express.json({ limit: "5mb" }));
if (process.env.NODE_ENV === "production") {
  app.use(express.static(join(__dirname, "dist")));
}

// ===================== AUTH =====================

app.get("/api/users", (req, res) => {
  const users = db.prepare("SELECT id, name, color, pin_hash IS NOT NULL as has_pin, created_at FROM users ORDER BY created_at ASC").all();
  res.json(users);
});

app.post("/api/users", (req, res) => {
  const { name, pin, color } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: "Name required" });
  const id = genId();
  const pinHash = pin ? hashPin(pin) : null;
  db.prepare("INSERT INTO users (id, name, pin_hash, color) VALUES (?, ?, ?, ?)").run(id, name.trim(), pinHash, color || "#f97316");
  db.prepare("INSERT INTO profiles (user_id) VALUES (?)").run(id);
  res.json({ id, name: name.trim(), color: color || "#f97316", has_pin: !!pin });
});

app.post("/api/users/:id/verify", (req, res) => {
  const { pin } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  if (!user.pin_hash) return res.json({ ok: true });
  if (!pin) return res.status(401).json({ error: "PIN required" });
  if (hashPin(pin) === user.pin_hash) return res.json({ ok: true });
  return res.status(401).json({ error: "Wrong PIN" });
});

app.put("/api/users/:id", (req, res) => {
  const { name, pin, color, removePin } = req.body;
  const sets = [];
  const vals = [];
  if (name !== undefined) { sets.push("name = ?"); vals.push(name.trim()); }
  if (color !== undefined) { sets.push("color = ?"); vals.push(color); }
  if (removePin) { sets.push("pin_hash = NULL"); }
  else if (pin !== undefined) { sets.push("pin_hash = ?"); vals.push(hashPin(pin)); }
  if (sets.length === 0) return res.json({ ok: true });
  vals.push(req.params.id);
  db.prepare(`UPDATE users SET ${sets.join(", ")} WHERE id = ?`).run(...vals);
  res.json({ ok: true });
});

app.delete("/api/users/:id", (req, res) => {
  const id = req.params.id;
  db.prepare("DELETE FROM workouts WHERE user_id = ?").run(id);
  db.prepare("DELETE FROM bio_history WHERE user_id = ?").run(id);
  db.prepare("DELETE FROM profiles WHERE user_id = ?").run(id);
  db.prepare("DELETE FROM programs WHERE user_id = ?").run(id);
  db.prepare("DELETE FROM users WHERE id = ?").run(id);
  res.json({ ok: true });
});

// ===================== WORKOUTS =====================

app.get("/api/workouts", (req, res) => {
  const { user_id } = req.query;
  if (!user_id) return res.status(400).json({ error: "user_id required" });
  const rows = db.prepare("SELECT * FROM workouts WHERE user_id = ? ORDER BY date ASC, created_at ASC").all(user_id);
  res.json(rows.map(r => ({ ...r, exercises: JSON.parse(r.exercises) })));
});

app.post("/api/workouts", (req, res) => {
  const { id, user_id, date, program_id, day_id, day_label, feel, sleepHours, duration, notes, exercises } = req.body;
  if (!user_id) return res.status(400).json({ error: "user_id required" });
  db.prepare(
    `INSERT INTO workouts (id, user_id, date, program_id, day_id, day_label, feel, sleep_hours, duration, notes, exercises)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id || genId(), user_id, date, program_id || null, day_id || null, day_label || null, feel || 3, sleepHours || null, duration || null, notes || "", JSON.stringify(exercises));
  res.json({ ok: true });
});

app.delete("/api/workouts/:id", (req, res) => {
  db.prepare("DELETE FROM workouts WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

// ===================== PROFILE =====================

app.get("/api/profile", (req, res) => {
  const { user_id } = req.query;
  if (!user_id) return res.status(400).json({ error: "user_id required" });
  const profile = db.prepare("SELECT * FROM profiles WHERE user_id = ?").get(user_id);
  const bioHistory = db.prepare("SELECT * FROM bio_history WHERE user_id = ? ORDER BY date ASC").all(user_id);
  res.json({
    height: profile?.height || "",
    weight: profile?.weight || null,
    bodyFat: profile?.body_fat || null,
    restTimerCompound: profile?.rest_timer_compound || 150,
    restTimerIsolation: profile?.rest_timer_isolation || 90,
    sex: profile?.sex || "",
    dateOfBirth: profile?.date_of_birth || "",
    goal: profile?.goal || "",
    targetWeight: profile?.target_weight || null,
    experienceLevel: profile?.experience_level || "",
    trainingIntensity: profile?.training_intensity || "",
    targetPrs: profile?.target_prs ? JSON.parse(profile.target_prs) : {},
    injuriesNotes: profile?.injuries_notes || "",
    caloriesTarget: profile?.calories_target || null,
    proteinTarget: profile?.protein_target || null,
    bioHistory,
  });
});

app.put("/api/profile", (req, res) => {
  const { user_id, height, weight, bodyFat, restTimerCompound, restTimerIsolation,
    sex, dateOfBirth, goal, targetWeight, experienceLevel, trainingIntensity,
    targetPrs, injuriesNotes, caloriesTarget, proteinTarget } = req.body;
  if (!user_id) return res.status(400).json({ error: "user_id required" });
  db.prepare(
    `UPDATE profiles SET height = ?, weight = ?, body_fat = ?, rest_timer_compound = ?, rest_timer_isolation = ?,
     sex = ?, date_of_birth = ?, goal = ?, target_weight = ?, experience_level = ?, training_intensity = ?,
     target_prs = ?, injuries_notes = ?, calories_target = ?, protein_target = ?,
     updated_at = datetime('now') WHERE user_id = ?`
  ).run(
    height || null, weight || null, bodyFat || null, restTimerCompound || 150, restTimerIsolation || 90,
    sex || null, dateOfBirth || null, goal || null, targetWeight || null, experienceLevel || null, trainingIntensity || null,
    targetPrs ? JSON.stringify(targetPrs) : null, injuriesNotes || null, caloriesTarget || null, proteinTarget || null,
    user_id
  );
  if (weight) {
    db.prepare("INSERT INTO bio_history (user_id, date, weight, body_fat) VALUES (?, ?, ?, ?)").run(
      user_id, new Date().toISOString().split("T")[0], weight, bodyFat || null
    );
  }
  res.json({ ok: true });
});

// ===================== PROGRAMS =====================

app.get("/api/programs", (req, res) => {
  const { user_id } = req.query;
  if (!user_id) return res.status(400).json({ error: "user_id required" });
  const rows = db.prepare("SELECT * FROM programs WHERE user_id = ? OR shared = 1 ORDER BY created_at ASC").all(user_id);
  res.json(rows.map(r => ({ ...r, days: JSON.parse(r.days) })));
});

app.post("/api/programs", (req, res) => {
  const { user_id, name, description, days, shared } = req.body;
  if (!user_id || !name) return res.status(400).json({ error: "user_id and name required" });
  const id = genId();
  db.prepare("INSERT INTO programs (id, user_id, name, description, days, shared) VALUES (?, ?, ?, ?, ?, ?)").run(
    id, user_id, name, description || "", JSON.stringify(days || []), shared ? 1 : 0
  );
  res.json({ ok: true, id });
});

app.put("/api/programs/:id", (req, res) => {
  const { name, description, days, shared } = req.body;
  db.prepare("UPDATE programs SET name = ?, description = ?, days = ?, shared = ? WHERE id = ?").run(
    name, description || "", JSON.stringify(days || []), shared ? 1 : 0, req.params.id
  );
  res.json({ ok: true });
});

app.delete("/api/programs/:id", (req, res) => {
  db.prepare("DELETE FROM programs WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

// ===================== EXERCISES =====================

app.get("/api/exercises", (req, res) => {
  const rows = db.prepare("SELECT * FROM custom_exercises ORDER BY name ASC").all();
  res.json(rows);
});

app.post("/api/exercises", (req, res) => {
  const { name, muscle, equipment, type, created_by } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: "Name required" });
  const id = genId();
  try {
    db.prepare("INSERT INTO custom_exercises (id, name, muscle, equipment, type, created_by) VALUES (?, ?, ?, ?, ?, ?)").run(
      id, name.trim(), muscle || "other", equipment || "other", type || "isolation", created_by || null
    );
    res.json({ ok: true, id });
  } catch (e) {
    if (e.message.includes("UNIQUE")) return res.status(409).json({ error: "Exercise already exists" });
    throw e;
  }
});

app.delete("/api/exercises/:id", (req, res) => {
  db.prepare("DELETE FROM custom_exercises WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

// ===================== AI CONFIG =====================

app.get("/api/ai/config", (req, res) => {
  const dbSettings = loadAIConfig();
  const config = resolveConfig(dbSettings, process.env);
  res.json({
    provider: config?.provider || "",
    model: config?.model || "",
    baseUrl: dbSettings.baseUrl || process.env.AI_BASE_URL || "",
    hasKey: !!(config?.apiKey),
    supportsTools: dbSettings.supportsTools !== "false",
    enabled: !!aiProvider,
    providerName: aiProvider?.providerName || "",
    providers: PROVIDERS,
  });
});

app.put("/api/ai/config", (req, res) => {
  const { provider, model, apiKey, baseUrl, supportsTools } = req.body;
  const upsert = db.prepare("INSERT INTO ai_config (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value");
  if (provider !== undefined) upsert.run("provider", provider);
  if (model !== undefined) upsert.run("model", model);
  if (apiKey !== undefined) upsert.run("apiKey", apiKey);
  if (baseUrl !== undefined) upsert.run("baseUrl", baseUrl);
  if (supportsTools !== undefined) upsert.run("supportsTools", String(supportsTools));

  // Reinitialize provider
  aiProvider = initProvider();
  res.json({ ok: true, enabled: !!aiProvider, providerName: aiProvider?.providerName || "" });
});

// ===================== AI COACH =====================

const COACH_SYSTEM = `You are a knowledgeable strength training coach analyzing real workout data. The user's profile includes biometric data, training goals, experience level, injury notes, and nutrition targets — use all available context to personalize your advice. Give specific, evidence-based advice with exact numbers (weights, reps, sets). Be concise and actionable. Consider any injuries mentioned. Format with clear sections but keep it tight. No fluff.`;

app.post("/api/coach", async (req, res) => {
  if (!aiProvider) return res.status(503).json({ error: "AI coach unavailable — no provider configured" });
  const { prompt, context } = req.body;
  try {
    const result = await aiProvider.chat(COACH_SYSTEM, [
      { role: "user", content: `${context}\n\nQUESTION: ${prompt}` },
    ], { maxTokens: 1500 });
    res.json({ response: result.text });
  } catch (e) {
    console.error("Coach error:", e.message);
    res.status(500).json({ error: e.message });
  }
});

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

app.post("/api/coach/program", async (req, res) => {
  if (!aiProvider) return res.status(503).json({ error: "AI coach unavailable — no provider configured" });
  const { prompt, context } = req.body;

  // Build exercise library context
  const exerciseLib = Object.entries(exercisesByMuscle).map(([muscle, exs]) =>
    `${muscle.toUpperCase()}: ${exs.join(", ")}`
  ).join("\n");

  // Add custom exercises
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
- Balance push/pull volume
- Include appropriate warm-up progression in set counts
- Use appropriate rep ranges for the exercise type (compounds: 3-8, accessories: 8-15)
- Add helpful notes for exercises that need form cues or injury modifications
- Respect any injuries or limitations mentioned`;

  try {
    const result = await aiProvider.chatWithTools(system, [
      { role: "user", content: `${context}\n\nPROGRAM REQUEST: ${prompt}` },
    ], [PROGRAM_TOOL], { maxTokens: 4000 });

    const programCall = result.toolCalls?.find(tc => tc.name === "create_program");
    if (programCall) {
      // Validate exercise names against library
      const allNames = new Set([...exerciseNames, ...customExs.map(e => e.name)]);
      const program = programCall.input;
      const unknowns = [];
      program.days?.forEach(day => {
        day.exercises?.forEach(ex => {
          if (!allNames.has(ex.name)) unknowns.push(ex.name);
        });
        // Add IDs for frontend compatibility
        day.id = genId();
      });

      res.json({
        program,
        unknownExercises: unknowns,
        commentary: result.text || null,
      });
    } else {
      // No tool call — return text response
      res.json({ program: null, commentary: result.text || "Could not generate program. Try being more specific." });
    }
  } catch (e) {
    console.error("Program builder error:", e.message);
    res.status(500).json({ error: e.message });
  }
});

// ===================== AI SESSION ANALYSIS =====================

app.post("/api/coach/analyze", async (req, res) => {
  if (!aiProvider) return res.status(503).json({ error: "AI coach unavailable — no provider configured" });
  const { workout, context } = req.body;

  const system = `You are a concise strength training coach providing a post-workout session analysis. Analyze the just-completed workout and give brief, specific feedback.

FORMAT YOUR RESPONSE IN THESE SECTIONS (skip any that aren't relevant):
**Session Summary** — One line overview (duration, volume, energy)
**PRs & Wins** — Any personal records or notable improvements
**Flags** — Any regressions, concerning patterns, or things to watch
**Next Session** — One specific, actionable recommendation for next time

Keep it tight — max 150 words total. Be encouraging but honest. Use the user's actual numbers.`;

  try {
    const result = await aiProvider.chat(system, [
      { role: "user", content: `${context}\n\nJUST COMPLETED:\n${JSON.stringify(workout, null, 2)}` },
    ], { maxTokens: 800 });
    res.json({ analysis: result.text });
  } catch (e) {
    console.error("Analysis error:", e.message);
    res.status(500).json({ error: e.message });
  }
});

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

app.post("/api/coach/substitute", async (req, res) => {
  if (!aiProvider) return res.status(503).json({ error: "AI coach unavailable — no provider configured" });
  const { exercise, reason, context } = req.body;

  // Build exercise library grouped by muscle
  const exerciseLib = Object.entries(exercisesByMuscle).map(([muscle, exs]) =>
    `${muscle.toUpperCase()}: ${exs.join(", ")}`
  ).join("\n");
  const customExs = db.prepare("SELECT name, muscle, equipment, type FROM custom_exercises").all();
  const customLib = customExs.length > 0
    ? `\nCUSTOM EXERCISES: ${customExs.map(e => `${e.name} (${e.muscle}, ${e.equipment}, ${e.type})`).join(", ")}`
    : "";

  // Find the exercise's metadata
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

  try {
    const result = await aiProvider.chatWithTools(system, [
      { role: "user", content: `${context}\n\nFind substitutes for: ${exercise}` },
    ], [SUBSTITUTE_TOOL], { maxTokens: 1500 });

    const toolCall = result.toolCalls?.find(tc => tc.name === "suggest_substitutions");
    if (toolCall) {
      // Validate exercise names
      const allNames = new Set([...exerciseNames, ...customExs.map(e => e.name)]);
      const subs = toolCall.input.substitutions?.filter(s => allNames.has(s.name)) || [];
      res.json({ substitutions: subs, commentary: result.text || null });
    } else {
      res.json({ substitutions: [], commentary: result.text || "Could not generate substitutions." });
    }
  } catch (e) {
    console.error("Substitute error:", e.message);
    res.status(500).json({ error: e.message });
  }
});

// ===================== AI WEEKLY REPORT =====================

app.post("/api/coach/weekly", async (req, res) => {
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

Be data-driven. Reference actual numbers from the workout logs. Keep the whole report under 300 words. No generic advice — everything should be specific to THIS user's data.`;

  try {
    const result = await aiProvider.chat(system, [
      { role: "user", content: context },
    ], { maxTokens: 1500 });
    res.json({ report: result.text });
  } catch (e) {
    console.error("Weekly report error:", e.message);
    res.status(500).json({ error: e.message });
  }
});

// ===================== EXPORT =====================

app.get("/api/export", (req, res) => {
  const { user_id } = req.query;
  if (!user_id) return res.status(400).json({ error: "user_id required" });
  const workouts = db.prepare("SELECT * FROM workouts WHERE user_id = ? ORDER BY date ASC").all(user_id);
  const lines = ["date,day_label,exercise,set_num,weight,reps,rpe,feel,duration,notes"];
  workouts.forEach(w => {
    const exs = JSON.parse(w.exercises);
    exs.forEach(ex => {
      ex.sets?.forEach((s, i) => {
        lines.push([w.date, w.day_label || "", ex.name, i + 1, s.weight || "", s.reps || "", s.rpe || "", w.feel || "", w.duration || "", ""].map(v => `"${v}"`).join(","));
      });
    });
  });
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename=talos-export-${user_id}.csv`);
  res.send(lines.join("\n"));
});

// Health
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    users: db.prepare("SELECT COUNT(*) as c FROM users").get().c,
    ai: !!aiProvider,
    aiProvider: aiProvider?.providerName || null,
    aiModel: aiProvider?.modelName || null,
  });
});

// SPA fallback
if (process.env.NODE_ENV === "production") {
  app.get("*", (req, res) => res.sendFile(join(__dirname, "dist", "index.html")));
}

app.listen(PORT, "0.0.0.0", () => {
  const aiStatus = aiProvider ? `✅ ${aiProvider.providerName} (${aiProvider.modelName})` : "❌ Not configured";
  console.log(`
┌────────────────────────────────────────┐
│                                        │
│   Δ TALOS                             │
│   Gym Tracker v2.2                     │
│                                        │
│   http://0.0.0.0:${String(PORT).padEnd(24)}│
│   AI: ${aiStatus.padEnd(33)}│
│   Users: ${String(db.prepare("SELECT COUNT(*) as c FROM users").get().c).padEnd(29)}│
│                                        │
└────────────────────────────────────────┘`);
});

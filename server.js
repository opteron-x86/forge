import express from "express";
import cors from "cors";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import Database from "better-sqlite3";
import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// --- Database ---
const db = new Database(join(__dirname, "forge.db"));
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
`);

function hashPin(pin) {
  return crypto.createHash("sha256").update(pin).digest("hex");
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
}

// --- Anthropic ---
let anthropic = null;
if (process.env.ANTHROPIC_API_KEY) {
  anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  console.log("✅ Anthropic API key loaded");
} else {
  console.warn("⚠️  No ANTHROPIC_API_KEY — AI coach unavailable");
}

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
    bioHistory,
  });
});

app.put("/api/profile", (req, res) => {
  const { user_id, height, weight, bodyFat, restTimerCompound, restTimerIsolation } = req.body;
  if (!user_id) return res.status(400).json({ error: "user_id required" });
  db.prepare(
    `UPDATE profiles SET height = ?, weight = ?, body_fat = ?, rest_timer_compound = ?, rest_timer_isolation = ?, updated_at = datetime('now') WHERE user_id = ?`
  ).run(height || null, weight || null, bodyFat || null, restTimerCompound || 150, restTimerIsolation || 90, user_id);
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

// ===================== AI COACH =====================

app.post("/api/coach", async (req, res) => {
  if (!anthropic) return res.status(503).json({ error: "AI coach unavailable — no API key configured" });
  const { prompt, context } = req.body;
  try {
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      system: `You are a knowledgeable strength training coach analyzing real workout data. Give specific, evidence-based advice with exact numbers (weights, reps, sets). Be concise and actionable. Consider any injuries mentioned. Format with clear sections but keep it tight. No fluff.`,
      messages: [{ role: "user", content: `${context}\n\nQUESTION: ${prompt}` }],
    });
    res.json({ response: msg.content.map(b => b.type === "text" ? b.text : "").join("\n") });
  } catch (e) {
    console.error("Coach error:", e.message);
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
  res.setHeader("Content-Disposition", `attachment; filename=forge-export-${user_id}.csv`);
  res.send(lines.join("\n"));
});

// Health
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", users: db.prepare("SELECT COUNT(*) as c FROM users").get().c, ai: !!anthropic });
});

// SPA fallback
if (process.env.NODE_ENV === "production") {
  app.get("*", (req, res) => res.sendFile(join(__dirname, "dist", "index.html")));
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`
┌────────────────────────────────────────┐
│                                        │
│   ◆ FORGE                              │
│   Gym Tracker v2.0                     │
│                                        │
│   http://0.0.0.0:${String(PORT).padEnd(24)}│
│   AI Coach: ${(anthropic ? "✅ Enabled" : "❌ No API key").padEnd(26)}│
│   Users: ${String(db.prepare("SELECT COUNT(*) as c FROM users").get().c).padEnd(29)}│
│                                        │
└────────────────────────────────────────┘`);
});

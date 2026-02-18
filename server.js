import express from "express";
import cors from "cors";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { mkdirSync } from "fs";
import Database from "better-sqlite3";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createProvider, resolveConfig, defaultModelFor, PROVIDERS } from "./ai-provider.js";
import { EXERCISES } from "./src/lib/exercises.js";
import { Resend } from "resend";

dotenv.config();

// --- Graceful error handling ---
process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
});
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
});

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// --- JWT Config ---
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString("hex");
const JWT_EXPIRES_IN = "7d";
if (!process.env.JWT_SECRET) {
  console.warn("⚠️  No JWT_SECRET set — using random secret (tokens won't survive restarts)");
}
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || null;
const BCRYPT_ROUNDS = 12;

// --- Email (Resend) ---
const RESEND_API_KEY = process.env.RESEND_API_KEY || null;
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;
const APP_URL = process.env.APP_URL || "https://talos.fit";
const FROM_EMAIL = process.env.FROM_EMAIL || "TALOS <noreply@talos.fit>";

// --- Database ---
const DB_PATH = process.env.DATABASE_PATH || join(__dirname, "talos.db");
// Ensure parent directory exists (critical for Railway volume mount at /data)
try { mkdirSync(dirname(DB_PATH), { recursive: true }); } catch (e) { /* exists */ }
const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
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

  CREATE TABLE IF NOT EXISTS coach_messages (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'chat',
    prompt TEXT,
    response TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS workout_reviews (
    id TEXT PRIMARY KEY,
    workout_id TEXT NOT NULL UNIQUE,
    user_id TEXT NOT NULL,
    review TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (workout_id) REFERENCES workouts(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS analytics_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    event TEXT NOT NULL,
    meta TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
  CREATE INDEX IF NOT EXISTS idx_analytics_event ON analytics_events(event);
  CREATE INDEX IF NOT EXISTS idx_analytics_user ON analytics_events(user_id);
  CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics_events(created_at);
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
  "ALTER TABLE profiles ADD COLUMN active_program_id TEXT",
  "ALTER TABLE profiles ADD COLUMN onboarding_complete INTEGER DEFAULT 0",
  "ALTER TABLE profiles ADD COLUMN rest_timer_enabled INTEGER DEFAULT 1",
  "ALTER TABLE profiles ADD COLUMN intensity_scale TEXT DEFAULT 'rpe'",
  "ALTER TABLE profiles ADD COLUMN pinned_lifts TEXT",
  "ALTER TABLE profiles ADD COLUMN notes TEXT",
];
for (const sql of profileMigrations) {
  try { db.exec(sql); } catch (e) { /* column already exists */ }
}

// --- Migrate users table for proper auth ---
const userMigrations = [
  "ALTER TABLE users ADD COLUMN email TEXT",
  "ALTER TABLE users ADD COLUMN password_hash TEXT",
  "ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'",
  "ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1",
  "ALTER TABLE users ADD COLUMN theme TEXT DEFAULT 'talos'",
  "ALTER TABLE users ADD COLUMN reset_token TEXT",
  "ALTER TABLE users ADD COLUMN reset_token_expires TEXT",
];
for (const sql of userMigrations) {
  try { db.exec(sql); } catch (e) { /* column already exists */ }
}
// Unique index on email (separate from ALTER TABLE — SQLite doesn't support ADD COLUMN ... UNIQUE)
try { db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email)"); } catch (e) { /* already exists */ }

// --- Migrate programs table ---
const programMigrations = [
  "ALTER TABLE programs ADD COLUMN forked_from TEXT",
];
for (const sql of programMigrations) {
  try { db.exec(sql); } catch (e) { /* column already exists */ }
}

// --- Migrate workouts table ---
const workoutMigrations = [
  "ALTER TABLE workouts ADD COLUMN finished_at TEXT",
];
for (const sql of workoutMigrations) {
  try { db.exec(sql); } catch (e) { /* column already exists */ }
}

// --- Set admin role for ADMIN_EMAIL if configured ---
if (ADMIN_EMAIL) {
  const adminUser = db.prepare("SELECT id FROM users WHERE email = ?").get(ADMIN_EMAIL);
  if (adminUser) {
    db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(adminUser.id);
  }
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
}

// --- Analytics Helper ---
const trackEventStmt = db.prepare("INSERT INTO analytics_events (user_id, event, meta) VALUES (?, ?, ?)");
function trackEvent(userId, event, meta = null) {
  try {
    trackEventStmt.run(userId, event, meta ? JSON.stringify(meta) : null);
  } catch (e) {
    console.error("Analytics tracking error:", e.message);
  }
}

// --- JWT Helpers ---
function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

// --- Auth Middleware ---
function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }
  try {
    const payload = verifyToken(header.slice(7));
    const user = db.prepare("SELECT id, name, email, role, color, theme, is_active FROM users WHERE id = ?").get(payload.id);
    if (!user) return res.status(401).json({ error: "User not found" });
    if (!user.is_active) return res.status(403).json({ error: "Account deactivated" });
    req.user = user;
    next();
  } catch (e) {
    if (e.name === "TokenExpiredError") return res.status(401).json({ error: "Token expired" });
    return res.status(401).json({ error: "Invalid token" });
  }
}

function requireAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

// --- Rate Limiting (in-memory, per-IP) ---
const rateLimitMap = new Map();
function rateLimit(maxAttempts, windowMs) {
  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const entry = rateLimitMap.get(key);
    if (entry && now - entry.start < windowMs) {
      if (entry.count >= maxAttempts) {
        return res.status(429).json({ error: "Too many attempts. Try again later." });
      }
      entry.count++;
    } else {
      rateLimitMap.set(key, { count: 1, start: now });
    }
    next();
  };
}
// Clean up rate limit entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap) {
    if (now - entry.start > 900000) rateLimitMap.delete(key);
  }
}, 600000);

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

// ===================== AUTH (PUBLIC ROUTES) =====================

// Rate limit: 10 attempts per 15 minutes on auth endpoints
const authRateLimit = rateLimit(10, 15 * 60 * 1000);

// Register — email + password + display name
app.post("/api/auth/register", authRateLimit, (req, res) => {
  const { email, password, name, color } = req.body;
  if (!email?.trim()) return res.status(400).json({ error: "Email required" });
  if (!password || password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters" });
  if (!name?.trim()) return res.status(400).json({ error: "Name required" });

  const normalizedEmail = email.trim().toLowerCase();

  // Check if email is already taken
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(normalizedEmail);
  if (existing) return res.status(409).json({ error: "Email already registered" });

  const id = genId();
  const passwordHash = bcrypt.hashSync(password, BCRYPT_ROUNDS);
  const role = (ADMIN_EMAIL && normalizedEmail === ADMIN_EMAIL.toLowerCase()) ? "admin" : "user";

  db.prepare(
    "INSERT INTO users (id, name, email, password_hash, role, color, theme) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(id, name.trim(), normalizedEmail, passwordHash, role, color || "#f97316", "talos");
  db.prepare("INSERT INTO profiles (user_id) VALUES (?)").run(id);

  const user = { id, name: name.trim(), email: normalizedEmail, role, color: color || "#f97316", theme: "talos" };
  const token = signToken(user);
  trackEvent(id, "user_registered");
  res.json({ token, user });
});

// Login — email + password
app.post("/api/auth/login", authRateLimit, (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });

  const normalizedEmail = email.trim().toLowerCase();
  const user = db.prepare("SELECT id, name, email, password_hash, role, color, theme, is_active FROM users WHERE email = ?").get(normalizedEmail);
  if (!user) return res.status(401).json({ error: "Invalid email or password" });
  if (!user.is_active) return res.status(403).json({ error: "Account deactivated. Contact support." });
  if (!user.password_hash) return res.status(401).json({ error: "Account not set up. Please contact an admin." });

  if (!bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = signToken(user);
  trackEvent(user.id, "user_login");
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, color: user.color, theme: user.theme || "talos" },
  });
});

// Get current user from token
app.get("/api/auth/me", requireAuth, (req, res) => {
  res.json({
    id: req.user.id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
    color: req.user.color,
    theme: req.user.theme || "talos",
  });
});

// Change password
app.post("/api/auth/change-password", requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: "Current and new password required" });
  if (newPassword.length < 8) return res.status(400).json({ error: "New password must be at least 8 characters" });

  const user = db.prepare("SELECT password_hash FROM users WHERE id = ?").get(req.user.id);
  if (!bcrypt.compareSync(currentPassword, user.password_hash)) {
    return res.status(401).json({ error: "Current password is wrong" });
  }

  const newHash = bcrypt.hashSync(newPassword, BCRYPT_ROUNDS);
  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(newHash, req.user.id);
  res.json({ ok: true });
});

// Forgot password — send reset email
app.post("/api/auth/forgot-password", authRateLimit, (req, res) => {
  const { email } = req.body;
  if (!email?.trim()) return res.status(400).json({ error: "Email required" });

  // Always return success to prevent email enumeration
  const successMsg = "If an account exists with that email, a reset link has been sent.";

  const user = db.prepare("SELECT id, email, is_active FROM users WHERE email = ?").get(email.trim().toLowerCase());
  if (!user || !user.is_active) return res.json({ message: successMsg });

  if (!resend) {
    console.warn("⚠️  Password reset requested but RESEND_API_KEY not set");
    return res.json({ message: successMsg });
  }

  // Generate token (URL-safe random string)
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

  db.prepare("UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?")
    .run(tokenHash, expires, user.id);

  const resetUrl = `${APP_URL}?reset=${token}`;

  resend.emails.send({
    from: FROM_EMAIL,
    to: user.email,
    subject: "TALOS — Reset Your Password",
    html: `
      <div style="font-family: 'Courier New', monospace; max-width: 480px; margin: 0 auto; padding: 32px; background: #0a0a0a; color: #e5e5e5;">
        <div style="font-size: 24px; font-weight: 800; margin-bottom: 4px; color: #fafafa;">Δ TALOS</div>
        <div style="font-size: 11px; color: #737373; letter-spacing: 2px; margin-bottom: 32px;">PASSWORD RESET</div>
        <p style="font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
          A password reset was requested for your TALOS account. Click the button below to set a new password.
        </p>
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #c9952d; color: #000; font-weight: 700; text-decoration: none; border-radius: 8px; font-size: 13px; letter-spacing: 0.5px;">
          RESET PASSWORD
        </a>
        <p style="font-size: 12px; color: #737373; margin-top: 24px; line-height: 1.5;">
          This link expires in 1 hour. If you didn't request this, you can safely ignore this email.
        </p>
        <div style="border-top: 1px solid #262626; margin-top: 32px; padding-top: 16px; font-size: 10px; color: #525252;">
          talos.fit — Unyielding
        </div>
      </div>
    `,
  }).catch(err => console.error("Reset email failed:", err));

  res.json({ message: successMsg });
});

// Reset password — validate token and set new password
app.post("/api/auth/reset-password", authRateLimit, (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) return res.status(400).json({ error: "Token and new password required" });
  if (newPassword.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters" });

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const user = db.prepare(
    "SELECT id, reset_token_expires FROM users WHERE reset_token = ? AND is_active = 1"
  ).get(tokenHash);

  if (!user) return res.status(400).json({ error: "Invalid or expired reset link" });

  // Check expiration
  if (new Date(user.reset_token_expires) < new Date()) {
    db.prepare("UPDATE users SET reset_token = NULL, reset_token_expires = NULL WHERE id = ?").run(user.id);
    return res.status(400).json({ error: "Reset link has expired. Please request a new one." });
  }

  const passwordHash = bcrypt.hashSync(newPassword, BCRYPT_ROUNDS);
  db.prepare("UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?")
    .run(passwordHash, user.id);

  res.json({ message: "Password has been reset. You can now sign in." });
});

// Update own account (name, color, theme)
app.put("/api/auth/account", requireAuth, (req, res) => {
  const { name, color, theme } = req.body;
  const sets = [];
  const vals = [];
  if (name !== undefined) { sets.push("name = ?"); vals.push(name.trim()); }
  if (color !== undefined) { sets.push("color = ?"); vals.push(color); }
  if (theme !== undefined) { sets.push("theme = ?"); vals.push(theme); }
  if (sets.length === 0) return res.json({ ok: true });
  vals.push(req.user.id);
  db.prepare(`UPDATE users SET ${sets.join(", ")} WHERE id = ?`).run(...vals);
  res.json({ ok: true });
});

// ===================== ADMIN ROUTES =====================

// List all users (admin only)
app.get("/api/admin/users", requireAuth, requireAdmin, (req, res) => {
  const users = db.prepare(
    "SELECT id, name, email, role, color, is_active, created_at FROM users ORDER BY created_at ASC"
  ).all();
  // Add workout count for each user
  const enriched = users.map(u => {
    const stats = db.prepare("SELECT COUNT(*) as workouts FROM workouts WHERE user_id = ?").get(u.id);
    return { ...u, workoutCount: stats.workouts };
  });
  res.json(enriched);
});

// Deactivate / reactivate user (admin only)
app.put("/api/admin/users/:id/status", requireAuth, requireAdmin, (req, res) => {
  const { is_active } = req.body;
  if (req.params.id === req.user.id) return res.status(400).json({ error: "Cannot deactivate yourself" });
  db.prepare("UPDATE users SET is_active = ? WHERE id = ?").run(is_active ? 1 : 0, req.params.id);
  res.json({ ok: true });
});

// Delete user and all data (admin only)
app.delete("/api/admin/users/:id", requireAuth, requireAdmin, (req, res) => {
  const id = req.params.id;
  if (id === req.user.id) return res.status(400).json({ error: "Cannot delete yourself" });
  db.prepare("DELETE FROM workouts WHERE user_id = ?").run(id);
  db.prepare("DELETE FROM workout_reviews WHERE user_id = ?").run(id);
  db.prepare("DELETE FROM bio_history WHERE user_id = ?").run(id);
  db.prepare("DELETE FROM profiles WHERE user_id = ?").run(id);
  db.prepare("DELETE FROM programs WHERE user_id = ?").run(id);
  db.prepare("DELETE FROM coach_messages WHERE user_id = ?").run(id);
  db.prepare("DELETE FROM users WHERE id = ?").run(id);
  res.json({ ok: true });
});

// ===================== WORKOUTS =====================

app.get("/api/workouts", requireAuth, (req, res) => {
  const rows = db.prepare("SELECT * FROM workouts WHERE user_id = ? ORDER BY date ASC, created_at ASC").all(req.user.id);
  res.json(rows.map(r => ({ ...r, exercises: JSON.parse(r.exercises) })));
});

app.post("/api/workouts", requireAuth, (req, res) => {
  const { id, date, program_id, day_id, day_label, feel, sleepHours, duration, notes, exercises, finished_at } = req.body;
  db.prepare(
    `INSERT INTO workouts (id, user_id, date, program_id, day_id, day_label, feel, sleep_hours, duration, notes, exercises, finished_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id || genId(), req.user.id, date, program_id || null, day_id || null, day_label || null, feel || 3, sleepHours || null, duration || null, notes || "", JSON.stringify(exercises), finished_at || null);
  const exArr = Array.isArray(exercises) ? exercises : [];
  trackEvent(req.user.id, "workout_completed", {
    day_label: day_label || "Freestyle",
    exercises: exArr.length,
    sets: exArr.reduce((sum, e) => sum + (e.sets?.length || 0), 0),
    duration: duration || null,
  });
  res.json({ ok: true });
});

app.put("/api/workouts/:id", requireAuth, (req, res) => {
  const { date, program_id, day_id, day_label, feel, sleepHours, duration, notes, exercises, finished_at } = req.body;
  const existing = db.prepare("SELECT id FROM workouts WHERE id = ? AND user_id = ?").get(req.params.id, req.user.id);
  if (!existing) return res.status(404).json({ error: "Workout not found" });
  db.prepare(
    `UPDATE workouts SET date = ?, program_id = ?, day_id = ?, day_label = ?,
     feel = ?, sleep_hours = ?, duration = ?, notes = ?, exercises = ?,
     finished_at = ?
     WHERE id = ? AND user_id = ?`
  ).run(
    date, program_id || null, day_id || null, day_label || null,
    feel || 3, sleepHours || null, duration || null, notes || "",
    JSON.stringify(exercises), finished_at || null,
    req.params.id, req.user.id
  );
  res.json({ ok: true });
});

app.delete("/api/workouts/:id", requireAuth, (req, res) => {
  db.prepare("DELETE FROM workout_reviews WHERE workout_id = ? AND user_id = ?").run(req.params.id, req.user.id);
  db.prepare("DELETE FROM workouts WHERE id = ? AND user_id = ?").run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// ===================== WORKOUT REVIEWS =====================

app.get("/api/workout-reviews", requireAuth, (req, res) => {
  const { workout_id } = req.query;
  if (workout_id) {
    const review = db.prepare("SELECT * FROM workout_reviews WHERE workout_id = ? AND user_id = ?").get(workout_id, req.user.id);
    return res.json(review || null);
  }
  const reviews = db.prepare("SELECT * FROM workout_reviews WHERE user_id = ?").all(req.user.id);
  return res.json(reviews);
});

app.post("/api/workout-reviews", requireAuth, (req, res) => {
  const { id, workout_id, review } = req.body;
  if (!workout_id || !review) return res.status(400).json({ error: "workout_id and review required" });
  db.prepare(
    "INSERT OR REPLACE INTO workout_reviews (id, workout_id, user_id, review) VALUES (?, ?, ?, ?)"
  ).run(id || genId(), workout_id, req.user.id, review);
  res.json({ ok: true });
});

app.delete("/api/workout-reviews/:workout_id", requireAuth, (req, res) => {
  db.prepare("DELETE FROM workout_reviews WHERE workout_id = ? AND user_id = ?").run(req.params.workout_id, req.user.id);
  res.json({ ok: true });
});

// ===================== PROFILE =====================

app.get("/api/profile", requireAuth, (req, res) => {
  const profile = db.prepare("SELECT * FROM profiles WHERE user_id = ?").get(req.user.id);
  const bioHistory = db.prepare("SELECT * FROM bio_history WHERE user_id = ? ORDER BY date ASC").all(req.user.id);
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
    activeProgramId: profile?.active_program_id || null,
    onboardingComplete: !!profile?.onboarding_complete,
    restTimerEnabled: profile?.rest_timer_enabled !== 0,
    intensityScale: profile?.intensity_scale || "rpe",
    pinnedLifts: profile?.pinned_lifts ? JSON.parse(profile.pinned_lifts) : null,
    bioHistory,
  });
});

app.put("/api/profile", requireAuth, (req, res) => {
  const { height, weight, bodyFat, restTimerCompound, restTimerIsolation,
    sex, dateOfBirth, goal, targetWeight, experienceLevel, trainingIntensity,
    targetPrs, injuriesNotes, caloriesTarget, proteinTarget, activeProgramId, onboardingComplete,
    restTimerEnabled, intensityScale, pinnedLifts } = req.body;
  db.prepare(
    `UPDATE profiles SET height = ?, weight = ?, body_fat = ?, rest_timer_compound = ?, rest_timer_isolation = ?,
     sex = ?, date_of_birth = ?, goal = ?, target_weight = ?, experience_level = ?, training_intensity = ?,
     target_prs = ?, injuries_notes = ?, calories_target = ?, protein_target = ?, active_program_id = ?,
     onboarding_complete = ?, rest_timer_enabled = ?, intensity_scale = ?, pinned_lifts = ?,
     updated_at = datetime('now') WHERE user_id = ?`
  ).run(
    height || null, weight || null, bodyFat || null, restTimerCompound || 150, restTimerIsolation || 90,
    sex || null, dateOfBirth || null, goal || null, targetWeight || null, experienceLevel || null, trainingIntensity || null,
    targetPrs ? JSON.stringify(targetPrs) : null, injuriesNotes || null, caloriesTarget || null, proteinTarget || null,
    activeProgramId || null, onboardingComplete ? 1 : 0,
    restTimerEnabled !== false ? 1 : 0, intensityScale || "rpe",
    pinnedLifts ? JSON.stringify(pinnedLifts) : null,
    req.user.id
  );
  // Only log body weight if it actually changed from last entry
  if (weight) {
    const lastEntry = db.prepare("SELECT weight FROM bio_history WHERE user_id = ? ORDER BY date DESC LIMIT 1").get(req.user.id);
    const today = new Date().toISOString().split("T")[0];
    const todayEntry = db.prepare("SELECT id FROM bio_history WHERE user_id = ? AND date = ?").get(req.user.id, today);
    if (!todayEntry && (!lastEntry || Math.abs(lastEntry.weight - weight) > 0.01)) {
      db.prepare("INSERT INTO bio_history (user_id, date, weight, body_fat) VALUES (?, ?, ?, ?)").run(
        req.user.id, today, weight, bodyFat || null
      );
    }
  }
  res.json({ ok: true });
});

// Set active program (lightweight — no bio_history side effect)
app.put("/api/profile/active-program", requireAuth, (req, res) => {
  const { activeProgramId } = req.body;
  db.prepare("UPDATE profiles SET active_program_id = ?, updated_at = datetime('now') WHERE user_id = ?")
    .run(activeProgramId || null, req.user.id);
  res.json({ ok: true });
});

// Manual body weight log
app.post("/api/profile/weigh-in", requireAuth, (req, res) => {
  const { weight, bodyFat } = req.body;
  if (!weight) return res.status(400).json({ error: "Weight is required" });
  const today = new Date().toISOString().split("T")[0];
  // Upsert today's entry
  const existing = db.prepare("SELECT id FROM bio_history WHERE user_id = ? AND date = ?").get(req.user.id, today);
  if (existing) {
    db.prepare("UPDATE bio_history SET weight = ?, body_fat = ? WHERE id = ?").run(weight, bodyFat || null, existing.id);
  } else {
    db.prepare("INSERT INTO bio_history (user_id, date, weight, body_fat) VALUES (?, ?, ?, ?)").run(
      req.user.id, today, weight, bodyFat || null
    );
  }
  // Also update profile weight
  db.prepare("UPDATE profiles SET weight = ?, body_fat = ?, updated_at = datetime('now') WHERE user_id = ?")
    .run(weight, bodyFat || null, req.user.id);
  // Return updated bio history
  const bioHistory = db.prepare("SELECT * FROM bio_history WHERE user_id = ? ORDER BY date ASC").all(req.user.id);
  res.json({ ok: true, bioHistory, weight });
});

// ===================== PROGRAMS =====================

// User's own programs only
app.get("/api/programs", requireAuth, (req, res) => {
  const rows = db.prepare("SELECT * FROM programs WHERE user_id = ? ORDER BY created_at ASC").all(req.user.id);
  res.json(rows.map(r => ({ ...r, days: JSON.parse(r.days) })));
});

// Browse: shared programs from all users + flag own programs
app.get("/api/programs/browse", requireAuth, (req, res) => {
  const rows = db.prepare(
    `SELECT p.*, u.name as creator_name, u.color as creator_color
     FROM programs p JOIN users u ON p.user_id = u.id
     WHERE p.shared = 1
     ORDER BY p.created_at DESC`
  ).all();

  const programs = rows.map(r => ({
    ...r,
    days: JSON.parse(r.days),
    source: r.user_id === req.user.id ? "own" : "community",
  }));

  // Which programs has this user already adopted?
  const adopted = db.prepare(
    "SELECT forked_from FROM programs WHERE user_id = ? AND forked_from IS NOT NULL"
  ).all(req.user.id).map(r => r.forked_from);

  res.json({ programs, adopted });
});

// Adopt: copy a shared program or template into user's programs
app.post("/api/programs/adopt", requireAuth, (req, res) => {
  const { source_id, name, description, days } = req.body;
  if (!name) return res.status(400).json({ error: "name required" });
  if (!days || !Array.isArray(days)) return res.status(400).json({ error: "days required" });

  const id = genId();
  // Regenerate day IDs so they're unique to this copy
  const newDays = days.map(d => ({
    ...d,
    id: genId(),
    exercises: (d.exercises || []).map(e => ({ ...e })),
  }));

  db.prepare(
    "INSERT INTO programs (id, user_id, name, description, days, shared, forked_from) VALUES (?, ?, ?, ?, ?, 0, ?)"
  ).run(id, req.user.id, name, description || "", JSON.stringify(newDays), source_id || null);

  trackEvent(req.user.id, "program_adopted", { name, source_id: source_id || null });
  res.json({ ok: true, id });
});

app.post("/api/programs", requireAuth, (req, res) => {
  const { name, description, days, shared } = req.body;
  if (!name) return res.status(400).json({ error: "name required" });
  const id = genId();
  db.prepare("INSERT INTO programs (id, user_id, name, description, days, shared) VALUES (?, ?, ?, ?, ?, ?)").run(
    id, req.user.id, name, description || "", JSON.stringify(days || []), shared ? 1 : 0
  );
  res.json({ ok: true, id });
});

app.put("/api/programs/:id", requireAuth, (req, res) => {
  const { name, description, days, shared } = req.body;
  db.prepare("UPDATE programs SET name = ?, description = ?, days = ?, shared = ? WHERE id = ? AND user_id = ?").run(
    name, description || "", JSON.stringify(days || []), shared ? 1 : 0, req.params.id, req.user.id
  );
  res.json({ ok: true });
});

app.delete("/api/programs/:id", requireAuth, (req, res) => {
  db.prepare("DELETE FROM programs WHERE id = ? AND user_id = ?").run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// ===================== EXERCISES =====================

app.get("/api/exercises", requireAuth, (req, res) => {
  const rows = db.prepare("SELECT * FROM custom_exercises ORDER BY name ASC").all();
  res.json(rows);
});

app.post("/api/exercises", requireAuth, (req, res) => {
  const { name, muscle, equipment, type } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: "Name required" });
  const id = genId();
  try {
    db.prepare("INSERT INTO custom_exercises (id, name, muscle, equipment, type, created_by) VALUES (?, ?, ?, ?, ?, ?)").run(
      id, name.trim(), muscle || "other", equipment || "other", type || "isolation", req.user.id
    );
    res.json({ ok: true, id });
  } catch (e) {
    if (e.message.includes("UNIQUE")) return res.status(409).json({ error: "Exercise already exists" });
    throw e;
  }
});

app.delete("/api/exercises/:id", requireAuth, (req, res) => {
  db.prepare("DELETE FROM custom_exercises WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

// ===================== AI CONFIG =====================

// AI status (any authenticated user — just shows if AI is available)
app.get("/api/ai/status", requireAuth, (req, res) => {
  res.json({ enabled: !!aiProvider });
});

// AI config details (admin only — shows provider, model, key status)
app.get("/api/ai/config", requireAuth, requireAdmin, (req, res) => {
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
});

app.put("/api/ai/config", requireAuth, requireAdmin, (req, res) => {
  const { provider, model, baseUrl, supportsTools } = req.body;
  const upsert = db.prepare("INSERT INTO ai_config (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value");
  if (provider !== undefined) upsert.run("provider", provider);
  if (model !== undefined) upsert.run("model", model);
  if (baseUrl !== undefined) upsert.run("baseUrl", baseUrl);
  if (supportsTools !== undefined) upsert.run("supportsTools", String(supportsTools));

  // Reinitialize provider
  aiProvider = initProvider();
  res.json({ ok: true, enabled: !!aiProvider, providerName: aiProvider?.providerName || "" });
});

// ===================== AI COACH =====================

const COACH_SYSTEM = `You are a knowledgeable strength training coach analyzing real workout data. The user's profile includes biometric data, training goals, experience level, injury notes, and nutrition targets — use all available context to personalize your advice. Give specific, evidence-based advice with exact numbers (weights, reps, sets). Be concise and actionable. Consider any injuries mentioned. Format with clear sections but keep it tight. No fluff.`;

app.post("/api/coach", requireAuth, async (req, res) => {
  if (!aiProvider) return res.status(503).json({ error: "AI coach unavailable — no provider configured" });
  const { prompt, context, history } = req.body;
  try {
    // Build multi-turn messages: context as first user message, then conversation history, then current question
    const messages = [];
    messages.push({ role: "user", content: `Here is my current training data and profile:\n\n${context}` });
    messages.push({ role: "assistant", content: "Got it — I have your training data, profile, programs, and PRs loaded. What would you like to know?" });

    // Include recent conversation history for multi-turn context (last 6 exchanges max)
    if (history && Array.isArray(history)) {
      const recentHistory = history.slice(-6);
      for (const msg of recentHistory) {
        if (msg.prompt) messages.push({ role: "user", content: msg.prompt });
        if (msg.response) messages.push({ role: "assistant", content: msg.response });
      }
    }

    messages.push({ role: "user", content: prompt });

    const result = await aiProvider.chat(COACH_SYSTEM, messages, { maxTokens: 1500 });
    trackEvent(req.user.id, "coach_chat");
    res.json({ response: result.text });
  } catch (e) {
    console.error("Coach error:", e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── Coach Message History ──

app.get("/api/coach/messages", requireAuth, (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 200, 500);
  const messages = db.prepare(
    "SELECT * FROM coach_messages WHERE user_id = ? ORDER BY created_at DESC LIMIT ?"
  ).all(req.user.id, limit).reverse();
  res.json(messages);
});

app.post("/api/coach/messages", requireAuth, (req, res) => {
  const { id, type, prompt, response } = req.body;
  if (!id) return res.status(400).json({ error: "id required" });
  db.prepare(
    "INSERT OR REPLACE INTO coach_messages (id, user_id, type, prompt, response) VALUES (?, ?, ?, ?, ?)"
  ).run(id, req.user.id, type || "chat", prompt || null, response || null);
  res.json({ ok: true });
});

app.delete("/api/coach/messages/:id", requireAuth, (req, res) => {
  db.prepare("DELETE FROM coach_messages WHERE id = ? AND user_id = ?").run(req.params.id, req.user.id);
  res.json({ ok: true });
});

app.delete("/api/coach/messages", requireAuth, (req, res) => {
  db.prepare("DELETE FROM coach_messages WHERE user_id = ?").run(req.user.id);
  res.json({ ok: true });
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

app.post("/api/coach/program", requireAuth, async (req, res) => {
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

      trackEvent(req.user.id, "coach_program_builder");
      res.json({
        program,
        unknownExercises: unknowns,
        commentary: result.text || null,
      });
    } else {
      // No tool call — return text response
      trackEvent(req.user.id, "coach_program_builder");
      res.json({ program: null, commentary: result.text || "Could not generate program. Try being more specific." });
    }
  } catch (e) {
    console.error("Program builder error:", e.message);
    res.status(500).json({ error: e.message });
  }
});

// ===================== AI SESSION ANALYSIS =====================

app.post("/api/coach/analyze", requireAuth, async (req, res) => {
  if (!aiProvider) return res.status(503).json({ error: "AI coach unavailable — no provider configured" });
  const { workout, context, workout_id } = req.body;

  const system = `You are a concise strength training coach providing a post-workout session analysis. Analyze the just-completed workout and give brief, specific feedback.

IMPORTANT: The "rpe" field in set data represents the user's chosen INTENSITY SCALE, which will be specified in the user context. If the user uses RIR (Reps In Reserve), then @1 means 1 rep left in the tank (NEAR MAXIMAL), @0 means absolute failure. If RPE (Rate of Perceived Exertion), @10 means maximal effort. Always interpret intensity values according to the specified scale.

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

    // Persist the review if workout_id provided
    if (workout_id && result.text) {
      db.prepare(
        "INSERT OR REPLACE INTO workout_reviews (id, workout_id, user_id, review) VALUES (?, ?, ?, ?)"
      ).run(genId(), workout_id, req.user.id, result.text);
    }

    trackEvent(req.user.id, "coach_analyze");
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

app.post("/api/coach/substitute", requireAuth, async (req, res) => {
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
      trackEvent(req.user.id, "coach_substitute", { exercise: exercise || null });
      res.json({ substitutions: subs, commentary: result.text || null });
    } else {
      trackEvent(req.user.id, "coach_substitute", { exercise: exercise || null });
      res.json({ substitutions: [], commentary: result.text || "Could not generate substitutions." });
    }
  } catch (e) {
    console.error("Substitute error:", e.message);
    res.status(500).json({ error: e.message });
  }
});

// ===================== AI WEEKLY REPORT =====================

app.post("/api/coach/weekly", requireAuth, async (req, res) => {
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
    trackEvent(req.user.id, "coach_weekly_report");
    res.json({ report: result.text });
  } catch (e) {
    console.error("Weekly report error:", e.message);
    res.status(500).json({ error: e.message });
  }
});

// ===================== EXPORT =====================

app.get("/api/export", requireAuth, (req, res) => {
  const workouts = db.prepare("SELECT * FROM workouts WHERE user_id = ? ORDER BY date ASC").all(req.user.id);
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
  res.setHeader("Content-Disposition", `attachment; filename=talos-export.csv`);
  res.send(lines.join("\n"));
});

// ── Analytics ──

// Frontend event tracking (fire-and-forget from client)
app.post("/api/analytics/event", requireAuth, (req, res) => {
  const { event, meta } = req.body;
  if (!event || typeof event !== "string") return res.status(400).json({ error: "Event name required" });
  trackEvent(req.user.id, event, meta || null);
  res.json({ ok: true });
});

// Admin analytics dashboard data
app.get("/api/admin/analytics", requireAuth, requireAdmin, (req, res) => {
  const { days = 30 } = req.query;
  const daysInt = Math.min(parseInt(days) || 30, 365);
  const since = new Date(Date.now() - daysInt * 86400000).toISOString();

  // Daily active users (users who logged at least one event or saved a workout)
  const dau = db.prepare(`
    SELECT date(created_at) as day, COUNT(DISTINCT user_id) as users
    FROM analytics_events
    WHERE created_at >= ?
    GROUP BY date(created_at)
    ORDER BY day DESC
  `).all(since);

  // Event counts by type
  const eventCounts = db.prepare(`
    SELECT event, COUNT(*) as count
    FROM analytics_events
    WHERE created_at >= ?
    GROUP BY event
    ORDER BY count DESC
  `).all(since);

  // Top users by activity
  const topUsers = db.prepare(`
    SELECT ae.user_id, u.name, u.email, COUNT(*) as events
    FROM analytics_events ae
    JOIN users u ON u.id = ae.user_id
    WHERE ae.created_at >= ?
    GROUP BY ae.user_id
    ORDER BY events DESC
    LIMIT 20
  `).all(since);

  // Workouts per user per week (from actual workout data)
  const workoutsPerWeek = db.prepare(`
    SELECT 
      strftime('%Y-W%W', date) as week,
      COUNT(*) as workouts,
      COUNT(DISTINCT user_id) as users,
      ROUND(CAST(COUNT(*) AS FLOAT) / MAX(1, COUNT(DISTINCT user_id)), 1) as per_user
    FROM workouts
    WHERE date >= date(?, '-0 days')
    GROUP BY week
    ORDER BY week DESC
  `).all(since.split("T")[0]);

  // User registration over time
  const registrations = db.prepare(`
    SELECT date(created_at) as day, COUNT(*) as signups
    FROM users
    WHERE created_at >= ?
    GROUP BY date(created_at)
    ORDER BY day DESC
  `).all(since);

  // Totals
  const totalUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE email IS NOT NULL").get();
  const totalWorkouts = db.prepare("SELECT COUNT(*) as count FROM workouts").get();
  const activeLastWeek = db.prepare(`
    SELECT COUNT(DISTINCT user_id) as count FROM workouts
    WHERE date >= date('now', '-7 days')
  `).get();
  const activeLastMonth = db.prepare(`
    SELECT COUNT(DISTINCT user_id) as count FROM workouts
    WHERE date >= date('now', '-30 days')
  `).get();

  // AI coach usage
  const coachUsage = db.prepare(`
    SELECT COUNT(*) as messages, COUNT(DISTINCT user_id) as users
    FROM coach_messages
    WHERE created_at >= ?
  `).all(since);

  // Feature adoption (recent event breakdown by user count)
  const featureAdoption = db.prepare(`
    SELECT event, COUNT(DISTINCT user_id) as users, COUNT(*) as total
    FROM analytics_events
    WHERE created_at >= ?
    GROUP BY event
    ORDER BY users DESC
  `).all(since);

  res.json({
    period: { days: daysInt, since },
    totals: {
      users: totalUsers.count,
      workouts: totalWorkouts.count,
      activeLastWeek: activeLastWeek.count,
      activeLastMonth: activeLastMonth.count,
    },
    dau,
    eventCounts,
    topUsers,
    workoutsPerWeek,
    registrations,
    coachUsage: coachUsage[0] || { messages: 0, users: 0 },
    featureAdoption,
  });
});

// Recent events stream (admin — for debugging)
app.get("/api/admin/analytics/events", requireAuth, requireAdmin, (req, res) => {
  const { limit = 100, event } = req.query;
  const limitInt = Math.min(parseInt(limit) || 100, 500);
  let rows;
  if (event) {
    rows = db.prepare(`
      SELECT ae.*, u.name, u.email
      FROM analytics_events ae JOIN users u ON u.id = ae.user_id
      WHERE ae.event = ?
      ORDER BY ae.created_at DESC LIMIT ?
    `).all(event, limitInt);
  } else {
    rows = db.prepare(`
      SELECT ae.*, u.name, u.email
      FROM analytics_events ae JOIN users u ON u.id = ae.user_id
      ORDER BY ae.created_at DESC LIMIT ?
    `).all(limitInt);
  }
  res.json(rows);
});

// Health (public — Railway uses this for health checks)
app.get("/api/health", (req, res) => {
  try {
    db.prepare("SELECT 1").get();
    res.json({ status: "ok", db: "connected" });
  } catch (e) {
    res.status(503).json({ status: "error", db: "disconnected" });
  }
});

// SPA fallback
if (process.env.NODE_ENV === "production") {
  app.get("*", (req, res) => res.sendFile(join(__dirname, "dist", "index.html")));
}

app.listen(PORT, "0.0.0.0", () => {
  const aiStatus = aiProvider ? `✅ ${aiProvider.providerName} (${aiProvider.modelName})` : "❌ Not configured";
  const authStatus = ADMIN_EMAIL ? `Admin: ${ADMIN_EMAIL}` : "No admin email set";
  console.log(`
┌────────────────────────────────────────┐
│                                        │
│   Δ TALOS                             │
│   Gym Tracker v3.0 (JWT Auth)          │
│                                        │
│   http://0.0.0.0:${String(PORT).padEnd(24)}│
│   DB: ${DB_PATH.padEnd(33)}│
│   AI: ${aiStatus.padEnd(33)}│
│   Users: ${String(db.prepare("SELECT COUNT(*) as c FROM users").get().c).padEnd(29)}│
│   Auth: ${authStatus.padEnd(30)}│
│                                        │
└────────────────────────────────────────┘`);
});

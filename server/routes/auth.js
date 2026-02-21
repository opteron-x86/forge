// ═══════════════════════════════════════════════════════════════
//  TALOS — Auth Routes
//  POST /api/auth/register, POST /api/auth/login, GET /api/auth/me,
//  POST /api/auth/forgot-password, POST /api/auth/reset-password,
//  PUT /api/auth/account
// ═══════════════════════════════════════════════════════════════

import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Resend } from "resend";
import { getDb, genId, trackEvent } from "../db.js";
import { signToken, requireAuth, rateLimit, handler } from "../middleware.js";

const router = Router();

// --- Constants ---
const BCRYPT_ROUNDS = 12;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || null;
const APP_URL = process.env.APP_URL || "https://talos.fit";

// --- Email (Resend) ---
const RESEND_API_KEY = process.env.RESEND_API_KEY || null;
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

// --- Rate limit: configurable via env, defaults to 10 per 15 minutes ---
const AUTH_RATE_MAX = parseInt(process.env.AUTH_RATE_LIMIT) || 10;
const authRateLimit = rateLimit(AUTH_RATE_MAX, 15 * 60 * 1000);

// ===================== REGISTER =====================

router.post("/register", authRateLimit, handler(async (req, res) => {
  const db = getDb();
  const { email, password, name, color } = req.body;
  if (!email?.trim()) return res.status(400).json({ error: "Email required" });
  if (!password || password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters" });
  if (!name?.trim()) return res.status(400).json({ error: "Name required" });

  const normalizedEmail = email.trim().toLowerCase();

  const existing = await db.get("SELECT id FROM users WHERE email = $1", [normalizedEmail]);
  if (existing) return res.status(409).json({ error: "Email already registered" });

  const id = genId();
  const passwordHash = bcrypt.hashSync(password, BCRYPT_ROUNDS);
  const role = (ADMIN_EMAIL && normalizedEmail === ADMIN_EMAIL.toLowerCase()) ? "admin" : "user";

  await db.run(
    "INSERT INTO users (id, name, email, password_hash, role, color, theme) VALUES ($1, $2, $3, $4, $5, $6, $7)",
    [id, name.trim(), normalizedEmail, passwordHash, role, color || "#f97316", "talos"]
  );
  await db.run("INSERT INTO profiles (user_id) VALUES ($1)", [id]);

  const user = { id, name: name.trim(), email: normalizedEmail, role, color: color || "#f97316", theme: "talos" };
  const token = signToken(user);
  trackEvent(id, "user_registered");
  res.json({ token, user });
}));

// ===================== LOGIN =====================

router.post("/login", authRateLimit, handler(async (req, res) => {
  const db = getDb();
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });

  const normalizedEmail = email.trim().toLowerCase();
  const user = await db.get(
    "SELECT id, name, email, password_hash, role, color, theme, is_active FROM users WHERE email = $1",
    [normalizedEmail]
  );

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
    user: { id: user.id, name: user.name, email: user.email, role: user.role, color: user.color, theme: user.theme },
  });
}));

// ===================== ME =====================

router.get("/me", requireAuth, handler(async (req, res) => {
  res.json({
    id: req.user.id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
    color: req.user.color,
    theme: req.user.theme,
  });
}));

// ===================== FORGOT PASSWORD =====================

router.post("/forgot-password", authRateLimit, handler(async (req, res) => {
  const db = getDb();
  const { email } = req.body;
  if (!email?.trim()) return res.status(400).json({ error: "Email required" });

  const normalizedEmail = email.trim().toLowerCase();
  const user = await db.get("SELECT id, name, email FROM users WHERE email = $1", [normalizedEmail]);

  // Always return success to prevent email enumeration
  if (!user || !resend) {
    return res.json({ message: "If that email exists, a reset link has been sent." });
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

  await db.run(
    "UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3",
    [resetTokenHash, expires, user.id]
  );

  // Send email
  const resetUrl = `${APP_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`;

  try {
    await resend.emails.send({
      from: "TALOS <noreply@talos.fit>",
      to: user.email,
      subject: "Reset your TALOS password",
      html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #c9973b;">Δ TALOS</h2>
          <p>Hey ${user.name},</p>
          <p>Click the link below to reset your password. This link expires in 1 hour.</p>
          <a href="${resetUrl}" style="display: inline-block; background: #c9973b; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Reset Password</a>
          <p style="color: #888; font-size: 12px; margin-top: 24px;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    });
  } catch (e) {
    console.error("Email send error:", e.message);
  }

  res.json({ message: "If that email exists, a reset link has been sent." });
}));

// ===================== RESET PASSWORD =====================

router.post("/reset-password", handler(async (req, res) => {
  const db = getDb();
  const { token, email, newPassword } = req.body;
  if (!token || !email || !newPassword) return res.status(400).json({ error: "All fields required" });
  if (newPassword.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters" });

  const normalizedEmail = email.trim().toLowerCase();
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const user = await db.get(
    "SELECT id, reset_token, reset_token_expires FROM users WHERE email = $1",
    [normalizedEmail]
  );

  if (!user || user.reset_token !== tokenHash) {
    return res.status(400).json({ error: "Invalid or expired reset link." });
  }
  if (new Date(user.reset_token_expires) < new Date()) {
    await db.run("UPDATE users SET reset_token = NULL, reset_token_expires = NULL WHERE id = $1", [user.id]);
    return res.status(400).json({ error: "Reset link has expired. Please request a new one." });
  }

  const passwordHash = bcrypt.hashSync(newPassword, BCRYPT_ROUNDS);
  await db.run(
    "UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2",
    [passwordHash, user.id]
  );

  res.json({ message: "Password has been reset. You can now sign in." });
}));

// ===================== ACCOUNT UPDATE =====================

router.put("/account", requireAuth, handler(async (req, res) => {
  const db = getDb();
  const { name, color, theme } = req.body;
  const sets = [];
  const vals = [];
  let paramIndex = 1;
  if (name !== undefined) { sets.push(`name = $${paramIndex++}`); vals.push(name.trim()); }
  if (color !== undefined) { sets.push(`color = $${paramIndex++}`); vals.push(color); }
  if (theme !== undefined) { sets.push(`theme = $${paramIndex++}`); vals.push(theme); }
  if (sets.length === 0) return res.json({ ok: true });
  vals.push(req.user.id);
  await db.run(`UPDATE users SET ${sets.join(", ")} WHERE id = $${paramIndex}`, vals);
  res.json({ ok: true });
}));

export default router;

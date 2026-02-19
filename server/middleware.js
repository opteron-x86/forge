// ═══════════════════════════════════════════════════════════════
//  TALOS — Middleware
//  Extracted from server.js monolith (Phase 2 audit, commit 7e055db)
//
//  Handles: JWT auth, admin guard, IP rate limiting, AI quota.
// ═══════════════════════════════════════════════════════════════

import jwt from "jsonwebtoken";
import crypto from "crypto";
import db from "./db.js";

// --- JWT Config ---
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString("hex");
const JWT_EXPIRES_IN = "7d";
if (!process.env.JWT_SECRET) {
  console.warn("⚠️  No JWT_SECRET set — using random secret (tokens won't survive restarts)");
}

// --- AI Quota Config ---
const AI_DAILY_LIMIT = parseInt(process.env.AI_DAILY_LIMIT) || 30;
const AI_MONTHLY_LIMIT = parseInt(process.env.AI_MONTHLY_LIMIT) || 500;

// ===================== JWT HELPERS =====================

export function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

// ===================== AUTH MIDDLEWARE =====================

/**
 * Require a valid JWT Bearer token.
 * Attaches req.user with { id, name, email, role, color, theme, is_active }.
 */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }
  try {
    const payload = verifyToken(header.slice(7));
    const user = db.prepare(
      "SELECT id, name, email, role, color, theme, is_active FROM users WHERE id = ?"
    ).get(payload.id);
    if (!user) return res.status(401).json({ error: "User not found" });
    if (!user.is_active) return res.status(403).json({ error: "Account deactivated" });
    req.user = user;
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

/**
 * Require admin role. Must be used after requireAuth.
 */
export function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

// ===================== RATE LIMITING =====================

/**
 * Simple in-memory IP-based rate limiter.
 * Returns Express middleware that allows `max` requests per `windowMs`.
 */
export function rateLimit(max, windowMs) {
  const hits = new Map();

  // Periodic cleanup to prevent memory leaks
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) {
      if (now - entry.start > windowMs) hits.delete(key);
    }
  }, windowMs);

  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    const entry = hits.get(key);

    if (!entry || now - entry.start > windowMs) {
      hits.set(key, { start: now, count: 1 });
      return next();
    }
    entry.count++;
    if (entry.count > max) {
      return res.status(429).json({ error: "Too many attempts. Try again later." });
    }
    next();
  };
}

// ===================== AI QUOTA =====================

/**
 * Check per-user AI rate limits (daily + monthly).
 * Returns { allowed, remaining, reason }.
 */
export function checkAIRateLimit(userId) {
  const today = new Date().toISOString().split("T")[0];
  const monthStart = today.slice(0, 7) + "-01";

  const dailyCount = db.prepare(`
    SELECT COUNT(*) as count FROM analytics_events
    WHERE user_id = ? AND event LIKE 'coach_%' AND created_at >= ?
  `).get(userId, today + "T00:00:00").count;

  const monthlyCount = db.prepare(`
    SELECT COUNT(*) as count FROM analytics_events
    WHERE user_id = ? AND event LIKE 'coach_%' AND created_at >= ?
  `).get(userId, monthStart + "T00:00:00").count;

  if (dailyCount >= AI_DAILY_LIMIT) {
    return { allowed: false, remaining: 0, reason: `Daily AI limit reached (${AI_DAILY_LIMIT}/day)` };
  }
  if (monthlyCount >= AI_MONTHLY_LIMIT) {
    return { allowed: false, remaining: 0, reason: `Monthly AI limit reached (${AI_MONTHLY_LIMIT}/month)` };
  }
  return { allowed: true, remaining: AI_DAILY_LIMIT - dailyCount };
}

/**
 * Express middleware that blocks requests if AI quota is exceeded.
 */
export function requireAIQuota(req, res, next) {
  const check = checkAIRateLimit(req.user.id);
  if (!check.allowed) {
    return res.status(429).json({ error: check.reason, remaining: 0 });
  }
  next();
}

// ===================== ROUTE ERROR WRAPPER =====================

/**
 * Wraps an async (or sync) route handler in try/catch.
 * Catches thrown errors and sends a 500 JSON response.
 * (Audit item #10: Wrap route handlers in try/catch)
 */
export function handler(fn) {
  return (req, res, next) => {
    try {
      const result = fn(req, res, next);
      // Handle async handlers (Promises)
      if (result && typeof result.catch === "function") {
        result.catch((err) => {
          console.error(`Route error [${req.method} ${req.path}]:`, err.message);
          if (!res.headersSent) {
            res.status(500).json({ error: "Internal server error" });
          }
        });
      }
    } catch (err) {
      console.error(`Route error [${req.method} ${req.path}]:`, err.message);
      if (!res.headersSent) {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  };
}

// Export quota limits for the /api/ai/quota endpoint
export { AI_DAILY_LIMIT, AI_MONTHLY_LIMIT };

// ═══════════════════════════════════════════════════════════════
//  TALOS — Middleware
//  Extracted from server.js monolith (Phase 2 audit, commit 7e055db)
//  + PostgreSQL migration: async database layer
//
//  Handles: JWT auth, admin guard, IP rate limiting, AI quota.
// ═══════════════════════════════════════════════════════════════

import jwt from "jsonwebtoken";
import crypto from "crypto";
import { getDb } from "./db.js";
import { getLimitsForTier } from "./ai-tier.js";

// --- JWT Config ---
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString("hex");
const JWT_EXPIRES_IN = "7d";
if (!process.env.JWT_SECRET) {
  console.warn("⚠️  No JWT_SECRET set — using random secret (tokens won't survive restarts)");
}

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
export async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }
  try {
    const payload = verifyToken(header.slice(7));
    const db = getDb();
    const user = await db.get(
      "SELECT id, name, email, role, tier, color, theme, is_active FROM users WHERE id = $1",
      [payload.id]
    );
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
 * Limits are determined by the user's tier.
 * Returns { allowed, remaining, reason }.
 */
export async function checkAIRateLimit(userId, tier = "free") {
  const db = getDb();
  const limits = getLimitsForTier(tier);
  const today = new Date().toISOString().split("T")[0];
  const monthStart = today.slice(0, 7) + "-01";

  const daily = await db.get(
    "SELECT COUNT(*) as count FROM analytics_events WHERE user_id = $1 AND event LIKE 'coach_%' AND created_at >= $2",
    [userId, today + "T00:00:00"]
  );

  const monthly = await db.get(
    "SELECT COUNT(*) as count FROM analytics_events WHERE user_id = $1 AND event LIKE 'coach_%' AND created_at >= $2",
    [userId, monthStart + "T00:00:00"]
  );

  if (daily.count >= limits.daily) {
    return { allowed: false, remaining: 0, reason: `Daily AI limit reached (${limits.daily}/day)` };
  }
  if (monthly.count >= limits.monthly) {
    return { allowed: false, remaining: 0, reason: `Monthly AI limit reached (${limits.monthly}/month)` };
  }
  return { allowed: true, remaining: limits.daily - daily.count, daily: limits.daily, monthly: limits.monthly };
}

/**
 * Express middleware that blocks requests if AI quota is exceeded.
 * Uses the user's tier to determine limits.
 */
export async function requireAIQuota(req, res, next) {
  try {
    const tier = req.user?.tier || "free";
    const check = await checkAIRateLimit(req.user.id, tier);
    if (!check.allowed) {
      return res.status(429).json({ error: check.reason, remaining: 0 });
    }
    next();
  } catch (e) {
    console.error("AI quota check error:", e.message);
    // Fail open — don't block the request if quota check fails
    next();
  }
}

/**
 * Express middleware that blocks requests from free-tier users.
 * Use after requireAuth. Returns 403 with upgrade prompt.
 */
export function requirePro(featureLabel = "This feature") {
  return (req, res, next) => {
    if (req.user?.tier === "pro") return next();
    return res.status(403).json({
      error: `${featureLabel} requires a Pro subscription`,
      upgrade: true,
    });
  };
}

// ===================== ROUTE ERROR WRAPPER =====================

/**
 * Wraps an async (or sync) route handler in try/catch.
 * Catches thrown errors and sends a 500 JSON response.
 */
export function handler(fn) {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (err) {
      console.error(`Route error [${req.method} ${req.path}]:`, err.message);
      if (!res.headersSent) {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  };
}

// ═══════════════════════════════════════════════════════════════
//  TALOS — Admin Routes
//  GET /api/admin/users, PUT /api/admin/users/:id/status,
//  DELETE /api/admin/users/:id, GET /api/admin/analytics,
//  GET /api/admin/analytics/events
// ═══════════════════════════════════════════════════════════════

import { Router } from "express";
import { getDb } from "../db.js";
import { requireAuth, requireAdmin, handler } from "../middleware.js";

const router = Router();

// ===================== USER MANAGEMENT =====================

// List all users (admin only)
router.get("/users", requireAuth, requireAdmin, handler(async (req, res) => {
  const db = getDb();
  const users = await db.all(
    "SELECT id, name, email, role, tier, color, is_active, created_at FROM users ORDER BY created_at ASC"
  );
  const enriched = [];
  for (const u of users) {
    const stats = await db.get("SELECT COUNT(*) as workouts FROM workouts WHERE user_id = $1", [u.id]);
    enriched.push({ ...u, workoutCount: stats.workouts });
  }
  res.json(enriched);
}));

// Set user tier (admin only)
router.put("/users/:id/tier", requireAuth, requireAdmin, handler(async (req, res) => {
  const db = getDb();
  const { tier } = req.body;
  if (!["free", "pro"].includes(tier)) return res.status(400).json({ error: "Tier must be 'free' or 'pro'" });
  await db.run("UPDATE users SET tier = $1 WHERE id = $2", [tier, req.params.id]);
  res.json({ ok: true, tier });
}));

// Deactivate / reactivate user (admin only)
router.put("/users/:id/status", requireAuth, requireAdmin, handler(async (req, res) => {
  const db = getDb();
  const { is_active } = req.body;
  if (req.params.id === req.user.id) return res.status(400).json({ error: "Cannot deactivate yourself" });
  await db.run("UPDATE users SET is_active = $1 WHERE id = $2", [!!is_active, req.params.id]);
  res.json({ ok: true });
}));

// Delete user and all data (admin only) — S9 fix: includes analytics_events
router.delete("/users/:id", requireAuth, requireAdmin, handler(async (req, res) => {
  const db = getDb();
  const id = req.params.id;
  if (id === req.user.id) return res.status(400).json({ error: "Cannot delete yourself" });
  await db.run("DELETE FROM workouts WHERE user_id = $1", [id]);
  await db.run("DELETE FROM workout_reviews WHERE user_id = $1", [id]);
  await db.run("DELETE FROM bio_history WHERE user_id = $1", [id]);
  await db.run("DELETE FROM profiles WHERE user_id = $1", [id]);
  await db.run("DELETE FROM programs WHERE user_id = $1", [id]);
  await db.run("DELETE FROM coach_messages WHERE user_id = $1", [id]);
  await db.run("DELETE FROM custom_exercises WHERE created_by = $1", [id]);
  await db.run("DELETE FROM analytics_events WHERE user_id = $1", [id]);
  await db.run("DELETE FROM users WHERE id = $1", [id]);
  res.json({ ok: true });
}));

// ===================== ANALYTICS DASHBOARD =====================

// Helper: dialect-aware SQL fragments
function sqlDialect(db) {
  const pg = db.type === "postgres";
  return {
    dateOf:       (col) => pg ? `DATE(${col})`                        : `date(${col})`,
    weekOf:       (col) => pg ? `to_char(${col}::date, 'IYYY-"W"IW')` : `strftime('%Y-W%W', ${col})`,
    daysAgo:      (n)   => pg ? `NOW() - INTERVAL '${n} days'`        : `date('now', '-${n} days')`,
    castFloat:    (col) => pg ? `${col}::FLOAT`                       : `CAST(${col} AS FLOAT)`,
  };
}

router.get("/analytics", requireAuth, requireAdmin, handler(async (req, res) => {
  const db = getDb();
  const sql = sqlDialect(db);
  const { days = 30 } = req.query;
  const daysInt = Math.min(parseInt(days) || 30, 365);
  const since = new Date(Date.now() - daysInt * 86400000).toISOString();
  const sinceDate = since.split("T")[0];

  // Daily active users
  const dau = await db.all(`
    SELECT ${sql.dateOf("created_at")} as day, COUNT(DISTINCT user_id) as users
    FROM analytics_events
    WHERE created_at >= $1
    GROUP BY ${sql.dateOf("created_at")}
    ORDER BY day DESC
  `, [since]);

  // Event counts by type
  const eventCounts = await db.all(`
    SELECT event, COUNT(*) as count
    FROM analytics_events
    WHERE created_at >= $1
    GROUP BY event
    ORDER BY count DESC
  `, [since]);

  // Top users by activity
  const topUsers = await db.all(`
    SELECT ae.user_id, u.name, u.email, COUNT(*) as events
    FROM analytics_events ae
    JOIN users u ON u.id = ae.user_id
    WHERE ae.created_at >= $1
    GROUP BY ae.user_id, u.name, u.email
    ORDER BY events DESC
    LIMIT 20
  `, [since]);

  // Workouts per user per week
  const workoutsPerWeek = await db.all(`
    SELECT
      ${sql.weekOf("date")} as week,
      COUNT(*) as workouts,
      COUNT(DISTINCT user_id) as users,
      ROUND(${sql.castFloat("COUNT(*)")} / MAX(1, COUNT(DISTINCT user_id)), 1) as per_user
    FROM workouts
    WHERE date >= $1
    GROUP BY ${sql.weekOf("date")}
    ORDER BY week DESC
  `, [sinceDate]);

  // User registration over time
  const registrations = await db.all(`
    SELECT ${sql.dateOf("created_at")} as day, COUNT(*) as signups
    FROM users
    WHERE created_at >= $1
    GROUP BY ${sql.dateOf("created_at")}
    ORDER BY day DESC
  `, [since]);

  // Totals
  const totalUsers = await db.get("SELECT COUNT(*) as count FROM users WHERE email IS NOT NULL");
  const totalWorkouts = await db.get("SELECT COUNT(*) as count FROM workouts");
  const activeLastWeek = await db.get(`
    SELECT COUNT(DISTINCT user_id) as count FROM workouts
    WHERE date >= ${sql.daysAgo(7)}
  `);
  const activeLastMonth = await db.get(`
    SELECT COUNT(DISTINCT user_id) as count FROM workouts
    WHERE date >= ${sql.daysAgo(30)}
  `);

  // AI coach usage
  const coachUsage = await db.all(`
    SELECT COUNT(*) as messages, COUNT(DISTINCT user_id) as users
    FROM coach_messages
    WHERE created_at >= $1
  `, [since]);

  // Feature adoption
  const featureAdoption = await db.all(`
    SELECT event, COUNT(DISTINCT user_id) as users, COUNT(*) as total
    FROM analytics_events
    WHERE created_at >= $1
    GROUP BY event
    ORDER BY users DESC
  `, [since]);

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
}));

// Recent events stream (admin — for debugging)
router.get("/analytics/events", requireAuth, requireAdmin, handler(async (req, res) => {
  const db = getDb();
  const { limit = 100, event } = req.query;
  const limitInt = Math.min(parseInt(limit) || 100, 500);
  let rows;
  if (event) {
    rows = await db.all(`
      SELECT ae.*, u.name, u.email
      FROM analytics_events ae JOIN users u ON u.id = ae.user_id
      WHERE ae.event = $1
      ORDER BY ae.created_at DESC LIMIT $2
    `, [event, limitInt]);
  } else {
    rows = await db.all(`
      SELECT ae.*, u.name, u.email
      FROM analytics_events ae JOIN users u ON u.id = ae.user_id
      ORDER BY ae.created_at DESC LIMIT $1
    `, [limitInt]);
  }
  res.json(rows);
}));

export default router;

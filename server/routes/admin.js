// ═══════════════════════════════════════════════════════════════
//  TALOS — Admin Routes
//  GET /api/admin/users, PUT /api/admin/users/:id/status,
//  DELETE /api/admin/users/:id, GET /api/admin/analytics,
//  GET /api/admin/analytics/events
// ═══════════════════════════════════════════════════════════════

import { Router } from "express";
import db from "../db.js";
import { requireAuth, requireAdmin, handler } from "../middleware.js";

const router = Router();

// ===================== USER MANAGEMENT =====================

// List all users (admin only)
router.get("/users", requireAuth, requireAdmin, handler((req, res) => {
  const users = db.prepare(
    "SELECT id, name, email, role, color, is_active, created_at FROM users ORDER BY created_at ASC"
  ).all();
  const enriched = users.map(u => {
    const stats = db.prepare("SELECT COUNT(*) as workouts FROM workouts WHERE user_id = ?").get(u.id);
    return { ...u, workoutCount: stats.workouts };
  });
  res.json(enriched);
}));

// Deactivate / reactivate user (admin only)
router.put("/users/:id/status", requireAuth, requireAdmin, handler((req, res) => {
  const { is_active } = req.body;
  if (req.params.id === req.user.id) return res.status(400).json({ error: "Cannot deactivate yourself" });
  db.prepare("UPDATE users SET is_active = ? WHERE id = ?").run(is_active ? 1 : 0, req.params.id);
  res.json({ ok: true });
}));

// Delete user and all data (admin only) — S9 fix: includes analytics_events
router.delete("/users/:id", requireAuth, requireAdmin, handler((req, res) => {
  const id = req.params.id;
  if (id === req.user.id) return res.status(400).json({ error: "Cannot delete yourself" });
  db.prepare("DELETE FROM workouts WHERE user_id = ?").run(id);
  db.prepare("DELETE FROM workout_reviews WHERE user_id = ?").run(id);
  db.prepare("DELETE FROM bio_history WHERE user_id = ?").run(id);
  db.prepare("DELETE FROM profiles WHERE user_id = ?").run(id);
  db.prepare("DELETE FROM programs WHERE user_id = ?").run(id);
  db.prepare("DELETE FROM coach_messages WHERE user_id = ?").run(id);
  db.prepare("DELETE FROM custom_exercises WHERE created_by = ?").run(id);
  db.prepare("DELETE FROM analytics_events WHERE user_id = ?").run(id);
  db.prepare("DELETE FROM users WHERE id = ?").run(id);
  res.json({ ok: true });
}));

// ===================== ANALYTICS DASHBOARD =====================

router.get("/analytics", requireAuth, requireAdmin, handler((req, res) => {
  const { days = 30 } = req.query;
  const daysInt = Math.min(parseInt(days) || 30, 365);
  const since = new Date(Date.now() - daysInt * 86400000).toISOString();

  // Daily active users
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

  // Workouts per user per week
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

  // Feature adoption
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
}));

// Recent events stream (admin — for debugging)
router.get("/analytics/events", requireAuth, requireAdmin, handler((req, res) => {
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
}));

export default router;

// ═══════════════════════════════════════════════════════════════
//  TALOS — Export Routes
//  GET /api/export
// ═══════════════════════════════════════════════════════════════

import { Router } from "express";
import { getDb } from "../db.js";
import { requireAuth, handler } from "../middleware.js";

const router = Router();

router.get("/", requireAuth, handler(async (req, res) => {
  const db = getDb();
  const workouts = await db.all(
    "SELECT * FROM workouts WHERE user_id = $1 ORDER BY date ASC",
    [req.user.id]
  );

  // Build CSV
  const rows = [["Date", "Day", "Exercise", "Set", "Weight", "Reps", "RPE", "Notes", "Duration", "Feel"]];

  for (const w of workouts) {
    // Cross-compat: SQLite returns string, PG returns parsed object
    const exercises = typeof w.exercises === "string" ? JSON.parse(w.exercises || "[]") : (w.exercises || []);
    if (exercises.length === 0) {
      rows.push([w.date, w.day_label || "", "", "", "", "", "", w.notes || "", w.duration || "", w.feel || ""]);
    } else {
      for (const ex of exercises) {
        const sets = ex.sets || [];
        if (sets.length === 0) {
          rows.push([w.date, w.day_label || "", ex.name || "", "", "", "", "", w.notes || "", w.duration || "", w.feel || ""]);
        } else {
          for (let i = 0; i < sets.length; i++) {
            const s = sets[i];
            rows.push([
              w.date, w.day_label || "", ex.name || "",
              i + 1, s.weight || "", s.reps || "", s.rpe || "",
              i === 0 ? (w.notes || "") : "", // Notes only on first set
              i === 0 ? (w.duration || "") : "",
              i === 0 ? (w.feel || "") : "",
            ]);
          }
        }
      }
    }
  }

  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename=talos-export-${new Date().toISOString().split("T")[0]}.csv`);
  res.send(csv);
}));

export default router;

// ═══════════════════════ STATS PAGE ═══════════════════════
// Extracted from App.jsx — StatsPage function
//
// Features: Profile editing (biometrics), exercise progress charts (Recharts),
// PR dashboard (big 4 lifts), all PRs list, streak tracking, CSV export

import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useTalos } from "../context/TalosContext";
import { est1RM } from "../lib/helpers";
import S from "../lib/styles";

export default function StatsPage() {
  const { workouts, profile, updateProfile, user } = useTalos();
  const [editing, setEditing] = useState(false);
  const [tmp, setTmp] = useState({});
  const [chartExercise, setChartExercise] = useState("Bench Press");

  // ── PRs ──
  const prs = {};
  workouts.forEach((w) =>
    w.exercises?.forEach((ex) =>
      ex.sets?.forEach((s) => {
        if (!s.weight || !s.reps) return;
        const e = est1RM(s.weight, s.reps);
        if (!prs[ex.name] || (e && e > (prs[ex.name].e1rm || 0))) {
          prs[ex.name] = { weight: s.weight, reps: s.reps, e1rm: e, date: w.date };
        }
      }),
    ),
  );
  const prList = Object.entries(prs).sort(
    (a, b) => (b[1].e1rm || 0) - (a[1].e1rm || 0),
  );

  // MIGRATION NOTE: Copy from App.jsx StatsPage:
  // - Streak calculation logic (dates, streak, maxStreak, tempStreak)
  // - Chart data computation for the selected exercise
  // - Profile editing (tmp state, save handler)
  // - Big 4 PR cards, all PRs list, progress chart, export button
  // - The full return JSX

  return (
    <div className="fade-in">
      {/* TODO: Copy JSX from App.jsx StatsPage */}
      <div style={{ ...S.card, textAlign: "center", color: "#525252" }}>
        StatsPage — paste JSX from App.jsx
      </div>
    </div>
  );
}

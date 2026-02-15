// ═══════════════════════ HISTORY PAGE ═══════════════════════
// Extracted from App.jsx — HistoryPage function
//
// Features: Calendar view, workout list with expand/collapse,
// date filtering, program/day filtering, workout details, delete

import { useState } from "react";
import { useTalos } from "../context/TalosContext";
import { fmtDate, getDayColor } from "../lib/helpers";
import S from "../lib/styles";

export default function HistoryPage() {
  const { workouts, programs, deleteWorkout } = useTalos();
  const [expanded, setExpanded] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [filterProgram, setFilterProgram] = useState("all");
  const [filterDay, setFilterDay] = useState("all");

  // Calendar state
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());

  // MIGRATION NOTE: Copy the full HistoryPage body from App.jsx including:
  // - workoutsByDate lookup, calendar helpers (daysInMonth, firstDow, monthLabel)
  // - prevMonth, nextMonth, goToToday functions
  // - Filtering logic (filtered list, filteredDays)
  // - The full return JSX (calendar grid, filter bar, workout list with expand)

  return (
    <div className="fade-in">
      {/* TODO: Copy JSX from App.jsx HistoryPage */}
      <div style={{ ...S.card, textAlign: "center", color: "#525252" }}>
        HistoryPage — paste JSX from App.jsx
      </div>
    </div>
  );
}

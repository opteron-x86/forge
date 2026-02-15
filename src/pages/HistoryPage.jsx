// ═══════════════════════ HISTORY PAGE ═══════════════════════
// Extracted from App.jsx — HistoryPage function + color helpers

import { useState } from "react";
import { useTalos } from "../context/TalosContext";
import { fmtDate, FEEL } from "../lib/helpers";
import S from "../lib/styles";

// Color mapping for workout types
const DAY_COLORS = {
  push: "#c9952d",
  pull: "#3b82f6",
  leg: "#10b981",
  legs: "#10b981",
};
function getDayColor(label) {
  if (!label) return "#737373";
  const l = label.toLowerCase();
  for (const [key, color] of Object.entries(DAY_COLORS)) {
    if (l.includes(key)) return color;
  }
  return "#8b5cf6";
}

export default function HistoryPage() {
  const { workouts, programs, deleteWorkout, editWorkout } = useTalos();
  const [expanded, setExpanded] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [filterProgram, setFilterProgram] = useState("all");
  const [filterDay, setFilterDay] = useState("all");

  // Calendar state
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());

  // Build workout lookup by date
  const workoutsByDate = {};
  workouts.forEach(w => {
    if (!workoutsByDate[w.date]) workoutsByDate[w.date] = [];
    workoutsByDate[w.date].push(w);
  });

  // Calendar helpers
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDow = new Date(calYear, calMonth, 1).getDay();
  const monthLabel = new Date(calYear, calMonth).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  function prevMonth() {
    if (calMonth === 0) { setCalYear(calYear - 1); setCalMonth(11); }
    else setCalMonth(calMonth - 1);
    setSelectedDate(null);
  }
  function nextMonth() {
    if (calMonth === 11) { setCalYear(calYear + 1); setCalMonth(0); }
    else setCalMonth(calMonth + 1);
    setSelectedDate(null);
  }
  function goToToday() {
    setCalYear(today.getFullYear());
    setCalMonth(today.getMonth());
    setSelectedDate(null);
  }

  // Build filtered list
  let filtered = [...workouts];
  if (selectedDate) {
    filtered = filtered.filter(w => w.date === selectedDate);
  }
  if (filterProgram !== "all") {
    filtered = filtered.filter(w => w.program_id === filterProgram);
  }
  if (filterDay !== "all") {
    filtered = filtered.filter(w => w.day_id === filterDay);
  }
  filtered = filtered.reverse();

  // Days available for the selected program filter
  const filteredDays = filterProgram === "all"
    ? [...new Map(programs.flatMap(p => p.days?.map(d => [d.id, d]) || [])).values()]
    : (programs.find(p => p.id === filterProgram)?.days || []);

  // Stats for the visible month
  const monthWorkouts = workouts.filter(w => {
    const d = new Date(w.date + "T12:00:00");
    return d.getFullYear() === calYear && d.getMonth() === calMonth;
  });
  const monthVol = monthWorkouts.reduce((a, w) => a + (w.exercises?.reduce((b, e) => b + (e.sets?.reduce((c, s) => c + ((s.weight || 0) * (s.reps || 0)), 0) || 0), 0) || 0), 0);

  return (
    <div className="fade-in">
      {/* Calendar */}
      <div style={S.card}>
        {/* Month nav */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <button onClick={prevMonth} style={{ ...S.sm(), padding: "6px 10px" }}>◀</button>
          <div onClick={goToToday} style={{ cursor: "pointer", textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#fafafa" }}>{monthLabel}</div>
            <div style={{ fontSize: 10, color: "#525252", marginTop: 2 }}>{monthWorkouts.length} sessions · {monthVol >= 1000 ? `${Math.round(monthVol / 1000)}k` : monthVol} lbs</div>
          </div>
          <button onClick={nextMonth} style={{ ...S.sm(), padding: "6px 10px" }}>▶</button>
        </div>

        {/* Day-of-week headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div key={i} style={{ textAlign: "center", fontSize: 9, color: "#525252", fontWeight: 700, padding: "2px 0" }}>{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
          {Array.from({ length: firstDow }).map((_, i) => <div key={`e${i}`} />)}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
            const dayWorkouts = workoutsByDate[dateStr] || [];
            const isToday = dateStr === today.toISOString().split("T")[0];
            const isSelected = dateStr === selectedDate;
            const hasFuture = new Date(dateStr + "T12:00:00") > today;

            return (
              <div key={dayNum} onClick={() => {
                if (dayWorkouts.length > 0) setSelectedDate(isSelected ? null : dateStr);
              }}
                style={{
                  textAlign: "center", padding: "6px 2px", borderRadius: 6, cursor: dayWorkouts.length > 0 ? "pointer" : "default",
                  background: isSelected ? "#262626" : "transparent",
                  border: isToday ? "1px solid #c9952d" : "1px solid transparent",
                  opacity: hasFuture ? 0.3 : 1,
                  minHeight: 36, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3,
                }}>
                <div style={{ fontSize: 11, color: isToday ? "#c9952d" : dayWorkouts.length > 0 ? "#fafafa" : "#404040", fontWeight: isToday || dayWorkouts.length > 0 ? 700 : 400 }}>
                  {dayNum}
                </div>
                {dayWorkouts.length > 0 && (
                  <div style={{ display: "flex", gap: 2, justifyContent: "center" }}>
                    {dayWorkouts.slice(0, 3).map((w, wi) => (
                      <div key={wi} style={{ width: 5, height: 5, borderRadius: "50%", background: getDayColor(w.day_label) }} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 10, flexWrap: "wrap" }}>
          {Object.entries(DAY_COLORS).filter(([k]) => k !== "legs").map(([label, color]) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
              <span style={{ fontSize: 9, color: "#525252", textTransform: "capitalize" }}>{label}</span>
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#8b5cf6" }} />
            <span style={{ fontSize: 9, color: "#525252" }}>Other</span>
          </div>
        </div>
      </div>

      {/* Selected date detail */}
      {selectedDate && workoutsByDate[selectedDate] && (
        <div style={{ padding: "4px 16px 0" }}>
          <div style={S.label}>{fmtDate(selectedDate)}</div>
        </div>
      )}

      {/* Filters (when no date selected) */}
      {!selectedDate && (
        <div style={{ padding: "4px 16px 8px", display: "flex", gap: 6 }}>
          <select value={filterProgram} onChange={e => { setFilterProgram(e.target.value); setFilterDay("all"); }}
            style={{ ...S.sm(), padding: "4px 6px", background: "#1a1a1a", color: "#a3a3a3", border: "1px solid #333", borderRadius: 4, fontSize: 10, fontFamily: "inherit" }}>
            <option value="all">All Programs</option>
            {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          {filteredDays.length > 0 && (
            <select value={filterDay} onChange={e => setFilterDay(e.target.value)}
              style={{ ...S.sm(), padding: "4px 6px", background: "#1a1a1a", color: "#a3a3a3", border: "1px solid #333", borderRadius: 4, fontSize: 10, fontFamily: "inherit" }}>
              <option value="all">All Days</option>
              {filteredDays.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
            </select>
          )}
          {(filterProgram !== "all" || filterDay !== "all") && (
            <button onClick={() => { setFilterProgram("all"); setFilterDay("all"); }} style={S.sm()}>Clear</button>
          )}
        </div>
      )}

      {/* Workout list */}
      {filtered.length === 0 && <div style={{ padding: 32, textAlign: "center", color: "#525252", fontSize: 13 }}>{selectedDate ? "No workouts this day." : "No workouts yet."}</div>}
      {filtered.map(w => {
        const isExp = expanded === w.id;
        const vol = w.exercises?.reduce((a, e) => a + (e.sets?.reduce((b, s) => b + ((s.weight || 0) * (s.reps || 0)), 0) || 0), 0) || 0;
        const sets = w.exercises?.reduce((a, e) => a + (e.sets?.length || 0), 0) || 0;
        return (
          <div key={w.id} style={{ ...S.card, borderLeft: `3px solid ${getDayColor(w.day_label)}` }}>
            <div onClick={() => setExpanded(isExp ? null : w.id)} style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#fafafa" }}>{w.day_label || "Workout"}</span>
                  <span style={S.tag(FEEL[w.feel - 1]?.c || "#737373")}>{FEEL[w.feel - 1]?.l || "—"}</span>
                </div>
                <div style={{ fontSize: 11, color: "#525252", marginTop: 3 }}>
                  {selectedDate ? (w.duration ? `${w.duration}min` : "") : fmtDate(w.date)}
                  {!selectedDate && w.duration ? ` · ${w.duration}min` : ""}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: "#a3a3a3" }}>{sets} sets</div>
                <div style={{ fontSize: 10, color: "#525252" }}>{vol >= 1000 ? `${Math.round(vol / 1000)}k` : vol.toLocaleString()} lbs</div>
              </div>
            </div>
            {isExp && (
              <div style={{ marginTop: 12, borderTop: "1px solid #262626", paddingTop: 12 }}>
                {w.exercises?.map((ex, i) => (
                  <div key={i} style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#d4d4d4" }}>{ex.name}</div>
                    <div style={{ fontSize: 11, color: "#737373", marginTop: 2 }}>{ex.sets?.map(s => `${s.weight}×${s.reps}${s.rpe ? ` @${s.rpe}` : ""}`).join("  ·  ")}</div>
                    {ex.notes && <div style={{ fontSize: 10, color: "#c9952d", marginTop: 1 }}>{ex.notes}</div>}
                  </div>
                ))}
                {w.notes && <div style={{ fontSize: 11, color: "#737373", marginTop: 8, fontStyle: "italic" }}>{w.notes}</div>}
                {w.duration && <div style={{ fontSize: 10, color: "#525252", marginTop: 6 }}>Duration: {w.duration}min</div>}
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button onClick={() => editWorkout(w)} style={{ ...S.sm("ghost"), flex: 1 }}>Edit</button>
                  <button onClick={() => deleteWorkout(w.id)} style={{ ...S.sm("danger"), flex: 1 }}>Delete</button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Back to all button when date is selected */}
      {selectedDate && (
        <div style={{ padding: "8px 16px" }}>
          <button onClick={() => setSelectedDate(null)} style={{ ...S.btn("ghost"), display: "block", width: "100%", textAlign: "center" }}>
            Show All History
          </button>
        </div>
      )}
    </div>
  );
}

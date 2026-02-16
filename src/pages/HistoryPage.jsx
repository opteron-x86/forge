// ═══════════════════════ HISTORY PAGE ═══════════════════════
// Calendar view with recent workouts. Tapping a date filters to
// that day. Generic color system derived from day labels — works
// for any program structure, not just push/pull/legs.

import { useState, useMemo } from "react";
import { useTalos } from "../context/TalosContext";
import { fmtDate, FEEL } from "../lib/helpers";
import S from "../lib/styles";

// ── Generic color palette ──
// 8 visually distinct colors that work on dark backgrounds.
// Day labels are hashed to an index for consistent color assignment.
const PALETTE = [
  "#c9952d", // bronze/gold
  "#3b82f6", // blue
  "#10b981", // emerald
  "#8b5cf6", // violet
  "#f97316", // orange
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#84cc16", // lime
];

function hashLabel(label) {
  if (!label) return 0;
  let h = 0;
  for (let i = 0; i < label.length; i++) {
    h = ((h << 5) - h + label.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function getDayColor(label) {
  if (!label) return "#737373";
  return PALETTE[hashLabel(label) % PALETTE.length];
}

// How many recent workouts to show by default
const RECENT_COUNT = 5;
const LOAD_MORE_COUNT = 10;

export default function HistoryPage({ onLogPast }) {
  const { workouts, programs, deleteWorkout, editWorkout } = useTalos();
  const [expanded, setExpanded] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [visibleCount, setVisibleCount] = useState(RECENT_COUNT);
  const [showFilters, setShowFilters] = useState(false);
  const [filterProgram, setFilterProgram] = useState("all");
  const [filterDay, setFilterDay] = useState("all");

  // Calendar state
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());

  // Build workout lookup by date
  const workoutsByDate = useMemo(() => {
    const map = {};
    workouts.forEach(w => {
      if (!map[w.date]) map[w.date] = [];
      map[w.date].push(w);
    });
    return map;
  }, [workouts]);

  // Build color legend dynamically from workouts visible in current month
  const monthWorkouts = useMemo(() =>
    workouts.filter(w => {
      const d = new Date(w.date + "T12:00:00");
      return d.getFullYear() === calYear && d.getMonth() === calMonth;
    }),
  [workouts, calYear, calMonth]);

  // Unique labels in this month (for optional legend)
  const monthLabels = useMemo(() => {
    const labels = new Map();
    monthWorkouts.forEach(w => {
      const label = w.day_label || "Workout";
      if (!labels.has(label)) labels.set(label, getDayColor(w.day_label));
    });
    return labels;
  }, [monthWorkouts]);

  // Calendar helpers
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDow = new Date(calYear, calMonth, 1).getDay();
  const monthLabel = new Date(calYear, calMonth).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const monthVol = monthWorkouts.reduce((a, w) =>
    a + (w.exercises?.reduce((b, e) =>
      b + (e.sets?.reduce((c, s) => c + ((s.weight || 0) * (s.reps || 0)), 0) || 0), 0) || 0), 0);
  const monthAvgFeel = monthWorkouts.length > 0
    ? (monthWorkouts.reduce((a, w) => a + (w.feel || 3), 0) / monthWorkouts.length).toFixed(1)
    : null;

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

  function selectDate(dateStr) {
    if (dateStr === selectedDate) {
      setSelectedDate(null);
    } else {
      setSelectedDate(dateStr);
      setShowAllHistory(false);
    }
  }

  // ── Build the workout list ──
  let displayWorkouts;
  let listHeading;

  if (selectedDate) {
    // Date tapped: show that day's workouts
    displayWorkouts = (workoutsByDate[selectedDate] || []).slice().reverse();
    listHeading = fmtDate(selectedDate);
  } else if (showAllHistory) {
    // "View all" mode with filters
    let filtered = [...workouts];
    if (filterProgram !== "all") {
      filtered = filtered.filter(w => w.program_id === filterProgram);
    }
    if (filterDay !== "all") {
      filtered = filtered.filter(w => w.day_id === filterDay);
    }
    displayWorkouts = filtered.reverse().slice(0, visibleCount);
    listHeading = "All History";
  } else {
    // Default: recent workouts only
    displayWorkouts = [...workouts].reverse().slice(0, RECENT_COUNT);
    listHeading = "Recent";
  }

  // Days available for the selected program filter
  const filteredDays = filterProgram === "all"
    ? [...new Map(programs.flatMap(p => p.days?.map(d => [d.id, d]) || [])).values()]
    : (programs.find(p => p.id === filterProgram)?.days || []);

  const totalFiltered = (() => {
    if (!showAllHistory) return workouts.length;
    let f = [...workouts];
    if (filterProgram !== "all") f = f.filter(w => w.program_id === filterProgram);
    if (filterDay !== "all") f = f.filter(w => w.day_id === filterDay);
    return f.length;
  })();

  return (
    <div className="fade-in">
      {/* ── Calendar ── */}
      <div style={S.card}>
        {/* Month nav */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <button onClick={prevMonth} style={{ ...S.sm(), padding: "6px 10px" }}>◀</button>
          <div onClick={goToToday} style={{ cursor: "pointer", textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#fafafa" }}>{monthLabel}</div>
            <div style={{ fontSize: 10, color: "#525252", marginTop: 2 }}>
              {monthWorkouts.length} session{monthWorkouts.length !== 1 ? "s" : ""}
              {monthVol > 0 && ` · ${monthVol >= 1000 ? `${Math.round(monthVol / 1000)}k` : monthVol} lbs`}
              {monthAvgFeel && ` · ${monthAvgFeel} feel`}
            </div>
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
                if (dayWorkouts.length > 0) selectDate(dateStr);
                else if (!hasFuture && onLogPast) onLogPast(dateStr);
              }}
                style={{
                  textAlign: "center", padding: "6px 2px", borderRadius: 6, cursor: hasFuture ? "default" : "pointer",
                  background: isSelected ? "#262626" : "transparent",
                  border: isToday ? "1px solid #c9952d" : "1px solid transparent",
                  opacity: hasFuture ? 0.3 : 1,
                  minHeight: 36, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3,
                  transition: "background 0.15s",
                }}>
                <div style={{
                  fontSize: 11,
                  color: isToday ? "#c9952d" : dayWorkouts.length > 0 ? "#fafafa" : "#404040",
                  fontWeight: isToday || dayWorkouts.length > 0 ? 700 : 400,
                }}>
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

        {/* Dynamic legend — only when 2+ unique labels this month */}
        {monthLabels.size >= 2 && (
          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 10, flexWrap: "wrap" }}>
            {[...monthLabels.entries()].map(([label, color]) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
                <span style={{ fontSize: 9, color: "#525252" }}>{label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Log Past Workout ── */}
      {onLogPast && (
        <div style={{ padding: "0 16px" }}>
          <button
            onClick={() => onLogPast(null)}
            style={{ ...S.btn("ghost"), width: "100%", textAlign: "center", fontSize: 11 }}
          >
            + Log Past Workout
          </button>
        </div>
      )}

      {/* ── Section Header ── */}
      <div style={{ padding: "8px 16px 4px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={S.label}>{listHeading}</div>
        <div style={{ display: "flex", gap: 6 }}>
          {selectedDate && (
            <button onClick={() => setSelectedDate(null)} style={{ ...S.sm("ghost"), fontSize: 9, padding: "3px 6px" }}>
              Clear
            </button>
          )}
          {!selectedDate && showAllHistory && programs.length > 0 && (
            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{ ...S.sm(showFilters ? "primary" : "ghost"), fontSize: 9, padding: "3px 6px" }}
            >
              Filter
            </button>
          )}
        </div>
      </div>

      {/* ── Filters (all history mode only) ── */}
      {showAllHistory && !selectedDate && showFilters && (
        <div style={{ padding: "0 16px 8px", display: "flex", gap: 6, flexWrap: "wrap" }}>
          <select value={filterProgram} onChange={e => { setFilterProgram(e.target.value); setFilterDay("all"); setVisibleCount(LOAD_MORE_COUNT); }}
            style={{ ...S.sm(), padding: "4px 6px", background: "#1a1a1a", color: "#a3a3a3", border: "1px solid #333", borderRadius: 4, fontSize: 10, fontFamily: "inherit" }}>
            <option value="all">All Programs</option>
            {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          {filteredDays.length > 0 && (
            <select value={filterDay} onChange={e => { setFilterDay(e.target.value); setVisibleCount(LOAD_MORE_COUNT); }}
              style={{ ...S.sm(), padding: "4px 6px", background: "#1a1a1a", color: "#a3a3a3", border: "1px solid #333", borderRadius: 4, fontSize: 10, fontFamily: "inherit" }}>
              <option value="all">All Days</option>
              {filteredDays.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
            </select>
          )}
          {(filterProgram !== "all" || filterDay !== "all") && (
            <button onClick={() => { setFilterProgram("all"); setFilterDay("all"); }} style={{ ...S.sm(), fontSize: 9 }}>Clear</button>
          )}
        </div>
      )}

      {/* ── Workout list ── */}
      {displayWorkouts.length === 0 && (
        <div style={{ padding: 32, textAlign: "center", color: "#525252", fontSize: 13 }}>
          {selectedDate ? "No workouts on this day." : "No workouts logged yet."}
        </div>
      )}
      {displayWorkouts.map(w => {
        const isExp = expanded === w.id;
        const vol = w.exercises?.reduce((a, e) => a + (e.sets?.reduce((b, s) => b + ((s.weight || 0) * (s.reps || 0)), 0) || 0), 0) || 0;
        const sets = w.exercises?.reduce((a, e) => a + (e.sets?.length || 0), 0) || 0;
        const exerciseCount = w.exercises?.length || 0;
        return (
          <div key={w.id} style={{ ...S.card, borderLeft: `3px solid ${getDayColor(w.day_label)}` }}>
            <div onClick={() => setExpanded(isExp ? null : w.id)} style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#fafafa" }}>{w.day_label || "Workout"}</span>
                  <span style={S.tag(FEEL[w.feel - 1]?.c || "#737373")}>{FEEL[w.feel - 1]?.l || "—"}</span>
                </div>
                <div style={{ fontSize: 11, color: "#525252", marginTop: 3 }}>
                  {selectedDate ? "" : fmtDate(w.date)}
                  {w.duration ? `${selectedDate ? "" : " · "}${w.duration}min` : ""}
                  {exerciseCount > 0 && ` · ${exerciseCount} exercise${exerciseCount !== 1 ? "s" : ""}`}
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
                {w.sleepHours && <div style={{ fontSize: 10, color: "#525252", marginTop: 4 }}>Sleep: {w.sleepHours}h</div>}
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button onClick={() => editWorkout(w)} style={{ ...S.sm("ghost"), flex: 1 }}>Edit</button>
                  <button onClick={() => deleteWorkout(w.id)} style={{ ...S.sm("danger"), flex: 1 }}>Delete</button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* ── Bottom actions ── */}
      <div style={{ padding: "4px 16px 8px", display: "flex", flexDirection: "column", gap: 6 }}>
        {/* Show more (all history mode) */}
        {showAllHistory && !selectedDate && visibleCount < totalFiltered && (
          <button
            onClick={() => setVisibleCount(prev => prev + LOAD_MORE_COUNT)}
            style={{ ...S.btn("ghost"), width: "100%", textAlign: "center" }}
          >
            Show more ({totalFiltered - visibleCount} remaining)
          </button>
        )}

        {/* Toggle between recent / all history */}
        {!selectedDate && workouts.length > RECENT_COUNT && (
          <button
            onClick={() => {
              setShowAllHistory(!showAllHistory);
              setVisibleCount(LOAD_MORE_COUNT);
              setFilterProgram("all");
              setFilterDay("all");
              setShowFilters(false);
            }}
            style={{ ...S.btn("ghost"), width: "100%", textAlign: "center" }}
          >
            {showAllHistory ? "Show Recent Only" : `View All History (${workouts.length})`}
          </button>
        )}
      </div>
    </div>
  );
}

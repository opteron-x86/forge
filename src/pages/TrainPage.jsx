// ═══════════════════════ TRAIN PAGE ═══════════════════════
// Dashboard + workout launcher. Gets the user into their next
// workout as fast as possible. Program days auto-fill from last
// performance. Quick Repeat section for recent session types.

import { useState, useMemo } from "react";
import { useTalos } from "../context/TalosContext";
import { fmtDate, FEEL } from "../lib/helpers";
import S from "../lib/styles";

function daysAgoText(dateStr) {
  if (!dateStr) return null;
  const d = Math.floor((new Date() - new Date(dateStr + "T12:00:00")) / 86400000);
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  if (d < 7) return `${d}d ago`;
  if (d < 30) return `${Math.floor(d / 7)}w ago`;
  return fmtDate(dateStr);
}

export default function TrainPage({ onStartWorkout }) {
  const { workouts, programs, profile, setActiveProgramId, repeatWorkout } = useTalos();
  const [showProgramPicker, setShowProgramPicker] = useState(false);
  const [showLastSession, setShowLastSession] = useState(false);

  // ── Contextual stats ──
  const stats = useMemo(() => {
    const dates = [...new Set(workouts.map(w => w.date))].sort();
    const today = new Date().toISOString().split("T")[0];

    // Current streak (gap ≤ 3 days)
    let streak = 0;
    for (let i = dates.length - 1; i >= 0; i--) {
      const d = new Date(dates[i] + "T12:00:00");
      const prev = i < dates.length - 1 ? new Date(dates[i + 1] + "T12:00:00") : new Date(today + "T12:00:00");
      if (Math.round((prev - d) / 86400000) <= 3) streak++;
      else break;
    }
    if (dates.length === 0) streak = 0;

    // This week
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    const thisWeek = workouts.filter(w => new Date(w.date + "T12:00:00") >= weekAgo).length;

    // Days since last workout
    const lastDate = dates.length > 0 ? dates[dates.length - 1] : null;
    const daysSince = lastDate ? Math.floor((new Date() - new Date(lastDate + "T12:00:00")) / 86400000) : null;

    return { streak, thisWeek, daysSince, lastDate };
  }, [workouts]);

  // ── Last workout ──
  const lastWorkout = workouts.length > 0 ? workouts[workouts.length - 1] : null;

  // ── Active program resolution ──
  const activeProg = programs.find(p => p.id === profile.activeProgramId)
    || (() => {
      const last = workouts.length > 0 ? workouts[workouts.length - 1] : null;
      return last?.program_id ? programs.find(p => p.id === last.program_id) : null;
    })()
    || programs[0]
    || null;

  // Determine next day from last workout within the active program
  const lastInProg = activeProg ? [...workouts].reverse().find(w => w.program_id === activeProg.id) : null;
  let nextDayIdx = 0;
  if (activeProg && lastInProg?.day_id) {
    const idx = activeProg.days.findIndex(d => d.id === lastInProg.day_id);
    if (idx >= 0) nextDayIdx = (idx + 1) % activeProg.days.length;
  }

  // Last workout date + data for each day
  const dayLastWorkout = useMemo(() => {
    const map = {};
    if (!activeProg) return map;
    activeProg.days.forEach(d => {
      const last = [...workouts].reverse().find(w => w.day_id === d.id);
      if (last) map[d.id] = last;
    });
    return map;
  }, [workouts, activeProg]);

  // ── Quick Repeat: recent unique sessions not in active program ──
  const quickRepeatOptions = useMemo(() => {
    const seen = new Set();
    const activeDayIds = new Set(activeProg?.days?.map(d => d.id) || []);
    const options = [];

    // Walk backwards through recent workouts
    for (let i = workouts.length - 1; i >= 0 && options.length < 5; i--) {
      const w = workouts[i];
      // Skip if it's from the active program (those are in the day cards already)
      if (activeDayIds.has(w.day_id)) continue;
      // Deduplicate by day_label + program_id combo
      const key = `${w.day_label || ""}|${w.program_id || ""}`;
      if (seen.has(key)) continue;
      seen.add(key);
      // Must have exercises to be useful as a template
      if (!w.exercises?.length) continue;
      options.push(w);
    }
    return options;
  }, [workouts, activeProg]);

  function switchProgram(progId) {
    setActiveProgramId(progId);
    setShowProgramPicker(false);
  }

  return (
    <div className="fade-in">
      {/* ── Contextual Stats ── */}
      <div style={{ ...S.card, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <div style={S.stat}>
          <div style={S.statV}>{stats.streak}</div>
          <div style={S.statL}>Streak</div>
        </div>
        <div style={S.stat}>
          <div style={S.statV}>{stats.thisWeek}</div>
          <div style={S.statL}>This Week</div>
        </div>
        <div style={S.stat}>
          <div style={{
            ...S.statV,
            color: stats.daysSince === null ? "#525252"
              : stats.daysSince === 0 ? "#22c55e"
              : stats.daysSince <= 2 ? "#fafafa"
              : stats.daysSince <= 4 ? "#eab308"
              : "#ef4444",
          }}>
            {stats.daysSince === null ? "—" : stats.daysSince === 0 ? "✓" : stats.daysSince}
          </div>
          <div style={S.statL}>{stats.daysSince === 0 ? "Trained Today" : "Days Rest"}</div>
        </div>
      </div>

      {/* ── Last Session ── */}
      {lastWorkout && (
        <div style={S.card}>
          <div
            style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
            onClick={() => setShowLastSession(!showLastSession)}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#a3a3a3" }}>Last Session</span>
                <span style={S.tag(FEEL[(lastWorkout.feel || 3) - 1]?.c || "#737373")}>
                  {FEEL[(lastWorkout.feel || 3) - 1]?.l || "—"}
                </span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fafafa", marginTop: 3 }}>
                {lastWorkout.day_label || "Workout"}
              </div>
              <div style={{ fontSize: 10, color: "#525252", marginTop: 2 }}>
                {daysAgoText(lastWorkout.date)}
                {lastWorkout.duration ? ` · ${lastWorkout.duration}min` : ""}
                {lastWorkout.exercises ? ` · ${lastWorkout.exercises.length} exercise${lastWorkout.exercises.length !== 1 ? "s" : ""}` : ""}
              </div>
            </div>
            <span style={{ color: "#525252", fontSize: 10, transform: showLastSession ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>▼</span>
          </div>

          {showLastSession && (
            <div style={{ marginTop: 10, paddingTop: 8, borderTop: "1px solid #262626" }}>
              {lastWorkout.exercises?.map((ex, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
                  <span style={{ fontSize: 11, color: "#d4d4d4" }}>{ex.name}</span>
                  <span style={{ fontSize: 11, color: "#525252" }}>
                    {ex.sets?.map(s => `${s.weight}×${s.reps}`).join(", ")}
                  </span>
                </div>
              ))}
              <button
                onClick={(e) => { e.stopPropagation(); repeatWorkout(lastWorkout); }}
                style={{ ...S.btn("primary"), width: "100%", marginTop: 10 }}
              >
                Repeat This Session
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Welcome (no programs) ── */}
      {programs.length === 0 && (
        <div style={{ ...S.card, textAlign: "center" }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}><img src="/talos-icon.svg" alt="" style={{ width: 28, height: 28 }} /></div>
          <div style={{ color: "#fafafa", fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Welcome to TALOS</div>
          <div style={{ color: "#525252", fontSize: 12, lineHeight: 1.5 }}>Create a program in the <span style={{ color: "#c9952d" }}>Prog</span> tab to get started, or hit Blank Workout below to jump right in.</div>
        </div>
      )}

      {/* ── Active Program Header ── */}
      {activeProg && (
        <div style={{ padding: "12px 16px 0" }}>
          <div onClick={() => programs.length > 1 && setShowProgramPicker(!showProgramPicker)}
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: programs.length > 1 ? "pointer" : "default" }}>
            <div>
              <div style={S.label}>Active Program</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#fafafa", marginTop: 2 }}>{activeProg.name}</div>
            </div>
            {programs.length > 1 && (
              <span style={{ color: "#737373", fontSize: 10, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", padding: "4px 8px", border: "1px solid #333", borderRadius: 4 }}>
                Switch {showProgramPicker ? "▲" : "▼"}
              </span>
            )}
          </div>

          {/* Program picker dropdown */}
          {showProgramPicker && (
            <div style={{ marginTop: 8, background: "#1a1a1a", border: "1px solid #333", borderRadius: 8, overflow: "hidden" }}>
              {programs.filter(p => p.id !== activeProg.id).map(p => (
                <div key={p.id} onClick={() => switchProgram(p.id)}
                  style={{ padding: "10px 12px", cursor: "pointer", borderBottom: "1px solid #262626", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#d4d4d4" }}>{p.name}</div>
                    <div style={{ fontSize: 10, color: "#525252", marginTop: 2 }}>{p.days?.length || 0} days</div>
                  </div>
                  <span style={{ color: "#525252", fontSize: 14 }}>→</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Program Days ── */}
      {activeProg?.days?.map((day, i) => {
        const isNext = i === nextDayIdx;
        const lastWk = dayLastWorkout[day.id];
        const lastDate = lastWk?.date;
        const hasTemplate = !!lastWk?.exercises?.length;
        const exercisePreview = day.exercises?.slice(0, 4).map(e => e.name) || [];
        const moreCount = (day.exercises?.length || 0) - exercisePreview.length;

        return (
          <div key={day.id} onClick={() => onStartWorkout(activeProg, day)}
            style={{
              ...S.card, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center",
              borderColor: isNext ? "#c9952d" : "#262626",
            }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#fafafa" }}>{day.label}</span>
                {isNext && <span style={S.tag()}>NEXT</span>}
              </div>
              {day.subtitle && <div style={{ fontSize: 11, color: "#737373", marginTop: 2 }}>{day.subtitle}</div>}

              {/* Exercise preview */}
              {exercisePreview.length > 0 && (
                <div style={{ fontSize: 10, color: "#525252", marginTop: 4, lineHeight: 1.4 }}>
                  {exercisePreview.join(" · ")}{moreCount > 0 ? ` +${moreCount}` : ""}
                </div>
              )}

              {/* Last performed + template indicator */}
              {lastDate && (
                <div style={{ fontSize: 10, color: "#404040", marginTop: 3 }}>
                  Last: {daysAgoText(lastDate)}
                  {hasTemplate && <span style={{ color: "#525252", marginLeft: 4 }}>· weights loaded</span>}
                </div>
              )}
            </div>
            <span style={{ color: "#525252", fontSize: 18, flexShrink: 0, marginLeft: 8 }}>→</span>
          </div>
        );
      })}

      {/* ── Quick Repeat ── */}
      {quickRepeatOptions.length > 0 && (
        <>
          <div style={{ padding: "12px 16px 4px" }}><div style={S.label}>Quick Repeat</div></div>
          {quickRepeatOptions.map(w => {
            const vol = w.exercises?.reduce((a, e) =>
              a + (e.sets?.reduce((b, s) => b + ((s.weight || 0) * (s.reps || 0)), 0) || 0), 0) || 0;
            const progName = w.program_id ? programs.find(p => p.id === w.program_id)?.name : null;
            return (
              <div key={w.id} onClick={() => repeatWorkout(w)}
                style={{ ...S.card, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#fafafa" }}>
                    {w.day_label || "Workout"}
                  </div>
                  <div style={{ fontSize: 10, color: "#525252", marginTop: 2 }}>
                    {daysAgoText(w.date)}
                    {` · ${w.exercises?.length || 0} exercises`}
                    {vol > 0 ? ` · ${vol >= 1000 ? `${Math.round(vol / 1000)}k` : vol} lbs` : ""}
                  </div>
                  {progName && <div style={{ fontSize: 9, color: "#404040", marginTop: 1 }}>{progName}</div>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                  <span style={{ fontSize: 9, color: "#525252", textTransform: "uppercase" }}>Repeat</span>
                  <span style={{ color: "#525252", fontSize: 14 }}>→</span>
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* ── Quick Start ── */}
      <div style={{ padding: "12px 16px 4px" }}><div style={S.label}>Quick Start</div></div>
      <div onClick={() => onStartWorkout(null, null)} style={{ ...S.card, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#fafafa" }}>Blank Workout</div>
          <div style={{ fontSize: 11, color: "#737373", marginTop: 2 }}>Build as you go</div>
        </div>
        <span style={{ color: "#525252", fontSize: 18 }}>→</span>
      </div>
    </div>
  );
}

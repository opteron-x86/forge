// ═══════════════════════ TRAIN PAGE ═══════════════════════
// Extracted from App.jsx — TrainPage function

import { useState } from "react";
import { useTalos } from "../context/TalosContext";
import { fmtDate } from "../lib/helpers";
import S from "../lib/styles";

export default function TrainPage({ onStartWorkout, onLogPast }) {
  const { workouts, programs, profile, setActiveProgramId } = useTalos();
  const [showProgramPicker, setShowProgramPicker] = useState(false);
  const totalVol = workouts.reduce((a, w) => a + (w.exercises?.reduce((b, e) => b + (e.sets?.reduce((c, s) => c + ((s.weight || 0) * (s.reps || 0)), 0) || 0), 0) || 0), 0);

  // Resolve active program: explicit > last workout's program > first program
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

  // Last workout date for each day
  const dayLastDate = {};
  if (activeProg) {
    activeProg.days.forEach(d => {
      const last = [...workouts].reverse().find(w => w.day_id === d.id);
      if (last) dayLastDate[d.id] = last.date;
    });
  }

  function switchProgram(progId) {
    setActiveProgramId(progId);
    setShowProgramPicker(false);
  }

  return (
    <div className="fade-in">
      <div style={{ ...S.card, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <div style={S.stat}><div style={S.statV}>{workouts.length}</div><div style={S.statL}>Workouts</div></div>
        <div style={S.stat}><div style={S.statV}>{profile.weight || "—"}</div><div style={S.statL}>Weight</div></div>
        <div style={S.stat}><div style={S.statV}>{Math.round(totalVol / 1000)}k</div><div style={S.statL}>Total Vol</div></div>
      </div>

      {programs.length === 0 && (
        <div style={{ ...S.card, textAlign: "center" }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}><img src="/talos-icon.svg" alt="" style={{ width: 28, height: 28 }} /></div>
          <div style={{ color: "#fafafa", fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Welcome to TALOS</div>
          <div style={{ color: "#525252", fontSize: 12, lineHeight: 1.5 }}>Create a program in the <span style={{ color: "#c9952d" }}>Prog</span> tab to get started, or hit Blank Workout below to jump right in.</div>
        </div>
      )}

      {/* Active Program Header */}
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

      {/* Active program days */}
      {activeProg?.days?.map((day, i) => (
        <div key={day.id} onClick={() => onStartWorkout(activeProg, day)}
          style={{ ...S.card, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", borderColor: i === nextDayIdx ? "#c9952d" : "#262626" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#fafafa" }}>{day.label}</div>
            {day.subtitle && <div style={{ fontSize: 11, color: "#737373", marginTop: 2 }}>{day.subtitle}</div>}
            <div style={{ fontSize: 10, color: "#525252", marginTop: 2 }}>
              {day.exercises?.length || 0} exercises{dayLastDate[day.id] ? ` · Last: ${fmtDate(dayLastDate[day.id])}` : ""}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {i === nextDayIdx && <span style={S.tag()}>NEXT</span>}
            <span style={{ color: "#525252", fontSize: 18 }}>→</span>
          </div>
        </div>
      ))}

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

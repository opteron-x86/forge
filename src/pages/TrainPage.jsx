// ═══════════════════════ TRAIN PAGE ═══════════════════════
// Extracted from App.jsx — TrainPage function
//
// This is the main dashboard showing:
// - Workout count, weight, total volume stats
// - Active program with day selector
// - Program picker (switch between programs)
// - Quick start / blank workout option
// - Next day indicator based on last workout

import { useState } from "react";
import { useTalos } from "../context/TalosContext";
import { fmtDate } from "../lib/helpers";
import S from "../lib/styles";

export default function TrainPage({ onStartWorkout }) {
  const { workouts, programs, profile, setActiveProgramId } = useTalos();
  const [showProgramPicker, setShowProgramPicker] = useState(false);

  // ── Computed values ──
  const totalVol = workouts.reduce(
    (a, w) =>
      a +
      (w.exercises?.reduce(
        (b, e) =>
          b +
          (e.sets?.reduce((c, s) => c + (s.weight || 0) * (s.reps || 0), 0) ||
            0),
        0,
      ) || 0),
    0,
  );

  // Resolve active program: explicit > last workout's program > first program
  const activeProg =
    programs.find((p) => p.id === profile.activeProgramId) ||
    (() => {
      const last = workouts.length > 0 ? workouts[workouts.length - 1] : null;
      return last?.program_id
        ? programs.find((p) => p.id === last.program_id)
        : null;
    })() ||
    programs[0] ||
    null;

  // Determine next day from last workout within the active program
  const lastInProg = activeProg
    ? [...workouts].reverse().find((w) => w.program_id === activeProg.id)
    : null;
  let nextDayIdx = 0;
  if (activeProg && lastInProg?.day_id) {
    const idx = activeProg.days.findIndex((d) => d.id === lastInProg.day_id);
    if (idx >= 0) nextDayIdx = (idx + 1) % activeProg.days.length;
  }

  // Last workout date for each day
  const dayLastDate = {};
  if (activeProg) {
    activeProg.days.forEach((d) => {
      const last = [...workouts].reverse().find((w) => w.day_id === d.id);
      if (last) dayLastDate[d.id] = last.date;
    });
  }

  function switchProgram(progId) {
    setActiveProgramId(progId);
    setShowProgramPicker(false);
  }

  // ── MIGRATION NOTE ──
  // Copy the return JSX verbatim from the TrainPage function in App.jsx.
  // The JSX references: S, activeProg, nextDayIdx, dayLastDate, totalVol,
  // programs, profile, workouts, showProgramPicker, onStartWorkout, switchProgram.
  // All of these are available in this scope.

  return (
    <div className="fade-in">
      {/* TODO: Copy JSX from App.jsx TrainPage function */}
      <div style={{ ...S.card, textAlign: "center", color: "#525252" }}>
        TrainPage — paste JSX from App.jsx
      </div>
    </div>
  );
}

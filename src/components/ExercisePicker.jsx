// ═══════════════════════ EXERCISE PICKER MODAL ═══════════════════════
// Extracted from App.jsx — ExercisePicker function
//
// Full-screen modal for selecting exercises. Features:
// - Text search across exercise names
// - Muscle group filter buttons
// - Equipment type filter buttons
// - Merged list of built-in + custom exercises
// - Tap to select → calls onSelect(exercise) and closes

import { useState } from "react";
import {
  MUSCLE_GROUPS,
  EQUIPMENT,
  getAllExercises,
  filterExercises,
} from "../lib/exercises";
import S from "../lib/styles";

export default function ExercisePicker({ onSelect, onClose, customExercises }) {
  const [search, setSearch] = useState("");
  const [muscleFilter, setMuscleFilter] = useState("");
  const [equipFilter, setEquipFilter] = useState("");

  const allExercises = getAllExercises(customExercises);
  const filtered = filterExercises(allExercises, {
    muscle: muscleFilter || undefined,
    equipment: equipFilter || undefined,
    search: search || undefined,
  });

  // MIGRATION NOTE: The return JSX is copied verbatim from App.jsx ExercisePicker.
  // It's a self-contained modal that doesn't depend on context — it receives
  // onSelect, onClose, and customExercises as props.

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.85)",
        zIndex: 300,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header with search + filters */}
      <div style={{ padding: "16px 16px 8px", background: "#0a0a0a", borderBottom: "1px solid #262626" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#fafafa" }}>Exercise Library</div>
          <button onClick={onClose} style={S.sm()}>✕ Close</button>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...S.input, marginBottom: 8 }}
          placeholder="Search exercises..."
          autoFocus
        />
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 4 }}>
          <button onClick={() => setMuscleFilter("")} style={S.sm(!muscleFilter ? "primary" : "ghost")}>All</button>
          {MUSCLE_GROUPS.map((m) => (
            <button
              key={m}
              onClick={() => setMuscleFilter(m === muscleFilter ? "" : m)}
              style={S.sm(m === muscleFilter ? "primary" : "ghost")}
            >
              {m}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {EQUIPMENT.map((e) => (
            <button
              key={e}
              onClick={() => setEquipFilter(e === equipFilter ? "" : e)}
              style={S.sm(e === equipFilter ? "primary" : "ghost")}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* Exercise list */}
      <div style={{ flex: 1, overflow: "auto", padding: "8px 16px" }}>
        {filtered.map((ex, i) => (
          <div
            key={i}
            onClick={() => {
              onSelect(ex);
              onClose();
            }}
            style={{
              padding: "10px 12px",
              borderBottom: "1px solid #1a1a1a",
              cursor: "pointer",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontSize: 13, color: "#e5e5e5", fontWeight: 500 }}>{ex.name}</div>
              <div style={{ fontSize: 10, color: "#525252" }}>
                {ex.muscle} · {ex.equipment} · {ex.type}
              </div>
            </div>
            <span style={{ color: "#525252" }}>+</span>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ padding: 20, textAlign: "center", color: "#525252", fontSize: 12 }}>
            No exercises found
          </div>
        )}
      </div>
    </div>
  );
}

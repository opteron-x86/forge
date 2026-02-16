// ═══════════════════════ EXERCISE PICKER MODAL ═══════════════════════
// Full-screen modal for selecting exercises. Features:
// - "Recently Used" section at top (derived from workout history)
// - Text search across exercise names
// - Muscle group + equipment filter buttons (horizontally scrollable)
// - Merged list of built-in + custom exercises
// - Result count indicator
// - Tap to select → calls onSelect(exercise) and closes

import { useState, useMemo } from "react";
import {
  MUSCLE_GROUPS,
  EQUIPMENT,
  getAllExercises,
  filterExercises,
} from "../lib/exercises";
import { useTalos } from "../context/TalosContext";
import S from "../lib/styles";

const MAX_RECENT = 12;

export default function ExercisePicker({ onSelect, onClose, customExercises }) {
  const { workouts } = useTalos();
  const [search, setSearch] = useState("");
  const [muscleFilter, setMuscleFilter] = useState("");
  const [equipFilter, setEquipFilter] = useState("");

  const allExercises = getAllExercises(customExercises);

  // ── Recently used exercises (ordered by recency, deduplicated) ──
  const recentExercises = useMemo(() => {
    const seen = new Set();
    const recent = [];
    // Walk backwards through workouts (most recent first)
    for (let i = workouts.length - 1; i >= 0 && recent.length < MAX_RECENT; i--) {
      const exs = workouts[i].exercises;
      if (!exs) continue;
      for (let j = 0; j < exs.length && recent.length < MAX_RECENT; j++) {
        const name = exs[j].name;
        if (seen.has(name)) continue;
        seen.add(name);
        // Find full exercise metadata
        const meta = allExercises.find(e => e.name === name);
        if (meta) recent.push(meta);
        else recent.push({ name, muscle: "other", equipment: "other", type: "isolation" });
      }
    }
    return recent;
  }, [workouts, allExercises]);

  // ── Filtered exercises ──
  const filtered = filterExercises(allExercises, {
    muscle: muscleFilter || undefined,
    equipment: equipFilter || undefined,
    search: search || undefined,
  });

  // Should we show the recent section?
  const hasFilters = search || muscleFilter || equipFilter;
  const showRecent = !hasFilters && recentExercises.length > 0;

  // Filter recent exercises too when filters are active
  const filteredRecent = hasFilters
    ? filterExercises(recentExercises, {
        muscle: muscleFilter || undefined,
        equipment: equipFilter || undefined,
        search: search || undefined,
      })
    : [];

  // Horizontal scroll container style
  const scrollRow = {
    display: "flex",
    gap: 4,
    overflowX: "auto",
    WebkitOverflowScrolling: "touch",
    scrollbarWidth: "none",
    msOverflowStyle: "none",
    paddingBottom: 2,
  };

  function selectExercise(ex) {
    onSelect(ex);
    onClose();
  }

  function ExerciseRow({ ex }) {
    return (
      <div
        onClick={() => selectExercise(ex)}
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
    );
  }

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

        {/* Muscle group filters — horizontally scrollable */}
        <div style={scrollRow}>
          <button onClick={() => setMuscleFilter("")} style={{ ...S.sm(!muscleFilter ? "primary" : "ghost"), flexShrink: 0 }}>All</button>
          {MUSCLE_GROUPS.map((m) => (
            <button
              key={m}
              onClick={() => setMuscleFilter(m === muscleFilter ? "" : m)}
              style={{ ...S.sm(m === muscleFilter ? "primary" : "ghost"), flexShrink: 0 }}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Equipment filters — horizontally scrollable */}
        <div style={{ ...scrollRow, marginTop: 4 }}>
          {EQUIPMENT.map((e) => (
            <button
              key={e}
              onClick={() => setEquipFilter(e === equipFilter ? "" : e)}
              style={{ ...S.sm(e === equipFilter ? "primary" : "ghost"), flexShrink: 0 }}
            >
              {e}
            </button>
          ))}
        </div>

        {/* Result count */}
        <div style={{ fontSize: 10, color: "#525252", marginTop: 6, textAlign: "right" }}>
          {hasFilters
            ? `${filtered.length} result${filtered.length !== 1 ? "s" : ""}`
            : `${allExercises.length} exercises`
          }
        </div>
      </div>

      {/* Exercise list */}
      <div style={{ flex: 1, overflow: "auto", padding: "0 16px" }}>
        {/* Recently Used section (no filters active) */}
        {showRecent && (
          <>
            <div style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase",
              color: "#c9952d", padding: "12px 0 4px",
            }}>
              Recently Used
            </div>
            {recentExercises.map((ex, i) => (
              <ExerciseRow key={`recent-${i}`} ex={ex} />
            ))}
            <div style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase",
              color: "#737373", padding: "14px 0 4px", borderTop: "1px solid #262626", marginTop: 4,
            }}>
              All Exercises
            </div>
          </>
        )}

        {/* Filtered recent (when searching/filtering, show matching recent at top) */}
        {hasFilters && filteredRecent.length > 0 && (
          <>
            <div style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase",
              color: "#c9952d", padding: "12px 0 4px",
            }}>
              Recent Matches
            </div>
            {filteredRecent.map((ex, i) => (
              <ExerciseRow key={`frecent-${i}`} ex={ex} />
            ))}
            <div style={{
              height: 1, background: "#262626", margin: "8px 0",
            }} />
          </>
        )}

        {/* Full exercise list */}
        {filtered.map((ex, i) => (
          <ExerciseRow key={i} ex={ex} />
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

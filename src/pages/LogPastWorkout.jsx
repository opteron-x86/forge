// ═══════════════════════ LOG PAST WORKOUT ═══════════════════════
// Retrospective workout entry — log workouts for past dates.
//
// Key differences from ActiveWorkout:
// - Date picker instead of live timer
// - All sets default to completed (retrospective)
// - Manual duration entry instead of elapsed time
// - No rest timer
// - No AI substitution (just manual exercise add/remove)
// - Save navigates to history, not session summary

import { useState } from "react";
import { useTalos } from "../context/TalosContext";
import { EXERCISES, getAllExercises } from "../lib/exercises";
import { genId, fmtDate, FEEL } from "../lib/helpers";
import ExercisePicker from "../components/ExercisePicker";
import S from "../lib/styles";

export default function LogPastWorkout({ onSave, onCancel, editingWorkout }) {
  const { workouts, programs, profile, user, customExercises } = useTalos();

// ── Edit mode detection ──
  const isEditing = !!editingWorkout;

  // ── Core state (pre-populated when editing) ──
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const [date, setDate] = useState(isEditing ? editingWorkout.date : yesterday);
  const [selectedProgram, setSelectedProgram] = useState(() => {
    if (isEditing && editingWorkout.program_id) {
      return programs.find(p => p.id === editingWorkout.program_id) || null;
    }
    return null;
  });
  const [selectedDay, setSelectedDay] = useState(() => {
    if (isEditing && editingWorkout.program_id && editingWorkout.day_id) {
      const prog = programs.find(p => p.id === editingWorkout.program_id);
      return prog?.days?.find(d => d.id === editingWorkout.day_id) || null;
    }
    return null;
  });
  const [exercises, setExercises] = useState(() => {
    if (isEditing && editingWorkout.exercises?.length) {
      return editingWorkout.exercises.map(ex => ({
        name: ex.name,
        sets: ex.sets?.map(s => ({
          weight: s.weight ?? "",
          reps: s.reps ?? "",
          rpe: s.rpe ?? "",
          completed: true,
        })) || [{ weight: "", reps: "", rpe: "", completed: true }],
        notes: ex.notes || "",
      }));
    }
    return [];
  });
  const [feel, setFeel] = useState(isEditing ? (editingWorkout.feel || 3) : 3);
  const [duration, setDuration] = useState(isEditing ? (editingWorkout.duration?.toString() || "") : "");
  const [sleepHours, setSleepHours] = useState(isEditing ? (editingWorkout.sleep_hours?.toString() || "") : "");
  const [notes, setNotes] = useState(isEditing ? (editingWorkout.notes || "") : "");
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  // ── Programs for the current user ──
  const userPrograms = programs.filter((p) => p.user_id === user.id);

  // ── Load template from program day ──
  function loadFromDay(program, day) {
    if (!day?.exercises?.length) return;
    setExercises(
      day.exercises.map((e) => ({
        name: e.name,
        sets: Array.from({ length: e.defaultSets || 3 }, () => ({
          weight: "",
          reps: "",
          rpe: "",
          completed: true,
        })),
        notes: "",
      }))
    );
  }

  function handleProgramSelect(progId) {
    const prog = userPrograms.find((p) => p.id === progId) || null;
    setSelectedProgram(prog);
    setSelectedDay(null);
    if (!prog) setExercises([]);
  }

  function handleDaySelect(dayId) {
    if (!selectedProgram) return;
    const day = selectedProgram.days?.find((d) => d.id === dayId) || null;
    setSelectedDay(day);
    if (day) loadFromDay(selectedProgram, day);
  }

  // ── Exercise management ──
  function addExercise(ex) {
    setExercises((prev) => [
      ...prev,
      {
        name: ex.name,
        sets: [{ weight: "", reps: "", rpe: "", completed: true }],
        notes: "",
      },
    ]);
  }

  function removeExercise(idx) {
    setExercises((prev) => prev.filter((_, i) => i !== idx));
  }

  function moveExercise(idx, dir) {
    setExercises((prev) => {
      const arr = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= arr.length) return arr;
      [arr[idx], arr[target]] = [arr[target], arr[idx]];
      return arr;
    });
  }

  // ── Set management ──
  function updateSet(ei, si, field, val) {
    setExercises((prev) => {
      const n = JSON.parse(JSON.stringify(prev));
      n[ei].sets[si][field] = val;
      return n;
    });
  }

  function addSet(ei) {
    setExercises((prev) => {
      const n = JSON.parse(JSON.stringify(prev));
      const lastSet = n[ei].sets[n[ei].sets.length - 1];
      n[ei].sets.push({
        weight: lastSet?.weight || "",
        reps: lastSet?.reps || "",
        rpe: "",
        completed: true,
      });
      return n;
    });
  }

  function removeSet(ei) {
    setExercises((prev) => {
      const n = JSON.parse(JSON.stringify(prev));
      if (n[ei].sets.length > 1) n[ei].sets.pop();
      return n;
    });
  }

  function updateExerciseNotes(ei, val) {
    setExercises((prev) => {
      const n = [...prev];
      n[ei] = { ...n[ei], notes: val };
      return n;
    });
  }

  // ── Last performance lookup (only from workouts before this date) ──
  function getLastPerformance(name) {
    for (let i = workouts.length - 1; i >= 0; i--) {
      if (workouts[i].date >= date) continue; // Only look at workouts before selected date
      const ex = workouts[i].exercises?.find((e) => e.name === name);
      if (ex?.sets?.length > 0) return { sets: ex.sets, date: workouts[i].date };
    }
    return null;
  }

  async function handleSave() {
      const cleanExercises = exercises
        .map((e) => ({
          ...e,
          sets: e.sets.filter((s) => s.weight && s.reps),
        }))
        .filter((e) => e.sets.length > 0);

      if (cleanExercises.length === 0) {
        alert("Add at least one exercise with weight and reps.");
        return;
      }

      setSaving(true);
      try {
        const workout = {
          id: isEditing ? editingWorkout.id : genId(),
          date,
          program_id: selectedProgram?.id || null,
          day_id: selectedDay?.id || null,
          day_label: selectedDay?.label || (selectedProgram ? null : "Freestyle"),
          feel,
          sleepHours: sleepHours ? parseFloat(sleepHours) : null,
          duration: duration ? parseInt(duration) : null,
          notes,
          exercises: cleanExercises,
        };
        await onSave(workout);
      } catch (e) {
        console.error(e);
        alert("Error saving workout");
        setSaving(false);
      }
    }

  // ── Volume stats ──
  const totalSets = exercises.reduce((a, e) => a + e.sets.length, 0);
  const totalVol = exercises.reduce(
    (a, e) =>
      a + e.sets.reduce((b, s) => b + (parseFloat(s.weight) || 0) * (parseInt(s.reps) || 0), 0),
    0
  );

  // ── Render ──
  return (
    <div className="fade-in">
      {/* Exercise Picker Modal */}
      {showPicker && (
        <ExercisePicker
          customExercises={customExercises}
          onSelect={(ex) => addExercise(ex)}
          onClose={() => setShowPicker(false)}
        />
      )}

      {/* Header */}
      <div style={{ ...S.card, paddingBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>
              {isEditing ? "Edit Workout" : "Log Past Workout"}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 2 }}>
              Add a workout from a previous date
            </div>
          </div>
          <button onClick={onCancel} style={S.sm("ghost")}>✕ Cancel</button>
        </div>

        {/* Date picker */}
        <div style={{ marginBottom: 12 }}>
          <div style={S.label}>Date</div>
          <input
            type="date"
            value={date}
            max={today}
            onChange={(e) => setDate(e.target.value)}
            style={{
              ...S.input,
              colorScheme: "dark",
            }}
          />
        </div>

        {/* Program / Day selector */}
        {userPrograms.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            <div style={S.label}>Program (optional)</div>
            <select
              value={selectedProgram?.id || ""}
              onChange={(e) => handleProgramSelect(e.target.value || null)}
              style={{ ...S.input, cursor: "pointer" }}
            >
              <option value="">Freestyle (no program)</option>
              {userPrograms.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            {selectedProgram?.days?.length > 0 && (
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 8 }}>
                {selectedProgram.days.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => handleDaySelect(d.id)}
                    style={S.sm(selectedDay?.id === d.id ? "primary" : "ghost")}
                  >
                    {d.label || "Untitled"}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Quick stats */}
        <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--surface2)" }}>
          <div style={S.stat}>
            <div style={{ ...S.statV, fontSize: 18 }}>{fmtDate(date)}</div>
            <div style={S.statL}>Date</div>
          </div>
          <div style={S.stat}>
            <div style={{ ...S.statV, fontSize: 18 }}>{exercises.length}</div>
            <div style={S.statL}>Exercises</div>
          </div>
          <div style={S.stat}>
            <div style={{ ...S.statV, fontSize: 18 }}>{totalSets}</div>
            <div style={S.statL}>Sets</div>
          </div>
          <div style={S.stat}>
            <div style={{ ...S.statV, fontSize: 18 }}>{totalVol > 999 ? `${(totalVol / 1000).toFixed(1)}k` : totalVol}</div>
            <div style={S.statL}>Volume</div>
          </div>
        </div>
      </div>

      {/* Exercise Cards */}
      {exercises.map((ex, ei) => {
        const last = getLastPerformance(ex.name);
        const allExs = getAllExercises(customExercises);
        const exMeta = allExs.find((e) => e.name === ex.name);
        const isRir = profile.intensityScale === "rir";
        const scaleLabel = isRir ? "RIR" : "RPE";

        return (
          <div key={ei} style={S.card}>
            {/* Exercise header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-bright)" }}>{ex.name}</div>
                {exMeta && (
                  <div style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 1 }}>
                    {exMeta.muscle} · {exMeta.equipment}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                {ei > 0 && <button onClick={() => moveExercise(ei, -1)} style={S.sm("ghost")}>↑</button>}
                {ei < exercises.length - 1 && <button onClick={() => moveExercise(ei, 1)} style={S.sm("ghost")}>↓</button>}
              </div>
            </div>

            {/* Last performance reference */}
            {last && (
              <div style={{ fontSize: 10, color: "var(--text-dim)", marginBottom: 8, padding: "4px 8px", background: "var(--bg)", borderRadius: 4 }}>
                Last ({fmtDate(last.date)}): {last.sets.map((s) => `${s.weight}×${s.reps}`).join(", ")}
              </div>
            )}

            {/* Sets table */}
            <div style={{ display: "grid", gridTemplateColumns: "32px 1fr 1fr 1fr", gap: "4px 6px", alignItems: "center", marginBottom: 8 }}>
              {/* Header row */}
              <div style={{ fontSize: 9, color: "var(--text-dim)", textAlign: "center" }}>#</div>
              <div style={{ fontSize: 9, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Weight</div>
              <div style={{ fontSize: 9, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Reps</div>
              <div style={{ fontSize: 9, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{scaleLabel}</div>

              {ex.sets.map((s, si) => (
                <SetRow key={si} set={s} setIndex={si} exIndex={ei} updateSet={updateSet} intensityScale={profile.intensityScale} />
              ))}
            </div>

            {/* Set controls + remove exercise */}
            <div style={{ display: "flex", gap: 4, justifyContent: "space-between" }}>
              <div style={{ display: "flex", gap: 4 }}>
                <button onClick={() => addSet(ei)} style={S.sm("ghost")}>+ Set</button>
                {ex.sets.length > 1 && (
                  <button onClick={() => removeSet(ei)} style={S.sm("ghost")}>− Set</button>
                )}
              </div>
              <button onClick={() => removeExercise(ei)} style={S.sm("danger")}>✕ Remove</button>
            </div>

            {/* Exercise notes */}
            <input
              value={ex.notes}
              onChange={(e) => updateExerciseNotes(ei, e.target.value)}
              placeholder="Exercise notes..."
              style={{ ...S.input, fontSize: 11, marginTop: 6, padding: "6px 8px" }}
            />
          </div>
        );
      })}

      {/* Add exercise button */}
      <div style={{ margin: "8px 16px" }}>
        <button
          onClick={() => setShowPicker(true)}
          style={{ ...S.btn("ghost"), width: "100%", border: "1px dashed #333", color: "var(--text-muted)" }}
        >
          + Add Exercise
        </button>
      </div>

      {/* Session details: feel, duration, sleep, notes */}
      <div style={S.card}>
        <div style={S.label}>Session Details</div>

        {/* Feel rating */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>How did it feel?</div>
          <div style={{ display: "flex", gap: 4 }}>
            {FEEL.map((f) => (
              <button
                key={f.v}
                onClick={() => setFeel(f.v)}
                style={{
                  ...S.sm(feel === f.v ? "primary" : "ghost"),
                  flex: 1,
                  background: feel === f.v ? f.c + "30" : undefined,
                  color: feel === f.v ? f.c : "var(--text-dim)",
                  border: feel === f.v ? `1px solid ${f.c}50` : "1px solid var(--border2)",
                }}
              >
                {f.l}
              </button>
            ))}
          </div>
        </div>

        {/* Duration and Sleep */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Duration (min)</div>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="e.g. 60"
              style={S.input}
              min="0"
              max="300"
            />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Sleep (hours)</div>
            <input
              type="number"
              value={sleepHours}
              onChange={(e) => setSleepHours(e.target.value)}
              placeholder="e.g. 7.5"
              style={S.input}
              min="0"
              max="24"
              step="0.5"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Workout notes</div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="How the session went, anything notable..."
            rows={3}
            style={{ ...S.input, resize: "vertical", minHeight: 60 }}
          />
        </div>
      </div>

      {/* Save / Cancel */}
      <div style={{ margin: "12px 16px 24px", display: "flex", gap: 8 }}>
        <button onClick={onCancel} style={{ ...S.btn("ghost"), flex: 1 }}>
          {isEditing ? "Cancel" : "← Back"}
        </button>
        <button
          onClick={handleSave}
          disabled={saving || exercises.length === 0}
          style={{
            ...S.btn("primary"),
            flex: 2,
            opacity: saving || exercises.length === 0 ? 0.5 : 1,
          }}
        >
          {saving ? "Saving..." : isEditing ? "Update Workout" : "Save Workout"}
        </button>
      </div>
    </div>
  );
}

// ── Set Row (inline sub-component) ──
function SetRow({ set, setIndex, exIndex, updateSet, intensityScale }) {
  const isRir = intensityScale === "rir";
  const scaleOptions = isRir
    ? ["", "0", "1", "2", "3", "4", "5"]
    : ["", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
  return (
    <>
      <div style={{ fontSize: 11, color: "var(--text-dim)", textAlign: "center", fontWeight: 700 }}>
        {setIndex + 1}
      </div>
      <input
        type="number"
        value={set.weight}
        onChange={(e) => updateSet(exIndex, setIndex, "weight", e.target.value)}
        placeholder="lbs"
        style={{ ...S.input, padding: "6px 8px", fontSize: 13, textAlign: "center" }}
        inputMode="decimal"
      />
      <input
        type="number"
        value={set.reps}
        onChange={(e) => updateSet(exIndex, setIndex, "reps", e.target.value)}
        placeholder="reps"
        style={{ ...S.input, padding: "6px 8px", fontSize: 13, textAlign: "center" }}
        inputMode="numeric"
      />
      <select
        value={set.rpe || ""}
        onChange={(e) => updateSet(exIndex, setIndex, "rpe", e.target.value ? Number(e.target.value) : "")}
        style={{ ...S.input, padding: "6px 4px", fontSize: 13, textAlign: "center", appearance: "auto", WebkitAppearance: "menulist" }}
      >
        {scaleOptions.map(v => <option key={v} value={v}>{v === "" ? "—" : v}</option>)}
      </select>
    </>
  );
}

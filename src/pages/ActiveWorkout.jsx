// ═══════════════════════ ACTIVE WORKOUT ═══════════════════════
// Extracted from App.jsx — ActiveWorkout + RestTimer functions

import { useState, useEffect } from "react";
import { useTalos } from "../context/TalosContext";
import { EXERCISES, SUBSTITUTIONS } from "../lib/exercises";
import { fmtDate, FEEL } from "../lib/helpers";
import ExercisePicker from "../components/ExercisePicker";
import RestTimer from "../components/RestTimer";
import api from "../lib/api";
import S from "../lib/styles";

export default function ActiveWorkout({ workout, setWorkout, onFinish, onDiscard }) {
  const { workouts, profile, customExercises, aiConfig } = useTalos();
  const [elapsed, setElapsed] = useState(0);
  const [restTimer, setRestTimer] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerTarget, setPickerTarget] = useState(null);
  const [subModal, setSubModal] = useState(null);

  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.round((Date.now() - workout.startTime) / 60000)), 10000);
    return () => clearInterval(t);
  }, [workout.startTime]);

  function getLastPerformance(name) {
    for (let i = workouts.length - 1; i >= 0; i--) {
      const ex = workouts[i].exercises?.find(e => e.name === name);
      if (ex?.sets?.length > 0) return { sets: ex.sets, date: workouts[i].date };
    }
    return null;
  }

  function updateSet(ei, si, field, val) {
    setWorkout(p => { const n = JSON.parse(JSON.stringify(p)); n.exercises[ei].sets[si][field] = val; return n; });
  }

  function toggleSet(ei, si) {
    setWorkout(p => {
      const n = JSON.parse(JSON.stringify(p));
      const was = n.exercises[ei].sets[si].completed;
      n.exercises[ei].sets[si].completed = !was;
      return n;
    });
    if (!workout.exercises[ei].sets[si].completed) {
      const ex = workout.exercises[ei];
      const isCompound = EXERCISES.find(e => e.name === ex.name)?.type === "compound";
      const secs = isCompound ? (profile.restTimerCompound || 150) : (profile.restTimerIsolation || 90);
      setRestTimer(secs);
    }
  }

  function addSet(ei) {
    setWorkout(p => { const n = JSON.parse(JSON.stringify(p)); const ls = n.exercises[ei].sets.at(-1); n.exercises[ei].sets.push({ weight: ls?.weight || "", reps: ls?.reps || "", rpe: "", completed: false }); return n; });
  }
  function removeSet(ei) {
    setWorkout(p => { const n = JSON.parse(JSON.stringify(p)); if (n.exercises[ei].sets.length > 1) n.exercises[ei].sets.pop(); return n; });
  }
  function removeExercise(ei) {
    setWorkout(p => { const n = JSON.parse(JSON.stringify(p)); n.exercises.splice(ei, 1); return n; });
  }
  function moveExercise(ei, dir) {
    setWorkout(p => {
      const n = JSON.parse(JSON.stringify(p));
      const target = ei + dir;
      if (target < 0 || target >= n.exercises.length) return p;
      [n.exercises[ei], n.exercises[target]] = [n.exercises[target], n.exercises[ei]];
      return n;
    });
  }

  function addExerciseFromPicker(ex) {
    const last = getLastPerformance(ex.name);
    if (pickerTarget !== null) {
      setWorkout(p => {
        const n = JSON.parse(JSON.stringify(p));
        const old = n.exercises[pickerTarget].name;
        n.exercises[pickerTarget].name = ex.name;
        n.exercises[pickerTarget].notes = `(subbed for ${old})`;
        return n;
      });
    } else {
      setWorkout(p => {
        const n = JSON.parse(JSON.stringify(p));
        n.exercises.push({
          name: ex.name,
          sets: [{ weight: last?.sets?.[0]?.weight || "", reps: "", rpe: "", completed: false }, { weight: last?.sets?.[1]?.weight || "", reps: "", rpe: "", completed: false }, { weight: last?.sets?.[2]?.weight || "", reps: "", rpe: "", completed: false }],
          notes: "",
        });
        return n;
      });
    }
    setPickerTarget(null);
  }

  function quickSub(ei) {
    const name = workout.exercises[ei].name;

    if (aiConfig.enabled) {
      setSubModal({ exerciseIndex: ei, exercise: name, loading: true, subs: [], error: null });
      const age = profile.dateOfBirth ? Math.floor((Date.now() - new Date(profile.dateOfBirth + "T12:00:00").getTime()) / 31557600000) : null;
      const profileLines = [
        profile.weight ? `Weight: ${profile.weight} lbs` : null,
        profile.experienceLevel ? `Experience: ${profile.experienceLevel}` : null,
        profile.injuriesNotes ? `Injuries: ${profile.injuriesNotes}` : null,
      ].filter(Boolean).join(", ");
      const usedExercises = [...new Set(workouts.flatMap(w => w.exercises?.map(e => e.name) || []))];
      const context = `USER: ${profileLines}\nEXERCISES USED BEFORE: ${usedExercises.slice(-30).join(", ")}\nCURRENT WORKOUT: ${workout.exercises.map(e => e.name).join(", ")}`;

      api.post("/coach/substitute", { exercise: name, reason: "Equipment unavailable or variety", context })
        .then(data => { setSubModal(prev => prev ? { ...prev, loading: false, subs: data.substitutions || [] } : null); })
        .catch(e => { setSubModal(prev => prev ? { ...prev, loading: false, error: e.message } : null); });
      return;
    }

    const subs = SUBSTITUTIONS[name];
    if (subs?.length === 1) {
      setWorkout(p => { const n = JSON.parse(JSON.stringify(p)); n.exercises[ei].name = subs[0]; n.exercises[ei].notes = `(subbed for ${name})`; return n; });
    } else {
      setPickerTarget(ei);
      setShowPicker(true);
    }
  }

  function applySub(newName) {
    if (!subModal) return;
    const ei = subModal.exerciseIndex;
    const oldName = subModal.exercise;
    const last = getLastPerformance(newName);
    setWorkout(p => {
      const n = JSON.parse(JSON.stringify(p));
      n.exercises[ei].name = newName;
      n.exercises[ei].notes = `(subbed for ${oldName})`;
      if (last?.sets) {
        n.exercises[ei].sets = n.exercises[ei].sets.map((s, i) => ({
          ...s,
          weight: last.sets[i]?.weight || s.weight,
          reps: last.sets[i]?.reps || s.reps,
        }));
      }
      return n;
    });
    setSubModal(null);
  }

  const completedSets = workout.exercises.reduce((a, e) => a + e.sets.filter(s => s.completed).length, 0);
  const totalSets = workout.exercises.reduce((a, e) => a + e.sets.length, 0);
  const sessionVol = workout.exercises.reduce((a, e) => a + e.sets.filter(s => s.completed).reduce((b, s) => b + ((s.weight || 0) * (s.reps || 0)), 0), 0);

  return (
    <div className="fade-in">
      {showPicker && <ExercisePicker customExercises={customExercises} onSelect={addExerciseFromPicker} onClose={() => { setShowPicker(false); setPickerTarget(null); }} />}

      {/* AI Substitution Modal */}
      {subModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ ...S.card, margin: 0, maxWidth: 340, width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#fafafa" }}>Swap: {subModal.exercise}</div>
                <div style={{ fontSize: 10, color: "#525252" }}>AI-powered substitutions</div>
              </div>
              <button onClick={() => setSubModal(null)} style={S.sm()}>✕</button>
            </div>
            {subModal.loading ? (
              <div style={{ padding: 20, textAlign: "center", color: "#c9952d", fontSize: 12 }}>Finding alternatives...</div>
            ) : subModal.error ? (
              <div style={{ padding: 12, color: "#ef4444", fontSize: 12 }}>{subModal.error}</div>
            ) : subModal.subs.length === 0 ? (
              <div style={{ padding: 12, color: "#737373", fontSize: 12 }}>No substitutions found. Try the exercise picker instead.</div>
            ) : (
              <div>
                {subModal.subs.map((sub, i) => {
                  const last = getLastPerformance(sub.name);
                  return (
                    <div key={i} onClick={() => applySub(sub.name)} style={{ padding: "10px 8px", borderBottom: "1px solid #262626", cursor: "pointer", borderRadius: 6 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#fafafa" }}>{sub.name}</div>
                        <div style={{ display: "flex", gap: 2 }}>
                          {[1,2,3,4,5].map(n => <span key={n} style={{ fontSize: 8, color: n <= sub.rating ? "#c9952d" : "#333" }}>●</span>)}
                        </div>
                      </div>
                      <div style={{ fontSize: 10, color: "#737373", marginTop: 2 }}>{sub.reason}</div>
                      {last && <div style={{ fontSize: 10, color: "#525252", marginTop: 2 }}>Last: {last.sets.map(s => `${s.weight}×${s.reps}`).join(", ")}</div>}
                    </div>
                  );
                })}
              </div>
            )}
            <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
              <button onClick={() => { setSubModal(null); setPickerTarget(subModal.exerciseIndex); setShowPicker(true); }} style={{ ...S.btn("ghost"), flex: 1, fontSize: 11 }}>Browse All</button>
              <button onClick={() => setSubModal(null)} style={{ ...S.btn("ghost"), flex: 1, fontSize: 11 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Header card */}
      <div style={{ ...S.card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <span style={S.tag()}>{workout.dayLabel || "Workout"}</span>
          <div style={{ fontSize: 11, color: "#737373", marginTop: 6 }}>{fmtDate(workout.date)}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#fafafa" }}>{elapsed}m</div>
          <div style={{ fontSize: 10, color: "#525252" }}>{completedSets}/{totalSets} sets · {Math.round(sessionVol / 1000)}k lbs</div>
        </div>
      </div>

      {/* Feel */}
      <div style={S.card}>
        <div style={S.label}>How do you feel?</div>
        <div style={{ display: "flex", gap: 5 }}>
          {FEEL.map(f => (
            <button key={f.v} onClick={() => setWorkout(p => ({ ...p, feel: f.v }))}
              style={{ flex: 1, padding: "5px 2px", borderRadius: 6, border: workout.feel === f.v ? `2px solid ${f.c}` : "1px solid #333", background: workout.feel === f.v ? f.c + "20" : "transparent", color: workout.feel === f.v ? f.c : "#525252", fontSize: 9, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", textTransform: "uppercase" }}>
              {f.l}
            </button>
          ))}
        </div>
      </div>

      {/* Exercises */}
      {workout.exercises.map((ex, ei) => {
        const last = getLastPerformance(ex.name);
        const hasSub = aiConfig.enabled || SUBSTITUTIONS[ex.name];
        return (
          <div key={ei} style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fafafa" }}>{ex.name}{ex.targetReps && <span style={{ fontSize: 10, fontWeight: 400, color: "#737373", marginLeft: 6 }}>Target: {ex.targetReps}</span>}</div>
                {last && <div style={{ fontSize: 10, color: "#525252", marginTop: 2 }}>Last: {last.sets.map(s => `${s.weight}×${s.reps}`).join(", ")}</div>}
                {ex.notes && <div style={{ fontSize: 10, color: "#c9952d", marginTop: 2 }}>{ex.notes}</div>}
              </div>
              <div style={{ display: "flex", gap: 3, flexShrink: 0 }}>
                {ei > 0 && <button onClick={() => moveExercise(ei, -1)} style={S.sm()} title="Move up">↑</button>}
                {ei < workout.exercises.length - 1 && <button onClick={() => moveExercise(ei, 1)} style={S.sm()} title="Move down">↓</button>}
                {hasSub && <button onClick={() => quickSub(ei)} style={S.sm()} title="Substitute">↔</button>}
                <button onClick={() => removeExercise(ei)} style={S.sm("danger")}>✕</button>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "24px 1fr 1fr 1fr 32px", gap: 5, marginBottom: 4 }}>
              {["Set", "Lbs", "Reps", "RPE", ""].map((h, i) => <div key={i} style={{ fontSize: 9, color: "#525252", textAlign: "center", textTransform: "uppercase" }}>{h}</div>)}
            </div>
            {ex.sets.map((set, si) => (
              <div key={si} style={S.setRow(set.completed)}>
                <div style={{ fontSize: 10, color: "#525252", fontWeight: 700, textAlign: "center" }}>{si + 1}</div>
                <input type="number" inputMode="decimal" value={set.weight} onChange={e => updateSet(ei, si, "weight", e.target.value ? Number(e.target.value) : "")} style={S.smInput} placeholder="—" />
                <input type="number" inputMode="numeric" value={set.reps} onChange={e => updateSet(ei, si, "reps", e.target.value ? Number(e.target.value) : "")} style={S.smInput} placeholder="—" />
                <input type="number" inputMode="decimal" value={set.rpe} onChange={e => updateSet(ei, si, "rpe", e.target.value ? Number(e.target.value) : "")} style={S.smInput} placeholder="—" />
                <button onClick={() => toggleSet(ei, si)} style={S.check(set.completed)}>{set.completed ? "✓" : ""}</button>
              </div>
            ))}
            <div style={{ display: "flex", gap: 5, marginTop: 6 }}>
              <button onClick={() => addSet(ei)} style={S.sm()}>+ Set</button>
              {ex.sets.length > 1 && <button onClick={() => removeSet(ei)} style={S.sm()}>− Set</button>}
            </div>
          </div>
        );
      })}

      <div style={{ padding: "4px 16px", display: "flex", gap: 8 }}>
        <button onClick={() => { setPickerTarget(null); setShowPicker(true); }} style={{ ...S.btn("ghost"), flex: 1 }}>+ Add Exercise</button>
      </div>

      <div style={S.card}>
        <div style={S.label}>Session Notes</div>
        <textarea value={workout.notes} onChange={e => setWorkout(p => ({ ...p, notes: e.target.value }))} style={{ ...S.input, minHeight: 50, resize: "vertical" }} placeholder="How'd it go?" />
      </div>

      <div style={{ padding: "8px 16px 20px", display: "flex", gap: 8 }}>
        <button onClick={onDiscard} style={{ ...S.btn("ghost"), flex: 1 }}>Discard</button>
        <button onClick={onFinish} style={{ ...S.btn("primary"), flex: 2 }}>Finish Workout</button>
      </div>

      {/* Extra bottom padding when rest timer is visible so content isn't hidden */}
      {restTimer && <div style={{ height: 64 }} />}

      {/* Floating rest timer bar (fixed position, above nav) */}
      {restTimer && (
        <RestTimer
          seconds={restTimer}
          onDone={() => setRestTimer(null)}
          onCancel={() => setRestTimer(null)}
        />
      )}
    </div>
  );
}

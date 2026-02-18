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
    const wasCompleted = workout.exercises[ei].sets[si].completed;
    setWorkout(p => {
      const n = JSON.parse(JSON.stringify(p));
      n.exercises[ei].sets[si].completed = !wasCompleted;
      // Auto-fill: when completing a set, propagate weight/reps to subsequent empty sets
      if (!wasCompleted) {
        const completedSet = n.exercises[ei].sets[si];
        const sets = n.exercises[ei].sets;
        for (let s = si + 1; s < sets.length; s++) {
          if (!sets[s].completed) {
            if ((sets[s].weight === "" || sets[s].weight === undefined || sets[s].weight === null) && completedSet.weight) {
              sets[s].weight = completedSet.weight;
            }
            if ((sets[s].reps === "" || sets[s].reps === undefined || sets[s].reps === null) && completedSet.reps) {
              sets[s].reps = completedSet.reps;
            }
          }
        }
      }
      return n;
    });
    if (!wasCompleted && profile.restTimerEnabled !== false) {
      const ex = workout.exercises[ei];
      const isCompound = EXERCISES.find(e => e.name === ex.name)?.type === "compound";
      const secs = isCompound ? (profile.restTimerCompound || 150) : (profile.restTimerIsolation || 90);
      // Determine what's next: next incomplete set in same exercise, or next exercise
      let nextInfo = null;
      const currentSets = ex.sets;
      const nextSetIdx = currentSets.findIndex((s, idx) => idx > si && !s.completed);
      if (nextSetIdx !== -1) {
        nextInfo = { exercise: ex.name, set: nextSetIdx + 1, totalSets: currentSets.length };
      } else {
        // Look for next exercise with incomplete sets
        for (let e = ei + 1; e < workout.exercises.length; e++) {
          const nextEx = workout.exercises[e];
          const firstIncomplete = nextEx.sets.findIndex(s => !s.completed);
          if (firstIncomplete !== -1) {
            nextInfo = { exercise: nextEx.name, set: firstIncomplete + 1, totalSets: nextEx.sets.length };
            break;
          }
        }
      }
      setRestTimer({ seconds: secs, nextInfo });
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
        <div style={{ position: "fixed", inset: 0, background: "var(--overlay)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ ...S.card, margin: 0, maxWidth: 340, width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-bright)" }}>Swap: {subModal.exercise}</div>
                <div style={{ fontSize: 10, color: "var(--text-dim)" }}>AI-powered substitutions</div>
              </div>
              <button onClick={() => setSubModal(null)} style={S.sm()}>✕</button>
            </div>
            {subModal.loading ? (
              <div style={{ padding: 20, textAlign: "center", color: "var(--accent)", fontSize: 12 }}>Finding alternatives...</div>
            ) : subModal.error ? (
              <div style={{ padding: 12, color: "#ef4444", fontSize: 12 }}>{subModal.error}</div>
            ) : subModal.subs.length === 0 ? (
              <div style={{ padding: 12, color: "var(--text-muted)", fontSize: 12 }}>No substitutions found. Try the exercise picker instead.</div>
            ) : (
              <div>
                {subModal.subs.map((sub, i) => {
                  const last = getLastPerformance(sub.name);
                  return (
                    <div key={i} onClick={() => applySub(sub.name)} style={{ padding: "10px 8px", borderBottom: "1px solid var(--border)", cursor: "pointer", borderRadius: 6, minHeight: 44 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-bright)" }}>{sub.name}</div>
                        <div style={{ display: "flex", gap: 2 }}>
                          {[1,2,3,4,5].map(n => <span key={n} style={{ fontSize: 8, color: n <= sub.rating ? "var(--accent)" : "var(--border2)" }}>●</span>)}
                        </div>
                      </div>
                      <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>{sub.reason}</div>
                      {last && <div style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 2 }}>Last: {last.sets.map(s => `${s.weight}×${s.reps}`).join(", ")}</div>}
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
          <span style={S.tag()}>{workout.day_label || "Workout"}</span>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>{fmtDate(workout.date)}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-bright)" }}>{elapsed}m</div>
          <div style={{ fontSize: 10, color: "var(--text-dim)" }}>{completedSets}/{totalSets} sets · {Math.round(sessionVol / 1000)}k lbs</div>
        </div>
      </div>

      {/* Feel */}
      <div style={S.card}>
        <div style={S.label}>How do you feel?</div>
        <div style={{ display: "flex", gap: 5 }}>
          {FEEL.map(f => (
            <button key={f.v} onClick={() => setWorkout(p => ({ ...p, feel: f.v }))}
              style={{ flex: 1, padding: "5px 2px", borderRadius: 6, border: workout.feel === f.v ? `2px solid ${f.c}` : "1px solid var(--border2)", background: workout.feel === f.v ? f.c + "20" : "transparent", color: workout.feel === f.v ? f.c : "var(--text-dim)", fontSize: 9, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", textTransform: "uppercase", minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {f.l}
            </button>
          ))}
        </div>
      </div>

      {/* Exercises */}
      {workout.exercises.map((ex, ei) => {
        const last = getLastPerformance(ex.name);
        const hasSub = aiConfig.enabled || SUBSTITUTIONS[ex.name];
        const isRir = profile.intensityScale === "rir";
        const scaleLabel = isRir ? "RIR" : "RPE";
        const scaleOptions = isRir
          ? ["", "0", "1", "2", "3", "4", "5"]
          : ["", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
        return (
          <div key={ei} style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-bright)" }}>{ex.name}{ex.targetReps && <span style={{ fontSize: 10, fontWeight: 400, color: "var(--text-muted)", marginLeft: 6 }}>Target: {ex.targetReps}</span>}</div>
                {last && <div style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 2 }}>Last: {last.sets.map(s => `${s.weight}×${s.reps}`).join(", ")}</div>}
                {ex.notes && <div style={{ fontSize: 10, color: "var(--accent)", marginTop: 2 }}>{ex.notes}</div>}
              </div>
              <div style={{ display: "flex", gap: 3, flexShrink: 0 }}>
                {ei > 0 && <button onClick={() => moveExercise(ei, -1)} style={{ ...S.sm(), fontSize: 16, fontWeight: 900, minWidth: 44 }} title="Move up">↑</button>}
                {ei < workout.exercises.length - 1 && <button onClick={() => moveExercise(ei, 1)} style={{ ...S.sm(), fontSize: 16, fontWeight: 900, minWidth: 44 }} title="Move down">↓</button>}
                {hasSub && <button onClick={() => quickSub(ei)} style={{ ...S.sm(), minWidth: 44 }} title="Substitute"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3l4 4-4 4"/><path d="M20 7H4"/><path d="M8 21l-4-4 4-4"/><path d="M4 17h16"/></svg></button>}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "24px 1fr 1fr 1fr 44px", gap: 5, marginBottom: 4 }}>
              {["Set", "Lbs", "Reps", scaleLabel, ""].map((h, i) => <div key={i} style={{ fontSize: 9, color: "var(--text-dim)", textAlign: "center", textTransform: "uppercase" }}>{h}</div>)}
            </div>
            {ex.sets.map((set, si) => (
              <div key={si} style={S.setRow(set.completed)}>
                <div style={{ fontSize: 10, color: "var(--text-dim)", fontWeight: 700, textAlign: "center" }}>{si + 1}</div>
                <input type="number" inputMode="decimal" value={set.weight} onChange={e => updateSet(ei, si, "weight", e.target.value ? Number(e.target.value) : "")} onFocus={e => e.target.select()} style={S.smInput} placeholder="—" />
                <input type="number" inputMode="numeric" value={set.reps} onChange={e => updateSet(ei, si, "reps", e.target.value ? Number(e.target.value) : "")} onFocus={e => e.target.select()} style={S.smInput} placeholder="—" />
                <select value={set.rpe != null && set.rpe !== "" ? set.rpe : ""} onChange={e => updateSet(ei, si, "rpe", e.target.value !== "" ? Number(e.target.value) : "")} style={S.smSelect}>
                  {scaleOptions.map(v => <option key={v} value={v}>{v === "" ? "—" : v}</option>)}
                </select>
                <button onClick={() => toggleSet(ei, si)} style={S.check(set.completed)}>{set.completed ? "✓" : ""}</button>
              </div>
            ))}
            <div style={{ display: "flex", gap: 5, marginTop: 6, justifyContent: "space-between" }}>
              <div style={{ display: "flex", gap: 5 }}>
                <button onClick={() => addSet(ei)} style={S.sm()}>+ Set</button>
                {ex.sets.length > 1 && <button onClick={() => removeSet(ei)} style={S.sm()}>− Set</button>}
              </div>
              <button onClick={() => removeExercise(ei)} style={S.sm("danger")} title="Remove exercise">✕ Remove</button>
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

      {/* Rest timer modal (overlays screen when active) */}
      {restTimer && (
        <RestTimer
          seconds={restTimer.seconds}
          nextInfo={restTimer.nextInfo}
          onDone={() => setRestTimer(null)}
          onCancel={() => setRestTimer(null)}
        />
      )}
    </div>
  );
}

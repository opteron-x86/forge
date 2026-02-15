// ═══════════════════════ ACTIVE WORKOUT ═══════════════════════
// Extracted from App.jsx — ActiveWorkout function
//
// This is the live workout session showing:
// - Workout header (day label, elapsed time, set/volume counters)
// - Feel selector (1-5 rating)
// - Exercise cards with set logging (weight/reps/RPE)
// - Set completion checkboxes (triggers rest timer)
// - Last performance reference per exercise
// - Exercise reordering, substitution, notes
// - Smart substitution modal (AI-powered)
// - Exercise picker integration
// - Sleep hours input
// - Finish / Discard buttons

import { useState, useEffect } from "react";
import { useTalos } from "../context/TalosContext";
import { EXERCISES } from "../lib/exercises";
import { FEEL } from "../lib/helpers";
import ExercisePicker from "../components/ExercisePicker";
import RestTimer from "../components/RestTimer";
import S from "../lib/styles";

export default function ActiveWorkout({ workout, setWorkout, onFinish, onDiscard }) {
  const { workouts, profile, customExercises, aiConfig } = useTalos();
  const [elapsed, setElapsed] = useState(0);
  const [restTimer, setRestTimer] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerTarget, setPickerTarget] = useState(null); // null = add, index = substitute
  const [subModal, setSubModal] = useState(null); // { exerciseIndex, exercise, loading, subs, error }

  useEffect(() => {
    const t = setInterval(
      () => setElapsed(Math.round((Date.now() - workout.startTime) / 60000)),
      10000,
    );
    return () => clearInterval(t);
  }, [workout.startTime]);

  // ── Helper functions ──

  function getLastPerformance(name) {
    for (let i = workouts.length - 1; i >= 0; i--) {
      const ex = workouts[i].exercises?.find((e) => e.name === name);
      if (ex?.sets?.length > 0) return { sets: ex.sets, date: workouts[i].date };
    }
    return null;
  }

  function updateSet(ei, si, field, val) {
    setWorkout((p) => {
      const n = JSON.parse(JSON.stringify(p));
      n.exercises[ei].sets[si][field] = val;
      return n;
    });
  }

  function toggleSet(ei, si) {
    setWorkout((p) => {
      const n = JSON.parse(JSON.stringify(p));
      const was = n.exercises[ei].sets[si].completed;
      n.exercises[ei].sets[si].completed = !was;
      return n;
    });
    // Start rest timer when completing a set
    if (!workout.exercises[ei].sets[si].completed) {
      const ex = workout.exercises[ei];
      const isCompound =
        EXERCISES.find((e) => e.name === ex.name)?.type === "compound";
      const secs = isCompound
        ? profile.restTimerCompound || 150
        : profile.restTimerIsolation || 90;
      setRestTimer(secs);
    }
  }

  // MIGRATION NOTE: Copy remaining helper functions from App.jsx ActiveWorkout:
  // - addSet, removeSet, removeExercise, moveExercise
  // - handleSubstitution (AI-powered smart substitution)
  // - Computed values: completedSets, totalSets, sessionVol

  // ── Computed values ──
  const completedSets = workout.exercises.reduce(
    (a, e) => a + (e.sets?.filter((s) => s.completed).length || 0), 0
  );
  const totalSets = workout.exercises.reduce(
    (a, e) => a + (e.sets?.length || 0), 0
  );
  const sessionVol = workout.exercises.reduce(
    (a, e) =>
      a +
      (e.sets?.reduce(
        (b, s) => b + (s.completed ? (s.weight || 0) * (s.reps || 0) : 0), 0
      ) || 0), 0
  );

  // MIGRATION NOTE: Copy the full return JSX from App.jsx ActiveWorkout function.
  // It includes: exercise picker modal, substitution modal, rest timer,
  // header card, feel selector, exercise cards with sets, notes, finish/discard.

  return (
    <div className="fade-in">
      {showPicker && (
        <ExercisePicker
          customExercises={customExercises}
          onSelect={(ex) => {
            // TODO: Copy add/substitute logic from App.jsx
          }}
          onClose={() => setShowPicker(false)}
        />
      )}

      {restTimer && (
        <RestTimer
          seconds={restTimer}
          onDone={() => setRestTimer(null)}
          onCancel={() => setRestTimer(null)}
        />
      )}

      {/* TODO: Copy remaining JSX from App.jsx ActiveWorkout */}
      <div style={{ ...S.card, textAlign: "center", color: "#525252" }}>
        ActiveWorkout — paste JSX from App.jsx
      </div>
    </div>
  );
}

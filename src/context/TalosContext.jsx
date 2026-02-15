// ═══════════════════════ TALOS CONTEXT ═══════════════════════
// Extracted from App.jsx — the Ctx provider and useTalos hook
//
// This module defines the React context that makes global state
// available to all page and component consumers. The actual state
// values are still managed in App.jsx and passed down through
// the Provider. This file just defines the shape and access hook.

import { createContext, useContext } from "react";

const TalosContext = createContext();

/**
 * Hook to access TALOS global state from any component.
 * 
 * Available values (provided by App.jsx):
 * - user: { id, name, color, has_pin }
 * - workouts: array of workout objects
 * - profile: user profile with biometrics, goals, preferences
 * - programs: array of training programs
 * - customExercises: user-created exercises
 * - aiConfig: { enabled, provider, model }
 * - saveWorkout(workout): persist a completed workout
 * - deleteWorkout(id): remove a workout
 * - updateProfile(profile): update profile fields
 * - saveProgram(program): create or update a program
 * - deleteProgram(id): remove a program
 * - addCustomExercise(exercise): add to custom exercise library
 * - editingProgram / setEditingProgram: program editor state
 * - setActiveProgramId(id): set the active program
 * - coachHistory / setCoachHistory: AI coach conversation messages (persisted)
 * - coachMode / setCoachMode: current coach tab mode (chat/program/weekly)
 */
export function useTalos() {
  const ctx = useContext(TalosContext);
  if (!ctx) {
    throw new Error("useTalos must be used within a TalosProvider");
  }
  return ctx;
}

export default TalosContext;

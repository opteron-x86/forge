// ═══════════════════════ APP SHELL ═══════════════════════
// Refactored App.jsx — now just the shell containing:
// 1. Global state management (workouts, profile, programs, etc.)
// 2. Auth gate (Login or main app)
// 3. Tab router (train, active, history, stats, programs, coach)
// 4. Context provider wrapping everything
//
// All page content and component logic has moved to their own files.
// This file should be ~150-200 lines, down from ~4,000+.

import { useState, useEffect } from "react";
import TalosContext from "./context/TalosContext";
import api from "./lib/api";
import { DEFAULT_PROFILE } from "./lib/helpers";
import S from "./lib/styles";

// Pages
import TrainPage from "./pages/TrainPage";
import ActiveWorkout from "./pages/ActiveWorkout";
import LogPastWorkout from "./pages/LogPastWorkout";
import HistoryPage from "./pages/HistoryPage";
import StatsPage from "./pages/StatsPage";
import ProgramsPage from "./pages/ProgramsPage";
import CoachPage from "./pages/CoachPage";

// Components
import Login from "./components/Login";
import Onboarding from "./components/Onboarding";
import SettingsModal from "./components/SettingsModal";
import SessionSummary from "./components/SessionSummary";

export default function App() {
  // ── Auth state ──
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // ── Core data ──
  const [workouts, setWorkouts] = useState([]);
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [programs, setPrograms] = useState([]);
  const [customExercises, setCustomExercises] = useState([]);
  const [aiConfig, setAiConfig] = useState({ enabled: false, provider: "", model: "" });
  const [loaded, setLoaded] = useState(false);

  // ── UI state ──
  const [tab, setTab] = useState("train");
  const [currentWorkout, setCurrent] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);
  const [sessionSummary, setSessionSummary] = useState(null);
  const [editingWorkout, setEditingWorkout] = useState(null);
  const [logPastDate, setLogPastDate] = useState(null);

  // ── Coach state (lifted here so it survives tab switches) ──
  const [coachHistory, setCoachHistory] = useState([]);
  const [coachMode, setCoachMode] = useState("chat");
  const [workoutReviews, setWorkoutReviews] = useState({});

  // ── Restore session from stored JWT on mount ──
  useEffect(() => {
    api.setAuthErrorHandler(() => {
      setUser(null);
      setAuthChecked(true);
    });

    const token = api.getToken();
    if (!token) {
      setAuthChecked(true);
      return;
    }
    api.get("/auth/me")
      .then((u) => { setUser(u); setAuthChecked(true); })
      .catch(() => { api.clearToken(); setAuthChecked(true); });
  }, []);

  function logout() {
    api.clearToken();
    setUser(null);
    setShowSettings(false);
    setTab("train");
    setCurrent(null);
    setLoaded(false);
  }

  // ── Load user data on login ──
  useEffect(() => {
    if (!user) return;
    setLoaded(false);
    Promise.all([
      api.get("/workouts"),
      api.get("/profile"),
      api.get("/programs"),
      api.get("/exercises"),
      api.get("/ai/config"),
      api.get("/coach/messages"),
      api.get("/workout-reviews"),
    ])
      .then(([w, p, pr, ex, ai, coachMsgs, reviews]) => {
        setWorkouts(w);
        setProfile(p);
        setPrograms(pr);
        setCustomExercises(ex);
        setAiConfig(ai);
        setCoachHistory(Array.isArray(coachMsgs) ? coachMsgs : []);
        // Build a map of workout_id -> review text for quick lookup
        const reviewMap = {};
        if (Array.isArray(reviews)) {
          reviews.forEach(r => { reviewMap[r.workout_id] = r.review; });
        }
        setWorkoutReviews(reviewMap);
        setLoaded(true);
      })
      .catch((e) => {
        console.error(e);
        setLoaded(true);
      });
  }, [user]);

  // ── Actions (passed through context) ──

  async function saveWorkout(w) {
    await api.post("/workouts", w);
    // Insert in sorted order by date (supports past-dated workouts)
    setWorkouts((prev) => {
      const next = [...prev, w];
      next.sort((a, b) => a.date.localeCompare(b.date));
      return next;
    });
  }

  async function savePastWorkout(w) {
    await saveWorkout(w);
    setTab("history");
  }

  async function deleteWorkout(id) {
    if (!confirm("Delete this workout?")) return;
    await api.del(`/workouts/${id}`);
    setWorkouts((prev) => prev.filter((w) => w.id !== id));
  }

  async function updateWorkout(w) {
    await api.put(`/workouts/${w.id}`, w);
    setWorkouts((prev) => {
      const next = prev.map((existing) => (existing.id === w.id ? { ...w, exercises: w.exercises } : existing));
      next.sort((a, b) => a.date.localeCompare(b.date));
      return next;
    });
  }

  function editWorkout(workout) {
    setEditingWorkout(workout);
    setTab("editWorkout");
  }

  async function updateProfile(p) {
    await api.put("/profile", p);
    const updated = await api.get("/profile");
    setProfile(updated);
  }

  async function saveProgram(p) {
    if (p.id) {
      await api.put(`/programs/${p.id}`, p);
    } else {
      const res = await api.post("/programs", p);
      p.id = res.id;
    }
    const updated = await api.get("/programs");
    setPrograms(updated);
  }

  async function deleteProgram(id) {
    if (!confirm("Delete this program?")) return;
    await api.del(`/programs/${id}`);
    setPrograms((prev) => prev.filter((p) => p.id !== id));
    if (editingProgram?.id === id) setEditingProgram(null);
  }

  async function addCustomExercise(ex) {
    const res = await api.post("/exercises", ex);
    setCustomExercises((prev) => [...prev, res]);
  }

  function setActiveProgramId(id) {
    updateProfile({ ...profile, activeProgramId: id });
  }

  // ── Workout lifecycle ──

  // Find the last workout for a given program day (or day_label for freestyle)
  function findLastWorkoutForDay(programId, dayId, dayLabel) {
    for (let i = workouts.length - 1; i >= 0; i--) {
      const w = workouts[i];
      if (dayId && w.day_id === dayId) return w;
      if (!dayId && dayLabel && (w.day_label || w.dayLabel) === dayLabel) return w;
    }
    return null;
  }

  // Look up last performance for a specific exercise across all history
  function findLastPerformance(exerciseName) {
    for (let i = workouts.length - 1; i >= 0; i--) {
      const ex = workouts[i].exercises?.find(e => e.name === exerciseName);
      if (ex?.sets?.length > 0) return ex;
    }
    return null;
  }

  function startWorkout(program, day, template) {
    // template: optional past workout object to pre-fill weights/reps from

    let exercises = [];

    if (template) {
      // ── Start from a past workout template ──
      exercises = template.exercises?.map(e => ({
        name: e.name,
        sets: e.sets?.map(s => ({
          weight: s.weight ?? "",
          reps: s.reps ?? "",
          rpe: "",
          completed: false,
        })) || [{ weight: "", reps: "", rpe: "", completed: false }],
        notes: "",
        targetReps: e.targetReps || "",
      })) || [];
    } else if (day?.exercises) {
      // ── Start from program day, auto-fill from last performance ──
      const lastDayWorkout = findLastWorkoutForDay(program?.id, day.id, day.label);

      exercises = day.exercises.map(e => {
        // Check if this exercise was in the last workout for this day
        const lastEx = lastDayWorkout?.exercises?.find(pe => pe.name === e.name);
        // Fall back to last time this exercise appeared anywhere
        const lastAny = lastEx || findLastPerformance(e.name);
        const numSets = e.defaultSets || 3;

        if (lastAny?.sets?.length > 0) {
          // Pre-fill from last performance
          const sets = Array.from({ length: numSets }, (_, i) => ({
            weight: lastAny.sets[Math.min(i, lastAny.sets.length - 1)]?.weight ?? "",
            reps: lastAny.sets[Math.min(i, lastAny.sets.length - 1)]?.reps ?? "",
            rpe: "",
            completed: false,
          }));
          return { name: e.name, sets, notes: "", targetReps: e.targetReps || "" };
        }

        // No history — blank sets
        return {
          name: e.name,
          sets: Array.from({ length: numSets }, () => ({
            weight: "", reps: "", rpe: "", completed: false,
          })),
          notes: "",
          targetReps: e.targetReps || "",
        };
      });
    }

    const workout = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      date: new Date().toISOString().split("T")[0],
      startTime: Date.now(),
      program_id: template?.program_id || program?.id || null,
      day_id: template?.day_id || day?.id || null,
      dayLabel: template?.day_label || template?.dayLabel || day?.label || "Freestyle",
      exercises,
      feel: 3,
      notes: "",
      sleepHours: null,
    };
    setCurrent(workout);
    setTab("active");
  }

  function repeatWorkout(w) {
    // Start a new workout using a past workout as a template
    const program = w.program_id ? programs.find(p => p.id === w.program_id) : null;
    const day = program?.days?.find(d => d.id === w.day_id) || null;
    startWorkout(program, day, w);
  }

  async function finishWorkout() {
    if (!currentWorkout) return;
    const w = {
      ...currentWorkout,
      duration: Math.round((Date.now() - currentWorkout.startTime) / 60000),
    };
    // Remove incomplete sets
    w.exercises = w.exercises
      .map((e) => ({
        ...e,
        sets: e.sets.filter((s) => s.completed && s.weight && s.reps),
      }))
      .filter((e) => e.sets.length > 0);

    await saveWorkout(w);
    setCurrent(null);

    // Show summary (AI review is optional — triggered by user from summary screen)
    setSessionSummary({ workout: w });
    setTab("summary");
  }

  // ── Auth gate ──
  if (!authChecked) {
    return (
      <div style={{ ...S.app, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#c9952d", fontSize: 14 }}>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  if (!loaded) {
    return (
      <div style={{ ...S.app, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#c9952d", fontSize: 14 }}>Loading...</div>
      </div>
    );
  }

  // ── Onboarding for new users ──
  const needsOnboarding = loaded && programs.length === 0 && workouts.length === 0 && !profile.onboardingComplete;

  async function completeOnboarding(program, level) {
    // Save the selected program
    if (program) {
      await saveProgram(program);
      // Refresh programs to get the saved one with its ID
      const updated = await api.get("/programs");
      setPrograms(updated);
      // Set as active program
      if (updated.length > 0) {
        await updateProfile({ ...profile, activeProgramId: updated[0].id, experienceLevel: level || profile.experienceLevel, onboardingComplete: true });
      }
    } else {
      await updateProfile({ ...profile, onboardingComplete: true });
    }
  }

  async function skipOnboarding() {
    await updateProfile({ ...profile, onboardingComplete: true });
  }

  if (needsOnboarding) {
    return (
      <div style={S.app}>
        <Onboarding
          userName={user.name}
          onComplete={completeOnboarding}
          onSkip={skipOnboarding}
        />
      </div>
    );
  }

  // ── Resolve active tab (handle edge cases) ──
  const activeTab =
      tab === "logPast"
        ? "logPast"
        : tab === "editWorkout" && editingWorkout
          ? "editWorkout"
          : tab === "summary" && sessionSummary
            ? "summary"
            : tab === "active" && currentWorkout
              ? "active"
              : tab === "active"
                ? "train"
                : tab;

  // ── Context value ──
  const ctx = {
    user,
    workouts,
    profile,
    programs,
    customExercises,
    aiConfig,
    saveWorkout,
    deleteWorkout,
    updateProfile,
    saveProgram,
    deleteProgram,
    addCustomExercise,
    editingProgram,
    setEditingProgram,
    setActiveProgramId,
    updateWorkout,
    editWorkout,
    repeatWorkout,
    // Coach state (persists across tab switches)
    coachHistory,
    setCoachHistory,
    coachMode,
    setCoachMode,
    // Workout reviews
    workoutReviews,
    setWorkoutReviews,
  };

  // ── Render ──
  return (
    <TalosContext.Provider value={ctx}>
      <div style={S.app}>
        {/* Header */}
        <header style={S.header}>
          <h1 style={S.title}><img src="/talos-icon.svg" alt="" style={{ width: 20, height: 20, verticalAlign: "middle", marginRight: 6 }} />TALOS{currentWorkout && <span style={{ ...S.tag("#22c55e"), marginLeft: 6, fontSize: 9 }}>LIVE</span>}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={() => setTab("coach")}
              title="AI Coach"
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                border: activeTab === "coach" ? "1px solid #c9952d" : "1px solid #333",
                background: activeTab === "coach" ? "#c9952d20" : "transparent",
                color: activeTab === "coach" ? "#c9952d" : "#737373",
                fontSize: 15,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "inherit",
                fontWeight: 500,
              }}
            >
              ⚡
            </button>
            <div
              onClick={() => setShowSettings(true)}
              style={S.avatar(user.color)}
            >
              {user.name?.[0]?.toUpperCase()}
            </div>
          </div>
        </header>

        {/* Settings */}
        {showSettings && (
          <SettingsModal
            onClose={() => setShowSettings(false)}
            onLogout={logout}
          />
        )}

        {/* Page router */}
        {activeTab === "train" && <TrainPage onStartWorkout={startWorkout} />}
        {activeTab === "active" && currentWorkout && (
          <ActiveWorkout
            workout={currentWorkout}
            setWorkout={setCurrent}
            onFinish={finishWorkout}
            onDiscard={() => {
              if (confirm("Discard this workout? All logged sets will be lost.")) {
                setCurrent(null);
                setTab("train");
              }
            }}
          />
        )}
        {activeTab === "logPast" && (
          <LogPastWorkout
            key={logPastDate || "new"}
            initialDate={logPastDate}
            onSave={(w) => { setLogPastDate(null); return savePastWorkout(w); }}
            onCancel={() => { setLogPastDate(null); setTab("history"); }}
          />
        )}
        {activeTab === "editWorkout" && editingWorkout && (
          <LogPastWorkout
            editingWorkout={editingWorkout}
            onSave={async (w) => {
              await updateWorkout(w);
              setEditingWorkout(null);
              setTab("history");
            }}
            onCancel={() => {
              setEditingWorkout(null);
              setTab("history");
            }}
          />
        )}
        {activeTab === "summary" && (
          <SessionSummary
            summary={sessionSummary}
            onDone={() => {
              setSessionSummary(null);
              setTab("history");
            }}
            onReviewSaved={(workoutId, reviewText) => {
              setWorkoutReviews(prev => ({ ...prev, [workoutId]: reviewText }));
            }}
          />
        )}
        {activeTab === "history" && <HistoryPage onLogPast={(date) => { setLogPastDate(date || null); setTab("logPast"); }} />}
        {activeTab === "stats" && <StatsPage />}
        {activeTab === "programs" && <ProgramsPage />}
        {activeTab === "coach" && <CoachPage />}

        {/* Bottom nav */}
        <nav style={S.nav}>
          {currentWorkout && (
            <button
              onClick={() => setTab("active")}
              style={{
                ...S.navBtn(activeTab === "active"),
                background: activeTab === "active" ? "#22c55e" : "#166534",
                color: activeTab === "active" ? "#000" : "#4ade80",
              }}
            >
              ● Live
            </button>
          )}
          <button onClick={() => setTab("train")} style={S.navBtn(activeTab === "train")}>Train</button>
          <button onClick={() => setTab("history")} style={S.navBtn(activeTab === "history")}>Hist</button>
          <button onClick={() => setTab("stats")} style={S.navBtn(activeTab === "stats")}>Stats</button>
          <button onClick={() => setTab("programs")} style={S.navBtn(activeTab === "programs")}>
            {editingProgram ? "Prog ●" : "Prog"}
          </button>
        </nav>
      </div>
    </TalosContext.Provider>
  );
}
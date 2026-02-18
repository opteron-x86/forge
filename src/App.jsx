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
import { DEFAULT_PROFILE, genId } from "./lib/helpers";
import { applyTheme } from "./lib/themes";
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
import ProfileModal from "./components/ProfileModal";
import AvatarMenu from "./components/AvatarMenu";
import AdminPanel from "./components/AdminPanel";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import SessionSummary from "./components/SessionSummary";
import InstallPrompt from "./components/InstallPrompt";

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
  const [showProfile, setShowProfile] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
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
      .then((u) => { setUser(u); if (u.theme) applyTheme(u.theme); setAuthChecked(true); })
      .catch(() => { api.clearToken(); setAuthChecked(true); });
  }, []);

  function logout() {
    api.clearToken();
    setUser(null);
    setShowSettings(false);
    setTab("train");
    setCurrent(null);
    setLoaded(false);
    applyTheme("talos"); // Reset to default
  }

  function handleLogin(u) {
    setUser(u);
    if (u.theme) applyTheme(u.theme);
  }

  function updateUser(updates) {
    setUser(prev => prev ? { ...prev, ...updates } : prev);
    if (updates.theme) applyTheme(updates.theme);
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
      api.get("/ai/status").catch(() => ({ enabled: false })),
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

  // ── Listen for program refresh events (e.g. after adopting a program) ──
  useEffect(() => {
    function handleRefresh() {
      api.get("/programs").then(setPrograms).catch(console.error);
    }
    window.addEventListener("talos-refresh-programs", handleRefresh);
    return () => window.removeEventListener("talos-refresh-programs", handleRefresh);
  }, []);

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

  async function adoptProgram(program) {
    const res = await api.post("/programs/adopt", program);
    const updated = await api.get("/programs");
    setPrograms(updated);
    return res;
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
      if (!dayId && dayLabel && w.day_label === dayLabel) return w;
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
      id: genId(),
      date: new Date().toISOString().split("T")[0],
      startTime: Date.now(),
      program_id: template?.program_id || program?.id || null,
      day_id: template?.day_id || day?.id || null,
      day_label: template?.day_label || day?.label || "Freestyle",
      exercises,
      feel: 3,
      notes: "",
      sleepHours: null,
    };
    setCurrent(workout);
    setTab("active");
    api.track("workout_started", { day_label: workout.day_label, from_template: !!template });
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
        <div style={{ color: "var(--accent)", fontSize: 14 }}>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  if (!loaded) {
    return (
      <div style={{ ...S.app, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "var(--accent)", fontSize: 14 }}>Loading...</div>
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
    api.track("onboarding_completed", { selected_program: program?.name || null, level: level || null });
  }

  async function skipOnboarding() {
    await updateProfile({ ...profile, onboardingComplete: true });
    api.track("onboarding_skipped");
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
    updateUser,
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
    adoptProgram,
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
                border: activeTab === "coach" ? "1px solid var(--accent)" : "1px solid var(--border2)",
                background: activeTab === "coach" ? "var(--accent-bg)" : "transparent",
                color: activeTab === "coach" ? "var(--accent)" : "var(--text-muted)",
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
            <div style={{ position: "relative" }}>
              <div
                onClick={() => setAvatarMenuOpen(!avatarMenuOpen)}
                style={S.avatar(user.color)}
              >
                {user.name?.[0]?.toUpperCase()}
              </div>
              {avatarMenuOpen && (
                <AvatarMenu
                  onProfile={() => setShowProfile(true)}
                  onSettings={() => setShowSettings(true)}
                  onAdmin={() => setShowAdmin(true)}
                  onAnalytics={() => setShowAnalytics(true)}
                  onLogout={logout}
                  onClose={() => setAvatarMenuOpen(false)}
                />
              )}
            </div>
          </div>
        </header>

        {/* PWA Install Prompt */}
        <InstallPrompt />

        {/* Modals */}
        {showSettings && (
          <SettingsModal
            onClose={() => setShowSettings(false)}
          />
        )}
        {showProfile && (
          <ProfileModal
            onClose={() => setShowProfile(false)}
          />
        )}
        {showAdmin && (
          <AdminPanel
            onBack={() => setShowAdmin(false)}
          />
        )}
        {showAnalytics && (
          <AnalyticsDashboard
            onBack={() => setShowAnalytics(false)}
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
                api.track("workout_discarded", { day_label: currentWorkout?.day_label });
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
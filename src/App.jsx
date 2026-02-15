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
import SettingsModal from "./components/SettingsModal";
import SessionSummary from "./components/SessionSummary";

export default function App() {
  // ── Auth state ──
  const [user, setUser] = useState(null);

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

  // ── Coach state (lifted here so it survives tab switches) ──
  const [coachHistory, setCoachHistory] = useState([]);
  const [coachMode, setCoachMode] = useState("chat");

  // ── Load user data on login ──
  useEffect(() => {
    if (!user) return;
    setLoaded(false);
    Promise.all([
      api.get(`/workouts?user_id=${user.id}`),
      api.get(`/profile?user_id=${user.id}`),
      api.get(`/programs?user_id=${user.id}`),
      api.get("/exercises"),
      api.get("/ai/config"),
      api.get(`/coach/messages?user_id=${user.id}`),
    ])
      .then(([w, p, pr, ex, ai, coachMsgs]) => {
        setWorkouts(w);
        setProfile(p);
        setPrograms(pr);
        setCustomExercises(ex);
        setAiConfig(ai);
        setCoachHistory(Array.isArray(coachMsgs) ? coachMsgs : []);
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
    await api.put("/profile", { user_id: user.id, ...p });
    const updated = await api.get(`/profile?user_id=${user.id}`);
    setProfile(updated);
  }

  async function saveProgram(p) {
    if (p.id) {
      await api.put(`/programs/${p.id}`, p);
    } else {
      const res = await api.post("/programs", { ...p, user_id: user.id });
      p.id = res.id;
    }
    const updated = await api.get(`/programs?user_id=${user.id}`);
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

  function startWorkout(program, day) {
    // MIGRATION NOTE: Copy the startWorkout function from App.jsx.
    // It builds the workout object from program day template or blank,
    // sets startTime, and switches to active tab.
    const workout = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      user_id: user.id,
      date: new Date().toISOString().split("T")[0],
      startTime: Date.now(),
      program_id: program?.id || null,
      day_id: day?.id || null,
      dayLabel: day?.label || "Freestyle",
      exercises: day?.exercises?.map((e) => ({
        name: e.name,
        sets: Array.from({ length: e.defaultSets || 3 }, () => ({
          weight: "",
          reps: "",
          rpe: "",
          completed: false,
        })),
        notes: "",
      })) || [],
      feel: 3,
      notes: "",
      sleepHours: null,
    };
    setCurrent(workout);
    setTab("active");
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

    // Trigger AI analysis if available
    if (aiConfig.enabled) {
      setSessionSummary({ workout: w, analysis: null, loading: true });
      setTab("summary");
      try {
        const res = await api.post("/ai/coach", {
          prompt: `Analyze my workout session I just completed. Give brief, specific feedback.`,
          context: `Completed workout: ${JSON.stringify(w)}`,
          user_id: user.id,
        });
        setSessionSummary((prev) => ({
          ...prev,
          analysis: res.response || res.message,
          loading: false,
        }));
      } catch {
        setSessionSummary((prev) => ({ ...prev, loading: false }));
      }
    } else {
      setSessionSummary({ workout: w, analysis: null, loading: false });
      setTab("summary");
    }
  }

  // ── Auth gate ──
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
    // Coach state (persists across tab switches)
    coachHistory,
    setCoachHistory,
    coachMode,
    setCoachMode,
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
              onClick={() => setTab("logPast")}
              title="Log past workout"
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                border: "1px solid #333",
                background: "transparent",
                color: "#737373",
                fontSize: 18,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "inherit",
                fontWeight: 300,
              }}
            >
              +
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
            onLogout={() => {
              setUser(null);
              setShowSettings(false);
              setTab("train");
              setCurrent(null);
            }}
          />
        )}

        {/* Page router */}
        {activeTab === "train" && <TrainPage onStartWorkout={startWorkout} onLogPast={() => setTab("logPast")} />}
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
            onSave={savePastWorkout}
            onCancel={() => setTab("train")}
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
          />
        )}
        {activeTab === "history" && <HistoryPage />}
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
          <button onClick={() => setTab("coach")} style={S.navBtn(activeTab === "coach")}>Coach</button>
        </nav>
      </div>
    </TalosContext.Provider>
  );
}

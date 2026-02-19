// ═══════════════════════ COACH PAGE ═══════════════════════
// AI Coach with persistent conversation history, multi-turn context,
// and server-side message storage. State is lifted to App.jsx context
// so it survives tab navigation.
//
// Modes:
//   chat     — conversational coaching (last 10 workouts context)
//   analysis — deep training analysis (full history, higher token budget)

import { useState, useRef, useEffect } from "react";
import { useTalos } from "../context/TalosContext";
import { est1RM, genId } from "../lib/helpers";
import { EXERCISES } from "../lib/exercises";
import api from "../lib/api";
import MarkdownText from "../components/MarkdownText";
import S from "../lib/styles";

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const now = new Date();
  const d = new Date(dateStr.endsWith("Z") ? dateStr : dateStr + "Z");
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function CoachPage() {
  const {
    workouts, profile, programs, user, saveProgram,
    coachHistory, setCoachHistory, coachMode, setCoachMode,
  } = useTalos();

  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const threadEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Migrate legacy coachMode values on mount
  useEffect(() => {
    if (coachMode === "program" || coachMode === "weekly") {
      setCoachMode("chat");
    }
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (threadEndRef.current) {
      threadEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [coachHistory, loading]);

  // ── PRs calculation ──
  const prs = {};
  workouts.forEach(w => w.exercises?.forEach(ex => ex.sets?.forEach(s => {
    if (!s.weight || !s.reps) return;
    const e = est1RM(s.weight, s.reps);
    if (!prs[ex.name] || (e && e > (prs[ex.name].e1rm || 0)))
      prs[ex.name] = { weight: s.weight, reps: s.reps, e1rm: e, date: w.date };
  })));

  // ── Build context string for chat (last 10 workouts) ──
  function buildContext() {
    const recent = workouts.slice(-10);
    const programCtx = programs.filter(p => p.user_id === user.id).map(p =>
      `${p.name}${p.description ? ` (${p.description})` : ""}:\n${p.days?.map((d, i) =>
        `  Day ${i + 1} — ${d.label || "Untitled"}${d.subtitle ? ` (${d.subtitle})` : ""}: ${d.exercises?.map(e => `${e.name} ${e.defaultSets}x${e.targetReps || "?"}`).join(", ") || "no exercises"}`
      ).join("\n") || "no days"}`
    ).join("\n\n");
    const age = profile.dateOfBirth ? Math.floor((Date.now() - new Date(profile.dateOfBirth + "T12:00:00").getTime()) / 31557600000) : null;
    const profileLines = [
      `Name: ${user.name}`,
      profile.sex ? `Sex: ${profile.sex}` : null,
      age ? `Age: ${age}` : null,
      profile.height ? `Height: ${profile.height}` : null,
      profile.weight ? `Weight: ${profile.weight} lbs` : null,
      profile.bodyFat ? `Body Fat: ${profile.bodyFat}%` : null,
      profile.goal ? `Goal: ${profile.goal}` : null,
      profile.targetWeight ? `Target Weight: ${profile.targetWeight} lbs` : null,
      profile.experienceLevel ? `Experience: ${profile.experienceLevel}` : null,
      profile.trainingIntensity ? `Training Intensity: ${profile.trainingIntensity}` : null,
      profile.caloriesTarget ? `Calorie Target: ${profile.caloriesTarget} kcal/day` : null,
      profile.proteinTarget ? `Protein Target: ${profile.proteinTarget}g/day` : null,
      profile.equipmentPreference ? `Equipment: ${profile.equipmentPreference.replace('_', ' ')}` : null,
    ].filter(Boolean).join(", ");
    const isRir = profile.intensityScale === "rir";
    const scaleLabel = isRir ? "RIR" : "RPE";
    const scaleExplain = isRir
      ? "Intensity scale: RIR (Reps In Reserve — lower = harder/closer to failure, 0 = absolute failure)"
      : "Intensity scale: RPE (Rate of Perceived Exertion — higher = harder, 10 = max effort)";
    const fmtIntensity = (s) => s.rpe != null && s.rpe !== "" ? ` @${scaleLabel}:${s.rpe}` : "";
    const targetPrLines = profile.targetPrs && Object.keys(profile.targetPrs).length > 0
      ? `TARGET PRs:\n${Object.entries(profile.targetPrs).filter(([, v]) => v).map(([k, v]) => `${k}: ${v} lbs`).join("\n")}` : "";
    const recentExNames = new Set();
    workouts.slice(-10).forEach(w => w.exercises?.forEach(ex => recentExNames.add(ex.name)));

    const exerciseMeta = [...recentExNames].slice(0, 20).map(name => {
      const ex = EXERCISES.find(e => e.name === name);
      return ex ? `${name} (${ex.muscle}, ${ex.equipment}, ${ex.type})` : name;
    }).join("\n");
    const injuryLines = profile.injuriesNotes ? `INJURIES/LIMITATIONS: ${profile.injuriesNotes}` : "";
    return `USER: ${profileLines}
    ${scaleExplain}
    ${injuryLines}
    ${targetPrLines}
    PROGRAMS:\n${programCtx || "None"}
    PRs:\n${Object.entries(prs).slice(0, 15).map(([k, v]) => `${k}: ${v.weight}x${v.reps} (e1RM: ${v.e1rm || "?"})`).join("\n")}
    EXERCISE INFO:\n${exerciseMeta}
    RECENT (${recent.length}):\n${recent.map(w => `${w.date} ${w.day_label || ""} (Feel:${w.feel}/5)\n${w.exercises?.map(e => `  ${e.name}: ${e.sets?.map(s => `${s.weight}x${s.reps}${fmtIntensity(s)}`).join(", ")}`).join("\n") || ""}`).join("\n\n")}`;
  }

  // ── Build deep analysis context (full history, volume trends, PR timeline) ──
  function buildDeepContext() {
    const age = profile.dateOfBirth ? Math.floor((Date.now() - new Date(profile.dateOfBirth + "T12:00:00").getTime()) / 31557600000) : null;
    const profileLines = [
      `Name: ${user.name}`,
      profile.sex ? `Sex: ${profile.sex}` : null,
      age ? `Age: ${age}` : null,
      profile.height ? `Height: ${profile.height}` : null,
      profile.weight ? `Weight: ${profile.weight} lbs` : null,
      profile.bodyFat ? `Body Fat: ${profile.bodyFat}%` : null,
      profile.goal ? `Goal: ${profile.goal}` : null,
      profile.targetWeight ? `Target Weight: ${profile.targetWeight} lbs` : null,
      profile.experienceLevel ? `Experience: ${profile.experienceLevel}` : null,
      profile.trainingIntensity ? `Training Intensity: ${profile.trainingIntensity}` : null,
      profile.caloriesTarget ? `Calorie Target: ${profile.caloriesTarget} kcal/day` : null,
      profile.proteinTarget ? `Protein Target: ${profile.proteinTarget}g/day` : null,
      profile.equipmentPreference ? `Equipment: ${profile.equipmentPreference.replace('_', ' ')}` : null,
    ].filter(Boolean).join(", ");
    const injuryLines = profile.injuriesNotes ? `INJURIES/LIMITATIONS: ${profile.injuriesNotes}` : "";
    const targetPrLines = profile.targetPrs && Object.keys(profile.targetPrs).length > 0
      ? `TARGET PRs:\n${Object.entries(profile.targetPrs).filter(([, v]) => v).map(([k, v]) => `${k}: ${v} lbs`).join("\n")}` : "";
    const isRir = profile.intensityScale === "rir";
    const scaleLabel = isRir ? "RIR" : "RPE";
    const scaleExplain = isRir
      ? "Intensity scale: RIR (Reps In Reserve — lower = harder/closer to failure, 0 = absolute failure)"
      : "Intensity scale: RPE (Rate of Perceived Exertion — higher = harder, 10 = max effort)";
    const fmtIntensity = (s) => s.rpe != null && s.rpe !== "" ? ` @${scaleLabel}:${s.rpe}` : "";

    // Programs
    const programCtx = programs.filter(p => p.user_id === user.id).map(p =>
      `${p.name}${p.description ? ` (${p.description})` : ""}:\n${p.days?.map((d, i) =>
        `  Day ${i + 1} — ${d.label || "Untitled"}${d.subtitle ? ` (${d.subtitle})` : ""}: ${d.exercises?.map(e => `${e.name} ${e.defaultSets}x${e.targetReps || "?"}`).join(", ") || "no exercises"}`
      ).join("\n") || "no days"}`
    ).join("\n\n");

    // Use up to 90 days of workouts for deep analysis (vs 10 for chat)
    const ninetyDaysAgo = new Date(); ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const deepWorkouts = workouts.filter(w => new Date(w.date + "T12:00:00") >= ninetyDaysAgo);

    // Compute volume per muscle group per week (last 4 weeks)
    const weeklyVolume = {};
    for (let i = 0; i < 4; i++) {
      const end = new Date(); end.setDate(end.getDate() - i * 7);
      const start = new Date(); start.setDate(start.getDate() - (i + 1) * 7);
      const label = i === 0 ? "This Week" : i === 1 ? "Last Week" : `${i + 1} Weeks Ago`;
      const weekWorkouts = workouts.filter(w => {
        const d = new Date(w.date + "T12:00:00");
        return d >= start && d < end;
      });
      const muscles = {};
      weekWorkouts.forEach(w => w.exercises?.forEach(ex => {
        const meta = EXERCISES.find(e => e.name === ex.name);
        const muscle = meta?.muscle || "Other";
        const sets = ex.sets?.length || 0;
        muscles[muscle] = (muscles[muscle] || 0) + sets;
      }));
      weeklyVolume[label] = { sessions: weekWorkouts.length, muscles };
    }

    // PR progression timeline — best e1RM per exercise per month
    const prTimeline = {};
    workouts.forEach(w => w.exercises?.forEach(ex => ex.sets?.forEach(s => {
      if (!s.weight || !s.reps) return;
      const e1rm = est1RM(s.weight, s.reps);
      if (!prTimeline[ex.name]) prTimeline[ex.name] = [];
      prTimeline[ex.name].push({ date: w.date, weight: s.weight, reps: s.reps, e1rm });
    })));
    const prTrends = {};
    Object.entries(prTimeline).forEach(([name, entries]) => {
      const best = {};
      entries.forEach(e => {
        const monthKey = e.date.substring(0, 7);
        if (!best[monthKey] || e.e1rm > best[monthKey].e1rm) best[monthKey] = e;
      });
      const sorted = Object.entries(best).sort(([a], [b]) => a.localeCompare(b));
      if (sorted.length >= 2) {
        prTrends[name] = sorted.slice(-4).map(([month, d]) => `${month}: ${d.weight}x${d.reps} (e1RM: ${Math.round(d.e1rm)})`);
      }
    });

    // Frequency analysis
    const totalSessions = deepWorkouts.length;
    const spanDays = deepWorkouts.length >= 2
      ? Math.max(1, Math.round((new Date(deepWorkouts[deepWorkouts.length - 1].date + "T12:00:00") - new Date(deepWorkouts[0].date + "T12:00:00")) / 86400000))
      : 0;
    const avgFreq = spanDays > 0 ? (totalSessions / spanDays * 7).toFixed(1) : "N/A";

    // Feel trend
    const feelEntries = deepWorkouts.filter(w => w.feel).map(w => ({ date: w.date, feel: w.feel }));
    const recentFeel = feelEntries.slice(-10);

    // Exercise metadata
    const allExNames = new Set();
    deepWorkouts.forEach(w => w.exercises?.forEach(ex => allExNames.add(ex.name)));
    const exerciseMeta = [...allExNames].slice(0, 30).map(name => {
      const ex = EXERCISES.find(e => e.name === name);
      return ex ? `${name} (${ex.muscle}, ${ex.equipment}, ${ex.type})` : name;
    }).join("\n");

    // Format detailed workout logs: last 30 days full detail, older condensed
    const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentDetailed = deepWorkouts.filter(w => new Date(w.date + "T12:00:00") >= thirtyDaysAgo);
    const olderCondensed = deepWorkouts.filter(w => new Date(w.date + "T12:00:00") < thirtyDaysAgo);

    const recentLogs = recentDetailed.map(w =>
      `${w.date} ${w.day_label || ""} (Feel:${w.feel || "?"}/5, Sleep:${w.sleep_hours || "?"}h, Duration:${w.duration || "?"}min)\n${w.exercises?.map(e => `  ${e.name}: ${e.sets?.map(s => `${s.weight}x${s.reps}${fmtIntensity(s)}`).join(", ")}`).join("\n") || ""}`
    ).join("\n\n");

    const olderLogs = olderCondensed.map(w =>
      `${w.date} ${w.day_label || ""} (Feel:${w.feel || "?"}/5) — ${w.exercises?.map(e => `${e.name}: ${e.sets?.length || 0}s`).join(", ") || "no data"}`
    ).join("\n");

    return `USER PROFILE: ${profileLines}
${scaleExplain}
${injuryLines}
${targetPrLines}

PROGRAMS:\n${programCtx || "None"}

ALL-TIME PRs:\n${Object.entries(prs).slice(0, 20).map(([k, v]) => `${k}: ${v.weight}x${v.reps} (e1RM: ${Math.round(v.e1rm || 0)}) — set ${v.date}`).join("\n")}

PR TRENDS (monthly best e1RM):\n${Object.entries(prTrends).slice(0, 15).map(([name, months]) => `${name}: ${months.join(" → ")}`).join("\n") || "Not enough data"}

TRAINING FREQUENCY: ${avgFreq} sessions/week over ${spanDays} days (${totalSessions} total sessions in 90-day window)

WEEKLY VOLUME (sets per muscle, last 4 weeks):\n${Object.entries(weeklyVolume).map(([week, data]) => `${week} (${data.sessions} sessions): ${Object.entries(data.muscles).map(([m, s]) => `${m}:${s}`).join(", ") || "no sessions"}`).join("\n")}

FEEL TREND (recent 10): ${recentFeel.map(f => `${f.date}:${f.feel}/5`).join(", ") || "No data"}

EXERCISE INFO:\n${exerciseMeta}

DETAILED LOGS (last 30 days, ${recentDetailed.length} sessions):\n${recentLogs || "No sessions"}

${olderCondensed.length > 0 ? `OLDER LOGS (30-90 days, ${olderCondensed.length} sessions):\n${olderLogs}` : ""}`;
  }

  // ── Persist message to server ──
  async function persistMessage(msg) {
    try {
      await api.post("/coach/messages", {
        id: msg.id,
        type: msg.type,
        prompt: msg.prompt,
        response: msg.response,
      });
    } catch (e) {
      console.error("Failed to persist coach message:", e.message);
    }
  }

  // ── Chat: ask the AI coach (multi-turn) ──
  async function ask(q) {
    if (!q?.trim()) return;
    const msgId = genId();
    const newMsg = { id: msgId, type: "chat", prompt: q, response: null, created_at: new Date().toISOString() };

    setCoachHistory(prev => [...prev, newMsg]);
    setPrompt("");
    setLoading(true);

    try {
      const chatHistory = coachHistory.filter(m => m.type === "chat" && m.response);
      const data = await api.post("/coach", {
        prompt: q,
        context: buildContext(),
        history: chatHistory.slice(-6),
      });
      const responseText = data.response || data.error || "No response.";
      const completedMsg = { ...newMsg, response: responseText };

      setCoachHistory(prev => prev.map(m => m.id === msgId ? completedMsg : m));
      await persistMessage(completedMsg);
    } catch (e) {
      const errorMsg = { ...newMsg, response: "Error: " + e.message };
      setCoachHistory(prev => prev.map(m => m.id === msgId ? errorMsg : m));
    }
    setLoading(false);
  }

  // ── Deep Analysis ──
  async function generateDeepAnalysis() {
    const msgId = genId();
    const newMsg = { id: msgId, type: "analysis", prompt: "Deep Training Analysis", response: null, created_at: new Date().toISOString() };

    setCoachHistory(prev => [...prev, newMsg]);
    setLoading(true);

    try {
      const data = await api.post("/coach/analysis", { context: buildDeepContext() });
      const responseText = data.report || "No analysis generated.";
      const completedMsg = { ...newMsg, response: responseText };
      setCoachHistory(prev => prev.map(m => m.id === msgId ? completedMsg : m));
      await persistMessage(completedMsg);
    } catch (e) {
      const errorMsg = { ...newMsg, response: "Error: " + e.message };
      setCoachHistory(prev => prev.map(m => m.id === msgId ? errorMsg : m));
    }
    setLoading(false);
  }

  // ── Clear history ──
  async function clearHistory() {
    try {
      await api.del("/coach/messages");
    } catch (e) {
      console.error("Failed to clear history:", e.message);
    }
    setCoachHistory([]);
    setShowClearConfirm(false);
  }

  // ── Delete single message ──
  async function deleteMessage(id) {
    setCoachHistory(prev => prev.filter(m => m.id !== id));
    try {
      await api.del(`/coach/messages/${id}`);
    } catch (e) {
      console.error("Failed to delete message:", e.message);
    }
  }

  // ── Copy response text ──
  function copyResponse(id, text) {
    navigator.clipboard?.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    });
  }

  // ── Handle submit ──
  function handleSubmit() {
    if (coachMode === "chat") ask(prompt);
    else if (coachMode === "analysis") generateDeepAnalysis();
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey && coachMode === "chat") {
      e.preventDefault();
      handleSubmit();
    }
  }

  // ── Filter history by current mode ──
  // Legacy: "program" messages show under chat, "weekly" under analysis
  const filteredHistory = coachHistory.filter(m => {
    if (coachMode === "chat") return m.type === "chat" || m.type === "program";
    if (coachMode === "analysis") return m.type === "analysis" || m.type === "weekly";
    return true;
  });

  const quick = [
    { l: "Next workout", p: "Give me specific target weights and reps for my next workout based on progressive overload." },
    { l: "Plateau advice", p: "Analyze my data for any lifts that have plateaued and give me a plan to break through." },
    { l: "Program review", p: "Review my recent volume, exercise selection, and progression. What should I adjust?" },
    { l: "Recovery check", p: "Based on my feel ratings and frequency, how is my recovery? Should I adjust?" },
  ];

  // ── Type badge for messages ──
  function TypeBadge({ type }) {
    const cfg = {
      chat: { icon: "⚡", color: "var(--accent)" },
      program: { icon: "⚡", color: "var(--accent)" },
      analysis: { icon: "🔬", color: "#a78bfa" },
      weekly: { icon: "🔬", color: "#a78bfa" },
    }[type] || { icon: "⚡", color: "var(--accent)" };
    return (
      <span style={{
        fontSize: 9, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase",
        color: cfg.color, opacity: 0.8,
      }}>
        {cfg.icon} {type === "weekly" ? "analysis" : type === "program" ? "chat" : type}
      </span>
    );
  }

  const analysisWorkoutCount = workouts.filter(w => {
    const d = new Date(w.date + "T12:00:00");
    const ninetyDaysAgo = new Date(); ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    return d >= ninetyDaysAgo;
  }).length;

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", minHeight: "calc(100dvh - 130px)" }}>
      {/* ── Header Card ── */}
      <div style={S.card}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>⚡</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-bright)" }}>AI Coach</div>
              <div style={{ fontSize: 10, color: "var(--text-dim)" }}>
                {coachMode === "analysis"
                  ? `Deep analysis · ${analysisWorkoutCount} sessions (90 days)`
                  : `Analyzes your last ${Math.min(workouts.length, 10)} workouts`}
              </div>
            </div>
          </div>
          {coachHistory.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              style={{ ...S.sm("ghost"), fontSize: 9, color: "var(--text-dim)", padding: "3px 6px" }}
              title="Clear conversation history"
            >
              Clear
            </button>
          )}
        </div>

        {/* Mode toggle */}
        <div style={{ display: "flex", gap: 4, background: "#171717", borderRadius: 6, padding: 3 }}>
          <button onClick={() => setCoachMode("chat")} style={{ ...S.sm(coachMode === "chat" ? "primary" : "ghost"), flex: 1, textAlign: "center" }}>💬 Chat</button>
          <button onClick={() => setCoachMode("analysis")} style={{ ...S.sm(coachMode === "analysis" ? "primary" : "ghost"), flex: 1, textAlign: "center" }}>🔬 Deep Analysis</button>
        </div>
      </div>

      {/* ── Clear Confirmation ── */}
      {showClearConfirm && (
        <div style={{ ...S.card, border: "1px solid #92400e", background: "#1c1207" }}>
          <div style={{ fontSize: 12, color: "#fbbf24", marginBottom: 8 }}>Clear all conversation history?</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 10 }}>This removes all saved messages across Chat and Analysis modes.</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setShowClearConfirm(false)} style={{ ...S.btn("ghost"), flex: 1 }}>Cancel</button>
            <button onClick={clearHistory} style={{ ...S.btn("danger"), flex: 1 }}>Clear All</button>
          </div>
        </div>
      )}

      {/* ── Quick Actions (chat mode, only when empty) ── */}
      {coachMode === "chat" && filteredHistory.length === 0 && !loading && (
        <div style={S.card}>
          <div style={S.label}>Quick Actions</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {quick.map((q, i) => (
              <button key={i} onClick={() => { setPrompt(q.p); ask(q.p); }} style={S.sm()}>
                {q.l}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Deep Analysis description (only when empty) ── */}
      {coachMode === "analysis" && filteredHistory.length === 0 && !loading && (
        <div style={S.card}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8, marginBottom: 10,
            padding: "8px 12px", background: "linear-gradient(135deg, rgba(167,139,250,0.1), rgba(139,92,246,0.05))",
            borderRadius: 8, border: "1px solid rgba(167,139,250,0.2)",
          }}>
            <span style={{ fontSize: 20 }}>🔬</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#a78bfa" }}>Deep Training Analysis</div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 1 }}>Comprehensive review using your full training history</div>
            </div>
          </div>
          <div style={{ fontSize: 11, color: "var(--text-light)", lineHeight: 1.6 }}>
            Generates an in-depth analysis of your training using up to 90 days of data — far more context than standard chat. Covers:
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.6, marginTop: 6, paddingLeft: 8, borderLeft: "2px solid rgba(167,139,250,0.3)" }}>
            Strength progression trends · Volume distribution by muscle group ·
            Training frequency patterns · Recovery & fatigue signals ·
            Muscle imbalance detection · Periodization analysis ·
            Specific action items for the next training block
          </div>
          {analysisWorkoutCount < 5 && (
            <div style={{ fontSize: 10, color: "#fbbf24", marginTop: 8, fontStyle: "italic" }}>
              ⚠ Only {analysisWorkoutCount} session{analysisWorkoutCount !== 1 ? "s" : ""} in the last 90 days — analysis works best with 10+ sessions.
            </div>
          )}
        </div>
      )}

      {/* ── Conversation Thread ── */}
      {filteredHistory.length > 0 && (
        <div style={{ flex: 1, overflow: "auto", paddingBottom: 8 }}>
          {filteredHistory.map((msg) => (
            <div key={msg.id}>
              {/* User prompt bubble (chat messages only) */}
              {msg.prompt && msg.type !== "weekly" && msg.type !== "analysis" && (
                <div style={{ padding: "4px 16px", display: "flex", justifyContent: "flex-end" }}>
                  <div style={{
                    background: "#1e1b13", border: "1px solid #3d3520", borderRadius: "12px 12px 4px 12px",
                    padding: "10px 14px", maxWidth: "85%",
                  }}>
                    <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{msg.prompt}</div>
                    <div style={{ fontSize: 9, color: "var(--text-dim)", marginTop: 4, textAlign: "right" }}>
                      {timeAgo(msg.created_at)}
                    </div>
                  </div>
                </div>
              )}

              {/* Analysis / Weekly request bubble */}
              {(msg.type === "analysis" || msg.type === "weekly") && (
                <div style={{ padding: "4px 16px", display: "flex", justifyContent: "flex-end" }}>
                  <div style={{
                    background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.2)", borderRadius: "12px 12px 4px 12px",
                    padding: "10px 14px",
                  }}>
                    <div style={{ fontSize: 12, color: "#a78bfa", fontWeight: 700 }}>🔬 Deep Analysis</div>
                    <div style={{ fontSize: 9, color: "var(--text-dim)", marginTop: 4, textAlign: "right" }}>
                      {timeAgo(msg.created_at)}
                    </div>
                  </div>
                </div>
              )}

              {/* AI response bubble */}
              {msg.response ? (
                <div style={{ padding: "4px 16px", display: "flex", justifyContent: "flex-start" }}>
                  <div style={{
                    background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px 12px 12px 4px",
                    padding: "10px 14px", maxWidth: "92%", width: "100%",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <TypeBadge type={msg.type} />
                      <div style={{ display: "flex", gap: 4 }}>
                        <button
                          onClick={() => copyResponse(msg.id, msg.response)}
                          style={{ ...S.sm("ghost"), fontSize: 9, padding: "2px 6px", color: copiedId === msg.id ? "#4ade80" : "var(--text-dim)", border: "none" }}
                        >
                          {copiedId === msg.id ? "Copied" : "Copy"}
                        </button>
                        <button
                          onClick={() => deleteMessage(msg.id)}
                          style={{ ...S.sm("ghost"), fontSize: 9, padding: "2px 6px", color: "var(--text-dim)", border: "none" }}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                    <MarkdownText text={msg.response} />
                  </div>
                </div>
              ) : msg.id === filteredHistory[filteredHistory.length - 1]?.id && loading ? (
                <div style={{ padding: "4px 16px" }}>
                  <div style={{
                    background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px 12px 12px 4px",
                    padding: "16px", textAlign: "center",
                  }}>
                    <div style={{ color: coachMode === "analysis" ? "#a78bfa" : "var(--accent)", fontSize: 12 }}>
                      <span style={{
                        display: "inline-block", width: 6, height: 6, borderRadius: "50%",
                        background: coachMode === "analysis" ? "#a78bfa" : "var(--accent)", marginRight: 8, animation: "pulse 1.2s infinite",
                      }} />
                      {coachMode === "analysis" ? "Running deep analysis — this may take a moment..." : "Thinking..."}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ))}
          <div ref={threadEndRef} />
        </div>
      )}

      {/* ── Loading (when thread is empty) ── */}
      {loading && filteredHistory.length === 0 && (
        <div style={{ ...S.card, textAlign: "center" }}>
          <div style={{ color: coachMode === "analysis" ? "#a78bfa" : "var(--accent)", fontSize: 12, padding: 8 }}>
            <span style={{
              display: "inline-block", width: 6, height: 6, borderRadius: "50%",
              background: coachMode === "analysis" ? "#a78bfa" : "var(--accent)", marginRight: 8, animation: "pulse 1.2s infinite",
            }} />
            {coachMode === "analysis" ? "Running deep analysis — this may take a moment..." : "Analyzing training data..."}
          </div>
        </div>
      )}

      {/* ── Input Area (sticky at bottom) ── */}
      <div style={{ ...S.card, marginTop: "auto", position: "sticky", bottom: 60, zIndex: 10 }}>
        {/* Quick actions row (compact, visible when history exists) */}
        {coachMode === "chat" && filteredHistory.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
            {quick.map((q, i) => (
              <button key={i} onClick={() => { setPrompt(q.p); ask(q.p); }} disabled={loading}
                style={{ ...S.sm("ghost"), fontSize: 9, padding: "3px 6px", opacity: loading ? 0.4 : 1 }}>
                {q.l}
              </button>
            ))}
          </div>
        )}

        {coachMode === "analysis" ? (
          <button
            onClick={generateDeepAnalysis}
            disabled={loading}
            style={{
              ...S.btn("primary"), width: "100%", opacity: loading ? 0.5 : 1,
              background: loading ? undefined : "linear-gradient(135deg, #7c3aed, #6d28d9)",
              borderColor: "#7c3aed",
            }}
          >
            {loading ? "Running deep analysis..." : "🔬 Generate Deep Analysis"}
          </button>
        ) : (
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{
                ...S.input, flex: 1, minHeight: 40, maxHeight: 120, resize: "none",
                paddingRight: 8, fontSize: 13, lineHeight: 1.4,
              }}
              placeholder="Ask about training, nutrition, substitutions..."
              rows={1}
            />
            <button
              onClick={handleSubmit}
              disabled={loading || !prompt.trim()}
              style={{
                ...S.btn("primary"),
                padding: "10px 14px",
                opacity: (loading || !prompt.trim()) ? 0.4 : 1,
                flexShrink: 0,
                whiteSpace: "nowrap",
              }}
            >
              {loading ? "..." : "Send"}
            </button>
          </div>
        )}
      </div>

      {/* Pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
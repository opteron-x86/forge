// ═══════════════════════ COACH PAGE ═══════════════════════
// AI Coach with persistent conversation history, multi-turn context,
// and server-side message storage. State is lifted to App.jsx context
// so it survives tab navigation.

import { useState, useRef, useEffect } from "react";
import { useTalos } from "../context/TalosContext";
import { est1RM, genId } from "../lib/helpers";
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
  const [programPreview, setProgramPreview] = useState(null);
  const [programSaving, setProgramSaving] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const threadEndRef = useRef(null);
  const textareaRef = useRef(null);

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

  // ── Build context string for AI ──
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
    ].filter(Boolean).join(", ");
    const targetPrLines = profile.targetPrs && Object.keys(profile.targetPrs).length > 0
      ? `TARGET PRs:\n${Object.entries(profile.targetPrs).filter(([, v]) => v).map(([k, v]) => `${k}: ${v} lbs`).join("\n")}` : "";
    const injuryLines = profile.injuriesNotes ? `INJURIES/LIMITATIONS: ${profile.injuriesNotes}` : "";
    return `USER: ${profileLines}
    ${injuryLines}
    ${targetPrLines}
    PROGRAMS:\n${programCtx || "None"}
    PRs:\n${Object.entries(prs).slice(0, 15).map(([k, v]) => `${k}: ${v.weight}x${v.reps} (e1RM: ${v.e1rm || "?"})`).join("\n")}
    RECENT (${recent.length}):\n${recent.map(w => `${w.date} ${w.day_label || ""} (Feel:${w.feel}/5)\n${w.exercises?.map(e => `  ${e.name}: ${e.sets?.map(s => `${s.weight}x${s.reps}`).join(", ")}`).join("\n") || ""}`).join("\n\n")}`;
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
      // Send recent chat history for multi-turn context
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

  // ── Program builder ──
  async function buildProgram(q) {
    if (!q?.trim()) return;
    const msgId = genId();
    const newMsg = { id: msgId, type: "program", prompt: q, response: null, created_at: new Date().toISOString() };

    setCoachHistory(prev => [...prev, newMsg]);
    setPrompt("");
    setLoading(true);
    setProgramPreview(null);

    try {
      const data = await api.post("/coach/program", { prompt: q, context: buildContext() });
      if (data.program) {
        setProgramPreview(data);
        const responseText = `Generated: **${data.program.name}**\n${data.program.description || ""}\n\n${data.program.days?.map((d, i) => `Day ${i + 1} — ${d.label}: ${d.exercises?.map(e => e.name).join(", ")}`).join("\n")}${data.commentary ? `\n\n${data.commentary}` : ""}`;
        const completedMsg = { ...newMsg, response: responseText };
        setCoachHistory(prev => prev.map(m => m.id === msgId ? completedMsg : m));
        await persistMessage(completedMsg);
      } else {
        const responseText = data.commentary || "Could not generate program. Try being more specific.";
        const completedMsg = { ...newMsg, response: responseText };
        setCoachHistory(prev => prev.map(m => m.id === msgId ? completedMsg : m));
        await persistMessage(completedMsg);
      }
    } catch (e) {
      const errorMsg = { ...newMsg, response: "Error: " + e.message };
      setCoachHistory(prev => prev.map(m => m.id === msgId ? errorMsg : m));
    }
    setLoading(false);
  }

  async function saveProgramFromPreview() {
    if (!programPreview?.program) return;
    setProgramSaving(true);
    try {
      await saveProgram({
        id: null,
        name: programPreview.program.name,
        description: programPreview.program.description || "",
        days: programPreview.program.days,
        shared: false,
      });
      setProgramPreview(null);
    } catch (e) {
      console.error("Save error:", e.message);
    }
    setProgramSaving(false);
  }

  // ── Weekly report ──
  async function generateWeeklyReport() {
    const msgId = genId();
    const newMsg = { id: msgId, type: "weekly", prompt: "Weekly Training Report", response: null, created_at: new Date().toISOString() };

    setCoachHistory(prev => [...prev, newMsg]);
    setLoading(true);

    const context = buildContext();
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    const thisWeek = workouts.filter(w => new Date(w.date + "T12:00:00") >= weekAgo);
    const twoWeeksAgo = new Date(); twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const lastWeek = workouts.filter(w => {
      const d = new Date(w.date + "T12:00:00");
      return d >= twoWeeksAgo && d < weekAgo;
    });

    const weeklyCtx = `${context}\n\nTHIS WEEK (${thisWeek.length} sessions):\n${thisWeek.map(w => `${w.date} ${w.day_label || ""} (Feel:${w.feel}/5, Sleep:${w.sleep_hours || "?"}h, Duration:${w.duration || "?"}min)\n${w.exercises?.map(e => `  ${e.name}: ${e.sets?.map(s => `${s.weight}x${s.reps}`).join(", ")}`).join("\n") || ""}`).join("\n\n")}\n\nPREVIOUS WEEK (${lastWeek.length} sessions):\n${lastWeek.map(w => `${w.date} ${w.day_label || ""} (Feel:${w.feel}/5)\n${w.exercises?.map(e => `  ${e.name}: ${e.sets?.map(s => `${s.weight}x${s.reps}`).join(", ")}`).join("\n") || ""}`).join("\n\n")}`;

    try {
      const data = await api.post("/coach/weekly", { context: weeklyCtx });
      const responseText = data.report || "No report generated.";
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
    setProgramPreview(null);
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

  // ── Handle submit (route by mode) ──
  function handleSubmit() {
    if (coachMode === "chat") ask(prompt);
    else if (coachMode === "program") buildProgram(prompt);
    else if (coachMode === "weekly") generateWeeklyReport();
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey && coachMode !== "weekly") {
      e.preventDefault();
      handleSubmit();
    }
  }

  // ── Filter history by current mode ──
  const filteredHistory = coachHistory.filter(m => {
    if (coachMode === "chat") return m.type === "chat";
    if (coachMode === "program") return m.type === "program";
    if (coachMode === "weekly") return m.type === "weekly";
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
      chat: { icon: "⚡", color: "#c9952d" },
      program: { icon: "📋", color: "#3b82f6" },
      weekly: { icon: "📊", color: "#22c55e" },
    }[type] || { icon: "⚡", color: "#c9952d" };
    return (
      <span style={{
        fontSize: 9, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase",
        color: cfg.color, opacity: 0.8,
      }}>
        {cfg.icon} {type}
      </span>
    );
  }

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", minHeight: "calc(100dvh - 130px)" }}>
      {/* ── Header Card ── */}
      <div style={S.card}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>⚡</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fafafa" }}>AI Coach</div>
              <div style={{ fontSize: 10, color: "#525252" }}>
                {coachMode === "weekly"
                  ? "7-day training analysis"
                  : `Analyzes your last ${Math.min(workouts.length, 10)} workouts`}
              </div>
            </div>
          </div>
          {coachHistory.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              style={{ ...S.sm("ghost"), fontSize: 9, color: "#525252", padding: "3px 6px" }}
              title="Clear conversation history"
            >
              Clear
            </button>
          )}
        </div>

        {/* Mode toggle */}
        <div style={{ display: "flex", gap: 4, background: "#171717", borderRadius: 6, padding: 3 }}>
          <button onClick={() => setCoachMode("chat")} style={{ ...S.sm(coachMode === "chat" ? "primary" : "ghost"), flex: 1, textAlign: "center" }}>💬 Chat</button>
          <button onClick={() => setCoachMode("program")} style={{ ...S.sm(coachMode === "program" ? "primary" : "ghost"), flex: 1, textAlign: "center" }}>📋 Program</button>
          <button onClick={() => setCoachMode("weekly")} style={{ ...S.sm(coachMode === "weekly" ? "primary" : "ghost"), flex: 1, textAlign: "center" }}>📊 Weekly</button>
        </div>
      </div>

      {/* ── Clear Confirmation ── */}
      {showClearConfirm && (
        <div style={{ ...S.card, border: "1px solid #92400e", background: "#1c1207" }}>
          <div style={{ fontSize: 12, color: "#fbbf24", marginBottom: 8 }}>Clear all conversation history?</div>
          <div style={{ fontSize: 11, color: "#737373", marginBottom: 10 }}>This removes all saved messages across Chat, Program, and Weekly modes.</div>
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

      {/* ── Weekly description (only when empty) ── */}
      {coachMode === "weekly" && filteredHistory.length === 0 && !loading && (
        <div style={S.card}>
          <div style={{ fontSize: 11, color: "#a3a3a3", lineHeight: 1.5 }}>
            Generate an AI analysis of your past 7 days — volume by muscle group, progression trends, recovery signals, and action items for next week.
          </div>
        </div>
      )}

      {/* ── Conversation Thread ── */}
      {filteredHistory.length > 0 && (
        <div style={{ flex: 1, overflow: "auto", paddingBottom: 8 }}>
          {filteredHistory.map((msg) => (
            <div key={msg.id}>
              {/* User prompt bubble */}
              {msg.prompt && msg.type !== "weekly" && (
                <div style={{ padding: "4px 16px", display: "flex", justifyContent: "flex-end" }}>
                  <div style={{
                    background: "#1e1b13", border: "1px solid #3d3520", borderRadius: "12px 12px 4px 12px",
                    padding: "10px 14px", maxWidth: "85%",
                  }}>
                    <div style={{ fontSize: 13, color: "#e5e5e5", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{msg.prompt}</div>
                    <div style={{ fontSize: 9, color: "#525252", marginTop: 4, textAlign: "right" }}>
                      {timeAgo(msg.created_at)}
                    </div>
                  </div>
                </div>
              )}

              {/* Weekly report request bubble */}
              {msg.type === "weekly" && (
                <div style={{ padding: "4px 16px", display: "flex", justifyContent: "flex-end" }}>
                  <div style={{
                    background: "#0d1f0d", border: "1px solid #1a3a1a", borderRadius: "12px 12px 4px 12px",
                    padding: "10px 14px",
                  }}>
                    <div style={{ fontSize: 12, color: "#4ade80", fontWeight: 700 }}>📊 Weekly Report</div>
                    <div style={{ fontSize: 9, color: "#525252", marginTop: 4, textAlign: "right" }}>
                      {timeAgo(msg.created_at)}
                    </div>
                  </div>
                </div>
              )}

              {/* AI response bubble */}
              {msg.response ? (
                <div style={{ padding: "4px 16px", display: "flex", justifyContent: "flex-start" }}>
                  <div style={{
                    background: "#141414", border: "1px solid #262626", borderRadius: "12px 12px 12px 4px",
                    padding: "10px 14px", maxWidth: "92%", width: "100%",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <TypeBadge type={msg.type} />
                      <div style={{ display: "flex", gap: 4 }}>
                        <button
                          onClick={() => copyResponse(msg.id, msg.response)}
                          style={{ ...S.sm("ghost"), fontSize: 9, padding: "2px 6px", color: copiedId === msg.id ? "#4ade80" : "#525252", border: "none" }}
                        >
                          {copiedId === msg.id ? "Copied" : "Copy"}
                        </button>
                        <button
                          onClick={() => deleteMessage(msg.id)}
                          style={{ ...S.sm("ghost"), fontSize: 9, padding: "2px 6px", color: "#525252", border: "none" }}
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
                    background: "#141414", border: "1px solid #262626", borderRadius: "12px 12px 12px 4px",
                    padding: "16px", textAlign: "center",
                  }}>
                    <div style={{ color: "#c9952d", fontSize: 12 }}>
                      <span style={{
                        display: "inline-block", width: 6, height: 6, borderRadius: "50%",
                        background: "#c9952d", marginRight: 8, animation: "pulse 1.2s infinite",
                      }} />
                      {coachMode === "program" ? "Building program..." : coachMode === "weekly" ? "Analyzing 7-day data..." : "Thinking..."}
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
          <div style={{ color: "#c9952d", fontSize: 12, padding: 8 }}>
            <span style={{
              display: "inline-block", width: 6, height: 6, borderRadius: "50%",
              background: "#c9952d", marginRight: 8, animation: "pulse 1.2s infinite",
            }} />
            Analyzing training data...
          </div>
        </div>
      )}

      {/* ── Program Preview Card ── */}
      {programPreview?.program && (
        <div style={S.card}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 14 }}>📋</span>
            <div style={S.label}>Generated Program</div>
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#fafafa", marginBottom: 2 }}>{programPreview.program.name}</div>
          {programPreview.program.description && <div style={{ fontSize: 11, color: "#737373", marginBottom: 8 }}>{programPreview.program.description}</div>}

          {programPreview.unknownExercises?.length > 0 && (
            <div style={{ background: "#451a03", border: "1px solid #92400e", borderRadius: 6, padding: 8, marginBottom: 8, fontSize: 11, color: "#fbbf24" }}>
              ⚠ Unknown exercises: {programPreview.unknownExercises.join(", ")}
            </div>
          )}

          {programPreview.program.days?.map((day, di) => (
            <div key={di} style={{ background: "#171717", borderRadius: 6, padding: 10, marginBottom: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#fafafa", marginBottom: 2 }}>
                Day {di + 1} — {day.label}
                {day.subtitle && <span style={{ fontWeight: 400, color: "#737373" }}> ({day.subtitle})</span>}
              </div>
              {day.exercises?.map((ex, ei) => (
                <div key={ei} style={{ fontSize: 11, color: "#a3a3a3", paddingLeft: 8, marginTop: 3, display: "flex", justifyContent: "space-between" }}>
                  <span>{ex.name}</span>
                  <span style={{ color: "#525252" }}>{ex.defaultSets}×{ex.targetReps}{ex.notes ? ` · ${ex.notes}` : ""}</span>
                </div>
              ))}
            </div>
          ))}

          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button onClick={() => setProgramPreview(null)} style={{ ...S.btn("ghost"), flex: 1 }}>Dismiss</button>
            <button onClick={saveProgramFromPreview} disabled={programSaving} style={{ ...S.btn("primary"), flex: 2, opacity: programSaving ? 0.5 : 1 }}>
              {programSaving ? "Saving..." : "Save to Programs"}
            </button>
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

        {coachMode === "weekly" ? (
          <button
            onClick={generateWeeklyReport}
            disabled={loading}
            style={{ ...S.btn("primary"), width: "100%", opacity: loading ? 0.5 : 1 }}
          >
            {loading ? "Generating report..." : "Generate Weekly Report"}
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
              placeholder={coachMode === "program"
                ? "Describe your program (e.g. 4-day upper/lower for hypertrophy)..."
                : "Ask about training, nutrition, substitutions..."
              }
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
              {loading ? "..." : coachMode === "program" ? "Build" : "Send"}
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

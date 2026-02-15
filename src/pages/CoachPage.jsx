// ═══════════════════════ COACH PAGE ═══════════════════════
// Extracted from App.jsx — CoachPage function

import { useState } from "react";
import { useTalos } from "../context/TalosContext";
import { est1RM } from "../lib/helpers";
import api from "../lib/api";
import MarkdownText from "../components/MarkdownText";
import S from "../lib/styles";

export default function CoachPage() {
  const { workouts, profile, programs, user, saveProgram } = useTalos();
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("chat");
  const [programPreview, setProgramPreview] = useState(null);
  const [programSaving, setProgramSaving] = useState(false);
  const [weeklyReport, setWeeklyReport] = useState("");

  const prs = {};
  workouts.forEach(w => w.exercises?.forEach(ex => ex.sets?.forEach(s => {
    if (!s.weight || !s.reps) return;
    const e = est1RM(s.weight, s.reps);
    if (!prs[ex.name] || (e && e > (prs[ex.name].e1rm || 0))) prs[ex.name] = { weight: s.weight, reps: s.reps, e1rm: e, date: w.date };
  })));

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

  async function ask(q) {
    setLoading(true); setResponse("");
    try {
      const data = await api.post("/coach", { prompt: q, context: buildContext() });
      setResponse(data.response || data.error || "No response.");
    } catch (e) { setResponse("Error: " + e.message); }
    setLoading(false);
  }

  async function buildProgram(q) {
    setLoading(true); setProgramPreview(null); setResponse("");
    try {
      const data = await api.post("/coach/program", { prompt: q, context: buildContext() });
      if (data.program) {
        setProgramPreview(data);
      } else {
        setResponse(data.commentary || "Could not generate program. Try being more specific about what you want.");
      }
    } catch (e) { setResponse("Error: " + e.message); }
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
        user_id: user.id,
      });
      setProgramPreview(null);
      setResponse("✅ Program saved! Check the Programs tab.");
    } catch (e) { setResponse("Error saving: " + e.message); }
    setProgramSaving(false);
  }

  async function generateWeeklyReport() {
    setLoading(true); setWeeklyReport("");
    const context = buildContext();

    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    const thisWeek = workouts.filter(w => new Date(w.date + "T12:00:00") >= weekAgo);
    const twoWeeksAgo = new Date(); twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const lastWeek = workouts.filter(w => {
      const d = new Date(w.date + "T12:00:00");
      return d >= twoWeeksAgo && d < weekAgo;
    });

    const weeklyCtx = `${context}

THIS WEEK (${thisWeek.length} sessions):
${thisWeek.map(w => `${w.date} ${w.day_label || ""} (Feel:${w.feel}/5, Sleep:${w.sleep_hours || w.sleepHours || "?"}h, Duration:${w.duration || "?"}min)
${w.exercises?.map(e => `  ${e.name}: ${e.sets?.map(s => `${s.weight}x${s.reps}`).join(", ")}`).join("\n") || ""}`).join("\n\n")}

PREVIOUS WEEK (${lastWeek.length} sessions):
${lastWeek.map(w => `${w.date} ${w.day_label || ""} (Feel:${w.feel}/5)
${w.exercises?.map(e => `  ${e.name}: ${e.sets?.map(s => `${s.weight}x${s.reps}`).join(", ")}`).join("\n") || ""}`).join("\n\n")}`;

    try {
      const data = await api.post("/coach/weekly", { context: weeklyCtx });
      setWeeklyReport(data.report || "No report generated.");
    } catch (e) { setWeeklyReport("Error: " + e.message); }
    setLoading(false);
  }

  const quick = [
    { l: "Next workout", p: "Give me specific target weights and reps for my next workout based on progressive overload." },
    { l: "Plateau advice", p: "Analyze my data for any lifts that have plateaued and give me a plan to break through." },
    { l: "Program review", p: "Review my recent volume, exercise selection, and progression. What should I adjust?" },
    { l: "Recovery check", p: "Based on my feel ratings and frequency, how is my recovery? Should I adjust?" },
  ];

  return (
    <div className="fade-in">
      <div style={S.card}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 18 }}>⚡</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#fafafa" }}>AI Coach</div>
            <div style={{ fontSize: 10, color: "#525252" }}>Analyzes your last {Math.min(workouts.length, 10)} workouts</div>
          </div>
        </div>

        {/* Mode toggle */}
        <div style={{ display: "flex", gap: 4, marginBottom: 12, background: "#171717", borderRadius: 6, padding: 3 }}>
          <button onClick={() => { setMode("chat"); setProgramPreview(null); setWeeklyReport(""); }} style={{ ...S.sm(mode === "chat" ? "primary" : "ghost"), flex: 1, textAlign: "center" }}>💬 Chat</button>
          <button onClick={() => { setMode("program"); setResponse(""); setWeeklyReport(""); }} style={{ ...S.sm(mode === "program" ? "primary" : "ghost"), flex: 1, textAlign: "center" }}>📋 Program</button>
          <button onClick={() => { setMode("weekly"); setResponse(""); setProgramPreview(null); }} style={{ ...S.sm(mode === "weekly" ? "primary" : "ghost"), flex: 1, textAlign: "center" }}>📊 Weekly</button>
        </div>

        {mode === "chat" && (
          <>
            <div style={S.label}>Quick Actions</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
              {quick.map((q, i) => <button key={i} onClick={() => { setPrompt(q.p); ask(q.p); }} style={S.sm()}>{q.l}</button>)}
            </div>
            <div style={S.label}>Ask Anything</div>
            <textarea value={prompt} onChange={e => setPrompt(e.target.value)} style={{ ...S.input, minHeight: 50, resize: "vertical", marginBottom: 8 }} placeholder="Programming, nutrition, substitutions..." />
            <button onClick={() => ask(prompt)} disabled={loading || !prompt.trim()} style={{ ...S.btn("primary"), width: "100%", opacity: (loading || !prompt.trim()) ? 0.5 : 1 }}>
              {loading ? "Analyzing..." : "Ask Coach"}
            </button>
          </>
        )}

        {mode === "program" && (
          <>
            <div style={S.label}>Describe Your Program</div>
            <textarea value={prompt} onChange={e => setPrompt(e.target.value)} style={{ ...S.input, minHeight: 70, resize: "vertical", marginBottom: 8 }}
              placeholder="e.g. Build me a 4-day upper/lower split focused on hypertrophy. I train Mon/Tue/Thu/Fri. Avoid deep squats due to hip bursitis." />
            <button onClick={() => buildProgram(prompt)} disabled={loading || !prompt.trim()} style={{ ...S.btn("primary"), width: "100%", opacity: (loading || !prompt.trim()) ? 0.5 : 1 }}>
              {loading ? "Building program..." : "Generate Program"}
            </button>
          </>
        )}

        {mode === "weekly" && (
          <>
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, color: "#a3a3a3", lineHeight: 1.5 }}>
                Generate an AI analysis of your past 7 days — volume by muscle group, progression trends, recovery signals, and action items for next week.
              </div>
            </div>
            <button onClick={generateWeeklyReport} disabled={loading} style={{ ...S.btn("primary"), width: "100%", opacity: loading ? 0.5 : 1 }}>
              {loading ? "Generating report..." : "Generate Weekly Report"}
            </button>
          </>
        )}
      </div>

      {/* Program Preview */}
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
              ⚠ Unknown exercises (not in library): {programPreview.unknownExercises.join(", ")}
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

          {programPreview.commentary && (
            <div style={{ marginTop: 8, marginBottom: 8 }}>
              <MarkdownText text={programPreview.commentary} />
            </div>
          )}

          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button onClick={() => setProgramPreview(null)} style={{ ...S.btn("ghost"), flex: 1 }}>Dismiss</button>
            <button onClick={saveProgramFromPreview} disabled={programSaving} style={{ ...S.btn("primary"), flex: 2, opacity: programSaving ? 0.5 : 1 }}>
              {programSaving ? "Saving..." : "Save to Programs"}
            </button>
          </div>
        </div>
      )}

      {/* Weekly Report */}
      {(weeklyReport || (loading && mode === "weekly")) && (
        <div style={S.card}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 14 }}>📊</span>
            <div style={S.label}>Weekly Training Report</div>
          </div>
          {loading && mode === "weekly" ? (
            <div style={{ padding: 16, textAlign: "center", color: "#c9952d", fontSize: 12 }}>Analyzing 7-day training data...</div>
          ) : (
            <MarkdownText text={weeklyReport} />
          )}
        </div>
      )}

      {/* Text Response */}
      {(response || (loading && !programPreview)) && (
        <div style={S.card}>
          <div style={S.label}>Response</div>
          {loading ? <div style={{ padding: 16, textAlign: "center", color: "#c9952d", fontSize: 12 }}>Analyzing training data...</div>
            : <MarkdownText text={response} />}
        </div>
      )}
    </div>
  );
}

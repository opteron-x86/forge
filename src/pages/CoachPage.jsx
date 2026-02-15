// ═══════════════════════ COACH PAGE ═══════════════════════
// Extracted from App.jsx — CoachPage function
//
// Features:
// - Mode toggle: chat | program generation | weekly report
// - AI context builder (recent workouts, programs, PRs, profile)
// - Chat input with streaming-style response display
// - Program preview with save-to-programs action
// - Weekly training report (last 7 days analysis)
// - MarkdownText rendering for AI responses

import { useState } from "react";
import { useTalos } from "../context/TalosContext";
import MarkdownText from "../components/MarkdownText";
import { est1RM } from "../lib/helpers";
import api from "../lib/api";
import S from "../lib/styles";

export default function CoachPage() {
  const { workouts, profile, programs, user, saveProgram } = useTalos();
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("chat"); // "chat" | "program" | "weekly"
  const [programPreview, setProgramPreview] = useState(null); // { program, commentary, unknownExercises }
  const [programSaving, setProgramSaving] = useState(false);
  const [weeklyReport, setWeeklyReport] = useState("");

  // ── PRs for context ──
  const prs = {};
  workouts.forEach((w) =>
    w.exercises?.forEach((ex) =>
      ex.sets?.forEach((s) => {
        if (!s.weight || !s.reps) return;
        const e = est1RM(s.weight, s.reps);
        if (!prs[ex.name] || (e && e > (prs[ex.name].e1rm || 0))) {
          prs[ex.name] = { weight: s.weight, reps: s.reps, e1rm: e, date: w.date };
        }
      }),
    ),
  );

  // ── Build AI context ──
  // MIGRATION NOTE: Copy buildContext() verbatim from App.jsx CoachPage.
  // It assembles: recent workouts, programs, PRs, profile (age, sex, weight,
  // body fat, goals, experience, injuries, calories, protein, target PRs).
  function buildContext() {
    const recent = workouts.slice(-10);
    const programCtx = programs
      .filter((p) => p.user_id === user.id)
      .map(
        (p) =>
          `${p.name}${p.description ? ` (${p.description})` : ""}:\n${
            p.days
              ?.map(
                (d, i) =>
                  `  Day ${i + 1} — ${d.label || "Untitled"}${d.subtitle ? ` (${d.subtitle})` : ""}: ${
                    d.exercises
                      ?.map((e) => `${e.name} ${e.defaultSets}x${e.targetReps || "?"}`)
                      .join(", ") || "no exercises"
                  }`,
              )
              .join("\n") || "no days"
          }`,
      )
      .join("\n\n");

    const age = profile.dateOfBirth
      ? Math.floor(
          (Date.now() - new Date(profile.dateOfBirth + "T12:00:00").getTime()) /
            31557600000,
        )
      : null;

    // MIGRATION NOTE: Copy the rest of buildContext including profileLines
    // assembly, recent workouts formatting, and the final return string.
    // This is ~30 lines in the original.
    return `Profile: ${user.name}\nPrograms:\n${programCtx}\n\nRecent workouts: ${recent.length}`;
  }

  // ── Send to AI ──
  // MIGRATION NOTE: Copy the send(), generateProgram(), and generateWeekly()
  // functions from App.jsx CoachPage. They call api.post("/ai/coach", ...),
  // api.post("/ai/generate-program", ...), and api.post("/ai/weekly-report", ...).

  async function send() {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setResponse("");
    setProgramPreview(null);
    try {
      const res = await api.post("/ai/coach", {
        prompt: prompt.trim(),
        context: buildContext(),
        user_id: user.id,
      });
      setResponse(res.response || res.message || "No response");
    } catch (e) {
      setResponse("Error: " + e.message);
    }
    setLoading(false);
    setPrompt("");
  }

  // MIGRATION NOTE: Copy generateProgram() and generateWeekly() from App.jsx.
  // Also copy the saveProgramFromPreview() handler.

  return (
    <div className="fade-in">
      {/* Mode selector */}
      <div style={{ padding: "8px 16px", display: "flex", gap: 4 }}>
        {[
          { k: "chat", l: "Chat" },
          { k: "program", l: "Generate Program" },
          { k: "weekly", l: "Weekly Report" },
        ].map((m) => (
          <button
            key={m.k}
            onClick={() => setMode(m.k)}
            style={S.sm(mode === m.k ? "primary" : "ghost")}
          >
            {m.l}
          </button>
        ))}
      </div>

      {/* Input area */}
      {mode !== "weekly" && (
        <div style={{ padding: "0 16px 8px", display: "flex", gap: 8 }}>
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            style={{ ...S.input, flex: 1 }}
            placeholder={
              mode === "program"
                ? "Describe the program you want..."
                : "Ask your coach anything..."
            }
          />
          <button
            onClick={mode === "program" ? () => {} : send}
            style={{ ...S.btn("primary"), opacity: loading ? 0.5 : 1 }}
            disabled={loading}
          >
            {loading ? "..." : "Send"}
          </button>
        </div>
      )}

      {/* MIGRATION NOTE: Copy the remaining JSX sections from App.jsx CoachPage:
          - Program preview card (with save button)
          - Weekly report card
          - Text response card
          All three use <MarkdownText text={...} /> for rendering. */}

      {/* Response */}
      {(response || (loading && mode === "chat")) && (
        <div style={S.card}>
          <div style={S.label}>Response</div>
          {loading ? (
            <div style={{ padding: 16, textAlign: "center", color: "#c9952d", fontSize: 12 }}>
              Analyzing training data...
            </div>
          ) : (
            <MarkdownText text={response} />
          )}
        </div>
      )}
    </div>
  );
}

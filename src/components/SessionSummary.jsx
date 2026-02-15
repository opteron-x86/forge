// ═══════════════════════ SESSION SUMMARY ═══════════════════════
// Extracted from App.jsx — SessionRecap function (renamed to SessionSummary)

import { FEEL } from "../lib/helpers";
import { fmtDate } from "../lib/helpers";
import MarkdownText from "./MarkdownText";
import S from "../lib/styles";

export default function SessionSummary({ summary, onDone }) {
  if (!summary) return null;
  const { workout, analysis, loading } = summary;
  const totalSets = workout.exercises?.reduce((t, e) => t + (e.sets?.length || 0), 0) || 0;
  const totalVolume = workout.exercises?.reduce((t, e) => t + (e.sets?.reduce((st, s) => st + ((s.weight || 0) * (s.reps || 0)), 0) || 0), 0) || 0;
  const feelInfo = FEEL.find(f => f.v === workout.feel) || FEEL[2];

  return (
    <div className="fade-in">
      <div style={S.card}>
        <div style={{ textAlign: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 28, marginBottom: 4 }}>✓</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#22c55e" }}>Session Complete</div>
          <div style={{ fontSize: 11, color: "#737373", marginTop: 2 }}>{workout.day_label || "Workout"} · {fmtDate(workout.date)}</div>
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 12 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#fafafa" }}>{workout.duration || "?"}</div>
            <div style={{ fontSize: 9, color: "#525252", textTransform: "uppercase" }}>min</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#fafafa" }}>{workout.exercises?.length || 0}</div>
            <div style={{ fontSize: 9, color: "#525252", textTransform: "uppercase" }}>exercises</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#fafafa" }}>{totalSets}</div>
            <div style={{ fontSize: 9, color: "#525252", textTransform: "uppercase" }}>sets</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#fafafa" }}>{totalVolume > 0 ? `${(totalVolume / 1000).toFixed(1)}k` : "—"}</div>
            <div style={{ fontSize: 9, color: "#525252", textTransform: "uppercase" }}>lbs vol</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: feelInfo.c }}>{feelInfo.l}</div>
            <div style={{ fontSize: 9, color: "#525252", textTransform: "uppercase" }}>feel</div>
          </div>
        </div>
      </div>

      {(loading || analysis) && (
        <div style={S.card}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 14 }}>⚡</span>
            <div style={S.label}>AI Analysis</div>
          </div>
          {loading ? (
            <div style={{ padding: 8, textAlign: "center", color: "#c9952d", fontSize: 12 }}>Analyzing session...</div>
          ) : (
            <MarkdownText text={analysis} />
          )}
        </div>
      )}

      <div style={{ padding: "0 16px" }}>
        <button onClick={onDone} style={{ ...S.btn("primary"), width: "100%" }}>Done</button>
      </div>
    </div>
  );
}

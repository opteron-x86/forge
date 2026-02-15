// ═══════════════════════ SESSION SUMMARY / RECAP ═══════════════════════
// Extracted from App.jsx — SessionRecap function
//
// Post-workout recap screen showing:
// - Duration, total volume, exercise count, set count
// - Feel rating display
// - AI analysis (if available, rendered via MarkdownText)
// - "Done" button to dismiss and go to history

import MarkdownText from "./MarkdownText";
import { FEEL } from "../lib/helpers";
import S from "../lib/styles";

export default function SessionSummary({ summary, onDone }) {
  if (!summary) return null;

  const { workout, analysis, loading } = summary;

  // Compute stats from the completed workout
  const totalSets = workout.exercises?.reduce(
    (a, e) => a + (e.sets?.filter((s) => s.completed).length || 0),
    0,
  );
  const totalExercises = workout.exercises?.length || 0;
  const totalVolume = workout.exercises?.reduce(
    (a, e) =>
      a +
      (e.sets?.reduce(
        (b, s) => b + (s.completed ? (s.weight || 0) * (s.reps || 0) : 0),
        0,
      ) || 0),
    0,
  );
  const feelInfo = FEEL.find((f) => f.v === workout.feel) || FEEL[2];

  // MIGRATION NOTE: Copy the return JSX from App.jsx SessionRecap.
  // It shows a summary card with stats grid, AI analysis card, and Done button.

  return (
    <div className="fade-in" style={{ paddingTop: 8 }}>
      {/* Stats card */}
      <div style={S.card}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#fafafa", marginBottom: 12, textAlign: "center" }}>
          {workout.dayLabel || "Workout"} Complete
        </div>
        <div style={{ display: "flex", justifyContent: "space-around" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#fafafa" }}>{workout.duration || "—"}</div>
            <div style={{ fontSize: 9, color: "#525252", textTransform: "uppercase" }}>min</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#fafafa" }}>{totalExercises}</div>
            <div style={{ fontSize: 9, color: "#525252", textTransform: "uppercase" }}>exercises</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#fafafa" }}>{totalSets}</div>
            <div style={{ fontSize: 9, color: "#525252", textTransform: "uppercase" }}>sets</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#fafafa" }}>
              {totalVolume > 1000 ? `${(totalVolume / 1000).toFixed(1)}k` : "—"}
            </div>
            <div style={{ fontSize: 9, color: "#525252", textTransform: "uppercase" }}>lbs vol</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: feelInfo.c }}>{feelInfo.l}</div>
            <div style={{ fontSize: 9, color: "#525252", textTransform: "uppercase" }}>feel</div>
          </div>
        </div>
      </div>

      {/* AI Analysis */}
      {(loading || analysis) && (
        <div style={S.card}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 14 }}>⚡</span>
            <div style={S.label}>AI Analysis</div>
          </div>
          {loading ? (
            <div style={{ padding: 8, textAlign: "center", color: "#c9952d", fontSize: 12 }}>
              Analyzing session...
            </div>
          ) : (
            <MarkdownText text={analysis} />
          )}
        </div>
      )}

      {/* Done button */}
      <div style={{ padding: "0 16px" }}>
        <button onClick={onDone} style={{ ...S.btn("primary"), width: "100%" }}>
          Done
        </button>
      </div>
    </div>
  );
}

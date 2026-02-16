// ═══════════════════════ SESSION SUMMARY ═══════════════════════
// Post-workout recap with PR detection, volume comparison,
// exercise breakdown, and optional AI coach review.

import { useState, useMemo } from "react";
import { useTalos } from "../context/TalosContext";
import { FEEL, est1RM, fmtDate } from "../lib/helpers";
import MarkdownText from "./MarkdownText";
import api from "../lib/api";
import S from "../lib/styles";

export default function SessionSummary({ summary, onDone, onReviewSaved }) {
  if (!summary) return null;
  const { workout } = summary;
  const { workouts, user, profile, programs, aiConfig, workoutReviews } = useTalos();

  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewText, setReviewText] = useState(workoutReviews?.[workout.id] || null);
  const [reviewError, setReviewError] = useState(null);
  const [showExercises, setShowExercises] = useState(false);

  // ── Basic stats ──
  const totalSets = workout.exercises?.reduce((t, e) => t + (e.sets?.length || 0), 0) || 0;
  const totalVolume = workout.exercises?.reduce((t, e) =>
    t + (e.sets?.reduce((st, s) => st + ((s.weight || 0) * (s.reps || 0)), 0) || 0), 0) || 0;
  const totalReps = workout.exercises?.reduce((t, e) =>
    t + (e.sets?.reduce((st, s) => st + (parseInt(s.reps) || 0), 0) || 0), 0) || 0;
  const feelInfo = FEEL.find(f => f.v === workout.feel) || FEEL[2];

  // ── Previous workouts (everything before this session) ──
  const prevWorkouts = useMemo(() =>
    workouts.filter(w => w.id !== workout.id),
  [workouts, workout.id]);

  // ── PR detection ──
  const existingPRs = useMemo(() => {
    const map = {};
    prevWorkouts.forEach(w => w.exercises?.forEach(ex => ex.sets?.forEach(s => {
      if (!s.weight || !s.reps) return;
      const e1rm = est1RM(parseFloat(s.weight), parseInt(s.reps));
      const weight = parseFloat(s.weight);
      if (!map[ex.name]) map[ex.name] = { e1rm: 0, weight: 0 };
      if (e1rm && e1rm > map[ex.name].e1rm) map[ex.name].e1rm = e1rm;
      if (weight > map[ex.name].weight) map[ex.name].weight = weight;
    })));
    return map;
  }, [prevWorkouts]);

  const sessionPRs = useMemo(() => {
    const prs = [];
    workout.exercises?.forEach(ex => {
      ex.sets?.forEach(s => {
        if (!s.weight || !s.reps) return;
        const e1rm = est1RM(parseFloat(s.weight), parseInt(s.reps));
        const weight = parseFloat(s.weight);
        const prev = existingPRs[ex.name];

        if (!prev) {
          prs.push({ name: ex.name, type: "new", weight: s.weight, reps: s.reps, e1rm });
        } else if (e1rm && e1rm > prev.e1rm) {
          const delta = prev.e1rm > 0 ? e1rm - prev.e1rm : null;
          prs.push({ name: ex.name, type: "e1rm", weight: s.weight, reps: s.reps, e1rm, delta });
        } else if (weight > prev.weight) {
          prs.push({ name: ex.name, type: "weight", weight: s.weight, reps: s.reps, e1rm });
        }
      });
    });
    // Deduplicate — keep best PR per exercise
    const best = {};
    prs.forEach(pr => {
      if (!best[pr.name] || (pr.e1rm || 0) > (best[pr.name].e1rm || 0)) best[pr.name] = pr;
    });
    return Object.values(best);
  }, [workout, existingPRs]);

  // ── Volume comparison vs last same-day workout ──
  const volumeComparison = useMemo(() => {
    const dayLabel = workout.day_label;
    if (!dayLabel || dayLabel === "Freestyle") return null;
    for (let i = prevWorkouts.length - 1; i >= 0; i--) {
      const pw = prevWorkouts[i];
      if (pw.day_label === dayLabel) {
        const prevVol = pw.exercises?.reduce((a, e) =>
          a + (e.sets?.reduce((b, s) => b + ((s.weight || 0) * (s.reps || 0)), 0) || 0), 0) || 0;
        if (prevVol > 0 && totalVolume > 0) {
          const delta = totalVolume - prevVol;
          const pct = Math.round((delta / prevVol) * 100);
          return { prevVol, delta, pct, date: pw.date };
        }
        break;
      }
    }
    return null;
  }, [workout, prevWorkouts, totalVolume]);

  // ── Per-exercise breakdown ──
  const exerciseDetails = useMemo(() => {
    return workout.exercises?.map(ex => {
      const sets = ex.sets || [];
      let bestSet = null;
      let bestE1RM = 0;
      sets.forEach(s => {
        const e = est1RM(parseFloat(s.weight) || 0, parseInt(s.reps) || 0);
        if (e && e > bestE1RM) { bestE1RM = e; bestSet = s; }
      });
      const vol = sets.reduce((a, s) => a + ((s.weight || 0) * (s.reps || 0)), 0);
      const pr = sessionPRs.find(p => p.name === ex.name);
      let lastPerf = null;
      for (let i = prevWorkouts.length - 1; i >= 0; i--) {
        const pe = prevWorkouts[i].exercises?.find(e => e.name === ex.name);
        if (pe?.sets?.length > 0) {
          const lBest = pe.sets.reduce((a, s) => {
            const e = est1RM(parseFloat(s.weight) || 0, parseInt(s.reps) || 0);
            return e > a.e1rm ? { e1rm: e, weight: s.weight, reps: s.reps } : a;
          }, { e1rm: 0, weight: 0, reps: 0 });
          lastPerf = { ...lBest, date: prevWorkouts[i].date };
          break;
        }
      }
      return { name: ex.name, sets, bestSet, bestE1RM, vol, pr, lastPerf, notes: ex.notes };
    }) || [];
  }, [workout, prevWorkouts, sessionPRs]);

  // ── AI Review ──
  async function requestReview() {
    setReviewLoading(true);
    setReviewError(null);
    try {
      const recent = prevWorkouts.slice(-5);
      const prs = {};
      prevWorkouts.forEach(w => w.exercises?.forEach(ex => ex.sets?.forEach(s => {
        if (!s.weight || !s.reps) return;
        const e = est1RM(parseFloat(s.weight), parseInt(s.reps));
        if (!prs[ex.name] || (e && e > (prs[ex.name].e1rm || 0)))
          prs[ex.name] = { weight: s.weight, reps: s.reps, e1rm: e, date: w.date };
      })));

      const profileLines = [
        `Name: ${user.name}`,
        profile.experienceLevel ? `Experience: ${profile.experienceLevel}` : null,
        profile.goal ? `Goal: ${profile.goal}` : null,
        profile.weight ? `Weight: ${profile.weight} lbs` : null,
        profile.injuriesNotes ? `Injuries: ${profile.injuriesNotes}` : null,
      ].filter(Boolean).join(", ");

      const context = `USER: ${profileLines}
PRs:\n${Object.entries(prs).slice(0, 15).map(([k, v]) => `${k}: ${v.weight}x${v.reps} (e1RM: ${v.e1rm || "?"})`).join("\n")}
RECENT (${recent.length}):\n${recent.map(w => `${w.date} ${w.day_label || ""} (Feel:${w.feel}/5)\n${w.exercises?.map(e => `  ${e.name}: ${e.sets?.map(s => `${s.weight}x${s.reps}`).join(", ")}`).join("\n") || ""}`).join("\n\n")}`;

      const res = await api.post("/coach/analyze", {
        workout,
        context,
        workout_id: workout.id,
      });

      const analysis = res.analysis;
      setReviewText(analysis);
      if (onReviewSaved) onReviewSaved(workout.id, analysis);
    } catch (e) {
      console.error("Review error:", e);
      setReviewError("Failed to generate review. Try again.");
    } finally {
      setReviewLoading(false);
    }
  }

  return (
    <div className="fade-in">
      {/* ── Header card ── */}
      <div style={S.card}>
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 32, marginBottom: 4 }}>✓</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#22c55e" }}>Session Complete</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
            {workout.day_label || "Workout"} · {fmtDate(workout.date)}
          </div>
        </div>

        {/* Stats grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 8 }}>
          <StatBlock value={workout.duration || "?"} label="minutes" />
          <StatBlock value={totalSets} label="sets" />
          <StatBlock value={totalReps} label="reps" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          <StatBlock value={totalVolume > 0 ? `${(totalVolume / 1000).toFixed(1)}k` : "—"} label="lbs volume" />
          <StatBlock value={workout.exercises?.length || 0} label="exercises" />
          <StatBlock value={feelInfo.l} label="energy" color={feelInfo.c} />
        </div>

        {/* Volume comparison */}
        {volumeComparison && (
          <div style={{ marginTop: 12, padding: "8px 12px", background: "var(--surface2)", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
              vs last {workout.day_label}
            </span>
            <span style={{
              fontSize: 12, fontWeight: 700,
              color: volumeComparison.delta > 0 ? "#22c55e" : volumeComparison.delta < 0 ? "#ef4444" : "var(--text-muted)",
            }}>
              {volumeComparison.delta > 0 ? "▲" : volumeComparison.delta < 0 ? "▼" : "="}{" "}
              {volumeComparison.pct > 0 ? "+" : ""}{volumeComparison.pct}% vol
              <span style={{ fontSize: 10, color: "var(--text-dim)", marginLeft: 6 }}>
                ({fmtVol(volumeComparison.prevVol)} → {fmtVol(totalVolume)})
              </span>
            </span>
          </div>
        )}
      </div>

      {/* ── PRs card ── */}
      {sessionPRs.length > 0 && (
        <div style={{ ...S.card, borderLeft: "3px solid var(--accent)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 16 }}>🏆</span>
            <div style={{ fontSize: 12, fontWeight: 800, color: "var(--accent)", letterSpacing: "1px", textTransform: "uppercase" }}>
              {sessionPRs.length} Personal Record{sessionPRs.length !== 1 ? "s" : ""}
            </div>
          </div>
          {sessionPRs.map((pr, i) => (
            <div key={i} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "6px 0", borderBottom: i < sessionPRs.length - 1 ? "1px solid var(--surface2)" : "none",
            }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>{pr.name}</div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 1 }}>
                  {pr.type === "new" ? "First time logged" :
                   pr.type === "e1rm" ? "New estimated 1RM" : "New weight PR"}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: "var(--accent)" }}>{pr.weight}×{pr.reps}</div>
                {pr.e1rm && (
                  <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
                    e1RM ~{pr.e1rm}
                    {pr.delta ? <span style={{ color: "#22c55e" }}> (+{pr.delta})</span> : ""}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Exercise breakdown (collapsible) ── */}
      <div style={S.card}>
        <div
          onClick={() => setShowExercises(!showExercises)}
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
        >
          <div style={{ ...S.label, marginBottom: 0 }}>Exercise Breakdown</div>
          <span style={{ color: "var(--text-dim)", fontSize: 12, transform: showExercises ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▼</span>
        </div>
        {showExercises && exerciseDetails.map((ex, i) => (
          <div key={i} style={{
            padding: "10px 0", borderBottom: i < exerciseDetails.length - 1 ? "1px solid var(--surface2)" : "none",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)" }}>{ex.name}</span>
                {ex.pr && <span style={{ ...S.tag(), fontSize: 8, padding: "1px 5px" }}>PR</span>}
              </div>
              <span style={{ fontSize: 11, color: "var(--text-dim)" }}>
                {ex.vol > 0 ? `${fmtVol(ex.vol)}` : ""}
              </span>
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
              {ex.sets.map((s, si) => {
                const isBest = ex.bestSet && s.weight === ex.bestSet.weight && s.reps === ex.bestSet.reps;
                return (
                  <span key={si} style={{ color: isBest ? "var(--text-bright)" : "var(--text-muted)", fontWeight: isBest ? 700 : 400 }}>
                    {si > 0 && "  ·  "}{s.weight}×{s.reps}{s.rpe ? ` @${s.rpe}` : ""}
                  </span>
                );
              })}
            </div>
            {ex.lastPerf && ex.bestE1RM > 0 && (
              <div style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 3 }}>
                Last: {ex.lastPerf.weight}×{ex.lastPerf.reps} ({fmtDate(ex.lastPerf.date)})
                {ex.lastPerf.e1rm > 0 && ex.bestE1RM > ex.lastPerf.e1rm && (
                  <span style={{ color: "#22c55e", marginLeft: 4 }}>▲ +{ex.bestE1RM - ex.lastPerf.e1rm} e1RM</span>
                )}
                {ex.lastPerf.e1rm > 0 && ex.bestE1RM < ex.lastPerf.e1rm && (
                  <span style={{ color: "#ef4444", marginLeft: 4 }}>▼ {ex.bestE1RM - ex.lastPerf.e1rm} e1RM</span>
                )}
              </div>
            )}
            {ex.notes && <div style={{ fontSize: 10, color: "var(--accent)", marginTop: 2 }}>{ex.notes}</div>}
          </div>
        ))}
      </div>

      {/* ── AI Coach Review (optional) ── */}
      {aiConfig.enabled && (
        <div style={S.card}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 14 }}>⚡</span>
            <div style={{ ...S.label, marginBottom: 0 }}>AI Coach Review</div>
          </div>

          {reviewText ? (
            <MarkdownText text={reviewText} />
          ) : reviewLoading ? (
            <div style={{ padding: 12, textAlign: "center" }}>
              <div style={{ color: "var(--accent)", fontSize: 12, marginBottom: 4 }}>Analyzing your session...</div>
              <div style={{ fontSize: 10, color: "var(--text-dim)" }}>Reviewing sets, volume, and progress</div>
            </div>
          ) : reviewError ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ color: "#ef4444", fontSize: 11, marginBottom: 8 }}>{reviewError}</div>
              <button onClick={requestReview} style={S.sm("ghost")}>Retry</button>
            </div>
          ) : (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "var(--text-dim)", marginBottom: 10 }}>
                Get personalized feedback on your workout
              </div>
              <button onClick={requestReview} style={{ ...S.btn("primary"), width: "100%" }}>
                Get AI Review
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Done button ── */}
      <div style={{ padding: "4px 16px 8px" }}>
        <button onClick={onDone} style={{ ...S.btn("ghost"), width: "100%" }}>Done</button>
      </div>
    </div>
  );
}

// ── Small helpers ──
function StatBlock({ value, label, color }) {
  return (
    <div style={{ textAlign: "center", padding: "8px 0", background: "var(--surface2)", borderRadius: 8 }}>
      <div style={{ fontSize: 20, fontWeight: 800, color: color || "var(--text-bright)" }}>{value}</div>
      <div style={{ fontSize: 9, color: "var(--text-dim)", textTransform: "uppercase", marginTop: 2 }}>{label}</div>
    </div>
  );
}

function fmtVol(v) {
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
  return v.toLocaleString();
}

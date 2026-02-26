// ═══════════════════════════════════════════════════════════════
//  TALOS — Pre-Workout Check-In & Assessment
//  src/components/PreWorkoutCheckin.jsx
//
//  Full-screen modal flow:
//    1. Quick check-in (sleep, energy, stress, soreness, pain)
//    2. AI generates assessment
//    3. Briefing display with target weights, alerts, intensity
//    4. "Start Workout" passes target weights into the session
//
//  Props:
//    program     — active program object (optional)
//    day         — scheduled program day (optional)
//    onStart     — (targetWeights) => void — starts the workout
//    onSkip      — () => void — skips assessment, starts normally
//    onClose     — () => void — dismisses without starting
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useRef } from "react";
import { useTalos } from "../context/TalosContext";
import api from "../lib/api";
import MarkdownText from "./MarkdownText";
import S from "../lib/styles";

// ─── Check-in field configs ──────────────────────────────────

const SLEEP_OPTIONS = [4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 10];
const TIME_OPTIONS = [30, 45, 60, 75, 90];

const FIELDS = [
  { key: "sleep_quality", label: "Sleep Quality", low: "Terrible", high: "Excellent" },
  { key: "energy", label: "Energy Level", low: "Drained", high: "Wired" },
  { key: "stress", label: "Stress", low: "Calm", high: "Maxed out" },
  { key: "soreness", label: "Soreness", low: "Fresh", high: "Destroyed" },
];

// ─── Readiness helpers ───────────────────────────────────────

function readinessColor(score) {
  if (score >= 8) return "#22c55e";
  if (score >= 6) return "var(--accent)";
  if (score >= 4) return "#eab308";
  return "#ef4444";
}

const ALERT_COLORS = {
  info: { color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  warning: { color: "#eab308", bg: "rgba(234,179,8,0.12)" },
  critical: { color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
};

const ALERT_ICONS = { info: "💡", warning: "⚠️", critical: "🔴" };

const TYPE_LABELS = {
  deload: "Deload", injury: "Injury", volume_imbalance: "Volume",
  recovery: "Recovery", plateau: "Plateau", pr_opportunity: "PR Window",
};

// ═══════════════════════════════════════════════════════════════
//  SUBCOMPONENTS
// ═══════════════════════════════════════════════════════════════

function RatingRow({ label, value, onChange, low, high }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-bright)" }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)" }}>{value ?? "—"}</span>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        {[1, 2, 3, 4, 5].map(v => (
          <button key={v} onClick={() => onChange(v)} style={{
            flex: 1, height: 44, minWidth: 44, borderRadius: 8,
            border: `2px solid ${value === v ? "var(--accent)" : "var(--border2)"}`,
            background: value === v ? "var(--accent-bg)" : "var(--surface2)",
            color: value === v ? "var(--accent)" : "var(--text-muted)",
            fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
          }}>{v}</button>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
        <span style={{ fontSize: 10, color: "var(--text-dim)" }}>{low}</span>
        <span style={{ fontSize: 10, color: "var(--text-dim)" }}>{high}</span>
      </div>
    </div>
  );
}

function ReadinessRing({ score, label }) {
  const color = readinessColor(score);
  const pct = score / 10;
  const circ = 2 * Math.PI * 44;
  const offset = circ * (1 - pct);

  return (
    <div style={{ textAlign: "center", marginBottom: 16 }}>
      <div style={{ position: "relative", width: 110, height: 110, margin: "0 auto" }}>
        <svg width="110" height="110" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="44" fill="none" stroke="var(--border2)" strokeWidth="6" />
          <circle cx="50" cy="50" r="44" fill="none"
            stroke={color} strokeWidth="6" strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={offset}
            transform="rotate(-90 50 50)"
            style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
          />
        </svg>
        <div style={{
          position: "absolute", inset: 0, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontSize: 28, fontWeight: 900, color, lineHeight: 1 }}>{score}</span>
          <span style={{ fontSize: 10, color: "var(--text-dim)", fontWeight: 600 }}>/10</span>
        </div>
      </div>
      <div style={{
        display: "inline-block", marginTop: 8, padding: "3px 12px", borderRadius: 16,
        background: `${color}18`, color, fontSize: 12, fontWeight: 700,
      }}>{label}</div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function PreWorkoutCheckin({ program, day, onStart, onSkip, onClose }) {
  const { profile, aiConfig } = useTalos();
  const [step, setStep] = useState("checkin"); // checkin | loading | briefing | error
  const [checkin, setCheckin] = useState({
    sleep_hours: null, sleep_quality: null, energy: null,
    stress: null, soreness: null, pain_notes: "", time_available: null,
  });
  const [assessment, setAssessment] = useState(null);
  const [error, setError] = useState(null);
  const [expandedWeight, setExpandedWeight] = useState(null);
  const scrollRef = useRef(null);

  // Scroll to top on step change
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [step]);

  const upd = (key, val) => setCheckin(p => ({ ...p, [key]: val }));

  // ── Submit check-in → call API ──
  async function submit() {
    setStep("loading");
    setError(null);
    try {
      const data = await api.post("/coach/pre-workout", {
        checkin,
        day_id: day?.id || null,
        day_label: day?.label || null,
        program_id: program?.id || null,
      });
      if (data.assessment) {
        setAssessment(data.assessment);
        setStep("briefing");
      } else {
        throw new Error(data.error || "No assessment returned");
      }
    } catch (e) {
      console.error("Pre-workout assessment failed:", e);
      setError(e.message || "Failed to generate assessment");
      setStep("error");
    }
  }

  // ── Start workout with target weights injected ──
  function startWithTargets() {
    // Pass target weights so startWorkout can pre-fill
    const targets = {};
    if (assessment?.target_weights) {
      assessment.target_weights.forEach(tw => {
        targets[tw.exercise] = { weight: tw.weight, sets: tw.sets, reps: tw.reps };
      });
    }
    onStart(targets);
  }

  // ── AI not available → skip gracefully ──
  if (!aiConfig.enabled) {
    // Auto-skip to regular workout start
    return null;
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "var(--bg)", zIndex: 250,
      display: "flex", flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "12px 16px", borderBottom: "1px solid var(--border)",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>🔱</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text-bright)" }}>
            {step === "briefing" ? "Pre-Workout Briefing" : "Pre-Workout Check-In"}
          </span>
        </div>
        <button onClick={onClose} style={S.sm()}>✕</button>
      </div>

      {/* Scrollable content */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "16px 16px 32px" }}>

        {/* ═══ STEP 1: CHECK-IN ═══ */}
        {step === "checkin" && (
          <div className="fade-in">
            {day && (
              <div style={{
                ...S.card, marginBottom: 12, padding: "10px 14px",
                borderColor: "var(--accent)", background: "var(--accent-bg)",
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Today's Session
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-bright)", marginTop: 2 }}>
                  {day.label}{day.subtitle ? ` — ${day.subtitle}` : ""}
                </div>
                {day.exercises && (
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                    {day.exercises.slice(0, 5).map(e => e.name).join(" · ")}
                    {day.exercises.length > 5 ? ` +${day.exercises.length - 5}` : ""}
                  </div>
                )}
              </div>
            )}

            {/* Sleep hours */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-bright)" }}>Hours of Sleep</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)" }}>
                  {checkin.sleep_hours != null ? `${checkin.sleep_hours}h` : "—"}
                </span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {SLEEP_OPTIONS.map(h => (
                  <button key={h} onClick={() => upd("sleep_hours", h)} style={{
                    width: "calc(25% - 4px)", height: 42, borderRadius: 8,
                    border: `2px solid ${checkin.sleep_hours === h ? "var(--accent)" : "var(--border2)"}`,
                    background: checkin.sleep_hours === h ? "var(--accent-bg)" : "var(--surface2)",
                    color: checkin.sleep_hours === h ? "var(--accent)" : "var(--text-muted)",
                    fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                  }}>{h}h</button>
                ))}
              </div>
            </div>

            {/* Rating fields */}
            {FIELDS.map(f => (
              <RatingRow key={f.key} label={f.label} value={checkin[f.key]}
                onChange={v => upd(f.key, v)} low={f.low} high={f.high} />
            ))}

            {/* Pain notes */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-bright)", marginBottom: 6 }}>
                Pain / Discomfort <span style={{ color: "var(--text-dim)", fontWeight: 400 }}>(optional)</span>
              </div>
              <textarea
                placeholder="e.g. right shoulder tight, low back tweaked..."
                value={checkin.pain_notes}
                onChange={e => upd("pain_notes", e.target.value)}
                rows={2}
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: 8,
                  border: "1px solid var(--border2)", background: "var(--surface2)",
                  color: "var(--text-bright)", fontSize: 13, fontFamily: "inherit",
                  resize: "vertical", outline: "none", boxSizing: "border-box",
                }}
              />
            </div>

            {/* Time available */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-bright)", marginBottom: 6 }}>
                Time Available <span style={{ color: "var(--text-dim)", fontWeight: 400 }}>(optional)</span>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {TIME_OPTIONS.map(t => (
                  <button key={t} onClick={() => upd("time_available", checkin.time_available === t ? null : t)} style={{
                    flex: 1, height: 42, borderRadius: 8,
                    border: `2px solid ${checkin.time_available === t ? "var(--accent)" : "var(--border2)"}`,
                    background: checkin.time_available === t ? "var(--accent-bg)" : "var(--surface2)",
                    color: checkin.time_available === t ? "var(--accent)" : "var(--text-muted)",
                    fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                  }}>{t}m</button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <button onClick={submit} style={{
              ...S.btn(), width: "100%", height: 48, fontSize: 15, fontWeight: 800,
            }}>
              Generate Assessment
            </button>
            <button onClick={onSkip} style={{
              width: "100%", height: 42, marginTop: 8, borderRadius: 8,
              border: "1px solid var(--border2)", background: "transparent",
              color: "var(--text-muted)", fontSize: 13, fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit",
            }}>
              Skip — Start Workout
            </button>
          </div>
        )}

        {/* ═══ STEP 2: LOADING ═══ */}
        {step === "loading" && (
          <LoadingSpinner />
        )}

        {/* ═══ STEP 3: BRIEFING ═══ */}
        {step === "briefing" && assessment && (
          <div className="fade-in">
            <ReadinessRing score={assessment.readiness_score} label={assessment.readiness_label} />

            {/* Summary */}
            <div style={{ ...S.card, marginBottom: 12 }}>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.55, margin: 0 }}>
                {assessment.summary}
              </p>
            </div>

            {/* Alerts */}
            {assessment.alerts?.length > 0 && assessment.alerts.map((alert, i) => {
              const c = ALERT_COLORS[alert.severity] || ALERT_COLORS.info;
              return (
                <div key={i} style={{
                  ...S.card, marginBottom: 8, padding: "10px 12px",
                  background: c.bg, borderColor: `${c.color}33`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                    <span style={{ fontSize: 12 }}>{ALERT_ICONS[alert.severity]}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: c.color, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      {TYPE_LABELS[alert.type] || alert.type}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-bright)" }}>{alert.title}</span>
                  </div>
                  <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.45, margin: 0 }}>
                    {alert.message}
                  </p>
                  {alert.substitutions?.length > 0 && (
                    <div style={{ marginTop: 6, display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {alert.substitutions.map((sub, j) => (
                        <span key={j} style={{
                          padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600,
                          background: `${c.color}20`, color: c.color,
                        }}>→ {sub}</span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Session adjustments */}
            {assessment.session_adjustments && (
              <div style={{
                ...S.card, marginBottom: 12, padding: "10px 12px",
                background: "rgba(234,179,8,0.1)", borderColor: "rgba(234,179,8,0.25)",
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#eab308", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>
                  Session Adjustments
                </div>
                <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.45, margin: 0 }}>
                  {assessment.session_adjustments}
                </p>
              </div>
            )}

            {/* Target Weights */}
            {assessment.target_weights?.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ ...S.label, marginBottom: 8, paddingLeft: 2 }}>Target Weights</div>
                {assessment.target_weights.map((tw, i) => (
                  <div key={i} onClick={() => setExpandedWeight(expandedWeight === i ? null : i)}
                    style={{ ...S.card, marginBottom: 6, cursor: "pointer", padding: "10px 12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-bright)" }}>{tw.exercise}</div>
                        <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 1 }}>{tw.sets} × {tw.reps}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span style={{
                          fontSize: 18, fontWeight: 900, letterSpacing: "-0.02em",
                          color: tw.adjustment ? "#eab308" : "var(--accent)",
                        }}>{tw.weight}</span>
                        <span style={{ fontSize: 11, color: "var(--text-dim)", marginLeft: 2 }}>{tw.unit || "lbs"}</span>
                        {tw.adjustment && (
                          <div style={{ fontSize: 9, color: "#eab308", fontWeight: 700, marginTop: 1 }}>ADJUSTED ↓</div>
                        )}
                      </div>
                    </div>
                    {expandedWeight === i && (
                      <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--border)" }}>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.4 }}>{tw.basis}</div>
                        {tw.adjustment && (
                          <div style={{ fontSize: 11, color: "#eab308", marginTop: 4 }}>⚡ {tw.adjustment}</div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Intensity guidance */}
            {assessment.intensity_guidance && (
              <div style={{
                ...S.card, marginBottom: 12, padding: "10px 12px",
                background: "rgba(168,85,247,0.08)", borderColor: "rgba(168,85,247,0.2)",
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#a855f7", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>
                  Intensity Guidance
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-bright)", marginBottom: 3 }}>
                  {assessment.intensity_guidance.approach}
                </div>
                <div style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600, marginBottom: 3 }}>
                  {assessment.intensity_guidance.rpe_target}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.4 }}>
                  {assessment.intensity_guidance.rationale}
                </div>
              </div>
            )}

            {/* Focus cue */}
            {assessment.focus_cue && (
              <div style={{
                ...S.card, marginBottom: 16, textAlign: "center", padding: "14px",
                background: "var(--accent-bg)", borderColor: "var(--accent)",
              }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                  Today's Focus
                </div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-bright)", margin: 0, fontStyle: "italic", lineHeight: 1.5 }}>
                  "{assessment.focus_cue}"
                </p>
              </div>
            )}

            {/* Actions */}
            <button onClick={startWithTargets} style={{
              ...S.btn(), width: "100%", height: 48, fontSize: 15, fontWeight: 800,
            }}>
              Start Workout →
            </button>
            <button onClick={() => { setStep("checkin"); setAssessment(null); }} style={{
              width: "100%", height: 40, marginTop: 8, borderRadius: 8,
              border: "1px solid var(--border2)", background: "transparent",
              color: "var(--text-muted)", fontSize: 12, fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit",
            }}>
              Regenerate Assessment
            </button>
          </div>
        )}

        {/* ═══ ERROR STATE ═══ */}
        {step === "error" && (
          <div className="fade-in" style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-bright)", marginBottom: 8 }}>
              Assessment Failed
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 20, maxWidth: 280, margin: "0 auto 20px" }}>
              {error}
            </div>
            <button onClick={() => setStep("checkin")} style={{ ...S.btn(), marginBottom: 8 }}>
              Try Again
            </button>
            <br />
            <button onClick={onSkip} style={{
              padding: "8px 16px", borderRadius: 8, border: "1px solid var(--border2)",
              background: "transparent", color: "var(--text-muted)", fontSize: 12,
              fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            }}>
              Skip — Start Workout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


// ─── Loading spinner subcomponent ────────────────────────────

function LoadingSpinner() {
  const [dots, setDots] = useState("");
  const msgs = [
    "Analyzing recent training data",
    "Evaluating recovery signals",
    "Computing target weights",
    "Checking for imbalances",
    "Building your briefing",
  ];
  const [mi, setMi] = useState(0);

  useEffect(() => {
    const dt = setInterval(() => setDots(d => d.length >= 3 ? "" : d + "."), 400);
    const mt = setInterval(() => setMi(i => (i + 1) % msgs.length), 1800);
    return () => { clearInterval(dt); clearInterval(mt); };
  }, []);

  return (
    <div style={{ textAlign: "center", padding: "60px 16px" }}>
      <div style={{
        width: 64, height: 64, margin: "0 auto 20px", borderRadius: "50%",
        border: "3px solid var(--accent)", display: "flex", alignItems: "center",
        justifyContent: "center", animation: "talos-pulse 1.5s ease-in-out infinite",
      }}>
        <span style={{ fontSize: 26 }}>🔱</span>
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-bright)" }}>
        {msgs[mi]}{dots}
      </div>
      <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 6 }}>
        Usually 3-5 seconds
      </div>
      <style>{`
        @keyframes talos-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.06); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
// ═══════════════════════ ONBOARDING ═══════════════════════
// Multi-step new user flow:
// 1. Welcome → 2. Experience → 3. Days → 4. Browse templates → 5. Done
// Skippable at any point. Saves selected program and marks onboarding complete.

import { useState, useMemo } from "react";
import { STARTER_TEMPLATES } from "../lib/starterTemplates";
import S from "../lib/styles";

const LEVELS = [
  { id: "beginner", label: "Beginner", desc: "New to lifting or less than 6 months", icon: "🌱" },
  { id: "intermediate", label: "Intermediate", desc: "6 months to 3 years of consistent training", icon: "💪" },
  { id: "advanced", label: "Advanced", desc: "3+ years, comfortable programming your own training", icon: "🔥" },
];

const DAY_OPTIONS = [
  { n: 3, label: "3 days", desc: "MWF or similar" },
  { n: 4, label: "4 days", desc: "Most popular" },
  { n: 5, label: "5 days", desc: "Dedicated splits" },
  { n: 6, label: "6 days", desc: "High frequency" },
];

export default function Onboarding({ userName, onComplete, onSkip }) {
  const [step, setStep] = useState(0); // 0=welcome, 1=level, 2=days, 3=browse, 4=preview
  const [level, setLevel] = useState(null);
  const [days, setDays] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Filter templates based on selections
  const filtered = useMemo(() => {
    return STARTER_TEMPLATES.filter(t => {
      if (level && t.tags.level !== level) {
        // Allow adjacent levels — beginner sees beginner+intermediate, advanced sees intermediate+advanced
        if (level === "beginner" && t.tags.level === "advanced") return false;
        if (level === "advanced" && t.tags.level === "beginner") return false;
      }
      if (days && t.tags.daysPerWeek !== days) return false;
      return true;
    });
  }, [level, days]);

  // Show all templates if filters are too strict
  const displayTemplates = filtered.length > 0 ? filtered : STARTER_TEMPLATES;
  const isFiltered = filtered.length > 0 && (level || days);

  function adoptTemplate(template) {
    // Build a program object from the template
    const program = {
      name: template.name,
      description: template.description,
      days: template.days.map(d => ({
        id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
        label: d.label,
        subtitle: d.subtitle || "",
        exercises: d.exercises.map(e => ({ ...e })),
      })),
      shared: false,
    };
    onComplete(program, level);
  }

  // ── Shared styles ──
  const container = { minHeight: "100dvh", display: "flex", flexDirection: "column", padding: "0 16px 32px" };
  const center = { flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" };
  const heading = { fontSize: 22, fontWeight: 800, color: "#fafafa", marginBottom: 6, letterSpacing: "-0.5px" };
  const subtext = { fontSize: 13, color: "#737373", lineHeight: 1.5, marginBottom: 24 };
  const card = (active) => ({
    ...S.card,
    cursor: "pointer",
    borderColor: active ? "#c9952d" : "#262626",
    background: active ? "#c9952d10" : "#141414",
    transition: "border-color 0.15s, background 0.15s",
  });
  const skipBtn = { background: "none", border: "none", color: "#525252", fontSize: 12, cursor: "pointer", fontFamily: "inherit", padding: "8px 0" };

  // ══════════════ STEP 0: Welcome ══════════════
  if (step === 0) {
    return (
      <div style={container}>
        <div style={center}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <img src="/talos-icon.svg" alt="" style={{ width: 56, height: 56, marginBottom: 16 }} />
            <div style={{ fontSize: 28, fontWeight: 900, color: "#fafafa", letterSpacing: "-1px" }}>
              Welcome to TALOS{userName ? `, ${userName}` : ""}
            </div>
            <div style={{ fontSize: 14, color: "#737373", marginTop: 8, lineHeight: 1.6 }}>
              Your training, tracked and analyzed.<br />
              Let's set up your first program.
            </div>
          </div>
          <button onClick={() => setStep(1)} style={{ ...S.btn("primary"), width: "100%", padding: "14px 0", fontSize: 15, fontWeight: 700 }}>
            Get Started
          </button>
          <div style={{ textAlign: "center", marginTop: 12 }}>
            <button onClick={onSkip} style={skipBtn}>I'll set up later</button>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════ STEP 1: Experience Level ══════════════
  if (step === 1) {
    return (
      <div style={container}>
        <div style={{ paddingTop: 32 }}>
          <div style={heading}>What's your experience level?</div>
          <div style={subtext}>This helps us recommend the right program. You can always change later.</div>

          {LEVELS.map(l => (
            <div key={l.id} onClick={() => setLevel(l.id)} style={card(level === l.id)}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 24 }}>{l.icon}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: level === l.id ? "#fafafa" : "#d4d4d4" }}>{l.label}</div>
                  <div style={{ fontSize: 11, color: "#737373", marginTop: 2 }}>{l.desc}</div>
                </div>
              </div>
            </div>
          ))}

          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button onClick={() => setStep(0)} style={{ ...S.btn("ghost"), flex: 1 }}>Back</button>
            <button onClick={() => setStep(2)} disabled={!level} style={{ ...S.btn("primary"), flex: 2, opacity: level ? 1 : 0.4 }}>Next</button>
          </div>
          <div style={{ textAlign: "center", marginTop: 8 }}>
            <button onClick={onSkip} style={skipBtn}>Skip setup</button>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════ STEP 2: Days Per Week ══════════════
  if (step === 2) {
    return (
      <div style={container}>
        <div style={{ paddingTop: 32 }}>
          <div style={heading}>How many days can you train?</div>
          <div style={subtext}>Be honest — consistency beats ambition. You can always adjust.</div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {DAY_OPTIONS.map(d => (
              <div key={d.n} onClick={() => setDays(d.n)} style={{
                ...card(days === d.n),
                textAlign: "center",
                padding: "16px 12px",
              }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: days === d.n ? "#c9952d" : "#fafafa" }}>{d.n}</div>
                <div style={{ fontSize: 11, color: "#737373", marginTop: 2 }}>{d.desc}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
            <button onClick={() => setStep(1)} style={{ ...S.btn("ghost"), flex: 1 }}>Back</button>
            <button onClick={() => setStep(3)} disabled={!days} style={{ ...S.btn("primary"), flex: 2, opacity: days ? 1 : 0.4 }}>See Programs</button>
          </div>
          <div style={{ textAlign: "center", marginTop: 8 }}>
            <button onClick={onSkip} style={skipBtn}>Skip setup</button>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════ STEP 3: Browse Templates ══════════════
  if (step === 3) {
    return (
      <div style={container}>
        <div style={{ paddingTop: 32 }}>
          <div style={heading}>Pick a program</div>
          <div style={subtext}>
            {isFiltered
              ? `${displayTemplates.length} program${displayTemplates.length !== 1 ? "s" : ""} match your preferences. Tap to preview.`
              : "Browse all available programs. Tap to preview."}
          </div>

          {displayTemplates.map((t, i) => {
            const goalColors = { strength: "#ef4444", hypertrophy: "#c9952d", general: "#22c55e" };
            return (
              <div key={i} onClick={() => { setSelectedTemplate(t); setStep(4); }} style={{ ...S.card, cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#fafafa" }}>{t.name}</div>
                    <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                      <span style={S.tag(goalColors[t.tags.goal] || "#737373")}>{t.tags.goal}</span>
                      <span style={S.tag("#525252")}>{t.tags.daysPerWeek}x/week</span>
                      <span style={S.tag("#525252")}>{t.tags.level}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#737373", marginTop: 6, lineHeight: 1.4 }}>{t.description}</div>
                  </div>
                  <span style={{ color: "#525252", fontSize: 18, flexShrink: 0, marginLeft: 8 }}>→</span>
                </div>
              </div>
            );
          })}

          {isFiltered && filtered.length < STARTER_TEMPLATES.length && (
            <button onClick={() => { setLevel(null); setDays(null); }} style={{ ...S.btn("ghost"), width: "100%", marginTop: 4 }}>
              Show all {STARTER_TEMPLATES.length} programs
            </button>
          )}

          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button onClick={() => setStep(2)} style={{ ...S.btn("ghost"), flex: 1 }}>Back</button>
          </div>
          <div style={{ textAlign: "center", marginTop: 8 }}>
            <button onClick={onSkip} style={skipBtn}>I'll build my own later</button>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════ STEP 4: Template Preview ══════════════
  if (step === 4 && selectedTemplate) {
    const t = selectedTemplate;
    const totalExercises = t.days.reduce((a, d) => a + d.exercises.length, 0);

    return (
      <div style={container}>
        <div style={{ paddingTop: 32 }}>
          <div style={heading}>{t.name}</div>
          <div style={subtext}>{t.description}</div>

          {/* Quick stats */}
          <div style={{ ...S.card, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, textAlign: "center" }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#fafafa" }}>{t.days.length}</div>
              <div style={{ fontSize: 10, color: "#525252", textTransform: "uppercase" }}>Days</div>
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#fafafa" }}>{totalExercises}</div>
              <div style={{ fontSize: 10, color: "#525252", textTransform: "uppercase" }}>Exercises</div>
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#c9952d" }}>{t.tags.level}</div>
              <div style={{ fontSize: 10, color: "#525252", textTransform: "uppercase" }}>Level</div>
            </div>
          </div>

          {/* Day breakdown */}
          {t.days.map((day, di) => (
            <div key={di} style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#fafafa" }}>{day.label}</div>
                  {day.subtitle && <div style={{ fontSize: 10, color: "#737373", marginTop: 1 }}>{day.subtitle}</div>}
                </div>
                <span style={{ fontSize: 10, color: "#525252" }}>{day.exercises.length} exercises</span>
              </div>
              {day.exercises.map((ex, ei) => (
                <div key={ei} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderTop: ei === 0 ? "1px solid #1a1a1a" : "none" }}>
                  <span style={{ fontSize: 11, color: "#d4d4d4" }}>{ex.name}</span>
                  <span style={{ fontSize: 11, color: "#525252", flexShrink: 0, marginLeft: 8 }}>
                    {ex.defaultSets}×{ex.targetReps}
                  </span>
                </div>
              ))}
            </div>
          ))}

          <button onClick={() => adoptTemplate(t)} style={{ ...S.btn("primary"), width: "100%", padding: "14px 0", fontSize: 15, fontWeight: 700 }}>
            Start with this program
          </button>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button onClick={() => setStep(3)} style={{ ...S.btn("ghost"), flex: 1 }}>Back to list</button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

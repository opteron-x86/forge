// ═══════════════════════ ONBOARDING ═══════════════════════
// Multi-step new user flow:
// 0. Welcome → 1. Quick Stats → 2. Equipment/Location →
// 3. Experience → 4. Days → 5. Browse templates → 6. Preview
// Alt path from step 5: 7. AI Setup → 8. AI Preview
// Skippable at any point. Saves selected program, profile data,
// and marks onboarding complete.

import { useState, useMemo } from "react";
import { STARTER_TEMPLATES, EQUIPMENT_OPTIONS } from "../lib/starterTemplates";
import { genId } from "../lib/helpers";
import api from "../lib/api";
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

const SEX_OPTIONS = [
  { id: "male", label: "Male" },
  { id: "female", label: "Female" },
];

const GOAL_OPTIONS = [
  { id: "hypertrophy", label: "Build Muscle", desc: "Maximize muscle growth and size", icon: "💪" },
  { id: "strength", label: "Get Stronger", desc: "Increase weights on the big lifts", icon: "🏋️" },
  { id: "general", label: "General Fitness", desc: "Balanced strength, conditioning, and health", icon: "⚡" },
];

export default function Onboarding({ userName, aiEnabled, onComplete, onSkip }) {
  const [step, setStep] = useState(0);
  // Steps: 0=welcome, 1=quickStats, 2=equipment, 3=level, 4=days, 5=browse, 6=preview
  //        7=aiSetup, 8=aiPreview (alt path from step 5)

  // Profile data collected during onboarding
  const [sex, setSex] = useState(null);
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");

  // Training preferences
  const [equipment, setEquipment] = useState(null);
  const [level, setLevel] = useState(null);
  const [days, setDays] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // AI program builder state
  const [goal, setGoal] = useState(null);
  const [preferences, setPreferences] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiProgram, setAiProgram] = useState(null);
  const [aiCommentary, setAiCommentary] = useState(null);
  const [aiError, setAiError] = useState(null);

  // Filter templates based on all selections
  const filtered = useMemo(() => {
    return STARTER_TEMPLATES.filter(t => {
      // Equipment filter
      if (equipment && t.tags.equipment !== equipment) {
        // Allow adjacent: full_gym users see dumbbells too, dumbbells see minimal
        if (equipment === "full_gym" && t.tags.equipment === "bodyweight") return false;
        if (equipment === "bodyweight" && t.tags.equipment !== "bodyweight") return false;
        if (equipment === "minimal" && t.tags.equipment === "full_gym") return false;
        if (equipment === "dumbbells" && t.tags.equipment === "full_gym") return false;
      }
      // Level filter
      if (level && t.tags.level !== level) {
        if (level === "beginner" && t.tags.level === "advanced") return false;
        if (level === "advanced" && t.tags.level === "beginner") return false;
      }
      // Days filter
      if (days && t.tags.daysPerWeek !== days) return false;
      return true;
    });
  }, [equipment, level, days]);

  // Show all templates if filters are too strict
  const displayTemplates = filtered.length > 0 ? filtered : STARTER_TEMPLATES;
  const isFiltered = filtered.length > 0 && (level || days || equipment);

  // Build profile data to pass back
  function getProfileData() {
    return {
      sex: sex || undefined,
      dateOfBirth: dateOfBirth || undefined,
      height: height || undefined,
      weight: weight ? Number(weight) : undefined,
      equipmentPreference: equipment || undefined,
    };
  }

  function adoptTemplate(template) {
    const program = {
      name: template.name,
      description: template.description,
      days: template.days.map(d => ({
        id: genId(),
        label: d.label,
        subtitle: d.subtitle || "",
        exercises: d.exercises.map(e => ({ ...e })),
      })),
      shared: false,
    };
    onComplete(program, level, getProfileData());
  }

  function handleSkip() {
    // Still save whatever profile data they entered before skipping
    const profileData = getProfileData();
    const hasData = profileData.sex || profileData.dateOfBirth || profileData.height || profileData.weight;
    onSkip(hasData ? profileData : null);
  }

  // ── AI Program Builder ──
  function buildAiPrompt() {
    const equipLabel = EQUIPMENT_OPTIONS.find(e => e.id === equipment)?.label || "full gym";
    const goalLabel = GOAL_OPTIONS.find(g => g.id === goal)?.label || "general fitness";
    const parts = [
      `Build me a ${days}-day per week ${goalLabel.toLowerCase()} program.`,
      `Equipment available: ${equipLabel}.`,
      `Experience level: ${level || "intermediate"}.`,
    ];
    if (sex) parts.push(`Sex: ${sex}.`);
    if (weight) parts.push(`Body weight: ${weight} lbs.`);
    if (height) parts.push(`Height: ${height}.`);
    if (preferences.trim()) parts.push(`Additional preferences: ${preferences.trim()}`);
    return parts.join(" ");
  }

  function buildMinimalContext() {
    // New user — no workout history, but we have profile data
    const age = dateOfBirth
      ? Math.floor((Date.now() - new Date(dateOfBirth + "T12:00:00").getTime()) / 31557600000)
      : null;
    const lines = [
      `Name: ${userName || "New User"}`,
      sex ? `Sex: ${sex}` : null,
      age ? `Age: ${age}` : null,
      height ? `Height: ${height}` : null,
      weight ? `Weight: ${weight} lbs` : null,
      level ? `Experience: ${level}` : null,
      equipment ? `Equipment: ${EQUIPMENT_OPTIONS.find(e => e.id === equipment)?.label}` : null,
    ].filter(Boolean).join(", ");
    return `USER: ${lines}\nNew user, no training history yet.\nPROGRAMS: None\nPRs: None\nRECENT: None`;
  }

  async function generateProgram() {
    setAiLoading(true);
    setAiError(null);
    setAiProgram(null);
    setAiCommentary(null);
    try {
      const data = await api.post("/coach/program", {
        prompt: buildAiPrompt(),
        context: buildMinimalContext(),
      });
      if (data.program) {
        // Add IDs for frontend compatibility
        data.program.days?.forEach(d => { if (!d.id) d.id = genId(); });
        setAiProgram(data.program);
        setAiCommentary(data.commentary || null);
        setStep(8);
      } else {
        setAiError(data.commentary || "Could not generate a program. Try adjusting your preferences.");
      }
    } catch (e) {
      setAiError("Failed to connect to AI coach. You can pick a template instead.");
    }
    setAiLoading(false);
  }

  function adoptAiProgram() {
    if (!aiProgram) return;
    const program = {
      name: aiProgram.name || "Custom Program",
      description: aiProgram.description || "",
      days: aiProgram.days.map(d => ({
        id: d.id || genId(),
        label: d.label,
        subtitle: d.subtitle || "",
        exercises: (d.exercises || []).map(e => ({ ...e })),
      })),
      shared: false,
    };
    onComplete(program, level, getProfileData());
  }

  // ── Shared styles ──
  const container = { minHeight: "100dvh", display: "flex", flexDirection: "column", padding: "0 16px 32px" };
  const center = { flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" };
  const heading = { fontSize: 22, fontWeight: 800, color: "var(--text-bright)", marginBottom: 6, letterSpacing: "-0.5px" };
  const subtext = { fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5, marginBottom: 24 };
  const card = (active) => ({
    ...S.card,
    cursor: "pointer",
    borderColor: active ? "var(--accent)" : "var(--border)",
    background: active ? "var(--accent-bg)" : "var(--surface)",
    transition: "border-color 0.15s, background 0.15s",
  });
  const skipBtn = { background: "none", border: "none", color: "var(--text-dim)", fontSize: 12, cursor: "pointer", fontFamily: "inherit", padding: "8px 0" };
  const inputRow = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 };
  const fieldLabel = { fontSize: 10, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.5px" };
  const fieldInput = { ...S.input, fontSize: 14, padding: "10px 12px" };

  // Step indicator
  const totalSteps = 6;
  const StepDots = ({ current }) => (
    <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 20 }}>
      {Array.from({ length: totalSteps }, (_, i) => (
        <div key={i} style={{
          width: i + 1 === current ? 20 : 6,
          height: 6,
          borderRadius: 3,
          background: i + 1 <= current ? "var(--accent)" : "var(--border)",
          transition: "all 0.2s",
        }} />
      ))}
    </div>
  );

  // ══════════════ STEP 0: Welcome ══════════════
  if (step === 0) {
    return (
      <div style={container}>
        <div style={center}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <img src="/talos-icon.svg" alt="" style={{ width: 56, height: 56, marginBottom: 16 }} />
            <div style={{ fontSize: 28, fontWeight: 900, color: "var(--text-bright)", letterSpacing: "-1px" }}>
              Welcome to TALOS{userName ? `, ${userName}` : ""}
            </div>
            <div style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 8, lineHeight: 1.6 }}>
              Your training, tracked and analyzed.<br />
              Let's set up your profile and first program.
            </div>
          </div>
          <button onClick={() => setStep(1)} style={{ ...S.btn("primary"), width: "100%", padding: "14px 0", fontSize: 15, fontWeight: 700 }}>
            Get Started
          </button>
          <div style={{ textAlign: "center", marginTop: 12 }}>
            <button onClick={handleSkip} style={skipBtn}>I'll set up later</button>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════ STEP 1: Quick Stats ══════════════
  if (step === 1) {
    return (
      <div style={container}>
        <div style={{ paddingTop: 32 }}>
          <StepDots current={1} />
          <div style={heading}>Quick Stats</div>
          <div style={subtext}>
            Helps your AI coach give better, personalized advice. Everything here is optional.
          </div>

          {/* Sex toggle */}
          <div style={{ marginBottom: 16 }}>
            <div style={fieldLabel}>Sex</div>
            <div style={{ display: "flex", gap: 8 }}>
              {SEX_OPTIONS.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSex(sex === s.id ? null : s.id)}
                  style={{
                    ...S.btn(sex === s.id ? "primary" : "ghost"),
                    flex: 1,
                    padding: "10px 0",
                    fontSize: 13,
                    fontWeight: sex === s.id ? 700 : 500,
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date of birth */}
          <div style={{ marginBottom: 16 }}>
            <div style={fieldLabel}>Date of Birth</div>
            <input
              type="date"
              value={dateOfBirth}
              onChange={e => setDateOfBirth(e.target.value)}
              style={{ ...fieldInput, colorScheme: "dark" }}
              max={new Date().toISOString().split("T")[0]}
            />
          </div>

          {/* Height & Weight */}
          <div style={inputRow}>
            <div>
              <div style={fieldLabel}>Height</div>
              <input
                type="text"
                value={height}
                onChange={e => setHeight(e.target.value)}
                style={fieldInput}
                placeholder={"e.g. 5'10\""}
                inputMode="text"
              />
            </div>
            <div>
              <div style={fieldLabel}>Weight (lbs)</div>
              <input
                type="number"
                value={weight}
                onChange={e => setWeight(e.target.value)}
                style={fieldInput}
                placeholder="e.g. 180"
                inputMode="numeric"
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
            <button onClick={() => setStep(0)} style={{ ...S.btn("ghost"), flex: 1 }}>Back</button>
            <button onClick={() => setStep(2)} style={{ ...S.btn("primary"), flex: 2 }}>Next</button>
          </div>
          <div style={{ textAlign: "center", marginTop: 8 }}>
            <button onClick={handleSkip} style={skipBtn}>Skip setup</button>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════ STEP 2: Equipment / Where You Train ══════════════
  if (step === 2) {
    return (
      <div style={container}>
        <div style={{ paddingTop: 32 }}>
          <StepDots current={2} />
          <div style={heading}>Where do you train?</div>
          <div style={subtext}>
            We'll recommend programs that match your equipment. You can always browse everything later.
          </div>

          {EQUIPMENT_OPTIONS.map(eq => (
            <div key={eq.id} onClick={() => setEquipment(eq.id)} style={card(equipment === eq.id)}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 24 }}>{eq.icon}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: equipment === eq.id ? "var(--text-bright)" : "var(--text-secondary)" }}>{eq.label}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{eq.desc}</div>
                </div>
              </div>
            </div>
          ))}

          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button onClick={() => setStep(1)} style={{ ...S.btn("ghost"), flex: 1 }}>Back</button>
            <button onClick={() => setStep(3)} disabled={!equipment} style={{ ...S.btn("primary"), flex: 2, opacity: equipment ? 1 : 0.4 }}>Next</button>
          </div>
          <div style={{ textAlign: "center", marginTop: 8 }}>
            <button onClick={handleSkip} style={skipBtn}>Skip setup</button>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════ STEP 3: Experience Level ══════════════
  if (step === 3) {
    return (
      <div style={container}>
        <div style={{ paddingTop: 32 }}>
          <StepDots current={3} />
          <div style={heading}>What's your experience level?</div>
          <div style={subtext}>This helps us recommend the right program. You can always change later.</div>

          {LEVELS.map(l => (
            <div key={l.id} onClick={() => setLevel(l.id)} style={card(level === l.id)}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 24 }}>{l.icon}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: level === l.id ? "var(--text-bright)" : "var(--text-secondary)" }}>{l.label}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{l.desc}</div>
                </div>
              </div>
            </div>
          ))}

          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button onClick={() => setStep(2)} style={{ ...S.btn("ghost"), flex: 1 }}>Back</button>
            <button onClick={() => setStep(4)} disabled={!level} style={{ ...S.btn("primary"), flex: 2, opacity: level ? 1 : 0.4 }}>Next</button>
          </div>
          <div style={{ textAlign: "center", marginTop: 8 }}>
            <button onClick={handleSkip} style={skipBtn}>Skip setup</button>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════ STEP 4: Days Per Week ══════════════
  if (step === 4) {
    return (
      <div style={container}>
        <div style={{ paddingTop: 32 }}>
          <StepDots current={4} />
          <div style={heading}>How many days can you train?</div>
          <div style={subtext}>Be honest — consistency beats ambition. You can always adjust.</div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {DAY_OPTIONS.map(d => (
              <div key={d.n} onClick={() => setDays(d.n)} style={{
                ...card(days === d.n),
                textAlign: "center",
                padding: "16px 12px",
              }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: days === d.n ? "var(--accent)" : "var(--text-bright)" }}>{d.n}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{d.desc}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
            <button onClick={() => setStep(3)} style={{ ...S.btn("ghost"), flex: 1 }}>Back</button>
            <button onClick={() => setStep(5)} disabled={!days} style={{ ...S.btn("primary"), flex: 2, opacity: days ? 1 : 0.4 }}>See Programs</button>
          </div>
          <div style={{ textAlign: "center", marginTop: 8 }}>
            <button onClick={handleSkip} style={skipBtn}>Skip setup</button>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════ STEP 5: Browse Templates ══════════════
  if (step === 5) {
    // Build filter summary
    const filterParts = [];
    if (equipment) {
      const eq = EQUIPMENT_OPTIONS.find(e => e.id === equipment);
      if (eq) filterParts.push(eq.label.toLowerCase());
    }
    if (level) filterParts.push(level);
    if (days) filterParts.push(`${days}x/week`);
    const filterSummary = filterParts.length > 0 ? filterParts.join(" · ") : null;

    return (
      <div style={container}>
        <div style={{ paddingTop: 32 }}>
          <StepDots current={5} />
          <div style={heading}>Pick a program</div>
          <div style={subtext}>
            {isFiltered
              ? `${displayTemplates.length} program${displayTemplates.length !== 1 ? "s" : ""} match your preferences. Tap to preview.`
              : "Browse all available programs. Tap to preview."}
          </div>

          {/* Active filters badge */}
          {filterSummary && (
            <div style={{
              fontSize: 11,
              color: "var(--accent)",
              background: "var(--accent-bg)",
              padding: "6px 10px",
              borderRadius: 6,
              marginBottom: 12,
              display: "inline-block",
            }}>
              Filtered: {filterSummary}
            </div>
          )}

          {/* AI Program Builder card */}
          {aiEnabled && (
            <div
              onClick={() => setStep(7)}
              style={{
                ...S.card,
                cursor: "pointer",
                border: "1px solid var(--accent)",
                background: "linear-gradient(135deg, var(--accent-bg), var(--surface))",
                marginBottom: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 24 }}>✨</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--accent)" }}>Build a Custom Program</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                    Our AI coach will design a program tailored to your goals and equipment.
                  </div>
                </div>
                <span style={{ color: "var(--accent)", fontSize: 18 }}>→</span>
              </div>
            </div>
          )}

          {displayTemplates.map((t, i) => {
            const goalColors = { strength: "#ef4444", hypertrophy: "var(--accent)", general: "#22c55e" };
            const equipLabel = EQUIPMENT_OPTIONS.find(e => e.id === t.tags.equipment);
            return (
              <div key={i} onClick={() => { setSelectedTemplate(t); setStep(6); }} style={{ ...S.card, cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-bright)" }}>{t.name}</div>
                    <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                      <span style={S.tag(goalColors[t.tags.goal] || "var(--text-muted)")}>{t.tags.goal}</span>
                      <span style={S.tag("#525252")}>{t.tags.daysPerWeek}x/week</span>
                      <span style={S.tag("#525252")}>{t.tags.level}</span>
                      {equipLabel && t.tags.equipment !== "full_gym" && (
                        <span style={S.tag("#6366f1")}>{equipLabel.label}</span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6, lineHeight: 1.4 }}>{t.description}</div>
                  </div>
                  <span style={{ color: "var(--text-dim)", fontSize: 18, flexShrink: 0, marginLeft: 8 }}>→</span>
                </div>
              </div>
            );
          })}

          {isFiltered && filtered.length < STARTER_TEMPLATES.length && (
            <div style={{ textAlign: "center", marginTop: 8, marginBottom: 8 }}>
              <button
                onClick={() => { setEquipment(null); setLevel(null); setDays(null); }}
                style={{ ...skipBtn, color: "var(--accent)", fontSize: 12 }}
              >
                Show all {STARTER_TEMPLATES.length} programs
              </button>
            </div>
          )}

          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button onClick={() => setStep(4)} style={{ ...S.btn("ghost"), flex: 1 }}>Back</button>
            <button onClick={() => onComplete(null, level, getProfileData())} style={{ ...S.btn("ghost"), flex: 1 }}>
              Skip — no program
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════ STEP 6: Template Preview ══════════════
  if (step === 6 && selectedTemplate) {
    const t = selectedTemplate;
    const equipLabel = EQUIPMENT_OPTIONS.find(e => e.id === t.tags.equipment);
    return (
      <div style={container}>
        <div style={{ paddingTop: 32 }}>
          <StepDots current={6} />
          <div style={heading}>{t.name}</div>
          <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
            <span style={S.tag("#525252")}>{t.tags.daysPerWeek}x/week</span>
            <span style={S.tag("#525252")}>{t.tags.level}</span>
            <span style={S.tag("#525252")}>{t.tags.goal}</span>
            {equipLabel && <span style={S.tag("#6366f1")}>{equipLabel.label}</span>}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16, lineHeight: 1.5 }}>{t.description}</div>

          {t.days.map((d, di) => (
            <div key={di} style={{ ...S.card, padding: "10px 12px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-bright)", marginBottom: 2 }}>{d.label}</div>
              {d.subtitle && <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase" }}>{d.subtitle}</div>}
              {d.exercises.map((ex, ei) => (
                <div key={ei} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  fontSize: 12, padding: "4px 0",
                  borderTop: ei > 0 ? "1px solid var(--surface2)" : "none",
                }}>
                  <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{ex.name}</span>
                  <span style={{ fontSize: 11, color: "var(--text-dim)", flexShrink: 0, marginLeft: 8 }}>
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
            <button onClick={() => setStep(5)} style={{ ...S.btn("ghost"), flex: 1 }}>Back to list</button>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════ STEP 7: AI Program Setup ══════════════
  if (step === 7) {
    const equipLabel = EQUIPMENT_OPTIONS.find(e => e.id === equipment)?.label || "your equipment";
    return (
      <div style={container}>
        <div style={{ paddingTop: 32 }}>
          <StepDots current={5} />
          <div style={heading}>Build Your Program</div>
          <div style={subtext}>
            Our AI coach will create a personalized program for {days} days/week using {equipLabel.toLowerCase()}.
          </div>

          {/* Goal selection */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              What's your primary goal?
            </div>
            {GOAL_OPTIONS.map(g => (
              <div key={g.id} onClick={() => setGoal(g.id)} style={card(goal === g.id)}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 24 }}>{g.icon}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: goal === g.id ? "var(--text-bright)" : "var(--text-secondary)" }}>{g.label}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{g.desc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Optional preferences */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Anything else? <span style={{ textTransform: "none", fontStyle: "italic" }}>(optional)</span>
            </div>
            <textarea
              value={preferences}
              onChange={e => setPreferences(e.target.value)}
              style={{ ...S.input, fontSize: 13, minHeight: 60, resize: "none", lineHeight: 1.5 }}
              placeholder="e.g. bad shoulder — avoid overhead pressing, prefer machines over free weights, want extra arm work..."
              rows={3}
            />
          </div>

          {/* Error display */}
          {aiError && (
            <div style={{ ...S.card, border: "1px solid #ef4444", background: "#1c0707", marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: "#f87171" }}>{aiError}</div>
            </div>
          )}

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => { setAiError(null); setStep(5); }} style={{ ...S.btn("ghost"), flex: 1 }}>Back</button>
            <button
              onClick={generateProgram}
              disabled={!goal || aiLoading}
              style={{ ...S.btn("primary"), flex: 2, opacity: (!goal || aiLoading) ? 0.4 : 1 }}
            >
              {aiLoading ? "Building your program..." : "Build My Program"}
            </button>
          </div>
          <div style={{ textAlign: "center", marginTop: 8 }}>
            <button onClick={handleSkip} style={skipBtn}>Skip setup</button>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════ STEP 8: AI Program Preview ══════════════
  if (step === 8 && aiProgram) {
    const equipLabel = EQUIPMENT_OPTIONS.find(e => e.id === equipment);
    return (
      <div style={container}>
        <div style={{ paddingTop: 32 }}>
          <StepDots current={6} />

          {/* AI badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 10, color: "var(--accent)", background: "var(--accent-bg)",
            padding: "4px 10px", borderRadius: 12, marginBottom: 12,
            textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600,
          }}>
            ✨ AI Generated
          </div>

          <div style={heading}>{aiProgram.name}</div>
          {aiProgram.description && (
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12, lineHeight: 1.5 }}>{aiProgram.description}</div>
          )}

          <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
            <span style={S.tag("#525252")}>{aiProgram.days?.length || days}x/week</span>
            {level && <span style={S.tag("#525252")}>{level}</span>}
            {goal && <span style={S.tag("#525252")}>{GOAL_OPTIONS.find(g => g.id === goal)?.label}</span>}
            {equipLabel && <span style={S.tag("#6366f1")}>{equipLabel.label}</span>}
          </div>

          {aiProgram.days?.map((d, di) => (
            <div key={di} style={{ ...S.card, padding: "10px 12px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-bright)", marginBottom: 2 }}>{d.label}</div>
              {d.subtitle && <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase" }}>{d.subtitle}</div>}
              {d.exercises?.map((ex, ei) => (
                <div key={ei} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  fontSize: 12, padding: "4px 0",
                  borderTop: ei > 0 ? "1px solid var(--surface2)" : "none",
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{ex.name}</span>
                    {ex.notes && <div style={{ fontSize: 9, color: "var(--text-dim)", marginTop: 1, fontStyle: "italic" }}>{ex.notes}</div>}
                  </div>
                  <span style={{ fontSize: 11, color: "var(--text-dim)", flexShrink: 0, marginLeft: 8 }}>
                    {ex.defaultSets}×{ex.targetReps}
                  </span>
                </div>
              ))}
            </div>
          ))}

          {/* AI commentary */}
          {aiCommentary && (
            <div style={{ ...S.card, borderColor: "var(--accent)", background: "var(--accent-bg)" }}>
              <div style={{ fontSize: 10, color: "var(--accent)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>Coach Notes</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>{aiCommentary}</div>
            </div>
          )}

          <button onClick={adoptAiProgram} style={{ ...S.btn("primary"), width: "100%", padding: "14px 0", fontSize: 15, fontWeight: 700 }}>
            Start with this program
          </button>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button onClick={() => setStep(7)} style={{ ...S.btn("ghost"), flex: 1 }}>Adjust & regenerate</button>
            <button onClick={() => setStep(5)} style={{ ...S.btn("ghost"), flex: 1 }}>Browse templates</button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
// ═══════════════════════ PROGRAMS PAGE ═══════════════════════
// User's programs + unified "Browse Programs" view combining
// starter templates and community (shared) programs.

import { useState, useEffect, useMemo } from "react";
import { useTalos } from "../context/TalosContext";
import { genId } from "../lib/helpers";
import { STARTER_TEMPLATES } from "../lib/starterTemplates";
import ExercisePicker from "../components/ExercisePicker";
import api from "../lib/api";
import S from "../lib/styles";

// ── Browse Programs sub-view ──
function BrowsePrograms({ onAdopt, onClose }) {
  const [communityPrograms, setCommunityPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // all | templates | community
  const [preview, setPreview] = useState(null);
  const [adopted, setAdopted] = useState(new Set());
  const [adopting, setAdopting] = useState(false);

  useEffect(() => {
    api.get("/programs/browse").then(data => {
      setCommunityPrograms(data.programs || []);
      setLoading(false);
    }).catch((e) => {
      console.error("Browse programs failed:", e);
      setLoading(false);
    });
  }, []);

  // Merge templates + community into one browseable list
  const allPrograms = useMemo(() => {
    const templates = STARTER_TEMPLATES.map((t, i) => ({
      ...t,
      _browseId: `template-${i}`,
      source: "template",
      creator_name: "TALOS",
      _searchText: `${t.name} ${t.description} ${t.tags?.goal || ""} ${t.tags?.level || ""} ${t.days.map(d => d.exercises.map(e => e.name).join(" ")).join(" ")}`.toLowerCase(),
    }));
    const community = communityPrograms.map(p => ({
      ...p,
      _browseId: p.id,
      source: p.source || "community",
      tags: null,
      _searchText: `${p.name} ${p.description || ""} ${p.creator_name || ""} ${p.days?.map(d => d.exercises?.map(e => e.name).join(" ")).join(" ") || ""}`.toLowerCase(),
    }));
    return [...templates, ...community];
  }, [communityPrograms]);

  // Filter + search
  const filtered = useMemo(() => {
    let list = allPrograms;
    if (filter === "templates") list = list.filter(p => p.source === "template");
    if (filter === "community") list = list.filter(p => p.source === "community" || p.source === "own");
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(p => p._searchText.includes(q));
    }
    return list;
  }, [allPrograms, filter, search]);

  async function handleAdopt(program) {
    setAdopting(true);
    try {
      const payload = {
        name: program.name,
        description: program.description || "",
        days: program.days.map(d => ({
          id: genId(),
          label: d.label,
          subtitle: d.subtitle || "",
          exercises: (d.exercises || []).map(e => ({ ...e })),
        })),
        forked_from: program.source === "community" ? program.id : `template:${program.name}`,
      };
      await onAdopt(payload);
      setAdopted(prev => new Set(prev).add(program._browseId));
      setPreview(null);
    } catch (e) {
      alert("Failed to add program: " + e.message);
    }
    setAdopting(false);
  }

  function isAlreadyAdded(program) {
    return adopted.has(program._browseId);
  }

  // ── Preview view ──
  if (preview) {
    const p = preview;
    const totalExercises = (p.days || []).reduce((a, d) => a + (d.exercises?.length || 0), 0);
    const alreadyAdded = isAlreadyAdded(p);

    return (
      <div className="fade-in">
        <div style={S.card}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            {p.source === "template" ? (
              <span style={S.tag()}>✦ TALOS Template</span>
            ) : p.source === "own" ? (
              <span style={S.tag("#22c55e")}>Your Program</span>
            ) : (
              <span style={S.tag("#6366f1")}>⊕ {p.creator_name}</span>
            )}
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-bright)" }}>{p.name}</div>
          {p.tags && (
            <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
              <span style={S.tag({ strength: "#ef4444", hypertrophy: "var(--accent)", general: "#22c55e" }[p.tags.goal] || "var(--text-muted)")}>{p.tags.goal}</span>
              <span style={S.tag("#525252")}>{p.tags.daysPerWeek}x/week</span>
              <span style={S.tag("#525252")}>{p.tags.level}</span>
            </div>
          )}
          {p.description && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8, lineHeight: 1.5 }}>{p.description}</div>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12, textAlign: "center" }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-bright)" }}>{(p.days || []).length}</div>
              <div style={{ fontSize: 9, color: "var(--text-dim)", textTransform: "uppercase" }}>Days</div>
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-bright)" }}>{totalExercises}</div>
              <div style={{ fontSize: 9, color: "var(--text-dim)", textTransform: "uppercase" }}>Exercises</div>
            </div>
          </div>
        </div>

        {(p.days || []).map((day, di) => (
          <div key={di} style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-bright)" }}>{day.label}</div>
                {day.subtitle && <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 1 }}>{day.subtitle}</div>}
              </div>
              <span style={{ fontSize: 10, color: "var(--text-dim)" }}>{(day.exercises || []).length} exercises</span>
            </div>
            {(day.exercises || []).map((ex, ei) => (
              <div key={ei} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
                <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{ex.name}</span>
                <span style={{ fontSize: 11, color: "var(--text-dim)" }}>{ex.defaultSets}×{ex.targetReps}</span>
              </div>
            ))}
          </div>
        ))}

        <div style={{ padding: "8px 16px 20px", display: "flex", gap: 8 }}>
          <button onClick={() => setPreview(null)} style={{ ...S.btn("ghost"), flex: 1 }}>Back</button>
          {p.source === "own" ? (
            <div style={{ flex: 2, textAlign: "center", fontSize: 11, color: "var(--text-dim)", padding: "10px 0" }}>
              This is your program — edit it from Your Programs
            </div>
          ) : (
            <button
              onClick={() => handleAdopt(p)}
              disabled={adopting || alreadyAdded}
              style={{ ...S.btn("primary"), flex: 2, opacity: (adopting || alreadyAdded) ? 0.5 : 1 }}
            >
              {alreadyAdded ? "✓ Added" : adopting ? "Adding..." : "Add to My Programs"}
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Browse list view ──
  const filterBtn = (id) => ({
    padding: "6px 12px",
    borderRadius: 6,
    border: filter === id ? "1px solid var(--accent)" : "1px solid var(--border2)",
    background: filter === id ? "var(--accent-bg2)" : "transparent",
    color: filter === id ? "var(--accent)" : "var(--text-muted)",
    fontSize: 11,
    fontWeight: 700,
    fontFamily: "inherit",
    cursor: "pointer",
    letterSpacing: "0.3px",
    minHeight: 44,
    display: "inline-flex",
    alignItems: "center",
  });

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ padding: "4px 16px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={S.label}>Browse Programs</div>
        <button onClick={onClose} style={S.sm()}>← Back</button>
      </div>

      {/* Search */}
      <div style={{ padding: "8px 16px" }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...S.input, fontSize: 13 }}
          placeholder="Search programs, exercises, creators..."
        />
      </div>

      {/* Filter tabs */}
      <div style={{ padding: "0 16px 8px", display: "flex", gap: 6 }}>
        <button onClick={() => setFilter("all")} style={filterBtn("all")}>All</button>
        <button onClick={() => setFilter("templates")} style={filterBtn("templates")}>Templates</button>
        <button onClick={() => setFilter("community")} style={filterBtn("community")}>Community</button>
      </div>

      {/* Results */}
      {loading ? (
        <div style={{ color: "var(--text-dim)", fontSize: 12, textAlign: "center", padding: 32 }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div style={{ color: "var(--text-dim)", fontSize: 12, textAlign: "center", padding: 32 }}>
          {search ? "No programs match your search" : "No programs available"}
        </div>
      ) : (
        filtered.map(p => {
          const goalColors = { strength: "#ef4444", hypertrophy: "var(--accent)", general: "#22c55e" };
          const alreadyAdded = isAlreadyAdded(p);
          return (
            <div key={p._browseId} onClick={() => setPreview(p)} style={{ ...S.card, cursor: "pointer", opacity: alreadyAdded ? 0.6 : 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    {p.source === "template" ? (
                      <span style={{ ...S.tag(), fontSize: 8, padding: "2px 6px" }}>✦ TALOS</span>
                    ) : p.source === "own" ? (
                      <span style={{ ...S.tag("#22c55e"), fontSize: 8, padding: "2px 6px" }}>✓ Yours</span>
                    ) : (
                      <span style={{ ...S.tag("#6366f1"), fontSize: 8, padding: "2px 6px" }}>⊕ {p.creator_name}</span>
                    )}
                    {alreadyAdded && <span style={{ fontSize: 9, color: "#22c55e" }}>✓ Added</span>}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-bright)" }}>{p.name}</div>
                  {p.description && <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.description}</div>}
                  <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                    {p.tags && (
                      <>
                        <span style={S.tag(goalColors[p.tags.goal] || "var(--text-muted)")}>{p.tags.goal}</span>
                        <span style={S.tag("#525252")}>{p.tags.daysPerWeek}x</span>
                        <span style={S.tag("#525252")}>{p.tags.level}</span>
                      </>
                    )}
                    {!p.tags && (
                      <span style={S.tag("#525252")}>{(p.days || []).length} days</span>
                    )}
                  </div>
                </div>
                <span style={{ color: "var(--text-dim)", fontSize: 14, flexShrink: 0, marginLeft: 8, marginTop: 4 }}>→</span>
              </div>
            </div>
          );
        })
      )}

      <div style={{ height: 20 }} />
    </div>
  );
}

// ── AI Guided Program Builder sub-view ──
const BUILDER_GOALS = [
  { id: "hypertrophy", label: "Build Muscle", icon: "💪" },
  { id: "strength", label: "Get Stronger", icon: "🏋️" },
  { id: "general", label: "General Fitness", icon: "⚡" },
];
const BUILDER_EQUIPMENT = [
  { id: "full_gym", label: "Full Gym" },
  { id: "dumbbells", label: "Dumbbells Only" },
  { id: "minimal", label: "Minimal / Travel" },
  { id: "bodyweight", label: "Bodyweight" },
];

function GuidedProgramBuilder({ onSave, onClose }) {
  const { profile, user, workouts, programs } = useTalos();

  // Pre-fill from profile
  const [goal, setGoal] = useState(
    profile.goal === "strength" ? "strength"
      : profile.goal === "hypertrophy" || profile.goal === "bulk" ? "hypertrophy"
      : "general"
  );
  const [days, setDays] = useState(
    programs.length > 0 ? (programs[0].days?.length || 4) : 4
  );
  const [equipment, setEquipment] = useState(profile.equipmentPreference || "full_gym");
  const [preferences, setPreferences] = useState(profile.injuriesNotes || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null); // { program, commentary }

  function buildPrompt() {
    const goalLabel = BUILDER_GOALS.find(g => g.id === goal)?.label || "general fitness";
    const equipLabel = BUILDER_EQUIPMENT.find(e => e.id === equipment)?.label || "full gym";
    const parts = [
      `Build me a ${days}-day per week ${goalLabel.toLowerCase()} program.`,
      `Equipment available: ${equipLabel}.`,
      profile.experienceLevel ? `Experience level: ${profile.experienceLevel}.` : null,
      profile.sex ? `Sex: ${profile.sex}.` : null,
      profile.weight ? `Body weight: ${profile.weight} lbs.` : null,
      profile.height ? `Height: ${profile.height}.` : null,
      preferences.trim() ? `Additional preferences: ${preferences.trim()}` : null,
    ];
    return parts.filter(Boolean).join(" ");
  }

  function buildContext() {
    const age = profile.dateOfBirth
      ? Math.floor((Date.now() - new Date(profile.dateOfBirth + "T12:00:00").getTime()) / 31557600000)
      : null;
    const lines = [
      `Name: ${user.name}`,
      profile.sex ? `Sex: ${profile.sex}` : null,
      age ? `Age: ${age}` : null,
      profile.height ? `Height: ${profile.height}` : null,
      profile.weight ? `Weight: ${profile.weight} lbs` : null,
      profile.experienceLevel ? `Experience: ${profile.experienceLevel}` : null,
      equipment ? `Equipment: ${BUILDER_EQUIPMENT.find(e => e.id === equipment)?.label}` : null,
      profile.injuriesNotes ? `Injuries/Limitations: ${profile.injuriesNotes}` : null,
    ].filter(Boolean).join(", ");

    // Include recent workout info if available
    const recent = workouts.slice(-5);
    const recentCtx = recent.length > 0
      ? `\nRECENT (${recent.length}):\n${recent.map(w => `${w.date} ${w.day_label || ""} — ${w.exercises?.map(e => e.name).join(", ") || "empty"}`).join("\n")}`
      : "\nNo training history yet.";

    const programCtx = programs.length > 0
      ? `\nCURRENT PROGRAMS:\n${programs.map(p => `${p.name} (${p.days?.length || 0} days)`).join(", ")}`
      : "\nNo existing programs.";

    return `USER: ${lines}${programCtx}${recentCtx}`;
  }

  async function generate() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await api.post("/coach/program", {
        prompt: buildPrompt(),
        context: buildContext(),
      });
      if (data.program) {
        data.program.days?.forEach(d => { if (!d.id) d.id = genId(); });
        setResult(data);
      } else {
        setError(data.commentary || "Could not generate a program. Try adjusting your preferences.");
      }
    } catch (e) {
      setError("Failed to connect to AI coach: " + e.message);
    }
    setLoading(false);
  }

  async function saveProgram() {
    if (!result?.program) return;
    const program = {
      name: result.program.name || "AI Program",
      description: result.program.description || "",
      days: result.program.days.map(d => ({
        id: d.id || genId(),
        label: d.label,
        subtitle: d.subtitle || "",
        exercises: (d.exercises || []).map(e => ({ ...e })),
      })),
      shared: false,
    };
    await onSave(program);
    onClose();
  }

  // ── Preview mode ──
  if (result?.program) {
    const p = result.program;
    return (
      <div style={{ padding: "0 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={S.label}>AI Program Preview</div>
          <button onClick={onClose} style={S.sm()}>✕</button>
        </div>

        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          fontSize: 10, color: "var(--accent)", background: "var(--accent-bg)",
          padding: "4px 10px", borderRadius: 12, marginBottom: 8,
          textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600,
        }}>
          ✨ AI Generated
        </div>

        <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-bright)", marginBottom: 4 }}>{p.name}</div>
        {p.description && <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12, lineHeight: 1.5 }}>{p.description}</div>}

        <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
          <span style={S.tag("#525252")}>{p.days?.length}x/week</span>
          <span style={S.tag("#525252")}>{goal}</span>
          <span style={S.tag("#6366f1")}>{BUILDER_EQUIPMENT.find(e => e.id === equipment)?.label}</span>
        </div>

        {p.days?.map((d, di) => (
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

        {result.commentary && (
          <div style={{ ...S.card, borderColor: "var(--accent)", background: "var(--accent-bg)" }}>
            <div style={{ fontSize: 10, color: "var(--accent)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>Coach Notes</div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>{result.commentary}</div>
          </div>
        )}

        <button onClick={saveProgram} style={{ ...S.btn("primary"), width: "100%", padding: "14px 0", fontSize: 15, fontWeight: 700 }}>
          Save Program
        </button>
        <div style={{ display: "flex", gap: 8, marginTop: 8, marginBottom: 20 }}>
          <button onClick={() => setResult(null)} style={{ ...S.btn("ghost"), flex: 1 }}>Adjust & regenerate</button>
          <button onClick={onClose} style={{ ...S.btn("ghost"), flex: 1 }}>Cancel</button>
        </div>
      </div>
    );
  }

  // ── Setup form ──
  return (
    <div style={{ padding: "0 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={S.label}>✨ AI Program Builder</div>
        <button onClick={onClose} style={S.sm()}>✕</button>
      </div>

      <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16, lineHeight: 1.5 }}>
        Tell us your goal and preferences — the AI coach will design a program tailored to you.
      </div>

      {/* Goal */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 10, color: "var(--text-dim)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>Goal</div>
        <div style={{ display: "flex", gap: 6 }}>
          {BUILDER_GOALS.map(g => (
            <button key={g.id} onClick={() => setGoal(g.id)} style={{
              ...S.btn(goal === g.id ? "primary" : "ghost"),
              flex: 1, fontSize: 11, padding: "10px 6px",
            }}>
              {g.icon} {g.label}
            </button>
          ))}
        </div>
      </div>

      {/* Days + Equipment */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 10, color: "var(--text-dim)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>Days / Week</div>
          <div style={{ display: "flex", gap: 4 }}>
            {[3, 4, 5, 6].map(n => (
              <button key={n} onClick={() => setDays(n)} style={{
                ...S.btn(days === n ? "primary" : "ghost"),
                flex: 1, padding: "10px 0", fontSize: 14, fontWeight: 700,
              }}>
                {n}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: "var(--text-dim)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>Equipment</div>
          <select value={equipment} onChange={e => setEquipment(e.target.value)} style={{ ...S.input, fontSize: 13, height: 42, padding: "0 10px" }}>
            {BUILDER_EQUIPMENT.map(e => (
              <option key={e.id} value={e.id}>{e.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Preferences */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 10, color: "var(--text-dim)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>
          Preferences <span style={{ fontWeight: 400, opacity: 0.6 }}>(optional)</span>
        </div>
        <textarea
          value={preferences}
          onChange={e => setPreferences(e.target.value)}
          style={{ ...S.input, fontSize: 13, minHeight: 56, resize: "none", lineHeight: 1.5 }}
          placeholder="e.g. bad shoulder, prefer machines, want extra arm work..."
          rows={3}
        />
      </div>

      {error && (
        <div style={{ ...S.card, border: "1px solid #ef4444", background: "#1c0707", marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: "#f87171" }}>{error}</div>
        </div>
      )}

      <button onClick={generate} disabled={loading} style={{ ...S.btn("primary"), width: "100%", padding: "14px 0", fontSize: 15, fontWeight: 700, opacity: loading ? 0.5 : 1 }}>
        {loading ? "Building your program..." : "✨ Generate Program"}
      </button>
      <div style={{ textAlign: "center", marginTop: 8, marginBottom: 20 }}>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-dim)", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
      </div>
    </div>
  );
}

// ═══════════════════════ MAIN PROGRAMS PAGE ═══════════════════════
export default function ProgramsPage() {
  const { user, programs, saveProgram, deleteProgram, adoptProgram, customExercises, editingProgram: editing, setEditingProgram: setEditing, aiConfig } = useTalos();
  const [showPicker, setShowPicker] = useState(false);
  const [pickerDayIdx, setPickerDayIdx] = useState(null);
  const [replacingExIdx, setReplacingExIdx] = useState(null);
  const [collapsedDays, setCollapsedDays] = useState(new Set());
  const [browsing, setBrowsing] = useState(false);
  const [aiBuilding, setAiBuilding] = useState(false);

  function toggleDayCollapse(dayId) {
    setCollapsedDays(prev => {
      const next = new Set(prev);
      if (next.has(dayId)) next.delete(dayId); else next.add(dayId);
      return next;
    });
  }

  function collapseAllDays() {
    if (!editing) return;
    setCollapsedDays(new Set(editing.days.map(d => d.id)));
  }

  function expandAllDays() {
    setCollapsedDays(new Set());
  }

  function startNew() {
    setEditing({ id: null, name: "", description: "", days: [], shared: false });
  }

  function editProgram(p) {
    setEditing(JSON.parse(JSON.stringify(p)));
  }

  function addDay() {
    setEditing(p => ({ ...p, days: [...p.days, { id: genId(), label: "", subtitle: "", exercises: [] }] }));
  }

  function updateDay(idx, field, val) {
    setEditing(p => { const n = { ...p, days: [...p.days] }; n.days[idx] = { ...n.days[idx], [field]: val }; return n; });
  }

  function moveDay(idx, dir) {
    setEditing(p => {
      const days = [...p.days];
      const t = idx + dir;
      if (t < 0 || t >= days.length) return p;
      [days[idx], days[t]] = [days[t], days[idx]];
      return { ...p, days };
    });
  }

  function removeDay(idx) {
    setEditing(p => ({ ...p, days: p.days.filter((_, i) => i !== idx) }));
  }

  function addExerciseToDay(dayIdx, ex) {
    setEditing(p => {
      const n = { ...p, days: [...p.days] };
      n.days[dayIdx] = { ...n.days[dayIdx], exercises: [...n.days[dayIdx].exercises, { name: ex.name, defaultSets: 3, targetReps: "8-12", notes: "" }] };
      return n;
    });
  }

  function replaceExInDay(dayIdx, exIdx, newEx) {
    setEditing(p => {
      const n = { ...p, days: [...p.days] };
      const exs = [...n.days[dayIdx].exercises];
      exs[exIdx] = { ...exs[exIdx], name: newEx.name };
      n.days[dayIdx] = { ...n.days[dayIdx], exercises: exs };
      return n;
    });
  }

  function removeExFromDay(dayIdx, exIdx) {
    setEditing(p => {
      const n = { ...p, days: [...p.days] };
      n.days[dayIdx] = { ...n.days[dayIdx], exercises: n.days[dayIdx].exercises.filter((_, i) => i !== exIdx) };
      return n;
    });
  }

  function moveExInDay(dayIdx, exIdx, dir) {
    setEditing(p => {
      const n = { ...p, days: [...p.days] };
      const exs = [...n.days[dayIdx].exercises];
      const t = exIdx + dir;
      if (t < 0 || t >= exs.length) return p;
      [exs[exIdx], exs[t]] = [exs[t], exs[exIdx]];
      n.days[dayIdx] = { ...n.days[dayIdx], exercises: exs };
      return n;
    });
  }

  async function save() {
    if (!editing.name.trim()) return alert("Program needs a name");
    if (editing.days.length === 0) return alert("Add at least one day");
    await saveProgram(editing);
    setEditing(null);
  }

  // ── Browse Programs view ──
  if (browsing) {
    return (
      <BrowsePrograms
        onAdopt={adoptProgram}
        onClose={() => setBrowsing(false)}
      />
    );
  }

  // ── AI Program Builder view ──
  if (aiBuilding) {
    return (
      <GuidedProgramBuilder
        onSave={saveProgram}
        onClose={() => setAiBuilding(false)}
      />
    );
  }

  // ── Editing view ──
  if (editing) {
    return (
      <div className="fade-in">
      {showPicker && (
        <ExercisePicker customExercises={customExercises}
        onSelect={(ex) => {
          if (replacingExIdx !== null) {
            replaceExInDay(pickerDayIdx, replacingExIdx, ex);
            setReplacingExIdx(null);
          } else {
            addExerciseToDay(pickerDayIdx, ex);
          }
        }}
        onClose={() => { setShowPicker(false); setReplacingExIdx(null); }} />
      )}
      <div style={S.card}>
      <div style={S.label}>{editing.id ? "Edit Program" : "New Program"}</div>
      <input value={editing.name} onChange={e => setEditing(p => ({ ...p, name: e.target.value }))} style={{ ...S.input, marginBottom: 8 }} placeholder="Program name" />
      <input value={editing.description} onChange={e => setEditing(p => ({ ...p, description: e.target.value }))} style={{ ...S.input, marginBottom: 8, fontSize: 12 }} placeholder="Description (optional)" />
      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--text-muted)", cursor: "pointer" }}>
      <input type="checkbox" checked={editing.shared} onChange={e => setEditing(p => ({ ...p, shared: e.target.checked }))} />
      Publish to community
      </label>
      </div>

      {editing.days.length > 1 && (
        <div style={{ padding: "0 16px 4px", display: "flex", gap: 6, justifyContent: "flex-end" }}>
        <button onClick={collapseAllDays} style={S.sm()}>Collapse All</button>
        <button onClick={expandAllDays} style={S.sm()}>Expand All</button>
        </div>
      )}

      {editing.days.map((day, di) => {
        const isCollapsed = collapsedDays.has(day.id);
        return (
          <div key={day.id} style={S.card}>
          <div onClick={() => toggleDayCollapse(day.id)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", marginBottom: isCollapsed ? 0 : 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "var(--text-dim)", fontSize: 12, transition: "transform 0.2s", transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)" }}>▼</span>
          <div>
          <div style={S.label}>Day {di + 1}{day.label ? ` — ${day.label}` : ""}</div>
          {isCollapsed && <div style={{ fontSize: 10, color: "var(--text-dim)" }}>{day.exercises?.length || 0} exercises</div>}
          </div>
          </div>
          <div style={{ display: "flex", gap: 4 }} onClick={e => e.stopPropagation()}>
            {di > 0 && <button onClick={() => moveDay(di, -1)} style={{ ...S.sm(), fontSize: 16, fontWeight: 900, minWidth: 44 }}>↑</button>}
            {di < editing.days.length - 1 && <button onClick={() => moveDay(di, 1)} style={{ ...S.sm(), fontSize: 16, fontWeight: 900, minWidth: 44 }}>↓</button>}
            <button onClick={() => removeDay(di)} style={S.sm("danger")}>Remove</button>
          </div>
          </div>

          {!isCollapsed && (
            <>
            <input value={day.label} onChange={e => updateDay(di, "label", e.target.value)} style={{ ...S.input, marginBottom: 6, fontSize: 13 }} placeholder="Day label (e.g. Push 1)" />
            <input value={day.subtitle} onChange={e => updateDay(di, "subtitle", e.target.value)} style={{ ...S.input, marginBottom: 8, fontSize: 11 }} placeholder="Subtitle (e.g. Chest / Triceps)" />

            {day.exercises.map((ex, ei) => (
              <div key={ei} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 0", borderBottom: "1px solid var(--surface2)" }}>
              <span onClick={() => { setPickerDayIdx(di); setReplacingExIdx(ei); setShowPicker(true); }} style={{ fontSize: 12, color: "var(--text-secondary)", flex: 1, cursor: "pointer", textDecoration: "underline", textDecorationColor: "var(--border2)", textUnderlineOffset: 2 }}>{ex.name}</span>
              <select value={ex.defaultSets} onChange={e => {
                setEditing(p => {
                  const n = { ...p, days: [...p.days] };
                  const exs = [...n.days[di].exercises];
                  exs[ei] = { ...exs[ei], defaultSets: Number(e.target.value) };
                  n.days[di] = { ...n.days[di], exercises: exs };
                  return n;
                });
              }} style={{ ...S.smSelect, width: 48, textAlign: "center" }} title="Sets">
              {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <span style={{ fontSize: 9, color: "var(--text-dim)" }}>×</span>
              <input value={ex.targetReps || ""} onChange={e => {
                setEditing(p => {
                  const n = { ...p, days: [...p.days] };
                  const exs = [...n.days[di].exercises];
                  exs[ei] = { ...exs[ei], targetReps: e.target.value };
                  n.days[di] = { ...n.days[di], exercises: exs };
                  return n;
                });
              }} style={{ ...S.smInput, width: 52, textAlign: "center" }} placeholder="8-12" title="Rep range" />
              {ei > 0 && <button onClick={() => moveExInDay(di, ei, -1)} style={{ ...S.sm(), fontSize: 16, fontWeight: 900, minWidth: 44 }}>↑</button>}
              {ei < day.exercises.length - 1 && <button onClick={() => moveExInDay(di, ei, 1)} style={{ ...S.sm(), fontSize: 16, fontWeight: 900, minWidth: 44 }}>↓</button>}
              <button onClick={() => removeExFromDay(di, ei)} style={S.sm("danger")}>✕</button>
              </div>
            ))}
            <button onClick={() => { setPickerDayIdx(di); setShowPicker(true); }} style={{ ...S.sm(), marginTop: 8 }}>+ Add Exercise</button>
            </>
          )}
          </div>
        );
      })}

      <div style={{ padding: "4px 16px" }}>
      <button onClick={addDay} style={{ ...S.btn("ghost"), width: "100%" }}>+ Add Day</button>
      </div>
      <div style={{ padding: "8px 16px 20px", display: "flex", gap: 8 }}>
      <button onClick={() => { if (confirm("Discard unsaved changes?")) setEditing(null); }} style={{ ...S.btn("ghost"), flex: 1 }}>Cancel</button>
      <button onClick={save} style={{ ...S.btn("primary"), flex: 2 }}>Save Program</button>
      </div>
      {editing.id && (
        <div style={{ padding: "0 16px 20px" }}>
        <button onClick={() => { deleteProgram(editing.id); setEditing(null); }} style={{ ...S.btn("ghost"), width: "100%", color: "#ef4444", borderColor: "#7f1d1d" }}>Delete Program</button>
        </div>
      )}
      </div>
    );
  }

  // ── Main list view ──
  return (
    <div className="fade-in">
    <div style={{ padding: "4px 16px 0" }}><div style={S.label}>Your Programs</div></div>

    {programs.length === 0 && (
      <div style={{ ...S.card, textAlign: "center" }}>
        <div style={{ fontSize: 12, color: "var(--text-dim)", padding: "8px 0" }}>
          No programs yet. Create one or browse templates and community programs.
        </div>
      </div>
    )}

    {programs.map(p => (
        <div key={p.id} onClick={() => editProgram(p)} style={{ ...S.card, cursor: "pointer" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-bright)" }}>{p.name}</div>
              {p.description && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{p.description}</div>}
            <div style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 4 }}>
              {p.days?.length || 0} days · {p.shared ? "Published" : "Private"}
            </div>
          </div>
          <span style={{ color: "var(--text-dim)", fontSize: 18 }}>→</span>
        </div>
      </div>
    ))}

      <div style={{ padding: "8px 16px", display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={startNew} style={{ ...S.btn("primary"), flex: 1 }}>+ New Program</button>
        <button onClick={() => setBrowsing(true)} style={{ ...S.btn("ghost"), flex: 1 }}>
          Browse Programs
        </button>
        {aiConfig?.enabled && (
          <button onClick={() => setAiBuilding(true)} style={{ ...S.btn("ghost"), flex: "1 1 100%", borderColor: "var(--accent)", color: "var(--accent)" }}>
            ✨ AI Program Builder
          </button>
        )}
      </div>

    </div>
  );
}

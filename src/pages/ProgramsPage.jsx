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
              <span style={S.tag("#c9952d")}>✦ TALOS Template</span>
            ) : p.source === "own" ? (
              <span style={S.tag("#22c55e")}>Your Program</span>
            ) : (
              <span style={S.tag("#6366f1")}>⊕ {p.creator_name}</span>
            )}
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#fafafa" }}>{p.name}</div>
          {p.tags && (
            <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
              <span style={S.tag({ strength: "#ef4444", hypertrophy: "#c9952d", general: "#22c55e" }[p.tags.goal] || "#737373")}>{p.tags.goal}</span>
              <span style={S.tag("#525252")}>{p.tags.daysPerWeek}x/week</span>
              <span style={S.tag("#525252")}>{p.tags.level}</span>
            </div>
          )}
          {p.description && <div style={{ fontSize: 12, color: "#737373", marginTop: 8, lineHeight: 1.5 }}>{p.description}</div>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12, textAlign: "center" }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#fafafa" }}>{(p.days || []).length}</div>
              <div style={{ fontSize: 9, color: "#525252", textTransform: "uppercase" }}>Days</div>
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#fafafa" }}>{totalExercises}</div>
              <div style={{ fontSize: 9, color: "#525252", textTransform: "uppercase" }}>Exercises</div>
            </div>
          </div>
        </div>

        {(p.days || []).map((day, di) => (
          <div key={di} style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fafafa" }}>{day.label}</div>
                {day.subtitle && <div style={{ fontSize: 10, color: "#737373", marginTop: 1 }}>{day.subtitle}</div>}
              </div>
              <span style={{ fontSize: 10, color: "#525252" }}>{(day.exercises || []).length} exercises</span>
            </div>
            {(day.exercises || []).map((ex, ei) => (
              <div key={ei} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
                <span style={{ fontSize: 11, color: "#d4d4d4" }}>{ex.name}</span>
                <span style={{ fontSize: 11, color: "#525252" }}>{ex.defaultSets}×{ex.targetReps}</span>
              </div>
            ))}
          </div>
        ))}

        <div style={{ padding: "8px 16px 20px", display: "flex", gap: 8 }}>
          <button onClick={() => setPreview(null)} style={{ ...S.btn("ghost"), flex: 1 }}>Back</button>
          {p.source === "own" ? (
            <div style={{ flex: 2, textAlign: "center", fontSize: 11, color: "#525252", padding: "10px 0" }}>
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
    border: filter === id ? "1px solid #c9952d" : "1px solid #333",
    background: filter === id ? "#c9952d15" : "transparent",
    color: filter === id ? "#c9952d" : "#737373",
    fontSize: 11,
    fontWeight: 700,
    fontFamily: "inherit",
    cursor: "pointer",
    letterSpacing: "0.3px",
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
        <div style={{ color: "#525252", fontSize: 12, textAlign: "center", padding: 32 }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div style={{ color: "#525252", fontSize: 12, textAlign: "center", padding: 32 }}>
          {search ? "No programs match your search" : "No programs available"}
        </div>
      ) : (
        filtered.map(p => {
          const goalColors = { strength: "#ef4444", hypertrophy: "#c9952d", general: "#22c55e" };
          const alreadyAdded = isAlreadyAdded(p);
          return (
            <div key={p._browseId} onClick={() => setPreview(p)} style={{ ...S.card, cursor: "pointer", opacity: alreadyAdded ? 0.6 : 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    {p.source === "template" ? (
                      <span style={{ ...S.tag("#c9952d"), fontSize: 8, padding: "2px 6px" }}>✦ TALOS</span>
                    ) : p.source === "own" ? (
                      <span style={{ ...S.tag("#22c55e"), fontSize: 8, padding: "2px 6px" }}>✓ Yours</span>
                    ) : (
                      <span style={{ ...S.tag("#6366f1"), fontSize: 8, padding: "2px 6px" }}>⊕ {p.creator_name}</span>
                    )}
                    {alreadyAdded && <span style={{ fontSize: 9, color: "#22c55e" }}>✓ Added</span>}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#fafafa" }}>{p.name}</div>
                  {p.description && <div style={{ fontSize: 10, color: "#737373", marginTop: 2, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.description}</div>}
                  <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                    {p.tags && (
                      <>
                        <span style={S.tag(goalColors[p.tags.goal] || "#737373")}>{p.tags.goal}</span>
                        <span style={S.tag("#525252")}>{p.tags.daysPerWeek}x</span>
                        <span style={S.tag("#525252")}>{p.tags.level}</span>
                      </>
                    )}
                    {!p.tags && (
                      <span style={S.tag("#525252")}>{(p.days || []).length} days</span>
                    )}
                  </div>
                </div>
                <span style={{ color: "#525252", fontSize: 14, flexShrink: 0, marginLeft: 8, marginTop: 4 }}>→</span>
              </div>
            </div>
          );
        })
      )}

      <div style={{ height: 20 }} />
    </div>
  );
}

// ═══════════════════════ MAIN PROGRAMS PAGE ═══════════════════════
export default function ProgramsPage() {
  const { user, programs, saveProgram, deleteProgram, adoptProgram, customExercises, editingProgram: editing, setEditingProgram: setEditing } = useTalos();
  const [showPicker, setShowPicker] = useState(false);
  const [pickerDayIdx, setPickerDayIdx] = useState(null);
  const [replacingExIdx, setReplacingExIdx] = useState(null);
  const [collapsedDays, setCollapsedDays] = useState(new Set());
  const [browsing, setBrowsing] = useState(false);

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
      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#737373", cursor: "pointer" }}>
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
          <span style={{ color: "#525252", fontSize: 12, transition: "transform 0.2s", transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)" }}>▼</span>
          <div>
          <div style={S.label}>Day {di + 1}{day.label ? ` — ${day.label}` : ""}</div>
          {isCollapsed && <div style={{ fontSize: 10, color: "#525252" }}>{day.exercises?.length || 0} exercises</div>}
          </div>
          </div>
          <div style={{ display: "flex", gap: 4 }} onClick={e => e.stopPropagation()}>
            {di > 0 && <button onClick={() => moveDay(di, -1)} style={S.sm()}>↑</button>}
            {di < editing.days.length - 1 && <button onClick={() => moveDay(di, 1)} style={S.sm()}>↓</button>}
            <button onClick={() => removeDay(di)} style={S.sm("danger")}>Remove</button>
          </div>
          </div>

          {!isCollapsed && (
            <>
            <input value={day.label} onChange={e => updateDay(di, "label", e.target.value)} style={{ ...S.input, marginBottom: 6, fontSize: 13 }} placeholder="Day label (e.g. Push 1)" />
            <input value={day.subtitle} onChange={e => updateDay(di, "subtitle", e.target.value)} style={{ ...S.input, marginBottom: 8, fontSize: 11 }} placeholder="Subtitle (e.g. Chest / Triceps)" />

            {day.exercises.map((ex, ei) => (
              <div key={ei} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 0", borderBottom: "1px solid #1a1a1a" }}>
              <span onClick={() => { setPickerDayIdx(di); setReplacingExIdx(ei); setShowPicker(true); }} style={{ fontSize: 12, color: "#d4d4d4", flex: 1, cursor: "pointer", textDecoration: "underline", textDecorationColor: "#333", textUnderlineOffset: 2 }}>{ex.name}</span>
              <select value={ex.defaultSets} onChange={e => {
                setEditing(p => {
                  const n = { ...p, days: [...p.days] };
                  const exs = [...n.days[di].exercises];
                  exs[ei] = { ...exs[ei], defaultSets: Number(e.target.value) };
                  n.days[di] = { ...n.days[di], exercises: exs };
                  return n;
                });
              }} style={{ ...S.smInput, width: 48, textAlign: "center" }} title="Sets">
              {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <span style={{ fontSize: 9, color: "#525252" }}>×</span>
              <input value={ex.targetReps || ""} onChange={e => {
                setEditing(p => {
                  const n = { ...p, days: [...p.days] };
                  const exs = [...n.days[di].exercises];
                  exs[ei] = { ...exs[ei], targetReps: e.target.value };
                  n.days[di] = { ...n.days[di], exercises: exs };
                  return n;
                });
              }} style={{ ...S.smInput, width: 52, textAlign: "center" }} placeholder="8-12" title="Rep range" />
              {ei > 0 && <button onClick={() => moveExInDay(di, ei, -1)} style={S.sm()}>↑</button>}
              {ei < day.exercises.length - 1 && <button onClick={() => moveExInDay(di, ei, 1)} style={S.sm()}>↓</button>}
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
        <div style={{ fontSize: 12, color: "#525252", padding: "8px 0" }}>
          No programs yet. Create one or browse templates and community programs.
        </div>
      </div>
    )}

    {programs.map(p => (
        <div key={p.id} onClick={() => editProgram(p)} style={{ ...S.card, cursor: "pointer" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fafafa" }}>{p.name}</div>
              {p.description && <div style={{ fontSize: 11, color: "#737373", marginTop: 2 }}>{p.description}</div>}
            <div style={{ fontSize: 10, color: "#525252", marginTop: 4 }}>
              {p.days?.length || 0} days · {p.shared ? "Published" : "Private"}
            </div>
          </div>
          <span style={{ color: "#525252", fontSize: 18 }}>→</span>
        </div>
      </div>
    ))}

      <div style={{ padding: "8px 16px", display: "flex", gap: 8 }}>
        <button onClick={startNew} style={{ ...S.btn("primary"), flex: 1 }}>+ New Program</button>
        <button onClick={() => setBrowsing(true)} style={{ ...S.btn("ghost"), flex: 1 }}>
          Browse Programs
        </button>
      </div>

    </div>
  );
}

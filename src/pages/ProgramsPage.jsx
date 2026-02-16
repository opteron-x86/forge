// ═══════════════════════ PROGRAMS PAGE ═══════════════════════
// Extracted from App.jsx — ProgramsPage function

import { useState } from "react";
import { useTalos } from "../context/TalosContext";
import { MUSCLE_GROUPS, EQUIPMENT } from "../lib/exercises";
import { genId } from "../lib/helpers";
import { STARTER_TEMPLATES } from "../lib/starterTemplates";
import ExercisePicker from "../components/ExercisePicker";
import S from "../lib/styles";

export default function ProgramsPage() {
  const { user, programs, saveProgram, deleteProgram, customExercises, addCustomExercise, editingProgram: editing, setEditingProgram: setEditing } = useTalos();
  const [showPicker, setShowPicker] = useState(false);
  const [pickerDayIdx, setPickerDayIdx] = useState(null);
  const [replacingExIdx, setReplacingExIdx] = useState(null);
  const [collapsedDays, setCollapsedDays] = useState(new Set());
  const [newExName, setNewExName] = useState("");
  const [newExMuscle, setNewExMuscle] = useState("chest");
  const [newExEquip, setNewExEquip] = useState("barbell");
  const [showTemplates, setShowTemplates] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState(null);

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

  async function adoptTemplate(template) {
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
    await saveProgram(program);
    setPreviewTemplate(null);
    setShowTemplates(false);
  }

  async function save() {
    if (!editing.name.trim()) return alert("Program needs a name");
    if (editing.days.length === 0) return alert("Add at least one day");
    await saveProgram(editing);
    setEditing(null);
  }

  async function handleAddCustom() {
    if (!newExName.trim()) return;
    await addCustomExercise({ name: newExName, muscle: newExMuscle, equipment: newExEquip });
    setNewExName("");
  }

  if (previewTemplate) {
    const t = previewTemplate;
    const totalExercises = t.days.reduce((a, d) => a + d.exercises.length, 0);
    return (
      <div className="fade-in">
        <div style={S.card}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#fafafa" }}>{t.name}</div>
          <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
            <span style={S.tag("#c9952d")}>{t.tags.goal}</span>
            <span style={S.tag("#525252")}>{t.tags.daysPerWeek}x/week</span>
            <span style={S.tag("#525252")}>{t.tags.level}</span>
          </div>
          <div style={{ fontSize: 12, color: "#737373", marginTop: 8, lineHeight: 1.5 }}>{t.description}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 12, textAlign: "center" }}>
            <div><div style={{ fontSize: 18, fontWeight: 800, color: "#fafafa" }}>{t.days.length}</div><div style={{ fontSize: 9, color: "#525252", textTransform: "uppercase" }}>Days</div></div>
            <div><div style={{ fontSize: 18, fontWeight: 800, color: "#fafafa" }}>{totalExercises}</div><div style={{ fontSize: 9, color: "#525252", textTransform: "uppercase" }}>Exercises</div></div>
            <div><div style={{ fontSize: 18, fontWeight: 800, color: "#c9952d" }}>{t.tags.level}</div><div style={{ fontSize: 9, color: "#525252", textTransform: "uppercase" }}>Level</div></div>
          </div>
        </div>
        {t.days.map((day, di) => (
          <div key={di} style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fafafa" }}>{day.label}</div>
                {day.subtitle && <div style={{ fontSize: 10, color: "#737373", marginTop: 1 }}>{day.subtitle}</div>}
              </div>
              <span style={{ fontSize: 10, color: "#525252" }}>{day.exercises.length} exercises</span>
            </div>
            {day.exercises.map((ex, ei) => (
              <div key={ei} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
                <span style={{ fontSize: 11, color: "#d4d4d4" }}>{ex.name}</span>
                <span style={{ fontSize: 11, color: "#525252" }}>{ex.defaultSets}×{ex.targetReps}</span>
              </div>
            ))}
          </div>
        ))}
        <div style={{ padding: "8px 16px 20px", display: "flex", gap: 8 }}>
          <button onClick={() => setPreviewTemplate(null)} style={{ ...S.btn("ghost"), flex: 1 }}>Back</button>
          <button onClick={() => adoptTemplate(t)} style={{ ...S.btn("primary"), flex: 2 }}>Add to My Programs</button>
        </div>
      </div>
    );
  }

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
      Share with all users
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

  return (
    <div className="fade-in">
    <div style={{ padding: "4px 16px 0" }}><div style={S.label}>Your Programs</div></div>
    {programs.filter(p => p.user_id === user.id).map(p => (
        <div key={p.id} onClick={() => editProgram(p)} style={{ ...S.card, cursor: "pointer" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fafafa" }}>{p.name}</div>
              {p.description && <div style={{ fontSize: 11, color: "#737373", marginTop: 2 }}>{p.description}</div>}
            <div style={{ fontSize: 10, color: "#525252", marginTop: 4 }}>{p.days?.length || 0} days · {p.shared ? "Shared" : "Private"}</div>
          </div>
          <span style={{ color: "#525252", fontSize: 18 }}>→</span>
        </div>
      </div>
    ))}
      {programs.filter(p => p.user_id !== user.id && p.shared).length > 0 && (
        <>
          <div style={{ padding: "12px 16px 0" }}><div style={S.label}>Shared Programs</div></div>
          {programs.filter(p => p.user_id !== user.id && p.shared).map(p => (
            <div key={p.id} style={S.card}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fafafa" }}>{p.name}</div>
              <div style={{ fontSize: 10, color: "#525252", marginTop: 2 }}>{p.days?.length || 0} days</div>
            </div>
          ))}
        </>
      )}
      <div style={{ padding: "8px 16px", display: "flex", gap: 8 }}>
        <button onClick={startNew} style={{ ...S.btn("primary"), flex: 1 }}>+ New Program</button>
        <button onClick={() => setShowTemplates(!showTemplates)} style={{ ...S.btn("ghost"), flex: 1 }}>
          {showTemplates ? "Hide" : "Browse"} Templates
        </button>
      </div>

      {/* Starter Templates */}
      {showTemplates && (
        <>
          <div style={{ padding: "8px 16px 4px" }}><div style={S.label}>Starter Templates</div></div>
          {STARTER_TEMPLATES.map((t, i) => {
            const goalColors = { strength: "#ef4444", hypertrophy: "#c9952d", general: "#22c55e" };
            return (
              <div key={i} onClick={() => setPreviewTemplate(t)} style={{ ...S.card, cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#fafafa" }}>{t.name}</div>
                    <div style={{ display: "flex", gap: 4, marginTop: 3 }}>
                      <span style={S.tag(goalColors[t.tags.goal] || "#737373")}>{t.tags.goal}</span>
                      <span style={S.tag("#525252")}>{t.tags.daysPerWeek}x</span>
                      <span style={S.tag("#525252")}>{t.tags.level}</span>
                    </div>
                  </div>
                  <span style={{ color: "#525252", fontSize: 14 }}>→</span>
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* Custom exercise creator */}
      <div style={S.card}>
        <div style={S.label}>Add Custom Exercise</div>
        <input value={newExName} onChange={e => setNewExName(e.target.value)} style={{ ...S.input, marginBottom: 6 }} placeholder="Exercise name" />
        <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
          <select value={newExMuscle} onChange={e => setNewExMuscle(e.target.value)} style={{ ...S.input, fontSize: 11, flex: 1 }}>
            {MUSCLE_GROUPS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select value={newExEquip} onChange={e => setNewExEquip(e.target.value)} style={{ ...S.input, fontSize: 11, flex: 1 }}>
            {EQUIPMENT.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
        <button onClick={handleAddCustom} disabled={!newExName.trim()} style={{ ...S.btn("ghost"), width: "100%", opacity: newExName.trim() ? 1 : 0.4 }}>Add to Library</button>
      </div>
    </div>
  );
}

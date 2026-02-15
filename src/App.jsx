import { useState, useEffect, useCallback, useRef, createContext, useContext } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { EXERCISES, SUBSTITUTIONS, MUSCLE_GROUPS, EQUIPMENT, getAllExercises, filterExercises } from "./exercises.js";

// ═══════════════════════ API ═══════════════════════

const api = {
  async get(path) { const r = await fetch(`/api${path}`); if (!r.ok) throw new Error(r.statusText); return r.json(); },
  async post(path, body) { const r = await fetch(`/api${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || r.statusText); } return r.json(); },
  async put(path, body) { const r = await fetch(`/api${path}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); if (!r.ok) throw new Error(r.statusText); return r.json(); },
  async del(path) { const r = await fetch(`/api${path}`, { method: "DELETE" }); if (!r.ok) throw new Error(r.statusText); return r.json(); },
};

// ═══════════════════════ HELPERS ═══════════════════════

const genId = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
const fmtDate = (d) => { const dt = new Date(d + "T12:00:00"); return dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }); };
const est1RM = (w, r) => { if (!w || !r) return null; if (r === 1) return w; if (r > 12) return null; return Math.round(w * (1 + r / 30)); };

const USER_COLORS = ["#c9952d", "#3b82f6", "#8b5cf6", "#ec4899", "#10b981", "#eab308", "#ef4444", "#06b6d4"];
const FEEL = [
  { v: 1, l: "Terrible", c: "#ef4444" }, { v: 2, l: "Low", c: "#f97316" },
  { v: 3, l: "Average", c: "#eab308" }, { v: 4, l: "Good", c: "#22c55e" }, { v: 5, l: "Great", c: "#10b981" },
];

// ═══════════════════════ STYLES ═══════════════════════

const S = {
  app: { fontFamily: "'JetBrains Mono','SF Mono',monospace", background: "#0a0a0a", color: "#e5e5e5", minHeight: "100dvh", maxWidth: 520, margin: "0 auto", position: "relative", paddingBottom: 72 },
  header: { padding: "16px 16px 10px", borderBottom: "1px solid #262626", background: "#0a0a0a", position: "sticky", top: 0, zIndex: 100, display: "flex", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 20, fontWeight: 800, letterSpacing: "-0.5px", color: "#fafafa", margin: 0, display: "flex", alignItems: "center", gap: 8 },
  nav: { display: "flex", gap: 2, background: "#171717", borderRadius: 8, padding: 3, position: "fixed", bottom: "max(12px,env(safe-area-inset-bottom))", left: "50%", transform: "translateX(-50%)", zIndex: 200, border: "1px solid #262626" },
  navBtn: (a) => ({ padding: "8px 12px", borderRadius: 6, border: "none", background: a ? "#c9952d" : "transparent", color: a ? "#000" : "#737373", fontSize: 10, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", letterSpacing: "0.5px", textTransform: "uppercase" }),
  card: { background: "#141414", border: "1px solid #262626", borderRadius: 10, padding: 16, margin: "8px 16px" },
  label: { fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "#737373", marginBottom: 6 },
  input: { background: "#1a1a1a", border: "1px solid #333", borderRadius: 6, padding: "8px 10px", color: "#e5e5e5", fontSize: 14, fontFamily: "inherit", width: "100%", boxSizing: "border-box", outline: "none" },
  smInput: { background: "#1a1a1a", border: "1px solid #333", borderRadius: 4, padding: "6px 4px", color: "#e5e5e5", fontSize: 13, fontFamily: "inherit", width: "100%", textAlign: "center", boxSizing: "border-box", outline: "none" },
  btn: (v = "primary") => ({ padding: "10px 18px", borderRadius: 8, border: v === "ghost" ? "1px solid #333" : "none", background: v === "primary" ? "#c9952d" : v === "danger" ? "#dc2626" : "transparent", color: v === "primary" ? "#000" : v === "danger" ? "#fff" : "#a3a3a3", fontSize: 12, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", letterSpacing: "0.5px", textTransform: "uppercase" }),
  sm: (v = "ghost") => ({ padding: "4px 8px", borderRadius: 4, border: v === "ghost" ? "1px solid #333" : "none", background: v === "primary" ? "#c9952d" : v === "danger" ? "#7f1d1d" : "transparent", color: v === "primary" ? "#000" : v === "danger" ? "#fca5a5" : "#737373", fontSize: 10, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", letterSpacing: "0.5px", textTransform: "uppercase" }),
  tag: (c = "#c9952d") => ({ display: "inline-block", padding: "3px 8px", borderRadius: 4, background: c + "20", color: c, fontSize: 10, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase" }),
  stat: { textAlign: "center" },
  statV: { fontSize: 24, fontWeight: 800, color: "#fafafa" },
  statL: { fontSize: 10, color: "#737373", letterSpacing: "1px", textTransform: "uppercase", marginTop: 2 },
  setRow: (d) => ({ display: "grid", gridTemplateColumns: "24px 1fr 1fr 1fr 32px", gap: 5, alignItems: "center", marginBottom: 4, opacity: d ? 0.5 : 1 }),
  check: (d) => ({ width: 28, height: 28, borderRadius: 6, border: d ? "none" : "1px solid #333", background: d ? "#166534" : "transparent", color: d ? "#4ade80" : "#525252", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }),
  avatar: (c, sz = 40) => ({ width: sz, height: sz, borderRadius: "50%", background: c + "25", border: `2px solid ${c}`, display: "flex", alignItems: "center", justifyContent: "center", color: c, fontWeight: 800, fontSize: sz * 0.4, cursor: "pointer", fontFamily: "inherit" }),
};

// ═══════════════════════ CONTEXT ═══════════════════════

const Ctx = createContext();
const useTalos = () => useContext(Ctx);

// ═══════════════════════ LOGIN ═══════════════════════

function Login({ onLogin }) {
  const [users, setUsers] = useState([]);
  const [mode, setMode] = useState("select"); // select | pin | create
  const [selected, setSelected] = useState(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [newName, setNewName] = useState("");
  const [newPin, setNewPin] = useState("");
  const [newColor, setNewColor] = useState(USER_COLORS[0]);
  const pinRef = useRef(null);

  useEffect(() => { api.get("/users").then(setUsers).catch(() => {}); }, []);

  async function selectUser(u) {
    setSelected(u);
    setError("");
    if (u.has_pin) { setMode("pin"); setTimeout(() => pinRef.current?.focus(), 100); }
    else { try { await api.post(`/users/${u.id}/verify`, {}); onLogin(u); } catch(e) { setError(e.message); } }
  }

  async function verifyPin() {
    try {
      await api.post(`/users/${selected.id}/verify`, { pin });
      onLogin(selected);
    } catch(e) { setError("Wrong PIN"); setPin(""); }
  }

  async function createUser() {
    if (!newName.trim()) return;
    try {
      const u = await api.post("/users", { name: newName, pin: newPin || undefined, color: newColor });
      onLogin(u);
    } catch(e) { setError(e.message); }
  }

  return (
    <div style={{ ...S.app, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100dvh", padding: 32, paddingBottom: 32 }}>
      <div style={{ fontSize: 32, fontWeight: 800, marginBottom: 4 }}><img src="/talos-icon.svg" alt="" style={{ width: 32, height: 32, verticalAlign: "middle", marginRight: 8 }} />TALOS</div>
      <div style={{ color: "#525252", fontSize: 11, marginBottom: 40, letterSpacing: "2px", textTransform: "uppercase" }}>Unyielding</div>

      {mode === "select" && (
        <div style={{ width: "100%", maxWidth: 320 }} className="fade-in">
          {users.length > 0 && <div style={S.label}>Select Profile</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
            {users.map(u => (
              <div key={u.id} onClick={() => selectUser(u)} style={{ ...S.card, margin: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={S.avatar(u.color)}>{u.name[0].toUpperCase()}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#fafafa" }}>{u.name}</div>
                </div>
                <span style={{ color: "#525252" }}>→</span>
              </div>
            ))}
          </div>
          <button onClick={() => setMode("create")} style={{ ...S.btn("ghost"), width: "100%" }}>+ New Profile</button>
        </div>
      )}

      {mode === "pin" && selected && (
        <div style={{ width: "100%", maxWidth: 280, textAlign: "center" }} className="fade-in">
          <div style={S.avatar(selected.color, 56)}>{selected.name[0].toUpperCase()}</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#fafafa", marginTop: 12 }}>{selected.name}</div>
          <div style={{ marginTop: 16 }}>
            <input
              ref={pinRef} type="password" inputMode="numeric" autoComplete="current-password"
              value={pin} onChange={e => { setPin(e.target.value); setError(""); }}
              onKeyDown={e => e.key === "Enter" && verifyPin()}
              style={{ ...S.input, textAlign: "center", fontSize: 24, letterSpacing: 12 }}
              placeholder="PIN"
            />
          </div>
          {error && <div style={{ color: "#ef4444", fontSize: 12, marginTop: 8 }}>{error}</div>}
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button onClick={() => { setMode("select"); setPin(""); setError(""); }} style={{ ...S.btn("ghost"), flex: 1 }}>Back</button>
            <button onClick={verifyPin} style={{ ...S.btn("primary"), flex: 1 }}>Enter</button>
          </div>
        </div>
      )}

      {mode === "create" && (
        <div style={{ width: "100%", maxWidth: 320 }} className="fade-in">
          <div style={S.label}>Create Profile</div>
          <div style={{ ...S.card, margin: "8px 0" }}>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: "#525252", marginBottom: 4, textTransform: "uppercase" }}>Name</div>
              <input value={newName} onChange={e => setNewName(e.target.value)} style={S.input} placeholder="Your name" autoFocus />
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: "#525252", marginBottom: 4, textTransform: "uppercase" }}>PIN (optional)</div>
              <input type="password" inputMode="numeric" autoComplete="new-password" value={newPin} onChange={e => setNewPin(e.target.value)} style={S.input} placeholder="4-6 digits" />
            </div>
            <div>
              <div style={{ fontSize: 10, color: "#525252", marginBottom: 4, textTransform: "uppercase" }}>Color</div>
              <div style={{ display: "flex", gap: 8 }}>
                {USER_COLORS.map(c => (
                  <div key={c} onClick={() => setNewColor(c)} style={{ width: 28, height: 28, borderRadius: "50%", background: c, cursor: "pointer", border: newColor === c ? "3px solid #fff" : "3px solid transparent" }} />
                ))}
              </div>
            </div>
          </div>
          {error && <div style={{ color: "#ef4444", fontSize: 12, marginTop: 8 }}>{error}</div>}
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button onClick={() => setMode("select")} style={{ ...S.btn("ghost"), flex: 1 }}>Back</button>
            <button onClick={createUser} style={{ ...S.btn("primary"), flex: 1 }}>Create</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════ EXERCISE PICKER MODAL ═══════════════════════

function ExercisePicker({ onSelect, onClose, customExercises }) {
  const [search, setSearch] = useState("");
  const [muscleFilter, setMuscleFilter] = useState("");
  const [equipFilter, setEquipFilter] = useState("");
  const allExercises = getAllExercises(customExercises);
  const filtered = filterExercises(allExercises, { muscle: muscleFilter || undefined, equipment: equipFilter || undefined, search: search || undefined });

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 300, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "16px 16px 8px", background: "#0a0a0a", borderBottom: "1px solid #262626" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#fafafa" }}>Exercise Library</div>
          <button onClick={onClose} style={S.sm()}>✕ Close</button>
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)} style={{ ...S.input, marginBottom: 8 }} placeholder="Search exercises..." autoFocus />
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 4 }}>
          <button onClick={() => setMuscleFilter("")} style={S.sm(!muscleFilter ? "primary" : "ghost")}>All</button>
          {MUSCLE_GROUPS.map(m => (
            <button key={m} onClick={() => setMuscleFilter(m === muscleFilter ? "" : m)} style={S.sm(m === muscleFilter ? "primary" : "ghost")}>{m}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {EQUIPMENT.map(e => (
            <button key={e} onClick={() => setEquipFilter(e === equipFilter ? "" : e)} style={S.sm(e === equipFilter ? "primary" : "ghost")}>{e}</button>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: "8px 16px" }}>
        {filtered.map((ex, i) => (
          <div key={i} onClick={() => { onSelect(ex); onClose(); }}
            style={{ padding: "10px 12px", borderBottom: "1px solid #1a1a1a", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 13, color: "#e5e5e5", fontWeight: 500 }}>{ex.name}</div>
              <div style={{ fontSize: 10, color: "#525252" }}>{ex.muscle} · {ex.equipment} · {ex.type}</div>
            </div>
            <span style={{ color: "#525252" }}>+</span>
          </div>
        ))}
        {filtered.length === 0 && <div style={{ padding: 20, textAlign: "center", color: "#525252", fontSize: 12 }}>No exercises found</div>}
      </div>
    </div>
  );
}

// ═══════════════════════ REST TIMER ═══════════════════════

function RestTimer({ seconds, onDone, onCancel }) {
  const [remaining, setRemaining] = useState(seconds);
  useEffect(() => {
    if (remaining <= 0) { try { navigator.vibrate?.([200, 100, 200]); } catch(e) {} onDone(); return; }
    const t = setTimeout(() => setRemaining(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining, onDone]);

  const pct = ((seconds - remaining) / seconds) * 100;
  const min = Math.floor(remaining / 60);
  const sec = remaining % 60;

  return (
    <div style={{ ...S.card, margin: "8px 16px", background: "#0f1612", borderColor: "#1a3a25", textAlign: "center" }}>
      <div style={{ fontSize: 10, color: "#4ade80", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 8 }}>Rest Timer</div>
      <div style={{ fontSize: 36, fontWeight: 800, color: "#fafafa", fontVariantNumeric: "tabular-nums" }}>
        {min}:{sec.toString().padStart(2, "0")}
      </div>
      <div style={{ height: 4, background: "#1a1a1a", borderRadius: 2, margin: "10px 0", overflow: "hidden" }}>
        <div style={{ height: "100%", background: "#4ade80", borderRadius: 2, width: `${pct}%`, transition: "width 1s linear" }} />
      </div>
      <button onClick={onCancel} style={S.sm()}>Skip</button>
    </div>
  );
}

// ═══════════════════════ TRAIN PAGE ═══════════════════════

function TrainPage({ onStartWorkout }) {
  const { workouts, programs, profile, setActiveProgramId } = useTalos();
  const [showProgramPicker, setShowProgramPicker] = useState(false);
  const totalVol = workouts.reduce((a, w) => a + (w.exercises?.reduce((b, e) => b + (e.sets?.reduce((c, s) => c + ((s.weight || 0) * (s.reps || 0)), 0) || 0), 0) || 0), 0);

  // Resolve active program: explicit > last workout's program > first program
  const activeProg = programs.find(p => p.id === profile.activeProgramId)
    || (() => {
      const last = workouts.length > 0 ? workouts[workouts.length - 1] : null;
      return last?.program_id ? programs.find(p => p.id === last.program_id) : null;
    })()
    || programs[0]
    || null;

  // Determine next day from last workout within the active program
  const lastInProg = activeProg ? [...workouts].reverse().find(w => w.program_id === activeProg.id) : null;
  let nextDayIdx = 0;
  if (activeProg && lastInProg?.day_id) {
    const idx = activeProg.days.findIndex(d => d.id === lastInProg.day_id);
    if (idx >= 0) nextDayIdx = (idx + 1) % activeProg.days.length;
  }

  // Last workout date for each day
  const dayLastDate = {};
  if (activeProg) {
    activeProg.days.forEach(d => {
      const last = [...workouts].reverse().find(w => w.day_id === d.id);
      if (last) dayLastDate[d.id] = last.date;
    });
  }

  function switchProgram(progId) {
    setActiveProgramId(progId);
    setShowProgramPicker(false);
  }

  return (
    <div className="fade-in">
      <div style={{ ...S.card, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <div style={S.stat}><div style={S.statV}>{workouts.length}</div><div style={S.statL}>Workouts</div></div>
        <div style={S.stat}><div style={S.statV}>{profile.weight || "—"}</div><div style={S.statL}>Weight</div></div>
        <div style={S.stat}><div style={S.statV}>{Math.round(totalVol / 1000)}k</div><div style={S.statL}>Total Vol</div></div>
      </div>

      {programs.length === 0 && (
        <div style={{ ...S.card, textAlign: "center" }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}><img src="/talos-icon.svg" alt="" style={{ width: 28, height: 28 }} /></div>
          <div style={{ color: "#fafafa", fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Welcome to TALOS</div>
          <div style={{ color: "#525252", fontSize: 12, lineHeight: 1.5 }}>Create a program in the <span style={{ color: "#c9952d" }}>Prog</span> tab to get started, or hit Blank Workout below to jump right in.</div>
        </div>
      )}

      {/* Active Program Header */}
      {activeProg && (
        <div style={{ padding: "12px 16px 0" }}>
          <div onClick={() => programs.length > 1 && setShowProgramPicker(!showProgramPicker)}
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: programs.length > 1 ? "pointer" : "default" }}>
            <div>
              <div style={S.label}>Active Program</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#fafafa", marginTop: 2 }}>{activeProg.name}</div>
            </div>
            {programs.length > 1 && (
              <span style={{ color: "#737373", fontSize: 10, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", padding: "4px 8px", border: "1px solid #333", borderRadius: 4 }}>
                Switch {showProgramPicker ? "▲" : "▼"}
              </span>
            )}
          </div>

          {/* Program picker dropdown */}
          {showProgramPicker && (
            <div style={{ marginTop: 8, background: "#1a1a1a", border: "1px solid #333", borderRadius: 8, overflow: "hidden" }}>
              {programs.filter(p => p.id !== activeProg.id).map(p => (
                <div key={p.id} onClick={() => switchProgram(p.id)}
                  style={{ padding: "10px 12px", cursor: "pointer", borderBottom: "1px solid #262626", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#d4d4d4" }}>{p.name}</div>
                    <div style={{ fontSize: 10, color: "#525252", marginTop: 2 }}>{p.days?.length || 0} days</div>
                  </div>
                  <span style={{ color: "#525252", fontSize: 14 }}>→</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Active program days */}
      {activeProg?.days?.map((day, i) => (
        <div key={day.id} onClick={() => onStartWorkout(activeProg, day)}
          style={{ ...S.card, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", borderColor: i === nextDayIdx ? "#c9952d" : "#262626" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#fafafa" }}>{day.label}</div>
            {day.subtitle && <div style={{ fontSize: 11, color: "#737373", marginTop: 2 }}>{day.subtitle}</div>}
            <div style={{ fontSize: 10, color: "#525252", marginTop: 2 }}>
              {day.exercises?.length || 0} exercises{dayLastDate[day.id] ? ` · Last: ${fmtDate(dayLastDate[day.id])}` : ""}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {i === nextDayIdx && <span style={S.tag()}>NEXT</span>}
            <span style={{ color: "#525252", fontSize: 18 }}>→</span>
          </div>
        </div>
      ))}

      <div style={{ padding: "12px 16px 4px" }}><div style={S.label}>Quick Start</div></div>
      <div onClick={() => onStartWorkout(null, null)} style={{ ...S.card, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#fafafa" }}>Blank Workout</div>
          <div style={{ fontSize: 11, color: "#737373", marginTop: 2 }}>Build as you go</div>
        </div>
        <span style={{ color: "#525252", fontSize: 18 }}>→</span>
      </div>
    </div>
  );
}

// ═══════════════════════ ACTIVE WORKOUT ═══════════════════════

function ActiveWorkout({ workout, setWorkout, onFinish, onDiscard }) {
  const { workouts, profile, customExercises, aiConfig } = useTalos();
  const [elapsed, setElapsed] = useState(0);
  const [restTimer, setRestTimer] = useState(null); // seconds remaining
  const [showPicker, setShowPicker] = useState(false);
  const [pickerTarget, setPickerTarget] = useState(null); // null = add, index = substitute
  const [subModal, setSubModal] = useState(null); // { exerciseIndex, exercise, loading, subs, error }

  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.round((Date.now() - workout.startTime) / 60000)), 10000);
    return () => clearInterval(t);
  }, [workout.startTime]);

  function getLastPerformance(name) {
    for (let i = workouts.length - 1; i >= 0; i--) {
      const ex = workouts[i].exercises?.find(e => e.name === name);
      if (ex?.sets?.length > 0) return { sets: ex.sets, date: workouts[i].date };
    }
    return null;
  }

  function updateSet(ei, si, field, val) {
    setWorkout(p => { const n = JSON.parse(JSON.stringify(p)); n.exercises[ei].sets[si][field] = val; return n; });
  }

  function toggleSet(ei, si) {
    setWorkout(p => {
      const n = JSON.parse(JSON.stringify(p));
      const was = n.exercises[ei].sets[si].completed;
      n.exercises[ei].sets[si].completed = !was;
      return n;
    });
    // Start rest timer when completing a set
    if (!workout.exercises[ei].sets[si].completed) {
      const ex = workout.exercises[ei];
      const isCompound = EXERCISES.find(e => e.name === ex.name)?.type === "compound";
      const secs = isCompound ? (profile.restTimerCompound || 150) : (profile.restTimerIsolation || 90);
      setRestTimer(secs);
    }
  }

  function addSet(ei) {
    setWorkout(p => { const n = JSON.parse(JSON.stringify(p)); const ls = n.exercises[ei].sets.at(-1); n.exercises[ei].sets.push({ weight: ls?.weight || "", reps: ls?.reps || "", rpe: "", completed: false }); return n; });
  }
  function removeSet(ei) {
    setWorkout(p => { const n = JSON.parse(JSON.stringify(p)); if (n.exercises[ei].sets.length > 1) n.exercises[ei].sets.pop(); return n; });
  }
  function removeExercise(ei) {
    setWorkout(p => { const n = JSON.parse(JSON.stringify(p)); n.exercises.splice(ei, 1); return n; });
  }
  function moveExercise(ei, dir) {
    setWorkout(p => {
      const n = JSON.parse(JSON.stringify(p));
      const target = ei + dir;
      if (target < 0 || target >= n.exercises.length) return p;
      [n.exercises[ei], n.exercises[target]] = [n.exercises[target], n.exercises[ei]];
      return n;
    });
  }

  function addExerciseFromPicker(ex) {
    const last = getLastPerformance(ex.name);
    if (pickerTarget !== null) {
      // Substitute
      setWorkout(p => {
        const n = JSON.parse(JSON.stringify(p));
        const old = n.exercises[pickerTarget].name;
        n.exercises[pickerTarget].name = ex.name;
        n.exercises[pickerTarget].notes = `(subbed for ${old})`;
        return n;
      });
    } else {
      // Add new
      setWorkout(p => {
        const n = JSON.parse(JSON.stringify(p));
        n.exercises.push({
          name: ex.name,
          sets: [{ weight: last?.sets?.[0]?.weight || "", reps: "", rpe: "", completed: false }, { weight: last?.sets?.[1]?.weight || "", reps: "", rpe: "", completed: false }, { weight: last?.sets?.[2]?.weight || "", reps: "", rpe: "", completed: false }],
          notes: "",
        });
        return n;
      });
    }
    setPickerTarget(null);
  }

  function quickSub(ei) {
    const name = workout.exercises[ei].name;

    // If AI is available, use smart substitutions
    if (aiConfig.enabled) {
      setSubModal({ exerciseIndex: ei, exercise: name, loading: true, subs: [], error: null });

      // Build minimal context
      const age = profile.dateOfBirth ? Math.floor((Date.now() - new Date(profile.dateOfBirth + "T12:00:00").getTime()) / 31557600000) : null;
      const profileLines = [
        profile.weight ? `Weight: ${profile.weight} lbs` : null,
        profile.experienceLevel ? `Experience: ${profile.experienceLevel}` : null,
        profile.injuriesNotes ? `Injuries: ${profile.injuriesNotes}` : null,
      ].filter(Boolean).join(", ");

      // Exercises user has actually performed
      const usedExercises = [...new Set(workouts.flatMap(w => w.exercises?.map(e => e.name) || []))];
      const context = `USER: ${profileLines}\nEXERCISES USED BEFORE: ${usedExercises.slice(-30).join(", ")}\nCURRENT WORKOUT: ${workout.exercises.map(e => e.name).join(", ")}`;

      api.post("/coach/substitute", { exercise: name, reason: "Equipment unavailable or variety", context })
        .then(data => {
          setSubModal(prev => prev ? { ...prev, loading: false, subs: data.substitutions || [] } : null);
        })
        .catch(e => {
          setSubModal(prev => prev ? { ...prev, loading: false, error: e.message } : null);
        });
      return;
    }

    // Fallback: static substitutions
    const subs = SUBSTITUTIONS[name];
    if (subs?.length === 1) {
      const last = getLastPerformance(subs[0]);
      setWorkout(p => { const n = JSON.parse(JSON.stringify(p)); n.exercises[ei].name = subs[0]; n.exercises[ei].notes = `(subbed for ${name})`; return n; });
    } else {
      setPickerTarget(ei);
      setShowPicker(true);
    }
  }

  function applySub(newName) {
    if (!subModal) return;
    const ei = subModal.exerciseIndex;
    const oldName = subModal.exercise;
    const last = getLastPerformance(newName);
    setWorkout(p => {
      const n = JSON.parse(JSON.stringify(p));
      n.exercises[ei].name = newName;
      n.exercises[ei].notes = `(subbed for ${oldName})`;
      // Pre-fill with last performance if available
      if (last?.sets) {
        n.exercises[ei].sets = n.exercises[ei].sets.map((s, i) => ({
          ...s,
          weight: last.sets[i]?.weight || s.weight,
          reps: last.sets[i]?.reps || s.reps,
        }));
      }
      return n;
    });
    setSubModal(null);
  }

  // Session stats
  const completedSets = workout.exercises.reduce((a, e) => a + e.sets.filter(s => s.completed).length, 0);
  const totalSets = workout.exercises.reduce((a, e) => a + e.sets.length, 0);
  const sessionVol = workout.exercises.reduce((a, e) => a + e.sets.filter(s => s.completed).reduce((b, s) => b + ((s.weight || 0) * (s.reps || 0)), 0), 0);

  return (
    <div className="fade-in">
      {showPicker && <ExercisePicker customExercises={customExercises} onSelect={addExerciseFromPicker} onClose={() => { setShowPicker(false); setPickerTarget(null); }} />}

      {/* AI Substitution Modal */}
      {subModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ ...S.card, margin: 0, maxWidth: 340, width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#fafafa" }}>Swap: {subModal.exercise}</div>
                <div style={{ fontSize: 10, color: "#525252" }}>AI-powered substitutions</div>
              </div>
              <button onClick={() => setSubModal(null)} style={S.sm()}>✕</button>
            </div>
            {subModal.loading ? (
              <div style={{ padding: 20, textAlign: "center", color: "#c9952d", fontSize: 12 }}>Finding alternatives...</div>
            ) : subModal.error ? (
              <div style={{ padding: 12, color: "#ef4444", fontSize: 12 }}>{subModal.error}</div>
            ) : subModal.subs.length === 0 ? (
              <div style={{ padding: 12, color: "#737373", fontSize: 12 }}>No substitutions found. Try the exercise picker instead.</div>
            ) : (
              <div>
                {subModal.subs.map((sub, i) => {
                  const last = getLastPerformance(sub.name);
                  return (
                    <div key={i} onClick={() => applySub(sub.name)} style={{ padding: "10px 8px", borderBottom: "1px solid #262626", cursor: "pointer", borderRadius: 6, transition: "background 0.15s" }}
                      onMouseOver={e => e.currentTarget.style.background = "#1a1a1a"} onMouseOut={e => e.currentTarget.style.background = "transparent"}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#fafafa" }}>{sub.name}</div>
                        <div style={{ display: "flex", gap: 2 }}>
                          {[1,2,3,4,5].map(n => <span key={n} style={{ fontSize: 8, color: n <= sub.rating ? "#c9952d" : "#333" }}>●</span>)}
                        </div>
                      </div>
                      <div style={{ fontSize: 10, color: "#737373", marginTop: 2 }}>{sub.reason}</div>
                      {last && <div style={{ fontSize: 10, color: "#525252", marginTop: 2 }}>Last: {last.sets.map(s => `${s.weight}×${s.reps}`).join(", ")}</div>}
                    </div>
                  );
                })}
              </div>
            )}
            <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
              <button onClick={() => { setSubModal(null); setPickerTarget(subModal.exerciseIndex); setShowPicker(true); }} style={{ ...S.btn("ghost"), flex: 1, fontSize: 11 }}>Browse All</button>
              <button onClick={() => setSubModal(null)} style={{ ...S.btn("ghost"), flex: 1, fontSize: 11 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Header card */}
      <div style={{ ...S.card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <span style={S.tag()}>{workout.dayLabel || "Workout"}</span>
          <div style={{ fontSize: 11, color: "#737373", marginTop: 6 }}>{fmtDate(workout.date)}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#fafafa" }}>{elapsed}m</div>
          <div style={{ fontSize: 10, color: "#525252" }}>{completedSets}/{totalSets} sets · {Math.round(sessionVol / 1000)}k lbs</div>
        </div>
      </div>

      {/* Feel */}
      <div style={S.card}>
        <div style={S.label}>How do you feel?</div>
        <div style={{ display: "flex", gap: 5 }}>
          {FEEL.map(f => (
            <button key={f.v} onClick={() => setWorkout(p => ({ ...p, feel: f.v }))}
              style={{ flex: 1, padding: "5px 2px", borderRadius: 6, border: workout.feel === f.v ? `2px solid ${f.c}` : "1px solid #333", background: workout.feel === f.v ? f.c + "20" : "transparent", color: workout.feel === f.v ? f.c : "#525252", fontSize: 9, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", textTransform: "uppercase" }}>
              {f.l}
            </button>
          ))}
        </div>
      </div>

      {/* Rest timer */}
      {restTimer && <RestTimer seconds={restTimer} onDone={() => setRestTimer(null)} onCancel={() => setRestTimer(null)} />}

      {/* Exercises */}
      {workout.exercises.map((ex, ei) => {
        const last = getLastPerformance(ex.name);
        const hasSub = aiConfig.enabled || SUBSTITUTIONS[ex.name];
        return (
          <div key={ei} style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fafafa" }}>{ex.name}{ex.targetReps && <span style={{ fontSize: 10, fontWeight: 400, color: "#737373", marginLeft: 6 }}>Target: {ex.targetReps}</span>}</div>
                {last && <div style={{ fontSize: 10, color: "#525252", marginTop: 2 }}>Last: {last.sets.map(s => `${s.weight}×${s.reps}`).join(", ")}</div>}
                {ex.notes && <div style={{ fontSize: 10, color: "#c9952d", marginTop: 2 }}>{ex.notes}</div>}
              </div>
              <div style={{ display: "flex", gap: 3, flexShrink: 0 }}>
                {ei > 0 && <button onClick={() => moveExercise(ei, -1)} style={S.sm()} title="Move up">↑</button>}
                {ei < workout.exercises.length - 1 && <button onClick={() => moveExercise(ei, 1)} style={S.sm()} title="Move down">↓</button>}
                {hasSub && <button onClick={() => quickSub(ei)} style={S.sm()} title="Substitute">↔</button>}
                <button onClick={() => removeExercise(ei)} style={S.sm("danger")}>✕</button>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "24px 1fr 1fr 1fr 32px", gap: 5, marginBottom: 4 }}>
              {["Set", "Lbs", "Reps", "RPE", ""].map((h, i) => <div key={i} style={{ fontSize: 9, color: "#525252", textAlign: "center", textTransform: "uppercase" }}>{h}</div>)}
            </div>
            {ex.sets.map((set, si) => (
              <div key={si} style={S.setRow(set.completed)}>
                <div style={{ fontSize: 10, color: "#525252", fontWeight: 700, textAlign: "center" }}>{si + 1}</div>
                <input type="number" inputMode="decimal" value={set.weight} onChange={e => updateSet(ei, si, "weight", e.target.value ? Number(e.target.value) : "")} style={S.smInput} placeholder="—" />
                <input type="number" inputMode="numeric" value={set.reps} onChange={e => updateSet(ei, si, "reps", e.target.value ? Number(e.target.value) : "")} style={S.smInput} placeholder="—" />
                <input type="number" inputMode="decimal" value={set.rpe} onChange={e => updateSet(ei, si, "rpe", e.target.value ? Number(e.target.value) : "")} style={S.smInput} placeholder="—" />
                <button onClick={() => toggleSet(ei, si)} style={S.check(set.completed)}>{set.completed ? "✓" : ""}</button>
              </div>
            ))}
            <div style={{ display: "flex", gap: 5, marginTop: 6 }}>
              <button onClick={() => addSet(ei)} style={S.sm()}>+ Set</button>
              {ex.sets.length > 1 && <button onClick={() => removeSet(ei)} style={S.sm()}>− Set</button>}
            </div>
          </div>
        );
      })}

      <div style={{ padding: "4px 16px", display: "flex", gap: 8 }}>
        <button onClick={() => { setPickerTarget(null); setShowPicker(true); }} style={{ ...S.btn("ghost"), flex: 1 }}>+ Add Exercise</button>
      </div>

      <div style={S.card}>
        <div style={S.label}>Session Notes</div>
        <textarea value={workout.notes} onChange={e => setWorkout(p => ({ ...p, notes: e.target.value }))} style={{ ...S.input, minHeight: 50, resize: "vertical" }} placeholder="How'd it go?" />
      </div>

      <div style={{ padding: "8px 16px 20px", display: "flex", gap: 8 }}>
        <button onClick={onDiscard} style={{ ...S.btn("ghost"), flex: 1 }}>Discard</button>
        <button onClick={onFinish} style={{ ...S.btn("primary"), flex: 2 }}>Finish Workout</button>
      </div>
    </div>
  );
}

// ═══════════════════════ HISTORY ═══════════════════════

// Color mapping for workout types
const DAY_COLORS = {
  push: "#c9952d",
  pull: "#3b82f6",
  leg: "#10b981",
  legs: "#10b981",
};
function getDayColor(label) {
  if (!label) return "#737373";
  const l = label.toLowerCase();
  for (const [key, color] of Object.entries(DAY_COLORS)) {
    if (l.includes(key)) return color;
  }
  return "#8b5cf6";
}

function HistoryPage() {
  const { workouts, programs, deleteWorkout } = useTalos();
  const [expanded, setExpanded] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [filterProgram, setFilterProgram] = useState("all");
  const [filterDay, setFilterDay] = useState("all");

  // Calendar state
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());

  // Build workout lookup by date
  const workoutsByDate = {};
  workouts.forEach(w => {
    if (!workoutsByDate[w.date]) workoutsByDate[w.date] = [];
    workoutsByDate[w.date].push(w);
  });

  // Calendar helpers
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDow = new Date(calYear, calMonth, 1).getDay(); // 0=Sun
  const monthLabel = new Date(calYear, calMonth).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  function prevMonth() {
    if (calMonth === 0) { setCalYear(calYear - 1); setCalMonth(11); }
    else setCalMonth(calMonth - 1);
    setSelectedDate(null);
  }
  function nextMonth() {
    if (calMonth === 11) { setCalYear(calYear + 1); setCalMonth(0); }
    else setCalMonth(calMonth + 1);
    setSelectedDate(null);
  }
  function goToToday() {
    setCalYear(today.getFullYear());
    setCalMonth(today.getMonth());
    setSelectedDate(null);
  }

  // Build filtered list
  let filtered = [...workouts];
  if (selectedDate) {
    filtered = filtered.filter(w => w.date === selectedDate);
  }
  if (filterProgram !== "all") {
    filtered = filtered.filter(w => w.program_id === filterProgram);
  }
  if (filterDay !== "all") {
    filtered = filtered.filter(w => w.day_id === filterDay);
  }
  filtered = filtered.reverse();

  // Days available for the selected program filter
  const filteredDays = filterProgram === "all"
    ? [...new Map(programs.flatMap(p => p.days?.map(d => [d.id, d]) || [])).values()]
    : (programs.find(p => p.id === filterProgram)?.days || []);

  // Stats for the visible month
  const monthWorkouts = workouts.filter(w => {
    const d = new Date(w.date + "T12:00:00");
    return d.getFullYear() === calYear && d.getMonth() === calMonth;
  });
  const monthVol = monthWorkouts.reduce((a, w) => a + (w.exercises?.reduce((b, e) => b + (e.sets?.reduce((c, s) => c + ((s.weight || 0) * (s.reps || 0)), 0) || 0), 0) || 0), 0);

  return (
    <div className="fade-in">
      {/* Calendar */}
      <div style={S.card}>
        {/* Month nav */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <button onClick={prevMonth} style={{ ...S.sm(), padding: "6px 10px" }}>◀</button>
          <div onClick={goToToday} style={{ cursor: "pointer", textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#fafafa" }}>{monthLabel}</div>
            <div style={{ fontSize: 10, color: "#525252", marginTop: 2 }}>{monthWorkouts.length} sessions · {monthVol >= 1000 ? `${Math.round(monthVol / 1000)}k` : monthVol} lbs</div>
          </div>
          <button onClick={nextMonth} style={{ ...S.sm(), padding: "6px 10px" }}>▶</button>
        </div>

        {/* Day-of-week headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div key={i} style={{ textAlign: "center", fontSize: 9, color: "#525252", fontWeight: 700, padding: "2px 0" }}>{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
          {/* Empty cells for offset */}
          {Array.from({ length: firstDow }).map((_, i) => <div key={`e${i}`} />)}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
            const dayWorkouts = workoutsByDate[dateStr] || [];
            const isToday = dateStr === today.toISOString().split("T")[0];
            const isSelected = dateStr === selectedDate;
            const hasFuture = new Date(dateStr + "T12:00:00") > today;

            return (
              <div key={dayNum} onClick={() => {
                if (dayWorkouts.length > 0) setSelectedDate(isSelected ? null : dateStr);
              }}
                style={{
                  textAlign: "center", padding: "6px 2px", borderRadius: 6, cursor: dayWorkouts.length > 0 ? "pointer" : "default",
                  background: isSelected ? "#262626" : "transparent",
                  border: isToday ? "1px solid #c9952d" : "1px solid transparent",
                  opacity: hasFuture ? 0.3 : 1,
                  minHeight: 36, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3,
                }}>
                <div style={{ fontSize: 11, color: isToday ? "#c9952d" : dayWorkouts.length > 0 ? "#fafafa" : "#404040", fontWeight: isToday || dayWorkouts.length > 0 ? 700 : 400 }}>
                  {dayNum}
                </div>
                {dayWorkouts.length > 0 && (
                  <div style={{ display: "flex", gap: 2, justifyContent: "center" }}>
                    {dayWorkouts.slice(0, 3).map((w, wi) => (
                      <div key={wi} style={{ width: 5, height: 5, borderRadius: "50%", background: getDayColor(w.day_label) }} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 10, flexWrap: "wrap" }}>
          {Object.entries(DAY_COLORS).filter(([k]) => k !== "legs").map(([label, color]) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
              <span style={{ fontSize: 9, color: "#525252", textTransform: "capitalize" }}>{label}</span>
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#8b5cf6" }} />
            <span style={{ fontSize: 9, color: "#525252" }}>Other</span>
          </div>
        </div>
      </div>

      {/* Selected date detail */}
      {selectedDate && workoutsByDate[selectedDate] && (
        <div style={{ padding: "4px 16px 0" }}>
          <div style={S.label}>{fmtDate(selectedDate)}</div>
        </div>
      )}

      {/* Filters (when no date selected) */}
      {!selectedDate && (
        <div style={{ padding: "4px 16px 8px", display: "flex", gap: 6 }}>
          <select value={filterProgram} onChange={e => { setFilterProgram(e.target.value); setFilterDay("all"); }}
            style={{ ...S.sm(), padding: "4px 6px", background: "#1a1a1a", color: "#a3a3a3", border: "1px solid #333", borderRadius: 4, fontSize: 10, fontFamily: "inherit" }}>
            <option value="all">All Programs</option>
            {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          {filteredDays.length > 0 && (
            <select value={filterDay} onChange={e => setFilterDay(e.target.value)}
              style={{ ...S.sm(), padding: "4px 6px", background: "#1a1a1a", color: "#a3a3a3", border: "1px solid #333", borderRadius: 4, fontSize: 10, fontFamily: "inherit" }}>
              <option value="all">All Days</option>
              {filteredDays.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
            </select>
          )}
          {(filterProgram !== "all" || filterDay !== "all") && (
            <button onClick={() => { setFilterProgram("all"); setFilterDay("all"); }} style={S.sm()}>Clear</button>
          )}
        </div>
      )}

      {/* Workout list */}
      {filtered.length === 0 && <div style={{ padding: 32, textAlign: "center", color: "#525252", fontSize: 13 }}>{selectedDate ? "No workouts this day." : "No workouts yet."}</div>}
      {filtered.map(w => {
        const isExp = expanded === w.id;
        const vol = w.exercises?.reduce((a, e) => a + (e.sets?.reduce((b, s) => b + ((s.weight || 0) * (s.reps || 0)), 0) || 0), 0) || 0;
        const sets = w.exercises?.reduce((a, e) => a + (e.sets?.length || 0), 0) || 0;
        return (
          <div key={w.id} style={{ ...S.card, borderLeft: `3px solid ${getDayColor(w.day_label)}` }}>
            <div onClick={() => setExpanded(isExp ? null : w.id)} style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#fafafa" }}>{w.day_label || "Workout"}</span>
                  <span style={S.tag(FEEL[w.feel - 1]?.c || "#737373")}>{FEEL[w.feel - 1]?.l || "—"}</span>
                </div>
                <div style={{ fontSize: 11, color: "#525252", marginTop: 3 }}>
                  {selectedDate ? (w.duration ? `${w.duration}min` : "") : fmtDate(w.date)}
                  {!selectedDate && w.duration ? ` · ${w.duration}min` : ""}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: "#a3a3a3" }}>{sets} sets</div>
                <div style={{ fontSize: 10, color: "#525252" }}>{vol >= 1000 ? `${Math.round(vol / 1000)}k` : vol.toLocaleString()} lbs</div>
              </div>
            </div>
            {isExp && (
              <div style={{ marginTop: 12, borderTop: "1px solid #262626", paddingTop: 12 }}>
                {w.exercises?.map((ex, i) => (
                  <div key={i} style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#d4d4d4" }}>{ex.name}</div>
                    <div style={{ fontSize: 11, color: "#737373", marginTop: 2 }}>{ex.sets?.map(s => `${s.weight}×${s.reps}${s.rpe ? ` @${s.rpe}` : ""}`).join("  ·  ")}</div>
                    {ex.notes && <div style={{ fontSize: 10, color: "#c9952d", marginTop: 1 }}>{ex.notes}</div>}
                  </div>
                ))}
                {w.notes && <div style={{ fontSize: 11, color: "#737373", marginTop: 8, fontStyle: "italic" }}>{w.notes}</div>}
                {w.duration && <div style={{ fontSize: 10, color: "#525252", marginTop: 6 }}>Duration: {w.duration}min</div>}
                <button onClick={() => deleteWorkout(w.id)} style={{ ...S.sm("danger"), marginTop: 8 }}>Delete</button>
              </div>
            )}
          </div>
        );
      })}

      {/* Back to all button when date is selected */}
      {selectedDate && (
        <div style={{ padding: "8px 16px" }}>
          <button onClick={() => setSelectedDate(null)} style={{ ...S.btn("ghost"), display: "block", width: "100%", textAlign: "center" }}>
            Show All History
          </button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════ STATS ═══════════════════════

function StatsPage() {
  const { workouts, profile, updateProfile, user } = useTalos();
  const [editing, setEditing] = useState(false);
  const [tmp, setTmp] = useState({});
  const [chartExercise, setChartExercise] = useState("Bench Press");

  // PRs
  const prs = {};
  workouts.forEach(w => w.exercises?.forEach(ex => ex.sets?.forEach(s => {
    if (!s.weight || !s.reps) return;
    const e = est1RM(s.weight, s.reps);
    if (!prs[ex.name] || (e && e > (prs[ex.name].e1rm || 0))) prs[ex.name] = { weight: s.weight, reps: s.reps, e1rm: e, date: w.date };
  })));
  const prList = Object.entries(prs).sort((a, b) => (b[1].e1rm || 0) - (a[1].e1rm || 0));

  // Streaks
  const dates = [...new Set(workouts.map(w => w.date))].sort();
  let streak = 0, maxStreak = 0, tempStreak = 0;
  const today = new Date().toISOString().split("T")[0];
  for (let i = dates.length - 1; i >= 0; i--) {
    const d = new Date(dates[i] + "T12:00:00");
    const prev = i < dates.length - 1 ? new Date(dates[i + 1] + "T12:00:00") : new Date(today + "T12:00:00");
    const gap = Math.round((prev - d) / 86400000);
    if (gap <= 3) { streak++; } else break;
  }
  // Max streak
  tempStreak = 1;
  for (let i = 1; i < dates.length; i++) {
    const gap = Math.round((new Date(dates[i] + "T12:00:00") - new Date(dates[i - 1] + "T12:00:00")) / 86400000);
    if (gap <= 3) tempStreak++; else { maxStreak = Math.max(maxStreak, tempStreak); tempStreak = 1; }
  }
  maxStreak = Math.max(maxStreak, tempStreak);
  if (dates.length === 0) { streak = 0; maxStreak = 0; }

  // Weekly count
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  const thisWeek = workouts.filter(w => new Date(w.date + "T12:00:00") >= weekAgo).length;

  // Chart data
  const exerciseNames = [...new Set(workouts.flatMap(w => w.exercises?.map(e => e.name) || []))].sort();
  const chartData = workouts.filter(w => w.exercises?.some(e => e.name === chartExercise)).map(w => {
    const ex = w.exercises.find(e => e.name === chartExercise);
    const best = ex?.sets?.reduce((a, s) => ((s.weight || 0) > (a.weight || 0) ? s : a), { weight: 0, reps: 0 });
    return { date: w.date.slice(5), weight: best?.weight || 0, e1rm: est1RM(best?.weight, best?.reps) || 0 };
  });

  // Body weight chart
  const bwData = profile.bioHistory?.map(h => ({ date: h.date.slice(5), weight: h.weight })) || [];

  const bigLifts = ["Bench Press", "Conventional Deadlift", "Back Squat", "Overhead Press", "Barbell Row"];

  return (
    <div className="fade-in">
      {/* Streaks */}
      <div style={{ ...S.card, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <div style={S.stat}><div style={S.statV}>{streak}</div><div style={S.statL}>Streak</div></div>
        <div style={S.stat}><div style={S.statV}>{maxStreak}</div><div style={S.statL}>Best Streak</div></div>
        <div style={S.stat}><div style={S.statV}>{thisWeek}</div><div style={S.statL}>This Week</div></div>
      </div>

      {/* Bio */}
      <div style={S.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={S.label}>Bio Stats</div>
          <button onClick={() => { setEditing(!editing); setTmp({ ...profile }); }} style={S.sm()}>{editing ? "Cancel" : "Edit"}</button>
        </div>
        {editing ? (
          <div>
            {/* Row 1: Core biometrics */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
              {[["Weight", "weight", "number"], ["BF %", "bodyFat", "number"], ["Height", "height", "text"]].map(([l, k, t]) => (
                <div key={k}>
                  <div style={{ fontSize: 9, color: "#525252", marginBottom: 3, textTransform: "uppercase" }}>{l}</div>
                  <input type={t} inputMode={t === "number" ? "decimal" : undefined} value={tmp[k] || ""} onChange={e => setTmp(p => ({ ...p, [k]: t === "number" ? Number(e.target.value) : e.target.value }))} style={S.smInput} />
                </div>
              ))}
            </div>
            {/* Row 2: Sex, DOB, Target Weight */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 9, color: "#525252", marginBottom: 3, textTransform: "uppercase" }}>Sex</div>
                <select value={tmp.sex || ""} onChange={e => setTmp(p => ({ ...p, sex: e.target.value }))} style={{ ...S.smInput, textAlign: "left", padding: "6px 4px" }}>
                  <option value="">—</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div>
                <div style={{ fontSize: 9, color: "#525252", marginBottom: 3, textTransform: "uppercase" }}>DOB</div>
                <input type="date" value={tmp.dateOfBirth || ""} onChange={e => setTmp(p => ({ ...p, dateOfBirth: e.target.value }))} style={{ ...S.smInput, textAlign: "left", padding: "4px 4px", fontSize: 11 }} />
              </div>
              <div>
                <div style={{ fontSize: 9, color: "#525252", marginBottom: 3, textTransform: "uppercase" }}>Target Wt</div>
                <input type="number" inputMode="decimal" value={tmp.targetWeight || ""} onChange={e => setTmp(p => ({ ...p, targetWeight: Number(e.target.value) }))} style={S.smInput} placeholder="lbs" />
              </div>
            </div>
            {/* Row 3: Goal, Experience, Intensity */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 9, color: "#525252", marginBottom: 3, textTransform: "uppercase" }}>Goal</div>
                <select value={tmp.goal || ""} onChange={e => setTmp(p => ({ ...p, goal: e.target.value }))} style={{ ...S.smInput, textAlign: "left", padding: "6px 4px" }}>
                  <option value="">—</option>
                  <option value="bulk">Bulk</option>
                  <option value="cut">Cut</option>
                  <option value="recomp">Recomp</option>
                  <option value="maintain">Maintain</option>
                  <option value="strength">Strength</option>
                </select>
              </div>
              <div>
                <div style={{ fontSize: 9, color: "#525252", marginBottom: 3, textTransform: "uppercase" }}>Experience</div>
                <select value={tmp.experienceLevel || ""} onChange={e => setTmp(p => ({ ...p, experienceLevel: e.target.value }))} style={{ ...S.smInput, textAlign: "left", padding: "6px 4px" }}>
                  <option value="">—</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div>
                <div style={{ fontSize: 9, color: "#525252", marginBottom: 3, textTransform: "uppercase" }}>Intensity</div>
                <select value={tmp.trainingIntensity || ""} onChange={e => setTmp(p => ({ ...p, trainingIntensity: e.target.value }))} style={{ ...S.smInput, textAlign: "left", padding: "6px 4px" }}>
                  <option value="">—</option>
                  <option value="low">Low</option>
                  <option value="moderate">Moderate</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            {/* Row 4: Nutrition targets */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 9, color: "#525252", marginBottom: 3, textTransform: "uppercase" }}>Calorie Target</div>
                <input type="number" inputMode="numeric" value={tmp.caloriesTarget || ""} onChange={e => setTmp(p => ({ ...p, caloriesTarget: Number(e.target.value) }))} style={S.smInput} placeholder="kcal/day" />
              </div>
              <div>
                <div style={{ fontSize: 9, color: "#525252", marginBottom: 3, textTransform: "uppercase" }}>Protein Target</div>
                <input type="number" inputMode="numeric" value={tmp.proteinTarget || ""} onChange={e => setTmp(p => ({ ...p, proteinTarget: Number(e.target.value) }))} style={S.smInput} placeholder="g/day" />
              </div>
            </div>
            {/* Target PRs */}
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 9, color: "#525252", marginBottom: 3, textTransform: "uppercase" }}>Target PRs</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                {["Bench Press", "Back Squat", "Conventional Deadlift", "Overhead Press"].map(lift => (
                  <div key={lift} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{ fontSize: 9, color: "#737373", flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{lift.replace("Conventional ", "")}</div>
                    <input type="number" inputMode="numeric" value={tmp.targetPrs?.[lift] || ""} onChange={e => setTmp(p => ({ ...p, targetPrs: { ...(p.targetPrs || {}), [lift]: Number(e.target.value) || undefined } }))} style={{ ...S.smInput, width: 64, flex: "none" }} placeholder="lbs" />
                  </div>
                ))}
              </div>
            </div>
            {/* Injuries/Notes */}
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 9, color: "#525252", marginBottom: 3, textTransform: "uppercase" }}>Injuries / Limitations</div>
              <textarea value={tmp.injuriesNotes || ""} onChange={e => setTmp(p => ({ ...p, injuriesNotes: e.target.value }))} style={{ ...S.input, minHeight: 40, resize: "vertical", fontSize: 12 }} placeholder="Hip bursitis, bad shoulder, etc." />
            </div>
            {/* Rest timers */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 9, color: "#525252", marginBottom: 3, textTransform: "uppercase" }}>Rest — Compound (sec)</div>
                <input type="number" inputMode="numeric" value={tmp.restTimerCompound || 150} onChange={e => setTmp(p => ({ ...p, restTimerCompound: Number(e.target.value) }))} style={S.smInput} />
              </div>
              <div>
                <div style={{ fontSize: 9, color: "#525252", marginBottom: 3, textTransform: "uppercase" }}>Rest — Isolation (sec)</div>
                <input type="number" inputMode="numeric" value={tmp.restTimerIsolation || 90} onChange={e => setTmp(p => ({ ...p, restTimerIsolation: Number(e.target.value) }))} style={S.smInput} />
              </div>
            </div>
            <button onClick={() => { updateProfile(tmp); setEditing(false); }} style={S.btn("primary")}>Save</button>
          </div>
        ) : (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div style={S.stat}><div style={{ ...S.statV, fontSize: 18 }}>{profile.height || "—"}</div><div style={S.statL}>Height</div></div>
              <div style={S.stat}><div style={{ ...S.statV, fontSize: 18 }}>{profile.weight || "—"}</div><div style={S.statL}>Weight</div></div>
              <div style={S.stat}><div style={{ ...S.statV, fontSize: 18 }}>{profile.bodyFat || "—"}</div><div style={S.statL}>BF %</div></div>
            </div>
            {/* Extended profile info — only show if any data exists */}
            {(profile.sex || profile.goal || profile.experienceLevel || profile.targetWeight || profile.caloriesTarget || profile.proteinTarget) && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, paddingTop: 8, borderTop: "1px solid #262626" }}>
                {profile.sex && <div style={S.stat}><div style={{ ...S.statV, fontSize: 14 }}>{profile.sex === "male" ? "M" : "F"}</div><div style={S.statL}>Sex</div></div>}
                {profile.dateOfBirth && <div style={S.stat}><div style={{ ...S.statV, fontSize: 14 }}>{Math.floor((Date.now() - new Date(profile.dateOfBirth + "T12:00:00").getTime()) / 31557600000)}</div><div style={S.statL}>Age</div></div>}
                {profile.goal && <div style={S.stat}><div style={{ ...S.statV, fontSize: 14, textTransform: "capitalize" }}>{profile.goal}</div><div style={S.statL}>Goal</div></div>}
                {profile.targetWeight && <div style={S.stat}><div style={{ ...S.statV, fontSize: 14 }}>{profile.targetWeight}</div><div style={S.statL}>Target Wt</div></div>}
                {profile.experienceLevel && <div style={S.stat}><div style={{ ...S.statV, fontSize: 14, textTransform: "capitalize" }}>{profile.experienceLevel}</div><div style={S.statL}>Level</div></div>}
                {profile.trainingIntensity && <div style={S.stat}><div style={{ ...S.statV, fontSize: 14, textTransform: "capitalize" }}>{profile.trainingIntensity}</div><div style={S.statL}>Intensity</div></div>}
                {profile.caloriesTarget && <div style={S.stat}><div style={{ ...S.statV, fontSize: 14 }}>{profile.caloriesTarget}</div><div style={S.statL}>Cal Target</div></div>}
                {profile.proteinTarget && <div style={S.stat}><div style={{ ...S.statV, fontSize: 14 }}>{profile.proteinTarget}g</div><div style={S.statL}>Protein</div></div>}
              </div>
            )}
            {/* Target PRs — only show if any set */}
            {profile.targetPrs && Object.values(profile.targetPrs).some(v => v) && (
              <div style={{ paddingTop: 8, marginTop: 8, borderTop: "1px solid #262626" }}>
                <div style={{ fontSize: 9, color: "#525252", marginBottom: 4, textTransform: "uppercase", letterSpacing: "1px" }}>Target PRs</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                  {Object.entries(profile.targetPrs).filter(([, v]) => v).map(([lift, target]) => (
                    <div key={lift} style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                      <span style={{ color: "#737373" }}>{lift.replace("Conventional ", "")}</span>
                      <span style={{ color: "#fafafa", fontWeight: 700 }}>{target} lbs</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Injuries — only show if set */}
            {profile.injuriesNotes && (
              <div style={{ paddingTop: 8, marginTop: 8, borderTop: "1px solid #262626" }}>
                <div style={{ fontSize: 9, color: "#525252", marginBottom: 4, textTransform: "uppercase", letterSpacing: "1px" }}>Injuries / Limitations</div>
                <div style={{ fontSize: 11, color: "#a3a3a3", lineHeight: 1.4 }}>{profile.injuriesNotes}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Progress chart */}
      {exerciseNames.length > 0 && (
        <div style={S.card}>
          <div style={S.label}>Progress Chart</div>
          <select value={chartExercise} onChange={e => setChartExercise(e.target.value)}
            style={{ ...S.input, fontSize: 12, marginBottom: 10, background: "#1a1a1a" }}>
            {exerciseNames.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          {chartData.length > 1 ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData}>
                <XAxis dataKey="date" tick={{ fill: "#525252", fontSize: 10 }} axisLine={{ stroke: "#262626" }} tickLine={false} />
                <YAxis tick={{ fill: "#525252", fontSize: 10 }} axisLine={{ stroke: "#262626" }} tickLine={false} width={35} />
                <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 6, fontSize: 12, fontFamily: "inherit" }} itemStyle={{ color: "#e5e5e5" }} />
                <Line type="monotone" dataKey="weight" stroke="#c9952d" strokeWidth={2} dot={{ fill: "#c9952d", r: 3 }} name="Weight" />
                <Line type="monotone" dataKey="e1rm" stroke="#525252" strokeWidth={1} strokeDasharray="4 4" dot={false} name="Est 1RM" />
              </LineChart>
            </ResponsiveContainer>
          ) : <div style={{ color: "#525252", fontSize: 12, padding: 20, textAlign: "center" }}>Need 2+ sessions to chart</div>}
        </div>
      )}

      {/* Body weight chart */}
      {bwData.length > 1 && (
        <div style={S.card}>
          <div style={S.label}>Body Weight Trend</div>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={bwData}>
              <XAxis dataKey="date" tick={{ fill: "#525252", fontSize: 10 }} axisLine={{ stroke: "#262626" }} tickLine={false} />
              <YAxis tick={{ fill: "#525252", fontSize: 10 }} axisLine={{ stroke: "#262626" }} tickLine={false} width={35} domain={["dataMin - 5", "dataMax + 5"]} />
              <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 6, fontSize: 12, fontFamily: "inherit" }} />
              <Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6", r: 3 }} name="Lbs" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Big lift PRs */}
      <div style={S.card}>
        <div style={S.label}>Big Lift PRs</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
          {bigLifts.map(name => {
            const pr = prs[name];
            return (
              <div key={name} style={{ background: "#1a1a1a", borderRadius: 8, padding: 10, border: "1px solid #262626" }}>
                <div style={{ fontSize: 10, color: "#737373", textTransform: "uppercase" }}>{name}</div>
                {pr ? (<><div style={{ fontSize: 20, fontWeight: 800, color: "#fafafa", marginTop: 2 }}>{pr.e1rm || "—"}</div><div style={{ fontSize: 10, color: "#525252" }}>{pr.weight}×{pr.reps}</div></>) : <div style={{ fontSize: 14, color: "#333", marginTop: 4 }}>—</div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* All PRs */}
      <div style={S.card}>
        <div style={S.label}>All PRs</div>
        {prList.map(([name, pr]) => (
          <div key={name} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #1a1a1a" }}>
            <div style={{ fontSize: 12, color: "#d4d4d4" }}>{name}</div>
            <div style={{ fontSize: 12, color: "#737373" }}>{pr.weight}×{pr.reps} <span style={{ color: "#525252" }}>({pr.e1rm ? `~${pr.e1rm}` : "—"})</span></div>
          </div>
        ))}
        {prList.length === 0 && <div style={{ color: "#525252", fontSize: 12, padding: 8 }}>Log workouts to see PRs</div>}
      </div>

      {/* Export */}
      <div style={{ padding: "8px 16px" }}>
        <button onClick={async () => {
          try {
            const res = await fetch(`/api/export?user_id=${user.id}`);
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url; a.download = `talos-export.csv`; a.click();
            URL.revokeObjectURL(url);
          } catch(e) { alert("Export failed: " + e.message); }
        }} style={{ ...S.btn("ghost"), display: "block", width: "100%", textAlign: "center" }}>
          Export All Data (CSV)
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════ PROGRAMS ═══════════════════════

function ProgramsPage() {
  const { user, programs, saveProgram, deleteProgram, customExercises, addCustomExercise, editingProgram: editing, setEditingProgram: setEditing } = useTalos();
  const [showPicker, setShowPicker] = useState(false);
  const [pickerDayIdx, setPickerDayIdx] = useState(null);
  const [replacingExIdx, setReplacingExIdx] = useState(null);
  const [collapsedDays, setCollapsedDays] = useState(new Set());
  const [newExName, setNewExName] = useState("");
  const [newExMuscle, setNewExMuscle] = useState("chest");
  const [newExEquip, setNewExEquip] = useState("barbell");

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
    setEditing({ id: null, name: "", description: "", days: [], shared: false, user_id: user.id });
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

  async function handleAddCustom() {
    if (!newExName.trim()) return;
    await addCustomExercise({ name: newExName, muscle: newExMuscle, equipment: newExEquip });
    setNewExName("");
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
      <div style={{ padding: "8px 16px" }}>
        <button onClick={startNew} style={{ ...S.btn("primary"), width: "100%" }}>+ New Program</button>
      </div>

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

// ═══════════════════════ MARKDOWN RENDERER ═══════════════════════

function MarkdownText({ text }) {
  const html = (text || "")
  // Escape HTML first
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  // Headers
  .replace(/^### (.+)$/gm, '<h4 class="md-h4">$1</h4>')
  .replace(/^## (.+)$/gm, '<h3 class="md-h3">$1</h3>')
  .replace(/^# (.+)$/gm, '<h2 class="md-h2">$1</h2>')
  // Bold + italic, bold, italic
  .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
  .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  .replace(/\*(.+?)\*/g, '<em>$1</em>')
  // Inline code
  .replace(/`([^`]+)`/g, '<code class="md-code">$1</code>')
  // Horizontal rules
  .replace(/^---+$/gm, '<hr class="md-hr" />')
  // List items
  .replace(/^[\-\*] (.+)$/gm, '<li class="md-li">$1</li>')
  .replace(/^\d+\.\s+(.+)$/gm, '<li class="md-li md-oli">$1</li>')
  // Wrap consecutive <li> in <ul>
  .replace(/((?:<li class="md-li">.*<\/li>\n?)+)/g, '<ul class="md-ul">$1</ul>')
  // Upgrade to <ol> when all items are ordered
  .replace(/<ul class="md-ul">((?:<li class="md-li md-oli">.*<\/li>\n?)+)<\/ul>/g, '<ol class="md-ol">$1</ol>')
  // Paragraph breaks and line breaks
  .replace(/\n\n/g, '<div class="md-break"></div>')
  .replace(/\n/g, '<br />');

  return <div className="md-response" dangerouslySetInnerHTML={{ __html: html }} />;
}

// ═══════════════════════ SESSION RECAP ═══════════════════════

function SessionRecap({ summary, onDone }) {
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

// ═══════════════════════ COACH ═══════════════════════

function CoachPage() {
  const { workouts, profile, programs, user, saveProgram } = useTalos();
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("chat"); // "chat" | "program" | "weekly"
  const [programPreview, setProgramPreview] = useState(null); // { program, commentary, unknownExercises }
  const [programSaving, setProgramSaving] = useState(false);
  const [weeklyReport, setWeeklyReport] = useState(""); // cached report text

  const prs = {};
  workouts.forEach(w => w.exercises?.forEach(ex => ex.sets?.forEach(s => {
    if (!s.weight || !s.reps) return;
    const e = est1RM(s.weight, s.reps);
    if (!prs[ex.name] || (e && e > (prs[ex.name].e1rm || 0))) prs[ex.name] = { weight: s.weight, reps: s.reps, e1rm: e, date: w.date };
  })));

  function buildContext() {
    const recent = workouts.slice(-10);
    const programCtx = programs.filter(p => p.user_id === user.id).map(p =>
    `${p.name}${p.description ? ` (${p.description})` : ""}:\n${p.days?.map((d, i) =>
      `  Day ${i + 1} — ${d.label || "Untitled"}${d.subtitle ? ` (${d.subtitle})` : ""}: ${d.exercises?.map(e => `${e.name} ${e.defaultSets}x${e.targetReps || "?"}`).join(", ") || "no exercises"}`
    ).join("\n") || "no days"}`
    ).join("\n\n");
    const age = profile.dateOfBirth ? Math.floor((Date.now() - new Date(profile.dateOfBirth + "T12:00:00").getTime()) / 31557600000) : null;
    const profileLines = [
      `Name: ${user.name}`,
      profile.sex ? `Sex: ${profile.sex}` : null,
      age ? `Age: ${age}` : null,
      profile.height ? `Height: ${profile.height}` : null,
      profile.weight ? `Weight: ${profile.weight} lbs` : null,
      profile.bodyFat ? `Body Fat: ${profile.bodyFat}%` : null,
      profile.goal ? `Goal: ${profile.goal}` : null,
      profile.targetWeight ? `Target Weight: ${profile.targetWeight} lbs` : null,
      profile.experienceLevel ? `Experience: ${profile.experienceLevel}` : null,
      profile.trainingIntensity ? `Training Intensity: ${profile.trainingIntensity}` : null,
      profile.caloriesTarget ? `Calorie Target: ${profile.caloriesTarget} kcal/day` : null,
      profile.proteinTarget ? `Protein Target: ${profile.proteinTarget}g/day` : null,
    ].filter(Boolean).join(", ");
    const targetPrLines = profile.targetPrs && Object.keys(profile.targetPrs).length > 0
      ? `TARGET PRs:\n${Object.entries(profile.targetPrs).filter(([, v]) => v).map(([k, v]) => `${k}: ${v} lbs`).join("\n")}` : "";
    const injuryLines = profile.injuriesNotes ? `INJURIES/LIMITATIONS: ${profile.injuriesNotes}` : "";
    return `USER: ${profileLines}
    ${injuryLines}
    ${targetPrLines}
    PROGRAMS:\n${programCtx || "None"}
    PRs:\n${Object.entries(prs).slice(0, 15).map(([k, v]) => `${k}: ${v.weight}x${v.reps} (e1RM: ${v.e1rm || "?"})`).join("\n")}
    RECENT (${recent.length}):\n${recent.map(w => `${w.date} ${w.day_label || ""} (Feel:${w.feel}/5)\n${w.exercises?.map(e => `  ${e.name}: ${e.sets?.map(s => `${s.weight}x${s.reps}`).join(", ")}`).join("\n") || ""}`).join("\n\n")}`;
  }

  async function ask(q) {
    setLoading(true); setResponse("");
    try {
      const data = await api.post("/coach", { prompt: q, context: buildContext() });
      setResponse(data.response || data.error || "No response.");
    } catch (e) { setResponse("Error: " + e.message); }
    setLoading(false);
  }

  async function buildProgram(q) {
    setLoading(true); setProgramPreview(null); setResponse("");
    try {
      const data = await api.post("/coach/program", { prompt: q, context: buildContext() });
      if (data.program) {
        setProgramPreview(data);
      } else {
        setResponse(data.commentary || "Could not generate program. Try being more specific about what you want.");
      }
    } catch (e) { setResponse("Error: " + e.message); }
    setLoading(false);
  }

  async function saveProgramFromPreview() {
    if (!programPreview?.program) return;
    setProgramSaving(true);
    try {
      await saveProgram({
        id: null,
        name: programPreview.program.name,
        description: programPreview.program.description || "",
        days: programPreview.program.days,
        shared: false,
        user_id: user.id,
      });
      setProgramPreview(null);
      setResponse("✅ Program saved! Check the Programs tab.");
    } catch (e) { setResponse("Error saving: " + e.message); }
    setProgramSaving(false);
  }

  async function generateWeeklyReport() {
    setLoading(true); setWeeklyReport("");
    const context = buildContext();

    // Add weekly-specific data
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    const thisWeek = workouts.filter(w => new Date(w.date + "T12:00:00") >= weekAgo);
    const twoWeeksAgo = new Date(); twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const lastWeek = workouts.filter(w => {
      const d = new Date(w.date + "T12:00:00");
      return d >= twoWeeksAgo && d < weekAgo;
    });

    const weeklyCtx = `${context}

THIS WEEK (${thisWeek.length} sessions):
${thisWeek.map(w => `${w.date} ${w.day_label || ""} (Feel:${w.feel}/5, Sleep:${w.sleep_hours || w.sleepHours || "?"}h, Duration:${w.duration || "?"}min)
${w.exercises?.map(e => `  ${e.name}: ${e.sets?.map(s => `${s.weight}x${s.reps}`).join(", ")}`).join("\n") || ""}`).join("\n\n")}

PREVIOUS WEEK (${lastWeek.length} sessions):
${lastWeek.map(w => `${w.date} ${w.day_label || ""} (Feel:${w.feel}/5)
${w.exercises?.map(e => `  ${e.name}: ${e.sets?.map(s => `${s.weight}x${s.reps}`).join(", ")}`).join("\n") || ""}`).join("\n\n")}`;

    try {
      const data = await api.post("/coach/weekly", { context: weeklyCtx });
      setWeeklyReport(data.report || "No report generated.");
    } catch (e) { setWeeklyReport("Error: " + e.message); }
    setLoading(false);
  }

  const quick = [
    { l: "Next workout", p: "Give me specific target weights and reps for my next workout based on progressive overload." },
    { l: "Plateau advice", p: "Analyze my data for any lifts that have plateaued and give me a plan to break through." },
    { l: "Program review", p: "Review my recent volume, exercise selection, and progression. What should I adjust?" },
    { l: "Recovery check", p: "Based on my feel ratings and frequency, how is my recovery? Should I adjust?" },
  ];

  return (
    <div className="fade-in">
      <div style={S.card}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 18 }}>⚡</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#fafafa" }}>AI Coach</div>
            <div style={{ fontSize: 10, color: "#525252" }}>Analyzes your last {Math.min(workouts.length, 10)} workouts</div>
          </div>
        </div>

        {/* Mode toggle */}
        <div style={{ display: "flex", gap: 4, marginBottom: 12, background: "#171717", borderRadius: 6, padding: 3 }}>
          <button onClick={() => { setMode("chat"); setProgramPreview(null); setWeeklyReport(""); }} style={{ ...S.sm(mode === "chat" ? "primary" : "ghost"), flex: 1, textAlign: "center" }}>💬 Chat</button>
          <button onClick={() => { setMode("program"); setResponse(""); setWeeklyReport(""); }} style={{ ...S.sm(mode === "program" ? "primary" : "ghost"), flex: 1, textAlign: "center" }}>📋 Program</button>
          <button onClick={() => { setMode("weekly"); setResponse(""); setProgramPreview(null); }} style={{ ...S.sm(mode === "weekly" ? "primary" : "ghost"), flex: 1, textAlign: "center" }}>📊 Weekly</button>
        </div>

        {mode === "chat" && (
          <>
            <div style={S.label}>Quick Actions</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
              {quick.map((q, i) => <button key={i} onClick={() => { setPrompt(q.p); ask(q.p); }} style={S.sm()}>{q.l}</button>)}
            </div>
            <div style={S.label}>Ask Anything</div>
            <textarea value={prompt} onChange={e => setPrompt(e.target.value)} style={{ ...S.input, minHeight: 50, resize: "vertical", marginBottom: 8 }} placeholder="Programming, nutrition, substitutions..." />
            <button onClick={() => ask(prompt)} disabled={loading || !prompt.trim()} style={{ ...S.btn("primary"), width: "100%", opacity: (loading || !prompt.trim()) ? 0.5 : 1 }}>
              {loading ? "Analyzing..." : "Ask Coach"}
            </button>
          </>
        )}

        {mode === "program" && (
          <>
            <div style={S.label}>Describe Your Program</div>
            <textarea value={prompt} onChange={e => setPrompt(e.target.value)} style={{ ...S.input, minHeight: 70, resize: "vertical", marginBottom: 8 }}
              placeholder="e.g. Build me a 4-day upper/lower split focused on hypertrophy. I train Mon/Tue/Thu/Fri. Avoid deep squats due to hip bursitis." />
            <button onClick={() => buildProgram(prompt)} disabled={loading || !prompt.trim()} style={{ ...S.btn("primary"), width: "100%", opacity: (loading || !prompt.trim()) ? 0.5 : 1 }}>
              {loading ? "Building program..." : "Generate Program"}
            </button>
          </>
        )}

        {mode === "weekly" && (
          <>
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, color: "#a3a3a3", lineHeight: 1.5 }}>
                Generate an AI analysis of your past 7 days — volume by muscle group, progression trends, recovery signals, and action items for next week.
              </div>
            </div>
            <button onClick={generateWeeklyReport} disabled={loading} style={{ ...S.btn("primary"), width: "100%", opacity: loading ? 0.5 : 1 }}>
              {loading ? "Generating report..." : "Generate Weekly Report"}
            </button>
          </>
        )}
      </div>

      {/* Program Preview */}
      {programPreview?.program && (
        <div style={S.card}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 14 }}>📋</span>
            <div style={S.label}>Generated Program</div>
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#fafafa", marginBottom: 2 }}>{programPreview.program.name}</div>
          {programPreview.program.description && <div style={{ fontSize: 11, color: "#737373", marginBottom: 8 }}>{programPreview.program.description}</div>}

          {programPreview.unknownExercises?.length > 0 && (
            <div style={{ background: "#451a03", border: "1px solid #92400e", borderRadius: 6, padding: 8, marginBottom: 8, fontSize: 11, color: "#fbbf24" }}>
              ⚠ Unknown exercises (not in library): {programPreview.unknownExercises.join(", ")}
            </div>
          )}

          {programPreview.program.days?.map((day, di) => (
            <div key={di} style={{ background: "#171717", borderRadius: 6, padding: 10, marginBottom: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#fafafa", marginBottom: 2 }}>
                Day {di + 1} — {day.label}
                {day.subtitle && <span style={{ fontWeight: 400, color: "#737373" }}> ({day.subtitle})</span>}
              </div>
              {day.exercises?.map((ex, ei) => (
                <div key={ei} style={{ fontSize: 11, color: "#a3a3a3", paddingLeft: 8, marginTop: 3, display: "flex", justifyContent: "space-between" }}>
                  <span>{ex.name}</span>
                  <span style={{ color: "#525252" }}>{ex.defaultSets}×{ex.targetReps}{ex.notes ? ` · ${ex.notes}` : ""}</span>
                </div>
              ))}
            </div>
          ))}

          {programPreview.commentary && (
            <div style={{ marginTop: 8, marginBottom: 8 }}>
              <MarkdownText text={programPreview.commentary} />
            </div>
          )}

          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button onClick={() => setProgramPreview(null)} style={{ ...S.btn("ghost"), flex: 1 }}>Dismiss</button>
            <button onClick={saveProgramFromPreview} disabled={programSaving} style={{ ...S.btn("primary"), flex: 2, opacity: programSaving ? 0.5 : 1 }}>
              {programSaving ? "Saving..." : "Save to Programs"}
            </button>
          </div>
        </div>
      )}

      {/* Weekly Report */}
      {(weeklyReport || (loading && mode === "weekly")) && (
        <div style={S.card}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 14 }}>📊</span>
            <div style={S.label}>Weekly Training Report</div>
          </div>
          {loading && mode === "weekly" ? (
            <div style={{ padding: 16, textAlign: "center", color: "#c9952d", fontSize: 12 }}>Analyzing 7-day training data...</div>
          ) : (
            <MarkdownText text={weeklyReport} />
          )}
        </div>
      )}

      {/* Text Response */}
      {(response || (loading && !programPreview)) && (
        <div style={S.card}>
          <div style={S.label}>Response</div>
          {loading ? <div style={{ padding: 16, textAlign: "center", color: "#c9952d", fontSize: 12 }}>Analyzing training data...</div>
            : <MarkdownText text={response} />}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════ SETTINGS MODAL ═══════════════════════

function SettingsModal({ onClose, onLogout }) {
  const { user } = useTalos();
  const [name, setName] = useState(user.name);
  const [newPin, setNewPin] = useState("");
  const [color, setColor] = useState(user.color);
  const [showAI, setShowAI] = useState(false);
  const [aiForm, setAiForm] = useState({ provider: "", model: "", apiKey: "", baseUrl: "", supportsTools: true });
  const [aiStatus, setAiStatus] = useState("");
  const [aiLoaded, setAiLoaded] = useState(false);

  useEffect(() => {
    if (showAI && !aiLoaded) {
      api.get("/ai/config").then(cfg => {
        setAiForm({
          provider: cfg.provider || "anthropic",
          model: cfg.model || "",
          apiKey: "", // Don't prefill key
          baseUrl: cfg.baseUrl || "",
          supportsTools: cfg.supportsTools !== false,
        });
        setAiStatus(cfg.enabled ? `Active: ${cfg.providerName}` : "Not configured");
        setAiLoaded(true);
      }).catch(() => setAiLoaded(true));
    }
  }, [showAI]);

  async function save() {
    const payload = { name, color };
    if (newPin) payload.pin = newPin;
    await api.put(`/users/${user.id}`, payload);
    onClose();
    window.location.reload();
  }

  async function saveAI() {
    setAiStatus("Saving...");
    try {
      const body = { provider: aiForm.provider, model: aiForm.model, baseUrl: aiForm.baseUrl, supportsTools: aiForm.supportsTools };
      if (aiForm.apiKey) body.apiKey = aiForm.apiKey;
      const res = await api.put("/ai/config", body);
      setAiStatus(res.enabled ? `Active: ${res.providerName}` : "Configuration saved (no API key)");
    } catch (e) { setAiStatus("Error: " + e.message); }
  }

  const PROVIDERS = [
    { id: "anthropic", label: "Anthropic (Claude)", models: [
      { id: "claude-opus-4-6", label: "Claude Opus 4.6" },
      { id: "claude-sonnet-4-5-20250929", label: "Claude Sonnet 4.5" },
      { id: "claude-sonnet-4-20250514", label: "Claude Sonnet 4" },
      { id: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5" },
    ]},
    { id: "openai", label: "OpenAI", models: [
      { id: "gpt-4.1", label: "GPT-4.1" },
      { id: "gpt-4.1-mini", label: "GPT-4.1 Mini" },
      { id: "gpt-4o", label: "GPT-4o" },
      { id: "gpt-4o-mini", label: "GPT-4o Mini" },
      { id: "o4-mini", label: "o4 Mini" },
    ]},
    { id: "gemini", label: "Google Gemini", models: [
      { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
      { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
      { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
    ]},
    { id: "openai-compatible", label: "Custom (Ollama, LM Studio, etc.)", models: [] },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ ...S.card, margin: 0, maxWidth: 360, width: "100%", maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={S.label}>Settings</div>
          <button onClick={onClose} style={S.sm()}>✕</button>
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: "#525252", marginBottom: 3, textTransform: "uppercase" }}>Name</div>
          <input value={name} onChange={e => setName(e.target.value)} style={S.input} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: "#525252", marginBottom: 3, textTransform: "uppercase" }}>New PIN (leave blank to keep current)</div>
          <input type="password" inputMode="numeric" autoComplete="new-password" value={newPin} onChange={e => setNewPin(e.target.value)} style={S.input} placeholder="••••" />
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: "#525252", marginBottom: 3, textTransform: "uppercase" }}>Color</div>
          <div style={{ display: "flex", gap: 8 }}>
            {USER_COLORS.map(c => <div key={c} onClick={() => setColor(c)} style={{ width: 24, height: 24, borderRadius: "50%", background: c, cursor: "pointer", border: color === c ? "3px solid #fff" : "3px solid transparent" }} />)}
          </div>
        </div>

        {/* AI Provider Config */}
        <div style={{ borderTop: "1px solid #262626", paddingTop: 12, marginBottom: 12 }}>
          <div onClick={() => setShowAI(!showAI)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
            <div style={{ fontSize: 10, color: "#525252", textTransform: "uppercase" }}>AI Coach Provider</div>
            <span style={{ color: "#525252", fontSize: 12, transform: showAI ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>▼</span>
          </div>
          {aiStatus && <div style={{ fontSize: 10, color: "#737373", marginTop: 2 }}>{aiStatus}</div>}
        </div>

        {showAI && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: "#525252", marginBottom: 3, textTransform: "uppercase" }}>Provider</div>
              <select value={aiForm.provider} onChange={e => {
                const newProvider = e.target.value;
                const models = PROVIDERS.find(p => p.id === newProvider)?.models || [];
                setAiForm(f => ({ ...f, provider: newProvider, model: models[0]?.id || "" }));
                }} style={{ ...S.input, fontSize: 12 }}>
                {PROVIDERS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 10, color: "#525252", marginBottom: 3, textTransform: "uppercase" }}>Model</div>
            {(() => {
              const providerModels = PROVIDERS.find(p => p.id === aiForm.provider)?.models || [];
              const isKnownModel = providerModels.some(m => m.id === aiForm.model);
              const isCustom = providerModels.length === 0 || (!isKnownModel && aiForm.model !== "");
              return (
                <>
                {providerModels.length > 0 && (
                  <select
                  value={isKnownModel ? aiForm.model : "__custom__"}
                  onChange={e => {
                    if (e.target.value === "__custom__") {
                      setAiForm(f => ({ ...f, model: "" }));
                    } else {
                      setAiForm(f => ({ ...f, model: e.target.value }));
                    }
                  }}
                  style={{ ...S.input, fontSize: 12 }}
                  >
                  {providerModels.map(m => (
                    <option key={m.id} value={m.id}>{m.label}</option>
                  ))}
                  <option value="__custom__">Custom model...</option>
                  </select>
                )}
                {isCustom && (
                  <input
                  value={aiForm.model}
                  onChange={e => setAiForm(f => ({ ...f, model: e.target.value }))}
                  style={{ ...S.input, fontSize: 12, marginTop: providerModels.length > 0 ? 4 : 0 }}
                  placeholder={providerModels.length > 0 ? "Enter model ID" : "e.g. llama3, mistral, deepseek-coder"}
                  />
                )}
                </>
              );
            })()}
            </div>
            {aiForm.provider !== "openai-compatible" && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 10, color: "#525252", marginBottom: 3, textTransform: "uppercase" }}>API Key (leave blank to keep current)</div>
                <input type="password" value={aiForm.apiKey} onChange={e => setAiForm(f => ({ ...f, apiKey: e.target.value }))} style={{ ...S.input, fontSize: 12 }} placeholder="sk-..." />
              </div>
            )}
            {aiForm.provider === "openai-compatible" && (
              <>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 10, color: "#525252", marginBottom: 3, textTransform: "uppercase" }}>Base URL</div>
                  <input value={aiForm.baseUrl} onChange={e => setAiForm(f => ({ ...f, baseUrl: e.target.value }))} style={{ ...S.input, fontSize: 12 }} placeholder="http://localhost:11434/v1" />
                </div>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 10, color: "#525252", marginBottom: 3, textTransform: "uppercase" }}>API Key (optional for local)</div>
                  <input type="password" value={aiForm.apiKey} onChange={e => setAiForm(f => ({ ...f, apiKey: e.target.value }))} style={{ ...S.input, fontSize: 12 }} placeholder="Leave blank for Ollama" />
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "#737373", cursor: "pointer", marginBottom: 8 }}>
                  <input type="checkbox" checked={aiForm.supportsTools} onChange={e => setAiForm(f => ({ ...f, supportsTools: e.target.checked }))} />
                  Supports tool/function calling
                </label>
              </>
            )}
            <button onClick={saveAI} style={{ ...S.btn("ghost"), width: "100%", fontSize: 11 }}>Save AI Config</button>
            <div style={{ fontSize: 9, color: "#525252", marginTop: 4, textAlign: "center" }}>Key stored in local database. Server-level .env takes priority if set.</div>
          </div>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onLogout} style={{ ...S.btn("ghost"), flex: 1 }}>Log Out</button>
          <button onClick={save} style={{ ...S.btn("primary"), flex: 1 }}>Save</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════ APP SHELL ═══════════════════════

export default function App() {
  const [user, setUser] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [profile, setProfile] = useState({ height: "", weight: null, bodyFat: null, restTimerCompound: 150, restTimerIsolation: 90, sex: "", dateOfBirth: "", goal: "", targetWeight: null, experienceLevel: "", trainingIntensity: "", targetPrs: {}, injuriesNotes: "", caloriesTarget: null, proteinTarget: null, activeProgramId: null, bioHistory: [] });
  const [programs, setPrograms] = useState([]);
  const [customExercises, setCustomExercises] = useState([]);
  const [tab, setTab] = useState("train");
  const [currentWorkout, setCurrent] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [aiConfig, setAiConfig] = useState({ enabled: false, provider: "", model: "" });
  const [sessionSummary, setSessionSummary] = useState(null); // { workout, analysis, loading }

  // Load user data
  useEffect(() => {
    if (!user) return;
    setLoaded(false);
    Promise.all([
      api.get(`/workouts?user_id=${user.id}`),
      api.get(`/profile?user_id=${user.id}`),
      api.get(`/programs?user_id=${user.id}`),
      api.get("/exercises"),
      api.get("/ai/config"),
    ]).then(([w, p, pr, ex, ai]) => {
      setWorkouts(w);
      setProfile(p);
      setPrograms(pr);
      setCustomExercises(ex);
      setAiConfig(ai);
      setLoaded(true);
    }).catch(e => { console.error(e); setLoaded(true); });
  }, [user]);

  // Actions
  async function saveWorkout(w) {
    await api.post("/workouts", w);
    setWorkouts(prev => [...prev, w]);
  }
  async function deleteWorkout(id) {
    if (!confirm("Delete this workout?")) return;
    await api.del(`/workouts/${id}`);
    setWorkouts(prev => prev.filter(w => w.id !== id));
  }
  async function updateProfile(p) {
    await api.put("/profile", { user_id: user.id, ...p });
    const updated = await api.get(`/profile?user_id=${user.id}`);
    setProfile(updated);
  }
  async function saveProgram(p) {
    if (p.id) { await api.put(`/programs/${p.id}`, p); }
    else { const res = await api.post("/programs", { ...p, user_id: user.id }); p.id = res.id; }
    const updated = await api.get(`/programs?user_id=${user.id}`);
    setPrograms(updated);
  }
  async function deleteProgram(id) {
    if (!confirm("Delete this program?")) return;
    await api.del(`/programs/${id}`);
    setPrograms(prev => prev.filter(p => p.id !== id));
  }
  async function addCustomExercise(ex) {
    await api.post("/exercises", { ...ex, created_by: user.id });
    const updated = await api.get("/exercises");
    setCustomExercises(updated);
  }

  function startWorkout(program, day) {
    const exercises = (day?.exercises || []).map(t => {
      // Find last performance
      let last = null;
      for (let i = workouts.length - 1; i >= 0; i--) {
        const ex = workouts[i].exercises?.find(e => e.name === t.name);
        if (ex?.sets?.length > 0) { last = ex; break; }
      }
      const sets = [];
      for (let j = 0; j < (t.defaultSets || 3); j++) {
        sets.push({ weight: last?.sets?.[j]?.weight || "", reps: last?.sets?.[j]?.reps || "", rpe: "", completed: false });
      }
      return { name: t.name, sets, targetReps: t.targetReps || "", notes: t.notes || "" };
    });
    setCurrent({
      id: genId(), date: new Date().toISOString().split("T")[0],
      program_id: program?.id || null, day_id: day?.id || null, dayLabel: day?.label || "Workout",
      feel: 3, sleepHours: "", exercises, notes: "", startTime: Date.now(),
    });
    setTab("active");
  }

  async function finishWorkout() {
    if (!currentWorkout) return;
    const duration = Math.round((Date.now() - currentWorkout.startTime) / 60000);
    const payload = {
      id: currentWorkout.id, user_id: user.id, date: currentWorkout.date,
      program_id: currentWorkout.program_id, day_id: currentWorkout.day_id,
      day_label: currentWorkout.dayLabel, feel: currentWorkout.feel,
      sleepHours: currentWorkout.sleepHours, duration, notes: currentWorkout.notes,
      exercises: currentWorkout.exercises,
    };
    await saveWorkout(payload);

    // Show session recap and trigger AI analysis
    const summaryData = { workout: payload, analysis: null, loading: aiConfig.enabled };
    setSessionSummary(summaryData);
    setCurrent(null);
    setTab("summary");

    // Fire AI analysis in background
    if (aiConfig.enabled) {
      try {
        const recent = workouts.slice(-5);
        const age = profile.dateOfBirth ? Math.floor((Date.now() - new Date(profile.dateOfBirth + "T12:00:00").getTime()) / 31557600000) : null;
        const profileLines = [
          profile.sex ? `Sex: ${profile.sex}` : null,
          age ? `Age: ${age}` : null,
          profile.weight ? `Weight: ${profile.weight} lbs` : null,
          profile.goal ? `Goal: ${profile.goal}` : null,
          profile.experienceLevel ? `Experience: ${profile.experienceLevel}` : null,
          profile.injuriesNotes ? `Injuries: ${profile.injuriesNotes}` : null,
        ].filter(Boolean).join(", ");

        // Find previous sessions for same day label
        const sameDaySessions = workouts.filter(w => w.day_label === payload.day_label).slice(-3);
        const prevCtx = sameDaySessions.length > 0
          ? `PREVIOUS ${payload.day_label || "SESSION"} HISTORY:\n${sameDaySessions.map(w => `${w.date} (Feel:${w.feel}/5, ${w.duration}min)\n${w.exercises?.map(e => `  ${e.name}: ${e.sets?.map(s => `${s.weight}x${s.reps}`).join(", ")}`).join("\n") || ""}`).join("\n\n")}`
          : "";

        const context = `USER: ${profileLines}\n${prevCtx}`;
        const data = await api.post("/coach/analyze", { workout: payload, context });
        setSessionSummary(prev => prev ? { ...prev, analysis: data.analysis, loading: false } : null);
      } catch (e) {
        setSessionSummary(prev => prev ? { ...prev, analysis: "Analysis unavailable.", loading: false } : null);
      }
    }
  }

  // Auth gate
  if (!user) return <Login onLogin={setUser} />;
  if (!loaded) return (
    <div style={{ ...S.app, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#525252", fontSize: 12 }}>Loading...</div>
    </div>
  );

  const activeTab = currentWorkout && tab === "train" ? "active" : tab;

  async function setActiveProgramId(programId) {
    setProfile(prev => ({ ...prev, activeProgramId: programId }));
    await api.put("/profile/active-program", { user_id: user.id, activeProgramId: programId });
  }

  const ctx = { user, workouts, profile, programs, customExercises, saveWorkout, deleteWorkout, updateProfile, saveProgram, deleteProgram, addCustomExercise, editingProgram, setEditingProgram, aiConfig, setActiveProgramId };

  return (
    <Ctx.Provider value={ctx}>
      <div style={S.app}>
        <div style={S.header}>
          <h1 style={S.title}><img src="/talos-icon.svg" alt="" style={{ width: 20, height: 20, verticalAlign: "middle", marginRight: 6 }} />TALOS {currentWorkout && <span style={{ ...S.tag("#22c55e"), marginLeft: 6, fontSize: 9 }}>LIVE</span>}</h1>
          <div onClick={() => setShowSettings(true)} style={S.avatar(user.color || "#c9952d", 32)}>{user.name?.[0]?.toUpperCase()}</div>
        </div>

        {showSettings && <SettingsModal onClose={() => setShowSettings(false)} onLogout={() => { setUser(null); setShowSettings(false); setTab("train"); setCurrent(null); }} />}

        {activeTab === "train" && <TrainPage onStartWorkout={startWorkout} />}
        {activeTab === "active" && currentWorkout && (
          <ActiveWorkout workout={currentWorkout} setWorkout={setCurrent}
            onFinish={finishWorkout} onDiscard={() => { if (confirm("Discard this workout? All logged sets will be lost.")) { setCurrent(null); setTab("train"); } }} />
        )}
        {activeTab === "active" && !currentWorkout && <TrainPage onStartWorkout={startWorkout} />}
        {activeTab === "summary" && <SessionRecap summary={sessionSummary} onDone={() => { setSessionSummary(null); setTab("history"); }} />}
        {activeTab === "history" && <HistoryPage />}
        {activeTab === "stats" && <StatsPage />}
        {activeTab === "programs" && <ProgramsPage />}
        {activeTab === "coach" && <CoachPage />}

        <nav style={S.nav}>
          {currentWorkout && <button onClick={() => setTab("active")} style={{ ...S.navBtn(activeTab === "active"), background: activeTab === "active" ? "#22c55e" : "#166534", color: activeTab === "active" ? "#000" : "#4ade80" }}>● Live</button>}
          <button onClick={() => setTab("train")} style={S.navBtn(activeTab === "train")}>Train</button>
          <button onClick={() => setTab("history")} style={S.navBtn(activeTab === "history")}>Hist</button>
          <button onClick={() => setTab("stats")} style={S.navBtn(activeTab === "stats")}>Stats</button>
          <button onClick={() => setTab("programs")} style={S.navBtn(activeTab === "programs")}>{editingProgram ? "Prog ●" : "Prog"}</button>
          <button onClick={() => setTab("coach")} style={S.navBtn(activeTab === "coach")}>Coach</button>
        </nav>
      </div>
    </Ctx.Provider>
  );
}

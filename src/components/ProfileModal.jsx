// ═══════════════════════ PROFILE MODAL ═══════════════════════
// Bio & training profile editor. Now includes name, intensity scale,
// and rest timer settings (moved from Settings for better organization).

import { useState } from "react";
import { useTalos } from "../context/TalosContext";
import { est1RM } from "../lib/helpers";
import api from "../lib/api";
import S from "../lib/styles";

// ── Form styles (left-aligned, uniform 44px height for iOS) ──
const fInput = {
  background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 6,
  padding: "8px 10px", color: "var(--text)", fontSize: 14, fontFamily: "inherit",
  width: "100%", boxSizing: "border-box", outline: "none", height: 44,
};
const fSelect = { ...fInput, appearance: "auto", WebkitAppearance: "menulist" };
const fLabel = {
  fontSize: 10, color: "var(--text-dim)", marginBottom: 4,
  textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600,
};

function Field({ label, suffix, children }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={fLabel}>
        {label}{suffix && <span style={{ fontWeight: 400, opacity: 0.6, marginLeft: 3 }}>({suffix})</span>}
      </div>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <label style={{ position: "relative", display: "inline-block", width: 40, height: 22, cursor: "pointer", flexShrink: 0 }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
      <span style={{ position: "absolute", inset: 0, borderRadius: 11, background: checked ? "var(--accent)" : "var(--surface2)", border: "1px solid var(--border2)", transition: "background 0.2s" }}>
        <span style={{ position: "absolute", top: 2, left: checked ? 20 : 2, width: 16, height: 16, borderRadius: "50%", background: "var(--text-bright)", transition: "left 0.2s" }} />
      </span>
    </label>
  );
}

export default function ProfileModal({ onClose }) {
  const { workouts, profile, updateProfile, user, updateUser } = useTalos();
  const [editing, setEditing] = useState(false);
  const [tmp, setTmp] = useState({ ...profile });
  const [tmpName, setTmpName] = useState(user.name);

  // ── PRs (for target PR progress) ──
  const prs = {};
  workouts.forEach(w => w.exercises?.forEach(ex => ex.sets?.forEach(s => {
    if (!s.weight || !s.reps) return;
    const e = est1RM(s.weight, s.reps);
    if (!prs[ex.name] || (e && e > (prs[ex.name].e1rm || 0)))
      prs[ex.name] = { weight: s.weight, reps: s.reps, e1rm: e, date: w.date };
  })));

  async function save() {
    if (tmpName !== user.name) {
      await api.put("/auth/account", { name: tmpName, color: user.color, theme: user.theme });
      updateUser({ name: tmpName });
    }
    await updateProfile(tmp);
    setEditing(false);
  }

  function cancel() {
    setTmp({ ...profile });
    setTmpName(user.name);
    setEditing(false);
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "var(--overlay)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ ...S.card, margin: 0, maxWidth: 380, width: "100%", maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={S.label}>Profile & Bio</div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => editing ? cancel() : setEditing(true)} style={S.sm()}>
              {editing ? "Cancel" : "Edit"}
            </button>
            <button onClick={onClose} style={S.sm()}>✕</button>
          </div>
        </div>

        {editing ? (
          <div>
            {/* Name */}
            <div style={{ marginBottom: 10 }}>
              <div style={fLabel}>Name</div>
              <input value={tmpName} onChange={e => setTmpName(e.target.value)} style={fInput} />
            </div>
            {/* Row 1: Weight, Height, BF% */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
              <Field label="Weight" suffix="lbs">
                <input type="number" inputMode="decimal" value={tmp.weight || ""} onChange={e => setTmp(p => ({ ...p, weight: Number(e.target.value) }))} style={fInput} placeholder="—" />
              </Field>
              <Field label="Height">
                <input type="text" value={tmp.height || ""} onChange={e => setTmp(p => ({ ...p, height: e.target.value }))} style={fInput} placeholder="—" />
              </Field>
              <Field label="BF" suffix="%">
                <input type="number" inputMode="decimal" value={tmp.bodyFat || ""} onChange={e => setTmp(p => ({ ...p, bodyFat: Number(e.target.value) }))} style={fInput} placeholder="—" />
              </Field>
            </div>
            {/* Row 2: Sex, DOB */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 8, marginBottom: 10 }}>
              <Field label="Sex">
                <select value={tmp.sex || ""} onChange={e => setTmp(p => ({ ...p, sex: e.target.value }))} style={fSelect}>
                  <option value="">—</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </Field>
              <Field label="Date of Birth">
                <input type="date" value={tmp.dateOfBirth || ""} onChange={e => setTmp(p => ({ ...p, dateOfBirth: e.target.value }))} style={{ ...fInput, maxWidth: "100%", overflow: "hidden" }} />
              </Field>
            </div>
            {/* Row 3: Goal, Experience */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
              <Field label="Goal">
                <select value={tmp.goal || ""} onChange={e => setTmp(p => ({ ...p, goal: e.target.value }))} style={fSelect}>
                  <option value="">—</option>
                  <option value="bulk">Bulk</option>
                  <option value="cut">Cut</option>
                  <option value="recomp">Recomp</option>
                  <option value="maintain">Maintain</option>
                  <option value="strength">Strength</option>
                </select>
              </Field>
              <Field label="Experience">
                <select value={tmp.experienceLevel || ""} onChange={e => setTmp(p => ({ ...p, experienceLevel: e.target.value }))} style={fSelect}>
                  <option value="">—</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </Field>
            </div>
            {/* Row 4: Intensity, Target Weight */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
              <Field label="Training Intensity">
                <select value={tmp.trainingIntensity || ""} onChange={e => setTmp(p => ({ ...p, trainingIntensity: e.target.value }))} style={fSelect}>
                  <option value="">—</option>
                  <option value="low">Low</option>
                  <option value="moderate">Moderate</option>
                  <option value="high">High</option>
                </select>
              </Field>
              <Field label="Target Weight" suffix="lbs">
                <input type="number" inputMode="decimal" value={tmp.targetWeight || ""} onChange={e => setTmp(p => ({ ...p, targetWeight: Number(e.target.value) }))} style={fInput} placeholder="—" />
              </Field>
            </div>
            {/* Row 5: Nutrition targets */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
              <Field label="Calories" suffix="kcal">
                <input type="number" inputMode="numeric" value={tmp.caloriesTarget || ""} onChange={e => setTmp(p => ({ ...p, caloriesTarget: Number(e.target.value) }))} style={fInput} placeholder="—" />
              </Field>
              <Field label="Protein" suffix="g">
                <input type="number" inputMode="numeric" value={tmp.proteinTarget || ""} onChange={e => setTmp(p => ({ ...p, proteinTarget: Number(e.target.value) }))} style={fInput} placeholder="—" />
              </Field>
            </div>
            {/* Target PRs */}
            <div style={{ marginBottom: 10 }}>
              <div style={fLabel}>Target PRs</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {["Bench Press", "Back Squat", "Deadlift", "Overhead Press"].map(lift => {
                  const key = lift === "Deadlift" ? "Conventional Deadlift" : lift;
                  return (
                    <div key={lift} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{lift}</div>
                      <input type="number" inputMode="numeric" value={tmp.targetPrs?.[key] || ""} onChange={e => setTmp(p => ({ ...p, targetPrs: { ...(p.targetPrs || {}), [key]: Number(e.target.value) || undefined } }))} style={{ ...fInput, width: 72, flex: "none", textAlign: "center" }} placeholder="lbs" />
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Intensity Scale */}
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 10, marginBottom: 10 }}>
              <div style={fLabel}>Intensity Scale</div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => setTmp(p => ({ ...p, intensityScale: "rpe" }))} style={{ ...S.sm(tmp.intensityScale !== "rir" ? "primary" : "ghost"), flex: 1, padding: "8px 10px", fontSize: 11 }}>RPE (1–10)</button>
                <button onClick={() => setTmp(p => ({ ...p, intensityScale: "rir" }))} style={{ ...S.sm(tmp.intensityScale === "rir" ? "primary" : "ghost"), flex: 1, padding: "8px 10px", fontSize: 11 }}>RIR (0–5)</button>
              </div>
              <div style={{ fontSize: 9, color: "var(--text-dim)", marginTop: 4 }}>
                {tmp.intensityScale === "rir" ? "Reps In Reserve (0 = nothing left)" : "Rate of Perceived Exertion (10 = max effort)"}
              </div>
            </div>
            {/* Rest Timer */}
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 10, marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ ...fLabel, marginBottom: 0 }}>Rest Timer</div>
                <Toggle checked={tmp.restTimerEnabled !== false} onChange={v => setTmp(p => ({ ...p, restTimerEnabled: v }))} />
              </div>
              {tmp.restTimerEnabled !== false && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <Field label="Compound" suffix="sec">
                    <input type="number" inputMode="numeric" value={tmp.restTimerCompound || 150} onChange={e => setTmp(p => ({ ...p, restTimerCompound: Number(e.target.value) }))} style={fInput} />
                  </Field>
                  <Field label="Isolation" suffix="sec">
                    <input type="number" inputMode="numeric" value={tmp.restTimerIsolation || 90} onChange={e => setTmp(p => ({ ...p, restTimerIsolation: Number(e.target.value) }))} style={fInput} />
                  </Field>
                </div>
              )}
            </div>
            {/* Notes */}
            <div style={{ marginBottom: 14 }}>
              <div style={fLabel}>Notes</div>
              <textarea value={tmp.injuriesNotes || ""} onChange={e => setTmp(p => ({ ...p, injuriesNotes: e.target.value }))} style={{ ...S.input, minHeight: 44, resize: "vertical", fontSize: 13 }} placeholder="Anything your AI coach should know" />
            </div>
            <button onClick={save} style={{ ...S.btn("primary"), width: "100%" }}>Save Profile</button>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-bright)", marginBottom: 10 }}>{user.name}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 8 }}>
              <div style={S.stat}><div style={{ ...S.statV, fontSize: 18 }}>{profile.height || "—"}</div><div style={S.statL}>Height</div></div>
              <div style={S.stat}><div style={{ ...S.statV, fontSize: 18 }}>{profile.weight || "—"}</div><div style={S.statL}>Weight</div></div>
              <div style={S.stat}><div style={{ ...S.statV, fontSize: 18 }}>{profile.bodyFat || "—"}</div><div style={S.statL}>BF %</div></div>
            </div>
            {(profile.sex || profile.goal || profile.experienceLevel || profile.targetWeight || profile.caloriesTarget || profile.proteinTarget) && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, paddingTop: 8, borderTop: "1px solid var(--border)" }}>
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
            <div style={{ display: "flex", gap: 6, paddingTop: 8, marginTop: 8, borderTop: "1px solid var(--border)", flexWrap: "wrap" }}>
              <span style={S.tag()}>{profile.intensityScale === "rir" ? "RIR" : "RPE"}</span>
              <span style={S.tag()}>{profile.restTimerEnabled !== false ? `Rest: ${profile.restTimerCompound || 150}/${profile.restTimerIsolation || 90}s` : "Rest Timer Off"}</span>
            </div>
            {profile.targetPrs && Object.values(profile.targetPrs).some(v => v) && (
              <div style={{ paddingTop: 8, marginTop: 8, borderTop: "1px solid var(--border)" }}>
                <div style={{ fontSize: 9, color: "var(--text-dim)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "1px" }}>Target PRs</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                  {Object.entries(profile.targetPrs).filter(([, v]) => v).map(([lift, target]) => {
                    const current = prs[lift]?.e1rm;
                    const pct = current && target ? Math.round((current / target) * 100) : null;
                    return (
                      <div key={lift} style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                        <span style={{ color: "var(--text-muted)" }}>{lift.replace("Conventional ", "")}</span>
                        <span>
                          <span style={{ color: "var(--text-bright)", fontWeight: 700 }}>{target}</span>
                          {pct && <span style={{ color: pct >= 100 ? "#22c55e" : "var(--text-dim)", marginLeft: 4, fontSize: 10 }}>{pct}%</span>}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {profile.injuriesNotes && (
              <div style={{ paddingTop: 8, marginTop: 8, borderTop: "1px solid var(--border)" }}>
                <div style={{ fontSize: 9, color: "var(--text-dim)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "1px" }}>Notes</div>
                <div style={{ fontSize: 11, color: "var(--text-light)", lineHeight: 1.4 }}>{profile.injuriesNotes}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

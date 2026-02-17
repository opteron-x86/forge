// ═══════════════════════ PROFILE MODAL ═══════════════════════
// Bio & training profile editor, moved from StatsPage.
// Shows view mode by default, edit mode on tap.

import { useState } from "react";
import { useTalos } from "../context/TalosContext";
import { est1RM } from "../lib/helpers";
import S from "../lib/styles";

export default function ProfileModal({ onClose }) {
  const { workouts, profile, updateProfile } = useTalos();
  const [editing, setEditing] = useState(false);
  const [tmp, setTmp] = useState({ ...profile });

  // ── PRs (for target PR progress) ──
  const prs = {};
  workouts.forEach(w => w.exercises?.forEach(ex => ex.sets?.forEach(s => {
    if (!s.weight || !s.reps) return;
    const e = est1RM(s.weight, s.reps);
    if (!prs[ex.name] || (e && e > (prs[ex.name].e1rm || 0)))
      prs[ex.name] = { weight: s.weight, reps: s.reps, e1rm: e, date: w.date };
  })));

  function save() {
    updateProfile(tmp);
    setEditing(false);
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "var(--overlay)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ ...S.card, margin: 0, maxWidth: 380, width: "100%", maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={S.label}>Profile & Bio</div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => { if (editing) { setTmp({ ...profile }); } setEditing(!editing); }} style={S.sm()}>
              {editing ? "Cancel" : "Edit"}
            </button>
            <button onClick={onClose} style={S.sm()}>✕</button>
          </div>
        </div>

        {editing ? (
          <div>
            {/* Row 1: Core biometrics */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
              {[["Weight", "weight", "number"], ["BF %", "bodyFat", "number"], ["Height", "height", "text"]].map(([l, k, t]) => (
                <div key={k}>
                  <div style={{ fontSize: 9, color: "var(--text-dim)", marginBottom: 3, textTransform: "uppercase" }}>{l}</div>
                  <input type={t} inputMode={t === "number" ? "decimal" : undefined} value={tmp[k] || ""} onChange={e => setTmp(p => ({ ...p, [k]: t === "number" ? Number(e.target.value) : e.target.value }))} style={S.smInput} />
                </div>
              ))}
            </div>
            {/* Row 2: Sex, DOB, Target Weight */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 9, color: "var(--text-dim)", marginBottom: 3, textTransform: "uppercase" }}>Sex</div>
                <select value={tmp.sex || ""} onChange={e => setTmp(p => ({ ...p, sex: e.target.value }))} style={{ ...S.smSelect, textAlign: "left" }}>
                  <option value="">—</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div>
                <div style={{ fontSize: 9, color: "var(--text-dim)", marginBottom: 3, textTransform: "uppercase" }}>DOB</div>
                <input type="date" value={tmp.dateOfBirth || ""} onChange={e => setTmp(p => ({ ...p, dateOfBirth: e.target.value }))} style={{ ...S.smInput, textAlign: "left", padding: "4px 4px", fontSize: 11, height: 44 }} />
              </div>
              <div>
                <div style={{ fontSize: 9, color: "var(--text-dim)", marginBottom: 3, textTransform: "uppercase" }}>Target Wt</div>
                <input type="number" inputMode="decimal" value={tmp.targetWeight || ""} onChange={e => setTmp(p => ({ ...p, targetWeight: Number(e.target.value) }))} style={S.smInput} placeholder="lbs" />
              </div>
            </div>
            {/* Row 3: Goal, Experience, Intensity */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 9, color: "var(--text-dim)", marginBottom: 3, textTransform: "uppercase" }}>Goal</div>
                <select value={tmp.goal || ""} onChange={e => setTmp(p => ({ ...p, goal: e.target.value }))} style={{ ...S.smSelect, textAlign: "left" }}>
                  <option value="">—</option>
                  <option value="bulk">Bulk</option>
                  <option value="cut">Cut</option>
                  <option value="recomp">Recomp</option>
                  <option value="maintain">Maintain</option>
                  <option value="strength">Strength</option>
                </select>
              </div>
              <div>
                <div style={{ fontSize: 9, color: "var(--text-dim)", marginBottom: 3, textTransform: "uppercase" }}>Experience</div>
                <select value={tmp.experienceLevel || ""} onChange={e => setTmp(p => ({ ...p, experienceLevel: e.target.value }))} style={{ ...S.smSelect, textAlign: "left" }}>
                  <option value="">—</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div>
                <div style={{ fontSize: 9, color: "var(--text-dim)", marginBottom: 3, textTransform: "uppercase" }}>Intensity</div>
                <select value={tmp.trainingIntensity || ""} onChange={e => setTmp(p => ({ ...p, trainingIntensity: e.target.value }))} style={{ ...S.smSelect, textAlign: "left" }}>
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
                <div style={{ fontSize: 9, color: "var(--text-dim)", marginBottom: 3, textTransform: "uppercase" }}>Calorie Target</div>
                <input type="number" inputMode="numeric" value={tmp.caloriesTarget || ""} onChange={e => setTmp(p => ({ ...p, caloriesTarget: Number(e.target.value) }))} style={S.smInput} placeholder="kcal/day" />
              </div>
              <div>
                <div style={{ fontSize: 9, color: "var(--text-dim)", marginBottom: 3, textTransform: "uppercase" }}>Protein Target</div>
                <input type="number" inputMode="numeric" value={tmp.proteinTarget || ""} onChange={e => setTmp(p => ({ ...p, proteinTarget: Number(e.target.value) }))} style={S.smInput} placeholder="g/day" />
              </div>
            </div>
            {/* Target PRs */}
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 9, color: "var(--text-dim)", marginBottom: 3, textTransform: "uppercase" }}>Target PRs</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                {["Bench Press", "Back Squat", "Conventional Deadlift", "Overhead Press"].map(lift => (
                  <div key={lift} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{ fontSize: 9, color: "var(--text-muted)", flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{lift.replace("Conventional ", "")}</div>
                    <input type="number" inputMode="numeric" value={tmp.targetPrs?.[lift] || ""} onChange={e => setTmp(p => ({ ...p, targetPrs: { ...(p.targetPrs || {}), [lift]: Number(e.target.value) || undefined } }))} style={{ ...S.smInput, width: 64, flex: "none" }} placeholder="lbs" />
                  </div>
                ))}
              </div>
            </div>
            {/* Injuries/Notes */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 9, color: "var(--text-dim)", marginBottom: 3, textTransform: "uppercase" }}>Injuries / Limitations</div>
              <textarea value={tmp.injuriesNotes || ""} onChange={e => setTmp(p => ({ ...p, injuriesNotes: e.target.value }))} style={{ ...S.input, minHeight: 40, resize: "vertical", fontSize: 12 }} placeholder="Hip bursitis, bad shoulder, etc." />
            </div>
            <button onClick={save} style={{ ...S.btn("primary"), width: "100%" }}>Save Profile</button>
          </div>
        ) : (
          <div>
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
                <div style={{ fontSize: 9, color: "var(--text-dim)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "1px" }}>Injuries / Limitations</div>
                <div style={{ fontSize: 11, color: "var(--text-light)", lineHeight: 1.4 }}>{profile.injuriesNotes}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

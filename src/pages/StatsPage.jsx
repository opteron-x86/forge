// ═══════════════════════ STATS PAGE ═══════════════════════
// Extracted from App.jsx — StatsPage function

import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useTalos } from "../context/TalosContext";
import { est1RM } from "../lib/helpers";
import S from "../lib/styles";

export default function StatsPage() {
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

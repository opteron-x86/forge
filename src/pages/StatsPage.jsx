// ═══════════════════════ STATS PAGE ═══════════════════════
// Training analytics: lifetime totals, streaks, volume trends,
// auto-detected top lifts, progress charts, and PRs with recency.
// Bio/profile editing collapsed by default to keep focus on data.

import { useState, useMemo } from "react";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { useTalos } from "../context/TalosContext";
import { est1RM } from "../lib/helpers";
import S from "../lib/styles";

export default function StatsPage() {
  const { workouts, profile, updateProfile, user } = useTalos();
  const [showBio, setShowBio] = useState(false);
  const [editing, setEditing] = useState(false);
  const [tmp, setTmp] = useState({});
  const [chartExercise, setChartExercise] = useState(null); // null = auto-detect
  const [prFilter, setPrFilter] = useState("all"); // all | recent
  const [prMode, setPrMode] = useState("e1rm"); // e1rm | actual
  const [showAllPrs, setShowAllPrs] = useState(false);

  // ── PRs ──
  const prs = useMemo(() => {
    const map = {};
    workouts.forEach(w => w.exercises?.forEach(ex => ex.sets?.forEach(s => {
      if (!s.weight || !s.reps) return;
      const e = est1RM(s.weight, s.reps);
      if (!map[ex.name] || (e && e > (map[ex.name].e1rm || 0)))
        map[ex.name] = { weight: s.weight, reps: s.reps, e1rm: e, date: w.date };
    })));
    return map;
  }, [workouts]);

  const prList = useMemo(() => {
    const entries = Object.entries(prs);
    if (prMode === "e1rm") return entries.sort((a, b) => (b[1].e1rm || 0) - (a[1].e1rm || 0));
    return entries.sort((a, b) => (b[1].weight || 0) - (a[1].weight || 0));
  }, [prs, prMode]);

  // Recent PRs (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentPrList = prList.filter(([, pr]) => new Date(pr.date + "T12:00:00") >= thirtyDaysAgo);

  // ── Lifetime totals ──
  const lifetimeStats = useMemo(() => {
    let totalSets = 0, totalVol = 0, totalDuration = 0, durationCount = 0;
    workouts.forEach(w => {
      w.exercises?.forEach(e => {
        totalSets += e.sets?.length || 0;
        e.sets?.forEach(s => { totalVol += (s.weight || 0) * (s.reps || 0); });
      });
      if (w.duration) { totalDuration += w.duration; durationCount++; }
    });
    return {
      workouts: workouts.length,
      sets: totalSets,
      volume: totalVol,
      avgDuration: durationCount > 0 ? Math.round(totalDuration / durationCount) : null,
    };
  }, [workouts]);

  // ── Streaks ──
  const { streak, maxStreak, thisWeek } = useMemo(() => {
    const dates = [...new Set(workouts.map(w => w.date))].sort();
    let s = 0, ms = 0, ts = 1;
    const today = new Date().toISOString().split("T")[0];

    for (let i = dates.length - 1; i >= 0; i--) {
      const d = new Date(dates[i] + "T12:00:00");
      const prev = i < dates.length - 1 ? new Date(dates[i + 1] + "T12:00:00") : new Date(today + "T12:00:00");
      const gap = Math.round((prev - d) / 86400000);
      if (gap <= 3) s++; else break;
    }
    for (let i = 1; i < dates.length; i++) {
      const gap = Math.round((new Date(dates[i] + "T12:00:00") - new Date(dates[i - 1] + "T12:00:00")) / 86400000);
      if (gap <= 3) ts++; else { ms = Math.max(ms, ts); ts = 1; }
    }
    ms = Math.max(ms, ts);
    if (dates.length === 0) { s = 0; ms = 0; }

    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    const tw = workouts.filter(w => new Date(w.date + "T12:00:00") >= weekAgo).length;

    return { streak: s, maxStreak: ms, thisWeek: tw };
  }, [workouts]);

  // ── Exercise names (sorted by frequency) ──
  const exerciseNames = useMemo(() => {
    const freq = {};
    workouts.forEach(w => w.exercises?.forEach(e => { freq[e.name] = (freq[e.name] || 0) + 1; }));
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).map(([name]) => name);
  }, [workouts]);

  // Auto-detect chart exercise: most logged exercise
  const activeChartExercise = chartExercise || exerciseNames[0] || "Bench Press";

  // ── Top lifts (auto-detected from user's data by e1RM) ──
  const topLifts = useMemo(() => {
    return prList.slice(0, 6).map(([name, pr]) => ({ name, ...pr }));
  }, [prList]);

  // ── Progress chart data ──
  const chartData = useMemo(() => {
    return workouts
      .filter(w => w.exercises?.some(e => e.name === activeChartExercise))
      .map(w => {
        const ex = w.exercises.find(e => e.name === activeChartExercise);
        const best = ex?.sets?.reduce((a, s) => ((s.weight || 0) > (a.weight || 0) ? s : a), { weight: 0, reps: 0 });
        return { date: w.date.slice(5), weight: best?.weight || 0, e1rm: est1RM(best?.weight, best?.reps) || 0 };
      });
  }, [workouts, activeChartExercise]);

  // ── Weekly volume trend (last 12 weeks) ──
  const weeklyVolume = useMemo(() => {
    const weeks = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i * 7) - now.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      let vol = 0, sessions = 0;
      workouts.forEach(w => {
        const d = new Date(w.date + "T12:00:00");
        if (d >= weekStart && d < weekEnd) {
          sessions++;
          w.exercises?.forEach(e => e.sets?.forEach(s => { vol += (s.weight || 0) * (s.reps || 0); }));
        }
      });

      const label = `${weekStart.getMonth() + 1}/${weekStart.getDate()}`;
      weeks.push({ label, volume: Math.round(vol / 1000), sessions });
    }
    return weeks;
  }, [workouts]);

  const hasVolumeData = weeklyVolume.some(w => w.volume > 0);

  // ── Body weight chart ──
  const bwData = useMemo(() =>
    profile.bioHistory?.map(h => ({ date: h.date.slice(5), weight: h.weight })) || [],
  [profile.bioHistory]);

  // ── Format helpers ──
  function fmtVol(v) {
    if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
    if (v >= 1000) return `${Math.round(v / 1000)}k`;
    return v.toLocaleString();
  }
  function daysSince(dateStr) {
    if (!dateStr) return Infinity;
    return Math.floor((new Date() - new Date(dateStr + "T12:00:00")) / 86400000);
  }

  // Tooltip styling
  const tooltipStyle = {
    contentStyle: { background: "#1a1a1a", border: "1px solid #333", borderRadius: 6, fontSize: 11, fontFamily: "inherit" },
    itemStyle: { color: "#e5e5e5" },
  };

  return (
    <div className="fade-in">
      {/* ── Lifetime Totals ── */}
      <div style={{ ...S.card, display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
        <div style={S.stat}>
          <div style={{ ...S.statV, fontSize: 20 }}>{lifetimeStats.workouts}</div>
          <div style={S.statL}>Workouts</div>
        </div>
        <div style={S.stat}>
          <div style={{ ...S.statV, fontSize: 20 }}>{fmtVol(lifetimeStats.volume)}</div>
          <div style={S.statL}>Volume (lbs)</div>
        </div>
        <div style={S.stat}>
          <div style={{ ...S.statV, fontSize: 20 }}>{lifetimeStats.sets}</div>
          <div style={S.statL}>Total Sets</div>
        </div>
        <div style={S.stat}>
          <div style={{ ...S.statV, fontSize: 20 }}>{lifetimeStats.avgDuration || "—"}</div>
          <div style={S.statL}>Avg Min</div>
        </div>
      </div>

      {/* ── Streaks ── */}
      <div style={{ ...S.card, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <div style={S.stat}><div style={S.statV}>{streak}</div><div style={S.statL}>Streak</div></div>
        <div style={S.stat}><div style={S.statV}>{maxStreak}</div><div style={S.statL}>Best Streak</div></div>
        <div style={S.stat}><div style={S.statV}>{thisWeek}</div><div style={S.statL}>This Week</div></div>
      </div>

      {/* ── Weekly Volume Trend ── */}
      {hasVolumeData && (
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={S.label}>Weekly Volume (last 12 weeks)</div>
            <div style={{ fontSize: 10, color: "#525252" }}>×1,000 lbs</div>
          </div>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={weeklyVolume}>
              <XAxis dataKey="label" tick={{ fill: "#525252", fontSize: 9 }} axisLine={{ stroke: "#262626" }} tickLine={false} interval={1} />
              <YAxis tick={{ fill: "#525252", fontSize: 9 }} axisLine={{ stroke: "#262626" }} tickLine={false} width={28} />
              <Tooltip {...tooltipStyle} formatter={(val, name) => [name === "volume" ? `${val}k lbs` : val, name === "volume" ? "Volume" : "Sessions"]} />
              <Bar dataKey="volume" fill="#c9952d" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Top Lifts (auto-detected) ── */}
      {topLifts.length > 0 && (
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={S.label}>Top Lifts</div>
            <div style={{ display: "flex", gap: 4 }}>
              <button onClick={() => setPrMode("e1rm")} style={{ ...S.sm(prMode === "e1rm" ? "primary" : "ghost"), fontSize: 9, padding: "3px 6px" }}>Est 1RM</button>
              <button onClick={() => setPrMode("actual")} style={{ ...S.sm(prMode === "actual" ? "primary" : "ghost"), fontSize: 9, padding: "3px 6px" }}>Actual</button>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {topLifts.map(lift => {
              const isRecent = daysSince(lift.date) <= 30;
              const primary = prMode === "e1rm" ? (lift.e1rm || "—") : lift.weight;
              const secondary = prMode === "e1rm" ? `${lift.weight}×${lift.reps}` : `~${lift.e1rm || "?"} e1RM`;
              return (
                <div key={lift.name} style={{ background: "#1a1a1a", borderRadius: 8, padding: 10, border: "1px solid #262626" }}>
                  <div style={{ fontSize: 10, color: "#737373", textTransform: "uppercase", lineHeight: 1.3 }}>{lift.name}</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 4 }}>
                    <span style={{ fontSize: 22, fontWeight: 800, color: "#fafafa" }}>{primary}</span>
                    {prMode === "actual" && <span style={{ fontSize: 12, color: "#525252" }}>×{lift.reps}</span>}
                    {isRecent && (
                      <span style={{ fontSize: 8, fontWeight: 700, color: "#22c55e", textTransform: "uppercase", letterSpacing: "0.5px" }}>New</span>
                    )}
                  </div>
                  <div style={{ fontSize: 10, color: "#525252" }}>{secondary}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Progress Chart ── */}
      {exerciseNames.length > 0 && (
        <div style={S.card}>
          <div style={S.label}>Exercise Progress</div>
          <select
            value={activeChartExercise}
            onChange={e => setChartExercise(e.target.value)}
            style={{ ...S.input, fontSize: 12, marginBottom: 10, background: "#1a1a1a" }}
          >
            {exerciseNames.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          {chartData.length > 1 ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData}>
                <XAxis dataKey="date" tick={{ fill: "#525252", fontSize: 10 }} axisLine={{ stroke: "#262626" }} tickLine={false} />
                <YAxis tick={{ fill: "#525252", fontSize: 10 }} axisLine={{ stroke: "#262626" }} tickLine={false} width={35} />
                <Tooltip {...tooltipStyle} />
                <Line type="monotone" dataKey="weight" stroke="#c9952d" strokeWidth={2} dot={{ fill: "#c9952d", r: 3 }} name="Weight" />
                <Line type="monotone" dataKey="e1rm" stroke="#525252" strokeWidth={1} strokeDasharray="4 4" dot={false} name="Est 1RM" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ color: "#525252", fontSize: 12, padding: 20, textAlign: "center" }}>
              {chartData.length === 1 ? "One session logged — chart shows after 2+" : "No data for this exercise"}
            </div>
          )}
        </div>
      )}

      {/* ── Body Weight Trend ── */}
      {bwData.length > 1 && (
        <div style={S.card}>
          <div style={S.label}>Body Weight Trend</div>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={bwData}>
              <XAxis dataKey="date" tick={{ fill: "#525252", fontSize: 10 }} axisLine={{ stroke: "#262626" }} tickLine={false} />
              <YAxis tick={{ fill: "#525252", fontSize: 10 }} axisLine={{ stroke: "#262626" }} tickLine={false} width={35} domain={["dataMin - 5", "dataMax + 5"]} />
              <Tooltip {...tooltipStyle} />
              <Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6", r: 3 }} name="Lbs" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── All PRs ── */}
      <div style={S.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={S.label}>
            {prFilter === "recent" ? "Recent PRs" : "All PRs"}
            {prFilter === "all" && <span style={{ color: "#525252", fontWeight: 400 }}> ({prList.length})</span>}
          </div>
          {recentPrList.length > 0 && (
            <div style={{ display: "flex", gap: 4 }}>
              <button onClick={() => setPrFilter("all")} style={{ ...S.sm(prFilter === "all" ? "primary" : "ghost"), fontSize: 9, padding: "3px 6px" }}>All</button>
              <button onClick={() => setPrFilter("recent")} style={{ ...S.sm(prFilter === "recent" ? "primary" : "ghost"), fontSize: 9, padding: "3px 6px" }}>
                Recent ({recentPrList.length})
              </button>
            </div>
          )}
        </div>
        {(prFilter === "recent" ? recentPrList : showAllPrs ? prList : prList.slice(0, 10)).map(([name, pr]) => {
          const isRecent = daysSince(pr.date) <= 30;
          const primary = prMode === "e1rm" ? (pr.e1rm ? `~${pr.e1rm}` : "—") : `${pr.weight}×${pr.reps}`;
          const secondary = prMode === "e1rm" ? `${pr.weight}×${pr.reps}` : (pr.e1rm ? `~${pr.e1rm}` : "—");
          return (
            <div key={name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #1a1a1a" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ fontSize: 12, color: "#d4d4d4" }}>{name}</div>
                {isRecent && prFilter !== "recent" && (
                  <span style={{ fontSize: 8, fontWeight: 700, color: "#22c55e", textTransform: "uppercase" }}>New</span>
                )}
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: 12, color: "#a3a3a3", fontWeight: 600 }}>{primary}</span>
                <span style={{ fontSize: 11, color: "#525252", marginLeft: 6 }}>{secondary}</span>
                <span style={{ fontSize: 9, color: "#404040", marginLeft: 6 }}>{pr.date.slice(5)}</span>
              </div>
            </div>
          );
        })}
        {prFilter === "all" && !showAllPrs && prList.length > 10 && (
          <button onClick={() => setShowAllPrs(true)} style={{ ...S.sm("ghost"), width: "100%", marginTop: 8, textAlign: "center", fontSize: 10 }}>
            Show all {prList.length} PRs
          </button>
        )}
        {showAllPrs && prList.length > 10 && (
          <button onClick={() => setShowAllPrs(false)} style={{ ...S.sm("ghost"), width: "100%", marginTop: 8, textAlign: "center", fontSize: 10 }}>
            Show less
          </button>
        )}
        {prList.length === 0 && <div style={{ color: "#525252", fontSize: 12, padding: 8 }}>Log workouts to see PRs</div>}
      </div>

      {/* ── Bio Stats (collapsible) ── */}
      <div style={S.card}>
        <div
          onClick={() => { setShowBio(!showBio); if (editing) setEditing(false); }}
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
        >
          <div style={S.label}>Profile & Bio</div>
          <span style={{ color: "#525252", fontSize: 12, transform: showBio ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>▼</span>
        </div>

        {/* Compact summary always visible */}
        {!showBio && (profile.weight || profile.height || profile.goal) && (
          <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
            {profile.height && <span style={{ fontSize: 11, color: "#737373" }}>{profile.height}</span>}
            {profile.weight && <span style={{ fontSize: 11, color: "#737373" }}>{profile.weight} lbs</span>}
            {profile.bodyFat && <span style={{ fontSize: 11, color: "#737373" }}>{profile.bodyFat}% BF</span>}
            {profile.goal && <span style={{ fontSize: 11, color: "#c9952d", textTransform: "capitalize" }}>{profile.goal}</span>}
            {profile.experienceLevel && <span style={{ fontSize: 11, color: "#737373", textTransform: "capitalize" }}>{profile.experienceLevel}</span>}
          </div>
        )}

        {showBio && (
          <div style={{ marginTop: 10 }}>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
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
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 8 }}>
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
                      {Object.entries(profile.targetPrs).filter(([, v]) => v).map(([lift, target]) => {
                        const current = prs[lift]?.e1rm;
                        const pct = current && target ? Math.round((current / target) * 100) : null;
                        return (
                          <div key={lift} style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                            <span style={{ color: "#737373" }}>{lift.replace("Conventional ", "")}</span>
                            <span>
                              <span style={{ color: "#fafafa", fontWeight: 700 }}>{target}</span>
                              {pct && <span style={{ color: pct >= 100 ? "#22c55e" : "#525252", marginLeft: 4, fontSize: 10 }}>{pct}%</span>}
                            </span>
                          </div>
                        );
                      })}
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
        )}
      </div>

      {/* ── Export ── */}
      <div style={{ padding: "8px 16px" }}>
        <button onClick={async () => {
          try {
            const res = await fetch(`/api/export?user_id=${user.id}`);
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url; a.download = "talos-export.csv"; a.click();
            URL.revokeObjectURL(url);
          } catch (e) { alert("Export failed: " + e.message); }
        }} style={{ ...S.btn("ghost"), display: "block", width: "100%", textAlign: "center" }}>
          Export All Data (CSV)
        </button>
      </div>
    </div>
  );
}

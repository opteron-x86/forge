// ═══════════════════════ STATS PAGE ═══════════════════════
// Training analytics: lifetime totals, streaks, volume trends,
// configurable top lifts, progress charts, PRs, and body weight tracking.

import { useState, useMemo } from "react";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { useTalos } from "../context/TalosContext";
import { est1RM } from "../lib/helpers";
import api from "../lib/api";
import S from "../lib/styles";

export default function StatsPage() {
  const { workouts, profile, updateProfile, user } = useTalos();
  const [chartExercise, setChartExercise] = useState(null);
  const [prFilter, setPrFilter] = useState("all");
  const [prMode, setPrMode] = useState("actual"); // default to actual
  const [showAllPrs, setShowAllPrs] = useState(false);
  const [editingTopLifts, setEditingTopLifts] = useState(false);
  const [weighInWeight, setWeighInWeight] = useState("");
  const [weighInMsg, setWeighInMsg] = useState("");

  // ── PRs ──
  const prs = useMemo(() => {
    const map = {};
    workouts.forEach(w => w.exercises?.forEach(ex => ex.sets?.forEach(s => {
      if (!s.weight || !s.reps) return;
      const e = est1RM(s.weight, s.reps);
      const weight = parseFloat(s.weight) || 0;
      if (!map[ex.name]) map[ex.name] = { byE1rm: null, byWeight: null };
      if (e && (!map[ex.name].byE1rm || e > map[ex.name].byE1rm.e1rm))
        map[ex.name].byE1rm = { weight: s.weight, reps: s.reps, e1rm: e, date: w.date };
      if (!map[ex.name].byWeight || weight > parseFloat(map[ex.name].byWeight.weight || 0))
        map[ex.name].byWeight = { weight: s.weight, reps: s.reps, e1rm: e, date: w.date };
    })));
    return map;
  }, [workouts]);

  const prList = useMemo(() => {
    const entries = Object.entries(prs).map(([name, rec]) => {
      const pr = prMode === "e1rm" ? rec.byE1rm : rec.byWeight;
      return pr ? [name, pr] : null;
    }).filter(Boolean);
    if (prMode === "e1rm") return entries.sort((a, b) => (b[1].e1rm || 0) - (a[1].e1rm || 0));
    return entries.sort((a, b) => (parseFloat(b[1].weight) || 0) - (parseFloat(a[1].weight) || 0));
  }, [prs, prMode]);

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
    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    for (let i = dates.length - 1; i >= 0; i--) {
      const d = new Date(dates[i] + "T00:00:00");
      const prev = i < dates.length - 1 ? new Date(dates[i + 1] + "T00:00:00") : todayMidnight;
      const gap = Math.round((prev - d) / 86400000);
      if (gap <= 3) s++; else break;
    }
    for (let i = 1; i < dates.length; i++) {
      const gap = Math.round((new Date(dates[i] + "T00:00:00") - new Date(dates[i - 1] + "T00:00:00")) / 86400000);
      if (gap <= 3) ts++; else { ms = Math.max(ms, ts); ts = 1; }
    }
    ms = Math.max(ms, ts);
    if (dates.length === 0) { s = 0; ms = 0; }
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    const tw = workouts.filter(w => new Date(w.date + "T00:00:00") >= weekAgo).length;
    return { streak: s, maxStreak: ms, thisWeek: tw };
  }, [workouts]);

  // ── Exercise names (sorted by frequency, pinned lifts first) ──
  const allExerciseNames = useMemo(() => {
    const freq = {};
    workouts.forEach(w => w.exercises?.forEach(e => { freq[e.name] = (freq[e.name] || 0) + 1; }));
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).map(([name]) => name);
  }, [workouts]);

  const pinnedLifts = profile.pinnedLifts || null;

  // Exercise names with pinned lifts at top for the progress dropdown
  const exerciseNames = useMemo(() => {
    if (!pinnedLifts || pinnedLifts.length === 0) return allExerciseNames;
    const pinSet = new Set(pinnedLifts);
    const pinned = pinnedLifts.filter(n => allExerciseNames.includes(n));
    const rest = allExerciseNames.filter(n => !pinSet.has(n));
    return [...pinned, ...rest];
  }, [allExerciseNames, pinnedLifts]);

  const activeChartExercise = chartExercise || exerciseNames[0] || "Bench Press";

  // ── Top lifts (user-configured or auto top 6) ──
  const topLifts = useMemo(() => {
    const names = pinnedLifts && pinnedLifts.length > 0
      ? pinnedLifts.filter(n => prs[n])
      : prList.slice(0, 6).map(([name]) => name);
    return names.map(name => {
      const rec = prs[name];
      const pr = prMode === "e1rm" ? rec?.byE1rm : rec?.byWeight;
      return pr ? { name, ...pr } : null;
    }).filter(Boolean);
  }, [pinnedLifts, prList, prs, prMode]);

  // ── Top lift editor state ──
  const [tmpPinned, setTmpPinned] = useState(pinnedLifts || []);

  function openEditTopLifts() {
    setTmpPinned(pinnedLifts || prList.slice(0, 6).map(([n]) => n));
    setEditingTopLifts(true);
  }

  function togglePinnedLift(name) {
    setTmpPinned(prev => prev.includes(name)
      ? prev.filter(n => n !== name)
      : prev.length < 8 ? [...prev, name] : prev
    );
  }

  async function savePinnedLifts() {
    await updateProfile({ ...profile, pinnedLifts: tmpPinned });
    setEditingTopLifts(false);
  }

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

  // Check if weigh-in is needed (no entry in last 7 days)
  const lastWeighIn = profile.bioHistory?.length > 0
    ? profile.bioHistory[profile.bioHistory.length - 1]
    : null;
  const daysSinceWeighIn = lastWeighIn
    ? Math.floor((Date.now() - new Date(lastWeighIn.date + "T12:00:00").getTime()) / 86400000)
    : Infinity;
  const needsWeighIn = daysSinceWeighIn >= 7;

  async function logWeighIn() {
    const w = parseFloat(weighInWeight);
    if (!w || w < 50 || w > 600) { setWeighInMsg("Enter a valid weight"); return; }
    try {
      await api.post("/profile/weigh-in", { weight: w });
      // Re-save profile with updated weight to trigger full refresh
      await updateProfile({ ...profile, weight: w });
      setWeighInWeight("");
      setWeighInMsg("Logged!");
      setTimeout(() => setWeighInMsg(""), 2000);
    } catch (e) {
      setWeighInMsg("Error: " + e.message);
    }
  }

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

  const tooltipStyle = {
    contentStyle: { background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 6, fontSize: 11, fontFamily: "inherit" },
    itemStyle: { color: "var(--text)" },
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
          <div style={S.statL}>Volume</div>
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
            <div style={{ fontSize: 10, color: "var(--text-dim)" }}>×1,000 lbs</div>
          </div>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={weeklyVolume}>
              <XAxis dataKey="label" tick={{ fill: "var(--text-dim)", fontSize: 9 }} axisLine={{ stroke: "var(--border)" }} tickLine={false} interval={1} />
              <YAxis tick={{ fill: "var(--text-dim)", fontSize: 9 }} axisLine={{ stroke: "var(--border)" }} tickLine={false} width={28} />
              <Tooltip {...tooltipStyle} formatter={(val, name) => [name === "volume" ? `${val}k lbs` : val, name === "volume" ? "Volume" : "Sessions"]} />
              <Bar dataKey="volume" fill="var(--accent)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Top Lifts ── */}
      {(topLifts.length > 0 || editingTopLifts) && (
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={S.label}>Top Lifts</div>
            <div style={{ display: "flex", gap: 4 }}>
              {!editingTopLifts && (
                <>
                  <button onClick={() => setPrMode("e1rm")} style={{ ...S.sm(prMode === "e1rm" ? "primary" : "ghost"), fontSize: 9, padding: "3px 6px" }}>Est 1RM</button>
                  <button onClick={() => setPrMode("actual")} style={{ ...S.sm(prMode === "actual" ? "primary" : "ghost"), fontSize: 9, padding: "3px 6px" }}>Actual</button>
                  <button onClick={openEditTopLifts} style={{ ...S.sm("ghost"), fontSize: 9, padding: "3px 6px" }}>Edit</button>
                </>
              )}
              {editingTopLifts && (
                <>
                  <button onClick={savePinnedLifts} style={{ ...S.sm("primary"), fontSize: 9, padding: "3px 6px" }}>Save</button>
                  <button onClick={() => setEditingTopLifts(false)} style={{ ...S.sm("ghost"), fontSize: 9, padding: "3px 6px" }}>Cancel</button>
                </>
              )}
            </div>
          </div>

          {editingTopLifts ? (
            <div>
              <div style={{ fontSize: 10, color: "var(--text-dim)", marginBottom: 6 }}>Tap to toggle (max 8). Selected: {tmpPinned.length}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, maxHeight: 200, overflowY: "auto" }}>
                {allExerciseNames.map(name => {
                  const selected = tmpPinned.includes(name);
                  return (
                    <button key={name} onClick={() => togglePinnedLift(name)} style={{
                      ...S.sm(selected ? "primary" : "ghost"),
                      fontSize: 10, padding: "4px 8px",
                      opacity: selected || tmpPinned.length < 8 ? 1 : 0.4,
                    }}>
                      {name}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {topLifts.map(lift => {
                const isRecent = daysSince(lift.date) <= 30;
                const primary = prMode === "e1rm" ? (lift.e1rm || "—") : lift.weight;
                const secondary = prMode === "e1rm" ? `${lift.weight}×${lift.reps}` : `~${lift.e1rm || "?"} e1RM`;
                return (
                  <div key={lift.name} style={{ background: "var(--surface2)", borderRadius: 8, padding: 10, border: "1px solid var(--border)" }}>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", lineHeight: 1.3 }}>{lift.name}</div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 4 }}>
                      <span style={{ fontSize: 22, fontWeight: 800, color: "var(--text-bright)" }}>{primary}</span>
                      {prMode === "actual" && <span style={{ fontSize: 12, color: "var(--text-dim)" }}>×{lift.reps}</span>}
                      {isRecent && (
                        <span style={{ fontSize: 8, fontWeight: 700, color: "#22c55e", textTransform: "uppercase", letterSpacing: "0.5px" }}>New</span>
                      )}
                    </div>
                    <div style={{ fontSize: 10, color: "var(--text-dim)" }}>{secondary}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Progress Chart ── */}
      {exerciseNames.length > 0 && (
        <div style={S.card}>
          <div style={S.label}>Exercise Progress</div>
          <select
            value={activeChartExercise}
            onChange={e => setChartExercise(e.target.value)}
            style={{ ...S.input, fontSize: 12, marginBottom: 10, background: "var(--surface2)", height: 44 }}
          >
            {pinnedLifts && pinnedLifts.length > 0 && (
              <optgroup label="Pinned">
                {pinnedLifts.filter(n => allExerciseNames.includes(n)).map(n => <option key={`pin-${n}`} value={n}>{n}</option>)}
              </optgroup>
            )}
            <optgroup label={pinnedLifts && pinnedLifts.length > 0 ? "All Exercises" : "Exercises"}>
              {allExerciseNames.filter(n => !pinnedLifts?.includes(n)).map(n => <option key={n} value={n}>{n}</option>)}
            </optgroup>
          </select>
          {chartData.length > 1 ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData}>
                <XAxis dataKey="date" tick={{ fill: "var(--text-dim)", fontSize: 10 }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
                <YAxis tick={{ fill: "var(--text-dim)", fontSize: 10 }} axisLine={{ stroke: "var(--border)" }} tickLine={false} width={35} />
                <Tooltip {...tooltipStyle} />
                <Line type="monotone" dataKey="weight" stroke="var(--accent)" strokeWidth={2} dot={{ fill: "var(--accent)", r: 3 }} name="Weight" />
                <Line type="monotone" dataKey="e1rm" stroke="var(--text-dim)" strokeWidth={1} strokeDasharray="4 4" dot={false} name="Est 1RM" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ color: "var(--text-dim)", fontSize: 12, padding: 20, textAlign: "center" }}>
              {chartData.length === 1 ? "One session logged — chart shows after 2+" : "No data for this exercise"}
            </div>
          )}
        </div>
      )}

      {/* ── Body Weight Trend ── */}
      <div style={S.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={S.label}>Body Weight Trend</div>
          {needsWeighIn && <span style={{ fontSize: 9, color: "var(--accent)", fontWeight: 600 }}>WEIGH IN DUE</span>}
        </div>
        {bwData.length > 1 ? (
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={bwData}>
              <XAxis dataKey="date" tick={{ fill: "var(--text-dim)", fontSize: 10 }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
              <YAxis tick={{ fill: "var(--text-dim)", fontSize: 10 }} axisLine={{ stroke: "var(--border)" }} tickLine={false} width={35} domain={["dataMin - 5", "dataMax + 5"]} />
              <Tooltip {...tooltipStyle} />
              <Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6", r: 3 }} name="Lbs" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ color: "var(--text-dim)", fontSize: 12, padding: 12, textAlign: "center" }}>
            {bwData.length === 1 ? `Current: ${bwData[0].weight} lbs — log more to see trend` : "No weigh-ins yet"}
          </div>
        )}
        {/* Weigh-in input */}
        <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
          <input
            type="number" inputMode="decimal"
            value={weighInWeight}
            onChange={e => setWeighInWeight(e.target.value)}
            placeholder={profile.weight ? `${profile.weight}` : "Weight"}
            style={{ ...S.smInput, flex: 1, textAlign: "left", padding: "6px 10px", fontSize: 13 }}
          />
          <span style={{ fontSize: 11, color: "var(--text-dim)" }}>lbs</span>
          <button onClick={logWeighIn} style={{ ...S.sm("primary"), padding: "6px 14px", fontSize: 11 }}>Log</button>
        </div>
        {weighInMsg && <div style={{ fontSize: 10, color: weighInMsg.startsWith("Error") ? "#ef4444" : "#22c55e", marginTop: 4 }}>{weighInMsg}</div>}
      </div>

      {/* ── All PRs ── */}
      <div style={S.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={S.label}>
            {prFilter === "recent" ? "Recent PRs" : "All PRs"}
            {prFilter === "all" && <span style={{ color: "var(--text-dim)", fontWeight: 400 }}> ({prList.length})</span>}
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
            <div key={name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid var(--surface2)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{name}</div>
                {isRecent && prFilter !== "recent" && (
                  <span style={{ fontSize: 8, fontWeight: 700, color: "#22c55e", textTransform: "uppercase" }}>New</span>
                )}
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: 12, color: "var(--text-light)", fontWeight: 600 }}>{primary}</span>
                <span style={{ fontSize: 11, color: "var(--text-dim)", marginLeft: 6 }}>{secondary}</span>
                <span style={{ fontSize: 9, color: "var(--text-dim)", marginLeft: 6 }}>{pr.date.slice(5)}</span>
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
        {prList.length === 0 && <div style={{ color: "var(--text-dim)", fontSize: 12, padding: 8 }}>Log workouts to see PRs</div>}
      </div>

    </div>
  );
}

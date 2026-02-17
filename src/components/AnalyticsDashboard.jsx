// ═══════════════════════ ANALYTICS DASHBOARD ═══════════════════════
// Admin-only dashboard showing key metrics: DAU, workouts, feature adoption,
// AI coach usage, and user activity. Data from /api/admin/analytics.

import React, { useState, useEffect } from "react";
import api from "../lib/api";
import S from "../lib/styles";

function StatCard({ label, value, sub }) {
  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 10,
      padding: "14px 16px",
      flex: "1 1 45%",
      minWidth: 120,
    }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: "var(--accent)", lineHeight: 1.2 }}>{value}</div>
      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2, fontWeight: 600 }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 1 }}>{sub}</div>}
    </div>
  );
}

function MiniBar({ label, value, max, color = "var(--accent)" }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
        <span style={{ color: "var(--text-light)", fontWeight: 500 }}>{label}</span>
        <span style={{ color: "var(--text-muted)" }}>{value}</span>
      </div>
      <div style={{ height: 6, background: "var(--border)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3, transition: "width 0.3s" }} />
      </div>
    </div>
  );
}

export default function AnalyticsDashboard({ onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [period, setPeriod] = useState(30);

  useEffect(() => {
    loadData();
  }, [period]);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const d = await api.get(`/admin/analytics?days=${period}`);
      setData(d);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "var(--overlay)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ ...S.card, margin: 0, maxWidth: 480, width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={S.label}>📊 Analytics</div>
          <button onClick={onBack} style={S.sm()}>← Back</button>
        </div>

        {/* Period selector */}
        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          {[7, 30, 90].map(d => (
            <button
              key={d}
              onClick={() => setPeriod(d)}
              style={{
                ...S.sm(d === period ? "primary" : undefined),
                fontSize: 10,
                padding: "5px 10px",
              }}
            >
              {d}d
            </button>
          ))}
        </div>

        {loading && <div style={{ color: "var(--text-muted)", fontSize: 13, textAlign: "center", padding: 20 }}>Loading analytics...</div>}
        {error && <div style={{ color: "#ef4444", fontSize: 12, marginBottom: 12 }}>{error}</div>}

        {data && !loading && (
          <>
            {/* Top-level stats */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
              <StatCard label="Total Users" value={data.totals.users} />
              <StatCard label="Total Workouts" value={data.totals.workouts} />
              <StatCard label="Active (7d)" value={data.totals.activeLastWeek} sub={`of ${data.totals.users} users`} />
              <StatCard label="Active (30d)" value={data.totals.activeLastMonth} sub={`${data.totals.users > 0 ? Math.round((data.totals.activeLastMonth / data.totals.users) * 100) : 0}% retention`} />
            </div>

            {/* AI Coach usage */}
            <div style={{ ...S.card, margin: "0 0 16px 0", padding: "12px 14px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-bright)", marginBottom: 8 }}>⚡ AI Coach Usage ({period}d)</div>
              <div style={{ display: "flex", gap: 16, fontSize: 12 }}>
                <div>
                  <span style={{ color: "var(--accent)", fontWeight: 700, fontSize: 18 }}>{data.coachUsage.messages}</span>
                  <div style={{ fontSize: 10, color: "var(--text-muted)" }}>messages</div>
                </div>
                <div>
                  <span style={{ color: "var(--accent)", fontWeight: 700, fontSize: 18 }}>{data.coachUsage.users}</span>
                  <div style={{ fontSize: 10, color: "var(--text-muted)" }}>users</div>
                </div>
              </div>
            </div>

            {/* Feature Adoption */}
            {data.featureAdoption.length > 0 && (
              <div style={{ ...S.card, margin: "0 0 16px 0", padding: "12px 14px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-bright)", marginBottom: 10 }}>Feature Adoption ({period}d)</div>
                {data.featureAdoption.map(f => (
                  <MiniBar
                    key={f.event}
                    label={f.event.replace(/_/g, " ")}
                    value={`${f.users} user${f.users !== 1 ? "s" : ""} · ${f.total}×`}
                    max={data.totals.users}
                    color={f.users === data.totals.users ? "#22c55e" : "var(--accent)"}
                  />
                ))}
              </div>
            )}

            {/* Workouts per week */}
            {data.workoutsPerWeek.length > 0 && (
              <div style={{ ...S.card, margin: "0 0 16px 0", padding: "12px 14px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-bright)", marginBottom: 10 }}>Workouts per Week</div>
                {data.workoutsPerWeek.slice(0, 8).map(w => (
                  <MiniBar
                    key={w.week}
                    label={`${w.week}`}
                    value={`${w.workouts} (${w.per_user}/user)`}
                    max={Math.max(...data.workoutsPerWeek.map(x => x.workouts))}
                    color="#22c55e"
                  />
                ))}
              </div>
            )}

            {/* Daily active users */}
            {data.dau.length > 0 && (
              <div style={{ ...S.card, margin: "0 0 16px 0", padding: "12px 14px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-bright)", marginBottom: 10 }}>Daily Active Users</div>
                {data.dau.slice(0, 14).map(d => (
                  <MiniBar
                    key={d.day}
                    label={new Date(d.day + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    value={d.users}
                    max={data.totals.users}
                    color="#3b82f6"
                  />
                ))}
              </div>
            )}

            {/* Top users */}
            {data.topUsers.length > 0 && (
              <div style={{ ...S.card, margin: "0 0 16px 0", padding: "12px 14px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-bright)", marginBottom: 10 }}>Most Active Users ({period}d)</div>
                {data.topUsers.map((u, i) => (
                  <div key={u.user_id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", borderBottom: i < data.topUsers.length - 1 ? "1px solid var(--border)" : "none" }}>
                    <span style={{ fontSize: 11, color: "var(--text-dim)", width: 18, textAlign: "center" }}>{i + 1}</span>
                    <span style={{ fontSize: 12, color: "var(--text-light)", flex: 1, fontWeight: 500 }}>{u.name}</span>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{u.events} events</span>
                  </div>
                ))}
              </div>
            )}

            {/* Registrations */}
            {data.registrations.length > 0 && (
              <div style={{ ...S.card, margin: "0 0 16px 0", padding: "12px 14px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-bright)", marginBottom: 10 }}>Signups</div>
                {data.registrations.slice(0, 14).map(r => (
                  <MiniBar
                    key={r.day}
                    label={new Date(r.day + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    value={r.signups}
                    max={Math.max(...data.registrations.map(x => x.signups))}
                    color="#a855f7"
                  />
                ))}
              </div>
            )}

            {/* Event log summary */}
            {data.eventCounts.length > 0 && (
              <div style={{ ...S.card, margin: "0 0 8px 0", padding: "12px 14px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-bright)", marginBottom: 10 }}>Raw Event Counts ({period}d)</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "4px 12px", fontSize: 11 }}>
                  {data.eventCounts.map(e => (
                    <React.Fragment key={e.event}>
                      <span style={{ color: "var(--text-light)" }}>{e.event}</span>
                      <span style={{ color: "var(--text-muted)", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{e.count}</span>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

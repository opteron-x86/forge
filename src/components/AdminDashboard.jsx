// ═══════════════════════ ADMIN DASHBOARD ═══════════════════════
// Full-page admin dashboard with tabs: Users, Analytics, AI Status, Event Log.
// Replaces the main app view when open. Admin-only access.

import { useState, useEffect, useCallback } from "react";
import { useTalos } from "../context/TalosContext";
import api from "../lib/api";
import S from "../lib/styles";

// ─── Shared UI Components ────────────────────────────────────

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 10,
      padding: "14px 16px",
      flex: "1 1 45%",
      minWidth: 120,
    }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: color || "var(--accent)", lineHeight: 1.2 }}>{value}</div>
      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2, fontWeight: 600 }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 1 }}>{sub}</div>}
    </div>
  );
}

function MiniBar({ label, value, max, color = "var(--accent)" }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const displayValue = typeof value === "number" ? value : value;
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
        <span style={{ color: "var(--text-light)", fontWeight: 500 }}>{label}</span>
        <span style={{ color: "var(--text-muted)" }}>{displayValue}</span>
      </div>
      <div style={{ height: 6, background: "var(--border)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3, transition: "width 0.3s" }} />
      </div>
    </div>
  );
}

function Section({ title, children, style: extraStyle }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px", marginBottom: 12, ...extraStyle }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-bright)", marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  );
}

function Pill({ active, children, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: "6px 12px",
      borderRadius: 6,
      border: active ? "1px solid var(--accent)" : "1px solid var(--border2)",
      background: active ? "var(--accent-bg)" : "transparent",
      color: active ? "var(--accent)" : "var(--text-muted)",
      fontSize: 11,
      fontWeight: 700,
      fontFamily: "inherit",
      cursor: "pointer",
      letterSpacing: "0.3px",
      minHeight: 36,
    }}>
      {children}
    </button>
  );
}

function Badge({ color, children }) {
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 7px",
      borderRadius: 4,
      background: (color || "var(--accent)") + "20",
      color: color || "var(--accent)",
      fontSize: 9,
      fontWeight: 700,
      letterSpacing: "0.5px",
      textTransform: "uppercase",
      marginLeft: 6,
    }}>
      {children}
    </span>
  );
}

// ─── Users Tab ────────────────────────────────────────────────

function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  useEffect(() => { loadUsers(); }, []);

  async function loadUsers() {
    try {
      const data = await api.get("/admin/users");
      setUsers(data);
    } catch (e) {
      setMsg("Error: " + e.message);
    }
    setLoading(false);
  }

  async function toggleActive(userId, currentlyActive) {
    setMsg("");
    try {
      await api.put(`/admin/users/${userId}/status`, { is_active: !currentlyActive });
      setMsg(currentlyActive ? "User deactivated" : "User reactivated");
      loadUsers();
    } catch (e) { setMsg("Error: " + e.message); }
  }

  async function toggleTier(userId, currentTier) {
    setMsg("");
    const newTier = currentTier === "pro" ? "free" : "pro";
    try {
      await api.put(`/admin/users/${userId}/tier`, { tier: newTier });
      setMsg(`Tier updated to ${newTier}`);
      loadUsers();
    } catch (e) { setMsg("Error: " + e.message); }
  }

  async function deleteUser(userId, userName) {
    if (!confirm(`Delete ${userName} and ALL their data? This cannot be undone.`)) return;
    if (!confirm(`Are you absolutely sure? This deletes workouts, programs, messages — everything.`)) return;
    setMsg("");
    try {
      await api.del(`/admin/users/${userId}`);
      setMsg(`${userName} deleted`);
      loadUsers();
    } catch (e) { setMsg("Error: " + e.message); }
  }

  if (loading) return <div style={{ color: "var(--text-muted)", fontSize: 13, textAlign: "center", padding: 30 }}>Loading users...</div>;

  const proCount = users.filter(u => u.tier === "pro").length;
  const activeCount = users.filter(u => u.is_active !== false).length;

  return (
    <div>
      {/* Summary stats */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <StatCard label="Total Users" value={users.length} />
        <StatCard label="Active" value={activeCount} color="#22c55e" />
        <StatCard label="Pro Tier" value={proCount} color="#a855f7" />
        <StatCard label="Free Tier" value={users.length - proCount} color="var(--text-muted)" />
      </div>

      {msg && <div style={{ fontSize: 11, color: msg.startsWith("Error") ? "#ef4444" : "#22c55e", marginBottom: 12, padding: "6px 10px", background: msg.startsWith("Error") ? "#ef444415" : "#22c55e15", borderRadius: 6 }}>{msg}</div>}

      {/* User list */}
      {users.map(u => (
        <div key={u.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 14px", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{ ...S.avatar(u.color || "#666"), width: 32, height: 32, fontSize: 13 }}>{u.name?.[0]?.toUpperCase()}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: u.is_active !== false ? "var(--text-bright)" : "var(--text-dim)", display: "flex", alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name}</span>
                {u.role === "admin" && <Badge color="#f97316">Admin</Badge>}
                {u.tier === "pro" && <Badge color="#a855f7">Pro</Badge>}
                {!u.is_active && <Badge color="#ef4444">Inactive</Badge>}
              </div>
              <div style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 1 }}>{u.email || "No email"}</div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-light)" }}>{u.workoutCount}</div>
              <div style={{ fontSize: 9, color: "var(--text-dim)" }}>workouts</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", flexWrap: "wrap" }}>
            <button
              onClick={() => toggleTier(u.id, u.tier || "free")}
              style={{ ...S.sm(), fontSize: 10, color: u.tier === "pro" ? "var(--text-muted)" : "#a855f7" }}
            >
              {u.tier === "pro" ? "→ Free" : "→ Pro"}
            </button>
            <button
              onClick={() => toggleActive(u.id, u.is_active !== false)}
              style={{ ...S.sm(), fontSize: 10, color: u.is_active !== false ? "#f97316" : "#22c55e" }}
            >
              {u.is_active !== false ? "Deactivate" : "Reactivate"}
            </button>
            <button
              onClick={() => deleteUser(u.id, u.name)}
              style={{ ...S.sm(), fontSize: 10, color: "#ef4444" }}
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Analytics Tab ────────────────────────────────────────────

function AnalyticsTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30);

  useEffect(() => {
    setLoading(true);
    api.get(`/admin/analytics?days=${period}`)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [period]);

  if (loading) return <div style={{ color: "var(--text-muted)", fontSize: 13, textAlign: "center", padding: 30 }}>Loading analytics...</div>;
  if (!data) return <div style={{ color: "#ef4444", fontSize: 13, textAlign: "center", padding: 30 }}>Failed to load analytics</div>;

  return (
    <div>
      {/* Period selector */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {[7, 30, 90].map(d => (
          <Pill key={d} active={d === period} onClick={() => setPeriod(d)}>{d}d</Pill>
        ))}
      </div>

      {/* Top stats */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        <StatCard label="Total Users" value={data.totals.users} />
        <StatCard label="Total Workouts" value={data.totals.workouts} />
        <StatCard label="Active (7d)" value={data.totals.activeLastWeek} sub={`of ${data.totals.users}`} color="#22c55e" />
        <StatCard label="Active (30d)" value={data.totals.activeLastMonth} sub={`${data.totals.users > 0 ? Math.round((data.totals.activeLastMonth / data.totals.users) * 100) : 0}% retention`} color="#3b82f6" />
      </div>

      {/* AI Coach usage */}
      <Section title="⚡ AI Coach Usage">
        <div style={{ display: "flex", gap: 20, fontSize: 12 }}>
          <div>
            <span style={{ color: "var(--accent)", fontWeight: 700, fontSize: 20 }}>{data.coachUsage.messages}</span>
            <div style={{ fontSize: 10, color: "var(--text-muted)" }}>messages</div>
          </div>
          <div>
            <span style={{ color: "var(--accent)", fontWeight: 700, fontSize: 20 }}>{data.coachUsage.users}</span>
            <div style={{ fontSize: 10, color: "var(--text-muted)" }}>users</div>
          </div>
        </div>
      </Section>

      {/* Feature Adoption */}
      {data.featureAdoption.length > 0 && (
        <Section title="Feature Adoption">
          {data.featureAdoption.map(f => (
            <MiniBar
              key={f.event}
              label={f.event.replace(/_/g, " ")}
              value={`${f.users} user${f.users !== 1 ? "s" : ""} · ${f.total}×`}
              max={data.totals.users}
              color={f.users === data.totals.users ? "#22c55e" : "var(--accent)"}
            />
          ))}
        </Section>
      )}

      {/* Workouts per week */}
      {data.workoutsPerWeek.length > 0 && (
        <Section title="Workouts per Week">
          {data.workoutsPerWeek.slice(0, 8).map(w => (
            <MiniBar
              key={w.week}
              label={w.week}
              value={`${w.workouts} (${w.per_user}/user)`}
              max={Math.max(...data.workoutsPerWeek.map(x => x.workouts))}
              color="#22c55e"
            />
          ))}
        </Section>
      )}

      {/* DAU */}
      {data.dau.length > 0 && (
        <Section title="Daily Active Users">
          {data.dau.slice(0, 14).map(d => (
            <MiniBar
              key={d.day}
              label={new Date(d.day + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              value={d.users}
              max={data.totals.users}
              color="#3b82f6"
            />
          ))}
        </Section>
      )}

      {/* Top users */}
      {data.topUsers.length > 0 && (
        <Section title="Most Active Users">
          {data.topUsers.map((u, i) => (
            <div key={u.user_id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", borderBottom: i < data.topUsers.length - 1 ? "1px solid var(--border)" : "none" }}>
              <span style={{ fontSize: 11, color: "var(--text-dim)", width: 18, textAlign: "center" }}>{i + 1}</span>
              <span style={{ fontSize: 12, color: "var(--text-light)", flex: 1, fontWeight: 500 }}>{u.name}</span>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{u.events} events</span>
            </div>
          ))}
        </Section>
      )}

      {/* Signups */}
      {data.registrations.length > 0 && (
        <Section title="Signups">
          {data.registrations.slice(0, 14).map(r => (
            <MiniBar
              key={r.day}
              label={new Date(r.day + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              value={r.signups}
              max={Math.max(...data.registrations.map(x => x.signups))}
              color="#a855f7"
            />
          ))}
        </Section>
      )}

      {/* Raw events */}
      {data.eventCounts.length > 0 && (
        <Section title="Raw Event Counts">
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "4px 12px", fontSize: 11 }}>
            {data.eventCounts.map(e => (
              <div key={e.event} style={{ display: "contents" }}>
                <span style={{ color: "var(--text-light)" }}>{e.event}</span>
                <span style={{ color: "var(--text-muted)", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{e.count}</span>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

// ─── AI Status Tab ────────────────────────────────────────────

function AIStatusTab() {
  const [tier, setTier] = useState(null);
  const [config, setConfig] = useState(null);
  const [usage, setUsage] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/ai/tier").catch(() => null),
      api.get("/ai/config").catch(() => null),
      api.get("/admin/analytics?days=30").catch(() => null),
    ]).then(([t, c, analytics]) => {
      setTier(t);
      setConfig(c);
      // Extract per-user AI usage from analytics
      if (analytics?.featureAdoption) {
        const aiEvents = analytics.featureAdoption.filter(f => f.event.startsWith("coach_"));
        setUsage(aiEvents);
      }
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={{ color: "var(--text-muted)", fontSize: 13, textAlign: "center", padding: 30 }}>Loading AI status...</div>;

  const providerColor = (enabled) => enabled ? "#22c55e" : "#ef4444";

  return (
    <div>
      {/* Provider Health */}
      <Section title="🔌 Provider Status">
        <div style={{ display: "grid", gap: 10 }}>
          {/* Pro provider */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "var(--surface2)", borderRadius: 8 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-bright)" }}>Pro Provider</div>
              <div style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 2 }}>
                {config?.provider ? `${config.providerName || config.provider} — ${config.model}` : "Not configured"}
              </div>
            </div>
            <div style={{
              width: 10, height: 10, borderRadius: "50%",
              background: providerColor(config?.enabled),
              boxShadow: config?.enabled ? "0 0 8px #22c55e60" : "0 0 8px #ef444460",
            }} />
          </div>

          {/* Free provider */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "var(--surface2)", borderRadius: 8 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-bright)" }}>Free Provider</div>
              <div style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 2 }}>
                {tier?.freeProviderEnabled ? "Gemini 2.0 Flash" : "Not configured (no GEMINI_API_KEY)"}
              </div>
            </div>
            <div style={{
              width: 10, height: 10, borderRadius: "50%",
              background: providerColor(tier?.freeProviderEnabled),
              boxShadow: tier?.freeProviderEnabled ? "0 0 8px #22c55e60" : "0 0 8px #ef444460",
            }} />
          </div>
        </div>
      </Section>

      {/* Feature Availability */}
      {tier?.features && (
        <Section title="🎯 Feature Access by Tier">
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: "6px 16px", fontSize: 11, alignItems: "center" }}>
            <div style={{ fontWeight: 700, color: "var(--text-muted)", fontSize: 10 }}>FEATURE</div>
            <div style={{ fontWeight: 700, color: "var(--text-muted)", fontSize: 10, textAlign: "center" }}>FREE</div>
            <div style={{ fontWeight: 700, color: "var(--text-muted)", fontSize: 10, textAlign: "center" }}>PRO</div>
            {Object.entries(tier.features).map(([key, f]) => (
              <div key={key} style={{ display: "contents" }}>
                <span style={{ color: "var(--text-light)", fontWeight: 500 }}>{f.label}</span>
                <span style={{ textAlign: "center", fontSize: 13 }}>{f.available || key === "chat" ? "✓" : "—"}</span>
                <span style={{ textAlign: "center", fontSize: 13, color: "#22c55e" }}>✓</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Rate Limits */}
      <Section title="⏱ Rate Limits">
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: "6px 16px", fontSize: 11, alignItems: "center" }}>
          <div style={{ fontWeight: 700, color: "var(--text-muted)", fontSize: 10 }}>LIMIT</div>
          <div style={{ fontWeight: 700, color: "var(--text-muted)", fontSize: 10, textAlign: "center" }}>FREE</div>
          <div style={{ fontWeight: 700, color: "var(--text-muted)", fontSize: 10, textAlign: "center" }}>PRO</div>
          <span style={{ color: "var(--text-light)" }}>Daily</span>
          <span style={{ textAlign: "center", color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>15</span>
          <span style={{ textAlign: "center", color: "#a855f7", fontVariantNumeric: "tabular-nums" }}>50</span>
          <span style={{ color: "var(--text-light)" }}>Monthly</span>
          <span style={{ textAlign: "center", color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>200</span>
          <span style={{ textAlign: "center", color: "#a855f7", fontVariantNumeric: "tabular-nums" }}>500</span>
        </div>
      </Section>

      {/* AI Usage by Feature */}
      {usage.length > 0 && (
        <Section title="📊 AI Usage (30d)">
          {usage.map(f => (
            <MiniBar
              key={f.event}
              label={f.event.replace("coach_", "").replace(/_/g, " ")}
              value={`${f.users} user${f.users !== 1 ? "s" : ""} · ${f.total} calls`}
              max={Math.max(...usage.map(x => x.total))}
              color="#a855f7"
            />
          ))}
        </Section>
      )}

      {/* Config details */}
      {config && (
        <Section title="⚙ Configuration">
          <div style={{ fontSize: 11, display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 12px" }}>
            {[
              ["Provider", config.provider || "—"],
              ["Model", config.model || "—"],
              ["API Key", config.hasKey ? "✓ Set (env)" : "✗ Missing"],
              ["Tool Support", config.supportsTools ? "Enabled" : "Disabled"],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "contents" }}>
                <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>{k}</span>
                <span style={{ color: "var(--text-light)", fontFamily: "monospace", fontSize: 11 }}>{v}</span>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

// ─── Event Log Tab ────────────────────────────────────────────

function EventLogTab() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [limit, setLimit] = useState(100);

  const loadEvents = useCallback(() => {
    setLoading(true);
    const query = filter ? `/admin/analytics/events?limit=${limit}&event=${filter}` : `/admin/analytics/events?limit=${limit}`;
    api.get(query)
      .then(data => { setEvents(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [filter, limit]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  // Extract unique event types for quick filters
  const eventTypes = [...new Set(events.map(e => e.event))].sort();

  function formatTime(ts) {
    if (!ts) return "—";
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  }

  function eventColor(event) {
    if (event.startsWith("coach_")) return "#a855f7";
    if (event.startsWith("workout_")) return "#22c55e";
    if (event.startsWith("program_")) return "#3b82f6";
    if (event === "login" || event === "register") return "#f97316";
    return "var(--text-muted)";
  }

  return (
    <div>
      {/* Controls */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center", flexWrap: "wrap" }}>
        <button onClick={loadEvents} style={{ ...S.sm("primary"), fontSize: 10, padding: "5px 10px" }}>
          ↻ Refresh
        </button>
        <Pill active={!filter} onClick={() => setFilter("")}>All</Pill>
        {eventTypes.slice(0, 8).map(t => (
          <Pill key={t} active={filter === t} onClick={() => setFilter(t)}>
            {t.replace(/_/g, " ")}
          </Pill>
        ))}
      </div>

      {/* Count */}
      <div style={{ fontSize: 10, color: "var(--text-dim)", marginBottom: 10 }}>
        {events.length} event{events.length !== 1 ? "s" : ""}{filter ? ` (filtered: ${filter})` : ""}
      </div>

      {loading && <div style={{ color: "var(--text-muted)", fontSize: 13, textAlign: "center", padding: 20 }}>Loading events...</div>}

      {/* Event stream */}
      {!loading && events.map((e, i) => (
        <div key={e.id || i} style={{
          display: "flex", gap: 10, alignItems: "flex-start",
          padding: "8px 0",
          borderBottom: i < events.length - 1 ? "1px solid var(--border)" : "none",
        }}>
          {/* Color dot */}
          <div style={{
            width: 8, height: 8, borderRadius: "50%", marginTop: 4, flexShrink: 0,
            background: eventColor(e.event),
          }} />

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <span style={{
                fontSize: 11, fontWeight: 600, color: eventColor(e.event),
                fontFamily: "monospace",
              }}>
                {e.event}
              </span>
              <span style={{ fontSize: 10, color: "var(--text-dim)", flexShrink: 0 }}>{formatTime(e.created_at)}</span>
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>
              {e.name || e.email || e.user_id?.slice(0, 8)}
            </div>
            {e.meta && e.meta !== "null" && (
              <div style={{ fontSize: 10, color: "var(--text-dim)", fontFamily: "monospace", marginTop: 2, wordBreak: "break-all" }}>
                {typeof e.meta === "string" ? e.meta : JSON.stringify(e.meta)}
              </div>
            )}
          </div>
        </div>
      ))}

      {!loading && events.length === 0 && (
        <div style={{ color: "var(--text-muted)", fontSize: 13, textAlign: "center", padding: 30 }}>No events found.</div>
      )}

      {/* Load more */}
      {!loading && events.length >= limit && (
        <button
          onClick={() => setLimit(l => l + 100)}
          style={{ ...S.sm(), width: "100%", marginTop: 12, justifyContent: "center" }}
        >
          Load More
        </button>
      )}
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────

const TABS = [
  { id: "users", label: "Users", icon: "👤" },
  { id: "analytics", label: "Analytics", icon: "📊" },
  { id: "ai", label: "AI Status", icon: "⚡" },
  { id: "events", label: "Event Log", icon: "📋" },
];

export default function AdminDashboard({ onClose }) {
  const [activeTab, setActiveTab] = useState("users");

  return (
    <div style={{
      fontFamily: "var(--font)",
      background: "var(--bg)",
      color: "var(--text)",
      minHeight: "100dvh",
      maxWidth: 520,
      margin: "0 auto",
      position: "relative",
    }}>
      {/* Header */}
      <div style={{
        padding: "16px 16px 10px",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.5px", color: "var(--text-bright)", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}>🛡</span>
            Admin
          </div>
          <button onClick={onClose} style={S.sm()}>← Back</button>
        </div>

        {/* Tab bar */}
        <div style={{
          display: "flex",
          gap: 2,
          marginTop: 12,
          background: "var(--surface2)",
          borderRadius: 8,
          padding: 3,
        }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                flex: 1,
                padding: "8px 4px",
                borderRadius: 6,
                border: "none",
                background: activeTab === t.id ? "var(--surface)" : "transparent",
                color: activeTab === t.id ? "var(--text-bright)" : "var(--text-muted)",
                fontSize: 10,
                fontWeight: 700,
                fontFamily: "inherit",
                cursor: "pointer",
                letterSpacing: "0.3px",
                transition: "all 0.15s ease",
                boxShadow: activeTab === t.id ? "0 1px 3px var(--shadow)" : "none",
              }}
            >
              <span style={{ fontSize: 12, display: "block", marginBottom: 2 }}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: 16, paddingBottom: 40 }}>
        {activeTab === "users" && <UsersTab />}
        {activeTab === "analytics" && <AnalyticsTab />}
        {activeTab === "ai" && <AIStatusTab />}
        {activeTab === "events" && <EventLogTab />}
      </div>
    </div>
  );
}

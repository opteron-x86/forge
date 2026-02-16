// ═══════════════════════ ADMIN PANEL ═══════════════════════
// View all users, deactivate/reactivate, delete user + data.
// Only accessible to admin users (role check happens server-side too).

import { useState, useEffect } from "react";
import api from "../lib/api";
import S from "../lib/styles";

export default function AdminPanel({ onBack }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMsg, setActionMsg] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const data = await api.get("/admin/users");
      setUsers(data);
      setLoading(false);
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  }

  async function toggleActive(userId, currentlyActive) {
    setActionMsg("");
    try {
      await api.put(`/admin/users/${userId}/status`, { is_active: !currentlyActive });
      setActionMsg(currentlyActive ? "User deactivated" : "User reactivated");
      loadUsers();
    } catch (e) {
      setActionMsg("Error: " + e.message);
    }
  }

  async function deleteUser(userId, userName) {
    if (!confirm(`Delete ${userName} and ALL their data? This cannot be undone.`)) return;
    if (!confirm(`Are you absolutely sure? This deletes workouts, programs, messages — everything.`)) return;
    setActionMsg("");
    try {
      await api.del(`/admin/users/${userId}`);
      setActionMsg(`${userName} deleted`);
      loadUsers();
    } catch (e) {
      setActionMsg("Error: " + e.message);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ ...S.card, margin: 0, maxWidth: 420, width: "100%", maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={S.label}>Admin — Users</div>
          <button onClick={onBack} style={S.sm()}>← Back</button>
        </div>

        {loading && <div style={{ color: "#737373", fontSize: 13, textAlign: "center", padding: 20 }}>Loading...</div>}
        {error && <div style={{ color: "#ef4444", fontSize: 12, marginBottom: 12 }}>{error}</div>}
        {actionMsg && <div style={{ fontSize: 11, color: actionMsg.startsWith("Error") ? "#ef4444" : "#22c55e", marginBottom: 12 }}>{actionMsg}</div>}

        {!loading && users.map(u => (
          <div key={u.id} style={{ ...S.card, margin: "0 0 8px 0", padding: "10px 12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <div style={{ ...S.avatar(u.color), width: 28, height: 28, fontSize: 12 }}>{u.name?.[0]?.toUpperCase()}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: u.is_active ? "#fafafa" : "#525252" }}>
                  {u.name}
                  {u.role === "admin" && <span style={{ ...S.tag("#c9952d"), marginLeft: 6, fontSize: 9 }}>ADMIN</span>}
                  {!u.is_active && <span style={{ ...S.tag("#ef4444"), marginLeft: 6, fontSize: 9 }}>INACTIVE</span>}
                </div>
                <div style={{ fontSize: 10, color: "#525252" }}>{u.email || "No email (legacy)"}</div>
              </div>
              <div style={{ fontSize: 11, color: "#737373", textAlign: "right" }}>
                {u.workoutCount} workout{u.workoutCount !== 1 ? "s" : ""}
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
              <button
                onClick={() => toggleActive(u.id, u.is_active)}
                style={{ ...S.sm(), fontSize: 10, color: u.is_active ? "#f97316" : "#22c55e" }}
              >
                {u.is_active ? "Deactivate" : "Reactivate"}
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

        {!loading && users.length === 0 && (
          <div style={{ color: "#737373", fontSize: 13, textAlign: "center", padding: 20 }}>No users found.</div>
        )}
      </div>
    </div>
  );
}

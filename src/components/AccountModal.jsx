// ═══════════════════════ ACCOUNT MODAL ═══════════════════════
// Account management: email, password change, data export.

import { useState } from "react";
import { useTalos } from "../context/TalosContext";
import api from "../lib/api";
import S from "../lib/styles";

export default function AccountModal({ onClose }) {
  const { user } = useTalos();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");

  async function changePassword() {
    setPasswordMsg("");
    if (newPassword.length < 8) { setPasswordMsg("Min 8 characters"); return; }
    if (newPassword !== confirmNewPassword) { setPasswordMsg("Passwords don't match"); return; }
    try {
      await api.post("/auth/change-password", { currentPassword, newPassword });
      setPasswordMsg("Password updated!");
      setCurrentPassword(""); setNewPassword(""); setConfirmNewPassword("");
    } catch (e) {
      setPasswordMsg(e.message);
    }
  }

  async function exportData() {
    try {
      const token = localStorage.getItem("talos_token");
      const res = await fetch("/api/export", { headers: { "Authorization": `Bearer ${token}` } });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "talos-export.csv"; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { alert("Export failed: " + e.message); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "var(--overlay)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ ...S.card, margin: 0, maxWidth: 360, width: "100%", maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={S.label}>Account</div>
          <button onClick={onClose} style={S.sm()}>✕</button>
        </div>

        {/* Email display */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: "var(--text-dim)", marginBottom: 3, textTransform: "uppercase" }}>Email</div>
          <div style={{ fontSize: 13, color: "var(--text-light)" }}>{user.email}</div>
          {user.role === "admin" && <span style={{ ...S.tag(), marginTop: 4, fontSize: 9, display: "inline-block" }}>ADMIN</span>}
        </div>

        {/* Change Password */}
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12, marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: "var(--text-dim)", textTransform: "uppercase", marginBottom: 8 }}>Change Password</div>
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 10, color: "var(--text-dim)", marginBottom: 3, textTransform: "uppercase" }}>Current Password</div>
            <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} style={{ ...S.input, fontSize: 12 }} autoComplete="current-password" />
          </div>
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 10, color: "var(--text-dim)", marginBottom: 3, textTransform: "uppercase" }}>New Password</div>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{ ...S.input, fontSize: 12 }} autoComplete="new-password" />
          </div>
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 10, color: "var(--text-dim)", marginBottom: 3, textTransform: "uppercase" }}>Confirm New Password</div>
            <input type="password" value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} style={{ ...S.input, fontSize: 12 }} autoComplete="new-password" />
          </div>
          {passwordMsg && <div style={{ fontSize: 11, color: passwordMsg === "Password updated!" ? "#22c55e" : "#ef4444", marginBottom: 8 }}>{passwordMsg}</div>}
          <button onClick={changePassword} style={{ ...S.btn("ghost"), width: "100%", fontSize: 11 }}>Update Password</button>
        </div>

        {/* Data Export */}
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
          <button onClick={exportData} style={{ ...S.btn("ghost"), width: "100%", fontSize: 11 }}>
            Export All Data (CSV)
          </button>
        </div>
      </div>
    </div>
  );
}

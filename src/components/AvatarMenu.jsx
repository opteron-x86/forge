// ═══════════════════════ AVATAR MENU ═══════════════════════
// Dropdown menu anchored to user avatar in the header.
// Options: Profile, Settings, Account, Admin (if admin), Logout.
// Click outside to dismiss.

import { useEffect, useRef } from "react";
import { useTalos } from "../context/TalosContext";
import S from "../lib/styles";

export default function AvatarMenu({ onProfile, onSettings, onAdmin, onAnalytics, onLogout, onClose }) {
  const { user } = useTalos();
  const menuRef = useRef(null);
  const isAdmin = user.role === "admin";

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    }
    // Delay listener to avoid instant close from the click that opened the menu
    const t = setTimeout(() => document.addEventListener("click", handleClick), 10);
    return () => {
      clearTimeout(t);
      document.removeEventListener("click", handleClick);
    };
  }, [onClose]);

  const items = [
    { label: "Profile", icon: "👤", action: onProfile },
    { label: "Settings", icon: "⚙", action: onSettings },
    ...(isAdmin ? [{ label: "Admin", icon: "🛡", action: onAdmin }] : []),
    ...(isAdmin ? [{ label: "Analytics", icon: "📊", action: onAnalytics }] : []),
    { label: "Log Out", icon: "→", action: onLogout, danger: true },
  ];

  return (
    <div
      ref={menuRef}
      style={{
        position: "absolute",
        top: "100%",
        right: 0,
        marginTop: 6,
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        padding: "4px 0",
        minWidth: 170,
        zIndex: 350,
        boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
        animation: "avatarMenuIn 0.15s ease-out",
      }}
    >
      {/* User info header */}
      <div style={{ padding: "10px 14px 8px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-bright)" }}>{user.name}</div>
        <div style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 1 }}>{user.email}</div>
      </div>

      {/* Menu items */}
      {items.map((item, i) => (
        <div key={i}>
          {item.danger && <div style={{ height: 1, background: "var(--border)", margin: "4px 0" }} />}
          <button
            onClick={() => { item.action(); onClose(); }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              width: "100%",
              padding: "10px 14px",
              border: "none",
              background: "transparent",
              color: item.danger ? "#ef4444" : "var(--text-light)",
              fontSize: 13,
              fontWeight: 500,
              fontFamily: "inherit",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <span style={{ fontSize: 14, width: 20, textAlign: "center", opacity: 0.7 }}>{item.icon}</span>
            {item.label}
          </button>
        </div>
      ))}

      <style>{`
        @keyframes avatarMenuIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

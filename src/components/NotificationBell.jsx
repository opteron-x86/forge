// ═══════════════════════ NOTIFICATION BELL ═══════════════════════
// Bell icon in the header bar. Shows a red dot when there's an
// unread MOTD. Tapping opens a dropdown with the rendered message.
// Dismiss marks the current message as read (badge clears).

import { useState, useEffect, useRef, useCallback } from "react";
import api from "../lib/api";
import MarkdownText from "./MarkdownText";

export default function NotificationBell() {
  const [motd, setMotd] = useState(null);   // { active, text, id, updatedAt, dismissed }
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const load = useCallback(() => {
    api.get("/motd").then(setMotd).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handle(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    const t = setTimeout(() => document.addEventListener("click", handle), 10);
    return () => { clearTimeout(t); document.removeEventListener("click", handle); };
  }, [open]);

  async function dismiss() {
    try {
      await api.post("/motd/dismiss");
      setMotd(prev => prev ? { ...prev, dismissed: true } : prev);
    } catch {}
  }

  const hasUnread = motd?.active && !motd?.dismissed;

  return (
    <div style={{ position: "relative" }} ref={ref}>
      {/* Bell button */}
      <button
        onClick={() => {
          setOpen(o => !o);
          if (!open) load(); // refresh on open
        }}
        title="Notifications"
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          border: open ? "1px solid var(--accent)" : "1px solid var(--border2)",
          background: open ? "var(--accent-bg)" : "transparent",
          color: open ? "var(--accent)" : "var(--text-muted)",
          fontSize: 15,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "inherit",
          position: "relative",
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {/* Unread dot */}
        {hasUnread && (
          <div style={{
            position: "absolute",
            top: 2,
            right: 2,
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#ef4444",
            boxShadow: "0 0 6px #ef444480",
          }} />
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: "absolute",
          top: "100%",
          right: 0,
          marginTop: 6,
          width: 300,
          maxHeight: 400,
          overflowY: "auto",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 10,
          boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          zIndex: 350,
          animation: "bellDropIn 0.15s ease-out",
        }}>
          {/* Header */}
          <div style={{
            padding: "10px 14px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-bright)" }}>
              Notifications
            </span>
            {motd?.active && !motd.dismissed && (
              <button
                onClick={dismiss}
                style={{
                  padding: "3px 8px",
                  borderRadius: 4,
                  border: "1px solid var(--border2)",
                  background: "transparent",
                  color: "var(--text-muted)",
                  fontSize: 9,
                  fontWeight: 700,
                  fontFamily: "inherit",
                  cursor: "pointer",
                  letterSpacing: "0.3px",
                  textTransform: "uppercase",
                }}
              >
                Mark Read
              </button>
            )}
          </div>

          {/* Content */}
          <div style={{ padding: "12px 14px" }}>
            {motd?.active ? (
              <>
                <div style={{ fontSize: 9, color: "var(--text-dim)", marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
                  <span>MESSAGE OF THE DAY</span>
                  {motd.updatedAt && (
                    <span>{new Date(motd.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                  )}
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.5, color: "var(--text-light)" }}>
                  <MarkdownText text={motd.text} />
                </div>
              </>
            ) : (
              <div style={{ fontSize: 12, color: "var(--text-dim)", textAlign: "center", padding: "16px 0" }}>
                No notifications
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes bellDropIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
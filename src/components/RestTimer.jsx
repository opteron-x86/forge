// ═══════════════════════ REST TIMER (FLOATING BAR) ═══════════════════════
// Compact fixed-position bar above the nav. Always visible during rest.
//
// Features:
// - Pinned to bottom of screen, above nav bar
// - Progress bar + countdown + skip
// - Tap countdown to add 15s, tap label to subtract 15s
// - Color shifts green → amber in last 15s
// - Vibrates + shows "Done" state on completion
// - Auto-dismisses 2s after finishing
//
// Props: seconds (initial), onDone, onCancel

import { useState, useEffect, useRef, useCallback } from "react";

export default function RestTimer({ seconds: initialSeconds, onDone, onCancel }) {
  const [total, setTotal] = useState(initialSeconds);
  const [remaining, setRemaining] = useState(initialSeconds);
  const [done, setDone] = useState(false);
  const doneTimeout = useRef(null);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (done) return;
    if (remaining <= 0) {
      try { navigator.vibrate?.([200, 100, 200, 100, 200]); } catch (e) {}
      setDone(true);
      doneTimeout.current = setTimeout(() => {
        onDoneRef.current();
      }, 2000);
      return;
    }
    const t = setTimeout(() => setRemaining(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining, done]);

  useEffect(() => {
    return () => { if (doneTimeout.current) clearTimeout(doneTimeout.current); };
  }, []);

  const addTime = useCallback(() => {
    if (done) return;
    setRemaining(r => r + 15);
    setTotal(t => t + 15);
  }, [done]);

  const subTime = useCallback(() => {
    if (done) return;
    setRemaining(r => Math.max(1, r - 15));
  }, [done]);

  const pct = total > 0 ? Math.min(((total - remaining) / total) * 100, 100) : 100;
  const min = Math.floor(Math.max(remaining, 0) / 60);
  const sec = Math.max(remaining, 0) % 60;
  const isWarning = !done && remaining <= 15 && remaining > 0;

  const barColor = done ? "#22c55e" : isWarning ? "#eab308" : "#4ade80";
  const bgColor = done ? "#0a1a10" : "#0f1612";
  const borderColor = done ? "#166534" : isWarning ? "#854d0e40" : "#1a3a2540";

  return (
    <div style={{
      position: "fixed",
      bottom: "calc(max(12px, env(safe-area-inset-bottom)) + 50px)",
      left: "50%",
      transform: "translateX(-50%)",
      width: "calc(100% - 32px)",
      maxWidth: 488,
      zIndex: 150,
      background: bgColor,
      border: `1px solid ${borderColor}`,
      borderRadius: 10,
      padding: "10px 14px",
      boxShadow: "0 -2px 16px rgba(0,0,0,0.6)",
      animation: done ? "restDonePulse 0.6s ease-out" : undefined,
    }}>
      {/* Progress bar (top) */}
      <div style={{
        height: 4,
        background: "#1a1a1a",
        borderRadius: 2,
        overflow: "hidden",
        marginBottom: 8,
      }}>
        <div style={{
          height: "100%",
          background: barColor,
          borderRadius: 2,
          width: `${pct}%`,
          transition: "width 1s linear, background 0.3s",
        }} />
      </div>

      {/* Content row */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}>
        {/* Label — tap to subtract 15s */}
        <div
          onClick={subTime}
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "1px",
            textTransform: "uppercase",
            color: done ? "#22c55e" : isWarning ? "#eab308" : "#4ade80",
            cursor: done ? "default" : "pointer",
            userSelect: "none",
            whiteSpace: "nowrap",
          }}
        >
          {done ? "✓ Go" : "Rest"}
          {!done && <span style={{ fontSize: 8, color: "#525252", marginLeft: 4 }}>−15</span>}
        </div>

        {/* Countdown — tap to add 15s */}
        <div
          onClick={addTime}
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: done ? "#22c55e" : "#fafafa",
            fontVariantNumeric: "tabular-nums",
            fontFamily: "'JetBrains Mono','SF Mono',monospace",
            cursor: done ? "default" : "pointer",
            userSelect: "none",
            minWidth: 72,
            textAlign: "center",
            lineHeight: 1,
          }}
        >
          {done ? "0:00" : `${min}:${sec.toString().padStart(2, "0")}`}
          {!done && <div style={{ fontSize: 8, color: "#525252", marginTop: 2, fontWeight: 400 }}>tap +15s</div>}
        </div>

        {/* Skip / Dismiss */}
        <button
          onClick={done ? onDone : onCancel}
          style={{
            padding: "6px 12px",
            borderRadius: 5,
            border: "1px solid #333",
            background: "transparent",
            color: done ? "#22c55e" : "#737373",
            fontSize: 11,
            fontWeight: 700,
            fontFamily: "inherit",
            cursor: "pointer",
            letterSpacing: "0.5px",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}
        >
          {done ? "Done" : "Skip"}
        </button>
      </div>

      {/* Inline animation keyframes */}
      <style>{`
        @keyframes restDonePulse {
          0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
          50% { box-shadow: 0 0 16px 4px rgba(34, 197, 94, 0.3); }
          100% { box-shadow: 0 -2px 12px rgba(0,0,0,0.5); }
        }
      `}</style>
    </div>
  );
}

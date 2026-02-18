// ═══════════════════════ REST TIMER (MODAL) ═══════════════════════
// Full-screen modal rest timer with circular progress ring.
//
// Features:
// - Centered modal overlay
// - Circular SVG progress ring with countdown
// - +15 / -15 buttons plus tap-ring to add time
// - Color shifts green → amber in last 15s
// - Vibrates + shows "Done" state on completion
// - Auto-dismisses 2s after finishing
//
// Props: seconds (initial), onDone, onCancel

import { useState, useEffect, useRef, useCallback } from "react";

const RING_SIZE = 180;
const RING_STROKE = 8;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export default function RestTimer({ seconds: initialSeconds, nextInfo, onDone, onCancel }) {
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

  const pct = total > 0 ? Math.min((total - remaining) / total, 1) : 1;
  const min = Math.floor(Math.max(remaining, 0) / 60);
  const sec = Math.max(remaining, 0) % 60;
  const isWarning = !done && remaining <= 15 && remaining > 0;

  const ringColor = done ? "#22c55e" : isWarning ? "#eab308" : "#4ade80";
  const strokeDashoffset = RING_CIRCUMFERENCE * (1 - pct);

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.75)",
      zIndex: 250,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
      backdropFilter: "blur(4px)",
      WebkitBackdropFilter: "blur(4px)",
      animation: "restModalIn 0.2s ease-out",
    }}>
      <div style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 16,
        padding: "28px 24px 20px",
        width: "100%",
        maxWidth: 300,
        textAlign: "center",
        animation: done ? "restDonePulse 0.6s ease-out" : undefined,
      }}>
        {/* Label — show next exercise/set or fallback */}
        <div style={{
          fontSize: nextInfo ? 12 : 11,
          fontWeight: 700,
          letterSpacing: nextInfo ? "0.3px" : "1.5px",
          textTransform: nextInfo ? "none" : "uppercase",
          color: done ? "#22c55e" : "var(--text-bright)",
          marginBottom: 16,
        }}>
          {done ? "✓ Time's Up" : nextInfo
            ? <>
                <span style={{ fontSize: 9, fontWeight: 500, letterSpacing: "1px", textTransform: "uppercase", color: "var(--text-dim)", display: "block", marginBottom: 3 }}>Up Next</span>
                {nextInfo.exercise}
                <span style={{ fontSize: 10, fontWeight: 500, color: "var(--text-muted)", marginLeft: 6 }}>Set {nextInfo.set}/{nextInfo.totalSets}</span>
              </>
            : "Rest"
          }
        </div>

        {/* Circular progress ring */}
        <div
          onClick={addTime}
          style={{
            position: "relative",
            width: RING_SIZE,
            height: RING_SIZE,
            margin: "0 auto 20px",
            cursor: done ? "default" : "pointer",
            userSelect: "none",
          }}
        >
          <svg width={RING_SIZE} height={RING_SIZE} style={{ transform: "rotate(-90deg)" }}>
            {/* Background ring */}
            <circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              fill="none"
              stroke="var(--surface2)"
              strokeWidth={RING_STROKE}
            />
            {/* Progress ring */}
            <circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              fill="none"
              stroke={ringColor}
              strokeWidth={RING_STROKE}
              strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }}
            />
          </svg>
          {/* Countdown text (centered inside ring) */}
          <div style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}>
            {!done && (
              <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--text-dim)", marginBottom: 2 }}>
                REST
              </div>
            )}
            <div style={{
              fontSize: 42,
              fontWeight: 800,
              color: done ? "#22c55e" : "var(--text-bright)",
              fontVariantNumeric: "tabular-nums",
              fontFamily: "'JetBrains Mono','SF Mono',monospace",
              lineHeight: 1,
            }}>
              {done ? "0:00" : `${min}:${sec.toString().padStart(2, "0")}`}
            </div>
            {!done && (
              <div style={{ fontSize: 9, color: "var(--text-dim)", marginTop: 4, fontWeight: 400 }}>
                tap to add 15s
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          {!done && (
            <button
              onClick={subTime}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "1px solid var(--border2)",
                background: "transparent",
                color: "var(--text-muted)",
                fontSize: 12,
                fontWeight: 700,
                fontFamily: "inherit",
                cursor: "pointer",
                minHeight: 44,
              }}
            >
              −15s
            </button>
          )}
          <button
            onClick={done ? onDone : onCancel}
            style={{
              padding: "8px 24px",
              borderRadius: 8,
              border: done ? "1px solid #166534" : "1px solid var(--border2)",
              background: done ? "#16653420" : "transparent",
              color: done ? "#22c55e" : "var(--text-muted)",
              fontSize: 12,
              fontWeight: 700,
              fontFamily: "inherit",
              cursor: "pointer",
              minHeight: 44,
            }}
          >
            {done ? "Done" : "Skip"}
          </button>
          {!done && (
            <button
              onClick={addTime}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "1px solid var(--border2)",
                background: "transparent",
                color: "var(--text-muted)",
                fontSize: 12,
                fontWeight: 700,
                fontFamily: "inherit",
                cursor: "pointer",
                minHeight: 44,
              }}
            >
              +15s
            </button>
          )}
        </div>
      </div>

      {/* Inline animation keyframes */}
      <style>{`
        @keyframes restDonePulse {
          0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
          50% { box-shadow: 0 0 24px 8px rgba(34, 197, 94, 0.3); }
          100% { box-shadow: none; }
        }
        @keyframes restModalIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

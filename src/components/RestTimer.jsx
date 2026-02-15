// ═══════════════════════ REST TIMER ═══════════════════════
// Extracted from App.jsx — RestTimer function
//
// Countdown timer shown after completing a set.
// Vibrates on completion (navigator.vibrate), shows progress bar.
// Props: seconds (initial), onDone (timer finished), onCancel (skip)

import { useState, useEffect } from "react";
import S from "../lib/styles";

export default function RestTimer({ seconds, onDone, onCancel }) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    if (remaining <= 0) {
      try {
        navigator.vibrate?.([200, 100, 200]);
      } catch (e) {}
      onDone();
      return;
    }
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining, onDone]);

  const pct = ((seconds - remaining) / seconds) * 100;
  const min = Math.floor(remaining / 60);
  const sec = remaining % 60;

  return (
    <div
      style={{
        ...S.card,
        margin: "8px 16px",
        background: "#0f1612",
        borderColor: "#1a3a25",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: 10,
          color: "#4ade80",
          fontWeight: 700,
          letterSpacing: "1.5px",
          textTransform: "uppercase",
          marginBottom: 8,
        }}
      >
        Rest Timer
      </div>
      <div
        style={{
          fontSize: 36,
          fontWeight: 800,
          color: "#fafafa",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {min}:{sec.toString().padStart(2, "0")}
      </div>
      <div
        style={{
          height: 4,
          background: "#1a1a1a",
          borderRadius: 2,
          margin: "10px 0",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            background: "#4ade80",
            borderRadius: 2,
            width: `${pct}%`,
            transition: "width 1s linear",
          }}
        />
      </div>
      <button onClick={onCancel} style={S.sm()}>
        Skip
      </button>
    </div>
  );
}

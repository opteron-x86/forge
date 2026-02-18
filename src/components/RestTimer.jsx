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
// - 3-2-1 countdown chirps + completion chime via Web Audio API
//   Uses sine wave chirps (frequency sweeps) at 2.2–3.8kHz —
//   concentrated energy at one frequency pokes through music mixes
//   better than harmonically rich waveforms which get compressed.
//   (mixes over user's music — does NOT interrupt playback)
//
// Props: seconds (initial), onDone, onCancel

import { useState, useEffect, useRef, useCallback } from "react";

const RING_SIZE = 180;
const RING_STROKE = 8;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

// ── Web Audio chirp utilities ──────────────────────────────────
// Using single sine OscillatorNodes with frequency sweeps (chirps).
//
// Why sine chirps beat square/triangle waves over music:
// Mobile browsers compress/limit Web Audio when media is playing.
// A sine concentrates ALL energy at one frequency — a sharp spike
// that pokes through. Square waves spread energy across harmonics
// so no individual frequency is loud enough after compression.
// The frequency sweep (chirp) exploits the auditory system's
// sensitivity to pitch changes — far more noticeable than flat tones.
//
// AudioContext must be created/resumed during a user gesture on iOS,
// which is satisfied because the rest timer is always triggered by
// a tap (completing a set). All scheduling uses AudioContext time
// instead of setTimeout for sample-accurate timing.

let _audioCtx = null;

function getAudioCtx() {
  if (!_audioCtx) {
    _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  // iOS suspends AudioContext until a user gesture resumes it
  if (_audioCtx.state === "suspended") {
    _audioCtx.resume().catch(() => {});
  }
  return _audioCtx;
}

/**
 * Play a single piercing sine chirp.
 * 
 * Why sine and not square/triangle:
 * Mobile browsers compress/limit Web Audio when media is playing.
 * A sine wave concentrates ALL energy at one frequency — a sharp
 * spike that pokes through the mix. Square waves spread energy
 * across harmonics so no single frequency is loud enough.
 * 
 * The chirp (frequency sweep) is key: a rising tone grabs attention
 * far better than a flat tone because the auditory system is wired
 * to notice frequency changes.
 *
 * @param {number} startFreq - Start frequency in Hz
 * @param {number} endFreq   - End frequency (sweep target)
 * @param {number} dur       - Duration in seconds
 * @param {number} volume    - Gain 0–1
 */
function chirp(startFreq = 1400, endFreq = 1420, dur = 0.18, volume = 0.8) {
  try {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.linearRampToValueAtTime(endFreq, now + dur);

    // Sharp attack, then fade — keeps it punchy
    gain.gain.setValueAtTime(volume, now);
    gain.gain.setValueAtTime(volume, now + dur * 0.6);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + dur + 0.01);
  } catch (e) {}
}

/**
 * Countdown beep at 3, 2, 1 — double chirp pattern, ascending.
 * Two quick chirps are much more noticeable than one.
 * All scheduling done via AudioContext time (no setTimeout).
 */
function countdownBeep(secondsLeft) {
  try {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;

    // Ascending base frequency: 3→low, 2→mid, 1→high
    const bases = { 3: 1400, 2: 1600, 1: 1800 };
    const base = bases[secondsLeft] || 2600;
    const vol = 0.7;

    // Chirp 1
    const osc1 = ctx.createOscillator();
    const g1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(base, now);
    osc1.frequency.linearRampToValueAtTime(base + 400, now + 0.1);
    g1.gain.setValueAtTime(vol, now);
    g1.gain.setValueAtTime(vol, now + 0.06);
    g1.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc1.connect(g1);
    g1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.12);

    /* Chirp 2 (scheduled via AudioContext, not setTimeout)
    const osc2 = ctx.createOscillator();
    const g2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(base, now + 0.14);
    osc2.frequency.linearRampToValueAtTime(base + 400, now + 0.24);
    g2.gain.setValueAtTime(0.001, now);
    g2.gain.setValueAtTime(vol, now + 0.14);
    g2.gain.setValueAtTime(vol, now + 0.20);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
    osc2.connect(g2);
    g2.connect(ctx.destination);
    osc2.start(now + 0.14);
    osc2.stop(now + 0.26);
    */
  } catch (e) {}
}

/**
 * Completion chime: three ascending chirps — each one a rising sweep.
 * Single oscillators scheduled sequentially via AudioContext time.
 */
function completionChime() {
  try {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    const vol = 0.75;

    const notes = [
      { start: 0,    freq: 2000, end: 2000, dur: 0.5 },
      /*
      { start: 0.18, freq: 2800, end: 3200, dur: 0.16 },
      { start: 0.36, freq: 3200, end: 3800, dur: 0.28 },  // final note held longer
      */
    ];

    for (const n of notes) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(n.freq, now + n.start);
      osc.frequency.linearRampToValueAtTime(n.end, now + n.start + n.dur);
      g.gain.setValueAtTime(0.001, now);
      g.gain.setValueAtTime(vol, now + n.start);
      g.gain.setValueAtTime(vol, now + n.start + n.dur * 0.5);
      g.gain.exponentialRampToValueAtTime(0.001, now + n.start + n.dur);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(now + n.start);
      osc.stop(now + n.start + n.dur + 0.01);
    }
  } catch (e) {}
}

// ── Component ─────────────────────────────────────────────────

export default function RestTimer({ seconds: initialSeconds, nextInfo, onDone, onCancel }) {
  const [total, setTotal] = useState(initialSeconds);
  const [remaining, setRemaining] = useState(initialSeconds);
  const [done, setDone] = useState(false);
  const doneTimeout = useRef(null);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  // Warm up AudioContext on mount (must be in a user-gesture call stack).
  // The component mounts when user taps to complete a set, which counts.
  useEffect(() => {
    getAudioCtx();
  }, []);

  useEffect(() => {
    if (done) return;
    if (remaining <= 0) {
      // ── Timer complete ──
      completionChime();
      try { navigator.vibrate?.([200, 100, 200, 100, 200]); } catch (e) {}
      setDone(true);
      doneTimeout.current = setTimeout(() => {
        onDoneRef.current();
      }, 2000);
      return;
    }

    // ── 3-2-1 countdown beeps ──
    if (remaining <= 3 && remaining >= 1) {
      countdownBeep(remaining);
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
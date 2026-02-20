// ═══════════════════════ EXERCISE INFO MODAL ═══════════════════════
// Shows enriched exercise detail: images, instructions, muscle targets,
// and substitutions. Data sourced from the exercises API with offline
// fallback to exercise-reference.json.
//
// Usage:
//   <ExerciseInfoModal name="Bench Press" onClose={() => {}} />
//   <ExerciseInfoModal name="Bench Press" onSwap={(newName) => {}} onClose={() => {}} />

import { useState, useEffect, useRef } from "react";
import api from "../lib/api";
import S from "../lib/styles";

// ── Muscle group color map (matches TALOS exercise picker) ──
const MUSCLE_COLORS = {
  chest: "#ef4444", back: "#3b82f6", shoulders: "#a855f7",
  biceps: "#f97316", triceps: "#eab308", quads: "#22c55e",
  hamstrings: "#14b8a6", glutes: "#ec4899", calves: "#06b6d4",
  core: "#6366f1", forearms: "#78716c", other: "#737373",
};

// ── Local reference cache (loaded once, shared across instances) ──
let _refCache = null;
async function getReference() {
  if (_refCache) return _refCache;
  try {
    const res = await fetch("/data/exercise-reference.json");
    if (res.ok) _refCache = await res.json();
  } catch { /* offline or missing — ok */ }
  return _refCache || {};
}

export default function ExerciseInfoModal({ name, onClose, onSwap }) {
  const [exercise, setExercise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imgIdx, setImgIdx] = useState(0);
  const [showAllInstructions, setShowAllInstructions] = useState(false);
  const backdropRef = useRef(null);

  useEffect(() => {
    if (!name) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setImgIdx(0);
      setShowAllInstructions(false);

      try {
        // Try API first (has full detail + substitutions)
        const all = await api.get("/exercises?full=1&search=" + encodeURIComponent(name));
        const match = all.find(e => e.name === name) || all[0];

        if (match) {
          // Fetch substitutions separately if not included
          let subs = match.substitutions || [];
          if (!subs.length) {
            try {
              const subMap = await api.get("/exercises/subs");
              subs = subMap[name] || [];
            } catch { /* ok */ }
          }

          if (!cancelled) {
            setExercise({ ...match, substitutions: subs });
            setLoading(false);
          }
          return;
        }
      } catch { /* API unavailable — fall through to offline */ }

      // Offline fallback: exercise-reference.json
      try {
        const ref = await getReference();
        // Search by name across reference entries
        const entry = Object.values(ref).find(r =>
          r.name?.toLowerCase() === name.toLowerCase()
        );
        if (entry && !cancelled) {
          setExercise({
            name,
            description: entry.instructions?.join(" ") || null,
            instructions: entry.instructions || [],
            images: entry.images || [],
            primary_muscles: entry.primaryMuscles || [],
            secondary_muscles: entry.secondaryMuscles || [],
            muscle: entry.muscle || "other",
            equipment: entry.equipment || "other",
            type: entry.type || "isolation",
            level: entry.level || null,
            force: entry.force || null,
            substitutions: [],
            _offline: true,
          });
        } else if (!cancelled) {
          // No enrichment data — show basic info
          setExercise({ name, _minimal: true });
        }
      } catch {
        if (!cancelled) setExercise({ name, _minimal: true });
      }

      if (!cancelled) setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [name]);

  // Close on backdrop tap
  function handleBackdrop(e) {
    if (e.target === backdropRef.current) onClose();
  }

  // Close on Escape
  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!name) return null;

  const ex = exercise || {};
  const images = ex.images || [];
  const instructions = ex.instructions || [];
  const description = ex.description || (instructions.length ? instructions.join(" ") : null);
  const primaryMuscles = ex.primary_muscles || [];
  const secondaryMuscles = ex.secondary_muscles || [];
  const subs = ex.substitutions || [];
  const muscle = ex.muscle || "other";
  const muscleColor = MUSCLE_COLORS[muscle] || MUSCLE_COLORS.other;

  // Parse instructions from description if needed
  const steps = instructions.length > 0
    ? instructions
    : (description ? description.split(/\.\s+/).filter(s => s.trim().length > 10) : []);

  const previewSteps = showAllInstructions ? steps : steps.slice(0, 3);

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdrop}
      style={{
        position: "fixed", inset: 0, background: "var(--overlay)",
        zIndex: 400, display: "flex", alignItems: "flex-end",
        justifyContent: "center", padding: 0,
        animation: "fadeIn 0.15s ease-out",
      }}
    >
      <div style={{
        background: "var(--bg)", borderRadius: "16px 16px 0 0",
        width: "100%", maxWidth: 520, maxHeight: "92vh",
        overflowY: "auto", WebkitOverflowScrolling: "touch",
        paddingBottom: "max(16px, env(safe-area-inset-bottom))",
        animation: "slideUp 0.2s ease-out",
      }}>

        {/* ── Header ── */}
        <div style={{
          position: "sticky", top: 0, zIndex: 1,
          background: "var(--bg)", padding: "12px 16px 8px",
          borderBottom: "1px solid var(--border)",
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 16, fontWeight: 800, color: "var(--text-bright)",
              letterSpacing: "-0.3px", lineHeight: 1.2,
            }}>
              {name}
            </div>
            <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
              <span style={{
                ...S.tag(muscleColor), fontSize: 9, padding: "2px 6px",
              }}>
                {muscle}
              </span>
              {ex.equipment && ex.equipment !== "other" && (
                <span style={{ ...S.tag(), fontSize: 9, padding: "2px 6px", background: "var(--surface2)", color: "var(--text-muted)" }}>
                  {ex.equipment}
                </span>
              )}
              {ex.type && (
                <span style={{ ...S.tag(), fontSize: 9, padding: "2px 6px", background: "var(--surface2)", color: "var(--text-muted)" }}>
                  {ex.type}
                </span>
              )}
              {ex.level && (
                <span style={{ ...S.tag(), fontSize: 9, padding: "2px 6px", background: "var(--surface2)", color: "var(--text-dim)" }}>
                  {ex.level}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              ...S.sm(), padding: "6px 10px", marginLeft: 8,
              flexShrink: 0, marginTop: 2,
            }}
          >
            ✕
          </button>
        </div>

        {/* ── Loading state ── */}
        {loading && (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text-dim)", fontSize: 12 }}>
            Loading...
          </div>
        )}

        {/* ── Content ── */}
        {!loading && (
          <div style={{ padding: "0 16px" }}>

            {/* ── Images ── */}
            {images.length > 0 && (
              <div style={{ margin: "12px 0" }}>
                <div style={{
                  position: "relative", borderRadius: 10, overflow: "hidden",
                  background: "var(--surface)", border: "1px solid var(--border)",
                  aspectRatio: "4/3", display: "flex", alignItems: "center",
                  justifyContent: "center",
                }}>
                  <img
                    src={images[imgIdx]}
                    alt={`${name} demonstration`}
                    style={{
                      width: "100%", height: "100%", objectFit: "contain",
                      background: "#1a1a1a",
                    }}
                    onError={(e) => { e.target.style.display = "none"; }}
                  />
                  {/* Image dots */}
                  {images.length > 1 && (
                    <div style={{
                      position: "absolute", bottom: 8, left: "50%",
                      transform: "translateX(-50%)", display: "flex", gap: 6,
                    }}>
                      {images.map((_, i) => (
                        <button
                          key={i}
                          onClick={(e) => { e.stopPropagation(); setImgIdx(i); }}
                          style={{
                            width: 8, height: 8, borderRadius: "50%", border: "none",
                            background: i === imgIdx ? "var(--accent)" : "rgba(255,255,255,0.3)",
                            cursor: "pointer", padding: 0,
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
                {/* Tap to cycle */}
                {images.length > 1 && (
                  <div
                    onClick={() => setImgIdx((imgIdx + 1) % images.length)}
                    style={{
                      fontSize: 10, color: "var(--text-dim)", textAlign: "center",
                      marginTop: 4, cursor: "pointer",
                    }}
                  >
                    tap image to cycle · {imgIdx + 1}/{images.length}
                  </div>
                )}
              </div>
            )}

            {/* ── Muscle targets ── */}
            {(primaryMuscles.length > 0 || secondaryMuscles.length > 0) && (
              <div style={{ ...S.card, margin: "8px 0", padding: 12 }}>
                <div style={{ ...S.label, marginBottom: 8 }}>Muscles Targeted</div>
                {primaryMuscles.length > 0 && (
                  <div style={{ marginBottom: secondaryMuscles.length ? 6 : 0 }}>
                    <div style={{ fontSize: 10, color: "var(--text-dim)", marginBottom: 4 }}>Primary</div>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {primaryMuscles.map(m => (
                        <span key={m} style={{
                          fontSize: 11, fontWeight: 700,
                          padding: "3px 8px", borderRadius: 4,
                          background: muscleColor + "20", color: muscleColor,
                        }}>
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {secondaryMuscles.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, color: "var(--text-dim)", marginBottom: 4 }}>Secondary</div>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {secondaryMuscles.map(m => (
                        <span key={m} style={{
                          fontSize: 11, padding: "3px 8px", borderRadius: 4,
                          background: "var(--surface2)", color: "var(--text-muted)",
                        }}>
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Instructions ── */}
            {steps.length > 0 && (
              <div style={{ ...S.card, margin: "8px 0", padding: 12 }}>
                <div style={{ ...S.label, marginBottom: 8 }}>How to Perform</div>
                {previewSteps.map((step, i) => (
                  <div key={i} style={{
                    display: "flex", gap: 8, marginBottom: 8,
                    fontSize: 12, lineHeight: 1.5, color: "var(--text-light)",
                  }}>
                    <span style={{
                      flexShrink: 0, width: 20, height: 20, borderRadius: "50%",
                      background: "var(--accent-bg)", color: "var(--accent)",
                      fontSize: 10, fontWeight: 700,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      marginTop: 1,
                    }}>
                      {i + 1}
                    </span>
                    <span>{step.endsWith(".") ? step : step + "."}</span>
                  </div>
                ))}
                {steps.length > 3 && !showAllInstructions && (
                  <button
                    onClick={() => setShowAllInstructions(true)}
                    style={{
                      background: "none", border: "none", color: "var(--accent)",
                      fontSize: 11, fontWeight: 700, cursor: "pointer",
                      fontFamily: "inherit", padding: "4px 0",
                    }}
                  >
                    Show all {steps.length} steps
                  </button>
                )}
              </div>
            )}

            {/* ── Substitutions ── */}
            {subs.length > 0 && (
              <div style={{ ...S.card, margin: "8px 0", padding: 12 }}>
                <div style={{ ...S.label, marginBottom: 8 }}>Substitutions</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {subs.map((sub, i) => (
                    <div
                      key={i}
                      onClick={() => onSwap && onSwap(sub)}
                      style={{
                        display: "flex", justifyContent: "space-between",
                        alignItems: "center", padding: "8px 10px",
                        borderRadius: 6, cursor: onSwap ? "pointer" : "default",
                        background: onSwap ? "transparent" : "transparent",
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={(e) => { if (onSwap) e.currentTarget.style.background = "var(--surface2)"; }}
                      onMouseLeave={(e) => { if (onSwap) e.currentTarget.style.background = "transparent"; }}
                    >
                      <span style={{ fontSize: 12, color: "var(--text-light)" }}>
                        {sub}
                      </span>
                      {onSwap && (
                        <span style={{ fontSize: 10, color: "var(--accent)", fontWeight: 700 }}>
                          SWAP →
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Minimal state (no enrichment data) ── */}
            {ex._minimal && (
              <div style={{
                padding: "24px 0", textAlign: "center", color: "var(--text-dim)",
                fontSize: 12, lineHeight: 1.6,
              }}>
                No additional detail available for this exercise.
                <br />
                This is a TALOS original — built from the gym floor.
              </div>
            )}

            {/* ── Additional metadata ── */}
            {(ex.force || ex.category) && (
              <div style={{
                display: "flex", gap: 12, padding: "8px 0 4px",
                fontSize: 10, color: "var(--text-dim)",
              }}>
                {ex.force && <span>Force: {ex.force}</span>}
                {ex.category && <span>Category: {ex.category}</span>}
              </div>
            )}

          </div>
        )}
      </div>

      {/* ── Animations ── */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(40px); opacity: 0.5; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

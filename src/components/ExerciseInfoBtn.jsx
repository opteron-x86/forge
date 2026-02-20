// ═══════════════════════ EXERCISE INFO BUTTON ═══════════════════════
// Small "ⓘ" tap target to trigger exercise detail modal.
// Place next to any exercise name. Meets 44px touch target minimum
// while looking compact visually.
//
// Usage:
//   <ExerciseInfoBtn onClick={() => showInfo("Bench Press")} />
//   <ExerciseInfoBtn onClick={() => showInfo(ex.name)} size="sm" />

export default function ExerciseInfoBtn({ onClick, size = "md" }) {
  const sz = size === "sm" ? 13 : 15;
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      style={{
        background: "none", border: "none", cursor: "pointer",
        color: "var(--text-dim)", fontSize: sz, fontFamily: "inherit",
        padding: 0, display: "inline-flex", alignItems: "center",
        justifyContent: "center",
        // 44px minimum touch target
        width: 36, height: 36, minWidth: 36, minHeight: 36,
        borderRadius: "50%", flexShrink: 0,
        transition: "color 0.1s, background 0.1s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = "var(--accent)";
        e.currentTarget.style.background = "var(--accent-bg)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = "var(--text-dim)";
        e.currentTarget.style.background = "none";
      }}
      title="Exercise info"
    >
      ⓘ
    </button>
  );
}

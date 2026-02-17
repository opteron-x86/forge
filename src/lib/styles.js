// ═══════════════════════ STYLES ═══════════════════════
// Extracted from App.jsx — the S object containing all inline style definitions
// All colors reference CSS custom properties set by the active theme.

const S = {
  app: { fontFamily: "var(--font)", background: "var(--bg)", color: "var(--text)", minHeight: "100dvh", maxWidth: 520, margin: "0 auto", position: "relative", paddingBottom: 80 },
  header: { padding: "16px 16px 10px", borderBottom: "1px solid var(--border)", background: "var(--bg)", position: "sticky", top: 0, zIndex: 100, display: "flex", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 20, fontWeight: 800, letterSpacing: "-0.5px", color: "var(--text-bright)", margin: 0, display: "flex", alignItems: "center", gap: 8 },
  nav: { display: "flex", gap: 4, background: "var(--surface2)", borderRadius: 12, padding: 4, position: "fixed", bottom: "max(12px,env(safe-area-inset-bottom))", left: "50%", transform: "translateX(-50%)", zIndex: 200, border: "1px solid var(--border2)", boxShadow: "0 -4px 20px var(--shadow)" },
  navBtn: (a) => ({ padding: "10px 16px", borderRadius: 8, border: "none", background: a ? "var(--accent)" : "transparent", color: a ? "var(--accent-text)" : "var(--text-muted)", fontSize: 11, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", letterSpacing: "0.5px", textTransform: "uppercase", minHeight: 44, display: "inline-flex", alignItems: "center", justifyContent: "center" }),
  card: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: 16, margin: "8px 16px" },
  label: { fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 6 },
  input: { background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 6, padding: "8px 10px", color: "var(--text)", fontSize: 14, fontFamily: "inherit", width: "100%", boxSizing: "border-box", outline: "none", minHeight: 44 },
  smInput: { background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 4, padding: "6px 4px", color: "var(--text)", fontSize: 13, fontFamily: "inherit", width: "100%", textAlign: "center", boxSizing: "border-box", outline: "none", minHeight: 44 },
  smSelect: { background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 4, padding: "6px 4px", color: "var(--text)", fontSize: 13, fontFamily: "inherit", width: "100%", textAlign: "center", boxSizing: "border-box", outline: "none", height: 44, appearance: "auto", WebkitAppearance: "menulist" },
  btn: (v = "primary") => ({ padding: "10px 18px", borderRadius: 8, border: v === "ghost" ? "1px solid var(--border2)" : "none", background: v === "primary" ? "var(--accent)" : v === "danger" ? "#dc2626" : "transparent", color: v === "primary" ? "var(--accent-text)" : v === "danger" ? "#fff" : "var(--text-light)", fontSize: 12, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", letterSpacing: "0.5px", textTransform: "uppercase", minHeight: 44, display: "inline-flex", alignItems: "center", justifyContent: "center" }),
  sm: (v = "ghost") => ({ padding: "4px 8px", borderRadius: 4, border: v === "ghost" ? "1px solid var(--border2)" : "none", background: v === "primary" ? "var(--accent)" : v === "danger" ? "#7f1d1d" : "transparent", color: v === "primary" ? "var(--accent-text)" : v === "danger" ? "#fca5a5" : "var(--text-muted)", fontSize: 10, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", letterSpacing: "0.5px", textTransform: "uppercase", minHeight: 44, display: "inline-flex", alignItems: "center", justifyContent: "center" }),
  tag: (c) => ({ display: "inline-block", padding: "3px 8px", borderRadius: 4, background: c ? c + "20" : "var(--accent-bg)", color: c || "var(--accent)", fontSize: 10, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase" }),
  stat: { textAlign: "center" },
  statV: { fontSize: 24, fontWeight: 800, color: "var(--text-bright)" },
  statL: { fontSize: 10, color: "var(--text-muted)", letterSpacing: "1px", textTransform: "uppercase", marginTop: 2 },
  setRow: (d) => ({ display: "grid", gridTemplateColumns: "24px 1fr 1fr 1fr 44px", gap: 5, alignItems: "center", marginBottom: 4, opacity: d ? 0.5 : 1 }),
  check: (d) => ({ width: 44, height: 44, borderRadius: 6, border: d ? "none" : "1px solid var(--border2)", background: d ? "#166534" : "transparent", color: d ? "#4ade80" : "var(--text-dim)", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }),
  avatar: (c, sz = 44) => ({ width: sz, height: sz, borderRadius: "50%", background: c + "25", border: `2px solid ${c}`, display: "flex", alignItems: "center", justifyContent: "center", color: c, fontWeight: 800, fontSize: sz * 0.4, cursor: "pointer", fontFamily: "inherit" }),
};

export default S;

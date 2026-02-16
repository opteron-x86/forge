// ═══════════════════════ STYLES ═══════════════════════
// Extracted from App.jsx — the S object containing all inline style definitions

const S = {
  app: { fontFamily: "'JetBrains Mono','SF Mono',monospace", background: "#0a0a0a", color: "#e5e5e5", minHeight: "100dvh", maxWidth: 520, margin: "0 auto", position: "relative", paddingBottom: 80 },
  header: { padding: "16px 16px 10px", borderBottom: "1px solid #262626", background: "#0a0a0a", position: "sticky", top: 0, zIndex: 100, display: "flex", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 20, fontWeight: 800, letterSpacing: "-0.5px", color: "#fafafa", margin: 0, display: "flex", alignItems: "center", gap: 8 },
  nav: { display: "flex", gap: 4, background: "#1a1a1a", borderRadius: 12, padding: 4, position: "fixed", bottom: "max(12px,env(safe-area-inset-bottom))", left: "50%", transform: "translateX(-50%)", zIndex: 200, border: "1px solid #333", boxShadow: "0 -4px 20px rgba(0,0,0,0.6)" },
  navBtn: (a) => ({ padding: "10px 16px", borderRadius: 8, border: "none", background: a ? "#c9952d" : "transparent", color: a ? "#000" : "#737373", fontSize: 11, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", letterSpacing: "0.5px", textTransform: "uppercase" }),
  card: { background: "#141414", border: "1px solid #262626", borderRadius: 10, padding: 16, margin: "8px 16px" },
  label: { fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "#737373", marginBottom: 6 },
  input: { background: "#1a1a1a", border: "1px solid #333", borderRadius: 6, padding: "8px 10px", color: "#e5e5e5", fontSize: 14, fontFamily: "inherit", width: "100%", boxSizing: "border-box", outline: "none" },
  smInput: { background: "#1a1a1a", border: "1px solid #333", borderRadius: 4, padding: "6px 4px", color: "#e5e5e5", fontSize: 13, fontFamily: "inherit", width: "100%", textAlign: "center", boxSizing: "border-box", outline: "none" },
  btn: (v = "primary") => ({ padding: "10px 18px", borderRadius: 8, border: v === "ghost" ? "1px solid #333" : "none", background: v === "primary" ? "#c9952d" : v === "danger" ? "#dc2626" : "transparent", color: v === "primary" ? "#000" : v === "danger" ? "#fff" : "#a3a3a3", fontSize: 12, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", letterSpacing: "0.5px", textTransform: "uppercase" }),
  sm: (v = "ghost") => ({ padding: "4px 8px", borderRadius: 4, border: v === "ghost" ? "1px solid #333" : "none", background: v === "primary" ? "#c9952d" : v === "danger" ? "#7f1d1d" : "transparent", color: v === "primary" ? "#000" : v === "danger" ? "#fca5a5" : "#737373", fontSize: 10, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", letterSpacing: "0.5px", textTransform: "uppercase" }),
  tag: (c = "#c9952d") => ({ display: "inline-block", padding: "3px 8px", borderRadius: 4, background: c + "20", color: c, fontSize: 10, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase" }),
  stat: { textAlign: "center" },
  statV: { fontSize: 24, fontWeight: 800, color: "#fafafa" },
  statL: { fontSize: 10, color: "#737373", letterSpacing: "1px", textTransform: "uppercase", marginTop: 2 },
  setRow: (d) => ({ display: "grid", gridTemplateColumns: "24px 1fr 1fr 1fr 32px", gap: 5, alignItems: "center", marginBottom: 4, opacity: d ? 0.5 : 1 }),
  check: (d) => ({ width: 28, height: 28, borderRadius: 6, border: d ? "none" : "1px solid #333", background: d ? "#166534" : "transparent", color: d ? "#4ade80" : "#525252", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }),
  avatar: (c, sz = 40) => ({ width: sz, height: sz, borderRadius: "50%", background: c + "25", border: `2px solid ${c}`, display: "flex", alignItems: "center", justifyContent: "center", color: c, fontWeight: 800, fontSize: sz * 0.4, cursor: "pointer", fontFamily: "inherit" }),
};

export default S;

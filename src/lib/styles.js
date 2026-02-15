// ═══════════════════════ STYLES ═══════════════════════
// Extracted from App.jsx — the S object containing all inline style definitions
// 
// MIGRATION NOTE: Copy the entire S = { ... } block from App.jsx into this file.
// The S object is large (~80 lines) and should be moved verbatim.
// Only the export statement needs to be added.

const S = {
  app: {
    fontFamily: "'JetBrains Mono','SF Mono',monospace",
    background: "#0a0a0a",
    color: "#e5e5e5",
    minHeight: "100dvh",
    maxWidth: 520,
    margin: "0 auto",
    position: "relative",
    paddingBottom: 72,
  },
  header: {
    padding: "16px 16px 10px",
    borderBottom: "1px solid #262626",
    background: "#0a0a0a",
    position: "sticky",
    top: 0,
    zIndex: 100,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: 800,
    letterSpacing: "-0.5px",
    color: "#fafafa",
    margin: 0,
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  nav: {
    display: "flex",
    gap: 2,
    background: "#171717",
    borderRadius: 8,
    padding: 3,
    position: "fixed",
    bottom: "max(12px,env(safe-area-inset-bottom))",
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 200,
    border: "1px solid #262626",
  },

  // MIGRATION NOTE: Copy the remaining style properties from App.jsx:
  // navBtn, card, label, input, btn, sm, tag, stat, statV, statL, check, avatar
  // These are all functions or objects in the original S definition.
  // 
  // Example for navBtn (it's a function that takes an `active` boolean):
  // navBtn: (a) => ({ padding: "8px 12px", borderRadius: 6, ... }),
  //
  // Copy each one verbatim from the original App.jsx S object.

  navBtn: (a) => ({
    padding: "8px 12px",
    borderRadius: 6,
    border: "none",
    background: a ? "#c9952d" : "transparent",
    color: a ? "#000" : "#737373",
    fontSize: 11,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
    letterSpacing: "0.5px",
    textTransform: "uppercase",
  }),
  card: {
    margin: "8px 16px",
    padding: 16,
    background: "#111",
    borderRadius: 10,
    border: "1px solid #262626",
  },
  label: {
    fontSize: 10,
    fontWeight: 700,
    color: "#525252",
    letterSpacing: "1.5px",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    background: "#171717",
    border: "1px solid #333",
    borderRadius: 6,
    color: "#fafafa",
    fontSize: 14,
    fontFamily: "inherit",
    outline: "none",
  },

  // TODO: Copy remaining style functions from App.jsx:
  // btn, sm, tag, stat, statV, statL, check, avatar
  // Each should be copied verbatim — they are functions or objects.
  
  btn: (variant = "primary") => ({
    padding: "10px 16px",
    borderRadius: 8,
    border: variant === "ghost" ? "1px solid #333" : "none",
    background: variant === "primary" ? "#c9952d" : variant === "danger" ? "#dc2626" : "transparent",
    color: variant === "primary" ? "#000" : variant === "danger" ? "#fafafa" : "#a3a3a3",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
    letterSpacing: "0.3px",
  }),
  sm: (variant) => ({
    padding: "4px 8px",
    borderRadius: 4,
    border: variant === "primary" ? "none" : "1px solid #333",
    background: variant === "primary" ? "#c9952d" : variant === "danger" ? "#dc2626" : "transparent",
    color: variant === "primary" ? "#000" : variant === "danger" ? "#fafafa" : "#737373",
    fontSize: 10,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  }),
  tag: (c = "#c9952d") => ({
    display: "inline-block",
    padding: "2px 6px",
    borderRadius: 3,
    background: c + "20",
    color: c,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.5px",
    textTransform: "uppercase",
  }),
  stat: { textAlign: "center" },
  statV: { fontSize: 22, fontWeight: 800, color: "#fafafa" },
  statL: { fontSize: 9, color: "#525252", textTransform: "uppercase", marginTop: 2, letterSpacing: "1px" },
  check: (d) => ({
    width: 28,
    height: 28,
    borderRadius: 6,
    border: d ? "none" : "1px solid #333",
    background: d ? "#166534" : "transparent",
    color: d ? "#4ade80" : "#525252",
    fontSize: 14,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "inherit",
    opacity: d ? 1 : 0.5,
  }),
  avatar: (c, sz = 40) => ({
    width: sz,
    height: sz,
    borderRadius: "50%",
    background: c + "25",
    border: `2px solid ${c}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: c,
    fontWeight: 800,
    fontSize: sz * 0.4,
    cursor: "pointer",
    fontFamily: "inherit",
  }),
};

export default S;

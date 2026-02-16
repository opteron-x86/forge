// ═══════════════════════ THEMES ═══════════════════════
// Theme definitions for TALOS — each theme is a set of CSS custom properties.
// Applied to document.documentElement.style on theme change.

export const THEMES = {
  talos: {
    id: "talos",
    name: "TALOS",
    description: "Default dark with gold accent",
    preview: { bg: "#0a0a0a", accent: "#c9952d", surface: "#141414" },
    vars: {
      "--bg": "#0a0a0a",
      "--surface": "#141414",
      "--surface2": "#1a1a1a",
      "--border": "#262626",
      "--border2": "#333333",
      "--text-dim": "#525252",
      "--text-muted": "#737373",
      "--text-light": "#a3a3a3",
      "--text": "#e5e5e5",
      "--text-secondary": "#d4d4d4",
      "--text-bright": "#fafafa",
      "--accent": "#c9952d",
      "--accent-text": "#000000",
      "--accent-bg": "rgba(201,149,45,0.12)",
      "--accent-bg2": "rgba(201,149,45,0.15)",
      "--accent-muted": "#b8862a",
      "--scrollbar": "#333333",
      "--shadow": "rgba(0,0,0,0.6)",
      "--overlay": "rgba(0,0,0,0.85)",
      "--font": "'JetBrains Mono','SF Mono',monospace",
    },
  },

  breeze: {
    id: "breeze",
    name: "Breeze",
    description: "Cool light theme with blue accent",
    preview: { bg: "#f5f7fa", accent: "#2563eb", surface: "#ffffff" },
    vars: {
      "--bg": "#f5f7fa",
      "--surface": "#ffffff",
      "--surface2": "#eef1f6",
      "--border": "#d1d5db",
      "--border2": "#c0c6d0",
      "--text-dim": "#9ca3af",
      "--text-muted": "#6b7280",
      "--text-light": "#4b5563",
      "--text": "#1f2937",
      "--text-secondary": "#374151",
      "--text-bright": "#111827",
      "--accent": "#2563eb",
      "--accent-text": "#ffffff",
      "--accent-bg": "rgba(37,99,235,0.10)",
      "--accent-bg2": "rgba(37,99,235,0.14)",
      "--accent-muted": "#1d4ed8",
      "--scrollbar": "#c0c6d0",
      "--shadow": "rgba(0,0,0,0.08)",
      "--overlay": "rgba(0,0,0,0.5)",
      "--font": "'JetBrains Mono','SF Mono',monospace",
    },
  },

  "breeze-dark": {
    id: "breeze-dark",
    name: "Breeze Dark",
    description: "Cool dark theme with blue accent",
    preview: { bg: "#0f172a", accent: "#3b82f6", surface: "#1e293b" },
    vars: {
      "--bg": "#0f172a",
      "--surface": "#1e293b",
      "--surface2": "#253349",
      "--border": "#334155",
      "--border2": "#475569",
      "--text-dim": "#64748b",
      "--text-muted": "#94a3b8",
      "--text-light": "#cbd5e1",
      "--text": "#e2e8f0",
      "--text-secondary": "#cbd5e1",
      "--text-bright": "#f8fafc",
      "--accent": "#3b82f6",
      "--accent-text": "#ffffff",
      "--accent-bg": "rgba(59,130,246,0.12)",
      "--accent-bg2": "rgba(59,130,246,0.16)",
      "--accent-muted": "#2563eb",
      "--scrollbar": "#475569",
      "--shadow": "rgba(0,0,0,0.5)",
      "--overlay": "rgba(0,0,0,0.8)",
      "--font": "'JetBrains Mono','SF Mono',monospace",
    },
  },

  monokai: {
    id: "monokai",
    name: "Monokai",
    description: "Classic dev theme with warm hues",
    preview: { bg: "#272822", accent: "#a6e22e", surface: "#2e2f2a" },
    vars: {
      "--bg": "#272822",
      "--surface": "#2e2f2a",
      "--surface2": "#383930",
      "--border": "#49483e",
      "--border2": "#5b5a50",
      "--text-dim": "#75715e",
      "--text-muted": "#908d82",
      "--text-light": "#a6a39c",
      "--text": "#f8f8f2",
      "--text-secondary": "#e6e6da",
      "--text-bright": "#ffffff",
      "--accent": "#a6e22e",
      "--accent-text": "#272822",
      "--accent-bg": "rgba(166,226,46,0.10)",
      "--accent-bg2": "rgba(166,226,46,0.14)",
      "--accent-muted": "#8ec420",
      "--scrollbar": "#5b5a50",
      "--shadow": "rgba(0,0,0,0.5)",
      "--overlay": "rgba(0,0,0,0.8)",
      "--font": "'JetBrains Mono','SF Mono',monospace",
    },
  },

  paper: {
    id: "paper",
    name: "Paper",
    description: "Warm minimal light theme",
    preview: { bg: "#faf8f5", accent: "#c05621", surface: "#ffffff" },
    vars: {
      "--bg": "#faf8f5",
      "--surface": "#ffffff",
      "--surface2": "#f3f0eb",
      "--border": "#e2ddd5",
      "--border2": "#d4cec4",
      "--text-dim": "#a39e93",
      "--text-muted": "#7c7770",
      "--text-light": "#5c574f",
      "--text": "#2d2a26",
      "--text-secondary": "#44403a",
      "--text-bright": "#1a1815",
      "--accent": "#c05621",
      "--accent-text": "#ffffff",
      "--accent-bg": "rgba(192,86,33,0.10)",
      "--accent-bg2": "rgba(192,86,33,0.14)",
      "--accent-muted": "#a8491b",
      "--scrollbar": "#d4cec4",
      "--shadow": "rgba(0,0,0,0.06)",
      "--overlay": "rgba(0,0,0,0.45)",
      "--font": "'JetBrains Mono','SF Mono',monospace",
    },
  },

  cyberpunk: {
    id: "cyberpunk",
    name: "Cyberpunk",
    description: "Neon pink on deep dark",
    preview: { bg: "#0d0d12", accent: "#ff2d8a", surface: "#14141f" },
    vars: {
      "--bg": "#0d0d12",
      "--surface": "#14141f",
      "--surface2": "#1c1c2b",
      "--border": "#2a2a3d",
      "--border2": "#3a3a52",
      "--text-dim": "#555570",
      "--text-muted": "#7a7a99",
      "--text-light": "#a0a0bf",
      "--text": "#e0e0f0",
      "--text-secondary": "#c8c8e0",
      "--text-bright": "#f5f5ff",
      "--accent": "#ff2d8a",
      "--accent-text": "#ffffff",
      "--accent-bg": "rgba(255,45,138,0.12)",
      "--accent-bg2": "rgba(255,45,138,0.16)",
      "--accent-muted": "#e0267a",
      "--scrollbar": "#3a3a52",
      "--shadow": "rgba(0,0,0,0.6)",
      "--overlay": "rgba(0,0,0,0.85)",
      "--font": "'JetBrains Mono','SF Mono',monospace",
    },
  },

  evergreen: {
    id: "evergreen",
    name: "Evergreen",
    description: "Deep forest dark theme",
    preview: { bg: "#0a120e", accent: "#34d399", surface: "#111f18" },
    vars: {
      "--bg": "#0a120e",
      "--surface": "#111f18",
      "--surface2": "#182b21",
      "--border": "#1f3a2b",
      "--border2": "#2d5240",
      "--text-dim": "#4a7a64",
      "--text-muted": "#6b9e84",
      "--text-light": "#93bda8",
      "--text": "#d1e8dc",
      "--text-secondary": "#b5d6c4",
      "--text-bright": "#ecfdf5",
      "--accent": "#34d399",
      "--accent-text": "#0a120e",
      "--accent-bg": "rgba(52,211,153,0.10)",
      "--accent-bg2": "rgba(52,211,153,0.14)",
      "--accent-muted": "#2ab882",
      "--scrollbar": "#2d5240",
      "--shadow": "rgba(0,0,0,0.5)",
      "--overlay": "rgba(0,0,0,0.8)",
      "--font": "'JetBrains Mono','SF Mono',monospace",
    },
  },

  cobalt: {
    id: "cobalt",
    name: "Cobalt",
    description: "Deep blue dark theme",
    preview: { bg: "#0b1120", accent: "#4a9eff", surface: "#111d35" },
    vars: {
      "--bg": "#0b1120",
      "--surface": "#111d35",
      "--surface2": "#162544",
      "--border": "#1e3154",
      "--border2": "#2a4270",
      "--text-dim": "#4a6a9b",
      "--text-muted": "#6b8ec2",
      "--text-light": "#93b4e0",
      "--text": "#d4e4f7",
      "--text-secondary": "#b0cef0",
      "--text-bright": "#f0f6ff",
      "--accent": "#4a9eff",
      "--accent-text": "#0b1120",
      "--accent-bg": "rgba(74,158,255,0.10)",
      "--accent-bg2": "rgba(74,158,255,0.14)",
      "--accent-muted": "#3a86db",
      "--scrollbar": "#1e3154",
      "--shadow": "rgba(0,0,0,0.5)",
      "--overlay": "rgba(0,0,0,0.8)",
      "--font": "'JetBrains Mono','SF Mono',monospace",
    },
  },
};


export const THEME_LIST = Object.values(THEMES);
export const DEFAULT_THEME = "talos";

/** Apply a theme to the document root */
export function applyTheme(themeId) {
  const theme = THEMES[themeId] || THEMES[DEFAULT_THEME];
  const root = document.documentElement;
  for (const [prop, value] of Object.entries(theme.vars)) {
    root.style.setProperty(prop, value);
  }
  // Also update meta theme-color for mobile browsers
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", theme.vars["--bg"]);
  // Store in localStorage as fallback for initial load
  try { localStorage.setItem("talos-theme", themeId); } catch (e) {}
}

/** Get the saved theme from localStorage (for initial load before auth) */
export function getSavedTheme() {
  try { return localStorage.getItem("talos-theme") || DEFAULT_THEME; } catch (e) { return DEFAULT_THEME; }
}

// ═══════════════════════ HELPERS & CONSTANTS ═══════════════════════
// Extracted from App.jsx — shared utilities used across components

export const genId = () =>
  Date.now().toString(36) + Math.random().toString(36).substr(2, 6);

export const fmtDate = (d) => {
  const dt = new Date(d + "T12:00:00");
  return dt.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

export const est1RM = (w, r) => {
  if (!w || !r) return null;
  if (r === 1) return w;
  if (r > 12) return null;
  return Math.round(w * (1 + r / 30));
};

export const USER_COLORS = [
  "#c9952d", "#3b82f6", "#8b5cf6", "#ec4899",
  "#10b981", "#eab308", "#ef4444", "#06b6d4",
];

export const FEEL = [
  { v: 1, l: "Terrible", c: "#ef4444" },
  { v: 2, l: "Low", c: "#f97316" },
  { v: 3, l: "Average", c: "#eab308" },
  { v: 4, l: "Good", c: "#22c55e" },
  { v: 5, l: "Great", c: "#10b981" },
];

// Color mapping for workout day types (used in HistoryPage)
export const DAY_COLORS = {
  push: "#c9952d",
  pull: "#3b82f6",
  leg: "#10b981",
  legs: "#10b981",
};

export function getDayColor(label) {
  if (!label) return "#737373";
  const l = label.toLowerCase();
  for (const [key, color] of Object.entries(DAY_COLORS)) {
    if (l.includes(key)) return color;
  }
  return "#8b5cf6";
}

// Default profile shape (used for initial state)
export const DEFAULT_PROFILE = {
  height: "",
  weight: null,
  bodyFat: null,
  restTimerCompound: 150,
  restTimerIsolation: 90,
  restTimerEnabled: true,
  intensityScale: "rpe",
  sex: "",
  dateOfBirth: "",
  goal: "",
  targetWeight: null,
  experienceLevel: "",
  trainingIntensity: "",
  targetPrs: {},
  injuriesNotes: "",
  caloriesTarget: null,
  proteinTarget: null,
  activeProgramId: null,
  bioHistory: [],
};

// ═══════════════════════════════════════════════════════════════
//  Δ TALOS — Server Entry Point
//  Phase 2 decomposition (audit commit 7e055db)
//
//  This file is the slim orchestrator. All business logic lives
//  in server/ modules and server/routes/ route handlers.
// ═══════════════════════════════════════════════════════════════

import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

dotenv.config();

// --- Database (initializes schema, migrations, indexes on import) ---
import db, { DB_PATH } from "./server/db.js";

// --- AI provider (initializes on import) ---
import { aiProvider } from "./server/ai.js";

// --- Route modules ---
import authRoutes from "./server/routes/auth.js";
import adminRoutes from "./server/routes/admin.js";
import workoutRoutes, { reviewRouter } from "./server/routes/workouts.js";
import profileRoutes from "./server/routes/profile.js";
import programRoutes from "./server/routes/programs.js";
import exerciseRoutes from "./server/routes/exercises.js";
import coachRoutes from "./server/routes/coach.js";
import exportRoutes from "./server/routes/export.js";

// ===================== APP SETUP =====================

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// --- CORS (S1 fix: restrict in production) ---
const ALLOWED_ORIGINS = (process.env.APP_URL || "https://talos.fit").split(",").map(s => s.trim());
app.use(cors({
  origin: process.env.NODE_ENV === "production"
    ? (origin, cb) => {
        if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
        cb(new Error("Not allowed by CORS"));
      }
    : true,
  credentials: true,
}));

// --- Security headers (S5 fix) ---
app.use(helmet({
  contentSecurityPolicy: false,          // CSP breaks inline styles (React SPA)
  crossOriginEmbedderPolicy: false,      // Breaks some CDN resources
  crossOriginOpenerPolicy: false,        // COOP "same-origin" breaks iOS Safari/PWA
  crossOriginResourcePolicy: false,      // CORP "same-origin" can block resources on mobile WebKit
}));

// --- Body parsing ---
app.use(express.json({ limit: "5mb" }));

// --- Static files (production: serve Vite build) ---
if (process.env.NODE_ENV === "production") {
  app.use(express.static(join(__dirname, "dist")));
}

// ===================== ROUTE MOUNTING =====================

app.use("/api/auth",             authRoutes);
app.use("/api/admin",            adminRoutes);
app.use("/api/workouts",         workoutRoutes);
app.use("/api/workout-reviews",  reviewRouter);
app.use("/api/profile",          profileRoutes);
app.use("/api/programs",         programRoutes);
app.use("/api/exercises",        exerciseRoutes);
app.use("/api",                  coachRoutes);   // Handles /api/coach/* and /api/ai/*
app.use("/api/export",           exportRoutes);

// ===================== HEALTH & SPA FALLBACK =====================

app.get("/api/health", (req, res) => {
  try {
    db.prepare("SELECT 1").get();
    res.json({ status: "ok", db: "connected" });
  } catch (e) {
    res.status(503).json({ status: "error", db: "disconnected" });
  }
});

if (process.env.NODE_ENV === "production") {
  app.get("*", (req, res) => res.sendFile(join(__dirname, "dist", "index.html")));
}

// ===================== STARTUP =====================

app.listen(PORT, "0.0.0.0", () => {
  const aiStatus = aiProvider ? `✅ ${aiProvider.providerName} (${aiProvider.modelName})` : "❌ Not configured";
  const authStatus = process.env.ADMIN_EMAIL ? `Admin: ${process.env.ADMIN_EMAIL}` : "No admin email set";
  console.log(`
┌────────────────────────────────────────┐
│                                        │
│   Δ TALOS                              │
│   Gym Tracker v3.1 (Decomposed)        │
│                                        │
│   http://0.0.0.0:${String(PORT).padEnd(24)}│
│   DB: ${DB_PATH.padEnd(33)}│
│   AI: ${aiStatus.padEnd(33)}│
│   Users: ${String(db.prepare("SELECT COUNT(*) as c FROM users").get().c).padEnd(29)}│
│   Auth: ${authStatus.padEnd(30)}│
│                                        │
└────────────────────────────────────────┘`);
});

// ===================== GRACEFUL SHUTDOWN =====================

function shutdown(signal) {
  console.log(`\n⏹  ${signal} received — shutting down gracefully...`);
  try { db.close(); } catch (e) { /* already closed */ }
  process.exit(0);
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT",  () => shutdown("SIGINT"));

// --- Graceful error handling ---
process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
});
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
});

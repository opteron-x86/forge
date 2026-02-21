// ═══════════════════════════════════════════════════════════════
//  TALOS — Test Setup Helper
//
//  Creates a fresh Express app backed by an in-memory sql.js
//  database for each test suite. Returns a supertest agent and
//  helper functions for auth, seeding data, etc.
//
//  Usage:
//    import { createTestApp } from "./setup.js";
//    let app, agent, helpers;
//    beforeAll(async () => ({ app, agent, helpers } = await createTestApp()));
//    afterAll(async () => helpers.cleanup());
// ═══════════════════════════════════════════════════════════════

import express from "express";
import cors from "cors";
import supertest from "supertest";
import { createSqljsAdapter } from "../server/db/sqljs.js";
import { initSchema } from "../server/db/schema.js";
import { _resetForTesting } from "../server/db.js";

// Route modules
import authRoutes from "../server/routes/auth.js";
import adminRoutes from "../server/routes/admin.js";
import workoutRoutes, { reviewRouter } from "../server/routes/workouts.js";
import profileRoutes from "../server/routes/profile.js";
import programRoutes from "../server/routes/programs.js";
import exerciseRoutes from "../server/routes/exercises.js";
import exportRoutes from "../server/routes/export.js";

/**
 * Create a fully configured test app with a fresh in-memory database.
 * @returns {Promise<{app, agent, helpers}>}
 */
export async function createTestApp() {
  // 1. Create in-memory database with full schema
  const db = await createSqljsAdapter();
  await initSchema(db);

  // 2. Inject into the singleton so route handlers can find it
  _resetForTesting(db);

  // 3. Build Express app (mirrors server.js without listen())
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "5mb" }));

  // Mount routes
  app.use("/api/auth", authRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/workouts", workoutRoutes);
  app.use("/api/workout-reviews", reviewRouter);
  app.use("/api/profile", profileRoutes);
  app.use("/api/programs", programRoutes);
  app.use("/api/exercises", exerciseRoutes);
  app.use("/api/export", exportRoutes);

  // Health endpoint
  app.get("/api/health", async (req, res) => {
    res.json({ status: "ok", db: "connected", type: "sqlite" });
  });

  // 4. Create supertest agent
  const agent = supertest(app);

  // 5. Helper functions
  const helpers = {
    db,

    /**
     * Register a user and return { token, user }.
     */
    async registerUser(overrides = {}) {
      const data = {
        email: overrides.email || `test-${Date.now()}@example.com`,
        password: overrides.password || "testpass123",
        name: overrides.name || "Test User",
        color: overrides.color || "#f97316",
      };
      const res = await agent.post("/api/auth/register").send(data);
      if (res.status !== 200) {
        throw new Error(`Registration failed (${res.status}): ${JSON.stringify(res.body)}`);
      }
      return { token: res.body.token, user: res.body.user, password: data.password };
    },

    /**
     * Get an auth header object for supertest.
     */
    authHeader(token) {
      return { Authorization: `Bearer ${token}` };
    },

    /**
     * Create a workout for a user.
     */
    async createWorkout(token, overrides = {}) {
      const workout = {
        date: overrides.date || "2025-01-15",
        day_label: overrides.day_label || "Push Day",
        feel: overrides.feel || 4,
        duration: overrides.duration || 3600,
        exercises: overrides.exercises || [
          {
            name: "Bench Press",
            sets: [
              { weight: 135, reps: 10, rpe: 7 },
              { weight: 155, reps: 8, rpe: 8 },
              { weight: 175, reps: 6, rpe: 9 },
            ],
          },
        ],
        ...overrides,
      };
      const res = await agent
        .post("/api/workouts")
        .set(helpers.authHeader(token))
        .send(workout);
      return res;
    },

    /**
     * Create a program for a user.
     */
    async createProgram(token, overrides = {}) {
      const program = {
        name: overrides.name || "Test Program",
        description: overrides.description || "A test program",
        days: overrides.days || [
          { id: "d1", label: "Push", exercises: [{ name: "Bench Press", sets: 3, reps: "8-10" }] },
          { id: "d2", label: "Pull", exercises: [{ name: "Barbell Row", sets: 3, reps: "8-10" }] },
        ],
        shared: overrides.shared || false,
        ...overrides,
      };
      const res = await agent
        .post("/api/programs")
        .set(helpers.authHeader(token))
        .send(program);
      return res;
    },

    /**
     * Tear down the test database.
     */
    async cleanup() {
      _resetForTesting(null);
      await db.close();
    },
  };

  return { app, agent, helpers };
}

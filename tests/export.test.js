// ═══════════════════════════════════════════════════════════════
//  TALOS — Export & Data Integrity Tests
//  CSV export, cross-cutting data integrity checks
// ═══════════════════════════════════════════════════════════════

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createTestApp } from "./setup.js";

let agent, helpers;
let user;

beforeAll(async () => {
  ({ agent, helpers } = await createTestApp());
  user = await helpers.registerUser({ email: "export-test@example.com", name: "Export User" });

  // Seed some workouts for export
  await helpers.createWorkout(user.token, {
    date: "2025-01-10",
    day_label: "Push",
    feel: 4,
    duration: 3600,
    exercises: [
      {
        name: "Bench Press",
        sets: [
          { weight: 135, reps: 10, rpe: 7 },
          { weight: 155, reps: 8, rpe: 8 },
        ],
      },
      {
        name: "Overhead Press",
        sets: [
          { weight: 95, reps: 10, rpe: 7 },
        ],
      },
    ],
  });

  await helpers.createWorkout(user.token, {
    date: "2025-01-12",
    day_label: "Pull",
    exercises: [
      {
        name: "Barbell Row",
        sets: [
          { weight: 135, reps: 10 },
          { weight: 155, reps: 8 },
        ],
      },
    ],
  });
});

afterAll(async () => helpers.cleanup());

// ===================== CSV EXPORT =====================

describe("GET /api/export", () => {
  it("returns a CSV file", async () => {
    const res = await agent
      .get("/api/export")
      .set(helpers.authHeader(user.token));

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/text\/csv/);
    expect(res.headers["content-disposition"]).toMatch(/attachment.*talos-export/);
  });

  it("CSV contains header row and data rows", async () => {
    const res = await agent
      .get("/api/export")
      .set(helpers.authHeader(user.token));

    const lines = res.text.split("\n");
    expect(lines[0]).toMatch(/Date.*Exercise.*Weight.*Reps/);
    // 2 sets of Bench + 1 set of OHP + 2 sets of Barbell Row = 5 data rows + 1 header
    expect(lines.length).toBeGreaterThanOrEqual(6);
  });

  it("CSV contains correct exercise names", async () => {
    const res = await agent
      .get("/api/export")
      .set(helpers.authHeader(user.token));

    expect(res.text).toContain("Bench Press");
    expect(res.text).toContain("Overhead Press");
    expect(res.text).toContain("Barbell Row");
  });

  it("CSV handles empty export gracefully", async () => {
    const emptyUser = await helpers.registerUser({ email: "empty-export@example.com" });
    const res = await agent
      .get("/api/export")
      .set(helpers.authHeader(emptyUser.token));

    expect(res.status).toBe(200);
    // Should still have the header row
    const lines = res.text.split("\n").filter(l => l.trim());
    expect(lines.length).toBe(1); // header only
  });

  it("requires authentication", async () => {
    const res = await agent.get("/api/export");
    expect(res.status).toBe(401);
  });
});

// ===================== DATA ROUND-TRIP INTEGRITY =====================

describe("data integrity", () => {
  it("exercise data survives a full create → read round-trip", async () => {
    const exercises = [
      {
        name: "Squat",
        sets: [
          { weight: 225, reps: 5, rpe: 8 },
          { weight: 245, reps: 3, rpe: 9 },
          { weight: 265, reps: 1, rpe: 10 },
        ],
      },
      {
        name: "Leg Press",
        sets: [
          { weight: 450, reps: 12 },
        ],
      },
    ];

    await helpers.createWorkout(user.token, {
      id: "integrity-test",
      date: "2025-05-01",
      day_label: "Leg Day",
      feel: 5,
      exercises,
    });

    const res = await agent
      .get("/api/workouts")
      .set(helpers.authHeader(user.token));

    const workout = res.body.find(w => w.id === "integrity-test");
    expect(workout).toBeDefined();
    expect(workout.exercises).toHaveLength(2);
    expect(workout.exercises[0].name).toBe("Squat");
    expect(workout.exercises[0].sets).toHaveLength(3);
    expect(workout.exercises[0].sets[2].weight).toBe(265);
    expect(workout.exercises[0].sets[2].reps).toBe(1);
    expect(workout.exercises[0].sets[2].rpe).toBe(10);
    expect(workout.exercises[1].name).toBe("Leg Press");
    expect(workout.exercises[1].sets[0].weight).toBe(450);
  });

  it("program days data survives a full create → read round-trip", async () => {
    const days = [
      {
        id: "d1",
        label: "Upper A",
        exercises: [
          { name: "Bench Press", sets: 4, reps: "6-8", notes: "Pause at bottom" },
          { name: "Barbell Row", sets: 4, reps: "6-8" },
        ],
      },
      {
        id: "d2",
        label: "Lower A",
        exercises: [
          { name: "Squat", sets: 5, reps: "5", notes: "Belt up on working sets" },
        ],
      },
    ];

    const createRes = await helpers.createProgram(user.token, {
      name: "Integrity Test Program",
      days,
    });

    const programs = await agent
      .get("/api/programs")
      .set(helpers.authHeader(user.token));

    const program = programs.body.find(p => p.id === createRes.body.id);
    expect(program.days).toHaveLength(2);
    expect(program.days[0].label).toBe("Upper A");
    expect(program.days[0].exercises[0].notes).toBe("Pause at bottom");
    expect(program.days[1].exercises[0].name).toBe("Squat");
  });
});

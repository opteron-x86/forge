// ═══════════════════════════════════════════════════════════════
//  TALOS — Workout Tests
//  CRUD operations, user isolation, exercise data integrity
// ═══════════════════════════════════════════════════════════════

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createTestApp } from "./setup.js";

let agent, helpers;
let userA, userB;

beforeAll(async () => {
  ({ agent, helpers } = await createTestApp());
  userA = await helpers.registerUser({ email: "workout-a@example.com", name: "Lifter A" });
  userB = await helpers.registerUser({ email: "workout-b@example.com", name: "Lifter B" });
});
afterAll(async () => helpers.cleanup());

// ===================== CREATE =====================

describe("POST /api/workouts", () => {
  it("creates a workout with exercises", async () => {
    const res = await helpers.createWorkout(userA.token, {
      date: "2025-02-01",
      day_label: "Push Day",
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

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("creates a workout with no exercises (freestyle)", async () => {
    const res = await helpers.createWorkout(userA.token, {
      date: "2025-02-02",
      day_label: "Cardio",
      exercises: [],
    });
    expect(res.status).toBe(200);
  });

  it("requires authentication", async () => {
    const res = await agent.post("/api/workouts").send({
      date: "2025-02-01",
      exercises: [],
    });
    expect(res.status).toBe(401);
  });

  it("tracks analytics event", async () => {
    const event = await helpers.db.get(
      "SELECT * FROM analytics_events WHERE user_id = $1 AND event = 'workout_completed' ORDER BY created_at DESC",
      [userA.user.id]
    );
    expect(event).toBeDefined();
  });
});

// ===================== READ =====================

describe("GET /api/workouts", () => {
  it("returns all workouts for the authenticated user", async () => {
    const res = await agent
      .get("/api/workouts")
      .set(helpers.authHeader(userA.token));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });

  it("returns exercises as parsed JSON arrays", async () => {
    const res = await agent
      .get("/api/workouts")
      .set(helpers.authHeader(userA.token));

    const withExercises = res.body.find(w => w.exercises.length > 0);
    expect(withExercises).toBeDefined();
    expect(Array.isArray(withExercises.exercises)).toBe(true);
    expect(withExercises.exercises[0].name).toBe("Bench Press");
    expect(withExercises.exercises[0].sets).toHaveLength(2);
  });

  it("returns workouts ordered by date ASC", async () => {
    const res = await agent
      .get("/api/workouts")
      .set(helpers.authHeader(userA.token));

    const dates = res.body.map(w => w.date);
    const sorted = [...dates].sort();
    expect(dates).toEqual(sorted);
  });

  it("user B sees zero workouts (isolation)", async () => {
    const res = await agent
      .get("/api/workouts")
      .set(helpers.authHeader(userB.token));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });
});

// ===================== UPDATE =====================

describe("PUT /api/workouts/:id", () => {
  let workoutId;

  beforeAll(async () => {
    // Get the first workout for userA
    const res = await agent
      .get("/api/workouts")
      .set(helpers.authHeader(userA.token));
    workoutId = res.body[0].id;
  });

  it("updates a workout's fields", async () => {
    const res = await agent
      .put(`/api/workouts/${workoutId}`)
      .set(helpers.authHeader(userA.token))
      .send({
        date: "2025-02-01",
        day_label: "Heavy Push",
        feel: 5,
        duration: 4200,
        notes: "Great session",
        exercises: [
          {
            name: "Bench Press",
            sets: [
              { weight: 185, reps: 5, rpe: 9 },
            ],
          },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);

    // Verify update
    const workouts = await agent
      .get("/api/workouts")
      .set(helpers.authHeader(userA.token));

    const updated = workouts.body.find(w => w.id === workoutId);
    expect(updated.day_label).toBe("Heavy Push");
    expect(updated.feel).toBe(5);
    expect(updated.notes).toBe("Great session");
    expect(updated.exercises[0].sets[0].weight).toBe(185);
  });

  it("rejects update from a different user", async () => {
    const res = await agent
      .put(`/api/workouts/${workoutId}`)
      .set(helpers.authHeader(userB.token))
      .send({
        date: "2025-02-01",
        day_label: "Stolen!",
        exercises: [],
      });

    expect(res.status).toBe(404);
  });

  it("returns 404 for non-existent workout", async () => {
    const res = await agent
      .put("/api/workouts/nonexistent123")
      .set(helpers.authHeader(userA.token))
      .send({
        date: "2025-02-01",
        exercises: [],
      });
    expect(res.status).toBe(404);
  });
});

// ===================== DELETE =====================

describe("DELETE /api/workouts/:id", () => {
  let deleteTargetId;

  beforeAll(async () => {
    // Create a workout specifically for deletion
    await helpers.createWorkout(userA.token, {
      id: "to-delete-123",
      date: "2025-03-01",
      day_label: "Delete Me",
      exercises: [],
    });
    deleteTargetId = "to-delete-123";
  });

  it("deletes a workout belonging to the user", async () => {
    const res = await agent
      .delete(`/api/workouts/${deleteTargetId}`)
      .set(helpers.authHeader(userA.token));

    expect(res.status).toBe(200);

    // Verify it's gone
    const workouts = await agent
      .get("/api/workouts")
      .set(helpers.authHeader(userA.token));
    const found = workouts.body.find(w => w.id === deleteTargetId);
    expect(found).toBeUndefined();
  });

  it("does not delete another user's workout", async () => {
    // Create a workout for userA
    await helpers.createWorkout(userA.token, {
      id: "protected-workout",
      date: "2025-03-02",
      exercises: [],
    });

    // Try to delete as userB
    await agent
      .delete("/api/workouts/protected-workout")
      .set(helpers.authHeader(userB.token));

    // Verify it still exists for userA
    const workouts = await agent
      .get("/api/workouts")
      .set(helpers.authHeader(userA.token));
    const found = workouts.body.find(w => w.id === "protected-workout");
    expect(found).toBeDefined();
  });
});

// ===================== WORKOUT REVIEWS =====================

describe("workout reviews", () => {
  let workoutId;

  beforeAll(async () => {
    await helpers.createWorkout(userA.token, {
      id: "reviewed-workout",
      date: "2025-04-01",
      exercises: [{ name: "Squat", sets: [{ weight: 225, reps: 5 }] }],
    });
    workoutId = "reviewed-workout";
  });

  it("creates a review for a workout", async () => {
    const res = await agent
      .post("/api/workout-reviews")
      .set(helpers.authHeader(userA.token))
      .send({
        workout_id: workoutId,
        review: "Solid session, hit a new PR on squats",
      });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("retrieves a review by workout_id", async () => {
    const res = await agent
      .get(`/api/workout-reviews?workout_id=${workoutId}`)
      .set(helpers.authHeader(userA.token));

    expect(res.status).toBe(200);
    expect(res.body.review).toMatch(/new PR/);
  });

  it("retrieves all reviews for the user", async () => {
    const res = await agent
      .get("/api/workout-reviews")
      .set(helpers.authHeader(userA.token));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it("user B cannot see user A's reviews", async () => {
    const res = await agent
      .get(`/api/workout-reviews?workout_id=${workoutId}`)
      .set(helpers.authHeader(userB.token));

    expect(res.status).toBe(200);
    expect(res.body).toBeNull();
  });

  it("deletes a review", async () => {
    const res = await agent
      .delete(`/api/workout-reviews/${workoutId}`)
      .set(helpers.authHeader(userA.token));

    expect(res.status).toBe(200);

    // Verify gone
    const check = await agent
      .get(`/api/workout-reviews?workout_id=${workoutId}`)
      .set(helpers.authHeader(userA.token));
    expect(check.body).toBeNull();
  });
});

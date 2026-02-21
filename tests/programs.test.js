// ═══════════════════════════════════════════════════════════════
//  TALOS — Program Tests
//  CRUD, sharing, adoption (forking), user isolation
// ═══════════════════════════════════════════════════════════════

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createTestApp } from "./setup.js";

let agent, helpers;
let coach, athlete;

beforeAll(async () => {
  ({ agent, helpers } = await createTestApp());
  coach = await helpers.registerUser({ email: "coach@example.com", name: "Coach Mike" });
  athlete = await helpers.registerUser({ email: "athlete@example.com", name: "Athlete Sam" });
});
afterAll(async () => helpers.cleanup());

// ===================== CREATE =====================

describe("POST /api/programs", () => {
  it("creates a program", async () => {
    const res = await helpers.createProgram(coach.token, {
      name: "Push/Pull/Legs",
      description: "Classic PPL split",
      days: [
        { id: "d1", label: "Push", exercises: [{ name: "Bench Press", sets: 4, reps: "6-8" }] },
        { id: "d2", label: "Pull", exercises: [{ name: "Barbell Row", sets: 4, reps: "6-8" }] },
        { id: "d3", label: "Legs", exercises: [{ name: "Squat", sets: 4, reps: "5" }] },
      ],
    });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.id).toBeDefined();
  });

  it("rejects program with no name", async () => {
    const res = await agent
      .post("/api/programs")
      .set(helpers.authHeader(coach.token))
      .send({ name: "", days: [] });

    expect(res.status).toBe(400);
  });

  it("requires authentication", async () => {
    const res = await agent.post("/api/programs").send({ name: "Test", days: [] });
    expect(res.status).toBe(401);
  });
});

// ===================== READ =====================

describe("GET /api/programs", () => {
  it("returns own programs", async () => {
    const res = await agent
      .get("/api/programs")
      .set(helpers.authHeader(coach.token));

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);

    const ppl = res.body.find(p => p.name === "Push/Pull/Legs");
    expect(ppl).toBeDefined();
    expect(Array.isArray(ppl.days)).toBe(true);
    expect(ppl.days).toHaveLength(3);
  });

  it("returns days as parsed JSON arrays", async () => {
    const res = await agent
      .get("/api/programs")
      .set(helpers.authHeader(coach.token));

    const program = res.body[0];
    expect(Array.isArray(program.days)).toBe(true);
    expect(program.days[0].label).toBeDefined();
  });

  it("athlete sees zero programs (isolation)", async () => {
    const res = await agent
      .get("/api/programs")
      .set(helpers.authHeader(athlete.token));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });
});

// ===================== UPDATE =====================

describe("PUT /api/programs/:id", () => {
  let programId;

  beforeAll(async () => {
    const res = await agent
      .get("/api/programs")
      .set(helpers.authHeader(coach.token));
    programId = res.body[0].id;
  });

  it("updates a program", async () => {
    const res = await agent
      .put(`/api/programs/${programId}`)
      .set(helpers.authHeader(coach.token))
      .send({
        name: "Updated PPL",
        description: "Revised version",
        days: [{ id: "d1", label: "Push v2", exercises: [] }],
        shared: false,
      });

    expect(res.status).toBe(200);

    const programs = await agent
      .get("/api/programs")
      .set(helpers.authHeader(coach.token));
    const updated = programs.body.find(p => p.id === programId);
    expect(updated.name).toBe("Updated PPL");
  });

  it("rejects update from another user", async () => {
    const res = await agent
      .put(`/api/programs/${programId}`)
      .set(helpers.authHeader(athlete.token))
      .send({ name: "Hijacked", days: [] });

    expect(res.status).toBe(404);
  });
});

// ===================== SHARING & ADOPTION =====================

describe("program sharing and adoption", () => {
  let sharedProgramId;

  it("coach shares a program", async () => {
    const createRes = await helpers.createProgram(coach.token, {
      name: "Shared Hypertrophy",
      description: "Free program for the community",
      shared: true,
      days: [{ id: "d1", label: "Upper", exercises: [{ name: "DB Press", sets: 3, reps: "10-12" }] }],
    });
    sharedProgramId = createRes.body.id;

    // Athlete should now see it
    const res = await agent
      .get("/api/programs")
      .set(helpers.authHeader(athlete.token));

    const shared = res.body.find(p => p.id === sharedProgramId);
    expect(shared).toBeDefined();
    expect(shared.name).toBe("Shared Hypertrophy");
  });

  it("athlete adopts (forks) a shared program", async () => {
    const res = await agent
      .post(`/api/programs/${sharedProgramId}/adopt`)
      .set(helpers.authHeader(athlete.token));

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.id).toBeDefined();
    expect(res.body.id).not.toBe(sharedProgramId); // New ID

    // Athlete now has their own copy
    const programs = await agent
      .get("/api/programs")
      .set(helpers.authHeader(athlete.token));
    const adopted = programs.body.find(p => p.id === res.body.id);
    expect(adopted).toBeDefined();
    expect(adopted.name).toBe("Shared Hypertrophy");
  });

  it("cannot adopt a non-shared program", async () => {
    // Coach's private program
    const privateRes = await helpers.createProgram(coach.token, {
      name: "Private Program",
      shared: false,
    });
    const privateId = privateRes.body.id;

    const res = await agent
      .post(`/api/programs/${privateId}/adopt`)
      .set(helpers.authHeader(athlete.token));

    expect(res.status).toBe(404);
  });

  it("returns 404 for non-existent program adoption", async () => {
    const res = await agent
      .post("/api/programs/nonexistent123/adopt")
      .set(helpers.authHeader(athlete.token));

    expect(res.status).toBe(404);
  });
});

// ===================== DELETE =====================

describe("DELETE /api/programs/:id", () => {
  it("deletes own program", async () => {
    const createRes = await helpers.createProgram(coach.token, {
      name: "To Delete",
    });
    const id = createRes.body.id;

    const res = await agent
      .delete(`/api/programs/${id}`)
      .set(helpers.authHeader(coach.token));
    expect(res.status).toBe(200);

    // Verify gone
    const programs = await agent
      .get("/api/programs")
      .set(helpers.authHeader(coach.token));
    expect(programs.body.find(p => p.id === id)).toBeUndefined();
  });

  it("cannot delete another user's program", async () => {
    const createRes = await helpers.createProgram(coach.token, {
      name: "Protected",
    });
    const id = createRes.body.id;

    // Athlete tries to delete
    await agent
      .delete(`/api/programs/${id}`)
      .set(helpers.authHeader(athlete.token));

    // Still exists for coach
    const programs = await agent
      .get("/api/programs")
      .set(helpers.authHeader(coach.token));
    expect(programs.body.find(p => p.id === id)).toBeDefined();
  });
});

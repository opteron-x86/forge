// ═══════════════════════════════════════════════════════════════
//  TALOS — Profile Tests
//  Profile CRUD, bio history, data persistence, user isolation
// ═══════════════════════════════════════════════════════════════

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createTestApp } from "./setup.js";

let agent, helpers;
let user;

beforeAll(async () => {
  ({ agent, helpers } = await createTestApp());
  user = await helpers.registerUser({ email: "profile-test@example.com", name: "Profile User" });
});
afterAll(async () => helpers.cleanup());

// ===================== GET PROFILE =====================

describe("GET /api/profile", () => {
  it("returns default profile after registration", async () => {
    const res = await agent
      .get("/api/profile")
      .set(helpers.authHeader(user.token));

    expect(res.status).toBe(200);
    expect(res.body.onboardingComplete).toBe(false);
    expect(res.body.intensityScale).toBe("rpe");
    expect(res.body.restTimerCompound).toBe(150);
    expect(res.body.restTimerIsolation).toBe(90);
    expect(res.body.targetPrs).toEqual({});
    expect(res.body.pinnedLifts).toEqual([]);
    expect(Array.isArray(res.body.bioHistory)).toBe(true);
  });

  it("requires authentication", async () => {
    const res = await agent.get("/api/profile");
    expect(res.status).toBe(401);
  });
});

// ===================== UPDATE PROFILE =====================

describe("PUT /api/profile", () => {
  it("updates basic profile fields", async () => {
    const res = await agent
      .put("/api/profile")
      .set(helpers.authHeader(user.token))
      .send({
        height: "5'10\"",
        weight: 185,
        sex: "male",
        goal: "strength",
        experienceLevel: "intermediate",
        intensityScale: "rir",
      });

    expect(res.status).toBe(200);

    // Verify
    const profile = await agent
      .get("/api/profile")
      .set(helpers.authHeader(user.token));
    expect(profile.body.height).toBe("5'10\"");
    expect(profile.body.weight).toBe(185);
    expect(profile.body.sex).toBe("male");
    expect(profile.body.goal).toBe("strength");
    expect(profile.body.experienceLevel).toBe("intermediate");
    expect(profile.body.intensityScale).toBe("rir");
  });

  it("saves rest timer settings", async () => {
    await agent
      .put("/api/profile")
      .set(helpers.authHeader(user.token))
      .send({
        restTimerCompound: 180,
        restTimerIsolation: 60,
      });

    const profile = await agent
      .get("/api/profile")
      .set(helpers.authHeader(user.token));
    expect(profile.body.restTimerCompound).toBe(180);
    expect(profile.body.restTimerIsolation).toBe(60);
  });

  it("saves target PRs as JSON", async () => {
    const targetPrs = {
      "Bench Press": 225,
      "Squat": 315,
      "Deadlift": 405,
    };

    await agent
      .put("/api/profile")
      .set(helpers.authHeader(user.token))
      .send({ targetPrs });

    const profile = await agent
      .get("/api/profile")
      .set(helpers.authHeader(user.token));

    expect(profile.body.targetPrs).toEqual(targetPrs);
  });

  it("saves pinned lifts as JSON array", async () => {
    const pinnedLifts = ["Bench Press", "Squat", "Deadlift"];

    await agent
      .put("/api/profile")
      .set(helpers.authHeader(user.token))
      .send({ pinnedLifts });

    const profile = await agent
      .get("/api/profile")
      .set(helpers.authHeader(user.token));

    expect(profile.body.pinnedLifts).toEqual(pinnedLifts);
  });

  it("marks onboarding as complete", async () => {
    await agent
      .put("/api/profile")
      .set(helpers.authHeader(user.token))
      .send({ onboardingComplete: true });

    const profile = await agent
      .get("/api/profile")
      .set(helpers.authHeader(user.token));
    expect(profile.body.onboardingComplete).toBe(true);
  });

  it("sets nutrition targets", async () => {
    await agent
      .put("/api/profile")
      .set(helpers.authHeader(user.token))
      .send({
        caloriesTarget: 2500,
        proteinTarget: 180,
      });

    const profile = await agent
      .get("/api/profile")
      .set(helpers.authHeader(user.token));
    expect(profile.body.caloriesTarget).toBe(2500);
    expect(profile.body.proteinTarget).toBe(180);
  });
});

// ===================== BIO HISTORY =====================

describe("bio history tracking", () => {
  it("auto-records weight to bio history when profile is updated", async () => {
    await agent
      .put("/api/profile")
      .set(helpers.authHeader(user.token))
      .send({ weight: 186, bodyFat: 15.5 });

    const profile = await agent
      .get("/api/profile")
      .set(helpers.authHeader(user.token));

    expect(profile.body.bioHistory.length).toBeGreaterThanOrEqual(1);

    const latest = profile.body.bioHistory[profile.body.bioHistory.length - 1];
    expect(latest.weight).toBe(186);
    expect(latest.body_fat).toBe(15.5);
  });

  it("updates same-day bio history entry instead of creating duplicate", async () => {
    const beforeRes = await agent
      .get("/api/profile")
      .set(helpers.authHeader(user.token));
    const countBefore = beforeRes.body.bioHistory.length;

    // Update weight again (same day)
    await agent
      .put("/api/profile")
      .set(helpers.authHeader(user.token))
      .send({ weight: 187 });

    const afterRes = await agent
      .get("/api/profile")
      .set(helpers.authHeader(user.token));
    const countAfter = afterRes.body.bioHistory.length;

    // Should NOT have created a new entry
    expect(countAfter).toBe(countBefore);

    // Latest entry should have updated weight
    const latest = afterRes.body.bioHistory[afterRes.body.bioHistory.length - 1];
    expect(latest.weight).toBe(187);
  });
});

// ===================== USER ISOLATION =====================

describe("profile user isolation", () => {
  it("different users have independent profiles", async () => {
    const otherUser = await helpers.registerUser({ email: "other-profile@example.com" });

    // Set user's profile with known values
    await agent
      .put("/api/profile")
      .set(helpers.authHeader(user.token))
      .send({ height: "5'10\"", goal: "strength" });

    // Update other user's profile with different values
    await agent
      .put("/api/profile")
      .set(helpers.authHeader(otherUser.token))
      .send({ height: "6'2\"", goal: "hypertrophy" });

    // Original user's profile should be unchanged
    const profile = await agent
      .get("/api/profile")
      .set(helpers.authHeader(user.token));
    expect(profile.body.goal).toBe("strength");
    expect(profile.body.height).toBe("5'10\"");

    // Other user has their own values
    const otherProfile = await agent
      .get("/api/profile")
      .set(helpers.authHeader(otherUser.token));
    expect(otherProfile.body.goal).toBe("hypertrophy");
    expect(otherProfile.body.height).toBe("6'2\"");
  });
});

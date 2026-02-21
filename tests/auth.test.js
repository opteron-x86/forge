// ═══════════════════════════════════════════════════════════════
//  TALOS — Auth Tests
//  Registration, login, token validation, account management
// ═══════════════════════════════════════════════════════════════

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createTestApp } from "./setup.js";

let agent, helpers;

beforeAll(async () => {
  ({ agent, helpers } = await createTestApp());
});
afterAll(async () => helpers.cleanup());

// ===================== REGISTRATION =====================

describe("POST /api/auth/register", () => {
  it("registers a new user and returns token + user", async () => {
    const res = await agent.post("/api/auth/register").send({
      email: "alice@example.com",
      password: "securepass123",
      name: "Alice",
      color: "#3b82f6",
    });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user).toMatchObject({
      email: "alice@example.com",
      name: "Alice",
      role: "user",
      color: "#3b82f6",
    });
    expect(res.body.user.id).toBeDefined();
  });

  it("creates a profile row for the new user", async () => {
    const profile = await helpers.db.get(
      "SELECT * FROM profiles WHERE user_id = (SELECT id FROM users WHERE email = $1)",
      ["alice@example.com"]
    );
    expect(profile).toBeDefined();
  });

  it("rejects duplicate email", async () => {
    const res = await agent.post("/api/auth/register").send({
      email: "alice@example.com",
      password: "anotherpass123",
      name: "Alice 2",
    });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already registered/i);
  });

  it("normalizes email to lowercase", async () => {
    const res = await agent.post("/api/auth/register").send({
      email: "BOB@EXAMPLE.COM",
      password: "securepass123",
      name: "Bob",
    });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("bob@example.com");
  });

  it("rejects missing email", async () => {
    const res = await agent.post("/api/auth/register").send({
      password: "securepass123",
      name: "NoEmail",
    });
    expect(res.status).toBe(400);
  });

  it("rejects short password (< 8 chars)", async () => {
    const res = await agent.post("/api/auth/register").send({
      email: "short@example.com",
      password: "abc",
      name: "Short",
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/8 characters/);
  });

  it("rejects missing name", async () => {
    const res = await agent.post("/api/auth/register").send({
      email: "noname@example.com",
      password: "securepass123",
    });
    expect(res.status).toBe(400);
  });
});

// ===================== LOGIN =====================

describe("POST /api/auth/login", () => {
  it("logs in with correct credentials", async () => {
    const res = await agent.post("/api/auth/login").send({
      email: "alice@example.com",
      password: "securepass123",
    });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe("alice@example.com");
    expect(res.body.user.name).toBe("Alice");
  });

  it("is case-insensitive on email", async () => {
    const res = await agent.post("/api/auth/login").send({
      email: "ALICE@example.com",
      password: "securepass123",
    });
    expect(res.status).toBe(200);
  });

  it("rejects wrong password", async () => {
    const res = await agent.post("/api/auth/login").send({
      email: "alice@example.com",
      password: "wrongpassword",
    });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid/i);
  });

  it("rejects non-existent email", async () => {
    const res = await agent.post("/api/auth/login").send({
      email: "nobody@example.com",
      password: "whatever123",
    });
    expect(res.status).toBe(401);
  });

  it("rejects missing fields", async () => {
    const res = await agent.post("/api/auth/login").send({});
    expect(res.status).toBe(400);
  });
});

// ===================== TOKEN / AUTH MIDDLEWARE =====================

describe("GET /api/auth/me", () => {
  it("returns user info with valid token", async () => {
    const { token } = await helpers.registerUser({ email: "me-test@example.com" });
    const res = await agent
      .get("/api/auth/me")
      .set(helpers.authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.email).toBe("me-test@example.com");
    expect(res.body.id).toBeDefined();
    expect(res.body.role).toBe("user");
  });

  it("rejects request with no token", async () => {
    const res = await agent.get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("rejects request with malformed token", async () => {
    const res = await agent
      .get("/api/auth/me")
      .set({ Authorization: "Bearer not.a.real.token" });
    expect(res.status).toBe(401);
  });

  it("rejects request with Bearer but no token", async () => {
    const res = await agent
      .get("/api/auth/me")
      .set({ Authorization: "Bearer " });
    expect(res.status).toBe(401);
  });
});

// ===================== ACCOUNT UPDATE =====================

describe("PUT /api/auth/account", () => {
  it("updates user name", async () => {
    const { token } = await helpers.registerUser({ email: "update-test@example.com", name: "OldName" });

    const res = await agent
      .put("/api/auth/account")
      .set(helpers.authHeader(token))
      .send({ name: "NewName" });

    expect(res.status).toBe(200);

    // Verify via /me
    const me = await agent
      .get("/api/auth/me")
      .set(helpers.authHeader(token));
    expect(me.body.name).toBe("NewName");
  });

  it("updates user theme", async () => {
    const { token } = await helpers.registerUser({ email: "theme-test@example.com" });

    const res = await agent
      .put("/api/auth/account")
      .set(helpers.authHeader(token))
      .send({ theme: "midnight" });

    expect(res.status).toBe(200);

    const me = await agent
      .get("/api/auth/me")
      .set(helpers.authHeader(token));
    expect(me.body.theme).toBe("midnight");
  });

  it("requires authentication", async () => {
    const res = await agent.put("/api/auth/account").send({ name: "Hacker" });
    expect(res.status).toBe(401);
  });
});

// ===================== USER ISOLATION =====================

describe("user isolation", () => {
  it("tokens from different users access different data", async () => {
    const userA = await helpers.registerUser({ email: "isolation-a@example.com", name: "User A" });
    const userB = await helpers.registerUser({ email: "isolation-b@example.com", name: "User B" });

    const meA = await agent.get("/api/auth/me").set(helpers.authHeader(userA.token));
    const meB = await agent.get("/api/auth/me").set(helpers.authHeader(userB.token));

    expect(meA.body.name).toBe("User A");
    expect(meB.body.name).toBe("User B");
    expect(meA.body.id).not.toBe(meB.body.id);
  });
});

// ===================== HEALTH =====================

describe("GET /api/health", () => {
  it("returns ok status", async () => {
    const res = await agent.get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});

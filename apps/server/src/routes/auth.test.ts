import { describe, expect, it, beforeEach } from "vitest";
import request from "supertest";
import type { Express } from "express";
import { createServer } from "../app";
import { createDb } from "../db";

let app: Express;

beforeEach(() => {
  const db = createDb(":memory:");
  app = createServer({ db, sessionSecret: "test-secret" });
});

describe("POST /api/register", () => {
  it("creates a user and never leaks the password hash", async () => {
    const res = await request(app)
      .post("/api/register")
      .send({ username: "alice", password: "hunter2222" });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: expect.any(Number), username: "alice", email: null });
    expect(res.body).not.toHaveProperty("password_hash");
  });

  it("rejects a duplicate username", async () => {
    await request(app).post("/api/register").send({ username: "alice", password: "hunter2222" });
    const res = await request(app).post("/api/register").send({ username: "alice", password: "different1" });
    expect(res.status).toBe(409);
  });

  it("rejects an invalid payload", async () => {
    const res = await request(app).post("/api/register").send({ username: "ab", password: "short" });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/login and GET /api/me", () => {
  it("returns 401 from /api/me when logged out", async () => {
    const res = await request(app).get("/api/me");
    expect(res.status).toBe(401);
  });

  it("logs in with correct credentials and persists the session for /api/me", async () => {
    await request(app).post("/api/register").send({ username: "bob", password: "correcthorse" });

    const agent = request.agent(app);
    const loginRes = await agent.post("/api/login").send({ username: "bob", password: "correcthorse" });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.username).toBe("bob");

    const meRes = await agent.get("/api/me");
    expect(meRes.status).toBe(200);
    expect(meRes.body.username).toBe("bob");
  });

  it("rejects an incorrect password", async () => {
    await request(app).post("/api/register").send({ username: "carol", password: "correcthorse" });
    const res = await request(app).post("/api/login").send({ username: "carol", password: "wrongpassword" });
    expect(res.status).toBe(401);
  });

  it("rejects login for a username that doesn't exist", async () => {
    const res = await request(app).post("/api/login").send({ username: "nobody", password: "whatever1" });
    expect(res.status).toBe(401);
  });
});

describe("POST /api/logout", () => {
  it("ends the session so /api/me goes back to 401", async () => {
    await request(app).post("/api/register").send({ username: "dave", password: "correcthorse" });
    const agent = request.agent(app);
    await agent.post("/api/login").send({ username: "dave", password: "correcthorse" });
    expect((await agent.get("/api/me")).status).toBe(200);

    const logoutRes = await agent.post("/api/logout");
    expect(logoutRes.status).toBe(204);

    expect((await agent.get("/api/me")).status).toBe(401);
  });
});

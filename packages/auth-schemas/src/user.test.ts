import { describe, expect, it } from "vitest";
import { PublicUserSchema, CredentialsSchema, RegisterPayloadSchema } from "./user";

describe("PublicUserSchema", () => {
  it("accepts a valid public user shape", () => {
    const result = PublicUserSchema.safeParse({ id: 1, username: "alice", email: null });
    expect(result.success).toBe(true);
  });

  it("rejects a payload carrying a password hash", () => {
    const result = PublicUserSchema.safeParse({
      id: 1,
      username: "alice",
      email: null,
      password_hash: "$2b$10$...",
    });
    expect(result.success).toBe(true);
    expect(result.data).not.toHaveProperty("password_hash");
  });

  it("rejects a malformed shape", () => {
    const result = PublicUserSchema.safeParse({ id: "1", username: "alice" });
    expect(result.success).toBe(false);
  });
});

describe("CredentialsSchema", () => {
  it("accepts valid credentials", () => {
    expect(CredentialsSchema.safeParse({ username: "alice", password: "hunter22" }).success).toBe(true);
  });

  it("rejects a too-short password", () => {
    expect(CredentialsSchema.safeParse({ username: "alice", password: "short" }).success).toBe(false);
  });

  it("rejects a too-short username", () => {
    expect(CredentialsSchema.safeParse({ username: "ab", password: "hunter22" }).success).toBe(false);
  });
});

describe("RegisterPayloadSchema", () => {
  it("accepts credentials with an optional email", () => {
    const result = RegisterPayloadSchema.safeParse({
      username: "alice",
      password: "hunter22",
      email: "alice@example.com",
    });
    expect(result.success).toBe(true);
  });

  it("accepts credentials with no email", () => {
    expect(RegisterPayloadSchema.safeParse({ username: "alice", password: "hunter22" }).success).toBe(true);
  });

  it("rejects a malformed email", () => {
    const result = RegisterPayloadSchema.safeParse({
      username: "alice",
      password: "hunter22",
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });
});

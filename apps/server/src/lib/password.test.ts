import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("hashPassword / verifyPassword", () => {
  it("round-trips a correct password", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(await verifyPassword("correct horse battery staple", hash)).toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(await verifyPassword("wrong password", hash)).toBe(false);
  });

  it("salts the same password differently on each call", async () => {
    const hashA = await hashPassword("same password");
    const hashB = await hashPassword("same password");
    expect(hashA).not.toBe(hashB);
    expect(await verifyPassword("same password", hashA)).toBe(true);
    expect(await verifyPassword("same password", hashB)).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import { readStoredVaultRoot, writeStoredVaultRoot, clearStoredVaultRoot } from "./vault-root-storage";

function fakeStorage(initial: Record<string, string> = {}) {
  const data = { ...initial };
  return {
    getItem: (key: string) => data[key] ?? null,
    setItem: (key: string, value: string) => {
      data[key] = value;
    },
    removeItem: (key: string) => {
      delete data[key];
    },
    _data: data,
  };
}

describe("readStoredVaultRoot", () => {
  it("returns null when nothing is stored", () => {
    expect(readStoredVaultRoot(fakeStorage())).toBeNull();
  });

  it("returns a previously stored root", () => {
    expect(readStoredVaultRoot(fakeStorage({ "manyouscript-last-vault-root": "/Users/me/Novel" }))).toBe(
      "/Users/me/Novel",
    );
  });
});

describe("writeStoredVaultRoot", () => {
  it("persists the root under the expected key", () => {
    const storage = fakeStorage();
    writeStoredVaultRoot(storage, "/Users/me/Novel");
    expect(storage._data["manyouscript-last-vault-root"]).toBe("/Users/me/Novel");
  });
});

describe("clearStoredVaultRoot", () => {
  it("removes a stored root", () => {
    const storage = fakeStorage({ "manyouscript-last-vault-root": "/Users/me/Novel" });
    clearStoredVaultRoot(storage);
    expect(readStoredVaultRoot(storage)).toBeNull();
  });
});

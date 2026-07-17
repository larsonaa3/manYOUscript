import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { saveVaultRootHandle, loadVaultRootHandle, clearVaultRootHandle } from "./handle-store";

function makeFakeHandle(name: string): FileSystemDirectoryHandle {
  return { kind: "directory", name } as unknown as FileSystemDirectoryHandle;
}

beforeEach(async () => {
  await clearVaultRootHandle();
});

describe("handle-store", () => {
  it("returns null when nothing has been saved", async () => {
    expect(await loadVaultRootHandle()).toBeNull();
  });

  it("round-trips a saved handle", async () => {
    await saveVaultRootHandle(makeFakeHandle("Novel"));
    const loaded = await loadVaultRootHandle();
    expect(loaded?.name).toBe("Novel");
  });

  it("overwrites a previously saved handle", async () => {
    await saveVaultRootHandle(makeFakeHandle("Novel"));
    await saveVaultRootHandle(makeFakeHandle("Campaign"));
    const loaded = await loadVaultRootHandle();
    expect(loaded?.name).toBe("Campaign");
  });

  it("removes a saved handle", async () => {
    await saveVaultRootHandle(makeFakeHandle("Novel"));
    await clearVaultRootHandle();
    expect(await loadVaultRootHandle()).toBeNull();
  });
});

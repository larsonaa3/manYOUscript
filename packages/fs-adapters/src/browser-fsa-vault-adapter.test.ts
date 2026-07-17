import { beforeEach, describe, expect, it, vi } from "vitest";
import { BrowserFsaVaultAdapter } from "./browser-fsa-vault-adapter";
import * as handleStore from "./handle-store";

// Real handles are opaque native browser references the structured-clone
// algorithm knows how to serialize specially - that's exactly what makes
// them untestable outside a real browser, same as showDirectoryPicker()
// itself. So handle-store's actual IndexedDB round-trip is covered
// separately (handle-store.test.ts, with plain-data fake handles); here
// we mock it out entirely to test the adapter's restore/reconnect state
// machine in isolation.
vi.mock("./handle-store", () => ({
  saveVaultRootHandle: vi.fn().mockResolvedValue(undefined),
  loadVaultRootHandle: vi.fn(),
  clearVaultRootHandle: vi.fn().mockResolvedValue(undefined),
}));

function makeFakeHandle(
  name: string,
  queryResult: PermissionState = "granted",
  requestResult: PermissionState = queryResult,
): FileSystemDirectoryHandle {
  return {
    kind: "directory",
    name,
    queryPermission: vi.fn().mockResolvedValue(queryResult),
    requestPermission: vi.fn().mockResolvedValue(requestResult),
  } as unknown as FileSystemDirectoryHandle;
}

beforeEach(() => {
  vi.mocked(handleStore.loadVaultRootHandle).mockReset().mockResolvedValue(null);
  vi.mocked(handleStore.clearVaultRootHandle).mockClear();
});

describe("BrowserFsaVaultAdapter.tryRestoreVaultRoot", () => {
  it("reports none when no handle was ever saved", async () => {
    const adapter = new BrowserFsaVaultAdapter();
    expect(await adapter.tryRestoreVaultRoot()).toEqual({ status: "none" });
  });

  it("silently restores when permission is already granted", async () => {
    vi.mocked(handleStore.loadVaultRootHandle).mockResolvedValue(makeFakeHandle("Novel", "granted"));
    const adapter = new BrowserFsaVaultAdapter();
    expect(await adapter.tryRestoreVaultRoot()).toEqual({ status: "restored", root: "Novel" });
  });

  it("reports needs-permission when the browser requires a fresh gesture", async () => {
    vi.mocked(handleStore.loadVaultRootHandle).mockResolvedValue(makeFakeHandle("Novel", "prompt"));
    const adapter = new BrowserFsaVaultAdapter();
    expect(await adapter.tryRestoreVaultRoot()).toEqual({ status: "needs-permission", name: "Novel" });
  });
});

describe("BrowserFsaVaultAdapter.reconnectVaultRoot", () => {
  it("returns null when there is nothing pending", async () => {
    const adapter = new BrowserFsaVaultAdapter();
    expect(await adapter.reconnectVaultRoot()).toBeNull();
  });

  it("grants access and returns the root name on approval", async () => {
    vi.mocked(handleStore.loadVaultRootHandle).mockResolvedValue(makeFakeHandle("Novel", "prompt", "granted"));
    const adapter = new BrowserFsaVaultAdapter();
    await adapter.tryRestoreVaultRoot();

    expect(await adapter.reconnectVaultRoot()).toBe("Novel");
  });

  it("clears the saved handle when the user explicitly denies", async () => {
    vi.mocked(handleStore.loadVaultRootHandle).mockResolvedValue(makeFakeHandle("Novel", "prompt", "denied"));
    const adapter = new BrowserFsaVaultAdapter();
    await adapter.tryRestoreVaultRoot();

    expect(await adapter.reconnectVaultRoot()).toBeNull();
    expect(handleStore.clearVaultRootHandle).toHaveBeenCalledTimes(1);
  });
});

import { describe, expect, it } from "vitest";
import { createWebVaultAdapter } from "./create-web-vault-adapter";
import { BrowserFsaVaultAdapter } from "./browser-fsa-vault-adapter";
import { FallbackVaultAdapter } from "./fallback-vault-adapter";

describe("createWebVaultAdapter", () => {
  it("picks the File System Access adapter when supported", () => {
    expect(createWebVaultAdapter(true)).toBeInstanceOf(BrowserFsaVaultAdapter);
  });

  it("picks the fallback adapter when unsupported", () => {
    expect(createWebVaultAdapter(false)).toBeInstanceOf(FallbackVaultAdapter);
  });
});

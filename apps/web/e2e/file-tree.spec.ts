import { test, expect } from "@playwright/test";
import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { mockAuthenticatedSession } from "./helpers/auth";

async function makeNestedVault(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "myc-e2e-tree-"));
  await fs.writeFile(path.join(dir, "intro.md"), "---\ntitle: Intro\n---\nRoot-level note.\n");
  await fs.mkdir(path.join(dir, "characters"), { recursive: true });
  await fs.writeFile(path.join(dir, "characters", "aria.md"), "---\ntitle: Aria\n---\nA character note.\n");
  await fs.writeFile(path.join(dir, "characters", "bram.md"), "---\ntitle: Bram\n---\nAnother character.\n");
  await fs.mkdir(path.join(dir, "campaign", "sessions"), { recursive: true });
  await fs.writeFile(
    path.join(dir, "campaign", "sessions", "session-1.md"),
    "---\ntitle: Session 1\n---\nFirst session log.\n",
  );
  return dir;
}

test.describe("sidebar file tree", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedSession(page);
  });

  test("groups nested files under expandable folders and keeps root files flat", async ({ page }) => {
    const vaultDir = await makeNestedVault();
    await page.addInitScript(() => {
      delete (window as unknown as { showDirectoryPicker?: unknown }).showDirectoryPicker;
    });
    await page.goto("/");

    const [chooser] = await Promise.all([
      page.waitForEvent("filechooser"),
      page.getByRole("button", { name: "Open Vault Folder" }).click(),
    ]);
    await chooser.setFiles(vaultDir);
    await page.waitForTimeout(300);

    // Root-level file is visible directly, no folder wrapper.
    await expect(page.getByRole("button", { name: "intro.md" })).toBeVisible();

    // Folders render as expandable rows, expanded by default.
    const charactersFolder = page.getByRole("button", { name: "characters", exact: false });
    await expect(charactersFolder).toBeVisible();
    await expect(page.getByRole("button", { name: "aria.md" })).toBeVisible();
    await expect(page.getByRole("button", { name: "bram.md" })).toBeVisible();

    // Nested (multi-level) folders also expand and reveal their file.
    await expect(page.getByRole("button", { name: "session-1.md" })).toBeVisible();

    // Collapsing a folder hides its children.
    await charactersFolder.click();
    await expect(page.getByRole("button", { name: "aria.md" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "bram.md" })).toHaveCount(0);

    // Re-expanding brings them back.
    await charactersFolder.click();
    await expect(page.getByRole("button", { name: "aria.md" })).toBeVisible();

    // Clicking a nested file opens it in the editor.
    await page.getByRole("button", { name: "aria.md" }).click();
    await expect(page.locator(".myc-editor-header__filename")).toHaveText("characters/aria.md");

    await fs.rm(vaultDir, { recursive: true, force: true });
  });
});

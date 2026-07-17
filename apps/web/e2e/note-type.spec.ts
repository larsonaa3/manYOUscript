import { test, expect } from "@playwright/test";
import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { mockAuthenticatedSession } from "./helpers/auth";

async function makeTypedVault(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "myc-e2e-note-type-"));
  await fs.writeFile(path.join(dir, "plain.md"), "---\ntitle: Plain\n---\nJust some prose.\n");
  await fs.writeFile(
    path.join(dir, "aria.md"),
    "---\ntitle: Aria\n---\n```rpg:novel-character-v1\nname: Aria\nrole: protagonist\n```\n",
  );
  await fs.writeFile(
    path.join(dir, "chapter-one.md"),
    "---\nmanuscript: Test Novel\norder: 1\n---\nThe storm rolled in.\n",
  );
  return dir;
}

test.describe("per-note type", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedSession(page);
  });

  test("infers type from existing signals and hides the Character Sheet toggle for non-characters", async ({
    page,
  }) => {
    const vaultDir = await makeTypedVault();
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

    const typeSelect = page.getByLabel("Note type");
    const sheetToggle = page.getByRole("button", { name: "Character Sheet" });

    await page.getByRole("button", { name: "plain.md" }).click();
    await page.waitForTimeout(200);
    await expect(typeSelect).toHaveValue("note");
    await expect(sheetToggle).toHaveCount(0);

    await page.getByRole("button", { name: "chapter-one.md" }).click();
    await page.waitForTimeout(200);
    await expect(typeSelect).toHaveValue("chapter");
    await expect(sheetToggle).toHaveCount(0);

    await page.getByRole("button", { name: "aria.md" }).click();
    await page.waitForTimeout(200);
    await expect(typeSelect).toHaveValue("character");
    await expect(sheetToggle).toBeVisible();

    await fs.rm(vaultDir, { recursive: true, force: true });
  });

  test("overriding the type via the dropdown persists to frontmatter and updates the toggle", async ({ page }) => {
    const vaultDir = await makeTypedVault();
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

    await page.getByRole("button", { name: "plain.md" }).click();
    await page.waitForTimeout(200);

    const typeSelect = page.getByLabel("Note type");
    await expect(typeSelect).toHaveValue("note");
    await expect(page.getByRole("button", { name: "Character Sheet" })).toHaveCount(0);

    await typeSelect.selectOption("character");
    await expect(page.getByRole("button", { name: "Character Sheet" })).toBeVisible();
    await expect(page.locator(".myc-editor-header__actions span").last()).toHaveText(/saved/);

    // Re-select the file to confirm the override was actually written into
    // frontmatter (and re-read from it) rather than just held in UI state.
    await page.getByRole("button", { name: "chapter-one.md" }).click();
    await page.waitForTimeout(200);
    await page.getByRole("button", { name: "plain.md" }).click();
    await page.waitForTimeout(200);
    await expect(typeSelect).toHaveValue("character");
    await expect(page.getByRole("button", { name: "Character Sheet" })).toBeVisible();

    await fs.rm(vaultDir, { recursive: true, force: true });
  });
});

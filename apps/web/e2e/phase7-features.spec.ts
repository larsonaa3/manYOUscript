import { test, expect } from "@playwright/test";
import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";

async function makeDemoVault(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "myc-e2e-vault-"));
  await fs.writeFile(path.join(dir, "note-a.md"), "---\ntitle: Note A\n---\nFirst note.\n");
  await fs.writeFile(path.join(dir, "note-b.md"), "---\ntitle: Note B\n---\nSecond note.\n");
  await fs.writeFile(
    path.join(dir, "chapter-one.md"),
    "---\nmanuscript: Test Novel\norder: 1\n---\nThe storm rolled in.\n",
  );
  await fs.writeFile(
    path.join(dir, "chapter-two.md"),
    "---\nmanuscript: Test Novel\norder: 2\n---\nBy dawn, the losses were counted.\n",
  );
  return dir;
}

test.describe("Phase 7: theme, quick switcher, export", () => {
  test("theme toggle cycles system -> light -> dark and persists across reload", async ({ page }) => {
    await page.goto("/");

    const toggle = page.locator(".myc-theme-toggle");
    await expect(toggle).toHaveText("Theme: System");

    await toggle.click();
    await expect(toggle).toHaveText("Theme: Light");
    expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe("light");

    await toggle.click();
    await expect(toggle).toHaveText("Theme: Dark");
    expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe("dark");

    await page.reload();
    await expect(page.locator(".myc-theme-toggle")).toHaveText("Theme: Dark");
    expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe("dark");
  });

  test("Ctrl+P opens a quick switcher that filters and opens a note", async ({ page }) => {
    const vaultDir = await makeDemoVault();
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

    await page.keyboard.down("Control");
    await page.keyboard.press("p");
    await page.keyboard.up("Control");
    await expect(page.locator(".myc-quick-switcher")).toBeVisible();

    await page.keyboard.type("note-b");
    await expect(page.locator(".myc-quick-switcher__item")).toHaveCount(1);
    await page.keyboard.press("Enter");

    await expect(page.locator(".myc-editor-header span").first()).toHaveText("note-b.md");
    await fs.rm(vaultDir, { recursive: true, force: true });
  });

  test("Ctrl+. toggles focus mode and Ctrl+S saves immediately", async ({ page }) => {
    const vaultDir = await makeDemoVault();
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
    await page.getByRole("button", { name: "note-a.md" }).click();
    await page.waitForTimeout(200);

    await page.keyboard.down("Control");
    await page.keyboard.press(".");
    await page.keyboard.up("Control");
    await expect(page.locator(".myc-layout--focus")).toHaveCount(1);
    await page.keyboard.down("Control");
    await page.keyboard.press(".");
    await page.keyboard.up("Control");
    await expect(page.locator(".myc-layout--focus")).toHaveCount(0);

    await page.click(".ProseMirror");
    await page.keyboard.type(" More text.");
    await page.keyboard.down("Control");
    await page.keyboard.press("s");
    await page.keyboard.up("Control");
    await expect(page.locator(".myc-editor-header__actions span").last()).toHaveText(/saved/);

    await fs.rm(vaultDir, { recursive: true, force: true });
  });

  test("exporting a manuscript downloads the compiled markdown", async ({ page }) => {
    const vaultDir = await makeDemoVault();
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

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Export .md" }).click(),
    ]);
    expect(download.suggestedFilename()).toBe("Test Novel.md");
    const downloadPath = await download.path();
    const content = await fs.readFile(downloadPath!, "utf8");
    expect(content).toContain("# Test Novel");
    expect(content).toContain("The storm rolled in.");
    expect(content).toContain("By dawn, the losses were counted.");

    await fs.rm(vaultDir, { recursive: true, force: true });
  });
});

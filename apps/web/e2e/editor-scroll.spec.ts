import { test, expect } from "@playwright/test";
import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { mockAuthenticatedSession } from "./helpers/auth";

async function makeLongNoteVault(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "myc-e2e-scroll-"));
  const paragraphs = Array.from(
    { length: 200 },
    (_, i) => `Paragraph ${i + 1}. Lorem ipsum dolor sit amet, consectetur adipiscing elit.`,
  ).join("\n\n");
  await fs.writeFile(path.join(dir, "long-note.md"), `---\ntitle: Long Note\n---\n${paragraphs}\n`);
  return dir;
}

test.describe("editor scrolling", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedSession(page);
  });

  test("a note taller than the viewport scrolls with the mouse wheel", async ({ page }) => {
    const vaultDir = await makeLongNoteVault();
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

    await page.getByRole("button", { name: "long-note.md" }).click();
    await page.waitForTimeout(200);

    const prosemirror = page.locator(".ProseMirror");

    // Regression guard: the editor content must actually be clipped to the
    // available space (scrollHeight > clientHeight), not grown to fit all
    // of its content - Tiptap's <EditorContent> wraps .ProseMirror in an
    // unstyled div that silently breaks the flex/overflow chain if that
    // wrapper isn't given flex:1 + min-height:0 of its own.
    const { scrollHeight, clientHeight } = await prosemirror.evaluate((el) => ({
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
    }));
    expect(scrollHeight).toBeGreaterThan(clientHeight);

    const box = await prosemirror.boundingBox();
    if (!box) throw new Error("expected .ProseMirror to have a bounding box");
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);

    const scrollTopBefore = await prosemirror.evaluate((el) => el.scrollTop);
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(100);
    const scrollTopAfter = await prosemirror.evaluate((el) => el.scrollTop);

    expect(scrollTopAfter).toBeGreaterThan(scrollTopBefore);

    await fs.rm(vaultDir, { recursive: true, force: true });
  });
});

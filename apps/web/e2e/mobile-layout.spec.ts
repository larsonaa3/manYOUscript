import { test, expect } from "@playwright/test";

// Pick just the properties relevant to testing our CSS breakpoint,
// rather than spreading the whole devices["iPhone 13"] preset - that
// preset also sets defaultBrowserType: "webkit", which conflicts with
// this project's fixed Chromium-only setup.
test.use({ viewport: { width: 390, height: 664 }, isMobile: true, hasTouch: true });

test("at a phone viewport, the sidebar is a hidden drawer opened via the hamburger toggle", async ({ page }) => {
  await page.goto("/");

  const toggle = page.locator(".myc-mobile-nav-toggle");
  await expect(toggle).toBeVisible();

  const sidebar = page.locator(".myc-sidebar");
  const sidebarBox = await sidebar.boundingBox();
  expect(sidebarBox).not.toBeNull();
  // Off-screen (translateX(-100%)) until opened.
  expect(sidebarBox!.x).toBeLessThan(0);

  await toggle.click();
  await expect(page.locator(".myc-layout--nav-open")).toHaveCount(1);
  // The drawer slides in over 200ms (CSS transition); wait for it to settle.
  await page.waitForTimeout(300);
  const openedBox = await sidebar.boundingBox();
  expect(openedBox!.x).toBeGreaterThanOrEqual(0);

  // Click in the exposed dimmed strip beyond the drawer's right edge
  // (the drawer itself covers the left ~75% and would intercept a
  // default center click, same as it would for a real tap there).
  await page.locator(".myc-mobile-nav-scrim").click({ position: { x: 380, y: 50 } });
  await expect(page.locator(".myc-layout--nav-open")).toHaveCount(0);
});

test("tap targets meet a 44px minimum height at phone viewport", async ({ page }) => {
  await page.goto("/");
  await page.locator(".myc-mobile-nav-toggle").click();

  const openVaultButton = page.getByRole("button", { name: "Open Vault Folder" });
  const box = await openVaultButton.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.height).toBeGreaterThanOrEqual(44);
});

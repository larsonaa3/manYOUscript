import { test, expect } from "@playwright/test";

test("boots, detects File System Access support, and shows no degraded-browser banner", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle("manYOUscript");

  const hasFsAccess = await page.evaluate(() => typeof (window as any).showDirectoryPicker === "function");
  expect(hasFsAccess).toBe(true);

  await expect(page.locator(".myc-browser-banner")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Open Vault Folder" })).toBeVisible();
});

test("manifest and service worker are registered", async ({ page }) => {
  await page.goto("/");

  const manifestHref = await page
    .locator('link[rel="manifest"]')
    .getAttribute("href");
  expect(manifestHref).toBeTruthy();

  const swRegistered = await page.waitForFunction(
    async () => {
      if (!("serviceWorker" in navigator)) {
        return false;
      }
      const registration = await navigator.serviceWorker.getRegistration();
      return Boolean(registration);
    },
    { timeout: 10_000 },
  );
  expect(await swRegistered.jsonValue()).toBe(true);
});

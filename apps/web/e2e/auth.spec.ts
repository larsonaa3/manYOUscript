import { test, expect } from "@playwright/test";

test.describe("login gate", () => {
  test("blocks the app until /api/me resolves to an authenticated session", async ({ page }) => {
    await page.route("**/api/me", (route) => {
      route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ error: "Not authenticated" }) });
    });

    await page.goto("/");

    await expect(page.locator(".myc-login-gate")).toBeVisible();
    await expect(page.getByRole("button", { name: "Open Vault Folder" })).toHaveCount(0);
  });

  test("a valid login unblocks the app", async ({ page }) => {
    await page.route("**/api/me", (route) => {
      route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ error: "Not authenticated" }) });
    });
    await page.route("**/api/login", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ id: 1, username: "alice", email: null }),
      });
    });

    await page.goto("/");
    await expect(page.locator(".myc-login-gate")).toBeVisible();

    await page.getByLabel("Username").fill("alice");
    await page.getByLabel("Password").fill("correcthorse");
    await page.getByRole("button", { name: "Log in" }).click();

    await expect(page.locator(".myc-login-gate")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Open Vault Folder" })).toBeVisible();
  });

  test("an invalid login shows an inline error and keeps the app hidden", async ({ page }) => {
    await page.route("**/api/me", (route) => {
      route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ error: "Not authenticated" }) });
    });
    await page.route("**/api/login", (route) => {
      route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ error: "Invalid username or password" }),
      });
    });

    await page.goto("/");
    await page.getByLabel("Username").fill("alice");
    await page.getByLabel("Password").fill("wrongpassword");
    await page.getByRole("button", { name: "Log in" }).click();

    await expect(page.locator(".myc-login-form__error")).toHaveText("Invalid username or password");
    await expect(page.getByRole("button", { name: "Open Vault Folder" })).toHaveCount(0);
  });
});

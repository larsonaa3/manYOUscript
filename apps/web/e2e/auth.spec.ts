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

  test("a stored dark theme preference applies to the login screen itself, before authentication", async ({
    page,
  }) => {
    // Regression test: theme resolution used to live inside App(), which
    // never mounts while unauthenticated - the login screen silently had no
    // theme applied at all. ThemeProvider now wraps LoginGate specifically
    // to fix this.
    await page.addInitScript(() => {
      window.localStorage.setItem("manyouscript-theme", "dark");
    });
    await page.route("**/api/me", (route) => {
      route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ error: "Not authenticated" }) });
    });

    await page.goto("/");

    await expect(page.locator(".myc-login-gate")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe("dark");
  });
});

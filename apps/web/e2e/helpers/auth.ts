import type { Page } from "@playwright/test";

const FAKE_USER = { id: 1, username: "e2e-user", email: null };

/**
 * Stubs /api/me as already-authenticated at the network level, since these
 * specs run against `vite preview` (a static build with no real backend).
 * Call before page.goto("/") in any spec that isn't specifically testing
 * the login gate itself.
 */
export async function mockAuthenticatedSession(page: Page): Promise<void> {
  await page.route("**/api/me", (route) => {
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(FAKE_USER) });
  });
}

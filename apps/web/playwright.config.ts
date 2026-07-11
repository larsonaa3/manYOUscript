import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:4173",
  },
  webServer: {
    command: "pnpm preview --port 4173 --strictPort",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: false,
    timeout: 30_000,
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          // Set PLAYWRIGHT_CHROMIUM_PATH to pin a specific Chromium binary
          // (e.g. in a sandboxed environment with a pre-installed browser at
          // a nonstandard path). Unset, Playwright uses its normal
          // downloaded browser from `playwright install`.
          ...(process.env.PLAYWRIGHT_CHROMIUM_PATH
            ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
            : {}),
          // Chromium refuses to launch as root without this. Harmless here
          // (an isolated, ephemeral test sandbox) - do not carry this into
          // a real multi-tenant CI/shared machine running as root.
          ...(process.getuid && process.getuid() === 0 ? { args: ["--no-sandbox"] } : {}),
        },
      },
    },
  ],
});

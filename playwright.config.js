// @ts-check
const fs = require("fs");
const path = require("path");
const { defineConfig, devices } = require("@playwright/test");

// Load .env.local manually so test credentials and configs are available
const envPath = path.resolve(__dirname, ".env.local");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, "");
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const STORAGE_DIR = path.resolve(__dirname, ".playwright-auth");
const USER_STATE = path.join(STORAGE_DIR, "user.json");
const ADMIN_STATE = path.join(STORAGE_DIR, "admin.json");

/**
 * Golvo E2E Playwright Configuration
 * Runs against a local dev server (npm run dev on port 3000).
 *
 * Required env vars (set in .env.local or CI secrets):
 *   E2E_USER_EMAIL, E2E_USER_PASSWORD
 *   E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD
 */

module.exports = defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.spec.js",

  /* Run global setup once before the test suite to save auth state */
  globalSetup: "./e2e/global.setup.js",

  /* Maximum time one test can run for */
  timeout: 60000,

  /* Expect timeout */
  expect: {
    timeout: 10000,
  },

  /* Run tests in files in parallel */
  fullyParallel: false,

  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only — 1 retry to absorb transient flakiness */
  retries: process.env.CI ? 1 : 1,

  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : 2,

  /* Reporter */
  reporter: [
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ["list"],
  ],

  /* Shared settings for all projects */
  use: {
    baseURL: "http://localhost:3000",

    /* Collect trace on first retry (CI) */
    trace: "on-first-retry",

    /* Screenshot on failure */
    screenshot: "only-on-failure",

    /* Video on first retry (CI) */
    video: "on-first-retry",

    /* Navigation timeout */
    navigationTimeout: 30000,
  },

  projects: [
    /* ─── Setup project: runs global.setup.js ─── */
    {
      name: "setup",
      testMatch: /global\.setup\.js/,
      use: { ...devices["Desktop Chrome"] },
    },

    /* ─── Desktop Chromium (unauthenticated) ─── */
    {
      name: "chromium-desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 720 },
      },
    },

    /* ─── Desktop Chromium (authenticated as user) ─── */
    {
      name: "chromium-desktop-user",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 720 },
        storageState: fs.existsSync(USER_STATE) ? USER_STATE : undefined,
      },
      dependencies: ["setup"],
    },

    /* ─── Desktop Chromium (authenticated as admin) ─── */
    {
      name: "chromium-desktop-admin",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 720 },
        storageState: fs.existsSync(ADMIN_STATE) ? ADMIN_STATE : undefined,
      },
      dependencies: ["setup"],
    },

    /* ─── Mobile — Pixel 5 (unauthenticated) ─── */
    {
      name: "pixel5-mobile",
      use: {
        ...devices["Pixel 5"],
      },
    },

    /* ─── Mobile — Pixel 5 (authenticated as user) ─── */
    {
      name: "pixel5-mobile-user",
      use: {
        ...devices["Pixel 5"],
        storageState: fs.existsSync(USER_STATE) ? USER_STATE : undefined,
      },
      dependencies: ["setup"],
    },
  ],

  /* Start dev server before tests */
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    stdout: "pipe",
    stderr: "pipe",
  },
});

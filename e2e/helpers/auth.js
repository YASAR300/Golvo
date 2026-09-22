/**
 * E2E Auth Helpers for Golvo Playwright Suite
 *
 * Reads test credentials from environment variables — NEVER hardcode.
 * Required env vars:
 *   E2E_USER_EMAIL, E2E_USER_PASSWORD   (active subscriber seeded by seed.js)
 *   E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD  (admin user seeded by seed.js)
 */

const fs = require("fs");
const path = require("path");
const { expect } = require("@playwright/test");

const envPath = path.resolve(__dirname, "../../.env.local");
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

/**
 * Wait for page URL to leave /login by polling.
 * Next.js Server Actions call redirect() via RSC soft-navigation which bypasses
 * the browser load cycle — Playwright's waitForURL misses these events.
 */
async function waitForLoginRedirect(page, timeoutMs = 35000) {
  const start = Date.now();
  let lastClick = Date.now();
  while (Date.now() - start < timeoutMs) {
    const href = page.url();
    if (!href.includes("/login")) return href;

    // Fast-fail if an error message appears on /login
    const errorEl = page.locator('[data-testid="login-error"]');
    if (await errorEl.isVisible().catch(() => false)) {
      const msg = await errorEl.textContent().catch(() => "");
      throw new Error(`Login failed with error: "${msg.trim()}"`);
    }

    // If still on /login after 4s and button is not loading, re-click in case React hydrated after first click
    if (Date.now() - lastClick > 4000) {
      const submitBtn = page.locator('[data-testid="login-submit"]');
      const isBusy = await submitBtn.getAttribute("aria-busy").catch(() => "false");
      if (isBusy !== "true") {
        await submitBtn.click().catch(() => {});
        lastClick = Date.now();
      }
    }

    await page.waitForTimeout(300);
  }
  throw new Error(`waitForLoginRedirect timed out after ${timeoutMs}ms. Still on: ${page.url()}`);
}

/**
 * Login as the seeded subscriber user.
 * @param {import("@playwright/test").Page} page
 */
async function loginAsUser(page) {
  const email = process.env.E2E_USER_EMAIL;
  const password = process.env.E2E_USER_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "E2E_USER_EMAIL and E2E_USER_PASSWORD must be set. " +
        "Copy .env.example to .env.local and fill in the test credentials."
    );
  }

  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(400);

  await page.locator('[data-testid="login-email"]').fill(email);
  await page.locator('[data-testid="login-password"]').fill(password);
  await page.locator('[data-testid="login-submit"]').click();

  const currentUrl = await waitForLoginRedirect(page);
  await page.waitForLoadState("domcontentloaded");

  if (!currentUrl.includes("/dashboard") && !currentUrl.includes("/admin")) {
    throw new Error(
      `Login redirect did not reach dashboard or admin. Got: ${currentUrl}. ` +
        "Check that E2E_USER credentials match a user with a complete profile."
    );
  }
}

/**
 * Login as the seeded admin user.
 * @param {import("@playwright/test").Page} page
 */
async function loginAsAdmin(page) {
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD must be set. " +
        "Copy .env.example to .env.local and fill in the test credentials."
    );
  }

  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(400);

  await page.locator('[data-testid="login-email"]').fill(email);
  await page.locator('[data-testid="login-password"]').fill(password);
  await page.locator('[data-testid="login-submit"]').click();

  const currentUrl = await waitForLoginRedirect(page);
  await page.waitForLoadState("domcontentloaded");

  if (!currentUrl.includes("/admin") && !currentUrl.includes("/dashboard")) {
    throw new Error(
      `Admin login redirect did not reach admin or dashboard. Got: ${currentUrl}`
    );
  }
}

/**
 * Logout by navigating to API logout endpoint or clicking sign-out button.
 * @param {import("@playwright/test").Page} page
 */
async function logout(page) {
  // Try the sidebar logout button first
  const logoutBtn = page.locator('button[title="Sign out"]');
  if (await logoutBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await logoutBtn.click();
    await page.waitForURL(/\/(login|$)/, { timeout: 10000 });
  } else {
    // Fall back to direct auth API call
    await page.goto("/auth/signout").catch(() => {});
    await page.goto("/");
  }
}

/**
 * Returns test user credentials from env.
 */
function getUserCreds() {
  return {
    email: process.env.E2E_USER_EMAIL || "",
    password: process.env.E2E_USER_PASSWORD || "",
  };
}

/**
 * Returns test admin credentials from env.
 */
function getAdminCreds() {
  return {
    email: process.env.E2E_ADMIN_EMAIL || "",
    password: process.env.E2E_ADMIN_PASSWORD || "",
  };
}

module.exports = {
  loginAsUser,
  loginAsAdmin,
  logout,
  getUserCreds,
  getAdminCreds,
  waitForLoginRedirect,
};

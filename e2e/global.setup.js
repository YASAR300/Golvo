// e2e/global.setup.js
// Runs once before the entire test suite.
// Logs in as the test user (and admin) and saves browser storage state so
// individual tests can reuse auth without re-logging in every time.

const { chromium } = require("@playwright/test");
const path = require("path");
const fs = require("fs");

// Load .env.local into process.env
const envPath = path.resolve(__dirname, "../.env.local");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, "");
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

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

    // Fast-fail if an error banner appears on /login
    const errorEl = page.locator('[data-testid="login-error"]');
    if (await errorEl.isVisible().catch(() => false)) {
      const msg = await errorEl.textContent().catch(() => "");
      throw new Error(`Login failed with error on page: "${msg.trim()}"`);
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

async function saveAuthState(browser, email, password, storageStatePath, label) {
  if (!email || !password) {
    console.warn(`[setup] Skipping auth state for ${label} — credentials not set`);
    return;
  }

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log(`[setup] Logging in as ${label} (${email})...`);
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(500);

    // Fill credentials
    await page.locator('[data-testid="login-email"]').fill(email);
    await page.locator('[data-testid="login-password"]').fill(password);
    await page.locator('[data-testid="login-submit"]').click();

    // Poll URL — Next.js server action soft-nav won't fire standard navigation events
    const finalUrl = await waitForLoginRedirect(page);
    console.log(`[setup] Redirected to: ${finalUrl}`);

    if (finalUrl.includes("/complete-profile")) {
      console.warn(
        `[setup] ${label} landed on /complete-profile — profile may be incomplete.`
      );
    }

    // Settle the page
    await page.waitForLoadState("domcontentloaded");

    // Save cookies + localStorage so tests can restore this session
    await context.storageState({ path: storageStatePath });
    console.log(`[setup] Auth state saved for ${label} -> ${storageStatePath}`);
  } catch (err) {
    console.error(`[setup] Failed to save auth state for ${label}:`, err.message);
    // Don't throw — tests will skip/fail gracefully if auth isn't available
  } finally {
    await context.close();
  }
}

async function globalSetup() {
  const browser = await chromium.launch();

  const userEmail = process.env.E2E_USER_EMAIL;
  const userPassword = process.env.E2E_USER_PASSWORD;
  const adminEmail = process.env.E2E_ADMIN_EMAIL;
  const adminPassword = process.env.E2E_ADMIN_PASSWORD;

  const storageDir = path.resolve(__dirname, "../.playwright-auth");
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }

  await saveAuthState(
    browser,
    userEmail,
    userPassword,
    path.join(storageDir, "user.json"),
    "user"
  );

  await saveAuthState(
    browser,
    adminEmail,
    adminPassword,
    path.join(storageDir, "admin.json"),
    "admin"
  );

  await browser.close();
  console.log("[setup] Global setup complete.");
}

module.exports = globalSetup;

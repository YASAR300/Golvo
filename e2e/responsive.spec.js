// e2e/responsive.spec.js
// Spec 9: Responsive audit — mobile sidebar drawer, no horizontal scroll
//
// Tests that require auth use storageState set via playwright.config.js projects
// (pixel5-mobile-user / chromium-desktop-user) so no inline login is needed.
// Unauthenticated tests run against the plain chromium-desktop / pixel5-mobile projects.

const { test, expect } = require("@playwright/test");

/**
 * Check horizontal scroll: document.scrollWidth must not exceed the viewport width.
 * Allows 2px rounding tolerance for subpixel rendering.
 */
async function assertNoHorizontalScroll(page) {
  // Ensure layout has settled
  await page.waitForLoadState("networkidle");

  const result = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    viewport: window.innerWidth,
  }));
  expect(result.scrollWidth, `scrollWidth (${result.scrollWidth}) should not exceed viewport (${result.viewport})`).toBeLessThanOrEqual(result.viewport + 2);
}

test.describe("Responsive Layout — Public Pages", () => {
  test("landing page has no horizontal scroll on current viewport", async ({ page }) => {
    await page.goto("/");
    await assertNoHorizontalScroll(page);
  });

  test("pricing page has no horizontal scroll on current viewport", async ({ page }) => {
    await page.goto("/pricing");
    await assertNoHorizontalScroll(page);
  });

  test("charities directory has no horizontal scroll", async ({ page }) => {
    await page.goto("/charities");
    await assertNoHorizontalScroll(page);
  });

  test("login page has no horizontal scroll on current viewport", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");
    await assertNoHorizontalScroll(page);
  });
});

// NOTE: These tests use the `pixel5-mobile-user` and `chromium-desktop-user`
// projects which inject a pre-authenticated storageState.
// If you run ONLY this file without the correct project, they will skip.
test.describe("Responsive Layout — Authenticated Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to dashboard — auth is provided by storageState
    // If we land on /login or /complete-profile, skip the test gracefully.
    const response = await page.goto("/dashboard", { waitUntil: "domcontentloaded", timeout: 30000 });
    const url = page.url();
    if (!url.includes("/dashboard")) {
      test.skip(true, `Not authenticated — landed on ${url}. Run with the 'user' project or set E2E credentials.`);
    }
  });

  test("dashboard has no horizontal scroll (authenticated)", async ({ page }) => {
    await assertNoHorizontalScroll(page);
  });

  test("on mobile viewport the sidebar opens as a drawer when hamburger is clicked", async ({ page, viewport }) => {
    // This test is only meaningful on narrow viewports (<= 768px)
    if (!viewport || viewport.width > 768) {
      test.skip(true, "Mobile drawer test only runs on narrow viewports (pixel5-mobile-user project).");
      return;
    }

    // The hamburger button should be visible on mobile
    const hamburger = page.locator('button[aria-label="Open sidebar"]');
    await expect(hamburger).toBeVisible({ timeout: 10000 });

    // Click hamburger
    await hamburger.click();

    // Wait for drawer animation
    await page.waitForTimeout(400);

    // Mobile drawer should appear — check by testid or by the overlay div
    const mobileDrawer = page
      .locator('[data-testid="mobile-sidebar-drawer"]')
      .or(page.locator(".fixed.inset-0"))
      .first();
    await expect(mobileDrawer).toBeVisible({ timeout: 5000 });

    // Dashboard page should not have horizontal overflow even with drawer open
    const result = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      viewport: window.innerWidth,
    }));
    expect(result.scrollWidth).toBeLessThanOrEqual(result.viewport + 2);
  });

  test("scores page has no horizontal scroll (authenticated)", async ({ page }) => {
    await page.goto("/dashboard/scores", { waitUntil: "domcontentloaded" });
    const url = page.url();
    if (!url.includes("/dashboard")) {
      test.skip(true, "Not authenticated.");
      return;
    }
    await assertNoHorizontalScroll(page);
  });

  test("winnings page has no horizontal scroll (authenticated)", async ({ page }) => {
    await page.goto("/winnings", { waitUntil: "domcontentloaded" });
    await assertNoHorizontalScroll(page);
  });
});

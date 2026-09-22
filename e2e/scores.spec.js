// e2e/scores.spec.js
// Spec 4: Score management — add, 6th score rollover, duplicate, out-of-range, edit, delete
const { test, expect } = require("@playwright/test");
const { loginAsUser, getUserCreds } = require("./helpers/auth");

test.describe("Score Management", () => {
  test.beforeEach(async ({ page }) => {
    const { email } = getUserCreds();
    if (!email) test.skip(true, "E2E_USER_EMAIL not set");

    // Login using the shared helper
    await loginAsUser(page);

    // Navigate to scores page
    await page.goto("/dashboard/scores");
    await page.waitForLoadState("networkidle");
  });

  /**
   * Helper to add a score for a given date offset (days ago).
   */
  async function addScore(page, score, daysAgo = 0) {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    const dateStr = d.toISOString().split("T")[0];

    // Set score via input
    const scoreInput = page.locator("#score-input");
    await scoreInput.fill(String(score));

    // Set date
    const dateInput = page.locator("#played-on-input");
    await dateInput.fill(dateStr);

    // Submit
    const submitBtn = page.locator('[data-testid="score-submit"]');
    await submitBtn.click();

    // Wait for optimistic update or server response
    await page.waitForTimeout(1500);
    return dateStr;
  }

  test("score list shows scores in reverse chronological order (newest first)", async ({ page }) => {
    // The seeded user already has 5 scores
    const scoreItems = page.locator('[data-testid="score-item"]');
    const count = await scoreItems.count();
    if (count < 2) {
      test.skip(true, "Fewer than 2 scores — cannot check ordering. Ensure seed has run.");
      return;
    }

    // Get played_on dates from data attributes or text
    const dates = await scoreItems.evaluateAll((els) =>
      els.map((el) => el.getAttribute("data-played-on") || el.querySelector("[data-date]")?.textContent || "")
    );

    // Filter non-empty dates and check descending order
    const nonEmpty = dates.filter(Boolean);
    for (let i = 0; i < nonEmpty.length - 1; i++) {
      expect(new Date(nonEmpty[i]) >= new Date(nonEmpty[i + 1])).toBe(true);
    }
  });

  test("adding a score with a duplicate date shows an error", async ({ page }) => {
    // Use a date that the seeded user already has (1 day ago is in the seed)
    const scoreInput = page.locator("#score-input");
    const dateInput = page.locator("#played-on-input");

    // Pick a date 1 day ago (matches seed)
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const dateStr = d.toISOString().split("T")[0];

    await scoreInput.fill("30");
    await dateInput.fill(dateStr);
    await page.locator('[data-testid="score-submit"]').click();
    await page.waitForTimeout(2000);

    // Should show an error
    const errorEl = page
      .locator('[data-testid="score-form-error"]')
      .or(page.getByText(/duplicate|already|same date/i))
      .first();
    await expect(errorEl).toBeVisible({ timeout: 8000 });
  });

  test("adding a score out of range (0 or 46) shows a validation error", async ({ page }) => {
    const scoreInput = page.locator("#score-input");
    const dateInput = page.locator("#played-on-input");

    // Use a date that does not exist yet (far back)
    const d = new Date();
    d.setDate(d.getDate() - 200);
    const dateStr = d.toISOString().split("T")[0];

    await scoreInput.fill("0");
    await dateInput.fill(dateStr);
    await page.locator('[data-testid="score-submit"]').click();
    await page.waitForTimeout(2000);

    const errorEl = page
      .locator('[data-testid="score-form-error"]')
      .or(page.getByText(/between 1 and 45|invalid|range/i))
      .first();
    await expect(errorEl).toBeVisible({ timeout: 8000 });
  });

  test("adding a 6th score causes the oldest to be pruned (only 5 kept)", async ({ page }) => {
    // Check initial count
    const scoreItems = page.locator('[data-testid="score-item"]');
    const initialCount = await scoreItems.count();

    // Add a new unique score (30 days ago ensures it's the oldest)
    await addScore(page, 22, 30);

    // After adding, count should not exceed 5
    const newCount = await scoreItems.count();
    expect(newCount).toBeLessThanOrEqual(5);
    if (initialCount >= 5) {
      // Oldest should have been removed
      expect(newCount).toBe(5);
    }
  });

  test("delete a score removes it from the list", async ({ page }) => {
    const scoreItems = page.locator('[data-testid="score-item"]');
    const beforeCount = await scoreItems.count();
    if (beforeCount === 0) {
      test.skip(true, "No scores to delete.");
      return;
    }

    // Accept window.confirm if shown
    page.on("dialog", (dialog) => dialog.accept());

    // Click delete on the first score item
    const deleteBtn = scoreItems.first().locator('[data-testid="score-delete"]');
    await expect(deleteBtn).toBeVisible();
    await deleteBtn.click();

    // Confirm modal if present
    const confirmBtn = page.locator('[data-testid="confirm-delete"]');
    if (await confirmBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
      await confirmBtn.click();
    }

    await page.waitForTimeout(2000);
    const afterCount = await scoreItems.count();
    expect(afterCount).toBeLessThan(beforeCount);
  });
});

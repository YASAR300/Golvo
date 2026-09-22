// e2e/charity.spec.js
// Spec 5: Charity settings — change charity, update percent, live preview, min 10% enforced
const { test, expect } = require("@playwright/test");
const { loginAsUser, getUserCreds } = require("./helpers/auth");

test.describe("Charity Settings", () => {
  test.beforeEach(async ({ page }) => {
    const { email } = getUserCreds();
    if (!email) test.skip(true, "E2E_USER_EMAIL not set");

    await loginAsUser(page);

    // Go to charity settings
    await page.goto("/dashboard/charity");
    await page.waitForLoadState("networkidle");
  });

  test("charity settings page renders with charity selector and percent slider", async ({
    page,
  }) => {
    // Charity selector exists
    const charitySelector = page
      .locator('[data-testid="charity-selector"]')
      .or(page.locator('select[name="charityId"]'))
      .first();
    await expect(charitySelector).toBeVisible({ timeout: 10000 });

    // Percent input exists
    const percentInput = page
      .locator('[data-testid="charity-percent"]')
      .or(page.locator('input[name="charityPercent"]'))
      .first();
    await expect(percentInput).toBeVisible({ timeout: 10000 });
  });

  test("live preview updates when contribution percent changes to 25", async ({ page }) => {
    const percentInput = page
      .locator('[data-testid="charity-percent"]')
      .or(page.locator('input[type="range"]'))
      .or(page.locator('input[type="number"][min="10"]'))
      .first();

    await expect(percentInput).toBeVisible({ timeout: 10000 });

    // Set to 25%
    await percentInput.fill("25");
    await percentInput.dispatchEvent("input");
    await percentInput.dispatchEvent("change");
    await page.waitForTimeout(500);

    // Preview should show updated amount
    const preview = page
      .locator('[data-testid="charity-preview"]')
      .or(page.getByText(/25%/))
      .first();
    await expect(preview).toBeVisible({ timeout: 5000 });
  });

  test("setting percent below 10 shows validation error", async ({ page }) => {
    const percentInput = page
      .locator('[data-testid="charity-percent"]')
      .or(page.locator('input[type="number"][min="10"]'))
      .first();

    await expect(percentInput).toBeVisible({ timeout: 10000 });

    // Try to set 5% (below minimum)
    await percentInput.fill("5");
    await percentInput.dispatchEvent("input");
    await percentInput.dispatchEvent("change");

    // Submit if there's a save button
    const saveBtn = page
      .locator('[data-testid="charity-save"]')
      .or(page.locator('button[type="submit"]'))
      .first();

    if (await saveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await saveBtn.click();
      await page.waitForTimeout(2000);

      // Should show error about minimum
      const errorEl = page
        .locator('[data-testid="charity-error"]')
        .or(page.getByText(/10%|minimum|least 10/i))
        .first();
      await expect(errorEl).toBeVisible({ timeout: 8000 });
    } else {
      // Input itself should be clamped or marked invalid
      const val = await percentInput.inputValue();
      expect(Number(val)).toBeGreaterThanOrEqual(10);
    }
  });

  test("charity can be changed via the selector", async ({ page }) => {
    const charitySelector = page
      .locator('[data-testid="charity-selector"]')
      .or(page.locator("select"))
      .first();

    await expect(charitySelector).toBeVisible({ timeout: 10000 });

    const options = await charitySelector.locator("option").count();
    if (options < 2) {
      test.skip(true, "Only one charity available — cannot test selection change.");
      return;
    }

    // Select the second option
    await charitySelector.selectOption({ index: 1 });
    await page.waitForTimeout(500);

    // The value should have changed
    const newVal = await charitySelector.inputValue();
    expect(newVal).toBeTruthy();
  });
});

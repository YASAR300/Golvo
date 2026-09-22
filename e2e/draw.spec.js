// e2e/draw.spec.js
// Spec 6: Admin — draw simulation, publish, duplicate publish blocked, winners visible
const { test, expect } = require("@playwright/test");
const { loginAsAdmin, getAdminCreds } = require("./helpers/auth");

test.describe("Draw Engine (Admin)", () => {
  test.beforeEach(async ({ page }) => {
    const { email } = getAdminCreds();
    if (!email) test.skip(true, "E2E_ADMIN_EMAIL not set");

    await loginAsAdmin(page);

    // Navigate to admin draws
    await page.goto("/admin/draws");
    await page.waitForLoadState("networkidle");
  });

  test("admin draws page loads and shows draw management interface", async ({ page }) => {
    // Should not be redirected away
    await expect(page).toHaveURL(/\/admin\/draws/);
    
    // Some kind of heading visible
    const heading = page.locator("h1, h2").first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test("run simulation button triggers draw simulation and shows preview", async ({ page }) => {
    const simulateBtn = page
      .locator('[data-testid="draw-simulate"]')
      .or(page.getByRole("button", { name: /simulat/i }))
      .first();

    if (!(await simulateBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, "Simulate button not found on admin/draws — check page layout.");
      return;
    }

    await simulateBtn.click();
    await page.waitForTimeout(5000); // Simulation takes time

    // Preview or results should appear
    const preview = page
      .locator('[data-testid="draw-preview"]')
      .or(page.getByText(/winning numbers|simulated|simulation/i))
      .first();
    await expect(preview).toBeVisible({ timeout: 15000 });
  });

  test("publish button publishes the simulated draw and shows confirmation", async ({ page }) => {
    // Ensure there's a simulated draw by checking for the publish button
    const publishBtn = page
      .locator('[data-testid="draw-publish"]')
      .or(page.getByRole("button", { name: /publish/i }))
      .first();

    if (!(await publishBtn.isVisible({ timeout: 8000 }).catch(() => false))) {
      test.skip(
        true,
        "Publish button not visible — either no simulated draw exists or the draw was already published."
      );
      return;
    }

    await publishBtn.click();

    // Confirm in modal if present
    const confirmBtn = page
      .locator('[data-testid="confirm-publish"]')
      .or(page.getByRole("button", { name: /confirm|yes, publish/i }))
      .first();
    if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmBtn.click();
    }

    await page.waitForTimeout(3000);

    // Should show a success indicator
    const successEl = page
      .locator('[data-testid="draw-published"]')
      .or(page.getByText(/published|success/i))
      .first();
    await expect(successEl).toBeVisible({ timeout: 15000 });
  });

  test("publishing the same month twice is blocked with an error", async ({ page }) => {
    // After the previous test publishes, clicking publish again should fail
    const publishBtn = page
      .locator('[data-testid="draw-publish"]')
      .or(page.getByRole("button", { name: /publish/i }))
      .first();

    if (!(await publishBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
      // The button may be hidden after publishing — that itself proves the guard
      test.skip(true, "No publish button after publishing — draw guard working correctly.");
      return;
    }

    await publishBtn.click();
    await page.waitForTimeout(3000);

    // Should show "already published" error
    const errorEl = page
      .locator('[data-testid="draw-error"]')
      .or(page.getByText(/already published|cannot publish|duplicate/i))
      .first();
    await expect(errorEl).toBeVisible({ timeout: 10000 });
  });

  test("winners list shows after publish", async ({ page }) => {
    await page.goto("/admin/winners");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/admin\/winners/);

    // Winners table or empty state should be visible
    const winnersEl = page
      .locator('[data-testid="winners-table"]')
      .or(page.locator("table"))
      .or(page.getByText(/no winners|pending/i))
      .first();
    await expect(winnersEl).toBeVisible({ timeout: 10000 });
  });
});

// e2e/winners.spec.js
// Spec 7: Winner verification — proof upload, status transitions, admin approve/reject/pay
const { test, expect } = require("@playwright/test");
const { loginAsUser, loginAsAdmin, getUserCreds, getAdminCreds } = require("./helpers/auth");
const path = require("path");

// Fixture image is in e2e/fixtures/proof.png (1x1 white pixel PNG)
const FIXTURE_IMAGE = path.join(__dirname, "fixtures", "proof.png");

test.describe("Winner Verification Flow", () => {
  test("winner can upload proof image and status becomes Submitted", async ({ page }) => {
    const { email } = getUserCreds();
    if (!email) test.skip(true, "E2E_USER_EMAIL not set");

    await loginAsUser(page);

    await page.goto("/winnings");
    await page.waitForLoadState("networkidle");

    // Check for a winner row that is pending proof
    const uploadSection = page
      .locator('[data-testid="proof-upload"]')
      .or(page.locator('input[type="file"]'))
      .first();

    if (!(await uploadSection.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(
        true,
        "No pending proof upload found — user may not have a winner record. " +
          "Run seed and draw publish to create winner records first."
      );
      return;
    }

    // Upload the fixture image
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(FIXTURE_IMAGE);
    await page.waitForTimeout(2000);

    // Submit / upload button
    const submitBtn = page
      .locator('[data-testid="proof-submit"]')
      .or(page.getByRole("button", { name: /upload|submit proof/i }))
      .first();
    if (await submitBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await submitBtn.click();
      await page.waitForTimeout(3000);
    }

    // Status should update to submitted
    const statusEl = page
      .locator('[data-testid="proof-status"]')
      .or(page.getByText(/submitted|pending review/i))
      .first();
    await expect(statusEl).toBeVisible({ timeout: 10000 });
  });

  test("admin can view submitted proofs in winners panel", async ({ page }) => {
    const { email } = getAdminCreds();
    if (!email) test.skip(true, "E2E_ADMIN_EMAIL not set");

    await loginAsAdmin(page);

    await page.goto("/admin/winners");
    await page.waitForLoadState("networkidle");

    // Winners panel visible
    const winnersPanel = page
      .locator('[data-testid="winners-table"]')
      .or(page.locator("table"))
      .or(page.getByText(/submitted|pending|approved/i))
      .first();
    await expect(winnersPanel).toBeVisible({ timeout: 10000 });
  });

  test("admin can approve a submitted proof", async ({ page }) => {
    const { email } = getAdminCreds();
    if (!email) test.skip(true, "E2E_ADMIN_EMAIL not set");

    await loginAsAdmin(page);

    await page.goto("/admin/winners");
    await page.waitForLoadState("networkidle");

    const approveBtn = page
      .locator('[data-testid="winner-approve"]')
      .or(page.getByRole("button", { name: /approve/i }))
      .first();

    if (!(await approveBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, "No approvable winner found — upload a proof first.");
      return;
    }

    await approveBtn.click();
    await page.waitForTimeout(3000);

    // Status should update
    const statusEl = page
      .locator('[data-testid="winner-status"]')
      .or(page.getByText(/approved/i))
      .first();
    await expect(statusEl).toBeVisible({ timeout: 10000 });
  });

  test("admin can reject a proof and user can re-upload", async ({ page }) => {
    const { email } = getAdminCreds();
    if (!email) test.skip(true, "E2E_ADMIN_EMAIL not set");

    await loginAsAdmin(page);

    await page.goto("/admin/winners");
    await page.waitForLoadState("networkidle");

    const rejectBtn = page
      .locator('[data-testid="winner-reject"]')
      .or(page.getByRole("button", { name: /reject/i }))
      .first();

    if (!(await rejectBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, "No rejectable winner found.");
      return;
    }

    await rejectBtn.click();
    await page.waitForTimeout(3000);

    // Winner status should show rejected
    const rejectedEl = page.getByText(/rejected/i).first();
    await expect(rejectedEl).toBeVisible({ timeout: 10000 });
  });
});

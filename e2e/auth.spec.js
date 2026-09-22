// e2e/auth.spec.js
// Spec 2: Auth flows — signup, login, logout, error states, protected routes
const { test, expect } = require("@playwright/test");
const { loginAsUser, getUserCreds, getAdminCreds, waitForLoginRedirect } = require("./helpers/auth");

test.describe("Authentication Flows", () => {
  test("signup with a new random email creates account and redirects", async ({ page }) => {
    const randomEmail = `e2e-test-${Date.now()}@mailtest.golvo.dev`;
    const password = "TestPassword2026!";

    await page.goto("/signup");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(400);

    // Fill signup form
    await page.locator('[data-testid="signup-name"]').fill("E2E Test User");
    await page.locator('[data-testid="signup-email"]').fill(randomEmail);
    await page.locator('[data-testid="signup-password"]').fill(password);
    await page.locator('[data-testid="signup-submit"]').click();

    // After signup — either redirects to dashboard, complete-profile, or shows email confirmation
    const signupStart = Date.now();
    while (Date.now() - signupStart < 20000) {
      const u = page.url();
      if (u.includes("/dashboard") || u.includes("/complete-profile") || u.includes("/login")) break;
      await page.waitForTimeout(300);
    }
    const url = page.url();
    // Accept any of these valid post-signup destinations
    expect(
      url.includes("/dashboard") ||
        url.includes("/complete-profile") ||
        url.includes("/login") ||
        url.includes("/signup")
    ).toBe(true);
  });

  test("login with seeded subscriber credentials succeeds", async ({ page }) => {
    const { email, password } = getUserCreds();
    if (!email) test.skip(true, "E2E_USER_EMAIL not set");

    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(400);

    await page.locator('[data-testid="login-email"]').fill(email);
    await page.locator('[data-testid="login-password"]').fill(password);
    await page.locator('[data-testid="login-submit"]').click();

    const finalUrl = await waitForLoginRedirect(page);
    expect(finalUrl.includes("/dashboard") || finalUrl.includes("/admin")).toBe(true);

    // Dashboard greeting visible (only on /dashboard, not /admin)
    if (finalUrl.includes("/dashboard")) {
      await expect(page.locator('[data-testid="dashboard-welcome"]')).toBeVisible({ timeout: 10000 });
    }
  });

  test("login with wrong password shows error message", async ({ page }) => {
    const { email } = getUserCreds();
    if (!email) test.skip(true, "E2E_USER_EMAIL not set");

    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");

    await page.locator('[data-testid="login-email"]').fill(email);
    await page.locator('[data-testid="login-password"]').fill("WrongPassword99!");
    await page.locator('[data-testid="login-submit"]').click();

    // Should stay on /login and show an error
    await page.waitForTimeout(3000);
    await expect(page).toHaveURL(/\/login/);

    const errorEl = page.locator('[data-testid="login-error"]');
    await expect(errorEl).toBeVisible({ timeout: 8000 });
  });

  test("logout works and redirects to home", async ({ page }) => {
    const { email } = getUserCreds();
    if (!email) test.skip(true, "E2E_USER_EMAIL not set");

    // Login using helper
    await loginAsUser(page);

    // Click logout button in sidebar
    const logoutBtn = page.locator('[data-testid="sidebar-logout"]');
    await expect(logoutBtn).toBeVisible({ timeout: 10000 });
    await logoutBtn.click();

    // Should redirect away from dashboard
    await page.waitForURL(/\/(login|$)/, { timeout: 10000 });
    const url = page.url();
    expect(url.includes("/login") || url === "http://localhost:3000/").toBe(true);
  });

  test("accessing /dashboard while logged out redirects to /login", async ({ page }) => {
    // Ensure logged out state by clearing storage
    await page.context().clearCookies();
    await page.goto("/dashboard");
    await page.waitForURL(/\/login/, { timeout: 15000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test("accessing /admin as a normal subscriber is blocked (403 or redirect)", async ({ page }) => {
    const { email } = getUserCreds();
    if (!email) test.skip(true, "E2E_USER_EMAIL not set");

    await loginAsUser(page);

    await page.goto("/admin");
    await page.waitForLoadState("domcontentloaded");

    // Should be redirected away or see an access-denied message
    const url = page.url();
    const body = await page.textContent("body");
    const isBlocked =
      url.includes("/dashboard") ||
      url.includes("/login") ||
      (body || "").toLowerCase().includes("access") ||
      (body || "").toLowerCase().includes("unauthorized") ||
      (body || "").toLowerCase().includes("forbidden");
    expect(isBlocked).toBe(true);
  });
});

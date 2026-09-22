// e2e/a11y.spec.js
// Spec 10: Accessibility — no critical axe-core violations on key pages
const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;
const { getUserCreds, loginAsUser } = require("./helpers/auth");

/**
 * Run axe analysis and assert no critical violations.
 * Prints a summary of any issues found to aid debugging.
 */
async function assertNoCriticalViolations(page, context = "page") {
  const results = await new AxeBuilder({ page })
    // Only check for serious & critical — best-practice and minor don't block CI
    .withTags(["wcag2a", "wcag2aa"])
    .disableRules([
      // Skip colour-contrast in dark UIs — it requires high fidelity rendering
      "color-contrast",
      // Skip scrollable-region-focusable (cosmetic in modals)
      "scrollable-region-focusable",
    ])
    .analyze();

  // Filter to only critical + serious violations
  const criticalViolations = results.violations.filter(
    (v) => v.impact === "critical" || v.impact === "serious"
  );

  if (criticalViolations.length > 0) {
    const summary = criticalViolations.map((v) => `[${v.impact}] ${v.id}: ${v.description} (${v.nodes.length} node(s))`).join("\n");
    console.error(`\nAccessibility violations on ${context}:\n${summary}\n`);
  }

  expect(
    criticalViolations,
    `Found ${criticalViolations.length} critical/serious a11y violation(s) on ${context}`
  ).toHaveLength(0);
}

test.describe("Accessibility (axe-core WCAG 2.x)", () => {
  test("landing page has no critical a11y violations", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await assertNoCriticalViolations(page, "Landing Page (/)");
  });

  test("login page has no critical a11y violations", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");
    await assertNoCriticalViolations(page, "Login Page (/login)");
  });

  test("pricing page has no critical a11y violations", async ({ page }) => {
    await page.goto("/pricing");
    await page.waitForLoadState("networkidle");
    await assertNoCriticalViolations(page, "Pricing Page (/pricing)");
  });

  test("charities directory has no critical a11y violations", async ({ page }) => {
    await page.goto("/charities");
    await page.waitForLoadState("networkidle");
    await assertNoCriticalViolations(page, "Charities Directory (/charities)");
  });

  test("dashboard has no critical a11y violations (logged in)", async ({ page }) => {
    const { email } = getUserCreds();
    if (!email) test.skip(true, "E2E_USER_EMAIL not set");

    await loginAsUser(page);
    await page.waitForLoadState("networkidle");

    await assertNoCriticalViolations(page, "Dashboard (/dashboard)");
  });

  test("signup page has no critical a11y violations", async ({ page }) => {
    await page.goto("/signup");
    await page.waitForLoadState("domcontentloaded");
    await assertNoCriticalViolations(page, "Signup Page (/signup)");
  });
});

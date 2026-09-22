// e2e/public.spec.js
// Spec 1: Public pages — landing, pricing, charities directory, charity profile
const { test, expect } = require("@playwright/test");

test.describe("Public Pages", () => {
  test.beforeEach(async ({ page }) => {
    // Capture and suppress known non-critical Next.js hydration warnings
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const text = msg.text();
        // These are expected in dev mode
        if (
          text.includes("Hydration") ||
          text.includes("Warning:") ||
          text.includes("NEXT_") ||
          text.includes("Loading chunk")
        )
          return;
        // Log unexpected errors but don't fail here — we check below
        console.error("CONSOLE ERROR:", text);
      }
    });
  });

  test("landing page loads with hero headline and key sections", async ({ page }) => {
    const errors = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // Hero headline
    await expect(page.locator("h1").first()).toBeVisible();
    const h1Text = await page.locator("h1").first().textContent();
    expect(h1Text).toBeTruthy();

    // Navigation links exist
    await expect(page.locator('[data-testid="nav-charities"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-pricing"]')).toBeVisible();

    // No critical page errors
    const criticalErrors = errors.filter(
      (e) =>
        !e.includes("Hydration") &&
        !e.includes("Warning") &&
        !e.includes("Non-Error") &&
        !e.includes("NEXT_REDIRECT")
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test("Pricing section exists on the landing page and the /pricing page loads", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // Pricing nav link
    const pricingLink = page.locator('[data-testid="nav-pricing"]');
    await expect(pricingLink).toBeVisible();

    // Navigate to /pricing directly
    await page.goto("/pricing");
    await page.waitForLoadState("domcontentloaded");

    // Pricing cards visible
    await expect(page.locator("h1").first()).toBeVisible();
    // Price amounts
    await expect(page.getByText("$9.99").first()).toBeVisible();
    await expect(page.getByText("$7.99").first()).toBeVisible();
  });

  test("/charities directory: search input exists and charity cards render", async ({ page }) => {
    await page.goto("/charities");
    await page.waitForLoadState("networkidle");

    // Search input
    const searchInput = page.locator('[data-testid="charity-search"]');
    await expect(searchInput).toBeVisible();

    // Charity cards
    const cards = page.locator('[data-testid="charity-card"]');
    await expect(cards.first()).toBeVisible({ timeout: 10000 });
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test("/charities search filters results by name", async ({ page }) => {
    await page.goto("/charities");
    await page.waitForLoadState("networkidle");

    const searchInput = page.locator('[data-testid="charity-search"]');
    await expect(searchInput).toBeVisible();

    // Type a search query
    await searchInput.fill("Youth");
    await page.waitForTimeout(400); // debounce

    const cards = page.locator('[data-testid="charity-card"]');
    const count = await cards.count();
    // Should reduce results or keep relevant ones
    expect(count).toBeGreaterThan(0);

    // All visible cards should contain the search term (case-insensitive)
    const allText = await cards.allTextContents();
    for (const text of allText) {
      expect(text.toLowerCase()).toContain("youth");
    }
  });

  test("charity profile page opens from directory", async ({ page }) => {
    await page.goto("/charities");
    await page.waitForLoadState("networkidle");

    const firstCard = page.locator('[data-testid="charity-card"]').first();
    await expect(firstCard).toBeVisible();

    // Click the card or its CTA link
    await firstCard.click();
    await page.waitForLoadState("domcontentloaded");

    // Should be on /charities/[slug]
    expect(page.url()).toMatch(/\/charities\/.+/);

    // Charity name heading visible
    await expect(page.locator("h1").first()).toBeVisible();
  });
});

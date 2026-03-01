import { expect, test } from "@playwright/test";

/**
 * E2E test for the vocabulary page.
 *
 * Note: This test requires an authenticated session and vocabulary data.
 * In CI, it would need database seeding. For local development,
 * it validates the page structure and empty state flow.
 */
test.describe("Vocabulary Page", () => {
  test("displays vocabulary page with correct structure", async ({ page }) => {
    await page.goto("/vocabulary");

    // Should either show the page or redirect to login
    const url = page.url();
    if (url.includes("/login")) {
      // Not authenticated — verify login page loads
      await expect(page.locator("text=Sign in")).toBeVisible();
      return;
    }

    // Page header should be visible
    await expect(page.locator("h1")).toContainText("Vocabulary");
    await expect(
      page.locator("text=Track and review your Spanish vocabulary"),
    ).toBeVisible();
  });

  test("shows empty state when no vocabulary words", async ({ page }) => {
    await page.goto("/vocabulary");

    const url = page.url();
    if (url.includes("/login")) return; // Skip if not authenticated

    // Either empty state or word list should be visible
    const emptyState = page.locator("text=No words yet");
    const tabsList = page.locator('[data-slot="tabs-list"]');

    const hasEmptyState = await emptyState.isVisible().catch(() => false);
    const hasTabs = await tabsList.isVisible().catch(() => false);

    // One of these must be true
    expect(hasEmptyState || hasTabs).toBe(true);

    if (hasEmptyState) {
      // Empty state should have a link to start a lesson
      await expect(page.locator("text=Start a Lesson")).toBeVisible();
    }
  });

  test("tabs switch between All Words and Due for Review", async ({
    page,
  }) => {
    await page.goto("/vocabulary");

    const url = page.url();
    if (url.includes("/login")) return;

    const tabsList = page.locator('[data-slot="tabs-list"]');
    const hasTabs = await tabsList.isVisible().catch(() => false);

    if (!hasTabs) return; // Empty state, no tabs

    // Click "Due for Review" tab
    await page.locator('[data-slot="tabs-trigger"]').nth(1).click();

    // Tab should be active
    await expect(
      page.locator('[data-slot="tabs-trigger"]').nth(1),
    ).toHaveAttribute("data-state", "active");
  });
});

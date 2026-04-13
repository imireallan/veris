import { test, expect } from "@playwright/test";

test.describe("Organization Creation", () => {
  test("should validate email before allowing submit", async ({ page }) => {
    // Login as superadmin
    await page.goto("http://localhost:5173/login");
    await page.fill('input[name="email"]', "allanimire@gmail.com");
    await page.fill('input[name="password"]', "password");
    await page.click('button[type="submit"]');
    await page.waitForURL("http://localhost:5173/");
    await page.waitForSelector("text=Welcome back", { timeout: 15000 });

    // Navigate to organizations page
    await page.goto("http://localhost:5173/organizations");
    await page.waitForSelector("h1");

    // Click Create button
    await page.click('button:has-text("Create")');
    await page.waitForSelector('[role="dialog"]');

    // STEP 1: Fill organization name
    await page.fill('input[placeholder="Acme Corporation"]', "Test Org Validation");

    // Click Next
    await page.click('button:has-text("Next")');

    // STEP 2: Don't fill email, try to proceed
    // Next button should be disabled without email
    const nextButton = page.locator('button:has-text("Next")');
    await expect(nextButton).toBeDisabled();

    // Fill invalid email
    await page.fill('input[type="email"][placeholder="admin@client.com"]', "invalid-email");
    await page.waitForTimeout(500);
    await expect(nextButton).toBeDisabled();

    // Fill valid email
    await page.fill('input[type="email"][placeholder="admin@client.com"]', "valid@example.com");
    await page.waitForTimeout(500);
    await expect(nextButton).not.toBeDisabled();
  });
});

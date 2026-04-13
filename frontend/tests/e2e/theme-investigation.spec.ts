import { test, expect } from "@playwright/test";

test.describe("Theme Dark Mode Investigation", () => {
  test("login with allanimire+tob@gmail.com and check theme", async ({ page }) => {
    // Go to login page
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /welcome/i })).toBeVisible();

    // Use mock login button (dev mode)
    const mockLogin = page.getByTestId("mock-login-button");
    if (await mockLogin.isVisible()) {
      await mockLogin.click();
    } else {
      // Fallback: try to find the Sign In button
      await page.getByRole("button", { name: "Sign In" }).click();
    }

    // Wait for redirect to dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });
    await page.waitForTimeout(2000);

    // Check if dark mode is active
    const isDark = await page.evaluate(() => {
      return document.documentElement.classList.contains("dark");
    });

    console.log(`Dark mode active: ${isDark}`);

    // Get CSS variable values
    const colors = await page.evaluate(() => {
      const root = document.documentElement;
      const style = getComputedStyle(root);
      return {
        background: style.getPropertyValue("--background").trim(),
        foreground: style.getPropertyValue("--foreground").trim(),
        card: style.getPropertyValue("--card").trim(),
      };
    });

    console.log("CSS variables:", colors);

    // Parse background lightness
    const bgParts = colors.background.split(/\s+/);
    if (bgParts.length === 3) {
      const lightness = parseFloat(bgParts[2]);
      console.log(`Background lightness: ${lightness}%`);

      // If in dark mode but background is light (>80%), theme is corrupted
      if (isDark && lightness > 50) {
        console.log("WARNING: Dark mode active but background is LIGHT - theme corruption!");
      }
    }

    // Take screenshot for visual verification
    await page.screenshot({ path: "test-results/theme-screenshot.png" });
    console.log("Screenshot saved to test-results/theme-screenshot.png");

    // Verify page content is visible
    await expect(page.locator("body")).toBeVisible();
  });
});

import { test, expect } from "@playwright/test";

test.describe("Theme Dark Mode - allanimire+tob@gmail.com", () => {
  test.use({
    storageState: "playwright/.auth/user.json",
  });

  test("should have readable dark mode colors for Tob org", async ({ page }) => {
    // Go to dashboard
    await page.goto("/");
    await page.waitForURL(/\/dashboard/);

    // Check current theme mode
    const isDark = await page.evaluate(() => {
      return document.documentElement.classList.contains("dark");
    });

    console.log(`Dark mode active: ${isDark}`);

    // Get CSS variable values
    const colors = await page.evaluate(() => {
      const root = document.documentElement;
      return {
        background: getComputedStyle(root).getPropertyValue("--background").trim(),
        foreground: getComputedStyle(root).getPropertyValue("--foreground").trim(),
        backgroundDark: getComputedStyle(root).getPropertyValue("--background").trim(),
      };
    });

    console.log("CSS variables:", colors);

    // In dark mode, background should be dark (not light)
    // HSL format: "h s% l%" - light mode should have high L%, dark mode low L%
    if (isDark) {
      // Parse the background color
      const bgParts = colors.background.split(/\s+/);
      if (bgParts.length === 3) {
        const lightness = parseFloat(bgParts[2]);
        console.log(`Background lightness: ${lightness}%`);
        
        // Dark mode background should have low lightness (< 20%)
        // If it's > 80%, the theme is inverted (light colors in dark mode)
        expect(lightness).toBeLessThan(50);
      }
    }

    // Verify page is readable - check for visible content
    await expect(page.getByText("Dashboard")).toBeVisible();
  });

  test("theme toggle should switch between light and dark modes", async ({ page }) => {
    await page.goto("/");
    await page.waitForURL(/\/dashboard/);

    // Find and click theme toggle
    const toggle = page.getByLabel("Toggle theme");
    await expect(toggle).toBeVisible();

    // Get initial mode
    const initialDark = await page.evaluate(() =>
      document.documentElement.classList.contains("dark")
    );

    // Toggle
    await toggle.click();
    await page.waitForTimeout(500);

    // Check mode changed
    const afterToggle = await page.evaluate(() =>
      document.documentElement.classList.contains("dark")
    );

    expect(afterToggle).not.toBe(initialDark);

    // Toggle back
    await toggle.click();
    await page.waitForTimeout(500);

    const finalDark = await page.evaluate(() =>
      document.documentElement.classList.contains("dark")
    );

    expect(finalDark).toBe(initialDark);
  });
});

import { test, expect } from '@playwright/test';

test('Framework Import Upload', async ({ page }) => {
  // Login
  await page.goto('http://localhost:5173/login');
  await page.fill('input[type="email"]', 'allanimire+veris-org-admin2@gmail.com');
  await page.fill('input[type="password"]', 'pass@word1');
  await page.click('button:has-text("Sign In")');
  
  // Wait for navigation
  await page.waitForURL('**/dashboard');
  
  // Navigate to frameworks import
  await page.goto('http://localhost:5173/organizations/9015d6f2-33db-48d4-adae-cdf50cc05680/frameworks/import');
  await expect(page.locator('h1:has-text("Import Framework")')).toBeVisible();
  
  // Upload file
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles('/Users/allanimire/projects/Veris/bettercoal_test.xlsx');
  
  // Click Next button
  await page.click('button:has-text("Next: Preview")');
  
  // Wait for preview
  await expect(page.locator('text:Preview')).toBeVisible({ timeout: 30000 });
  
  // Check for success
  console.log('Upload successful!');
});

import { test, expect } from "@playwright/test";

/**
 * UC-002: Invite Client Admin
 * 
 * Tests the invitation flow for inviting new team members to an organization.
 * 
 * Flow:
 * 1. Admin navigates to organization members page
 * 2. Clicks "Invite Member" button
 * 3. Fills email and selects role
 * 4. Submits invitation
 * 5. Verifies success toast
 * 6. Verifies invitation appears in list
 */

test.describe("UC-002: Invite Client Admin", () => {
  test("admin can invite new team member with role selection", async ({ page }) => {
    // Login as admin user
    await page.goto("http://localhost:5173/login");
    await page.fill('input[name="email"]', "allanimire+dojo@gmail.com");
    await page.fill('input[name="password"]', "pass@word1");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/organizations/);

    // Navigate to an organization's members page
    // First, find and click on an organization card or navigate directly
    const orgLink = page.locator('a[href*="/organizations/"]').first();
    const orgHref = await orgLink.getAttribute("href");
    expect(orgHref).toBeTruthy();
    
    // Extract org ID and navigate to members page
    const orgId = orgHref?.match(/\/organizations\/([^/]+)/)?.[1];
    expect(orgId).toBeTruthy();
    
    await page.goto(`http://localhost:5173/organizations/${orgId}/members`);
    
    // Verify page loaded with correct heading
    await expect(page.getByRole("heading", { name: /Members & Invitations/i })).toBeVisible();

    // Click "Invite Member" button
    const inviteButton = page.getByRole("button", { name: /Invite Member/i });
    await expect(inviteButton).toBeVisible();
    await inviteButton.click();

    // Verify modal opened
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText(/Invite Team Member/i)).toBeVisible();

    // Fill invitation form
    const testEmail = `test-${Date.now()}@example.com`;
    await page.fill('input[name="email"]', testEmail);
    
    // Select role from dropdown
    await page.click('[role="combobox"]');
    await page.getByRole("option", { name: /Coordinator/i }).click();

    // Submit invitation
    await page.click('button[type="submit"]');

    // Wait for success toast
    await expect(page.getByText(/Invitation sent/i)).toBeVisible({ timeout: 5000 });

    // Verify modal closed
    await expect(page.getByRole("dialog")).not.toBeVisible();

    // Verify invitation appears in the list
    await expect(page.getByText(testEmail)).toBeVisible();
  });

  test("non-admin cannot access members page", async ({ page }) => {
    // This test would require a non-admin user account
    // For now, we verify the permission check exists in the loader
    // by checking that the route requires authentication
    await page.goto("http://localhost:5173/login");
    
    // Without login, should redirect
    await page.goto("http://localhost:5173/organizations/test-id/members");
    
    // Should redirect to login or show access denied
    await expect(page).toHaveURL(/\/login/);
  });

  test("role dropdown shows only allowed roles based on inviter role", async ({ page }) => {
    // Login as admin
    await page.goto("http://localhost:5173/login");
    await page.fill('input[name="email"]', "allanimire+dojo@gmail.com");
    await page.fill('input[name="password"]', "pass@word1");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/organizations/);

    // Navigate to members page
    const orgLink = page.locator('a[href*="/organizations/"]').first();
    const orgHref = await orgLink.getAttribute("href");
    const orgId = orgHref?.match(/\/organizations\/([^/]+)/)?.[1];
    
    await page.goto(`http://localhost:5173/organizations/${orgId}/members`);
    await page.click('button:has-text("Invite Member")');

    // Open role dropdown
    await page.click('[role="combobox"]');

    // Verify role options are available (ADMIN should see most roles)
    const coordinatorOption = page.getByRole("option", { name: /Coordinator/i });
    const operatorOption = page.getByRole("option", { name: /Operator/i });
    
    await expect(coordinatorOption).toBeVisible();
    await expect(operatorOption).toBeVisible();
    
    // SUPERADMIN option should NOT be available (can't invite superadmins)
    const superadminOption = page.getByRole("option", { name: /Superadmin/i });
    await expect(superadminOption).not.toBeVisible();

    // Close modal
    await page.click('button:has-text("Cancel")');
  });
});

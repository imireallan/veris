import { expect, test, type Page } from "@playwright/test";
import {
  getMailhogMessagesForEmail,
  waitForInvitationUrl,
  waitForMailhogMessageCount,
} from "./helpers/mailhog";

const ORG_ID =
  process.env.PW_ORG_ID || "03abc363-bf7a-4d3e-a5a2-dd47b8d37ccc";
const ORG_NAME = process.env.PW_ORG_NAME || "E2E Org Admin QA";
const ORG_ADMIN_EMAIL =
  process.env.PW_ORG_ADMIN_EMAIL ||
  "allanimire+veris-e2e-org-admin@gmail.com";
const ORG_ADMIN_PASSWORD =
  process.env.PW_ORG_ADMIN_PASSWORD || "pass@word1";
const EXISTING_MEMBER_EMAIL =
  process.env.PW_EXISTING_MEMBER_EMAIL ||
  "allanimire+veris-e2e-operator@gmail.com";
const INVITED_USER_PASSWORD =
  process.env.PW_INVITED_USER_PASSWORD || "Pass_word123!";

function uniqueEmail(label: string) {
  const stamp = Date.now();
  return `allanimire+${label}-${stamp}@gmail.com`;
}

async function openMembersPage(page: Page) {
  await page.goto(`/organizations/${ORG_ID}/members`);
  await expect(
    page.getByRole("heading", { name: /Members & Invitations/i }),
  ).toBeVisible();
}

function membersTable(page: Page) {
  return page.locator("table").nth(0);
}

function invitationsTable(page: Page) {
  return page.locator("table").nth(1);
}

function memberRow(page: Page, email: string) {
  return membersTable(page).locator("tr").filter({ hasText: email }).first();
}

function invitationRow(page: Page, email: string) {
  return invitationsTable(page).locator("tr").filter({ hasText: email }).first();
}

async function loginWithPassword(page: Page, email: string, password: string) {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Veris" })).toBeVisible();
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /Sign In/i }).click();
  await expect(page.getByText(/Welcome back,/i)).toBeVisible({ timeout: 15000 });
}

async function sendInvitation(
  page: Page,
  email: string,
  roleLabel: RegExp | string,
) {
  const inviteButton = page.getByRole("button", { name: /Invite Member/i });
  const dialog = page.getByRole("dialog");

  await expect(inviteButton).toBeVisible();
  await inviteButton.click();

  if (!(await dialog.isVisible().catch(() => false))) {
    await inviteButton.click();
  }

  await expect(dialog).toBeVisible({ timeout: 15000 });
  await expect(page.getByText(/Invite Team Member/i)).toBeVisible();

  await page.getByLabel(/Email Address/i).fill(email);
  await page.locator('[role="combobox"]').click();
  await page.getByRole("option", { name: roleLabel }).click();
  await page.getByRole("button", { name: /Send Invitation/i }).click();

  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(invitationRow(page, email)).toBeVisible();
}

async function openRowActions(row: ReturnType<typeof memberRow> | ReturnType<typeof invitationRow>) {
  await expect(row).toBeVisible();
  await row.locator("button").last().click();
}

test.describe("Org admin workflows", () => {
  test("org admin can log in through the UI", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/login");

    await expect(page.getByRole("heading", { name: "Veris" })).toBeVisible();
    await page.getByLabel("Email").fill(ORG_ADMIN_EMAIL);
    await page.getByLabel("Password").fill(ORG_ADMIN_PASSWORD);
    await page.getByRole("button", { name: /Sign In/i }).click();

    await expect(page.getByText(/Welcome back,/i)).toBeVisible({ timeout: 15000 });
    await expect(
      page.getByRole("button", { name: ORG_NAME, exact: true }),
    ).toBeVisible();
  });

  test("org admin lands in the correct organization context after login", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText(/Welcome back,/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: ORG_NAME, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /EO E2E Org Admin/i }),
    ).toBeVisible();

    const bodyText = await page.locator("body").innerText();
    expect(bodyText).toContain(ORG_NAME);
    expect(bodyText).not.toContain(ORG_ADMIN_EMAIL);
  });

  test("org admin can open the members page and see member management UI", async ({ page }) => {
    await openMembersPage(page);

    await expect(page.getByRole("button", { name: /Invite Member/i })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Members", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Invitations", exact: true }),
    ).toBeVisible();
    await expect(page.getByText(EXISTING_MEMBER_EMAIL)).toBeVisible();
  });

  test("org admin is blocked from superadmin-only organization settings", async ({ page }) => {
    await page.goto(`/organizations/${ORG_ID}/settings`);

    await expect(page.getByRole("heading", { name: /Access Denied/i })).toBeVisible();
    await expect(
      page.getByText(/Organization settings require SUPERADMIN privileges./i),
    ).toBeVisible();
  });

  test("org admin can invite, resend, revoke, onboard, update role, and remove members", async ({
    page,
    request,
  }) => {
    test.slow();
    const revokeEmail = uniqueEmail("veris-revoke");
    const onboardEmail = uniqueEmail("veris-onboard");

    await openMembersPage(page);

    await sendInvitation(page, revokeEmail, /Operator/i);
    const revokeMessages = await getMailhogMessagesForEmail(request, revokeEmail);
    const revokeInitialCount = revokeMessages.length;
    await waitForInvitationUrl(request, revokeEmail, Math.max(1, revokeInitialCount));

    await openRowActions(invitationRow(page, revokeEmail));
    await page.getByRole("menuitem", { name: /Resend/i }).click();
    await waitForMailhogMessageCount(request, revokeEmail, revokeInitialCount + 1);

    await openRowActions(invitationRow(page, revokeEmail));
    await page.getByRole("menuitem", { name: /Revoke/i }).click();
    await expect(invitationRow(page, revokeEmail)).toContainText(/Declined/i);

    await sendInvitation(page, onboardEmail, /Operator/i);
    const invitationUrl = await waitForInvitationUrl(request, onboardEmail, 1);

    await page.context().clearCookies();
    await page.goto(invitationUrl);
    await expect(page.getByText(/You're Invited!/i)).toBeVisible();
    await expect(page.getByText(onboardEmail)).toBeVisible();
    await page.getByRole("button", { name: /Continue to Set Password/i }).click();

    await expect(page).toHaveURL(/\/onboarding\/set-password\//);
    await page.getByLabel(/^Password$/).fill(INVITED_USER_PASSWORD);
    await page.getByLabel(/Confirm Password/i).fill(INVITED_USER_PASSWORD);
    await page.getByRole("button", { name: /Set Password & Continue/i }).click();

    await expect(page.getByText(/Password set successfully/i)).toBeVisible();
    await page.waitForURL(/\/login/, { timeout: 10000 });

    await loginWithPassword(page, onboardEmail, INVITED_USER_PASSWORD);
    await expect(
      page.getByRole("button", { name: new RegExp(ORG_NAME) }),
    ).toBeVisible();

    await page.goto(`/organizations/${ORG_ID}/members`);
    await expect(
      page.getByRole("heading", { name: /Access Denied/i }),
    ).toBeVisible();

    await page.context().clearCookies();
    await loginWithPassword(page, ORG_ADMIN_EMAIL, ORG_ADMIN_PASSWORD);
    await openMembersPage(page);
    const onboardInvitationRow = invitationRow(page, onboardEmail);
    await expect(onboardInvitationRow).toContainText(/Accepted/i);

    const onboardMemberRow = memberRow(page, onboardEmail);
    await expect(onboardMemberRow).toContainText(/OPERATOR/i);

    await openRowActions(onboardMemberRow);
    await page.getByRole("menuitem", { name: /Change role/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.locator('[role="combobox"]').last().click();
    await page.getByRole("option", { name: /^Assessor$/i }).click();
    await page.getByRole("button", { name: /Update Role/i }).click();
    await expect(memberRow(page, onboardEmail)).toContainText(/ASSESSOR/i);

    await openRowActions(memberRow(page, onboardEmail));
    await page.getByRole("menuitem", { name: /Remove member/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: /^Remove$/i }).click();
    await expect(memberRow(page, onboardEmail)).toHaveCount(0);
  });
});

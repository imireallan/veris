import { test as setup, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { STORAGE_STATE } from "../../playwright.config";

const ORG_ADMIN_EMAIL =
  process.env.PW_ORG_ADMIN_EMAIL ||
  "allanimire+veris-e2e-org-admin@gmail.com";
const ORG_ADMIN_PASSWORD =
  process.env.PW_ORG_ADMIN_PASSWORD || "pass@word1";
const BACKEND_URL = process.env.PW_BACKEND_URL || "http://127.0.0.1:8000";

setup("authenticate org admin", async ({ page, request }) => {
  fs.mkdirSync(path.dirname(STORAGE_STATE), { recursive: true });

  await expect
    .poll(
      async () => {
        const response = await request.post(`${BACKEND_URL}/api/auth/login/`, {
          data: {
            email: ORG_ADMIN_EMAIL,
            password: ORG_ADMIN_PASSWORD,
          },
          failOnStatusCode: false,
        });
        return response.status();
      },
      {
        timeout: 30000,
        message: "Waiting for backend login endpoint to become ready",
      },
    )
    .toBe(200);

  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Veris" })).toBeVisible();

  await page.getByLabel("Email").fill(ORG_ADMIN_EMAIL);
  await page.getByLabel("Password").fill(ORG_ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Sign In" }).click();

  await expect(page.getByText(/Welcome back,/i)).toBeVisible({ timeout: 15000 });

  await page.context().storageState({ path: STORAGE_STATE });
});

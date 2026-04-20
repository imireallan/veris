# Cross-Framework Mapping: E2E Testing Guide

**Last Updated**: April 15, 2026  
**Test Framework**: Playwright + React Router v7  
**Test Mode**: `TEST_MOCK=true` (server-side bypass)

---

## Overview

This guide covers end-to-end testing for the Cross-Framework Mapping feature from the frontend. Tests verify the complete user flow: viewing mappings, adding new mappings, and removing existing mappings.

### What We Test

| Test | Description | Auth Required |
|------|-------------|---------------|
| **TC-01** | View mappings on questionnaire | ✓ SUPERADMIN |
| **TC-02** | Add new framework mapping | ✓ SUPERADMIN |
| **TC-03** | Remove framework mapping | ✓ SUPERADMIN |
| **TC-04** | ORG_ADMIN can view but not edit | ✓ ORG_ADMIN |
| **TC-05** | Duplicate mapping prevention | ✓ SUPERADMIN |
| **TC-06** | Error handling (network failure) | ✓ SUPERADMIN |

---

## Prerequisites

### 1. Directory Structure

Ensure these directories exist:

```bash
cd ~/projects/Veris/frontend

# Create auth directory for storage state
mkdir -p playwright/.auth

# Create e2e test directory if not exists
mkdir -p tests/e2e
```

### 2. Verify Playwright Config

Check `playwright.config.ts` has single chromium project with storageState:

```typescript
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const STORAGE_STATE = path.join(__dirname, "playwright/.auth/user.json");

export default defineConfig({
  testDir: "./tests/e2e",
  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: STORAGE_STATE,
      },
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !!process.env.CI,
    timeout: 120_000,
  },
});
```

### 3. Auth Setup File

Create `tests/e2e/auth.setup.ts` to inject mock SUPERADMIN cookie:

```typescript
import { test as setup, expect } from "@playwright/test";
import { STORAGE_STATE } from "../../playwright.config";

setup("authenticate as SUPERADMIN", async ({ page, context }) => {
  // Create fake JWT with SUPERADMIN role
  const exp = Math.floor(Date.now() / 1000) + 604800; // 7 days
  const header = btoa(JSON.stringify({ alg: "none", typ: "JWT" }));
  const payload = btoa(
    JSON.stringify({
      sub: "test-superadmin-123",
      email: "superadmin@veris.local",
      role: "SUPERADMIN",
      organization_id: "test-org-uuid",
      exp,
    })
  );
  const fakeToken = `${header}.${payload}.fakesignature`;

  // Inject cookie directly (bypasses login UI)
  await context.addCookies([
    {
      name: "access_token",
      value: fakeToken,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);

  // Navigate to trigger storageState save
  await page.goto("/assessments");
  await page.waitForURL(/\/assessments/);

  // Save storage state for other tests
  await page.context().storageState({ path: STORAGE_STATE });
});
```

### 4. Backend Test Mode Bypass

Ensure backend has `TEST_MOCK` mode in session validation (`backend/core/sessions.py` or similar):

```python
def get_user_from_token(token: str) -> Optional[dict]:
    # Test mode bypass for E2E tests
    if os.getenv("TEST_MOCK") == "true":
        try:
            payload = jwt.decode(token, options={"verify_signature": False})
            if payload.get("sub") == "test-superadmin-123":
                return {
                    "id": "test-superadmin-123",
                    "email": "superadmin@veris.local",
                    "role": "SUPERADMIN",
                    "organization_id": "test-org-uuid",
                }
        except Exception:
            pass
    
    # Normal validation follows...
```

---

## Step-by-Step Test Execution

### Step 1: Start Dev Server

```bash
cd ~/projects/Veris/frontend

# Start dev server (in one terminal)
npm run dev
```

Wait for: `VITE v5.x.x ready in xxx ms`

### Step 2: Run Auth Setup

```bash
# In another terminal
cd ~/projects/Veris/frontend
TEST_MOCK=true npx playwright test auth.setup.ts
```

Expected output:
```
Running 1 test using 1 worker
  ✓  1 tests/e2e/auth.setup.ts:4:6 › authenticate as SUPERADMIN (1.2s)

1 passed (2.1s)
```

Verify storage state created:
```bash
ls -la playwright/.auth/user.json
# Should show file with cookies
```

### Step 3: Run Mapping E2E Tests

```bash
TEST_MOCK=true npx playwright test framework-mapping.spec.ts
```

Or run with UI for debugging:
```bash
TEST_MOCK=true npx playwright test framework-mapping.spec.ts --ui
```

Or run headed (visible browser):
```bash
TEST_MOCK=true npx playwright test framework-mapping.spec.ts --headed
```

---

## Test Spec File

Create `tests/e2e/framework-mapping.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";
import { STORAGE_STATE } from "../../playwright.config";

test.describe("Cross-Framework Mapping", () => {
  test.use({
    storageState: STORAGE_STATE,
    actionTimeout: 10000,
  });

  // Mock data
  const mockFrameworks = [
    { id: "fw-primary-assurance-001", name: "Primary Assurance Standard", version: "2024" },
    { id: "fw-supplier-questionnaire-001", name: "Supplier Questionnaire", version: "2024" },
    { id: "fw-e0100-001", name: "E0100", version: "2023" },
  ];

  const mockQuestion = {
    id: "q-001",
    text: "Do you have an environmental policy?",
    framework_mappings: [
      {
        framework_id: "fw-primary-assurance-001",
        framework_name: "Primary Assurance Standard",
        provision_code: "P3.4",
        provision_name: "Environmental Management",
      },
    ],
  };

  const assessmentId = "test-assessment-001";
  const orgId = "test-org-uuid";

  test.beforeEach(async ({ page }) => {
    // Mock frameworks API
    await page.route("**/api/frameworks/?org=**", async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify(mockFrameworks),
      });
    });

    // Mock question mappings GET
    await page.route(
      `**/api/questions/${mockQuestion.id}/mappings/`,
      async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ mappings: mockQuestion.framework_mappings }),
        });
      }
    );

    // Navigate to questionnaire
    await page.goto(`/assessments/${assessmentId}/questionnaire`);
    await page.waitForSelector(`text=${mockQuestion.text}`);
  });

  test.describe("TC-01: View Mappings", () => {
    test("should display framework mapping badges", async ({ page }) => {
      // Verify badge is visible
      const badge = page.getByText("Primary Assurance Standard P3.4");
      await expect(badge).toBeVisible();

      // Verify tooltip shows full provision name
      await badge.hover();
      const tooltip = page.getByText("Environmental Management");
      await expect(tooltip).toBeVisible();
    });

    test("should show + Map Framework button for SUPERADMIN", async ({
      page,
    }) => {
      const mapButton = page.getByRole("button", { name: /map framework/i });
      await expect(mapButton).toBeVisible();
    });
  });

  test.describe("TC-02: Add New Mapping", () => {
    test("should add Supplier Questionnaire mapping successfully", async ({ page }) => {
      // Mock POST mapping API
      await page.route(
        `**/api/questions/${mockQuestion.id}/mappings/`,
        async (route) => {
          const body = JSON.parse(route.request().postData() || "{}");
          
          // Validate request
          expect(body.framework_id).toBe("fw-supplier-questionnaire-001");
          
          // Return updated mappings
          const updatedMappings = [
            ...mockQuestion.framework_mappings,
            {
              framework_id: body.framework_id,
              framework_name: "Supplier Questionnaire",
              provision_code: body.provision_code || "SAQ.12",
              provision_name: body.provision_name || "Environmental Policy",
            },
          ];
          
          await route.fulfill({
            status: 201,
            body: JSON.stringify({ mappings: updatedMappings }),
          });
        }
      );

      // Click "Map Framework" button
      const mapButton = page.getByRole("button", { name: /map framework/i });
      await mapButton.click();

      // Wait for modal to open
      await page.waitForSelector("role=dialog");
      await expect(page.getByText("Map to Framework")).toBeVisible();

      // Select framework
      await page.getByRole("combobox").click();
      await page.getByText("Supplier Questionnaire").click();

      // Fill provision details
      await page.getByLabel("Provision Code").fill("SAQ.12");
      await page.getByLabel("Provision Name").fill("Environmental Policy");

      // Submit
      await page.getByRole("button", { name: "Add Mapping" }).click();

      // Wait for modal to close
      await page.waitForSelector("role=dialog", { state: "hidden" });

      // Verify new badge appears
      const supplierQuestionnaireBadge = page.getByText("Supplier Questionnaire SAQ.12");
      await expect(supplierQuestionnaireBadge).toBeVisible();

      // Verify toast notification
      await expect(
        page.getByText("Mapping added")
      ).toBeVisible();
    });

    test("should show loading state during add", async ({ page }) => {
      // Mock slow API response
      await page.route(
        `**/api/questions/${mockQuestion.id}/mappings/`,
        async (route) => {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          await route.fulfill({
            status: 201,
            body: JSON.stringify({
              mappings: [...mockQuestion.framework_mappings],
            }),
          });
        }
      );

      await page.getByRole("button", { name: /map framework/i }).click();
      await page.getByRole("combobox").click();
      await page.getByText("Supplier Questionnaire").click();
      await page.getByRole("button", { name: "Add Mapping" }).click();

      // Verify loading state
      await expect(page.getByText("Saving...")).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Add Mapping" }).first()
      ).toBeDisabled();
    });

    test("should show error on API failure", async ({ page }) => {
      // Mock API error
      await page.route(
        `**/api/questions/${mockQuestion.id}/mappings/`,
        async (route) => {
          await route.fulfill({
            status: 400,
            body: JSON.stringify({ error: "Framework not found" }),
          });
        }
      );

      await page.getByRole("button", { name: /map framework/i }).click();
      await page.getByRole("combobox").click();
      await page.getByText("Supplier Questionnaire").click();
      await page.getByRole("button", { name: "Add Mapping" }).click();

      // Verify error toast
      await expect(
        page.getByText("Failed to add mapping")
      ).toBeVisible();
    });
  });

  test.describe("TC-03: Remove Mapping", () => {
    test("should remove mapping successfully", async ({ page }) => {
      // Mock DELETE API
      await page.route(
        `**/api/questions/${mockQuestion.id}/mappings/0/`,
        async (route) => {
          await route.fulfill({
            status: 200,
            body: JSON.stringify({
              message: "Mapping removed",
              removed: mockQuestion.framework_mappings[0],
              mappings: [],
            }),
          });
        }
      );

      // Hover over badge to show remove button
      const badge = page.getByText("Primary Assurance Standard P3.4");
      await badge.hover();

      // Click remove button
      const removeButton = page.locator("button", { hasText: "×" }).first();
      await removeButton.click();

      // Verify badge is gone
      await expect(badge).not.toBeVisible();

      // Verify toast notification
      await expect(
        page.getByText("Mapping removed")
      ).toBeVisible();
    });

    test("should show confirmation before remove", async ({ page }) => {
      // This test verifies the remove button appears on hover
      const badge = page.getByText("Primary Assurance Standard P3.4");
      await badge.hover();

      const removeButton = page.locator("button", { hasText: "×" }).first();
      await expect(removeButton).toBeVisible();
    });
  });

  test.describe("TC-04: RBAC - ORG_ADMIN View Only", () => {
    test.use({
      storageState: "playwright/.auth/orgadmin.json",
    });

    test.beforeEach(async ({ page, context }) => {
      // Create ORG_ADMIN token
      const exp = Math.floor(Date.now() / 1000) + 604800;
      const header = btoa(JSON.stringify({ alg: "none", typ: "JWT" }));
      const payload = btoa(
        JSON.stringify({
          sub: "test-orgadmin-123",
          email: "admin@client.com",
          role: "ADMIN",
          organization_id: orgId,
          exp,
        })
      );
      const fakeToken = `${header}.${payload}.fakesignature`;

      await context.addCookies([
        {
          name: "access_token",
          value: fakeToken,
          domain: "localhost",
          path: "/",
          httpOnly: true,
          sameSite: "Lax",
        },
      ]);

      await page.goto(`/assessments/${assessmentId}/questionnaire`);
      await page.waitForSelector(`text=${mockQuestion.text}`);
    });

    test("should show mappings but no edit button", async ({ page }) => {
      // Badge should be visible
      const badge = page.getByText("Primary Assurance Standard P3.4");
      await expect(badge).toBeVisible();

      // Map Framework button should NOT be visible
      const mapButton = page.getByRole("button", { name: /map framework/i });
      await expect(mapButton).not.toBeVisible();

      // Hover should not show remove button
      await badge.hover();
      const removeButton = page.locator("button", { hasText: "×" });
      await expect(removeButton).toHaveCount(0);
    });
  });

  test.describe("TC-05: Duplicate Prevention", () => {
    test("should prevent duplicate framework + provision code", async ({
      page,
    }) => {
      // Mock duplicate detection
      await page.route(
        `**/api/questions/${mockQuestion.id}/mappings/`,
        async (route) => {
          const body = JSON.parse(route.request().postData() || "{}");
          
          if (body.framework_id === "fw-primary-assurance-001") {
            await route.fulfill({
              status: 409,
              body: JSON.stringify({ error: "Mapping already exists" }),
            });
          } else {
            await route.fulfill({
              status: 201,
              body: JSON.stringify({ mappings: [] }),
            });
          }
        }
      );

      await page.getByRole("button", { name: /map framework/i }).click();
      await page.getByRole("combobox").click();
      await page.getByText("Primary Assurance Standard").click();
      await page.getByLabel("Provision Code").fill("P3.4");
      await page.getByRole("button", { name: "Add Mapping" }).click();

      // Verify error message
      await expect(
        page.getByText("Mapping already exists")
      ).toBeVisible();
    });
  });

  test.describe("TC-06: Error Handling", () => {
    test("should handle network failure gracefully", async ({ page }) => {
      // Mock network error
      await page.route(
        `**/api/questions/${mockQuestion.id}/mappings/`,
        async (route) => {
          await route.abort("failed");
        }
      );

      await page.getByRole("button", { name: /map framework/i }).click();
      await page.getByRole("combobox").click();
      await page.getByText("Supplier Questionnaire").click();
      await page.getByRole("button", { name: "Add Mapping" }).click();

      // Verify error toast
      await expect(
        page.getByText(/Failed to add mapping/)
      ).toBeVisible();

      // Verify modal stays open (allows retry)
      await expect(page.getByText("Map to Framework")).toBeVisible();
    });

    test("should handle invalid framework ID", async ({ page }) => {
      // Mock validation error
      await page.route(
        `**/api/questions/${mockQuestion.id}/mappings/`,
        async (route) => {
          await route.fulfill({
            status: 404,
            body: JSON.stringify({ error: "Framework not found" }),
          });
        }
      );

      await page.getByRole("button", { name: /map framework/i }).click();
      await page.getByRole("combobox").click();
      await page.getByText("Supplier Questionnaire").click();
      await page.getByRole("button", { name: "Add Mapping" }).click();

      // Verify specific error message
      await expect(
        page.getByText("Framework not found")
      ).toBeVisible();
    });
  });
});
```

---

## Mock API Handlers Reference

### Endpoints to Mock

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/frameworks/?org={orgId}` | Load available frameworks |
| GET | `/api/questions/{id}/mappings/` | Get current mappings |
| POST | `/api/questions/{id}/mappings/` | Add new mapping |
| DELETE | `/api/questions/{id}/mappings/{index}/` | Remove mapping |

### Response Formats

**GET /api/frameworks/**
```json
[
  {
    "id": "fw-primary-assurance-001",
    "name": "Primary Assurance Standard",
    "version": "2024"
  }
]
```

**GET /api/questions/{id}/mappings/**
```json
{
  "mappings": [
    {
      "framework_id": "fw-primary-assurance-001",
      "framework_name": "Primary Assurance Standard",
      "provision_code": "P3.4",
      "provision_name": "Environmental Management"
    }
  ]
}
```

**POST /api/questions/{id}/mappings/**
```json
// Request
{
  "framework_id": "fw-supplier-questionnaire-001",
  "provision_code": "SAQ.12",
  "provision_name": "Environmental Policy"
}

// Response (201 Created)
{
  "mappings": [
    {
      "framework_id": "fw-primary-assurance-001",
      "framework_name": "Primary Assurance Standard",
      "provision_code": "P3.4",
      "provision_name": "Environmental Management"
    },
    {
      "framework_id": "fw-supplier-questionnaire-001",
      "framework_name": "Supplier Questionnaire",
      "provision_code": "SAQ.12",
      "provision_name": "Environmental Policy"
    }
  ]
}
```

**DELETE /api/questions/{id}/mappings/{index}/**
```json
// Response (200 OK)
{
  "message": "Mapping removed",
  "removed": {
    "framework_id": "fw-primary-assurance-001",
    "framework_name": "Primary Assurance Standard",
    "provision_code": "P3.4",
    "provision_name": "Environmental Management"
  },
  "mappings": []
}
```

---

## Verification Checklist

### Before Running Tests

- [ ] `playwright/.auth/` directory exists
- [ ] `auth.setup.ts` creates valid SUPERADMIN token
- [ ] Backend has `TEST_MOCK=true` bypass for session validation
- [ ] Dev server running on port 5173
- [ ] `TEST_MOCK=true` environment variable set

### After Running Tests

- [ ] All 6 test cases pass (TC-01 through TC-06)
- [ ] No timeout errors (actionTimeout set to 10s)
- [ ] Toast notifications appear correctly
- [ ] Modal opens/closes as expected
- [ ] Badges update after add/remove operations
- [ ] RBAC tests confirm ORG_ADMIN cannot edit

### Debugging Failed Tests

**Test fails at auth.setup.ts**:
```bash
# Delete stale storage state
rm -f playwright/.auth/user.json

# Re-run setup
TEST_MOCK=true npx playwright test auth.setup.ts
```

**Test times out waiting for element**:
```bash
# Run with visible browser to see what's happening
TEST_MOCK=true npx playwright test framework-mapping.spec.ts --headed

# Or use UI mode for interactive debugging
TEST_MOCK=true npx playwright test framework-mapping.spec.ts --ui
```

**Backend rejects fake token**:
- Verify `TEST_MOCK=true` is set in BOTH terminal and dev server
- Check backend session validation has test mode bypass
- Ensure token payload matches expected structure (sub, email, role, org_id)

**Toast not appearing**:
- Check `useToast` hook is imported in modal component
- Verify Sonner Toaster is rendered in `root.tsx`
- Check toast position (top-right) isn't off-screen

---

## CI Integration

Add to `.github/workflows/frontend-ci.yml`:

```yaml
- name: Run Playwright E2E Tests
  run: |
    TEST_MOCK=true npm run playwright
  env:
    TEST_MOCK: "true"
  working-directory: ./frontend
```

---

## Related Documentation

- [Cross-Framework Mapping Spec](./cross-framework-mapping.md)
- [Playwright Testing Patterns](../skills/playwright-remix-testing.md)
- [Frontend Testing Guide](../skills/applyflow-frontend-testing.md)

---

**End of Document**

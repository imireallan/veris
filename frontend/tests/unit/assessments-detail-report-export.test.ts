import { describe, expect, it } from "vitest";

import { getReportExportUiState, getReportViewUiState } from "~/routes/assessments_detail";
import type { User } from "~/types";
import { UserRole } from "~/types/rbac";

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: "user-1",
    email: "user@example.com",
    fullName: "Test User",
    orgId: "org-1",
    orgName: "Org 1",
    role: UserRole.ASSESSOR,
    fallbackRole: UserRole.ASSESSOR,
    activeOrganization: { id: "org-1", name: "Org 1" },
    activeMembership: {
      role: UserRole.ASSESSOR,
      fallback_role: UserRole.ASSESSOR,
      is_default: true,
      status: "ACTIVE",
    },
    activePermissions: ["assessment:view", "report:view"],
    recentOrganizations: [
      {
        id: "org-1",
        name: "Org 1",
        role: UserRole.ASSESSOR,
        fallback_role: UserRole.ASSESSOR,
      },
    ],
    organizations: [
      {
        id: "org-1",
        name: "Org 1",
        role: UserRole.ASSESSOR,
        fallback_role: UserRole.ASSESSOR,
      },
    ],
    organizationCount: 1,
    isSuperuser: false,
    isStaff: false,
    ...overrides,
  };
}

describe("assessment detail report export UI state", () => {
  it("disables export with a permission tooltip when the user cannot export reports", () => {
    const user = makeUser();

    expect(
      getReportExportUiState({
        user,
        hasReport: true,
        generatingReport: false,
        reportLabel: "Report",
        assessmentLabel: "Assessment",
      }),
    ).toEqual({
      canClick: false,
      disabled: true,
      tooltip: "You don't have permission to export reports. Contact your organization admin.",
    });
  });

  it("enables export for users with report:export", () => {
    const user = makeUser({
      activePermissions: ["assessment:view", "report:view", "report:export"],
    });

    expect(
      getReportExportUiState({
        user,
        hasReport: true,
        generatingReport: false,
        reportLabel: "Report",
        assessmentLabel: "Assessment",
      }),
    ).toEqual({
      canClick: true,
      disabled: false,
      tooltip: "Download PDF report",
    });
  });

  it("prioritizes missing report and generating states over permission messaging", () => {
    const user = makeUser({
      activePermissions: ["assessment:view", "report:view", "report:export"],
    });

    expect(
      getReportExportUiState({
        user,
        hasReport: false,
        generatingReport: false,
        reportLabel: "Report",
        assessmentLabel: "Assessment",
      }),
    ).toEqual({
      canClick: false,
      disabled: true,
      tooltip: "No report generated yet. Complete the assessment and create a report first.",
    });

    expect(
      getReportExportUiState({
        user,
        hasReport: true,
        generatingReport: true,
        reportLabel: "Report",
        assessmentLabel: "Assessment",
      }),
    ).toEqual({
      canClick: false,
      disabled: true,
      tooltip: "Generating PDF report...",
    });
  });
});

describe("assessment detail report view UI state", () => {
  it("shows the report tab and content for users with report:view", () => {
    const user = makeUser({
      activePermissions: ["assessment:view", "report:view"],
    });

    expect(
      getReportViewUiState({
        user,
        hasReport: true,
        reportLabel: "Report",
        assessmentLabel: "Assessment",
      }),
    ).toEqual({
      canView: true,
      showTab: true,
      state: "content",
      message: "",
    });
  });

  it("shows an empty report tab state when the user can view reports but none exists", () => {
    const user = makeUser({
      activePermissions: ["assessment:view", "report:view"],
    });

    expect(
      getReportViewUiState({
        user,
        hasReport: false,
        reportLabel: "Report",
        assessmentLabel: "Assessment",
      }),
    ).toEqual({
      canView: true,
      showTab: true,
      state: "empty",
      message: "No report has been generated for this assessment yet.",
    });
  });

  it("shows a denied state when a report exists but the user lacks report:view", () => {
    const user = makeUser({
      activePermissions: ["assessment:view"],
    });

    expect(
      getReportViewUiState({
        user,
        hasReport: true,
        reportLabel: "Report",
        assessmentLabel: "Assessment",
      }),
    ).toEqual({
      canView: false,
      showTab: true,
      state: "denied",
      message: "You don't have permission to view this report.",
    });
  });

  it("hides the report tab when there is no report and the user cannot view reports", () => {
    const user = makeUser({
      activePermissions: ["assessment:view"],
    });

    expect(
      getReportViewUiState({
        user,
        hasReport: false,
        reportLabel: "Report",
        assessmentLabel: "Assessment",
      }),
    ).toEqual({
      canView: false,
      showTab: false,
      state: "empty",
      message: "No report has been generated for this assessment yet.",
    });
  });
});

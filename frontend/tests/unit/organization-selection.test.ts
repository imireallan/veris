import { describe, expect, it } from "vitest";

import {
  getSelectedOrganizationFromList,
  getSelectedOrganizationIdFromCookie,
} from "~/lib/organization-selection";

const organizations = [
  { id: "org-1", name: "Org 1", role: "ADMIN", fallback_role: "ADMIN" },
  { id: "org-2", name: "Org 2", role: "ASSESSOR", fallback_role: "ASSESSOR" },
];

describe("organization selection helpers", () => {
  it("uses the preferred org when it is available", () => {
    expect(getSelectedOrganizationFromList(organizations, "org-2")?.name).toBe("Org 2");
  });

  it("falls back to the first org when preferred org is missing", () => {
    expect(getSelectedOrganizationFromList(organizations, "org-999")?.name).toBe("Org 1");
  });

  it("reads selected organization id from cookies", () => {
    const cookieHeader = "foo=bar; veris_selected_organization=org-2; theme=dark";
    expect(getSelectedOrganizationIdFromCookie(cookieHeader)).toBe("org-2");
  });
});

import { describe, expect, it } from "vitest";

import { getLandingPrimaryAction, getLoginViewModel } from "~/lib/public-route-viewmodels";

describe("public route view models", () => {
  describe("getLandingPrimaryAction", () => {
    it("sends signed-out users to login", () => {
      expect(getLandingPrimaryAction(null)).toEqual({
        href: "/login",
        label: "Open Veris",
      });
    });

    it("sends signed-in users to the app workspace", () => {
      expect(getLandingPrimaryAction({ id: "user-1" })).toEqual({
        href: "/app",
        label: "Open workspace",
      });
    });
  });

  describe("getLoginViewModel", () => {
    it("uses invitation-aware copy when redirecting into invitation flows", () => {
      expect(getLoginViewModel("/invitations/test-token")).toMatchObject({
        isInvitationLogin: true,
        heading: "Sign in to accept your invitation",
        helperTitle: "Invitation detected",
        submitLabel: "Sign In to Continue",
      });
    });

    it("uses default workspace copy for standard sign in", () => {
      expect(getLoginViewModel("/app")).toMatchObject({
        isInvitationLogin: false,
        heading: "Sign in to your workspace",
        helperTitle: "Secure access",
        submitLabel: "Sign In",
      });
    });
  });
});

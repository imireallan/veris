import type { User } from "~/types";

export function getLandingPrimaryAction(user: Pick<User, "id"> | null) {
  if (user) {
    return {
      href: "/app",
      label: "Open workspace",
    };
  }

  return {
    href: "/login",
    label: "Open Veris",
  };
}

export function getLoginViewModel(redirectTo: string) {
  const isInvitationLogin =
    redirectTo.startsWith("/invitations/") ||
    redirectTo.startsWith("/onboarding/set-password/");

  if (isInvitationLogin) {
    return {
      isInvitationLogin: true,
      heading: "Sign in to accept your invitation",
      description:
        "Use your existing Veris account to continue into your organization workspace.",
      helperTitle: "Invitation detected",
      helperText:
        "You already have an account. Sign in to finish joining the organization.",
      submitLabel: "Sign In to Continue",
    };
  }

  return {
    isInvitationLogin: false,
    heading: "Sign in to your workspace",
    description:
      "Use your Veris account credentials to access your organization workspace.",
    helperTitle: "Secure access",
    helperText: "Enter your work email and password to continue.",
    submitLabel: "Sign In",
  };
}

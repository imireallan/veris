/** Session management for JWT-based auth with cookie sessions. */

import { createCookieSessionStorage, redirect } from "react-router";
import type { MeResponse, User } from "~/types";

function isProductionEnv(): boolean {
  return process.env.NODE_ENV === "production";
}

function parseBooleanEnv(value: string | undefined): boolean | undefined {
  if (!value) return undefined;

  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return undefined;
}

export function isSessionCookieSecure(): boolean {
  return (
    parseBooleanEnv(process.env.FRONTEND_SESSION_COOKIE_SECURE) ??
    parseBooleanEnv(process.env.SESSION_COOKIE_SECURE) ??
    isProductionEnv()
  );
}

const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__session",
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secrets: [process.env.SESSION_SECRET || "dev-secret-change-me"],
    secure: isSessionCookieSecure(),
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
});

async function getSessionFromCookie(cookie: string | null) {
  return sessionStorage.getSession(cookie ?? undefined);
}

export async function getSession(request: Request) {
  const cookie = request.headers.get("Cookie");
  return getSessionFromCookie(cookie);
}

/** Get the access token from a request (returns null if not authenticated). */
export async function getUserToken(request: Request): Promise<string | null> {
  const session = await getSession(request);
  return (session.get("accessToken") as string) ?? null;
}

/** Get the currently selected organization id from the session. */
export async function getSelectedOrganizationId(
  request: Request,
): Promise<string | null> {
  const session = await getSession(request);
  return (session.get("selectedOrganizationId") as string) ?? null;
}

/** Store/update the selected organization id in the session and return the cookie header value. */
export async function setSelectedOrganizationId(
  request: Request,
  organizationId: string | null,
): Promise<string> {
  const session = await getSession(request);

  if (organizationId) {
    session.set("selectedOrganizationId", organizationId);
  } else {
    session.unset("selectedOrganizationId");
  }

  return sessionStorage.commitSession(session);
}

/**
 * Require authentication and fetch the full user profile from /api/auth/me/.
 * Returns a normalized User object. Throws redirect to /login if unauthenticated.
 */
export async function requireUser(request: Request): Promise<User> {
  const token = await getUserToken(request);
  if (!token) {
    throw redirect("/login");
  }

  const selectedOrganizationId = await getSelectedOrganizationId(request);
  const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";

  const response = await fetch(`${backendUrl}/api/auth/me/`, {
    headers: {
      Authorization: `Bearer ${token}`,
      ...(selectedOrganizationId
        ? { "X-Organization-Id": selectedOrganizationId }
        : {}),
    },
  });

  if (!response.ok) {
    const session = await getSession(request);
    throw redirect("/login", {
      headers: {
        "Set-Cookie": await sessionStorage.destroySession(session),
      },
    });
  }

  const data = (await response.json()) as MeResponse;

  const activeOrganization = data.active_organization ?? null;
  const activeMembership = data.active_membership ?? null;
  const recentOrganizations = data.recent_organizations ?? [];

  return {
    id: data.id ?? "",
    email: data.email ?? "",
    fullName: data.full_name ?? data.email ?? "",
    firstName:
      data.first_name ??
      data.full_name?.split(" ")?.[0] ??
      data.email?.split("@")?.[0] ??
      "",
    lastName: data.last_name ?? "",
    pictureUrl: data.picture_url ?? undefined,
    orgId: activeOrganization?.id ?? null,
    orgName: activeOrganization?.name ?? undefined,
    role: (
      activeMembership?.role ?? activeMembership?.fallback_role ?? "VIEWER"
    ).toUpperCase() as User["role"],
    fallbackRole: activeMembership?.fallback_role ?? undefined,
    activeOrganization,
    activeMembership,
    activePermissions: data.active_permissions ?? [],
    activeTerminology: data.active_terminology ?? null,
    organizationCount: data.organization_count ?? recentOrganizations.length,
    recentOrganizations,
    organizations: recentOrganizations,
    isSuperuser: data.is_superuser ?? false,
    isStaff: data.is_staff ?? false,
    timezone: data.timezone ?? undefined,
    country: data.country ?? undefined,
  };
}

/** Create a session with the given access token and optional selected organization, then redirect. */
export async function createTokenSession({
  accessToken,
  redirectTo,
  selectedOrganizationId,
}: {
  accessToken: string;
  redirectTo: string;
  selectedOrganizationId?: string | null;
}) {
  const session = await sessionStorage.getSession();
  session.set("accessToken", accessToken);

  if (selectedOrganizationId) {
    session.set("selectedOrganizationId", selectedOrganizationId);
  } else {
    session.unset("selectedOrganizationId");
  }

  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await sessionStorage.commitSession(session),
    },
  });
}

/** Destroy the current session (logout). */
export async function destroySession(request: Request) {
  const session = await getSession(request);
  return redirect("/login", {
    headers: {
      "Set-Cookie": await sessionStorage.destroySession(session),
    },
  });
}

type LoginSuccess = {
  accessToken: string;
  activeOrganization: {
    id: string;
    name: string;
    slug?: string;
  } | null;
  organizationCount: number;
};

type LoginError = { error: string };

/** Login against the backend API and return token plus minimal org bootstrap. */
export async function loginUser(
  email: string,
  password: string,
): Promise<LoginSuccess | LoginError> {
  try {
    const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
    const response = await fetch(`${backendUrl}/api/auth/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({
        detail: "Invalid credentials",
      }));
      return { error: err.detail ?? "Login failed" };
    }

    const data = await response.json();
    const token = data.access_token ?? data.access;

    if (!token || typeof token !== "string") {
      return { error: "No token received from server" };
    }

    return {
      accessToken: token,
      activeOrganization: data.active_organization ?? null,
      organizationCount: data.organization_count ?? 0,
    };
  } catch {
    return { error: "Network error — is the backend running?" };
  }
}

/** Delete the session cookie (for client-side 401 handling). */
export async function deleteSessionCookie() {
  if (typeof document !== "undefined") {
    document.cookie =
      "__session=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  }
}

/** Destroy session cookie and return redirect to login. */
export async function destroySessionCookie(request: Request) {
  const session = await getSession(request);
  return redirect("/login", {
    headers: {
      "Set-Cookie": await sessionStorage.destroySession(session),
    },
  });
}

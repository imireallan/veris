/** Session management for JWT-based auth with cookie sessions. */

import {
  createCookieSessionStorage,
  redirect,
} from "react-router";
import type { User } from "~/types";

const isProd = process.env.NODE_ENV === "production";

const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__session",
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secrets: [process.env.SESSION_SECRET || "dev-secret-change-me"],
    secure: isProd,
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

/**
 * Require authentication and fetch the full user profile from /api/auth/me/.
 * Returns a normalized User object. Throws redirect to /login if unauthenticated.
 */
export async function requireUser(request: Request): Promise<User> {
  const token = await getUserToken(request);
  if (!token) {
    throw redirect("/login");
  }

  const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
  const response = await fetch(`${backendUrl}/api/auth/me/`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    // Token is invalid/expired — destroy session and redirect to login
    const session = await getSession(request);
    throw redirect("/login", {
      headers: {
        "Set-Cookie": await sessionStorage.destroySession(session),
      },
    });
  }

  const data = await response.json();

  return {
    id: data.id ?? "",
    email: data.email ?? "",
    fullName: data.full_name ?? data.email ?? "",
    firstName: data.first_name ?? data.full_name?.split(" ")[0] ?? data.email?.split("@")[0] ?? "",
    lastName: data.last_name ?? "",
    orgId: data.org_id ?? null,
    orgName: data.org_name ?? undefined,
    role: (data.role ?? "VIEWER").toUpperCase() as User["role"],
    fallbackRole: data.fallback_role ?? undefined,
    pictureUrl: data.picture_url ?? undefined,
    organizations: data.organizations ?? [],
    isSuperuser: data.is_superuser ?? false,
    isStaff: data.is_staff ?? false,
    timezone: data.timezone ?? undefined,
    country: data.country ?? undefined,
  };
}

/** Get the access token from a request (returns null if not authenticated). */
export async function getUserToken(request: Request): Promise<string | null> {
  const session = await getSession(request);
  return (session.get("accessToken") as string) ?? null;
}

/** Create a session with the given access token and redirect. */
export async function createTokenSession({
  accessToken,
  redirectTo,
}: {
  accessToken: string;
  redirectTo: string;
}) {
  const session = await sessionStorage.getSession();
  session.set("accessToken", accessToken);

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

/** Login against the backend API and return token or error. */
export async function loginUser(
  email: string,
  password: string
): Promise<{ accessToken: string } | { error: string }> {
  try {
    const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
    const response = await fetch(`${backendUrl}/api/auth/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: "Invalid credentials" }));
      return { error: err.detail ?? "Login failed" };
    }

    const data = await response.json();
    const token = data.access_token ?? data.access;
    if (!token || typeof token !== "string") {
      return { error: "No token received from server" };
    }
    return { accessToken: token };
  } catch {
    return { error: "Network error — is the backend running?" };
  }
}

/** Delete the session cookie (for 401 handling). Call this in API client when auth fails. */
export async function deleteSessionCookie() {
  // Note: This only works in client-side context via document.cookie
  // In server-side loaders/actions, use destroySession() with redirect instead
  if (typeof document !== "undefined") {
    document.cookie = "__session=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  }
}

/** Destroy session cookie and return redirect to login. Use this in server-side loaders/actions for 401 handling. */
export async function destroySessionCookie(request: Request) {
  const session = await getSession(request);
  return redirect("/login", {
    headers: {
      "Set-Cookie": await sessionStorage.destroySession(session),
    },
  });
}
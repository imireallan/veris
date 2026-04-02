import { redirect } from "react-router";
import { isApiError } from "~/helpers/apiError";

const COOKIE_NAME = "access_token";

/* ─────────────── helpers used across the app ─────────────── */

export function decodeJwt(token: string): { exp: number } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    return JSON.parse(atob(parts[1]));
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = decodeJwt(token);
  if (!payload || !payload.exp) return true;
  const buffer = 30;
  return (payload.exp - buffer) * 1000 < Date.now();
}

export function getAccessToken(request: Request): string | null {
  const cookieHeader = request.headers.get("Cookie");
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]*)`));
  return match ? match[1] : null;
}

/* ─────────────── session creation / destruction ─────────────── */

export async function createTokenSession({
  accessToken,
  redirectTo,
}: {
  accessToken: string;
  redirectTo: string;
}) {
  const maxAge = 7 * 24 * 60 * 60; // 7 days
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": `${COOKIE_NAME}=${accessToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge};`,
    },
  });
}

export async function destroyTokenSession() {
  return redirect("/login", {
    headers: {
      "Set-Cookie": `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0;`,
    },
  });
}

/* ─────────────── user helpers ─────────────── */

const isTestMode = (globalThis as any).__TEST_MODE__ || false;

export async function getUserFromRequest(request: Request) {
  if (isTestMode) {
    const token = getAccessToken(request);
    if (token && decodeJwt(token)) {
      return {
        id: "test-user-123",
        email: "test@example.com",
        fullName: "Test User",
        firstName: "Test",
        lastName: "User",
        orgId: "org-1",
        role: "admin" as const,
        pictureUrl: "https://example.com/avatar.png",
      };
    }
  }

  const apiUrl = process.env.API_URL ?? "";
  const accessToken = getAccessToken(request);
  try {
    const res = await fetch(`${apiUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Record<string, unknown>;
    if (isApiError(data as any)) return null;
    return {
      id: (data.id as string) ?? "",
      email: (data.email as string) ?? "",
      fullName: (data.full_name as string) ?? "",
      firstName: (data.first_name as string) ?? undefined,
      lastName: (data.last_name as string) ?? undefined,
      orgId: (data.org_id as string) ?? "",
      role: (data.role as "admin" | "manager" | "viewer") ?? "viewer",
      pictureUrl: (data.picture_url as string) ?? undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Require authenticated user — throws redirect to /login if none.
 */
export async function requireUser(request: Request) {
  const token = getAccessToken(request);
  if (!token || isTokenExpired(token)) {
    const url = new URL(request.url);
    const searchParams = new URLSearchParams([["redirectTo", url.pathname]]);
    throw redirect(`/login?${searchParams}`);
  }

  const user = await getUserFromRequest(request);
  if (!user) {
    const url = new URL(request.url);
    const searchParams = new URLSearchParams([["redirectTo", url.pathname]]);
    throw redirect(`/login?${searchParams}`);
  }

  return user;
}

export function getUserToken(request: Request) {
  return getAccessToken(request);
}

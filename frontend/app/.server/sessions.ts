/** Server-side session & auth utilities. */

import { redirect } from "react-router";
import { api, ApiError } from "./api";

const COOKIE_NAME = "access_token";

/* ─────────────── helpers ─────────────── */

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

function getAccessToken(request: Request): string | null {
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
  const maxAge = 7 * 24 * 60 * 60;
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

export interface AuthMeResponse {
  id: string;
  email: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  org_id: string;
  role: string;
  picture_url?: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  orgId: string;
  role: "admin" | "manager" | "viewer";
  pictureUrl?: string;
}

function mapUser(data: AuthMeResponse): User {
  return {
    id: data.id,
    email: data.email,
    fullName: data.full_name,
    firstName: data.first_name,
    lastName: data.last_name,
    orgId: data.org_id,
    role: (data.role as User["role"]) || "viewer",
    pictureUrl: data.picture_url,
  };
}

export async function getUserFromRequest(request: Request): Promise<User | null> {
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
        role: "admin",
        pictureUrl: "https://example.com/avatar.png",
      };
    }
  }

  const token = getAccessToken(request);
  if (!token) return null;

  try {
    const data = await api.get<AuthMeResponse>("/api/auth/me", token);
    return mapUser(data);
  } catch {
    return null;
  }
}

export async function loginUser(
  email: string,
  password: string,
): Promise<{ accessToken: string } | { error: string }> {
  try {
    const data = await api.post<{ access_token: string }>(
      "/api/auth/login",
      { email, password },
    );
    return { accessToken: data.access_token };
  } catch (err) {
    if (err instanceof ApiError) {
      return { error: err.status === 401 ? "Invalid credentials" : err.message };
    }
    return { error: "Unable to reach authentication server" };
  }
}

/**
 * Require authenticated user — throws redirect to /login if none.
 */
export async function requireUser(request: Request): Promise<User> {
  const token = getAccessToken(request);
  if (!token || isTokenExpired(token)) {
    const url = new URL(request.url);
    const search = new URLSearchParams([["redirectTo", url.pathname]]);
    throw redirect(`/login?${search}`);
  }

  const user = await getUserFromRequest(request);
  if (!user) {
    const url = new URL(request.url);
    const search = new URLSearchParams([["redirectTo", url.pathname]]);
    throw redirect(`/login?${search}`);
  }

  return user;
}

export function getUserToken(request: Request): string | null {
  return getAccessToken(request);
}

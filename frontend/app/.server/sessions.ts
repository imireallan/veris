/** Session management for JWT-based auth with cookie sessions. */

import {
  createCookieSessionStorage,
  redirect,
} from "react-router";

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

/** Get the access token from a request (throws if not authenticated). */
export async function requireUser(request: Request) {
  const session = await getSession(request);
  const token = session.get("accessToken") as string | undefined;

  if (!token) {
    throw redirect("/login");
  }

  // Decode the JWT payload to get user info, gracefully handle missing fields
  let id: string | undefined;
  let email: string | undefined;
  let role: string | undefined;
  let organization_id: string | undefined;
  try {
    const payload = decodeJwtPayload(token);
    id = payload.sub;
    email = payload.email;
    role = payload.role;
    organization_id = payload.organization_id;
  } catch {
    // Token exists but can't be fully decoded — still return user with available fields
    // Don't destroy session; the token is still valid for API calls
  }
  return { id, email, role, orgId: organization_id, hasToken: true };
}

/** Get the access token from a request (returns null if not authenticated). */
export async function getUserToken(request: Request): Promise<string | null> {
  const session = await getSession(request);
  return (session.get("accessToken") as string) ?? null;
}

/** Check if the current request is authenticated. */
export async function isAuthenticated(request: Request): Promise<boolean> {
  const token = await getUserToken(request);
  return !!token;
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

/** Decode a JWT payload (no signature verification — just reads claims). */
function decodeJwtPayload(token: string): Record<string, any> {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid JWT");
  const raw = Buffer.from(parts[1], "base64url").toString("utf8");
  return JSON.parse(raw);
}

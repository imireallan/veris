/** Centralized API request helpers — all server-side fetches go through here. */

import { redirect } from "react-router";
import { API_URL, AI_API_URL } from "../config";
import { getSession, destroySessionCookie } from "../sessions";
export { API_URL, AI_API_URL };

/* ─────────────── error types ─────────────── */

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/* ─────────────── request helpers ─────────────── */

interface RequestOptions extends RequestInit {
  /** Auth token for Authorization header (optional auto-add) */
  token?: string | null;
}

async function apiRequest(path: string, options?: RequestOptions, baseUrl?: string, requestContext?: Request) {
  const { token, headers: extraHeaders, ...init } = options ?? {};
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(extraHeaders as Record<string, string> ?? {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Ensure trailing slash for Django APPEND_SLASH compatibility
  // Handle query params correctly: /path?query -> /path/?query
  const [pathOnly, queryString] = path.split('?');
  const normalizedPath = pathOnly.endsWith("/") ? path : `${pathOnly}/${queryString ? `?${queryString}` : ''}`;
  const url = `${baseUrl ?? API_URL}${normalizedPath}`;
  const res = await fetch(url, { ...init, headers });

  if (!res.ok) {
    // Handle 401 Unauthorized - only destroy session if we had a token (authenticated request)
    // For public endpoints (no token), 401 is just a normal error response
    if (res.status === 401 && token) {
      // Authenticated request got 401 - session expired, destroy and redirect
      if (requestContext) {
        throw await destroySessionCookie(requestContext);
      }
      // Fallback: throw ApiError for client-side handling
      throw new ApiError("Session expired. Please login again.", 401, { error: "Unauthorized" });
    }
    
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      body = null;
    }
    const message = (body as any)?.error ?? (body as any)?.detail ?? res.statusText;
    throw new ApiError(message, res.status, body);
  }

  // 204 No Content
  if (res.status === 204) return null;

  return res.json() as Promise<unknown>;
}

/* ─────────────── typed request methods ─────────────── */

export const api = {
  get<T>(path: string, token?: string | null, request?: Request) {
    return apiRequest(path, { method: "GET", token }, undefined, request) as Promise<T>;
  },

  post<T>(path: string, body: unknown, token?: string | null, request?: Request) {
    return apiRequest(path, { method: "POST", body: JSON.stringify(body), token }, undefined, request) as Promise<T>;
  },

  put<T>(path: string, body: unknown, token?: string | null, request?: Request) {
    return apiRequest(path, { method: "PUT", body: JSON.stringify(body), token }, undefined, request) as Promise<T>;
  },

  patch<T>(path: string, body: unknown, token?: string | null, request?: Request) {
    return apiRequest(path, { method: "PATCH", body: JSON.stringify(body), token }, undefined, request) as Promise<T>;
  },

  delete<T>(path: string, token?: string | null, request?: Request) {
    return apiRequest(path, { method: "DELETE", token }, undefined, request) as Promise<T>;
  },

  /** Request to the AI engine service. */
  ai: {
    get<T>(path: string, token?: string | null, request?: Request) {
      return apiRequest(path, { method: "GET", token }, AI_API_URL, request) as Promise<T>;
    },
    post<T>(path: string, body: unknown, token?: string | null, request?: Request) {
      return apiRequest(path, { method: "POST", body: JSON.stringify(body), token }, AI_API_URL, request) as Promise<T>;
    },
  },
};

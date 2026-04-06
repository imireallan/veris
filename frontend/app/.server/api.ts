/** Centralized API request helpers — all server-side fetches go through here. */

import { API_URL, AI_API_URL } from "./config";
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

async function request(path: string, options?: RequestOptions, baseUrl?: string) {
  const { token, headers: extraHeaders, ...init } = options ?? {};
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(extraHeaders as Record<string, string> ?? {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const url = `${baseUrl ?? API_URL}${path}`;
  const res = await fetch(url, { ...init, headers });

  if (!res.ok) {
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
  get<T>(path: string, token?: string | null) {
    return request(path, { method: "GET", token }) as Promise<T>;
  },

  post<T>(path: string, body: unknown, token?: string | null) {
    return request(path, { method: "POST", body: JSON.stringify(body), token }) as Promise<T>;
  },

  put<T>(path: string, body: unknown, token?: string | null) {
    return request(path, { method: "PUT", body: JSON.stringify(body), token }) as Promise<T>;
  },

  patch<T>(path: string, body: unknown, token?: string | null) {
    return request(path, { method: "PATCH", body: JSON.stringify(body), token }) as Promise<T>;
  },

  delete<T>(path: string, token?: string | null) {
    return request(path, { method: "DELETE", token }) as Promise<T>;
  },

  /** Request to the AI engine service. */
  ai: {
    get<T>(path: string, token?: string | null) {
      return request(path, { method: "GET", token }, AI_API_URL) as Promise<T>;
    },
    post<T>(path: string, body: unknown, token?: string | null) {
      return request(path, { method: "POST", body: JSON.stringify(body), token }, AI_API_URL) as Promise<T>;
    },
  },
};

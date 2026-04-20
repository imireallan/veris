/** Centralized API request helpers — all server-side fetches go through here. */

import { API_URL, AI_API_URL } from "../config";
import { destroySessionCookie, getSession } from "../sessions";

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
  /** Explicit org id override (optional) */
  organizationId?: string | null;
}

async function getSelectedOrganizationIdFromRequest(
  requestContext?: Request,
): Promise<string | null> {
  if (!requestContext) return null;

  const session = await getSession(requestContext);
  return (session.get("selectedOrganizationId") as string) ?? null;
}

function normalizePath(path: string) {
  const [pathOnly, queryString] = path.split("?");
  return pathOnly.endsWith("/")
    ? path
    : `${pathOnly}/${queryString ? `?${queryString}` : ""}`;
}

async function apiRequest(
  path: string,
  options?: RequestOptions,
  baseUrl?: string,
  requestContext?: Request,
) {
  const {
    token,
    organizationId: explicitOrganizationId,
    headers: extraHeaders,
    ...init
  } = options ?? {};

  const sessionOrganizationId =
    explicitOrganizationId ??
    (await getSelectedOrganizationIdFromRequest(requestContext));

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((extraHeaders as Record<string, string>) ?? {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (sessionOrganizationId) {
    headers["X-Organization-Id"] = sessionOrganizationId;
  }

  const normalizedPath = normalizePath(path);
  const url = `${baseUrl ?? API_URL}${normalizedPath}`;
  const res = await fetch(url, { ...init, headers });

  if (!res.ok) {
    if (res.status === 401 && token) {
      if (requestContext) {
        throw await destroySessionCookie(requestContext);
      }

      throw new ApiError("Session expired. Please login again.", 401, {
        error: "Unauthorized",
      });
    }

    let body: unknown;
    try {
      body = await res.json();
    } catch {
      body = null;
    }

    const message =
      (body as any)?.error ?? (body as any)?.detail ?? res.statusText;

    throw new ApiError(message, res.status, body);
  }

  if (res.status === 204) return null;

  return res.json() as Promise<unknown>;
}

/* ─────────────── typed request methods ─────────────── */

export const api = {
  get<T>(path: string, token?: string | null, request?: Request) {
    return apiRequest(
      path,
      { method: "GET", token },
      undefined,
      request,
    ) as Promise<T>;
  },

  post<T>(
    path: string,
    body: unknown,
    token?: string | null,
    request?: Request,
  ) {
    return apiRequest(
      path,
      { method: "POST", body: JSON.stringify(body), token },
      undefined,
      request,
    ) as Promise<T>;
  },

  put<T>(
    path: string,
    body: unknown,
    token?: string | null,
    request?: Request,
  ) {
    return apiRequest(
      path,
      { method: "PUT", body: JSON.stringify(body), token },
      undefined,
      request,
    ) as Promise<T>;
  },

  patch<T>(
    path: string,
    body: unknown,
    token?: string | null,
    request?: Request,
  ) {
    return apiRequest(
      path,
      { method: "PATCH", body: JSON.stringify(body), token },
      undefined,
      request,
    ) as Promise<T>;
  },

  delete<T>(path: string, token?: string | null, request?: Request) {
    return apiRequest(
      path,
      { method: "DELETE", token },
      undefined,
      request,
    ) as Promise<T>;
  },

  /**
   * Request with explicit organization override.
   * Useful when switching orgs or calling cross-org bootstrap endpoints.
   */
  withOrganization: {
    get<T>(
      path: string,
      organizationId: string | null,
      token?: string | null,
      request?: Request,
    ) {
      return apiRequest(
        path,
        { method: "GET", token, organizationId },
        undefined,
        request,
      ) as Promise<T>;
    },

    post<T>(
      path: string,
      body: unknown,
      organizationId: string | null,
      token?: string | null,
      request?: Request,
    ) {
      return apiRequest(
        path,
        { method: "POST", body: JSON.stringify(body), token, organizationId },
        undefined,
        request,
      ) as Promise<T>;
    },

    put<T>(
      path: string,
      body: unknown,
      organizationId: string | null,
      token?: string | null,
      request?: Request,
    ) {
      return apiRequest(
        path,
        { method: "PUT", body: JSON.stringify(body), token, organizationId },
        undefined,
        request,
      ) as Promise<T>;
    },

    patch<T>(
      path: string,
      body: unknown,
      organizationId: string | null,
      token?: string | null,
      request?: Request,
    ) {
      return apiRequest(
        path,
        { method: "PATCH", body: JSON.stringify(body), token, organizationId },
        undefined,
        request,
      ) as Promise<T>;
    },

    delete<T>(
      path: string,
      organizationId: string | null,
      token?: string | null,
      request?: Request,
    ) {
      return apiRequest(
        path,
        { method: "DELETE", token, organizationId },
        undefined,
        request,
      ) as Promise<T>;
    },
  },

  /** Raw fetch for non-JSON responses (PDFs, files, etc.) */
  async raw(
    path: string,
    options?: RequestOptions,
    baseUrl?: string,
    request?: Request,
  ) {
    const {
      token,
      organizationId: explicitOrganizationId,
      headers: extraHeaders,
      ...init
    } = options ?? {};

    const sessionOrganizationId =
      explicitOrganizationId ??
      (await getSelectedOrganizationIdFromRequest(request));

    const headers: Record<string, string> = {
      ...((extraHeaders as Record<string, string>) ?? {}),
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    if (sessionOrganizationId) {
      headers["X-Organization-Id"] = sessionOrganizationId;
    }

    const normalizedPath = normalizePath(path);
    const url = `${baseUrl ?? API_URL}${normalizedPath}`;
    return fetch(url, { ...init, headers });
  },

  /** Request to the AI engine service. */
  ai: {
    get<T>(path: string, token?: string | null, request?: Request) {
      return apiRequest(
        path,
        { method: "GET", token },
        AI_API_URL,
        request,
      ) as Promise<T>;
    },

    post<T>(
      path: string,
      body: unknown,
      token?: string | null,
      request?: Request,
    ) {
      return apiRequest(
        path,
        { method: "POST", body: JSON.stringify(body), token },
        AI_API_URL,
        request,
      ) as Promise<T>;
    },

    withOrganization: {
      get<T>(
        path: string,
        organizationId: string | null,
        token?: string | null,
        request?: Request,
      ) {
        return apiRequest(
          path,
          { method: "GET", token, organizationId },
          AI_API_URL,
          request,
        ) as Promise<T>;
      },

      post<T>(
        path: string,
        body: unknown,
        organizationId: string | null,
        token?: string | null,
        request?: Request,
      ) {
        return apiRequest(
          path,
          { method: "POST", body: JSON.stringify(body), token, organizationId },
          AI_API_URL,
          request,
        ) as Promise<T>;
      },
    },
  },
};

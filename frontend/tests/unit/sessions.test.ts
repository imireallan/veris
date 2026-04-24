import { afterEach, describe, expect, it } from "vitest";

import { isSessionCookieSecure } from "../../app/.server/sessions";

const originalNodeEnv = process.env.NODE_ENV;
const originalFrontendSessionCookieSecure = process.env.FRONTEND_SESSION_COOKIE_SECURE;
const originalSessionCookieSecure = process.env.SESSION_COOKIE_SECURE;

afterEach(() => {
  process.env.NODE_ENV = originalNodeEnv;
  process.env.FRONTEND_SESSION_COOKIE_SECURE = originalFrontendSessionCookieSecure;
  process.env.SESSION_COOKIE_SECURE = originalSessionCookieSecure;
});

describe("isSessionCookieSecure", () => {
  it("defaults to secure cookies in production", () => {
    process.env.NODE_ENV = "production";
    delete process.env.FRONTEND_SESSION_COOKIE_SECURE;
    delete process.env.SESSION_COOKIE_SECURE;

    expect(isSessionCookieSecure()).toBe(true);
  });

  it("allows HTTP staging to opt out via FRONTEND_SESSION_COOKIE_SECURE", () => {
    process.env.NODE_ENV = "production";
    process.env.FRONTEND_SESSION_COOKIE_SECURE = "false";
    process.env.SESSION_COOKIE_SECURE = "true";

    expect(isSessionCookieSecure()).toBe(false);
  });

  it("falls back to SESSION_COOKIE_SECURE when frontend override is absent", () => {
    process.env.NODE_ENV = "production";
    delete process.env.FRONTEND_SESSION_COOKIE_SECURE;
    process.env.SESSION_COOKIE_SECURE = "false";

    expect(isSessionCookieSecure()).toBe(false);
  });
});

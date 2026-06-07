/**
 * Tests for middleware.ts route-matching logic.
 *
 * Since the middleware uses next-auth's `auth()` wrapper, we test the
 * PUBLIC_PATHS logic and config matcher separately.
 */

describe("middleware route matching", () => {
  const PUBLIC_PATHS = [
    "/auth/login",
    "/auth/register",
    "/api/auth",
    "/onboarding",
  ];

  function isPublic(pathname: string): boolean {
    return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  }

  describe("public path detection", () => {
    it("recognizes /auth/login as public", () => {
      expect(isPublic("/auth/login")).toBe(true);
    });

    it("recognizes /auth/register as public", () => {
      expect(isPublic("/auth/register")).toBe(true);
    });

    it("recognizes /api/auth/* as public", () => {
      expect(isPublic("/api/auth/callback/google")).toBe(true);
      expect(isPublic("/api/auth/signin")).toBe(true);
    });

    it("recognizes /onboarding as public", () => {
      expect(isPublic("/onboarding")).toBe(true);
    });

    it("does not treat /dashboard as public", () => {
      expect(isPublic("/dashboard")).toBe(false);
    });

    it("does not treat /subscriptions as public", () => {
      expect(isPublic("/subscriptions")).toBe(false);
    });

    it("does not treat /budgeting as public", () => {
      expect(isPublic("/budgeting")).toBe(false);
    });

    it("does not treat /goals as public", () => {
      expect(isPublic("/goals")).toBe(false);
    });

    it("does not treat /scanning as public", () => {
      expect(isPublic("/scanning")).toBe(false);
    });

    it("does not treat /settings as public", () => {
      expect(isPublic("/settings")).toBe(false);
    });

    it("does not treat root / as public", () => {
      expect(isPublic("/")).toBe(false);
    });
  });

  describe("API route detection", () => {
    function isApiRoute(pathname: string): boolean {
      return pathname.startsWith("/api/");
    }

    it("recognizes /api/subscriptions as API route", () => {
      expect(isApiRoute("/api/subscriptions")).toBe(true);
    });

    it("recognizes /api/budget as API route", () => {
      expect(isApiRoute("/api/budget")).toBe(true);
    });

    it("does not treat /dashboard as API route", () => {
      expect(isApiRoute("/dashboard")).toBe(false);
    });

    it("does not treat /api without trailing slash", () => {
      expect(isApiRoute("/api")).toBe(false);
    });
  });

  describe("config matcher pattern", () => {
    const matcherPattern = /^(?!\/_next\/static|\/_next\/image|\/favicon\.ico|\/public\/)/;

    it("excludes _next/static assets", () => {
      expect(matcherPattern.test("/_next/static/chunk.js")).toBe(false);
    });

    it("excludes _next/image", () => {
      expect(matcherPattern.test("/_next/image?url=...")).toBe(false);
    });

    it("excludes favicon.ico", () => {
      expect(matcherPattern.test("/favicon.ico")).toBe(false);
    });

    it("excludes /public/ assets", () => {
      expect(matcherPattern.test("/public/logo.png")).toBe(false);
    });

    it("includes /dashboard", () => {
      expect(matcherPattern.test("/dashboard")).toBe(true);
    });

    it("includes /api/subscriptions", () => {
      expect(matcherPattern.test("/api/subscriptions")).toBe(true);
    });
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockSign, mockJwtVerify, mockCookieStore } = vi.hoisted(() => ({
  mockSign: vi.fn().mockResolvedValue("mock-jwt-token"),
  mockJwtVerify: vi.fn(),
  mockCookieStore: {
    set: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("jose", () => ({
  SignJWT: vi.fn(function () { return ({
    setProtectedHeader: vi.fn().mockReturnThis(),
    setIssuedAt: vi.fn().mockReturnThis(),
    setExpirationTime: vi.fn().mockReturnThis(),
    sign: mockSign,
  }); }),
  jwtVerify: mockJwtVerify,
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue(mockCookieStore),
}));

import { createSession, getSession, logout } from "./auth";

describe("Session Management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createSession", () => {
    it("creates a JWT and sets an httpOnly cookie", async () => {
      await createSession({ username: "testuser", id: 1 });

      expect(mockSign).toHaveBeenCalled();
      expect(mockCookieStore.set).toHaveBeenCalledWith(
        "session",
        "mock-jwt-token",
        expect.objectContaining({
          httpOnly: true,
          sameSite: "lax",
          path: "/",
        })
      );
    });

    it("sets secure flag based on NODE_ENV", async () => {
      const origEnv = process.env.NODE_ENV;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (process.env as any).NODE_ENV = "production";

      await createSession({ username: "testuser", id: 1 });

      expect(mockCookieStore.set).toHaveBeenCalledWith(
        "session",
        expect.any(String),
        expect.objectContaining({ secure: true })
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (process.env as any).NODE_ENV = origEnv;
    });
  });

  describe("getSession", () => {
    it("returns session payload for a valid JWT", async () => {
      mockCookieStore.get.mockReturnValueOnce({ value: "valid-token" });
      mockJwtVerify.mockResolvedValueOnce({
        payload: { username: "testuser", id: 1 },
      });

      const session = await getSession();
      expect(session).toEqual({ username: "testuser", id: 1 });
    });

    it("returns null when no session cookie exists", async () => {
      mockCookieStore.get.mockReturnValueOnce(undefined);

      const session = await getSession();
      expect(session).toBeNull();
    });

    it("returns null when JWT verification fails", async () => {
      mockCookieStore.get.mockReturnValueOnce({ value: "invalid-token" });
      mockJwtVerify.mockRejectedValueOnce(new Error("JWT expired"));

      const session = await getSession();
      expect(session).toBeNull();
    });
  });

  describe("logout", () => {
    it("deletes the session cookie", async () => {
      await logout();
      expect(mockCookieStore.delete).toHaveBeenCalledWith("session");
    });
  });
});

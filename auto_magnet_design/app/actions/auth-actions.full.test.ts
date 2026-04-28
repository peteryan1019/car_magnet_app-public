import { describe, it, expect, vi, beforeEach } from "vitest";
import { createAuthService } from "@/lib/services/authService";
import type { IUserRepo, IVerificationTokenRepo } from "@/lib/repos/interfaces";

const { mockSendMail } = vi.hoisted(() => ({
  mockSendMail: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ createSession: vi.fn(), logout: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn((url: string) => { throw new Error(`REDIRECT:${url}`); }) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/mailer", () => ({ default: { sendMail: mockSendMail } }));
vi.mock("bcrypt", () => ({ default: { hash: vi.fn().mockResolvedValue("hashed_password"), compare: vi.fn() } }));

const fakeUserRepo: IUserRepo = {
  findByUsernameOrEmail: vi.fn(), findByUsername: vi.fn(), findEmailById: vi.fn(), insertReturning: vi.fn(), count: vi.fn(),
};
const fakeVerificationTokenRepo: IVerificationTokenRepo = {
  upsertByEmail: vi.fn(), findByEmail: vi.fn(), deleteByEmail: vi.fn(),
};
const { register, logoutUser } = createAuthService({ userRepo: fakeUserRepo, verificationTokenRepo: fakeVerificationTokenRepo });

function makeFormData(data: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(data)) fd.set(key, value);
  return fd;
}

describe("Auth Actions - Extended", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  describe("register - happy path", () => {
    it("sends verification email and returns verify step", async () => {
      (fakeUserRepo.findByUsernameOrEmail as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);
      mockSendMail.mockResolvedValueOnce({});
      const result = await register(null, makeFormData({ username: "newuser", email: "new@example.com", password: "securepassword123" }));
      expect(result).toEqual({ step: "verify", email: "new@example.com" });
      expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({ to: "new@example.com" }));
    });

    it("returns error when email sending fails", async () => {
      (fakeUserRepo.findByUsernameOrEmail as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);
      mockSendMail.mockRejectedValueOnce(new Error("SMTP error"));
      const result = await register(null, makeFormData({ username: "newuser", email: "new@example.com", password: "securepassword123" }));
      expect(result).toEqual({ error: "Failed to send verification email. Please try again." });
    });

    it("returns error on database failure", async () => {
      (fakeUserRepo.findByUsernameOrEmail as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("DB down"));
      const result = await register(null, makeFormData({ username: "newuser", email: "new@example.com", password: "securepassword123" }));
      expect(result).toEqual({ error: "Registration failed. Please try again later." });
    });
  });

  describe("register - validation edge cases", () => {
    it("rejects username at 51 chars", async () => {
      const result = await register(null, makeFormData({ username: "a".repeat(51), email: "t@e.com", password: "password123" }));
      expect(result.error).toBeDefined();
    });

    it("accepts username at exactly 3 chars", async () => {
      (fakeUserRepo.findByUsernameOrEmail as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);
      mockSendMail.mockResolvedValueOnce({});
      const result = await register(null, makeFormData({ username: "abc", email: "t@e.com", password: "password123" }));
      expect(result).toEqual({ step: "verify", email: "t@e.com" });
    });

    it("accepts password at exactly 8 chars", async () => {
      (fakeUserRepo.findByUsernameOrEmail as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);
      mockSendMail.mockResolvedValueOnce({});
      const result = await register(null, makeFormData({ username: "testuser", email: "t@e.com", password: "12345678" }));
      expect(result).toEqual({ step: "verify", email: "t@e.com" });
    });
  });

  describe("logoutUser", () => {
    it("clears session and redirects to /login", async () => {
      await expect(logoutUser()).rejects.toThrow("REDIRECT:/login");
      const { logout } = await import("@/lib/auth");
      expect(logout).toHaveBeenCalled();
    });
  });
});

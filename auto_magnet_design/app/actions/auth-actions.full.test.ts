import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerAction, logoutAction } from "./auth-actions";

const { mockSendMail, mockSelect, mockInsert } = vi.hoisted(() => ({
  mockSendMail: vi.fn(),
  mockSelect: vi.fn(),
  mockInsert: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  createSession: vi.fn(),
  logout: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/mailer", () => ({
  default: { sendMail: mockSendMail },
}));

vi.mock("@/db", () => ({
  db: {
    select: () => ({ from: () => ({ where: mockSelect }) }),
    insert: () => ({
      values: mockInsert.mockReturnValue({
        onConflictDoUpdate: vi.fn(),
        returning: vi.fn().mockResolvedValue([{ id: 1, username: "newuser" }]),
      }),
    }),
    delete: () => ({ where: vi.fn() }),
  },
}));

vi.mock("bcrypt", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("hashed_password"),
    compare: vi.fn(),
  },
}));

function makeFormData(data: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(data)) fd.set(key, value);
  return fd;
}

describe("Auth Actions - Extended", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("registerAction - happy path", () => {
    it("sends verification email and returns verify step on valid registration", async () => {
      mockSelect.mockResolvedValueOnce([]); // no existing user
      mockSendMail.mockResolvedValueOnce({});

      const fd = makeFormData({
        username: "newuser",
        email: "new@example.com",
        password: "securepassword123",
      });

      const result = await registerAction(null, fd);
      expect(result).toEqual({ step: "verify", email: "new@example.com" });
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "new@example.com",
          subject: "Your AutoMagnet Verification Code",
        })
      );
    });

    it("returns error when email sending fails", async () => {
      mockSelect.mockResolvedValueOnce([]); // no existing user
      mockSendMail.mockRejectedValueOnce(new Error("SMTP error"));

      const fd = makeFormData({
        username: "newuser",
        email: "new@example.com",
        password: "securepassword123",
      });

      const result = await registerAction(null, fd);
      expect(result).toEqual({
        error: "Failed to send verification email. Please try again.",
      });
    });

    it("returns error on database failure during registration", async () => {
      mockSelect.mockRejectedValueOnce(new Error("DB connection lost"));

      const fd = makeFormData({
        username: "newuser",
        email: "new@example.com",
        password: "securepassword123",
      });

      const result = await registerAction(null, fd);
      expect(result).toEqual({
        error: "Registration failed. Please try again later.",
      });
    });
  });

  describe("registerAction - validation edge cases", () => {
    it("rejects username at exactly max length (51 chars)", async () => {
      const fd = makeFormData({
        username: "a".repeat(51),
        email: "test@example.com",
        password: "password123",
      });

      const result = await registerAction(null, fd);
      expect(result.error).toBeDefined();
    });

    it("accepts username at exactly 3 chars", async () => {
      mockSelect.mockResolvedValueOnce([]);
      mockSendMail.mockResolvedValueOnce({});

      const fd = makeFormData({
        username: "abc",
        email: "test@example.com",
        password: "password123",
      });

      const result = await registerAction(null, fd);
      expect(result).toEqual({ step: "verify", email: "test@example.com" });
    });

    it("accepts password at exactly 8 chars", async () => {
      mockSelect.mockResolvedValueOnce([]);
      mockSendMail.mockResolvedValueOnce({});

      const fd = makeFormData({
        username: "testuser",
        email: "test@example.com",
        password: "12345678",
      });

      const result = await registerAction(null, fd);
      expect(result).toEqual({ step: "verify", email: "test@example.com" });
    });
  });

  describe("logoutAction", () => {
    it("clears session and redirects to /login", async () => {
      await expect(logoutAction()).rejects.toThrow("REDIRECT:/login");

      const { logout } = await import("@/lib/auth");
      expect(logout).toHaveBeenCalled();
    });
  });
});

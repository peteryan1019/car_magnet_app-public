import { describe, it, expect, vi, beforeEach } from "vitest";
import { createAuthService } from "@/lib/services/authService";
import type { IUserRepo, IVerificationTokenRepo } from "@/lib/repos/interfaces";

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
  default: { sendMail: vi.fn().mockResolvedValue({}) },
}));

vi.mock("bcrypt", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("hashed_password"),
    compare: vi.fn(),
  },
}));

const fakeUserRepo: IUserRepo = {
  findByUsernameOrEmail: vi.fn(),
  findByUsername: vi.fn(),
  findEmailById: vi.fn(),
  insertReturning: vi.fn(),
  count: vi.fn(),
};

const fakeVerificationTokenRepo: IVerificationTokenRepo = {
  upsertByEmail: vi.fn(),
  findByEmail: vi.fn(),
  deleteByEmail: vi.fn(),
};

const { register, login, verifyAndRegister } = createAuthService({
  userRepo: fakeUserRepo,
  verificationTokenRepo: fakeVerificationTokenRepo,
});

function makeFormData(data: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(data)) fd.set(key, value);
  return fd;
}

describe("Auth Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("register", () => {
    it("rejects a username shorter than 3 characters", async () => {
      const fd = makeFormData({ username: "ab", email: "test@example.com", password: "password123" });
      const result = await register(null, fd);
      expect(result.error).toBe("Username must be at least 3 characters");
    });

    it("rejects an invalid email address", async () => {
      const fd = makeFormData({ username: "testuser", email: "not-an-email", password: "password123" });
      const result = await register(null, fd);
      expect(result.error).toBe("Please enter a valid email address");
    });

    it("rejects a password shorter than 8 characters", async () => {
      const fd = makeFormData({ username: "testuser", email: "test@example.com", password: "short" });
      const result = await register(null, fd);
      expect(result.error).toBe("Password must be at least 8 characters");
    });

    it("rejects a duplicate username", async () => {
      (fakeUserRepo.findByUsernameOrEmail as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        username: "taken", email: "other@example.com",
      });
      const fd = makeFormData({ username: "taken", email: "new@example.com", password: "password123" });
      const result = await register(null, fd);
      expect(result.error).toBe("Username already taken");
    });

    it("rejects a duplicate email", async () => {
      (fakeUserRepo.findByUsernameOrEmail as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        username: "otheruser", email: "taken@example.com",
      });
      const fd = makeFormData({ username: "newuser", email: "taken@example.com", password: "password123" });
      const result = await register(null, fd);
      expect(result.error).toBe("Email already registered");
    });
  });

  describe("login", () => {
    it("rejects empty credentials", async () => {
      const fd = makeFormData({ username: "", password: "" });
      const result = await login(null, fd);
      expect(result).toEqual({ error: "Invalid credentials" });
    });

    it("rejects a non-existent user", async () => {
      (fakeUserRepo.findByUsername as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);
      const fd = makeFormData({ username: "ghost", password: "password123" });
      const result = await login(null, fd);
      expect(result).toEqual({ error: "Invalid credentials" });
    });

    it("rejects an incorrect password", async () => {
      (fakeUserRepo.findByUsername as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        username: "testuser", password_hash: "hashed", id: 1,
      });
      const bcrypt = (await import("bcrypt")).default;
      (bcrypt.compare as ReturnType<typeof vi.fn>).mockResolvedValueOnce(false);
      const fd = makeFormData({ username: "testuser", password: "wrongpassword" });
      const result = await login(null, fd);
      expect(result).toEqual({ error: "Invalid credentials" });
    });

    it("redirects to / on successful login", async () => {
      (fakeUserRepo.findByUsername as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        username: "testuser", password_hash: "hashed", id: 1,
      });
      const bcrypt = (await import("bcrypt")).default;
      (bcrypt.compare as ReturnType<typeof vi.fn>).mockResolvedValueOnce(true);
      const fd = makeFormData({ username: "testuser", password: "correctpassword" });
      await expect(login(null, fd)).rejects.toThrow("REDIRECT:/");
    });
  });

  describe("verifyAndRegister", () => {
    it("rejects an invalid code length", async () => {
      const fd = makeFormData({ email: "test@example.com", code: "123" });
      const result = await verifyAndRegister(null, fd);
      expect(result?.error).toBe("Code must be 6 digits");
    });

    it("rejects when no verification token exists", async () => {
      (fakeVerificationTokenRepo.findByEmail as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);
      const fd = makeFormData({ email: "test@example.com", code: "123456" });
      const result = await verifyAndRegister(null, fd);
      expect(result?.error).toBe("Invalid or expired verification code.");
    });

    it("rejects an expired verification code", async () => {
      (fakeVerificationTokenRepo.findByEmail as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        email: "test@example.com", code: "123456",
        expiresAt: new Date(Date.now() - 60000), username: "testuser", password_hash: "hashed",
      });
      const fd = makeFormData({ email: "test@example.com", code: "123456" });
      const result = await verifyAndRegister(null, fd);
      expect(result?.error).toBe("Verification code has expired. Please try registering again.");
    });

    it("rejects an incorrect code", async () => {
      (fakeVerificationTokenRepo.findByEmail as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        email: "test@example.com", code: "999999",
        expiresAt: new Date(Date.now() + 120000), username: "testuser", password_hash: "hashed",
      });
      const fd = makeFormData({ email: "test@example.com", code: "000000" });
      const result = await verifyAndRegister(null, fd);
      expect(result?.error).toBe("Incorrect verification code.");
    });
  });
});

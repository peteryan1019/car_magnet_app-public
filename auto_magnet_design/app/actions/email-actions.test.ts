import { describe, it, expect, vi, beforeEach } from "vitest";
import { createEmailService } from "@/lib/services/emailService";
import type { IUserRepo } from "@/lib/repos/interfaces";

vi.mock("@/lib/auth", () => ({ getSession: vi.fn() }));

const { mockSendMail } = vi.hoisted(() => ({ mockSendMail: vi.fn() }));
vi.mock("@/lib/mailer", () => ({ default: { sendMail: mockSendMail } }));

const fakeUserRepo: IUserRepo = {
  findByUsernameOrEmail: vi.fn(), findByUsername: vi.fn(), findEmailById: vi.fn(), insertReturning: vi.fn(), count: vi.fn(),
};
const { sendEmail } = createEmailService({ userRepo: fakeUserRepo });

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("sendEmail", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("returns error when image fetch fails", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });
    const result = await sendEmail("https://example.com/bad.png");
    expect(result).toEqual({ success: false, error: "Failed to fetch image from URL" });
  });

  it("returns error when not authenticated", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(10)) });
    const { getSession } = await import("@/lib/auth");
    (getSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);
    const result = await sendEmail("https://example.com/design.png");
    expect(result).toEqual({ success: false, error: "Not authenticated" });
  });

  it("sends email and returns success", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(10)) });
    const { getSession } = await import("@/lib/auth");
    (getSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: 1, username: "testuser" });
    (fakeUserRepo.findEmailById as ReturnType<typeof vi.fn>).mockResolvedValueOnce("user@example.com");
    mockSendMail.mockResolvedValueOnce({ messageId: "msg-123" });
    const result = await sendEmail("https://storage.example.com/my-design.png");
    expect(result).toEqual({ success: true, id: "msg-123" });
    expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({ to: "user@example.com" }));
  });

  it("returns error when email sending fails", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(10)) });
    const { getSession } = await import("@/lib/auth");
    (getSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: 1, username: "testuser" });
    (fakeUserRepo.findEmailById as ReturnType<typeof vi.fn>).mockResolvedValueOnce("user@example.com");
    mockSendMail.mockRejectedValueOnce(new Error("SMTP connection failed"));
    const result = await sendEmail("https://example.com/design.png");
    expect(result).toEqual({ success: false, error: "SMTP connection failed" });
  });
});

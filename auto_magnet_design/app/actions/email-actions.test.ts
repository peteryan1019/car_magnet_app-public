import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendEmailAction } from "./email-actions";

const { mockSendMail, mockWhere } = vi.hoisted(() => ({
  mockSendMail: vi.fn(),
  mockWhere: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/lib/mailer", () => ({
  default: { sendMail: mockSendMail },
}));

vi.mock("@/db", () => ({
  db: {
    select: () => ({ from: () => ({ where: mockWhere }) }),
  },
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("sendEmailAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error when image fetch fails", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });

    const result = await sendEmailAction("https://example.com/bad-image.png");
    expect(result).toEqual({
      success: false,
      error: "Failed to fetch image from URL",
    });
  });

  it("returns error when user is not authenticated", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(10)),
    });

    const { getSession } = await import("@/lib/auth");
    (getSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);

    const result = await sendEmailAction("https://example.com/design.png");
    expect(result).toEqual({ success: false, error: "Not authenticated" });
  });

  it("sends email and returns success on valid request", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(10)),
    });

    const { getSession } = await import("@/lib/auth");
    (getSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: 1,
      username: "testuser",
    });

    mockWhere.mockResolvedValueOnce([{ email: "user@example.com" }]);
    mockSendMail.mockResolvedValueOnce({ messageId: "msg-123" });

    const result = await sendEmailAction(
      "https://storage.example.com/my-design.png"
    );

    expect(result).toEqual({ success: true, id: "msg-123" });
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "user@example.com",
        subject: "Here's your generated design!",
        attachments: [
          expect.objectContaining({ filename: "my-design.png" }),
        ],
      })
    );
  });

  it("returns error when email sending fails", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(10)),
    });

    const { getSession } = await import("@/lib/auth");
    (getSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: 1,
      username: "testuser",
    });

    mockWhere.mockResolvedValueOnce([{ email: "user@example.com" }]);
    mockSendMail.mockRejectedValueOnce(new Error("SMTP connection failed"));

    const result = await sendEmailAction("https://example.com/design.png");
    expect(result).toEqual({
      success: false,
      error: "SMTP connection failed",
    });
  });
});

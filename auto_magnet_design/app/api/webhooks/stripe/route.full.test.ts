import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";

const {
  mockConstructEvent,
  mockUpsertOrder,
  mockDbSelect,
  mockDbUpdate,
  mockGeneratePDFs,
  mockSendMail,
} = vi.hoisted(() => ({
  mockConstructEvent: vi.fn(),
  mockUpsertOrder: vi.fn().mockResolvedValue([]),
  mockDbSelect: vi.fn(),
  mockDbUpdate: vi.fn().mockResolvedValue([]),
  mockGeneratePDFs: vi.fn(),
  mockSendMail: vi.fn().mockResolvedValue({}),
}));

vi.mock("stripe", () => ({
  default: vi.fn(() => ({
    webhooks: { constructEvent: mockConstructEvent },
  })),
}));

vi.mock("@/lib/db", () => ({
  upsertOrder: (...args: unknown[]) => mockUpsertOrder(...args),
}));

vi.mock("@/db", () => ({
  db: {
    select: () => ({ from: () => ({ where: mockDbSelect }) }),
    update: () => ({ set: () => ({ where: mockDbUpdate }) }),
  },
}));

vi.mock("@/lib/pdf", () => ({
  generateDesignPDFs: (...args: unknown[]) => mockGeneratePDFs(...args),
}));

vi.mock("@/lib/mailer", () => ({
  default: { sendMail: mockSendMail },
}));

vi.mock("@/db/schema", () => ({
  designs: { id: "id", purchased: "purchased" },
}));

function makeRequest(body: string, signature: string | null): NextRequest {
  const headers: Record<string, string> = {};
  if (signature) headers["stripe-signature"] = signature;
  return new NextRequest("http://localhost:3000/api/webhooks/stripe", {
    method: "POST",
    body,
    headers,
  });
}

describe("Webhook Route - Extended", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("upserts order on payment_intent.payment_failed", async () => {
    mockConstructEvent.mockReturnValueOnce({
      type: "payment_intent.payment_failed",
      data: {
        object: {
          id: "pi_fail",
          receipt_email: "user@test.com",
          amount: 1500,
          currency: "usd",
          status: "requires_payment_method",
        },
      },
    });

    const res = await POST(makeRequest("{}", "whsec_valid"));
    expect(res.status).toBe(200);
    expect(mockUpsertOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        stripe_payment_id: "pi_fail",
        status: "requires_payment_method",
      })
    );
  });

  it("upserts order on payment_intent.canceled", async () => {
    mockConstructEvent.mockReturnValueOnce({
      type: "payment_intent.canceled",
      data: {
        object: {
          id: "pi_cancel",
          receipt_email: null,
          amount: 1500,
          currency: "usd",
          status: "canceled",
        },
      },
    });

    const res = await POST(makeRequest("{}", "whsec_valid"));
    expect(res.status).toBe(200);
    expect(mockUpsertOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        stripe_payment_id: "pi_cancel",
        status: "canceled",
        email: undefined,
      })
    );
  });

  it("skips design processing when no metadata designId present", async () => {
    mockConstructEvent.mockReturnValueOnce({
      type: "checkout.session.completed",
      data: {
        object: {
          payment_intent: "pi_noid",
          customer_details: { email: "buyer@test.com" },
          amount_total: 1500,
          currency: "usd",
          metadata: {},
        },
      },
    });

    const res = await POST(makeRequest("{}", "whsec_valid"));
    expect(res.status).toBe(200);
    expect(mockUpsertOrder).toHaveBeenCalled();
    expect(mockDbSelect).not.toHaveBeenCalled();
    expect(mockGeneratePDFs).not.toHaveBeenCalled();
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  it("skips email to customer when userEmail is null", async () => {
    mockConstructEvent.mockReturnValueOnce({
      type: "checkout.session.completed",
      data: {
        object: {
          payment_intent: "pi_noemail",
          customer_details: null,
          amount_total: 1500,
          currency: "usd",
          metadata: {
            designId: "50",
            imageUrl: "https://example.com/d.png",
            carType: "medium",
            twoDoors: "false",
            leftSide: "false",
          },
        },
      },
    });

    mockDbSelect.mockResolvedValueOnce([{ purchased: false }]);
    mockGeneratePDFs.mockResolvedValueOnce(
      new Map([["full", Buffer.from("pdf")]])
    );

    const res = await POST(makeRequest("{}", "whsec_valid"));
    expect(res.status).toBe(200);
    // Only print shop email, no customer email
    expect(mockSendMail).toHaveBeenCalledTimes(1);
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "print-shop@example.com" })
    );
  });

  it("returns 500 when handler throws unexpectedly", async () => {
    mockConstructEvent.mockReturnValueOnce({
      type: "payment_intent.succeeded",
      data: {
        object: {
          id: "pi_err",
          receipt_email: null,
          amount: 0,
          currency: "usd",
          status: "succeeded",
        },
      },
    });
    mockUpsertOrder.mockRejectedValueOnce(new Error("DB down"));

    const res = await POST(makeRequest("{}", "whsec_valid"));
    expect(res.status).toBe(500);
  });
});

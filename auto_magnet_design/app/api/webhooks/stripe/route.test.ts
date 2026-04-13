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

describe("POST /api/webhooks/stripe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when stripe-signature header is missing", async () => {
    const req = makeRequest("{}", null);
    const res = await POST(req);

    expect(res.status).toBe(400);
    const text = await res.text();
    expect(text).toBe("Missing Stripe signature");
  });

  it("returns 400 when signature verification fails", async () => {
    mockConstructEvent.mockImplementationOnce(() => {
      throw new Error("Invalid signature");
    });

    const req = makeRequest("{}", "whsec_bad");
    const res = await POST(req);

    expect(res.status).toBe(400);
    const text = await res.text();
    expect(text).toContain("Invalid signature");
  });

  it("upserts order on payment_intent.succeeded", async () => {
    mockConstructEvent.mockReturnValueOnce({
      type: "payment_intent.succeeded",
      data: {
        object: {
          id: "pi_test",
          receipt_email: "payer@test.com",
          amount: 1500,
          currency: "usd",
          status: "succeeded",
        },
      },
    });

    const req = makeRequest("{}", "whsec_valid");
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockUpsertOrder).toHaveBeenCalledWith({
      stripe_payment_id: "pi_test",
      email: "payer@test.com",
      amount: 1500,
      currency: "usd",
      status: "succeeded",
    });
  });

  it("processes checkout.session.completed with design metadata", async () => {
    mockConstructEvent.mockReturnValueOnce({
      type: "checkout.session.completed",
      data: {
        object: {
          payment_intent: "pi_checkout",
          customer_details: { email: "buyer@test.com" },
          amount_total: 1500,
          currency: "usd",
          metadata: {
            designId: "99",
            imageUrl: "https://example.com/design.png",
            carType: "medium",
            twoDoors: "true",
            leftSide: "false",
          },
        },
      },
    });

    // Design exists and is not purchased
    mockDbSelect.mockResolvedValueOnce([{ purchased: false }]);

    // PDF generation returns buffers
    const pdfMap = new Map<string, Buffer>();
    pdfMap.set("full", Buffer.from("full-pdf"));
    pdfMap.set("left", Buffer.from("left-pdf"));
    pdfMap.set("right", Buffer.from("right-pdf"));
    mockGeneratePDFs.mockResolvedValueOnce(pdfMap);

    const req = makeRequest("{}", "whsec_valid");
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockUpsertOrder).toHaveBeenCalled();
    expect(mockDbUpdate).toHaveBeenCalled(); // marks purchased
    expect(mockGeneratePDFs).toHaveBeenCalledWith({
      imageUrl: "https://example.com/design.png",
      carType: "medium",
      twoDoors: true,
      leftSide: false,
    });
    // Two emails: one to customer, one to print shop
    expect(mockSendMail).toHaveBeenCalledTimes(2);
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "buyer@test.com" })
    );
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "print-shop@example.com" })
    );
  });

  it("skips emails for already-purchased designs (idempotency)", async () => {
    mockConstructEvent.mockReturnValueOnce({
      type: "checkout.session.completed",
      data: {
        object: {
          payment_intent: "pi_dup",
          customer_details: { email: "buyer@test.com" },
          amount_total: 1500,
          currency: "usd",
          metadata: { designId: "99", imageUrl: "https://example.com/d.png", carType: "medium", twoDoors: "false", leftSide: "false" },
        },
      },
    });

    // Design already purchased
    mockDbSelect.mockResolvedValueOnce([{ purchased: true }]);

    const req = makeRequest("{}", "whsec_valid");
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockUpsertOrder).toHaveBeenCalled(); // order still upserted
    expect(mockGeneratePDFs).not.toHaveBeenCalled(); // no PDF gen
    expect(mockSendMail).not.toHaveBeenCalled(); // no emails
  });

  it("returns 200 for unhandled event types", async () => {
    mockConstructEvent.mockReturnValueOnce({
      type: "charge.updated",
      data: { object: {} },
    });

    const req = makeRequest("{}", "whsec_valid");
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.received).toBe(true);
  });
});

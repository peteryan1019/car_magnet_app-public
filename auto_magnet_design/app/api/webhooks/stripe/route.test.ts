import { describe, it, expect, vi, beforeEach } from "vitest";
import { createWebhookService } from "@/lib/services/webhookService";
import { NextRequest } from "next/server";
import type { IOrderRepo, IDesignRepo } from "@/lib/repos/interfaces";

const { mockConstructEvent, mockSendMail, mockGeneratePDFs } = vi.hoisted(() => ({
  mockConstructEvent: vi.fn(),
  mockSendMail: vi.fn().mockResolvedValue({}),
  mockGeneratePDFs: vi.fn(),
}));

vi.mock("stripe", () => ({ default: vi.fn(() => ({ webhooks: { constructEvent: mockConstructEvent } })) }));
vi.mock("@/lib/pdf", () => ({ generateDesignPDFs: (...args: unknown[]) => mockGeneratePDFs(...args) }));
vi.mock("@/lib/mailer", () => ({ default: { sendMail: mockSendMail } }));

const fakeOrderRepo: IOrderRepo = { upsert: vi.fn().mockResolvedValue([]), findAll: vi.fn(), findByStripePaymentId: vi.fn() };
const fakeDesignRepo: IDesignRepo = { insertBatch: vi.fn(), findByUserId: vi.fn(), deleteByIdAndUserId: vi.fn(), findPurchasedById: vi.fn(), markPurchased: vi.fn() };
const { handleWebhook } = createWebhookService({ orderRepo: fakeOrderRepo, designRepo: fakeDesignRepo });

function makeRequest(body: string, signature: string | null): NextRequest {
  const headers: Record<string, string> = {};
  if (signature) headers["stripe-signature"] = signature;
  return new NextRequest("http://localhost:3000/api/webhooks/stripe", { method: "POST", body, headers });
}

describe("POST /api/webhooks/stripe", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("returns 400 when stripe-signature header is missing", async () => {
    const res = await handleWebhook(makeRequest("{}", null));
    expect(res.status).toBe(400);
  });

  it("returns 400 when signature verification fails", async () => {
    mockConstructEvent.mockImplementationOnce(() => { throw new Error("Invalid signature"); });
    const res = await handleWebhook(makeRequest("{}", "whsec_bad"));
    expect(res.status).toBe(400);
  });

  it("upserts order on payment_intent.succeeded", async () => {
    mockConstructEvent.mockReturnValueOnce({ type: "payment_intent.succeeded", data: { object: { id: "pi_test", receipt_email: "payer@test.com", amount: 1500, currency: "usd", status: "succeeded" } } });
    const res = await handleWebhook(makeRequest("{}", "whsec_valid"));
    expect(res.status).toBe(200);
    expect(fakeOrderRepo.upsert).toHaveBeenCalledWith(expect.objectContaining({ stripe_payment_id: "pi_test" }));
  });

  it("processes checkout.session.completed with design metadata", async () => {
    mockConstructEvent.mockReturnValueOnce({ type: "checkout.session.completed", data: { object: { payment_intent: "pi_checkout", customer_details: { email: "buyer@test.com" }, amount_total: 1500, currency: "usd", metadata: { designId: "99", imageUrl: "https://example.com/design.png", carType: "medium", twoDoors: "true", leftSide: "false" } } } });
    (fakeDesignRepo.findPurchasedById as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ purchased: false });
    const pdfMap = new Map([["full", Buffer.from("full")], ["left", Buffer.from("left")], ["right", Buffer.from("right")]]);
    mockGeneratePDFs.mockResolvedValueOnce(pdfMap);
    const res = await handleWebhook(makeRequest("{}", "whsec_valid"));
    expect(res.status).toBe(200);
    expect(fakeDesignRepo.markPurchased).toHaveBeenCalled();
    expect(mockSendMail).toHaveBeenCalledTimes(2);
  });

  it("skips emails for already-purchased designs", async () => {
    mockConstructEvent.mockReturnValueOnce({ type: "checkout.session.completed", data: { object: { payment_intent: "pi_dup", customer_details: { email: "buyer@test.com" }, amount_total: 1500, currency: "usd", metadata: { designId: "99", imageUrl: "https://example.com/d.png", carType: "medium", twoDoors: "false", leftSide: "false" } } } });
    (fakeDesignRepo.findPurchasedById as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ purchased: true });
    const res = await handleWebhook(makeRequest("{}", "whsec_valid"));
    expect(res.status).toBe(200);
    expect(mockGeneratePDFs).not.toHaveBeenCalled();
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  it("returns 200 for unhandled event types", async () => {
    mockConstructEvent.mockReturnValueOnce({ type: "charge.updated", data: { object: {} } });
    const res = await handleWebhook(makeRequest("{}", "whsec_valid"));
    expect(res.status).toBe(200);
  });
});

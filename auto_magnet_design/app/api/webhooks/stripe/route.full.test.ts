import { describe, it, expect, vi, beforeEach } from "vitest";
import { createWebhookService } from "@/lib/services/webhookService";
import { NextRequest } from "next/server";
import type { IOrderRepo, IDesignRepo } from "@/lib/repos/interfaces";

const { mockConstructEvent, mockSendMail, mockGeneratePDFs } = vi.hoisted(() => ({
  mockConstructEvent: vi.fn(), mockSendMail: vi.fn().mockResolvedValue({}), mockGeneratePDFs: vi.fn(),
}));

vi.mock("stripe", () => ({ default: vi.fn(function () { return ({ webhooks: { constructEvent: mockConstructEvent } }); }) }));
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

describe("Webhook Route - Extended", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("upserts order on payment_intent.payment_failed", async () => {
    mockConstructEvent.mockReturnValueOnce({ type: "payment_intent.payment_failed", data: { object: { id: "pi_fail", receipt_email: "u@t.com", amount: 1500, currency: "usd", status: "requires_payment_method" } } });
    const res = await handleWebhook(makeRequest("{}", "whsec_valid"));
    expect(res.status).toBe(200);
    expect(fakeOrderRepo.upsert).toHaveBeenCalledWith(expect.objectContaining({ status: "requires_payment_method" }));
  });

  it("upserts order on payment_intent.canceled", async () => {
    mockConstructEvent.mockReturnValueOnce({ type: "payment_intent.canceled", data: { object: { id: "pi_cancel", receipt_email: null, amount: 1500, currency: "usd", status: "canceled" } } });
    const res = await handleWebhook(makeRequest("{}", "whsec_valid"));
    expect(res.status).toBe(200);
    expect(fakeOrderRepo.upsert).toHaveBeenCalledWith(expect.objectContaining({ status: "canceled", email: undefined }));
  });

  it("skips design processing when no designId in metadata", async () => {
    mockConstructEvent.mockReturnValueOnce({ type: "checkout.session.completed", data: { object: { payment_intent: "pi_noid", customer_details: { email: "b@t.com" }, amount_total: 1500, currency: "usd", metadata: {} } } });
    const res = await handleWebhook(makeRequest("{}", "whsec_valid"));
    expect(res.status).toBe(200);
    expect(fakeDesignRepo.findPurchasedById).not.toHaveBeenCalled();
  });

  it("skips customer email when userEmail is null", async () => {
    mockConstructEvent.mockReturnValueOnce({ type: "checkout.session.completed", data: { object: { payment_intent: "pi_ne", customer_details: null, amount_total: 1500, currency: "usd", metadata: { designId: "50", imageUrl: "https://e.com/d.png", carType: "medium", twoDoors: "false", leftSide: "false" } } } });
    (fakeDesignRepo.findPurchasedById as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ purchased: false });
    mockGeneratePDFs.mockResolvedValueOnce(new Map([["full", Buffer.from("pdf")]]));
    const res = await handleWebhook(makeRequest("{}", "whsec_valid"));
    expect(res.status).toBe(200);
    expect(mockSendMail).toHaveBeenCalledTimes(1);
    expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({ to: process.env.PRINT_SHOP_EMAIL || process.env.GMAIL_USER }));
  });

  it("returns 500 when handler throws", async () => {
    mockConstructEvent.mockReturnValueOnce({ type: "payment_intent.succeeded", data: { object: { id: "pi_err", receipt_email: null, amount: 0, currency: "usd", status: "succeeded" } } });
    (fakeOrderRepo.upsert as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("DB down"));
    const res = await handleWebhook(makeRequest("{}", "whsec_valid"));
    expect(res.status).toBe(500);
  });
});

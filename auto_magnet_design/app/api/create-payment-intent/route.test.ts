import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";

const { mockCreate } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
}));

vi.mock("stripe", () => ({
  default: vi.fn(() => ({
    paymentIntents: { create: mockCreate },
  })),
}));

describe("POST /api/create-payment-intent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a payment intent for CA$25.00 and returns clientSecret", async () => {
    mockCreate.mockResolvedValueOnce({
      client_secret: "pi_secret_abc123",
    });

    const res = await POST();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.clientSecret).toBe("pi_secret_abc123");
    expect(mockCreate).toHaveBeenCalledWith({
      amount: 2500,
      currency: "cad",
      automatic_payment_methods: { enabled: true },
    });
  });

  it("returns 500 when Stripe throws", async () => {
    mockCreate.mockRejectedValueOnce(new Error("Stripe unavailable"));

    const res = await POST();
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe("Stripe unavailable");
  });
});

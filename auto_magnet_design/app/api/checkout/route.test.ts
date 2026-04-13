import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";

const { mockCreate } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
}));

vi.mock("stripe", () => ({
  default: vi.fn(() => ({
    checkout: {
      sessions: { create: mockCreate },
    },
  })),
}));

// Mock next/headers
vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue({
    get: (key: string) => {
      if (key === "host") return "localhost:3000";
      return null;
    },
  }),
}));

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost:3000/api/checkout", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the Stripe checkout URL on success", async () => {
    mockCreate.mockResolvedValueOnce({
      url: "https://checkout.stripe.com/session_abc",
    });

    const req = makeRequest({
      designId: 10,
      imageUrl: "https://storage.example.com/design.png",
      carType: "medium",
      twoDoors: true,
      leftSide: false,
      userEmail: "user@example.com",
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.url).toBe("https://checkout.stripe.com/session_abc");
  });

  it("passes design metadata to Stripe session", async () => {
    mockCreate.mockResolvedValueOnce({ url: "https://checkout.stripe.com/x" });

    const req = makeRequest({
      designId: 42,
      imageUrl: "https://example.com/img.png",
      carType: "suv",
      twoDoors: false,
      leftSide: true,
      userEmail: "buyer@test.com",
    });

    await POST(req);

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        customer_email: "buyer@test.com",
        metadata: {
          designId: "42",
          imageUrl: "https://example.com/img.png",
          carType: "suv",
          twoDoors: "false",
          leftSide: "true",
        },
      })
    );
  });

  it("defaults carType to medium when not provided", async () => {
    mockCreate.mockResolvedValueOnce({ url: "https://checkout.stripe.com/x" });

    const req = makeRequest({
      designId: 1,
      imageUrl: "https://example.com/img.png",
      twoDoors: false,
      leftSide: false,
      userEmail: "u@test.com",
    });

    await POST(req);

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({ carType: "medium" }),
      })
    );
  });

  it("returns 500 when Stripe throws an error", async () => {
    mockCreate.mockRejectedValueOnce(new Error("Stripe API down"));

    const req = makeRequest({
      designId: 1,
      imageUrl: "https://example.com/img.png",
      carType: "medium",
      twoDoors: false,
      leftSide: false,
      userEmail: "u@test.com",
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe("Stripe API down");
  });
});

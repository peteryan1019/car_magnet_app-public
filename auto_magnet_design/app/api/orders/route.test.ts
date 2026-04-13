import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";

const { mockSql } = vi.hoisted(() => ({
  mockSql: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  sql: (...args: unknown[]) => mockSql(...args),
}));

describe("GET /api/orders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns orders on success", async () => {
    const fakeOrders = [
      { id: 1, stripe_payment_id: "pi_1", email: "a@test.com", amount: 1500, currency: "usd", status: "completed" },
      { id: 2, stripe_payment_id: "pi_2", email: "b@test.com", amount: 1500, currency: "usd", status: "completed" },
    ];
    mockSql.mockResolvedValueOnce(fakeOrders);

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.orders).toEqual(fakeOrders);
  });

  it("returns 500 when database query fails", async () => {
    mockSql.mockRejectedValueOnce(new Error("Connection refused"));

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe("Failed to fetch orders");
  });
});

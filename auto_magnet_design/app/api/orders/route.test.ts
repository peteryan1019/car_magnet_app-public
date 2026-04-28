import { describe, it, expect, vi, beforeEach } from "vitest";
import { createOrdersService } from "@/lib/services/ordersService";
import type { IOrderRepo } from "@/lib/repos/interfaces";

const fakeOrderRepo: IOrderRepo = { upsert: vi.fn(), findAll: vi.fn(), findByStripePaymentId: vi.fn() };
const { listOrders } = createOrdersService({ orderRepo: fakeOrderRepo });

describe("GET /api/orders", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("returns orders on success", async () => {
    const fakeOrders = [
      { id: 1, stripe_payment_id: "pi_1", email: "a@test.com", amount: 1500, currency: "usd", status: "completed" },
      { id: 2, stripe_payment_id: "pi_2", email: "b@test.com", amount: 1500, currency: "usd", status: "completed" },
    ];
    (fakeOrderRepo.findAll as ReturnType<typeof vi.fn>).mockResolvedValueOnce(fakeOrders);
    const res = await listOrders();
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.orders).toEqual(fakeOrders);
  });

  it("returns 500 when database query fails", async () => {
    (fakeOrderRepo.findAll as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("Connection refused"));
    const res = await listOrders();
    const json = await res.json();
    expect(res.status).toBe(500);
    expect(json.error).toBe("Failed to fetch orders");
  });
});

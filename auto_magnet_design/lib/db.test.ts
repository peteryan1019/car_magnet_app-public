import { describe, it, expect, vi, beforeEach } from "vitest";

// vi.hoisted runs before vi.mock hoisting and module imports
const { mockSql } = vi.hoisted(() => {
  process.env.DATABASE_URL = "postgresql://test:test@localhost/test";
  return { mockSql: vi.fn() };
});

vi.mock("@neondatabase/serverless", () => ({
  neon: () => mockSql,
}));

import { upsertOrder, getOrders, getOrderByStripeId } from "./db";

describe("Database Utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("upsertOrder", () => {
    it("calls sql with order data and returns the result", async () => {
      const fakeOrder = {
        id: 1,
        stripe_payment_id: "pi_123",
        email: "user@example.com",
        amount: 1500,
        currency: "usd",
        status: "completed",
        created_at: "2026-01-01",
      };
      mockSql.mockResolvedValueOnce([fakeOrder]);

      const result = await upsertOrder({
        stripe_payment_id: "pi_123",
        email: "user@example.com",
        amount: 1500,
        currency: "usd",
        status: "completed",
      });

      expect(result).toEqual([fakeOrder]);
      expect(mockSql).toHaveBeenCalledTimes(1);
    });

    it("handles upsert without email", async () => {
      mockSql.mockResolvedValueOnce([
        { id: 2, stripe_payment_id: "pi_456", amount: 2000, currency: "usd", status: "succeeded" },
      ]);

      const result = await upsertOrder({
        stripe_payment_id: "pi_456",
        amount: 2000,
        currency: "usd",
        status: "succeeded",
      });

      expect(result).toHaveLength(1);
      expect(result[0].stripe_payment_id).toBe("pi_456");
    });
  });

  describe("getOrders", () => {
    it("returns all orders sorted by created_at DESC", async () => {
      const orders = [
        { id: 2, stripe_payment_id: "pi_2", amount: 2000, currency: "usd", status: "completed", created_at: "2026-01-02" },
        { id: 1, stripe_payment_id: "pi_1", amount: 1500, currency: "usd", status: "completed", created_at: "2026-01-01" },
      ];
      mockSql.mockResolvedValueOnce(orders);

      const result = await getOrders();
      expect(result).toEqual(orders);
      expect(result).toHaveLength(2);
    });

    it("returns empty array when no orders exist", async () => {
      mockSql.mockResolvedValueOnce([]);

      const result = await getOrders();
      expect(result).toEqual([]);
    });
  });

  describe("getOrderByStripeId", () => {
    it("returns the matching order", async () => {
      const order = {
        id: 1,
        stripe_payment_id: "pi_abc",
        email: "user@test.com",
        amount: 1500,
        currency: "usd",
        status: "completed",
        created_at: "2026-01-01",
      };
      mockSql.mockResolvedValueOnce([order]);

      const result = await getOrderByStripeId("pi_abc");
      expect(result).toEqual(order);
    });

    it("returns null when no order matches", async () => {
      mockSql.mockResolvedValueOnce([]);

      const result = await getOrderByStripeId("pi_nonexistent");
      expect(result).toBeNull();
    });
  });
});

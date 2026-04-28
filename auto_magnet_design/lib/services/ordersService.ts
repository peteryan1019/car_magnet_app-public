import type { IOrderRepo } from "@/lib/repos/interfaces";
import { NextResponse } from "next/server";

export function createOrdersService(deps: { orderRepo: IOrderRepo }) {
  const { orderRepo } = deps;

  async function listOrders() {
    try {
      const orders = await orderRepo.findAll();
      return NextResponse.json({ orders });
    } catch (err) {
      console.error("Error fetching orders:", err);
      return NextResponse.json(
        { error: "Failed to fetch orders" },
        { status: 500 }
      );
    }
  }

  return { listOrders };
}

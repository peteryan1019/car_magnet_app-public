import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const orders = await sql`
      SELECT id, stripe_payment_id, email, amount, currency, status, created_at
      FROM orders
      ORDER BY created_at DESC
    `;
    return NextResponse.json({ orders });
  } catch (err) {
    console.error("Error fetching orders:", err);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

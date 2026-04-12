import { neon } from "@neondatabase/serverless";

// Ensure environment variable is set
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined in environment variables");
}

// Export sql query function
export const sql = neon(process.env.DATABASE_URL);

// ------------------------
// Orders Table Interface
// ------------------------
export interface Order {
  id: number;
  stripe_payment_id: string;
  email?: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
}

// ------------------------
// Orders Table Functions
// ------------------------

/**
 * Insert a new order, or update it if one with the same stripe_payment_id already exists.
 */
export async function upsertOrder(order: {
  stripe_payment_id: string;
  email?: string;
  amount: number;
  currency: string;
  status: string;
}): Promise<Order[]> {
  const result = await sql`
    INSERT INTO orders (stripe_payment_id, email, amount, currency, status, created_at)
    VALUES (
      ${order.stripe_payment_id},
      ${order.email},
      ${order.amount},
      ${order.currency},
      ${order.status},
      NOW()
    )
    ON CONFLICT (stripe_payment_id) DO UPDATE SET
      email = COALESCE(EXCLUDED.email, orders.email),
      amount = EXCLUDED.amount,
      currency = EXCLUDED.currency,
      status = EXCLUDED.status
    RETURNING *;
  `;
  return result as Order[];
}

/**
 * Get all orders
 */
export async function getOrders(): Promise<Order[]> {
  const result = await sql`
    SELECT id, stripe_payment_id, email, amount, currency, status, created_at
    FROM orders
    ORDER BY created_at DESC;
  `;
  return result as Order[];
}

/**
 * Get single order by Stripe Payment ID
 */
export async function getOrderByStripeId(stripe_payment_id: string): Promise<Order | null> {
  const [order] = await sql`
    SELECT id, stripe_payment_id, email, amount, currency, status, created_at
    FROM orders
    WHERE stripe_payment_id = ${stripe_payment_id};
  `;
  return (order as Order) || null;
}

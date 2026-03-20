import { neon } from "@neondatabase/serverless";

// Ensure environment variable is set
if (!process.env.NEON_DB_URL) {
  throw new Error("NEON_DB_URL is not defined in environment variables");
}

// Export sql query function
export const sql = neon(process.env.NEON_DB_URL);

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
 * Insert a new order
 */
export async function insertOrder(order: {
  stripe_payment_id: string;
  email?: string;
  amount: number;
  currency: string;
  status: string;
}) {
  return await sql<Order>`
    INSERT INTO orders (stripe_payment_id, email, amount, currency, status, created_at)
    VALUES (
      ${order.stripe_payment_id},
      ${order.email},
      ${order.amount},
      ${order.currency},
      ${order.status},
      NOW()
    )
    ON CONFLICT (stripe_payment_id) DO NOTHING
    RETURNING *;
  `;
}

/**
 * Get all orders
 */
export async function getOrders(): Promise<Order[]> {
  return await sql<Order>`
    SELECT id, stripe_payment_id, email, amount, currency, status, created_at
    FROM orders
    ORDER BY created_at DESC;
  `;
}

/**
 * Get single order by Stripe Payment ID
 */
export async function getOrderByStripeId(stripe_payment_id: string): Promise<Order | null> {
  const [order] = await sql<Order>`
    SELECT id, stripe_payment_id, email, amount, currency, status, created_at
    FROM orders
    WHERE stripe_payment_id = ${stripe_payment_id};
  `;
  return order || null;
}

import { orders } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import type { IOrderRepo } from "./interfaces";
import type { db as dbInstance } from "@/db";

type Db = typeof dbInstance;

export function createOrderRepo(db: Db): IOrderRepo {
  return {
    async upsert(order) {
      const result = await db
        .insert(orders)
        .values({
          stripe_payment_id: order.stripe_payment_id,
          email: order.email ?? null,
          amount: order.amount,
          currency: order.currency,
          status: order.status,
        })
        .onConflictDoUpdate({
          target: orders.stripe_payment_id,
          set: {
            email: sql`COALESCE(EXCLUDED.email, ${orders.email})`,
            amount: order.amount,
            currency: order.currency,
            status: order.status,
          },
        })
        .returning();
      return result;
    },

    async findAll() {
      return db
        .select()
        .from(orders)
        .orderBy(desc(orders.created_at));
    },

    async findByStripePaymentId(stripePaymentId) {
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.stripe_payment_id, stripePaymentId));
      return order ?? null;
    },
  };
}

import Stripe from "stripe";
import { sql } from "@/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
});

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("Webhook signature verification failed.", errorMsg);
    return new Response(`Webhook Error: ${errorMsg}`, { status: 400 });
  }

  // Handle the event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    try {
      await sql`
        INSERT INTO orders (
          stripe_payment_id,
          email,
          amount,
          currency,
          status,
          created_at
        ) VALUES (
          ${session.id},
          ${session.customer_details?.email},
          ${session.amount_total},
          ${session.currency},
          ${session.payment_status},
          NOW()
        )
        ON CONFLICT (stripe_payment_id) DO NOTHING
      `;
      console.log("Order saved:", session.id);
    } catch (dbErr) {
      console.error("Error saving order to Neon:", dbErr);
    }
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
}

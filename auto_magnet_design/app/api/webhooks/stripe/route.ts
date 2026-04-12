import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { upsertOrder } from "@/lib/db";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
});

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new NextResponse("Missing Stripe signature", { status: 400 });
  }

  let event: Stripe.Event;

  // Verify webhook signature
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("❌ Webhook signature verification failed:", message);
    return new NextResponse(`Webhook Error: ${message}`, { status: 400 });
  }

  try {
    // ------------------------
    // Handle Events
    // ------------------------

    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;

        await upsertOrder({
          stripe_payment_id: pi.id,
          email: pi.receipt_email ?? undefined,
          amount: pi.amount,
          currency: pi.currency,
          status: pi.status,
        });

        break;
      }

      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;

        await upsertOrder({
          stripe_payment_id: pi.id,
          email: pi.receipt_email ?? undefined,
          amount: pi.amount,
          currency: pi.currency,
          status: pi.status,
        });

        break;
      }

      case "payment_intent.canceled": {
        const pi = event.data.object as Stripe.PaymentIntent;

        await upsertOrder({
          stripe_payment_id: pi.id,
          email: pi.receipt_email ?? undefined,
          amount: pi.amount,
          currency: pi.currency,
          status: pi.status,
        });

        break;
      }

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        await upsertOrder({
          stripe_payment_id: session.payment_intent as string,
          email: session.customer_details?.email ?? undefined,
          amount: session.amount_total ?? 0,
          currency: session.currency ?? "usd",
          status: "completed",
        });

        break;
      }

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("❌ Webhook handler error:", err);
    return new NextResponse("Webhook handler failed", { status: 500 });
  }
}
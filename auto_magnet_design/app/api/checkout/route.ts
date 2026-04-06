import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover"
});

export async function POST() {
  try {
    // Create a Stripe-hosted checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",                    // One-time payment
      payment_method_types: ["card"],     // Accept cards
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: "Test Product" },
            unit_amount: 1500,            
          },
          quantity: 1,
        },
      ],
      success_url: "http://localhost:3000/payment/success",
      cancel_url: "http://localhost:3000/payment/cancel",
    });

    // Return JSON containing the hosted Stripe checkout URL
    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    console.error("Stripe error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

//checkout/route.ts
import Stripe from "stripe";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2022-11-15",
});

export async function POST() {
  try {
    const headersList = await headers();

    const forwardedProto = headersList.get("x-forwarded-proto");
    const forwardedHost = headersList.get("x-forwarded-host");

    const host = headersList.get("host");

    const protocol =
      forwardedProto ?? (host?.includes("localhost") ? "http" : "https");

    const finalHost = forwardedHost ?? host;

    if (!finalHost) {
      throw new Error("Unable to determine host");
    }

    const baseUrl = `${protocol}://${finalHost}`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
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

      success_url: `${baseUrl}/payment/success`,
      cancel_url: `${baseUrl}/payment/cancel`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
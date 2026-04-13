//checkout/route.ts
import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { designId, imageUrl, carType, twoDoors, leftSide, userEmail } = body;

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
      customer_email: userEmail,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: "Car Magnet Print" },
            unit_amount: 1500,
          },
          quantity: 1,
        },
      ],
      metadata: {
        designId: String(designId),
        imageUrl,
        carType: carType || "medium",
        twoDoors: String(twoDoors),
        leftSide: String(leftSide),
      },
      success_url: `${baseUrl}/payment/success?design_id=${designId}`,
      cancel_url: `${baseUrl}/payment/cancel`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Stripe error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
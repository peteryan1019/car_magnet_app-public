import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import type { IOrderRepo, IDesignRepo } from "@/lib/repos/interfaces";
import { generateDesignPDFs } from "@/lib/pdf";
import transporter from "@/lib/mailer";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
});

export function createWebhookService(deps: {
  orderRepo: IOrderRepo;
  designRepo: IDesignRepo;
}) {
  const { orderRepo, designRepo } = deps;

  async function handleWebhook(req: NextRequest) {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return new NextResponse("Missing Stripe signature", { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("Webhook signature verification failed:", message);
      return new NextResponse(`Webhook Error: ${message}`, { status: 400 });
    }

    try {
      switch (event.type) {
        case "payment_intent.succeeded": {
          const pi = event.data.object as Stripe.PaymentIntent;
          await orderRepo.upsert({
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
          await orderRepo.upsert({
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
          await orderRepo.upsert({
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
          const userEmail = session.customer_details?.email;

          await orderRepo.upsert({
            stripe_payment_id: session.payment_intent as string,
            email: userEmail ?? undefined,
            amount: session.amount_total ?? 0,
            currency: session.currency ?? "usd",
            status: "completed",
          });
          console.log(
            `[Webhook] Order upserted: payment_id=${session.payment_intent}, email=${userEmail}, amount=${session.amount_total}`
          );

          const meta = session.metadata;
          if (meta?.designId) {
            const designId = Number(meta.designId);

            const design = await designRepo.findPurchasedById(designId);

            if (design && !design.purchased) {
              await designRepo.markPurchased(designId);
              console.log(
                `[Webhook] Design marked as purchased: designId=${designId}, imageUrl=${meta.imageUrl}`
              );

              const pdfBuffers = await generateDesignPDFs({
                imageUrl: meta.imageUrl,
                carType: meta.carType || "medium",
                twoDoors: meta.twoDoors === "true",
                leftSide: meta.leftSide === "true",
              });

              const attachments = Array.from(pdfBuffers.entries()).map(
                ([name, buffer]) => ({
                  filename: `${name}-design.pdf`,
                  content: buffer,
                  contentType: "application/pdf",
                })
              );

              if (userEmail) {
                await transporter.sendMail({
                  from: process.env.GMAIL_USER,
                  to: userEmail,
                  subject: "Your Car Magnet Order Confirmation",
                  html: `
                    <h2>Thank you for your order!</h2>
                    <p>Your print-ready design PDFs are attached to this email.</p>
                    <p>Your magnets will be printed and shipped to you within <strong>7 business days</strong>.</p>
                    <p>Thanks for choosing AutoMagnet!</p>
                  `,
                  attachments,
                });
                console.log(
                  `[Webhook] Confirmation email sent to customer: to=${userEmail}, designId=${designId}, pdfs=${Array.from(pdfBuffers.keys()).join(", ")}`
                );
              }

              await transporter.sendMail({
                from: process.env.GMAIL_USER,
                to: process.env.PRINT_SHOP_EMAIL || process.env.GMAIL_USER,
                subject: `New Magnet Order - Design #${designId}`,
                html: `
                  <h2>New Order Received</h2>
                  <p><strong>Customer:</strong> ${userEmail || "Unknown"}</p>
                  <p><strong>Design ID:</strong> ${designId}</p>
                  <p><strong>Order Amount:</strong> $${((session.amount_total ?? 0) / 100).toFixed(2)} ${session.currency?.toUpperCase()}</p>
                  <p>Print-ready PDFs are attached.</p>
                `,
                attachments,
              });
              console.log(
                `[Webhook] Order email sent to print shop: designId=${designId}, customer=${userEmail}, amount=$${((session.amount_total ?? 0) / 100).toFixed(2)}`
              );
            }
          }

          break;
        }

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      return NextResponse.json({ received: true });
    } catch (err) {
      console.error("Webhook handler error:", err);
      return new NextResponse("Webhook handler failed", { status: 500 });
    }
  }

  return { handleWebhook };
}

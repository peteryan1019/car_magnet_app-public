"use client";

import Link from "next/link";

export default function PaymentPage() {
  const stripeLink = "https://buy.stripe.com/test_3cI00jdy40Vic5v1fV9fW00";

  return (
    <main className="min-h-screen grid place-items-center p-6 bg-slate-900 text-white font-sans">
      <div className="w-full max-w-md bg-slate-800/70 backdrop-blur-md border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">

        <div className="p-8 text-center space-y-6">
          <h1 className="text-3xl font-bold tracking-tight">
            Complete Your Payment
          </h1>

          <p className="text-slate-300 text-sm">
            You will be redirected to Stripe’s secure checkout
          </p>

          {/* Payment Button */}
          <a
            href={stripeLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block w-full px-8 py-4 text-lg font-bold text-white bg-blue-600 rounded-full hover:bg-blue-500 hover:scale-105 transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)]"
          >
            Pay $15
          </a>
        </div>

        <div className="px-8 py-4 border-t border-slate-700 text-center">
          <p className="text-sm text-slate-400">
            Already completed your payment?{" "}
            <Link
              href="/payment/success"
              className="font-medium text-blue-400 hover:text-blue-300 transition-colors"
            >
              Confirm here
            </Link>
          </p>
        </div>

      </div>
    </main>
  );
}
"use client"; // <--- Add this

import Link from "next/link";

export default function PaymentPage() {
  // Replace this with your Stripe Payment Link
  const stripeLink = "https://buy.stripe.com/test_3cI00jdy40Vic5v1fV9fW00";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-cyan-100 p-4">
      <div className="w-full max-w-md bg-white/80 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-blue-900 tracking-tight">
              Complete Your Payment
            </h1>
            <p className="text-sm text-gray-500 mt-2">
              You will be redirected to Stripe’s secure checkout
            </p>
          </div>

          {/* Payment Button */}
          <div className="space-y-6">
            <a
              href={stripeLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none transition-colors"
            >
              Pay $20
            </a>
          </div>
        </div>

        <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-600">
            Already completed your payment?{" "}
            <Link
              href="/payment/success"
              className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
            >
              Confirm here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
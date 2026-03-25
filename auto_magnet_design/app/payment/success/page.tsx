"use client";

import Link from "next/link";

export default function PaymentSuccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-cyan-100 p-4">
      <div className="w-full max-w-md bg-white/80 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-8 text-center">
          <h1 className="text-3xl font-bold text-green-700 tracking-tight mb-4">
            ✅ Payment Successful
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            Thank you for your order! Your payment has been processed successfully.
          </p>

          <Link
            href="/mydesigns"
            className="inline-block w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none transition-colors"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
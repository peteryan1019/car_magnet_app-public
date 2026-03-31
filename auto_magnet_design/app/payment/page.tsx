"use client";

import { useState } from "react";

export default function PaymentPage() {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      const data = await res.json();

      if (data.url) {
        window.location.href = data.url; // Redirect user to Stripe Checkout
      } else {
        alert("Failed to start checkout.");
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      alert("Payment failed, please try again.");
      setLoading(false);
    }
  };

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
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="inline-block w-full px-8 py-4 text-lg font-bold text-white bg-blue-600 rounded-full hover:bg-blue-500 hover:scale-105 transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)]"
          >
            {loading ? "Redirecting..." : "Pay $15"}
          </button>
        </div>

        <div className="px-8 py-4 border-t border-slate-700 text-center">
          <p className="text-sm text-slate-400">
            Already completed your payment?{" "}
            <a
              href="/payment/success"
              className="font-medium text-blue-400 hover:text-blue-300 transition-colors"
            >
              Confirm here
            </a>
          </p>
        </div>

      </div>
    </main>
  );
}
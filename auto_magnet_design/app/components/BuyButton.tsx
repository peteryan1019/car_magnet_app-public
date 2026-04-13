"use client";

import { useState } from "react";
import { getUserEmail } from "../actions/design-actions";

export default function BuyButton({
  designId,
  imageUrl,
  twoDoors,
}: {
  designId: number;
  imageUrl: string;
  twoDoors: boolean;
}) {
  const [loading, setLoading] = useState(false);

  const handleBuy = async () => {
    setLoading(true);

    const carType = localStorage.getItem("car_type") || "medium";
    const leftSide = localStorage.getItem("left_side") === "true";
    const userEmail = await getUserEmail();

    if (!userEmail) {
      alert("Please log in to purchase.");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        designId,
        imageUrl,
        carType,
        twoDoors,
        leftSide,
        userEmail,
      }),
    });

    const data = await res.json();

    if (data.url) {
      window.location.href = data.url;
    } else {
      alert("Failed to start checkout. Please try again.");
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleBuy}
      disabled={loading}
      className="px-3 py-1.5 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 transition disabled:opacity-50"
    >
      {loading ? "Loading..." : "Buy & Print"}
    </button>
  );
}

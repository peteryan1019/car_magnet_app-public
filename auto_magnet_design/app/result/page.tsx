"use client";

import { useEffect, useState } from "react";

export default function ResultPage() {

  const [image, setImage] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("finishedDesign");
    if (stored) setImage(stored);
  }, []);

  if (!image) return <div>Loading...</div>;

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "#111"
      }}
    >
      <img
        src={image}
        style={{
          maxWidth: "90%",
          maxHeight: "90%",
          borderRadius: "10px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
        }}
      />
    </div>
  );
}
"use client";

import { useRef, useEffect, useState } from "react";


export default function DesignEditor() {
  //retrieve image URL from localStorage
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    setImageUrl(localStorage.getItem("imageToEdit") || "/sample.png");
    console.log("imageToEdit:", localStorage.getItem("imageToEdit"));
  }, []);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    iframe.onload = () => {
      const win = iframe.contentWindow;
      const doc = win?.document;
      if (!doc) return;

      const style = doc.createElement("style");
      style.innerHTML = `
        #main_menu {
          display: none !important;
        }

        #main_container {
          top: 0 !important;
        }
      `;
      doc.head.appendChild(style);

      const removeLogo = () => {
        const logo =
          doc.querySelector("#logo") ||
          doc.querySelector(".logo") ||
          doc.querySelector('[class*="logo"]');
        if (logo) logo.remove();
      };

      removeLogo();
      const interval = setInterval(removeLogo, 500);
      setTimeout(() => clearInterval(interval), 5000);

      if (win) {
        win.onbeforeunload = null;
      }
    };
  }, []);

  const exportImage = async () => {

    const iframe = iframeRef.current;
    if (!iframe) return;

    const doc = iframe.contentWindow?.document;
    const canvas = doc?.querySelector("#canvas_minipaint") as HTMLCanvasElement | null;
    if (!canvas) return;

    try {
      const image = canvas.toDataURL("image/jpeg", 0.95);
      const isTwoDoor = localStorage.getItem("two_door") === "true";
      
      const response = await fetch("/api/saveImage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: image, two_doors: isTwoDoor })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to upload image");
      }

      localStorage.setItem("designImage", data.url);
      window.location.href = "/preview";
    } catch (err) {
      console.error(err);
      alert("Failed to upload the image to GCS");
    }
  };

  const editWithAI = () => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const doc = iframe.contentWindow?.document;
    const canvas = doc?.querySelector("#canvas_minipaint") as HTMLCanvasElement | null;
    if (!canvas) return;

    const image = canvas.toDataURL("image/jpeg", 0.95);
    localStorage.setItem("designImage", image);
    window.location.href = "/partial";
  };

  return (
    <div className="relative w-full h-screen bg-slate-900">

      {/* Finalize Design Button */}
      <button
        onClick={exportImage}
        className="fixed top-6 right-6 z-50 px-8 py-4 text-lg font-bold text-white bg-blue-600 rounded-full hover:bg-blue-500 hover:scale-105 transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)]"
      >
        Finalize Design
      </button>

      {/* Edit with AI Button */}
      <button
        onClick={editWithAI}
        className="fixed bottom-6 right-210 z-50 px-8 py-4 text-lg font-bold text-white bg-blue-600 rounded-full hover:bg-blue-600 hover:scale-105 transition-all shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:shadow-[0_0_30px_rgba(34,197,94,0.6)]"
      >
        Edit with AI
      </button>

      {imageUrl && (
        <iframe
          ref={iframeRef}
          src={`/minipaint/index.html?image=${imageUrl}`}
          className="w-full h-full border-none"
        />
      )}
    </div>
  );
}
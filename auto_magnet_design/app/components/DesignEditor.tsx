"use client";

import { useRef, useEffect, useState } from "react";

export default function DesignEditor() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [imageSrc, setImageSrc] = useState("/sample.png");

 
  useEffect(() => {
    const stored = localStorage.getItem("editorImage");

    if (!stored) {
      setImageSrc("/sample.png");
      return;
    }

    const img = new Image();

    img.onload = () => {
      setImageSrc(stored);
    };

    img.onerror = () => {
      console.warn("Image failed to load, using fallback");
      setImageSrc("/sample.png");
    };

    img.src = stored;
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
      setTimeout(removeLogo, 300);
      setTimeout(removeLogo, 1000);

      const observer = new MutationObserver(() => removeLogo());
      observer.observe(doc.body, { childList: true, subtree: true });

      if (win) {
        win.onbeforeunload = null;
      }
    };
  }, [imageSrc]);

  const exportImage = () => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const doc = iframe.contentWindow?.document;

    const canvas = doc?.querySelector(
      "#canvas_minipaint"
    ) as HTMLCanvasElement | null;

    if (!canvas) return;

    const image = canvas.toDataURL("image/jpeg", 0.95);

    localStorage.setItem("designImage", image);
    window.location.href = "/preview";
  };

  return (
    <div className="relative w-full h-screen bg-slate-900">
      <button
        onClick={exportImage}
        className="absolute top-6 right-6 z-50 px-8 py-4 text-lg font-bold text-white bg-blue-600 rounded-full hover:bg-blue-500 hover:scale-105 transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)]"
      >
        Finalize Design
      </button>


      <iframe
        ref={iframeRef}
        src={`/minipaint/index.html?image=${encodeURIComponent(imageSrc)}`}
        className="w-full h-full border-none"
      />
    </div>
  );
}
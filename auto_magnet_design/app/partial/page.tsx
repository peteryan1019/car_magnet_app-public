"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PartialPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();

  const [currentImage, setCurrentImage] = useState<string>(
    typeof window !== "undefined"
      ? localStorage.getItem("designImage") || "/sample.png"
      : "/sample.png"
  );

  const [isDrawing, setIsDrawing] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  // Load image onto canvas
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = currentImage;

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
  }, [currentImage]);

  // Drawing mask logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let drawing = false;

    const start = (e: MouseEvent) => {
      if (!isDrawing) return;
      drawing = true;
      const rect = canvas.getBoundingClientRect();
      const offsetX = ((e.clientX - rect.left) / rect.width) * canvas.width;
      const offsetY = ((e.clientY - rect.top) / rect.height) * canvas.height;
      ctx.beginPath();
      ctx.moveTo(offsetX, offsetY);
    };

    const draw = (e: MouseEvent) => {
      if (!drawing || !isDrawing) return;
      const rect = canvas.getBoundingClientRect();
      const offsetX = ((e.clientX - rect.left) / rect.width) * canvas.width;
      const offsetY = ((e.clientY - rect.top) / rect.height) * canvas.height;
      ctx.lineTo(offsetX, offsetY);
      ctx.strokeStyle = "rgba(255,255,255,1)";
      ctx.lineWidth = 20;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
    };

    const stop = () => {
      drawing = false;
    };

    canvas.addEventListener("mousedown", start);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stop);
    canvas.addEventListener("mouseleave", stop);

    return () => {
      canvas.removeEventListener("mousedown", start);
      canvas.removeEventListener("mousemove", draw);
      canvas.removeEventListener("mouseup", stop);
      canvas.removeEventListener("mouseleave", stop);
    };
  }, [isDrawing]);

  async function getBaseAndMask() {
    const canvas = canvasRef.current!;
    const width = canvas.width;
    const height = canvas.height;

    const baseImg = new Image();
    baseImg.crossOrigin = "anonymous";
    baseImg.src = currentImage;
    await new Promise((res) => (baseImg.onload = res));

    const baseCanvas = document.createElement("canvas");
    baseCanvas.width = width;
    baseCanvas.height = height;
    baseCanvas.getContext("2d")!.drawImage(baseImg, 0, 0, width, height);
    const base = baseCanvas.toDataURL("image/png");

    const maskCanvas = document.createElement("canvas");
    maskCanvas.width = width;
    maskCanvas.height = height;
    const maskCtx = maskCanvas.getContext("2d")!;
    maskCtx.fillStyle = "black";
    maskCtx.fillRect(0, 0, width, height);
    maskCtx.globalCompositeOperation = "source-over";
    maskCtx.drawImage(canvas, 0, 0);
    const mask = maskCanvas.toDataURL("image/png");

    return { base, mask };
  }

  async function handleGenerate() {
    if (!prompt) {
      alert("Please enter a prompt!");
      return;
    }

    setLoading(true);

    try {
      const { base, mask } = await getBaseAndMask();

      const res = await fetch("/api/gemini-partial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, image: base, mask }),
      });

      const json = await res.json();
      if (!json.url) {
        alert("Generation failed");
        return;
      }

      setCurrentImage(json.url);
    } catch (err) {
      console.error(err);
      alert("Generation failed");
    } finally {
      setLoading(false);
    }
  }

  const backToEditor = async () => {
    try {
      const res = await fetch("/api/saveImage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: currentImage }),
      });
      if (!res.ok) throw new Error("Failed to save image");
      router.push("/editor");
    } catch (err) {
      console.error("Could not save image to server:", err);
      alert("Could not save image to server");
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <button
        onClick={backToEditor}
        className="fixed top-6 right-6 z-50 px-6 py-2 bg-blue-600 backdrop-blur-md text-white rounded-full hover:bg-blue-700 shadow-lg transition"
      >
        Back to Editor
      </button>

      <div className="flex-1 flex justify-center items-center">
        <div className="relative">
          <canvas
            ref={canvasRef}
            className={`border ${loading ? "pointer-events-none opacity-70" : ""}`}
          />

          {loading && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-40">
              <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-white text-lg font-medium animate-pulse">
                Generating image...
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Bottom Input Bar */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-full max-w-2xl px-4 z-50">
        <div className="flex items-center gap-3 bg-black/50 backdrop-blur-md border border-gray-700 rounded-full shadow-lg px-4 py-3">
          <button
            onClick={() => setIsDrawing(!isDrawing)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              isDrawing
                ? "bg-blue-600 text-white"
                : "bg-blue-500/30 text-white hover:bg-blue-600"
            }`}
          >
            {isDrawing ? "Drawing..." : "Draw Mask"}
          </button>

          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe what to generate..."
            className="flex-1 outline-none bg-transparent text-white placeholder-gray-400"
          />

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="px-5 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-500 disabled:opacity-50 transition"
          >
            {loading ? "Generating..." : "Generate"}
          </button>
        </div>
      </div>
    </div>
  );
}
"use client";

import { useRef, useState, useEffect } from "react";
import PartialToolbar from "../components/PartialToolbar";
import { useRouter } from "next/navigation";

export default function PartialPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ✅ Load starting image
  const [currentImage, setCurrentImage] = useState<string>(
    typeof window !== "undefined"
      ? localStorage.getItem("designImage") || "/sample.png"
      : "/sample.png"
  );

  const [isDrawing, setIsDrawing] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  // -----------------------------
  // Load base image onto canvas
  // -----------------------------
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

  // -----------------------------
  // Drawing mask
  // -----------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let drawing = false;

    const start = (e: MouseEvent) => {
      if (!isDrawing) return;
      drawing = true;
      ctx.beginPath();
      ctx.moveTo(e.offsetX, e.offsetY);
    };

    const draw = (e: MouseEvent) => {
      if (!drawing || !isDrawing) return;
      ctx.lineTo(e.offsetX, e.offsetY);
      ctx.strokeStyle = "rgba(255,255,255,0.5)";
      ctx.lineWidth = 20;
      ctx.stroke();
    };

    const stop = () => {
      drawing = false;
    };

    canvas.addEventListener("mousedown", start);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stop);

    return () => {
      canvas.removeEventListener("mousedown", start);
      canvas.removeEventListener("mousemove", draw);
      canvas.removeEventListener("mouseup", stop);
    };
  }, [isDrawing]);

  // -----------------------------
  // Extract base + mask
  // -----------------------------
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
    maskCtx.drawImage(canvas, 0, 0);
    const mask = maskCanvas.toDataURL("image/png");

    return { base, mask };
  }

  // -----------------------------
  // Generate
  // -----------------------------
  async function handleGenerate() {
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
      localStorage.setItem("designImage", json.url);
    } catch (err) {
      console.error(err);
      alert("Generation failed");
    } finally {
      setLoading(false);
    }
  }

  // -----------------------------
  // Back to Editor button
  // -----------------------------
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
    <div className="flex h-full relative">
      {/* Top-left Back button */}
      <button
        onClick={backToEditor}
        className="absolute top-4 right-4 z-10 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 shadow-lg"
      >
        Back to Editor
      </button>

      <PartialToolbar
        isDrawing={isDrawing}
        setIsDrawing={setIsDrawing}
        prompt={prompt}
        setPrompt={setPrompt}
        onGenerate={handleGenerate}
        loading={loading}
      />
      <canvas ref={canvasRef} className="border flex-1" />
    </div>
  );
}
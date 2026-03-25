"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, Rect, Circle, Line, Textbox, Image as FabricImage } from "fabric";

export default function ImageEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const history = useRef<string[]>([]);
  const redoStack = useRef<string[]>([]);

  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(10);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new Canvas(canvasRef.current, {
      width: 1000,
      height: 600,
      backgroundColor: "#ffffff",
    });

    fabricRef.current = canvas;

    saveHistory();

    canvas.on("object:added", saveHistory);
    canvas.on("object:modified", saveHistory);
    canvas.on("object:removed", saveHistory);

    return () => canvas.dispose();
  }, []);

  const saveHistory = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    history.current.push(JSON.stringify(canvas));
    redoStack.current = [];
  };

  const undo = () => {
    const canvas = fabricRef.current;
    if (!canvas || history.current.length < 2) return;

    redoStack.current.push(history.current.pop()!);

    const prev = history.current[history.current.length - 1];

    canvas.loadFromJSON(prev, () => {
      canvas.renderAll();
    });
  };

  const redo = () => {
    const canvas = fabricRef.current;
    if (!canvas || redoStack.current.length === 0) return;

    const state = redoStack.current.pop()!;
    history.current.push(state);

    canvas.loadFromJSON(state, () => canvas.renderAll());
  };

  const 
  };

  const addRect = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const rect = new Rect({
      width: 200,
      height: 120,
      fill: "transparent",
      stroke: color,
      strokeWidth: 3,
      left: 100,
      top: 100,
    });

    canvas.add(rect);
  };

  const addCircle = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const circle = new Circle({
      radius: 60,
      fill: "transparent",
      stroke: color,
      strokeWidth: 3,
      left: 100,
      top: 100,
    });

    canvas.add(circle);
  };

  const addLine = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const line = new Line([50, 50, 200, 200], {
      stroke: color,
      strokeWidth: 3,
    });

    canvas.add(line);
  };

  const deleteObject = () => {
    const canvas = fabricRef.current;
    const obj = canvas?.getActiveObject();

    if (canvas && obj) {
      canvas.remove(obj);
    }
  };

  const uploadImage = (e: any) => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      FabricImage.fromURL(reader.result as string).then((img) => {
        img.scaleToWidth(400);
        canvas.add(img);
      });
    };

    reader.readAsDataURL(file);
  };

  const exportJPG = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const data = canvas.toDataURL({
      format: "jpeg",
      quality: 1,
    });

    const link = document.createElement("a");
    link.href = data;
    link.download = "design.jpg";
    link.click();
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          marginBottom: 20,
        }}
      >
        <button onClick={() => fileInputRef.current?.click()}>Upload</button>



        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />

        <input
          type="range"
          min={1}
          max={50}
          value={brushSize}
          onChange={(e) => setBrushSize(Number(e.target.value))}
        />

        <input
          type="file"
          hidden
          ref={fileInputRef}
          accept="image/*"
          onChange={uploadImage}
        />
      </div>

      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 10,
          overflow: "hidden",
          width: 1000,
        }}
      >
        <canvas ref={canvasRef} />
      </div>
    </div>
 
}
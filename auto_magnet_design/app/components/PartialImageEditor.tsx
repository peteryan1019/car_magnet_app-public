"use client";

import { useEffect, useRef, useState, ChangeEvent } from "react";
import { Canvas, Rect, Circle, Line, Image as FabricImage } from "fabric";

export default function ImageEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // History tracking
  const history = useRef<string[]>([]);
  const redoStack = useRef<string[]>([]);
  const isHistoryModifying = useRef<boolean>(false); // Prevents infinite loops during undo/redo

  // Editor states
  const [color, setColor] = useState<string>("#000000");
  const [brushSize, setBrushSize] = useState<number>(10);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);

  // Initialize Canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new Canvas(canvasRef.current, {
      width: 1000,
      height: 600,
      backgroundColor: "#ffffff",
    });

    fabricRef.current = canvas;

    const doSaveHistory = () => {
      const c = fabricRef.current;
      if (!c) return;
      history.current.push(JSON.stringify(c));
      redoStack.current = [];
    };

    // Save initial blank state
    doSaveHistory();

    // Event listeners for history tracking
    canvas.on("object:added", doSaveHistory);
    canvas.on("object:modified", doSaveHistory);
    canvas.on("object:removed", doSaveHistory);
    canvas.on("path:created", doSaveHistory); // Triggers after freehand drawing

    return () => {
      canvas.dispose();
      fabricRef.current = null;
    };
  }, []);

  // Update Brush Settings when color/size/mode changes
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    canvas.isDrawingMode = isDrawing;
    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = color;
      canvas.freeDrawingBrush.width = brushSize;
    }
  }, [color, brushSize, isDrawing]);

  // --- HISTORY LOGIC ---

  const saveHistory = () => {
    // Prevent saving history IF the change is coming from an Undo/Redo action
    if (isHistoryModifying.current) return;
    
    const canvas = fabricRef.current;
    if (!canvas) return;

    // Must use .toJSON() before stringifying in Fabric v6
    history.current.push(JSON.stringify(canvas.toJSON()));
    redoStack.current = []; // Clear redo stack on new action
  };

  const undo = async () => {
    const canvas = fabricRef.current;
    // Don't pop if we only have the initial blank state left
    if (!canvas || history.current.length <= 1) return;

    isHistoryModifying.current = true;

    // Move current state to redo stack
    const currentState = history.current.pop()!;
    redoStack.current.push(currentState);

    // Get the previous state and load it
    const prev = history.current[history.current.length - 1];
    await canvas.loadFromJSON(JSON.parse(prev));
    canvas.renderAll();

    isHistoryModifying.current = false;
  };

  const redo = async () => {
    const canvas = fabricRef.current;
    if (!canvas || redoStack.current.length === 0) return;

    isHistoryModifying.current = true;

    // Move next state from redo stack back to history
    const state = redoStack.current.pop()!;
    history.current.push(state);

    await canvas.loadFromJSON(JSON.parse(state));
    canvas.renderAll();

    isHistoryModifying.current = false;
  };

  // --- SHAPE & OBJECT LOGIC ---

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
      canvas.discardActiveObject(); // Clear selection box
    }
  };

  // --- FILE LOGIC ---

  const uploadImage = (e: ChangeEvent<HTMLInputElement>) => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      FabricImage.fromURL(reader.result as string).then((img) => {
        img.scaleToWidth(400);
        canvas.add(img);
        // Reset input so the same file can be uploaded again if needed
        if (fileInputRef.current) fileInputRef.current.value = ""; 
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
      multiplier: 1,
    });

    const link = document.createElement("a");
    link.href = data;
    link.download = "design.jpg";
    link.click();
  };

  // --- RENDER ---

  return (
    <div>
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          marginBottom: 20,
          padding: 10,
          background: "#f3f4f6",
          borderRadius: 8,
          alignItems: "center"
        }}
      >
        <button onClick={() => fileInputRef.current?.click()}>Upload</button>
        
        <button onClick={undo}>Undo</button>
        <button onClick={redo}>Redo</button>
        
        <button onClick={addRect}>+ Rect</button>
        <button onClick={addCircle}>+ Circle</button>
        <button onClick={addLine}>+ Line</button>
        
        <button onClick={deleteObject} style={{ color: "red" }}>Delete Selected</button>
        
        <button 
          onClick={() => setIsDrawing(!isDrawing)}
          style={{ background: isDrawing ? "#d1d5db" : "" }}
        >
          {isDrawing ? "Stop Drawing" : "Draw Mode"}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <label>Color:</label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <label>Brush Size:</label>
          <input
            type="range"
            min={1}
            max={50}
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
          />
        </div>

        <button onClick={exportJPG} style={{ marginLeft: "auto" }}>Export JPG</button>

        <input
          type="file"
          hidden
          ref={fileInputRef}
          accept="image/*"
          onChange={uploadImage}
        />
      </div>

      {/* Canvas Container */}
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
  ); // <--- Fixed the missing return syntax here
}
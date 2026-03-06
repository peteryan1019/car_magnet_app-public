//visual door cut interface, unused

"use client";

import { useRef, useState } from "react";

type Props = {
  bannerWidth: number;
  bannerHeight: number;
  cutX: number;
  onChange: (x: number) => void;
  maxDisplayWidth?: number;
};

export default function DoorCutSelector({
  bannerWidth,
  bannerHeight,
  cutX,
  onChange,
  maxDisplayWidth = 700,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  if (!bannerWidth || !bannerHeight) {
    return null;
  }

  const scale = Math.min(1, maxDisplayWidth / bannerWidth);

  const displayWidth = bannerWidth * scale;
  const displayHeight = bannerHeight * scale;

  const displayCutX = cutX * scale;

  const updateCut = (clientX: number) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();

    let displayX = clientX - rect.left;
    displayX = Math.max(0, Math.min(displayX, displayWidth));

    const realX = displayX / scale;

    onChange(realX);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    setDragging(true);
    updateCut(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    updateCut(e.clientX);
  };

  const stopDrag = () => setDragging(false);

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: displayWidth,
        height: displayHeight,
        background: "#eee",
        border: "2px solid #444",
        boxSizing: "content-box",
      }}
      onPointerMove={handlePointerMove}
      onPointerUp={stopDrag}
      onPointerLeave={stopDrag}
    >
      {/* Cut line */}
      <div
        onPointerDown={handlePointerDown}
        style={{
          position: "absolute",
          left: displayCutX,
          top: 0,
          width: 2,
          height: "100%",
          background: "red",
          transform: "translateX(-1px)",
          cursor: "ew-resize",
        }}
      />

      {/* Knob */}
      <div
        onPointerDown={handlePointerDown}
        style={{
          position: "absolute",
          left: displayCutX,
          bottom: -12,
          width: 24,
          height: 24,
          background: "white",
          border: "3px solid red",
          borderRadius: "50%",
          transform: "translateX(-50%)",
          cursor: "ew-resize",
          boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
        }}
      />
    </div>
  );
}
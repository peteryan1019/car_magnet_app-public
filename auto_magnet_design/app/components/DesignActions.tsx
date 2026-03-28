"use client";
import React from "react";

interface DesignActionsProps {
  imageUrl?: string;
}

export default function DesignActions({ imageUrl }: DesignActionsProps) {
  const handleEdit = async () => {
    if (!imageUrl) return;

    try {
      // Call the saveImage API to write simple.png to /public
      const res = await fetch("/api/saveImage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl }),
      });

      const data = await res.json();

      if (res.ok && data.message === "Saved successfully") {
        // Redirect to editor
        window.location.href = "/editor";
      } else {
        console.error(data);
        alert("Failed to save image for editing.");
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred while saving the image.");
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={handleEdit}
        className="px-3 py-1 bg-blue-600 hover:bg-green-700 rounded-md text-white text-sm font-medium transition"
      >
        Edit in Editor
      </button>
    </div>
  );
}   
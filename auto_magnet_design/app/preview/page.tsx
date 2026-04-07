"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function PreviewPage() {
  const [image, setImage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem("designImage");
    if (saved) {
      setImage(saved);
    }
  }, []);

  // ✅ FIXED save function
  const saveImage = async (imageUrl: string) => {
    try {
      setIsSaving(true);

      const response = await fetch("/api/saveImage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl,
          two_doors: false, // 👈 change if needed
        }),
      });

      const data = await response.json();
      console.log("SAVE RESPONSE:", data);

      // 🚨 Not logged in
      if (response.status === 401) {
        alert("You must be logged in to save designs.");
        setIsSaving(false);
        return;
      }

      // ❌ Other errors
      if (!response.ok) {
        throw new Error(data.message || "Failed to save image");
      }

      // ✅ Save returned GCS URL for editor
      if (data.url) {
        localStorage.setItem("savedDesignUrl", data.url);
      }

      // ✅ Redirect to editor
      router.push("/editor");

    } catch (error) {
      console.error("Error saving image:", error);

      // Optional fallback: still go to editor
      router.push("/editor");

    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-73px)] grid place-items-center p-6 bg-slate-900 text-white font-sans">
      <section className="text-center max-w-5xl mx-auto space-y-10">

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
          Design{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">
            Preview
          </span>
        </h1>

        {/* Preview Image */}
        <div className="flex justify-center">
          {image ? (
            <img
              src={image}
              alt="Design Preview"
              className="max-h-[500px] rounded-xl shadow-2xl border border-slate-700"
            />
          ) : (
            <p className="text-slate-400">No design found.</p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap justify-center gap-6 pt-6">

          {/* ✅ FIXED Edit Button */}
          <button
            onClick={() => {
              if (!image) {
                alert("No image to save");
                return;
              }
              saveImage(image);
            }}
            disabled={isSaving}
            className={`px-10 py-7 text-lg font-bold bg-slate-700 rounded-full hover:bg-slate-600 transition-all ${
              isSaving ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isSaving ? "Saving..." : "Edit"}
          </button>

          {/* Continue Button */}
          <Link
            href="/payment"
            className="px-10 py-7 text-xl font-bold text-white bg-blue-600 rounded-full hover:bg-blue-500 hover:scale-105 transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)]"
          >
            Confirm & Continue
          </Link>

        </div>

      </section>
    </main>
  );
}
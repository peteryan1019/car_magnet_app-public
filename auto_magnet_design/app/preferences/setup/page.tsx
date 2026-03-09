"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

import { Dimensions } from "../types"

export default function Page() {
  const [carType, setCarType] = useState<string>("");
  const [isTwoDoor, setIsTwoDoor] = useState<"true" | "false" | null>(null);
  const [dimInches, setDimInches] = useState<Dimensions | null>({width: 0, height: 0});
  const [dimPx, setDimPx] = useState<Dimensions | null>(null);
  const [dpi, setDpi] = useState<number>(60);

  const [error, setError] = useState<String | null>(null);
  
  const router = useRouter();

  useEffect(() => {
    if (dimInches) {
      setDimPx({
        width: dimInches.width * dpi,
        height: dimInches.height * dpi,
      });
    }
  }, [dimInches, dpi]);

  const storePreferences = async () => {
    setError(null)
    if (!(isTwoDoor && dimInches && dimPx)) {
      setError("Error: not all options selected.");
      return
    }

    // Store in localstorage for now
    localStorage.setItem("two_door", isTwoDoor);
    localStorage.setItem("dimensions_inches", JSON.stringify(dimInches));
    localStorage.setItem("dimensions_px", JSON.stringify(dimPx));
    router.push("/design");
  }

  return (
    <div className="flex flex-col items-center min-h-[calc(100vh-73px)] gap-6 p-6 md:p-12 bg-slate-900 text-white font-sans">
      <h1 className="text-3xl font-bold text-center tracking-tight mb-4">Set Your Preferences</h1>

      <div className="flex flex-col gap-8 w-full max-w-md bg-slate-800 p-8 rounded-xl shadow-2xl border border-slate-700">
        <div className="flex flex-col gap-2">
          <label className="font-semibold text-slate-300">Select Car Type</label>
          <select
            className="border border-slate-600 bg-slate-700 text-white p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            onChange={(e) => {
            const type = e.target.value;

            let suggested: Dimensions | null = null;

            // Suggested sizes are just estimates
            switch (type) {
              case "small":
                suggested = { width: 40, height: 36 }; 
                break;
              case "medium":
                suggested = { width: 46, height: 40 }; 
                break;
              case "suv":
                suggested = { width: 50, height: 46 };
                break;
              case "minivan":
                suggested = { width: 52, height: 46 };
                break;
              case "large_van":
                suggested = { width: 56, height: 50 };
                break;
              case "truck":
                suggested = { width: 48, height: 40 };
                break;
              case "custom":
                suggested = { width: 0, height: 0 };
                break;
              default:
                suggested = null;
            }

            setDimInches(suggested);
            setCarType(type);

          }}
        >
          <option value="">-- Choose a car or Custom --</option>
          <option value="small">Small Sedan/Hatchback</option>
          <option value="medium">Medium Sedan/Hatchback</option>
          <option value="suv">SUV</option>
          <option value="minivan">Minivan</option>
          <option value="large_van">Large Van</option>
          <option value="truck">Pickup Truck</option>
          <option value="custom">Custom Dimensions</option>
        </select>
      </div>

    {carType === "custom" && (
      <div className="flex flex-col gap-3">
        <label className="font-semibold text-slate-300">Custom Dimensions (inches)</label>

        <div className="flex gap-4">
          <input
            type="number"
            placeholder="Width"
            className="w-full border border-slate-600 bg-slate-700 text-white p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder-slate-400"
            onChange={(e) => {
              const width = Number(e.target.value);
              if (dimInches) {
                const updated = { ...dimInches, width };
                setDimInches(updated);
              }
            }}
          />

          <input
            type="number"
            placeholder="Height"
            className="w-full border border-slate-600 bg-slate-700 text-white p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder-slate-400"
            onChange={(e) => {
              const height = Number(e.target.value);
              if (dimInches) {
                const updated = { ...dimInches, height };
                setDimInches(updated);
              }
            }}
          />
        </div>
      </div>
    )}

      <div className="flex flex-col gap-3">
        <label className="font-semibold text-slate-300">Will the design span two doors?</label>

        <div className="flex gap-4">
          <button
            className={`flex-1 py-3 font-semibold rounded-lg transition-all ${
              isTwoDoor === "true" ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
            onClick={() => setIsTwoDoor("true")}
          >
            Yes
          </button>

          <button
            className={`flex-1 py-3 font-semibold rounded-lg transition-all ${
              isTwoDoor === "false" ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
            onClick={() => setIsTwoDoor("false")}
          >
            No
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="font-semibold text-slate-300">DPI Quality</label>
        <select
          value={dpi}
          className="border border-slate-600 bg-slate-700 text-white p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          onChange={(e) => {
            const newDpi = Number(e.target.value);
            setDpi(newDpi);

            if (dimInches) {
              setDimPx({
                width: dimInches.width * newDpi,
                height: dimInches.height * newDpi,
              });
            }
          }}
        >
          <option value={30}>30 DPI (Low Quality Image)</option>
          <option value={60}>60 DPI (High Quality Image)</option>
          <option value={100}>100 DPI (Excellent Quality Image)</option>
        </select>
      </div>

      {/* Display Dimensions */}
      {dimInches && (
        <div className="bg-slate-700/50 p-4 rounded-lg flex flex-col items-center justify-center border border-slate-600">
          <p className="text-slate-300">
            <span className="font-semibold text-white">Inches:</span> {dimInches.width}" x {dimInches.height}"
          </p>
          {dimPx && (
            <p className="text-slate-300">
              <span className="font-semibold text-white">Pixels:</span> {dimPx.width}px x {dimPx.height}px
            </p>
          )}
        </div>
      )}

      {error && <p className="text-red-400 font-medium text-center">{error}</p>}

      <button
        onClick={storePreferences}
        className="w-full bg-blue-600 text-white font-bold px-6 py-4 rounded-lg hover:bg-blue-500 hover:shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all mt-4"
      >
        Continue to Design
      </button>
      </div>
    </div>
  );
}
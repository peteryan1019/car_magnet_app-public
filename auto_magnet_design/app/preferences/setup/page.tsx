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
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-6">
      <h1 className="text-2xl font-bold">Default user preferences</h1>

      <div className="flex flex-col gap-2 w-80">
        <label className="font-semibold">Select Car Type</label>
        <select
          className="border p-2 rounded"
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
      <div className="flex flex-col gap-3 w-80">
        <label className="font-semibold">Custom Dimensions (inches)</label>

        <input
          type="number"
          placeholder="Width"
          className="border p-2 rounded"
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
          className="border p-2 rounded"
          onChange={(e) => {
            const height = Number(e.target.value);
            if (dimInches) {
              const updated = { ...dimInches, height };
              setDimInches(updated);
            }
          }}
        />
      </div>
    )}

      <div className="flex flex-col gap-2 items-center">
        <span className="font-semibold">Will the design span two doors?</span>

        <div className="flex gap-4">
          <button
            className={`px-4 py-2 rounded ${
              isTwoDoor === "true" ? "bg-blue-500 text-white" : "bg-gray-800"
            }`}
            onClick={() => setIsTwoDoor("true")}
          >
            Yes
          </button>

          <button
            className={`px-4 py-2 rounded ${
              isTwoDoor === "false" ? "bg-blue-500 text-white" : "bg-gray-800"
            }`}
            onClick={() => setIsTwoDoor("false")}
          >
            No
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2 w-80">
        <label className="font-semibold">DPI</label>
        <select
          value={dpi}
          className="border p-2 rounded"
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
        <div className="text-center">
          <p>
            <strong>Inches:</strong> {dimInches.width}" x {dimInches.height}"
          </p>
        </div>
      )}

      {dimPx && (
        <div className="text-center">
          <p>
            <strong>Pixels:</strong> {dimPx.width}px x {dimPx.height}px
          </p>
        </div>
      )}

      {error && <p className="text-red-500">{error}</p>}

      <button
        onClick={storePreferences}
        className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
      >
        Continue to Design
      </button>
    </div>
  );
}
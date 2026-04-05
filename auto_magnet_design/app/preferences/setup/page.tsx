"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

import ModelPreview from "../../components/ModelPreview"
//import DoorCutSelector from "./door-cut"

type Dimensions = {
    width: number,
    height: number
}

export default function Page() {
  const [titleText, setTitleText] = useState<string>("Let's set up your preferences");

  const [carType, setCarType] = useState<string>("");
  const [isTwoDoor, setIsTwoDoor] = useState<"true" | "false" | null>(null);
  const [leftSide, setLeftSide] = useState(false);
  const [dimInches, setDimInches] = useState<Dimensions | null>({width: 0, height: 0});
  const [dimPx, setDimPx] = useState<Dimensions | null>(null);
  const [doorCutPx, setDoorCutPx] = useState<number>(0);
  const [dpi, setDpi] = useState<number>(60);

  const [error, setError] = useState<string | null>(null);
  
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  
  const router = useRouter();

  const handleUpload = async () => {
    if (!logoFile) return;
    setIsUploading(true);
    setError(null);
    try {
      // 1. Get a secure Signed URL from our backend
      const res = await fetch("/api/upload-logo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          fileName: logoFile.name,
          contentType: logoFile.type
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to get upload URL");
      
      // 2. Upload directly to Google Cloud Storage, bypassing our Next.js server!
      const uploadRes = await fetch(data.signedUrl, {
        method: "PUT",
        headers: {
          "Content-Type": logoFile.type || "application/octet-stream"
        },
        body: logoFile,
      });

      if (!uploadRes.ok) throw new Error("Failed to upload file to storage bucket");

      // 3. Save the returned public URL so it displays in your design page
      setLogoUrl(data.publicUrl);
      localStorage.setItem("logo_url", data.publicUrl);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    if (dimInches) {
      setDimPx({
        width: dimInches.width * dpi,
        height: dimInches.height * dpi,
      });
    }
  }, [dimInches, dpi]);

  // TODO: change from localstorage to account

  const storePreferences = async () => {
    setError(null)
    if (!(isTwoDoor && dimInches && dimPx)) {
      setError("Error: not all options selected.");
      return
    }

    localStorage.setItem("car_type", carType);
    localStorage.setItem("two_door", isTwoDoor);
    localStorage.setItem("left_side", leftSide ? "true" : "false");
    localStorage.setItem("dimensions_inches", JSON.stringify(dimInches));
    localStorage.setItem("dimensions_px", JSON.stringify(dimPx));

    router.push("/design");
  }

  const loadPreferences = async () => {
    let t = null;
    t = localStorage.getItem("car_type");
    if (t === null) {
      return false;
    }
    if (t) {setCarType(t);}
    t = localStorage.getItem("two_door");
    if (t === "true" || t === "false") {setIsTwoDoor(t);}
    t = localStorage.getItem("dimensions_inches");
    if (t) {
      t = JSON.parse(t);
      setDimInches({
        width: t.width,
        height: t.height
      });
    }
    t = localStorage.getItem("dimensions_px");
    if (t) {
      t = JSON.parse(t);
      setDimPx({
        width: t.width,
        height: t.height
      });
    }
    setTitleText("Edit your preferences");
    return true;
  }

  // load existing preferences on load
  useEffect(() => {
    loadPreferences();
  }, []);

  return (
    <div className="flex min-h-[calc(100vh-73px)] bg-slate-900">

      {/* Model Preview — 3/4 width */}
      <div className="flex-[3] flex flex-col justify-center p-6">
        <ModelPreview
          imgsrc="/frame.jpg"
          carType={carType || "minivan"}
          isTwoDoor={isTwoDoor == "true"}
          leftSide={leftSide}
        />
      </div>

      {/* Sidebar — 1/4 width */}
      <div className="flex-[1] flex flex-col items-center justify-center gap-5 p-5 border-l border-slate-700 overflow-y-auto min-w-[260px]">
        <h1 className="text-xl font-bold text-center">{titleText}</h1>

        <div className="flex flex-col gap-2 w-full">
          <label className="font-semibold text-sm">Car Type</label>
          <select
            className="border p-2 rounded text-sm"
            value={carType ?? ""}
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
            <option value="truck">Pickup Truck</option>
            <option value="custom">Custom Dimensions</option>
          </select>
        </div>

        {carType === "custom" && (
          <div className="flex flex-col gap-3 w-full">
            <label className="font-semibold text-sm">Custom Dimensions (inches)</label>
            <input
              type="number"
              placeholder="Width"
              value={dimInches?.width ?? 0}
              className="border p-2 rounded text-sm"
              onChange={(e) => {
                const width = Number(e.target.value);
                if (dimInches) {
                  setDimInches({ ...dimInches, width });
                }
              }}
            />
            <input
              type="number"
              placeholder="Height"
              value={dimInches?.height ?? 0}
              className="border p-2 rounded text-sm"
              onChange={(e) => {
                const height = Number(e.target.value);
                if (dimInches) {
                  setDimInches({ ...dimInches, height });
                }
              }}
            />
          </div>
        )}

        <div className="flex flex-col gap-2 items-center w-full">
          <span className="font-semibold text-sm">Spans two doors?</span>
          <div className="flex gap-3">
            <button
              className={`px-4 py-2 rounded text-sm ${
                isTwoDoor === "true" ? "bg-blue-600 text-white" : "bg-gray-800 hover:bg-blue-700"
              }`}
              onClick={() => setIsTwoDoor("true")}
            >
              Yes
            </button>
            <button
              className={`px-4 py-2 rounded text-sm ${
                isTwoDoor === "false" ? "bg-blue-600 text-white" : "bg-gray-800 hover:bg-blue-700"
              }`}
              onClick={() => setIsTwoDoor("false")}
            >
              No
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2 items-center w-full">
          <span className="font-semibold text-sm">What side?</span>
          <div className="flex gap-3">
            <button
              className={`px-4 py-2 rounded text-sm ${
                leftSide ? "bg-blue-600 text-white" : "bg-gray-800 hover:bg-blue-700"
              }`}
              onClick={() => setLeftSide(true)}
            >
              Left
            </button>
            <button
              className={`px-4 py-2 rounded text-sm ${
                !leftSide ? "bg-blue-600 text-white" : "bg-gray-800 hover:bg-blue-700"
              }`}
              onClick={() => setLeftSide(false)}
            >
              Right
            </button>
          </div>
        </div>

      <div className="flex flex-col gap-3">
        <label className="font-semibold text-slate-300">Upload Logo</label>
        <div className="flex items-center gap-3">
          <input
            type="file"
            onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
            className="flex-1 text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
          />
          <button
            onClick={handleUpload}
            disabled={!logoFile || isUploading}
            className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-500 transition-all"
          >
            {isUploading ? "Uploading..." : "Upload"}
          </button>
        </div>
        {logoUrl && (
          <p className="text-green-400 text-sm mt-1">
            Logo uploaded successfully!
          </p>
        )}
      </div>

        { /* Door cut selector removed from features, code kept as backup
          {isTwoDoor === "true" && (
            <div className="w-full">
              <label className="block text-sm mb-2">
                Door cut: {(doorCutPx / dpi)}" from left
              </label>
              <input
                type="range"
                min={0}
                max={dimPx?.width}
                step={dpi}
                value={doorCutPx}
                onChange={(e) => setDoorCutPx(Number(e.target.value))}
                className="w-full"
              />
              <p className="text-xs mt-1 text-slate-400">
                Cut at: <strong>{doorCutPx}px</strong>
              </p>
            </div>
          )}
        */}

        <div className="flex flex-col gap-2 w-full">
          <label className="font-semibold text-sm">DPI</label>
          <select
            value={dpi}
            className="border p-2 rounded text-sm"
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
            <option value={30}>30 DPI (Low)</option>
            <option value={60}>60 DPI (High)</option>
            <option value={100}>100 DPI (Excellent)</option>
          </select>
        </div>

        {dimInches && (
          <div className="text-center text-xs text-slate-400">
            <p>{dimInches.width}" × {dimInches.height}" &nbsp;|&nbsp; {dimPx?.width}px × {dimPx?.height}px</p>
          </div>
        )}

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <button
          onClick={storePreferences}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 w-full text-sm"
        >
          Continue to Design
        </button>
      </div>
    </div>
  );
}

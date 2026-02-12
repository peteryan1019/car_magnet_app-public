"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"

export default function ResultsPage() {
  const [images, setImages] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const effectRan = useRef(false);

  useEffect(() => {

    if(effectRan.current===false){
        const generatedImages = localStorage.getItem("generatedImages")
        const generationError = localStorage.getItem("generationError")

        if (generatedImages) {
        try {
            const imageUrls = JSON.parse(generatedImages)
            console.log("here's the result page's imageUrls: ", imageUrls);
            setImages(imageUrls)
        } catch (e) {
            setError("Failed to parse generated images")
        }
        } else if (generationError) {
        setError(generationError)
        }

        setLoading(false)
        }
        return ()=>{
            effectRan.current = true;
        }
    
  }, [])

  const generateAnother = () => {
    localStorage.removeItem("generatedImages")
    localStorage.removeItem("generationError")
    localStorage.removeItem("bannerText")
    router.push("/design")
  }

  if (loading) {
    return (
      <main className="min-h-dvh grid place-items-center p-6 bg-slate-900 text-white font-sans">
        <section className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/85">Loading results...</p>
        </section>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-dvh grid place-items-center p-6 bg-slate-900 text-white font-sans">
        <section className="text-center max-w-[880px] w-full">
          <h1 className="text-2xl mb-3">Generation Failed</h1>
          <div className="bg-red-100 text-red-800 rounded-lg px-4 py-3 mb-6">{error}</div>
          <button
            onClick={generateAnother}
            className="text-base px-4 py-3 rounded-xl border border-blue-500 bg-gray-800 hover:bg-gray-700 transition-colors"
          >
            Try Again
          </button>
        </section>
      </main>
    )
  }

  if (!images || images.length === 0) {
    return (
      <main className="min-h-dvh grid place-items-center p-6 bg-slate-900 text-white font-sans">
        <section className="text-center max-w-[880px] w-full">
          <h1 className="text-2xl mb-3">No Images Found</h1>
          <p className="text-white/85 mb-6">It looks like there are no generated images to display.</p>
          <button
            onClick={generateAnother}
            className="text-base px-4 py-3 rounded-xl border border-blue-500 bg-gray-800 hover:bg-gray-700 transition-colors"
          >
            Generate Banners
          </button>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-dvh p-6 bg-slate-900 text-white font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl mb-3">Your Generated Banners ({images.length})</h1>
          <button
            onClick={generateAnother}
            className="text-base px-4 py-3 rounded-xl border border-blue-500 bg-gray-800 hover:bg-gray-700 transition-colors"
          >
            Generate Another Set
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {images.map((imageUrl, index) => (
            <div key={index} className="bg-slate-800 rounded-xl overflow-hidden shadow-2xl">
              <img
                src={imageUrl || "/frame1.jpg"}
                alt={`Generated banner ${index + 1}`}
                className="w-full h-auto"
              />
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}

"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

export default function LoadingPage() {
  const router = useRouter()
    const effectRan = useRef(false);
  useEffect(() => {
    if (effectRan.current === false){
 const generateImage = async () => {
      try {
        const bannerText = localStorage.getItem("bannerText")
        if (!bannerText) {
          router.push("/")
          return
        }

        // Get two_door from localStorage, default to true (two-door)
        const twoDoorValue = localStorage.getItem("two_door")
        const two_door = twoDoorValue === null ? true : twoDoorValue === "true"

        const res = await fetch("/api/gemini", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userText: bannerText, two_door }),
        })

        if (!res.ok) {
          const msg = await res.text()
          throw new Error(msg || `Request failed with ${res.status}`)
        }

        const data = await res.json()

        localStorage.setItem("generatedImages", JSON.stringify(data.urls))
        // const urls = JSON.parse(data.urls)
        console.log("here's the loading page's imageUrls: ", data.urls);
        router.push("/results")
      } catch (error) {
        console.error("Error generating image:", error)
        // Store error and navigate to results to show error state
        localStorage.setItem("generationError", error instanceof Error ? error.message : "Something went wrong.")
        router.push("/results")
      }
    }

    generateImage()

    return ()=>{
            effectRan.current = true;
        }
    }
   
  }, [router])

  return (
    <main className="min-h-dvh grid place-items-center p-6 bg-slate-900 text-white font-sans">
      <section className="text-center">
        <div className="mb-6">
          {/* Animated rotating loading icon */}
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
        <h1 className="text-2xl mb-3">Generating Your Banners</h1>
        <p className="text-white/85">Please wait while we create a custom banner design...</p>
      </section>
    </main>
  )
}

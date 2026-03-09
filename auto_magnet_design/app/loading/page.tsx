"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { saveDesignsAction } from "@/app/actions/design-actions"

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

        // Check if API key exists before making request
        const hasApiKey = process.env.NEXT_PUBLIC_HAS_GEMINI_KEY === "true"
        
        if (!hasApiKey) {
          // No API key configured, use default images only
          const defaultImages = [
            "/gemini_generated/banner-1770928479330-1-934cb9f6-813a-4379-bb21-66b3eb09f834.png",
            "/gemini_generated/banner-1771009678849-1-34b82b33-3950-4ca0-83c8-717fdb47a2aa.png"
          ]
          localStorage.setItem("generatedImages", JSON.stringify(defaultImages))
          console.log("No API key configured, using default images");
          router.push("/results")
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
          // API call failed, use default images only
          const defaultImages = [
            "/gemini_generated/banner-1770928479330-1-934cb9f6-813a-4379-bb21-66b3eb09f834.png",
            "/gemini_generated/banner-1771009678849-1-34b82b33-3950-4ca0-83c8-717fdb47a2aa.png"
          ]
          localStorage.setItem("generatedImages", JSON.stringify(defaultImages))
          console.log("API call failed, using default images");
          router.push("/results")
          return
        }

        const data = await res.json()

        // API call succeeded, use only generated images (no default)
        localStorage.setItem("generatedImages", JSON.stringify(data.urls || []))
        console.log("here's the loading page's imageUrls: ", data.urls);
        router.push("/results")
      } catch (error) {
        console.error("Error generating image:", error)
        // If API call fails, use default images only
        const defaultImages = [
          "/gemini_generated/banner-1770928479330-1-934cb9f6-813a-4379-bb21-66b3eb09f834.png",
          "/gemini_generated/banner-1771009678849-1-34b82b33-3950-4ca0-83c8-717fdb47a2aa.png"
        ]
        localStorage.setItem("generatedImages", JSON.stringify(defaultImages))
        console.log("Exception caught, using default images");
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

// auto-magnet-app/src/app/page.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function Page() {
  const [primaryText, setPrimaryText] = useState("")
  const[secondaryText, setSecondaryText] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const[website, setWebsite] = useState("")
  
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const openDialog = () => setIsOpen(true)
  const closeDialog = () => setIsOpen(false)

  const onGenerate = async () => {
    setError(null)
    
    // Basic validation (requiring at least the primary text)
    if (!primaryText.trim()) {
      setError("Please enter at least the Primary Text.")
      return
    }

    // Store the details in localStorage
    localStorage.setItem("primaryText", primaryText.trim())
    localStorage.setItem("secondaryText", secondaryText.trim())
    localStorage.setItem("phoneNumber", phoneNumber.trim())
    localStorage.setItem("website", website.trim())

    // Navigate to loading page
    router.push("/loading")
  }

  return (
    <main className="min-h-dvh grid place-items-center p-6 bg-slate-900 text-white font-sans">
      <section className="text-center max-w-[880px] w-full">
        <h1 className="text-2xl mb-3">Banner Generator</h1>
        <p className="text-white/85 mb-5">
          Create a banner in 30 seconds.
        </p>

        <button
          onClick={openDialog}
          className="text-base px-4 py-3 rounded-xl border border-blue-500 bg-gray-800 hover:bg-gray-700 transition-colors"
        >
          Enter banner details
        </button>

        {/* Modal */}
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60" onClick={closeDialog} aria-hidden />
            <div className="relative w-full max-w-lg rounded-xl bg-white text-slate-900 shadow-2xl text-left">
              <div className="p-5">
                <h2 className="mt-0 mb-4 text-xl font-semibold">Enter banner details</h2>
                
                <div className="flex flex-col gap-3 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Primary Text</label>
                    <input
                      autoFocus
                      type="text"
                      value={primaryText}
                      onChange={(e) => setPrimaryText(e.target.value)}
                      placeholder="e.g. Big Summer Sale"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 text-base outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Text</label>
                    <input
                      type="text"
                      value={secondaryText}
                      onChange={(e) => setSecondaryText(e.target.value)}
                      placeholder="e.g. Up to 50% off storewide"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 text-base outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="e.g. (123) 456-7890"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 text-base outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                    <input
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="e.g. www.yourstore.com"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") onGenerate()
                      }}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 text-base outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {error && <div className="bg-red-100 text-red-800 rounded-lg px-3 py-2 mb-3">{error}</div>}

                <div className="flex gap-2 justify-end">
                  <button
                    onClick={closeDialog}
                    className="px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onGenerate}
                    className="px-3 py-2 rounded-lg border border-blue-600 bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  >
                    Generate banner
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}
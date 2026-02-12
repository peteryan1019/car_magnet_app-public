// // //auto-magnet-app/src/app/page.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function Page() {
  const [text, setText] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const openDialog = () => setIsOpen(true)
  const closeDialog = () => setIsOpen(false)

  const onGenerate = async () => {
    setError(null)
    if (!text.trim()) {
      setError("Please enter some banner text.")
      return
    }

    //method1
    // Store the text in localStorage and navigate to loading page
    localStorage.setItem("bannerText", text.trim())
    router.push("/loading")

    //method2
    // router.push(`/loading?text=${encodeURIComponent(text.trim())}`);
  }

  return (
    <main className="min-h-dvh grid place-items-center p-6 bg-slate-900 text-white font-sans">
      <section className="text-center max-w-[880px] w-full">
        <h1 className="text-2xl mb-3">Banner Generator</h1>
        <p className="text-white/85 mb-5">
          This uses Nano-Banan's image generation API. Your image is referenced by URL in the prompt.
        </p>

        <button
          onClick={openDialog}
          className="text-base px-4 py-3 rounded-xl border border-blue-500 bg-gray-800 hover:bg-gray-700 transition-colors"
        >
          enter your banner text
        </button>

        {/* Modal */}
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60" onClick={closeDialog} aria-hidden />
            <div className="relative w-full max-w-lg rounded-xl bg-white text-slate-900 shadow-2xl">
              <div className="p-5">
                <h2 className="mt-0 mb-3 text-xl font-semibold">enter banner text</h2>
                <input
                  autoFocus
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Your banner message…"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onGenerate()
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 mb-3 text-base outline-none focus:ring-2 focus:ring-blue-500"
                />

                {error && <div className="bg-red-100 text-red-800 rounded-lg px-3 py-2 mb-2">{error}</div>}

                <div className="flex gap-2 justify-end">
                  <button
                    onClick={closeDialog}
                    className="px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onGenerate}
                    className="px-3 py-2 rounded-lg border border-blue-600 bg-blue-600 text-white hover:bg-blue-700"
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

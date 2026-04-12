"use client"
/* eslint-disable */

import { getDesigns } from "../actions/design-actions"
import ExportButton from "../components/ExportButton"
import DeleteDesignButton from "../components/deleteDesignButton"
import Link from "next/link"
import ModelPreview from "../components/ModelPreview"
import { useEffect, useState } from "react"
import Modal from "@mui/material/Modal"

export default function MyDesignsPage() {
  const [userDesigns, setUserDesigns] = useState<any[]>([])
  const [carType, setCarType] = useState("medium")
  const [isTwoDoor, setIsTwoDoor] = useState("false")
  const [leftSide, setLeftSide] = useState(false)
  const [displayImg, setDisplayImg] = useState("/sample.png")
  const [open, setOpen] = useState(false)
  const [isPaid, setIsPaid] = useState(false)

  async function setUpPage() {
    const designs = await getDesigns()
    setUserDesigns(designs)

    let t = localStorage.getItem("car_type")
    if (t) setCarType(t)

    t = localStorage.getItem("two_door")
    if (t === "true" || t === "false") setIsTwoDoor(t)

    t = localStorage.getItem("left_side")
    if (t === "true") setLeftSide(true)

    const paid = localStorage.getItem("paid")
    if (paid === "true") setIsPaid(true)
  }

  useEffect(() => {
    setUpPage()
  }, [])

  function handleOpen(design: any) {
    setDisplayImg(design.imageUrl)
    setIsTwoDoor(design.two_doors)
    setOpen(true)
  }

  function handleClose() {
    setOpen(false)
  }

  return (
    <main className="min-h-screen p-6 bg-slate-900 text-white">
      <div className="max-w-6xl mx-auto">

        <div className="flex justify-between mb-8">
          <h1 className="text-3xl font-bold">My Designs</h1>
          <Link href="/design" className="bg-blue-600 px-4 py-2 rounded">
            Create New Design
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userDesigns.map((design: any, index: number) => (
            <div
              key={design.id}
              className="bg-slate-800 rounded-xl overflow-hidden relative"
            >
              
              {isPaid && index === 0 && (
                <div className="absolute top-2 left-2 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full z-10">
                  Bought
                </div>
              )}

              <img
                src={design.imageUrl || "/frame1.jpg"}
                className="w-full cursor-pointer"
                onClick={() => handleOpen(design)}
              />

              <div className="p-4 flex justify-between">
                <span className="text-sm text-gray-400">
                  {new Date(design.dateCreated).toLocaleDateString()}
                </span>

                <div className="flex gap-2">
                  <ExportButton
                    imgsrc={design.imageUrl}
                    leftSide={leftSide}
                    needsCut={design.two_doors}
                  />

                  <DeleteDesignButton id={design.id} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal open={open} onClose={handleClose}>
        <div className="bg-slate-900 p-6">
          <ModelPreview
            imgsrc={displayImg}
            carType={carType}
            isTwoDoor={isTwoDoor == "true"}
            leftSide={leftSide}
          />
        </div>
      </Modal>
    </main>
  )
}

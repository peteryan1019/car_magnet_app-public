import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import fetch from "node-fetch"

export async function POST(req: Request) {
  try {
    const { imageUrl } = await req.json()
    if (!imageUrl) return NextResponse.json({ message: "No image URL provided" }, { status: 400 })

    // Download the image
    const response = await fetch(imageUrl)
    if (!response.ok) throw new Error("Failed to download image")
    const buffer = Buffer.from(await response.arrayBuffer())

    // Save to public folder
    const publicPath = path.join(process.cwd(), "public", "sample.png")
    fs.writeFileSync(publicPath, buffer)

    return NextResponse.json({ message: "Saved successfully" })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ message: "Failed to save image" }, { status: 500 })
  }
}
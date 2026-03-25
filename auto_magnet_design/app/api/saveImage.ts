import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function POST(req: Request) {
  try {
    const { imageUrl } = await req.json()
    if (!imageUrl) {
      return NextResponse.json({ message: "No image URL provided" }, { status: 400 })
    }

    let buffer: Buffer

    if (imageUrl.startsWith("data:image")) {
      // Handle data URL
      const base64Data = imageUrl.split(",")[1]
      buffer = Buffer.from(base64Data, "base64")
    } else if (imageUrl.startsWith("/")) {
      // Handle relative URL from public folder
      const publicPath = path.join(process.cwd(), "public", imageUrl)
      if (!fs.existsSync(publicPath)) {
        return NextResponse.json({ message: "File not found: " + imageUrl }, { status: 404 })
      }
      buffer = fs.readFileSync(publicPath)
    } else {
      // Handle absolute remote URL
      const fetchResponse = await fetch(imageUrl)
      if (!fetchResponse.ok) throw new Error("Failed to download image")
      buffer = Buffer.from(await fetchResponse.arrayBuffer())
    }

    // Save the image to public folder
    const savePath = path.join(process.cwd(), "public", "simple.png")
    fs.writeFileSync(savePath, buffer)

    return NextResponse.json({ message: "Saved successfully", url: "/simple.png" })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ message: "Failed to save image" }, { status: 500 })
  }
}
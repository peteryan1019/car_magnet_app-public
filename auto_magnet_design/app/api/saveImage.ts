import fs from "fs"
import path from "path"
import fetch from "node-fetch"

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" })
  }

  const { imageUrl } = req.body
  if (!imageUrl) return res.status(400).json({ message: "No image URL provided" })

  try {
    // Download image
    const response = await fetch(imageUrl)
    const buffer = await response.arrayBuffer()

    // Save to public folder
    const publicPath = path.join(process.cwd(), "public", "sample.png")
    fs.writeFileSync(publicPath, Buffer.from(buffer))

    res.status(200).json({ message: "Saved successfully" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed to save image" })
  }
}
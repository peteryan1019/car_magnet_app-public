import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { prompt, image, mask } = await req.json();

    if (!prompt || !image || !mask) {
      return NextResponse.json(
        { error: "Missing prompt, image, or mask" },
        { status: 400 }
      );
    }

    const fullPrompt = `
You are editing an image.

STRICT RULES:
- ONLY modify WHITE areas of the mask
- DO NOT change anything outside the mask
- Keep everything else EXACTLY the same

User request:
${prompt}
`;

    const contents = [
      {
        role: "user",
        parts: [
          { text: fullPrompt },
          {
            inlineData: {
              mimeType: "image/png",
              data: image.split(",")[1],
            },
          },
          {
            inlineData: {
              mimeType: "image/png",
              data: mask.split(",")[1],
            },
          },
        ],
      },
    ];

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-image-preview",
      contents,
      config: {
        responseModalities: ["TEXT", "IMAGE"],
        imageConfig: { imageSize: "1K" },
      },
    });

    const outDir = path.join(process.cwd(), "public", "gemini_generated");
    await fsp.mkdir(outDir, { recursive: true });

    let publicUrl: string | null = null;

    for (const part of response.candidates?.[0]?.content?.parts ?? []) {
      if (part.inlineData?.data) {
        const filename = `mask-${Date.now()}-${crypto.randomUUID()}.png`;
        const outPath = path.join(outDir, filename);

        await fsp.writeFile(outPath, Buffer.from(part.inlineData.data, "base64"));
        publicUrl = `/gemini_generated/${filename}`;
        break;
      }
    }

    if (!publicUrl) {
      return NextResponse.json({ error: "No image returned" }, { status: 500 });
    }

    return NextResponse.json({ url: publicUrl });
  } catch (err: unknown) {
    console.error("Gemini mask error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
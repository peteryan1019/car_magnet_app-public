import { GoogleGenAI } from "@google/genai";
import fsp from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getAccessToken } from "@/lib/gcs";

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

    let publicUrl: string | null = null;

    for (const part of response.candidates?.[0]?.content?.parts ?? []) {
      if (part.inlineData?.data) {
        const filename = `mask-${Date.now()}-${crypto.randomUUID()}.png`;
        const buffer = Buffer.from(part.inlineData.data, "base64");

        const bucketName = process.env.GOOGLE_CLOUD_STORAGE_BUCKET;
        const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
        let privateKey = process.env.GOOGLE_PRIVATE_KEY;

        if (!bucketName || !clientEmail || !privateKey) {
           throw new Error("GCS credentials missing. Cannot upload generated image.");
        }
        privateKey = privateKey.replace(/\\n/g, '\n');

        const token = await getAccessToken(clientEmail, privateKey);
        const targetUrl = `https://storage.googleapis.com/upload/storage/v1/b/${bucketName}/o?uploadType=media&name=${encodeURIComponent(filename)}`;

        console.log(`[gemini-partial] Uploading generated image directly to GCS...`);
        const uploadRes = await fetch(targetUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'image/png',
            'Content-Length': buffer.length.toString()
          },
          body: new Uint8Array(buffer)
        });

        if (!uploadRes.ok) {
           const uploadData = await uploadRes.text();
           throw new Error(`Failed to upload generated image: ${uploadData}`);
        }

        publicUrl = `https://storage.googleapis.com/${bucketName}/${encodeURIComponent(filename)}`;
        console.log(`[gemini-partial] Image saved to GCS:`, publicUrl);
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
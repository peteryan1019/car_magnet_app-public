import { GoogleGenAI } from "@google/genai";
import fsp from "node:fs/promises";
import path from "node:path";
import { type NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getAccessToken } from "@/lib/gcs";

export const runtime = "nodejs";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });



export async function POST(req: NextRequest) {
  try {
    const overallStartTime = Date.now();
    
    const { 
      primaryText, 
      secondaryText, 
      phoneNumber, 
      website, 
      two_door, 
      logoUrl 
    } = await req.json();


    // Fetch the logo if provided, to convert it to base64 inline data for Gemini
    let logoInlineData = null;
    if (logoUrl) {
      try {
        console.log(`[v0] Fetching uploaded logo from: ${logoUrl}`);
        const logoRes = await fetch(logoUrl);
        if (logoRes.ok) {
          const logoBuffer = await logoRes.arrayBuffer();
          logoInlineData = {
            mimeType: logoRes.headers.get("content-type") || "image/png",
            data: Buffer.from(logoBuffer).toString("base64"),
          };
          console.log(`[v0] Successfully converted logo to base64`);
        } else {
          console.error(`[v0] Failed to fetch logo. Status: ${logoRes.status}`);
        }
      } catch (err) {
        console.error("[v0] Logo fetch error:", err);
      }
    }

    // Determine aspect ratio based on two_door value
    const aspectRatio = two_door === true ? "3:1" : "16:9";
    console.log(`[v0] Using aspect ratio: ${aspectRatio} (two_door: ${two_door})`);

    // Combine all the text inputs cleanly, ignoring empty optional fields
    const bannerDetails =[
      `Primary Text: "${primaryText}"`,
      secondaryText ? `Secondary Text: "${secondaryText}"` : null,
      phoneNumber ? `Phone Number: "${phoneNumber}"` : null,
      website ? `Website: "${website}"` : null,
    ].filter(Boolean).join("\n");

    console.log(`[v0] Enhancing prompt with Claude...`);
    const promptStartTime = Date.now();
    
    // Construct the baseline prompt
    let enhanced_prompt = `Use the blank canvas for reference size ratio only. Generate a banner design containing the following details:\n${bannerDetails}`; 
    
    if (logoInlineData) {
      // Append specific instructions for the logo styling mapping
      enhanced_prompt += `\nThe generated design should have the style of the uploaded logo in image 2.`;
    }
    
    const promptEndTime = Date.now();
    const promptTime = ((promptEndTime - promptStartTime) / 1000).toFixed(2);
    console.log(`[v0] ✓ Prompt prepared in ${promptTime}s`);

    const apiConfigs =[
      {
        imagePath: "blank-canvas.png",
        prompt: enhanced_prompt,
      },
      {
        imagePath: "blank-canvas.png",
        prompt: enhanced_prompt,
      },
      {
        imagePath: "blank-canvas.png",
        prompt: enhanced_prompt,
      }
    ];

    console.log(`[v0] Starting image generation for ${apiConfigs.length} image(s)...`);
    const startTime = Date.now();

    const generationPromises = apiConfigs.map(async (config, i) => {
      const abs = path.join(process.cwd(), "public", config.imagePath);
      const imagePath = `${abs}`;
      console.log(`[v0] Processing image ${i + 1}: ${imagePath}`);

      const imageData = await fsp.readFile(imagePath);
      const base64Image = imageData.toString("base64");

      // Build contents array strictly in order
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const contents: any[] =[];

      // 1. First add the prompt text
      contents.push({ text: config.prompt });

      // 2. Add logo as the first image (if present)
      if (logoInlineData) {
        contents.push({
          inlineData: logoInlineData,
        });
      }

      // 3. Add the blank canvas reference image ABSOLUTELY LAST
      const isPng = config.imagePath.toLowerCase().endsWith('.png');
      contents.push({
        inlineData: {
          mimeType: isPng ? "image/png" : "image/jpeg", // Fix to prevent Gemini from misinterpreting a PNG as a JPEG
          data: base64Image,
        },
      });

      const resolution = '1K';

      // Generate content with Gemini
      const response = await ai.models.generateContent({
        model: "gemini-3-pro-image-preview", // Make sure this model ID is valid in the latest SDK
        contents: contents,
        config: {
          responseModalities:["TEXT", "IMAGE"],
          imageConfig: {
            imageSize: resolution,
          },
        },
      });

      // Process the response
      for (const part of response!.candidates![0]!.content!.parts!) {
        if (part.text) {
          console.log(`[v0] Response ${i + 1}:`, part.text);
        } else if (part.inlineData) {
          const filename = `banner-${Date.now()}-${i + 1}-${crypto.randomUUID()}.png`;
          const imageData = part.inlineData.data;
          const buffer = Buffer.from(imageData!, "base64");
          
          const bucketName = process.env.GOOGLE_CLOUD_STORAGE_BUCKET;
          const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
          let privateKey = process.env.GOOGLE_PRIVATE_KEY;

          if (!bucketName || !clientEmail || !privateKey) {
             throw new Error("GCS credentials missing. Cannot upload generated image.");
          }
          privateKey = privateKey.replace(/\\n/g, '\n');

          const token = await getAccessToken(clientEmail, privateKey);
          const targetUrl = `https://storage.googleapis.com/upload/storage/v1/b/${bucketName}/o?uploadType=media&name=${encodeURIComponent(filename)}`;

          console.log(`[v0] Uploading generated image directly to GCS...`);
          const uploadRes = await fetch(targetUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'image/png',
              'Content-Length': buffer.length.toString()
            },
            body: buffer
          });

          if (!uploadRes.ok) {
             const uploadData = await uploadRes.text();
             throw new Error(`Failed to upload generated image: ${uploadData}`);
          }

          const publicUrlPath = `https://storage.googleapis.com/${bucketName}/${encodeURIComponent(filename)}`;
          console.log(`[v0] Image ${i + 1} saved to GCS:`, publicUrlPath);
          return publicUrlPath;
        }
      }
      return null;
    });

    const results = await Promise.all(generationPromises);

    const endTime = Date.now();
    const generationTime = ((endTime - startTime) / 1000).toFixed(2);
    console.log(`[v0] ✓ All images generated successfully in ${generationTime}s`);

    const overallEndTime = Date.now();
    const totalTime = ((overallEndTime - overallStartTime) / 1000).toFixed(2);
    console.log(`[v0] ━━━ TOTAL TIME: ${totalTime}s ━━━`);

    return NextResponse.json({ urls: results }, { status: 200 });
  } catch (error: unknown) {
    console.error("Image edit error:", error);
    const status = error instanceof Error && 'status' in error ? Number((error as {status: number}).status) : 500;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status },
    );
  }
}
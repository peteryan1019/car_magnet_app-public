import { GoogleGenAI, Modality } from "@google/genai";
import fs from "fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { type NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY, // defaults to process.env["ANTHROPIC_API_KEY"]
});

function getSignedJwt(clientEmail: string, privateKey: string) {
  const header = { alg: 'RS256', typ: 'JWT' };
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 3600;
  const payload = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/devstorage.read_write',
    aud: 'https://oauth2.googleapis.com/token',
    exp,
    iat
  };

  const encodeBase64Url = (obj: any) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const signatureInput = `${encodeBase64Url(header)}.${encodeBase64Url(payload)}`;
  
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(signatureInput);
  sign.end();
  const signature = sign.sign(privateKey, 'base64url');
  
  return `${signatureInput}.${signature}`;
}

async function getAccessToken(clientEmail: string, privateKey: string) {
  const jwt = getSignedJwt(clientEmail, privateKey);
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error_description || 'Failed to get GCS access token');
  }
  return data.access_token;
}

async function enhancePrompt(user_input: string, aspectRatio: string): Promise<string> {
  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are an amazing design instructions writer. You will take the prompt "add the text "${user_input}" inside the frame, which should be placed in the center of the frame. Feel free to change the background color and the frame color. Make sure that the text color, font, and size fit aesthetically together with the background and frame colors while ensuring high contrast. Optionally, decide on which text to emphasize with a different color, size, or weight. Use aspect ratio ${aspectRatio}." and output design instructions, adhering to each idea the user gave (do not leave out any ideas given by the user), while turning it into precise design instructions. When you recieve the prompt, just go, and output your design instructions. Do not acknowlege the command, do not acknowledge the user, do not add additional words, just go and output what you have.`,
        },
      ],
    });

    // Check if the first content block is a text block
    const firstBlock = response.content[0];
    if (firstBlock.type === "text") {
      const enhanced_prompt = firstBlock.text;
      console.log("enhanced prompt from Claude: ", enhanced_prompt);
      return enhanced_prompt;
    } else {
      throw new Error("Unexpected response type from Claude API");
    }
  } catch (error) {
    console.error("Error calling Anthropic API:", error);
    throw error;
  }
}

export async function POST(req: NextRequest) {
  try {
    const overallStartTime = Date.now();
    
    const { userText, two_door, logoUrl } = await req.json();
    const anthropic = new Anthropic();

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

    console.log(`[v0] Enhancing prompt with Claude...`);
    const promptStartTime = Date.now();
    // const enhanced_prompt = await enhancePrompt(userText, aspectRatio);
    let enhanced_prompt = userText; // will replace the prompt enhancement logic with a better one after implementing the blob logic for nano banana api calls.
    if (logoInlineData) {
      // Append specific instructions for the logo styling mapping
      enhanced_prompt += `\nGenerate a banner with text "${userText}" that has the style of the provided logo and the aspect ratio of the blank canvas.`;
    }
    const promptEndTime = Date.now();
    const promptTime = ((promptEndTime - promptStartTime) / 1000).toFixed(2);
    console.log(`[v0] ✓ Prompt enhanced in ${promptTime}s`);

    const apiConfigs = [
        // {
        //   imagePath: "frame.jpg",
        //   prompt: enhanced_prompt,
        // },
      {
        imagePath: "blank-canvas.png",
        prompt: enhanced_prompt,
      },
        // {
        //   imagePath: "frame1.jpg",
        //   prompt: enhanced_prompt,
        // },
    ];

    console.log(`[v0] Starting image generation for ${apiConfigs.length} image(s)...`);
    const startTime = Date.now();

    const generationPromises = apiConfigs.map(async (config, i) => {
      // Load the image from the local file system
      const abs = path.join(process.cwd(), "public", config.imagePath);
      const imagePath = `${abs}`;
      console.log(`[v0] Processing image ${i + 1}: ${imagePath}`);

      const imageData = await fsp.readFile(imagePath);
      const base64Image = imageData.toString("base64");

      // Prepare the content parts
      const contents: any[] = [
        { text: config.prompt },
      ];

      // Add logo inline data if present (before the aspect-ratio reference image)
      if (logoInlineData) {
        contents.push({
          inlineData: logoInlineData,
        });
      }

      // Add the aspect-ratio reference image as the very last image
      contents.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Image,
        },
      });

      const resolution = '1K';

      // Generate content with Gemini
      const response = await ai.models.generateContent({
        model: "gemini-3-pro-image-preview",
        contents: contents,
        config: {
          responseModalities: ["TEXT", "IMAGE"],
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
    // const generatedUrls = results.filter((url): url is string => url !== null)

    const endTime = Date.now();
    const generationTime = ((endTime - startTime) / 1000).toFixed(2);
    console.log(`[v0] ✓ All images generated successfully in ${generationTime}s`);

    const overallEndTime = Date.now();
    const totalTime = ((overallEndTime - overallStartTime) / 1000).toFixed(2);
    console.log(`[v0] ━━━ TOTAL TIME: ${totalTime}s ━━━`);

    return NextResponse.json({ urls: results }, { status: 200 });
  } catch (error: any) {
    console.error("Image edit error:", error);
    const status = error?.status ?? 500;
    return NextResponse.json(
      { error: error?.message ?? "Unexpected error" },
      { status },
    );
  }
}
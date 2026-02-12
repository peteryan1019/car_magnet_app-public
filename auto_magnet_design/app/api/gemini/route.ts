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

async function enhancePrompt(user_input: string): Promise<string> {
  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are an amazing design instructions writer. You will take the prompt "add the text "${user_input}" inside the frame, which should be placed in the center of the frame. Feel free to change the background color and the frame color. Make sure that the text color, font, and size fit aesthetically together with the background and frame colors while ensuring high contrast. Optionally, decide on which text to emphasize with a different color, size, or weight. Use aspect ratio 3:1." and output design instructions, adhering to each idea the user gave (do not leave out any ideas given by the user), while turning it into precise design instructions. When you recieve the prompt, just go, and output your design instructions. Do not acknowlege the command, do not acknowledge the user, do not add additional words, just go and output what you have.`,
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
    const { userText } = await req.json();
    const anthropic = new Anthropic();

    const enhanced_prompt = await enhancePrompt(userText);
    const apiConfigs = [
        // {
        //   imagePath: "frame.jpg",
        //   prompt: enhanced_prompt,
        // },
      {
        imagePath: "ben-frame.jpg",
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

      const imageData = fs.readFileSync(imagePath);
      const base64Image = imageData.toString("base64");

      // Prepare the content parts
      const contents = [
        { text: config.prompt },
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Image,
          },
        },
      ];

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
          // Ensure /public/gemini_generated exists
          const outDir = path.join(process.cwd(), "public", "gemini_generated");
          await fsp.mkdir(outDir, { recursive: true });

          const filename = `banner-${Date.now()}-${i + 1}-${crypto.randomUUID()}.png`;
          const outPath = path.join(outDir, filename);
          const imageData = part.inlineData.data;
          const buffer = Buffer.from(imageData!, "base64");
          await fsp.writeFile(outPath, buffer);

          const publicUrlPath = `/gemini_generated/${filename}`;
          console.log(`[v0] Image ${i + 1} saved:`, publicUrlPath);
          return publicUrlPath;
        }
      }
      return null;
    });

    const results = await Promise.all(generationPromises);
    // const generatedUrls = results.filter((url): url is string => url !== null)

    const endTime = Date.now();
    const totalTime = ((endTime - startTime) / 1000).toFixed(2);
    console.log(`[v0] ✓ All images generated successfully in ${totalTime}s`);

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
import { NextResponse } from "next/server"
import { getAccessToken } from "@/lib/gcs";
import crypto from "crypto";
import { getSession } from "@/lib/auth";
import { saveDesignsAction } from "@/app/actions/design-actions";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.id) {
      return NextResponse.json({ message: "Unauthorized. Please log in first." }, { status: 401 });
    }

    const { imageUrl, two_doors } = await req.json()
    if (!imageUrl) {
      return NextResponse.json({ message: "No image URL provided" }, { status: 400 })
    }

    let buffer: any;

    if (typeof imageUrl === "string" && imageUrl.startsWith("data:image")) {
      // Handle data URL (base64)
      const base64Data = imageUrl.split(",")[1];
      buffer = Buffer.from(base64Data, "base64");
    } else {
      return NextResponse.json({ message: "Only base64 data URLs are supported for this upload" }, { status: 400 })
    }

    const bucketName = process.env.GOOGLE_CLOUD_STORAGE_BUCKET;
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    let privateKey = process.env.GOOGLE_PRIVATE_KEY;

    if (!bucketName || !clientEmail || !privateKey) {
       throw new Error("GCS credentials missing. Cannot upload generated image.");
    }
    privateKey = privateKey.replace(/\\n/g, '\n');

    const token = await getAccessToken(clientEmail, privateKey);
    
    const filename = `final-design-${Date.now()}-${crypto.randomUUID()}.jpg`;
    const targetUrl = `https://storage.googleapis.com/upload/storage/v1/b/${bucketName}/o?uploadType=media&name=${encodeURIComponent(filename)}`;

    console.log(`[saveImage] Uploading generated image directly to GCS...`);
    const uploadRes = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'image/jpeg',
        'Content-Length': buffer.length.toString()
      },
      body: buffer
    });

    if (!uploadRes.ok) {
       const uploadData = await uploadRes.text();
       throw new Error(`Failed to upload generated image: ${uploadData}`);
    }

    const publicUrlPath = `https://storage.googleapis.com/${bucketName}/${encodeURIComponent(filename)}`;
    console.log(`[saveImage] Image saved to GCS:`, publicUrlPath);

    // Save the design to the database reusing your existing logic
    const saveResult = await saveDesignsAction([publicUrlPath], Boolean(two_doors));
    if (saveResult?.error) {
      console.error("[saveImage] Failed to save design to the DB:", saveResult.error);
    } else {
      console.log(`[saveImage] Image successfully inserted into database using saveDesignsAction`);
    }

    return NextResponse.json({ message: "Saved successfully", url: publicUrlPath })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ message: "Failed to save image" }, { status: 500 })
  }
}
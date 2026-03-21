import { NextRequest, NextResponse } from "next/server";
import crypto from 'crypto';

function getV4SignedUrl(
  bucketName: string, 
  objectName: string, 
  clientEmail: string, 
  privateKey: string,
  method = 'PUT',
  expiresInSecs = 3600
) {
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); // YYYYMMDDTHHMMSSZ
  const datestamp = timestamp.slice(0, 8);
  const scope = `${datestamp}/auto/storage/goog4_request`;

  const headers = { host: 'storage.googleapis.com' };
  const canonicalHeadersStr = 'host:storage.googleapis.com\n';
  const signedHeadersStr = 'host';
  const algorithm = 'GOOG4-RSA-SHA256';

  const queryParams = new URLSearchParams({
    'X-Goog-Algorithm': algorithm,
    'X-Goog-Credential': `${clientEmail}/${scope}`,
    'X-Goog-Date': timestamp,
    'X-Goog-Expires': expiresInSecs.toString(),
    'X-Goog-SignedHeaders': signedHeadersStr,
  });

  // Sort query params alphabetically by key for Canonical Request matching
  const sortedKeys = Array.from(queryParams.keys()).sort();
  const exactCanonicalQuery = sortedKeys
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(queryParams.get(k)!)}`)
    .join('&');

  const canonicalRequest = [
    method,
    `/${bucketName}/${encodeURIComponent(objectName)}`,
    exactCanonicalQuery,
    canonicalHeadersStr,
    signedHeadersStr,
    'UNSIGNED-PAYLOAD'
  ].join('\n');

  const hash = crypto.createHash('sha256').update(canonicalRequest).digest('hex');
  const stringToSign = `${algorithm}\n${timestamp}\n${scope}\n${hash}`;

  const sign = crypto.createSign('RSA-SHA256');
  sign.update(stringToSign);
  const signature = sign.sign(privateKey, 'hex');

  return `https://storage.googleapis.com/${bucketName}/${encodeURIComponent(objectName)}?${exactCanonicalQuery}&X-Goog-Signature=${signature}`;
}

export async function POST(req: NextRequest) {
  try {
    const { fileName, contentType } = await req.json();

    if (!fileName) {
      return NextResponse.json({ error: "No file name provided" }, { status: 400 });
    }

    const bucketName = process.env.GOOGLE_CLOUD_STORAGE_BUCKET;
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    let privateKey = process.env.GOOGLE_PRIVATE_KEY;
    
    if (!bucketName || !clientEmail || !privateKey) {
      return NextResponse.json({ error: "GCS credentials are not configured" }, { status: 500 });
    }

    // Handle escaped newlines in the private key if present
    privateKey = privateKey.replace(/\\n/g, '\n');

    // Create a unique file name
    const uniqueFileName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    
    // Generate a secure V4 signed URL
    const signedUrl = getV4SignedUrl(bucketName, uniqueFileName, clientEmail, privateKey);
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${encodeURIComponent(uniqueFileName)}`;

    // Give browser the temporary secure upload URL, and the final destination URL
    return NextResponse.json({ signedUrl, publicUrl });

  } catch (error: any) {
    console.error("GCS Signed URL Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
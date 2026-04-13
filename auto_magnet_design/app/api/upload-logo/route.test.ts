import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost:3000/api/upload-logo", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/upload-logo", () => {
  beforeEach(() => {
    process.env.GOOGLE_CLOUD_STORAGE_BUCKET = "test-bucket";
    process.env.GOOGLE_CLIENT_EMAIL = "test@gcs.iam.gserviceaccount.com";
    // Generate a real RSA key for the signing tests
    process.env.GOOGLE_PRIVATE_KEY = undefined;
  });

  it("returns 400 when no fileName is provided", async () => {
    const res = await POST(makeRequest({}));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("No file name provided");
  });

  it("returns 500 when GCS credentials are missing", async () => {
    delete process.env.GOOGLE_CLOUD_STORAGE_BUCKET;

    const res = await POST(makeRequest({ fileName: "logo.png" }));
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe("GCS credentials are not configured");
  });

  it("returns signedUrl and publicUrl on success", async () => {
    // Generate a real RSA key pair for the crypto.createSign call
    const crypto = await import("crypto");
    const { privateKey } = crypto.generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });
    process.env.GOOGLE_PRIVATE_KEY = privateKey;

    const res = await POST(makeRequest({ fileName: "my logo.png" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.signedUrl).toContain("https://storage.googleapis.com/test-bucket/");
    expect(json.publicUrl).toContain("https://storage.googleapis.com/test-bucket/");
    // Filename should be sanitized
    expect(json.publicUrl).toContain("my_logo.png");
  });

  it("sanitizes special characters in filename", async () => {
    const crypto = await import("crypto");
    const { privateKey } = crypto.generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });
    process.env.GOOGLE_PRIVATE_KEY = privateKey;

    const res = await POST(makeRequest({ fileName: "file (1) [copy].png" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    // Special chars should be replaced with underscores
    expect(json.publicUrl).toContain("file__1___copy_.png");
  });
});

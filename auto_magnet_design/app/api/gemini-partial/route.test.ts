import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";

const { mockGenerateContent, mockGetAccessToken, mockFetch } = vi.hoisted(() => ({
  mockGenerateContent: vi.fn(),
  mockGetAccessToken: vi.fn().mockResolvedValue("mock-token"),
  mockFetch: vi.fn(),
}));

vi.mock("@google/genai", () => ({
  GoogleGenAI: vi.fn(() => ({
    models: { generateContent: mockGenerateContent },
  })),
}));

vi.mock("@/lib/gcs", () => ({ getAccessToken: mockGetAccessToken }));

global.fetch = mockFetch;

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost:3000/api/gemini-partial", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/gemini-partial", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GOOGLE_CLOUD_STORAGE_BUCKET = "test-bucket";
    process.env.GOOGLE_CLIENT_EMAIL = "test@gcs.iam.gserviceaccount.com";
    process.env.GOOGLE_PRIVATE_KEY = "fake-key";
  });

  it("returns 400 when prompt is missing", async () => {
    const res = await POST(makeRequest({ image: "data:image/png;base64,a", mask: "data:image/png;base64,b" }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("Missing prompt, image, or mask");
  });

  it("returns 400 when image is missing", async () => {
    const res = await POST(makeRequest({ prompt: "change color", mask: "data:image/png;base64,b" }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("Missing prompt, image, or mask");
  });

  it("returns 400 when mask is missing", async () => {
    const res = await POST(makeRequest({ prompt: "change color", image: "data:image/png;base64,a" }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("Missing prompt, image, or mask");
  });

  it("returns edited image URL on success", async () => {
    mockGenerateContent.mockResolvedValueOnce({
      candidates: [
        {
          content: {
            parts: [
              { inlineData: { data: Buffer.from("edited").toString("base64") } },
            ],
          },
        },
      ],
    });
    mockFetch.mockResolvedValueOnce({ ok: true }); // GCS upload

    const res = await POST(
      makeRequest({
        prompt: "Make the background blue",
        image: "data:image/png;base64,abc",
        mask: "data:image/png;base64,def",
      })
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.url).toContain("https://storage.googleapis.com/test-bucket/");
  });

  it("returns 500 when Gemini returns no image", async () => {
    mockGenerateContent.mockResolvedValueOnce({
      candidates: [
        {
          content: {
            parts: [{ text: "Sorry, I cannot edit this image." }],
          },
        },
      ],
    });

    const res = await POST(
      makeRequest({
        prompt: "change color",
        image: "data:image/png;base64,abc",
        mask: "data:image/png;base64,def",
      })
    );
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe("No image returned");
  });

  it("returns 500 when GCS upload fails", async () => {
    mockGenerateContent.mockResolvedValueOnce({
      candidates: [
        {
          content: {
            parts: [
              { inlineData: { data: Buffer.from("img").toString("base64") } },
            ],
          },
        },
      ],
    });
    mockFetch.mockResolvedValueOnce({
      ok: false,
      text: () => Promise.resolve("Upload failed"),
    });

    const res = await POST(
      makeRequest({
        prompt: "change",
        image: "data:image/png;base64,abc",
        mask: "data:image/png;base64,def",
      })
    );
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toContain("Failed to upload generated image");
  });
});

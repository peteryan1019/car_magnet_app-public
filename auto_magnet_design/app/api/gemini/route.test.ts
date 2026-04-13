import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";

const { mockGenerateContent, mockGetAccessToken, mockFetch, mockReadFile } = vi.hoisted(() => ({
  mockGenerateContent: vi.fn(),
  mockGetAccessToken: vi.fn().mockResolvedValue("mock-token"),
  mockFetch: vi.fn(),
  mockReadFile: vi.fn().mockResolvedValue(Buffer.from("fake-image-data")),
}));

vi.mock("@google/genai", () => ({
  GoogleGenAI: vi.fn(() => ({
    models: { generateContent: mockGenerateContent },
  })),
}));

vi.mock("@/lib/gcs", () => ({ getAccessToken: mockGetAccessToken }));

vi.mock("node:fs/promises", () => ({
  default: { readFile: mockReadFile },
}));

global.fetch = mockFetch;

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost:3000/api/gemini", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/gemini", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GOOGLE_CLOUD_STORAGE_BUCKET = "test-bucket";
    process.env.GOOGLE_CLIENT_EMAIL = "test@gcs.iam.gserviceaccount.com";
    process.env.GOOGLE_PRIVATE_KEY = "fake-key";
  });

  it("generates images and returns URLs on success", async () => {
    mockGenerateContent.mockResolvedValue({
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

    // GCS upload succeeds
    mockFetch.mockResolvedValue({ ok: true });

    const req = makeRequest({
      primaryText: "Joe's Plumbing",
      secondaryText: "Fast & Reliable",
      phoneNumber: "555-1234",
      website: "joesplumbing.com",
      two_door: false,
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.urls).toHaveLength(3);
    expect(json.urls[0]).toContain("https://storage.googleapis.com/test-bucket/");
  });

  it("returns null for images when Gemini returns text-only response", async () => {
    mockGenerateContent.mockResolvedValue({
      candidates: [
        {
          content: {
            parts: [{ text: "I cannot generate that image." }],
          },
        },
      ],
    });

    const req = makeRequest({
      primaryText: "Test",
      two_door: false,
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.urls).toEqual([null, null, null]);
  });

  it("fetches logo and includes it in Gemini request when logoUrl provided", async () => {
    // First call is the logo fetch, rest are GCS uploads
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(10)),
        headers: { get: () => "image/png" },
      })
      .mockResolvedValue({ ok: true }); // GCS uploads

    mockGenerateContent.mockResolvedValue({
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

    const req = makeRequest({
      primaryText: "Test",
      logoUrl: "https://example.com/logo.png",
      two_door: false,
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    // Verify logo was fetched
    expect(mockFetch).toHaveBeenCalledWith("https://example.com/logo.png");
  });

  it("continues without logo when logo fetch fails", async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: false, status: 404 }) // logo fetch fails
      .mockResolvedValue({ ok: true }); // GCS uploads

    mockGenerateContent.mockResolvedValue({
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

    const req = makeRequest({
      primaryText: "Test",
      logoUrl: "https://example.com/missing-logo.png",
      two_door: false,
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it("returns error when Gemini throws", async () => {
    mockGenerateContent.mockRejectedValue(new Error("Gemini rate limit"));

    const req = makeRequest({ primaryText: "Test", two_door: false });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe("Gemini rate limit");
  });

  it("throws when GCS credentials are missing", async () => {
    delete process.env.GOOGLE_CLOUD_STORAGE_BUCKET;

    mockGenerateContent.mockResolvedValue({
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

    const req = makeRequest({ primaryText: "Test", two_door: false });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toContain("GCS credentials missing");
  });
});

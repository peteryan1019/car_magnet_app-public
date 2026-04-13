import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";

const { mockGetSession, mockGetAccessToken, mockSaveDesigns, mockFetch } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockGetAccessToken: vi.fn().mockResolvedValue("mock-token"),
  mockSaveDesigns: vi.fn().mockResolvedValue({ success: true }),
  mockFetch: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ getSession: mockGetSession }));
vi.mock("@/lib/gcs", () => ({ getAccessToken: mockGetAccessToken }));
vi.mock("@/app/actions/design-actions", () => ({ saveDesignsAction: mockSaveDesigns }));

global.fetch = mockFetch;

function makeRequest(body: Record<string, unknown>): Request {
  return new Request("http://localhost:3000/api/saveImage", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/saveImage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GOOGLE_CLOUD_STORAGE_BUCKET = "test-bucket";
    process.env.GOOGLE_CLIENT_EMAIL = "test@gcs.iam.gserviceaccount.com";
    process.env.GOOGLE_PRIVATE_KEY = "fake-key";
  });

  it("returns 401 when not authenticated", async () => {
    mockGetSession.mockResolvedValueOnce(null);

    const res = await POST(makeRequest({ imageUrl: "data:image/png;base64,abc" }));
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.message).toBe("Unauthorized. Please log in first.");
  });

  it("returns 400 when no imageUrl provided", async () => {
    mockGetSession.mockResolvedValueOnce({ id: 1, username: "user" });

    const res = await POST(makeRequest({}));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.message).toBe("No image URL provided");
  });

  it("returns 400 when imageUrl is not a data URL", async () => {
    mockGetSession.mockResolvedValueOnce({ id: 1, username: "user" });

    const res = await POST(makeRequest({ imageUrl: "https://example.com/img.png" }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.message).toBe("Only base64 data URLs are supported for this upload");
  });

  it("returns 500 when GCS credentials are missing", async () => {
    mockGetSession.mockResolvedValueOnce({ id: 1, username: "user" });
    delete process.env.GOOGLE_CLOUD_STORAGE_BUCKET;

    const res = await POST(makeRequest({ imageUrl: "data:image/png;base64,abc123" }));
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.message).toBe("Failed to save image");
  });

  it("uploads to GCS and saves design on success", async () => {
    mockGetSession.mockResolvedValueOnce({ id: 1, username: "user" });
    mockFetch.mockResolvedValueOnce({ ok: true });

    const res = await POST(
      makeRequest({ imageUrl: "data:image/png;base64,iVBORw0KGgo=", two_doors: true })
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.message).toBe("Saved successfully");
    expect(json.url).toContain("https://storage.googleapis.com/test-bucket/");
    expect(mockSaveDesigns).toHaveBeenCalledWith(
      [expect.stringContaining("https://storage.googleapis.com/")],
      true
    );
  });

  it("returns 500 when GCS upload fails", async () => {
    mockGetSession.mockResolvedValueOnce({ id: 1, username: "user" });
    mockFetch.mockResolvedValueOnce({ ok: false, text: () => Promise.resolve("GCS Error") });

    const res = await POST(
      makeRequest({ imageUrl: "data:image/png;base64,abc123" })
    );
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.message).toBe("Failed to save image");
  });
});

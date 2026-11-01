import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateDesignPDFs } from "./pdf";

// Mock jsPDF
const mockAddImage = vi.fn();
const mockOutput = vi.fn(function () { return new ArrayBuffer(100); });
vi.mock("jspdf", () => ({
  jsPDF: vi.fn(function () { return ({
    addImage: mockAddImage,
    output: mockOutput,
  }); }),
}));

// Mock image-size
vi.mock("image-size", () => ({
  default: vi.fn(function () { return ({ width: 800, height: 400 }); }),
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("generateDesignPDFs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(64)),
    });
  });

  it("returns only a full PDF when twoDoors is false", async () => {
    const result = await generateDesignPDFs({
      imageUrl: "https://example.com/design.png",
      carType: "medium",
      twoDoors: false,
      leftSide: false,
    });

    expect(result.size).toBe(1);
    expect(result.has("full")).toBe(true);
    expect(result.has("left")).toBe(false);
    expect(result.has("right")).toBe(false);
  });

  it("returns full, left, and right PDFs when twoDoors is true", async () => {
    const result = await generateDesignPDFs({
      imageUrl: "https://example.com/design.png",
      carType: "medium",
      twoDoors: true,
      leftSide: false,
    });

    expect(result.size).toBe(3);
    expect(result.has("full")).toBe(true);
    expect(result.has("left")).toBe(true);
    expect(result.has("right")).toBe(true);
  });

  it("returns Buffer instances for each PDF", async () => {
    const result = await generateDesignPDFs({
      imageUrl: "https://example.com/design.png",
      carType: "small",
      twoDoors: true,
      leftSide: false,
    });

    for (const [, buffer] of result) {
      expect(Buffer.isBuffer(buffer)).toBe(true);
    }
  });

  it("throws when the image fetch fails", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });

    await expect(
      generateDesignPDFs({
        imageUrl: "https://example.com/bad.png",
        carType: "medium",
        twoDoors: false,
        leftSide: false,
      })
    ).rejects.toThrow("Failed to fetch design image");
  });

  it("throws when image dimensions cannot be determined", async () => {
    const imageSize = (await import("image-size")).default;
    (imageSize as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      width: undefined,
      height: undefined,
    });

    await expect(
      generateDesignPDFs({
        imageUrl: "https://example.com/design.png",
        carType: "medium",
        twoDoors: false,
        leftSide: false,
      })
    ).rejects.toThrow("Could not determine image dimensions");
  });
});

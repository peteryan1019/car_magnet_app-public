import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateDesignPDFs } from "./pdf";

const { mockAddImage, mockOutput, mockImageSize } = vi.hoisted(() => ({
  mockAddImage: vi.fn(),
  mockOutput: vi.fn(function () { return new ArrayBuffer(100); }),
  mockImageSize: vi.fn(),
}));

vi.mock("jspdf", () => ({
  jsPDF: vi.fn(function (opts) {
    // Store the options so we can assert on them
    const instance = {
      addImage: mockAddImage,
      output: mockOutput,
      _opts: opts,
    };
    return instance;
  }),
}));

vi.mock("image-size", () => ({
  default: mockImageSize,
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("PDF Generation - Cut Positions & Orientation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(64)),
    });
  });

  it.each([
    ["small", 1 / 5],
    ["medium", 1 / 4],
    ["suv", 1 / 4],
    ["minivan", 1 / 2],
    ["truck", 1 / 5],
    ["unknown", 1 / 2],
  ])("uses correct cut position for carType=%s (expected %f)", async (carType, expectedCutPos) => {
    mockImageSize.mockReturnValue({ width: 1000, height: 400 });

    const result = await generateDesignPDFs({
      imageUrl: "https://example.com/img.png",
      carType,
      twoDoors: true,
      leftSide: false,
    });

    expect(result.size).toBe(3);

    // Verify the jsPDF constructor was called with the correct left width
    const { jsPDF } = await import("jspdf");
    const calls = (jsPDF as unknown as ReturnType<typeof vi.fn>).mock.calls;
    // Second call is the left PDF
    const leftOpts = calls[1][0];
    expect(leftOpts.format[0]).toBeCloseTo(1000 * expectedCutPos, 5);
  });

  it("inverts cut position when leftSide is true", async () => {
    mockImageSize.mockReturnValue({ width: 1000, height: 400 });

    await generateDesignPDFs({
      imageUrl: "https://example.com/img.png",
      carType: "medium", // cutPos = 1/4, inverted = 3/4
      twoDoors: true,
      leftSide: true,
    });

    const { jsPDF } = await import("jspdf");
    const calls = (jsPDF as unknown as ReturnType<typeof vi.fn>).mock.calls;
    // Left PDF should have width * 3/4
    const leftOpts = calls[1][0];
    expect(leftOpts.format[0]).toBeCloseTo(1000 * 0.75, 5);
  });

  it("uses portrait orientation when width < height", async () => {
    mockImageSize.mockReturnValue({ width: 400, height: 800 }); // portrait

    await generateDesignPDFs({
      imageUrl: "https://example.com/img.png",
      carType: "medium",
      twoDoors: false,
      leftSide: false,
    });

    const { jsPDF } = await import("jspdf");
    const calls = (jsPDF as unknown as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls[0][0].orientation).toBe("p");
  });

  it("uses landscape orientation when width >= height", async () => {
    mockImageSize.mockReturnValue({ width: 1000, height: 400 }); // landscape

    await generateDesignPDFs({
      imageUrl: "https://example.com/img.png",
      carType: "medium",
      twoDoors: false,
      leftSide: false,
    });

    const { jsPDF } = await import("jspdf");
    const calls = (jsPDF as unknown as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls[0][0].orientation).toBe("l");
  });

  it("right PDF addImage uses negative x offset for clipping", async () => {
    mockImageSize.mockReturnValue({ width: 1000, height: 400 });

    await generateDesignPDFs({
      imageUrl: "https://example.com/img.png",
      carType: "medium", // cutPos = 0.25
      twoDoors: true,
      leftSide: false,
    });

    // Third addImage call is the right PDF
    const rightCall = mockAddImage.mock.calls[2];
    expect(rightCall[2]).toBeCloseTo(-250, 5); // x = -cutPos * width = -0.25 * 1000
  });
});

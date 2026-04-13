import { jsPDF } from "jspdf";
import imageSize from "image-size";

function getCutPos(carType: string): number {
  switch (carType) {
    case "small":
      return 1 / 5;
    case "medium":
      return 1 / 4;
    case "suv":
      return 1 / 4;
    case "minivan":
      return 1 / 2;
    case "truck":
      return 1 / 5;
    default:
      return 1 / 2;
  }
}

export async function generateDesignPDFs(params: {
  imageUrl: string;
  carType: string;
  twoDoors: boolean;
  leftSide: boolean;
}): Promise<Map<string, Buffer>> {
  const { imageUrl, carType, twoDoors, leftSide } = params;

  // Fetch image and get dimensions
  const res = await fetch(imageUrl);
  if (!res.ok) throw new Error("Failed to fetch design image");

  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const dimensions = imageSize(buffer);

  if (!dimensions.width || !dimensions.height) {
    throw new Error("Could not determine image dimensions");
  }

  const { width, height } = dimensions;
  const base64 = `data:image/png;base64,${buffer.toString("base64")}`;

  const pdfs = new Map<string, Buffer>();

  // Full image PDF
  const fullOrientation = width < height ? "p" : "l";
  const fullPdf = new jsPDF({
    format: [width, height],
    unit: "px",
    orientation: fullOrientation,
  });
  fullPdf.addImage(base64, "PNG", 0, 0, width, height);
  pdfs.set("full", Buffer.from(fullPdf.output("arraybuffer")));

  if (!twoDoors) return pdfs;

  // Cut PDFs
  let cutPos = getCutPos(carType);
  if (cutPos > 1 || cutPos < 0) cutPos = 1 / 2;
  if (leftSide) cutPos = 1 - cutPos;

  // Left cut
  const leftWidth = width * cutPos;
  const leftOrientation = leftWidth < height ? "p" : "l";
  const leftPdf = new jsPDF({
    format: [leftWidth, height],
    unit: "px",
    orientation: leftOrientation,
  });
  leftPdf.addImage(base64, "PNG", 0, 0, width, height);
  pdfs.set("left", Buffer.from(leftPdf.output("arraybuffer")));

  // Right cut
  const rightWidth = width * (1 - cutPos);
  const rightOrientation = rightWidth < height ? "p" : "l";
  const rightPdf = new jsPDF({
    format: [rightWidth, height],
    unit: "px",
    orientation: rightOrientation,
  });
  rightPdf.addImage(base64, "PNG", -cutPos * width, 0, width, height);
  pdfs.set("right", Buffer.from(rightPdf.output("arraybuffer")));

  return pdfs;
}

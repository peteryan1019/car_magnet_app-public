export async function exportImages(canvas: any) {
  if (!canvas) throw new Error("Canvas is null")

  const base = canvas.toDataURL({ format: "png" })

  const { Canvas } = await import("fabric")
  const maskCanvasEl = document.createElement("canvas")
  maskCanvasEl.width = canvas.getWidth()
  maskCanvasEl.height = canvas.getHeight()

  const maskCanvas = new Canvas(maskCanvasEl, {
    width: canvas.getWidth(),
    height: canvas.getHeight(),
    backgroundColor: "#000000",
    renderOnAddRemove: true,
    selection: false,
  })

  const paths = canvas.getObjects().filter((obj: any) => obj.type === "path")

  for (const obj of paths) {
    const cloned = await obj.clone()
    maskCanvas.add(cloned)
  }

  maskCanvas.requestRenderAll()
  const mask = maskCanvas.toDataURL({ format: "png" })
  maskCanvas.dispose?.()

  return { base, mask }
}
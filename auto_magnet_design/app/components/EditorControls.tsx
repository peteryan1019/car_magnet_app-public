"use client";

export default function EditorControls({ sendScript }: { sendScript: (script: string) => void }) {

  function exportPNG() {
    sendScript(`
      var doc = app.activeDocument;
      doc.saveToOE("png");
    `);
  }

  function addText() {
    sendScript(`
      var text = app.activeDocument.artLayers.add();
      text.kind = LayerKind.TEXT;
      text.textItem.contents = "Your Business Name";
      text.textItem.size = 120;
    `);
  }

  function uploadLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);

    sendScript(`
      app.open("${url}");
    `);
  }

  return (
    <div
      style={{
        padding: 10,
        display: "flex",
        gap: 10,
        background: "#111"
      }}
    >
      <input type="file" onChange={uploadLogo} />

      <button onClick={addText}>
        Add Text
      </button>

      <button onClick={exportPNG}>
        Export PNG
      </button>
    </div>
  );
}
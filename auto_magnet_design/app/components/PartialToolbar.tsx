type Props = {
  isDrawing: boolean;
  setIsDrawing: (v: boolean) => void;
  prompt: string;
  setPrompt: (v: string) => void;
  onGenerate: () => void;
  loading: boolean;
};

export default function PartialToolbar({
  isDrawing,
  setIsDrawing,
  prompt,
  setPrompt,
  onGenerate,
  loading,
}: Props) {
  return (
    <div className="w-64 p-4 border-r flex flex-col gap-3">
      <button onClick={() => setIsDrawing(!isDrawing)}>
        {isDrawing ? "Stop Mask" : "Draw Mask"}
      </button>

      <textarea
        placeholder="Describe what to generate..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="border p-2"
      />

      <button onClick={onGenerate} disabled={loading}>
        {loading ? "Generating..." : "Generate"}
      </button>
    </div>
  );
}
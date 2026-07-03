import { useEffect, useRef } from "react";
import { FabricJSCanvas, useFabricJSEditor } from "fabricjs-react";
import { useAppStore } from "../stores/useAppStore";

export default function CanvasView() {
  const { editor, onReady } = useFabricJSEditor();
  const image = useAppStore((s) => s.image);
  const zoom = useAppStore((s) => s.zoom);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!editor || !image) return;

    editor.canvas.clear();

    fabric.Image.fromURL(image, (img) => {
      img.scaleToWidth(800);
      editor.canvas.add(img);
      editor.canvas.renderAll();
    });
  }, [image, editor]);

  useEffect(() => {
    if (!editor) return;
    editor.canvas.setZoom(zoom);
  }, [zoom]);

  return (
    <div className="w-full h-full bg-black">
      <FabricJSCanvas className="w-full h-full" onReady={onReady} />
    </div>
  );
}
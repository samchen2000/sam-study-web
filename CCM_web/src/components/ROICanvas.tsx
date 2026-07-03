import { useEffect } from "react";
import { useFabricJSEditor } from "fabricjs-react";
import { useROIStore } from "../stores/useROIStore";

export default function ROICanvas() {
  const { editor, onReady } = useFabricJSEditor();
  const boxes = useROIStore((s) => s.boxes);
  const updateBox = useROIStore((s) => s.updateBox);

  useEffect(() => {
    if (!editor) return;

    editor.canvas.clear();

    boxes.forEach((b) => {
      const rect = new fabric.Rect({
        left: b.x,
        top: b.y,
        width: b.width,
        height: b.height,
        fill: "transparent",
        stroke: "cyan",
        strokeWidth: 2,
        selectable: true,
      });

      rect.on("modified", () => {
        updateBox(b.id, {
          x: rect.left!,
          y: rect.top!,
          width: rect.width!,
          height: rect.height!,
        });
      });

      editor.canvas.add(rect);
    });

    editor.canvas.renderAll();
  }, [boxes]);

  return <FabricJSCanvas onReady={onReady} />;
}
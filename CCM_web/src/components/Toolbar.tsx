import { useAppStore } from "../stores/useAppStore";

export default function Toolbar() {
  const setZoom = useAppStore((s) => s.setZoom);

  return (
    <div className="flex gap-2 p-2 bg-gray-900 border-b border-gray-700">
      <button className="px-3 py-1 bg-gray-700 rounded">Open</button>

      <button onClick={() => setZoom(1.2)} className="px-3 py-1 bg-gray-700 rounded">
        Zoom +
      </button>

      <button onClick={() => setZoom(0.8)} className="px-3 py-1 bg-gray-700 rounded">
        Zoom -
      </button>

      <button className="px-3 py-1 bg-gray-700 rounded">Detect</button>
    </div>
  );
}
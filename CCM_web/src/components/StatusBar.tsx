export default function StatusBar() {
  return (
    <div className="h-6 bg-gray-900 border-t border-gray-700 text-xs px-2 flex items-center justify-between">
      <span>Ready</span>
      <span>Zoom: 100%</span>
      <span>Canvas: 0,0</span>
    </div>
  );
}
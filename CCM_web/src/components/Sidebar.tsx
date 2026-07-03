export default function Sidebar() {
  return (
    <div className="w-64 bg-gray-900 border-r border-gray-700 p-3">
      <h2 className="text-sm font-bold mb-2">Project</h2>
      <p className="text-xs text-gray-400">No project loaded</p>

      <h2 className="text-sm font-bold mt-4 mb-2">Tools</h2>
      <ul className="text-xs space-y-1 text-gray-300">
        <li>ROI Editor</li>
        <li>Histogram</li>
        <li>Lab Analysis</li>
      </ul>
    </div>
  );
}
import { floorLabel } from '../utils/directions.js'

function seededCells(seed) {
  let hash = 0
  for (const character of seed) hash = (hash * 31 + character.charCodeAt(0)) >>> 0
  return Array.from({ length: 25 }, () => {
    hash = (hash * 1103515245 + 12345) >>> 0
    return (hash >> 16) % 3 === 0
  })
}

export default function QrTile({ node, current, onScan }) {
  return (
    <button
      type="button"
      aria-label={`Simulate scan at ${node.name}, ${floorLabel(node.floor)}`}
      onClick={() => onScan(node.id)}
      className="flex flex-col items-center gap-2 rounded-xl border border-line bg-white p-3 text-center transition hover:-translate-y-0.5 hover:border-teal hover:bg-tealsoft"
    >
      <svg aria-hidden="true" viewBox="0 0 47 47" className="h-12 w-12">
        <rect x="0" y="0" width="47" height="47" rx="8" fill="none" stroke="#e5e9ed" />
        <rect x="2" y="2" width="14" height="14" rx="2" fill="none" stroke="#14213d" strokeWidth="2" />
        <rect x="31" y="2" width="14" height="14" rx="2" fill="none" stroke="#14213d" strokeWidth="2" />
        <rect x="2" y="31" width="14" height="14" rx="2" fill="none" stroke="#14213d" strokeWidth="2" />
        {seededCells(node.id).map((on, index) => on && (
          <rect key={index} x={(index % 5) * 9 + 2} y={Math.floor(index / 5) * 9 + 2} width="7" height="7" rx="1.5" fill="#14213d" />
        ))}
      </svg>
      <span className="text-sm font-bold leading-tight">{node.name}</span>
      <span className="text-xs text-inksoft">{current ? 'Current location' : 'Demo checkpoint'}</span>
    </button>
  )
}

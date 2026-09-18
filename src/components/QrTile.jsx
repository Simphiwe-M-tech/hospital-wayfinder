import { floorLabel } from '../utils/directions.js'

// Grid cells hidden under the three QR finder patterns (5×5 grid, row-major).
const FINDER_INDICES = new Set([0, 1, 5, 6, 3, 4, 8, 9, 15, 16, 20, 21])

function seededCells(seed) {
  let hash = 0
  for (const character of seed) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0
  }
  return Array.from({ length: 25 }, () => {
    hash = (hash * 1103515245 + 12345) >>> 0
    return (hash >> 16) % 5 < 2
  })
}

function QrGlyph({ seed }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 47 47" className="h-[54px] w-[54px]">
      <rect x="0.5" y="0.5" width="46" height="46" rx="8" fill="#fff" stroke="#dfe7e5" />
      {[[2, 2], [31, 2], [2, 31]].map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <rect x={x} y={y} width="14" height="14" rx="3" fill="#14262b" />
          <rect x={x + 3} y={y + 3} width="8" height="8" rx="1.5" fill="#fff" />
          <rect x={x + 5} y={y + 5} width="4" height="4" rx="0.5" fill="#14262b" />
        </g>
      ))}
      {seededCells(seed).map((on, index) =>
        on && !FINDER_INDICES.has(index) ? (
          <rect
            key={index}
            x={(index % 5) * 9 + 2}
            y={Math.floor(index / 5) * 9 + 2}
            width="7"
            height="7"
            rx="1.5"
            fill="#14262b"
          />
        ) : null,
      )}
    </svg>
  )
}

export default function QrTile({ node, current = false, highlight, onScan }) {
  const status =
    current
      ? { label: 'You are here', chip: 'bg-teal-soft text-teal-deep', border: 'border-teal bg-teal-soft/50' }
      : highlight === 'next'
        ? { label: 'Next checkpoint', chip: 'bg-amber-soft text-amber-text', border: 'border-amber/60' }
        : highlight === 'upcoming'
          ? { label: null, chip: '', border: 'border-teal/40' }
          : { label: null, chip: '', border: 'border-line' }

  return (
    <button
      type="button"
      aria-label={`Mark ${node.qrCode} at ${node.name}, ${floorLabel(node.floor)} as scanned`}
      onClick={() => onScan(node.id)}
      className={`flex flex-col items-center gap-2 rounded-2xl border bg-white p-3 text-center transition hover:-translate-y-0.5 hover:border-teal hover:shadow-sm ${status.border}`}
    >
      <QrGlyph seed={node.qrCode ?? node.id} />
      <span className="w-full truncate text-[13.5px] font-bold leading-tight text-ink">
        {node.name}
      </span>
      <span className="w-full truncate font-mono text-[10px] tracking-tight text-inksoft/80">
        {node.qrCode}
      </span>
      {status.label && (
        <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold ${status.chip}`}>
          {status.label}
        </span>
      )}
    </button>
  )
}
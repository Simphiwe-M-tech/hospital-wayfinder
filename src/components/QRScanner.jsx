import { useMemo, useState } from 'react'
import { ArrowLeft, ChevronDown, MapPin, QrCode } from 'lucide-react'
import { floorLabel } from '../utils/directions.js'
import { floorList } from '../lib/mapAdapter.js'
import QrTile from './QrTile.jsx'

function ManualLocationPicker({ map, onPick }) {
  const [open, setOpen] = useState(false)
  const floors = floorList(map)

  return (
    <div className="card overflow-hidden">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5"
        onClick={() => setOpen((wasOpen) => !wasOpen)}
        aria-expanded={open}
      >
        <span className="flex items-center gap-2.5 text-[13.5px] font-semibold text-ink">
          <MapPin size={16} className="shrink-0 text-teal" aria-hidden="true" />
          Simulate a map location
        </span>
        <ChevronDown
          size={17}
          className={`shrink-0 text-inksoft transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div className="border-t border-line pb-3">
          <p className="px-4 pt-3 text-[12px] leading-relaxed text-inksoft">
            For this demo, select any point on the map — including rooms without
            a QR checkpoint.
          </p>
          {floors.map((floor) => (
            <div key={floor} className="px-2 pt-2">
              <p className="px-2 pb-1 pt-1.5 text-[10.5px] font-bold uppercase tracking-[0.08em] text-inksoft">
                {floorLabel(floor)}
              </p>
              {map.nodes
                .filter((node) => node.floor === floor)
                .map((node) => (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => onPick(node.id)}
                    className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-teal-soft/60"
                  >
                    <span className="text-[13.5px] text-ink">{node.name}</span>
                    <span className="shrink-0 font-mono text-[10px] tracking-tight text-inksoft/70">
                      {node.qrCode ?? 'no QR'}
                    </span>
                  </button>
                ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function QRScanner({ map, currentId, isInitial, route, stepIndex, notice, onScan, onBack }) {
  const floors = floorList(map)

  const highlights = useMemo(() => {
    const upcoming = new Map()
    if (!route) return upcoming
    for (const id of route.path.slice(stepIndex + 1)) {
      const node = map.nodes.find((candidate) => candidate.id === id)
      if (!node?.qrCode || upcoming.has(id)) continue
      if (upcoming.size === 0) upcoming.set(id, 'next')
      else upcoming.set(id, 'upcoming')
    }
    return upcoming
  }, [map, route, stepIndex])

  const next = route ? [...highlights].find(([, kind]) => kind === 'next') : null
  const nextNode = next ? map.nodes.find((node) => node.id === next[0]) : null

  return (
    <div className="app-frame">
      <div className="flex items-center gap-2">
        {onBack && (
          <button
            type="button"
            className="icon-button -ml-3 shrink-0"
            onClick={onBack}
            aria-label={isInitial ? 'Back to hospital selection' : 'Back to directions'}
          >
            <ArrowLeft size={20} aria-hidden="true" />
          </button>
        )}
        <div className="min-w-0">
          <p className="screen-eyebrow">
            {isInitial ? 'Step 2 of 4 · Set your location' : 'Simulated checkpoint scan'}
          </p>
          <h1 id="screen-heading" className="screen-heading mt-1 text-[26px]">
            {isInitial ? 'Where are you starting?' : 'Which checkpoint are you simulating?'}
          </h1>
        </div>
      </div>

      <p className="screen-sub -mt-2">
        {isInitial
          ? 'Tap the tile nearest to you to simulate a QR checkpoint scan.'
          : 'Tap the tile for the checkpoint you want to simulate reaching. We will update the route from that map point.'}
      </p>

      <p className="inline-notice" data-tone="info">
        <QrCode size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
        <span>
          Demo mode — these tiles simulate QR scans. They do not open your camera or decode QR codes.
        </span>
      </p>

      {notice && (
        <p role="status" className="inline-notice" data-tone={notice.tone ?? 'info'}>
          {notice.text}
        </p>
      )}

      {nextNode && (
        <p className="inline-notice" data-tone="success">
          <span>
            Next checkpoint: <strong>{nextNode.name}</strong> — look for{' '}
            <span className="font-mono text-[12.5px]">{nextNode.qrCode}</span>
          </span>
        </p>
      )}

      {floors.map((floor) => {
        const checkpoints = map.nodes.filter((node) => node.floor === floor && node.qrCode)
        if (checkpoints.length === 0) return null
        return (
          <section key={floor} aria-label={floorLabel(floor)}>
            <h2 className="mb-3 flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-inksoft">
              {floorLabel(floor)}
              <span className="h-px flex-1 bg-line" aria-hidden="true" />
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {checkpoints.map((node) => (
                <QrTile
                  key={node.id}
                  node={node}
                  current={node.id === currentId}
                  highlight={highlights.get(node.id)}
                  onScan={onScan}
                />
              ))}
            </div>
          </section>
        )
      })}

      <ManualLocationPicker map={map} onPick={onScan} />
    </div>
  )
}

import { floorLabel } from '../utils/directions.js'
import QrTile from './QrTile.jsx'

export default function QRScanner({ map, currentId, isInitial, notice, onScan, onBack }) {
  const floors = [...new Set(map.nodes.map((node) => node.floor))]
  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs font-semibold text-inksoft">{isInitial ? 'Step 1 of 3 · Location' : 'Checkpoint scan'}</p>
      <h1 id="screen-heading" className="screen-heading">{isInitial ? 'Where are you starting?' : 'Confirm your checkpoint'}</h1>
      <p className="text-sm leading-relaxed text-inksoft">
        {isInitial ? 'Tap a location tile to simulate scanning its QR code and set your starting point.' : 'Tap the location you have reached. We will update your progress or find a new route from there.'}
      </p>
      <p className="rounded-xl bg-tealsoft px-3 py-2.5 text-xs leading-relaxed text-teal">
        Demo mode · These tiles are simulated checkpoints, not scannable QR codes. Your camera is not used.
      </p>
      {onBack && <button type="button" onClick={onBack} className="secondary-button self-start">Back to route</button>}
      {notice && <p role="status" className="inline-notice">{notice}</p>}
      {floors.map((floor) => (
        <section key={floor} aria-label={floorLabel(floor)}>
          <h2 className="mb-3 flex items-center gap-2 text-xs font-bold text-inksoft">
            {floorLabel(floor)}<span className="h-px flex-1 bg-line" />
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {map.nodes.filter((node) => node.floor === floor).map((node) => (
              <QrTile key={node.id} node={node} current={node.id === currentId} onScan={onScan} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

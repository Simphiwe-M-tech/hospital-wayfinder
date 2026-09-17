import { useMemo, useState } from 'react'
import { MapPin } from 'lucide-react'
import { floorLabel } from '../utils/directions.js'
import { floorList } from '../lib/mapAdapter.js'

const VIEW_W = 480
const VIEW_H = 600
const PAD = 56

// World coordinates are meters with y negative pointing up, so the projection
// flips y to place north at the top of the drawing. Uniform scaling keeps the
// schematic's relative geometry intact.
function makeProjection(nodes) {
  const xs = nodes.map((node) => node.x)
  const ys = nodes.map((node) => node.y)
  const minX = Math.min(...xs)
  const minY = Math.min(...ys)
  const spanX = Math.max(Math.max(...xs) - minX, 1)
  const spanY = Math.max(Math.max(...ys) - minY, 1)
  const scale = Math.min((VIEW_W - PAD * 2) / spanX, (VIEW_H - PAD * 2) / spanY)
  const offsetX = (VIEW_W - spanX * scale) / 2 - minX * scale
  const offsetY = (VIEW_H - spanY * scale) / 2 - minY * scale
  return (node) => ({ x: offsetX + node.x * scale, y: offsetY + node.y * scale })
}

function LiftGlyph() {
  return (
    <g fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M-3.4 -1.1 L0 -4.3 L3.4 -1.1" />
      <path d="M-3.4 1.1 L0 4.3 L3.4 1.1" />
    </g>
  )
}

function StairsGlyph() {
  return (
    <path
      d="M-4 4 H-1.4 V1.4 H1.2 V-1.2 H3.8 V-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  )
}

const LEGEND = [
  { label: 'You', swatch: <circle cx="7" cy="7" r="4" className="fill-teal" /> },
  {
    label: 'Destination',
    swatch: (
      <path
        d="M7 12.6C4.4 9.2 3 7.4 3 5.7a4 4 0 0 1 8 0c0 1.7-1.4 3.5-4 6.9Z"
        className="fill-amber"
      />
    ),
  },
  {
    label: 'Current section',
    swatch: <line x1="1.5" y1="7" x2="12.5" y2="7" className="stroke-teal-deep" strokeWidth={4} strokeLinecap="round" />,
  },
  {
    label: 'Route ahead',
    swatch: <line x1="1.5" y1="7" x2="12.5" y2="7" className="stroke-teal" strokeWidth={3} strokeLinecap="round" opacity={0.72} />,
  },
  {
    label: 'Completed',
    swatch: <line x1="1.5" y1="7" x2="12.5" y2="7" className="stroke-teal" strokeWidth={3} strokeLinecap="round" strokeDasharray="3 2" opacity={0.42} />,
  },
  {
    label: 'QR checkpoint',
    swatch: (
      <>
        <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" fill="#fff" className="stroke-teal" strokeWidth={1.4} />
        <circle cx="7" cy="7" r="1.1" className="fill-teal" />
      </>
    ),
  },
  {
    label: 'Floor change',
    swatch: <circle cx="7" cy="7" r="5" fill="none" className="stroke-amber-text" strokeWidth={1.5} strokeDasharray="2.5 2" />,
  },
]

export default function HospitalMap({ map, currentNode, destinationNode, route, stepIndex }) {
  const floors = useMemo(() => floorList(map), [map])
  const byId = useMemo(() => new Map(map.nodes.map((node) => [node.id, node])), [map])
  const [activeFloor, setActiveFloor] = useState(currentNode.floor)
  const [trackedNodeId, setTrackedNodeId] = useState(currentNode.id)

  // Follow the traveller's floor automatically (adjusting state during render);
  // manual tab taps still win until the next location change.
  if (currentNode.id !== trackedNodeId) {
    setTrackedNodeId(currentNode.id)
    setActiveFloor(currentNode.floor)
  }

  const { segments, transfers, routeFloors } = useMemo(() => {
    const segments = []
    const transfers = new Map()
    const routeFloors = new Set()
    const path = route?.path ?? []
    for (const id of path) {
      const node = byId.get(id)
      if (node) routeFloors.add(node.floor)
    }
    for (let index = 0; index < path.length - 1; index += 1) {
      const a = byId.get(path[index])
      const b = byId.get(path[index + 1])
      if (!a || !b) continue
      if (a.floor === b.floor) {
        const status = index < stepIndex ? 'done' : index === stepIndex ? 'active' : 'ahead'
        segments.push({ a, b, status })
      } else {
        const transition = a.type === 'lift' ? 'Lift' : a.type === 'stairs' ? 'Stairs' : 'Floor change'
        transfers.set(a.id, `${transition} to ${floorLabel(b.floor)}`)
        transfers.set(b.id, `${transition} from ${floorLabel(a.floor)}`)
      }
    }
    return { segments, transfers, routeFloors }
  }, [route, stepIndex, byId])

  const pathIds = useMemo(() => new Set(route?.path ?? []), [route])
  const floorNodes = useMemo(
    () => map.nodes.filter((node) => node.floor === activeFloor),
    [map, activeFloor],
  )
  const floorEdges = useMemo(
    () =>
      map.edges.filter((edge) => {
        const a = byId.get(edge.from)
        const b = byId.get(edge.to)
        return a?.floor === activeFloor && b?.floor === activeFloor
      }),
    [map, byId, activeFloor],
  )
  const project = useMemo(
    () => (floorNodes.length > 0 ? makeProjection(floorNodes) : null),
    [floorNodes],
  )

  if (!project) return null

  const floorSegments = segments.filter((segment) => segment.a.floor === activeFloor)
  const mapTitle = `Schematic map of ${floorLabel(activeFloor)}`
  const mapDescription = route
    ? `${mapTitle}. You are at ${currentNode.name} on ${floorLabel(currentNode.floor)}. The route to ${destinationNode.name} is highlighted with current, ahead, and completed sections.`
    : `${mapTitle}. No route is highlighted.`

  return (
    <section className="card overflow-hidden" aria-label="Floor map">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3.5">
        <h2 className="text-[15px] font-bold text-ink">Floor map</h2>
        <p className="shrink-0 text-[10.5px] font-semibold text-inksoft">Schematic · not to scale</p>
      </div>

      {floors.length > 1 && (
        <div className="flex gap-1.5 px-4 pt-3.5" role="group" aria-label="Choose a floor to view">
          {floors.map((floor) => {
            const active = floor === activeFloor
            const onRoute = routeFloors.has(floor)
            const hasDestination = destinationNode?.floor === floor
            return (
              <button
                key={floor}
                type="button"
                aria-pressed={active}
                aria-label={`${floorLabel(floor)}${onRoute ? ', route continues on this floor' : ''}${hasDestination ? ', destination is on this floor' : ''}`}
                onClick={() => setActiveFloor(floor)}
                className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full px-3 text-[12.5px] font-bold transition-colors ${
                  active ? 'bg-ink text-white' : 'text-inksoft hover:bg-teal-soft/60'
                }`}
              >
                <span className="flex items-center gap-1" aria-hidden="true">
                  {onRoute && (
                    <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-teal-soft' : 'bg-teal'}`} />
                  )}
                  {hasDestination && (
                    <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-amber-soft' : 'bg-amber'}`} />
                  )}
                </span>
                {floorLabel(floor)}
              </button>
            )
          })}
        </div>
      )}

      {destinationNode && destinationNode.floor !== activeFloor && (
        <button
          type="button"
          onClick={() => setActiveFloor(destinationNode.floor)}
          className="mx-4 mt-2.5 flex w-fit items-center gap-1.5 rounded-full bg-amber-soft px-3 py-1.5 text-[11.5px] font-semibold text-amber-text transition-opacity hover:opacity-80"
        >
          <MapPin size={12} aria-hidden="true" />
          Destination is on {floorLabel(destinationNode.floor)} — view floor
        </button>
      )}

      <div className="map-context" aria-label="Map route context">
        <p className="map-context-item">
          <span className="map-context-label">Viewing</span>
          {floorLabel(activeFloor)}
        </p>
        <p className="map-context-item">
          <span className="map-context-label">You are here</span>
          {currentNode.name} · {floorLabel(currentNode.floor)}
        </p>
        {destinationNode && (
          <p className="map-context-item">
            <span className="map-context-label">Destination</span>
            {destinationNode.name} · {floorLabel(destinationNode.floor)}
          </p>
        )}
      </div>

      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        role="img"
        aria-label={mapDescription}
        className="map-canvas mt-3 h-[300px] w-full min-[420px]:h-[340px] md:h-[400px] xl:h-[460px]"
      >
        <title>{mapTitle}</title>

        {floorEdges.map((edge) => {
          const a = project(byId.get(edge.from))
          const b = project(byId.get(edge.to))
          return (
            <line
              key={`${edge.from}-${edge.to}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              className="map-edge"
            />
          )
        })}

        {floorSegments.map((segment) => {
          const a = project(segment.a)
          const b = project(segment.b)
          return (
            <line
              key={`route-${segment.a.id}-${segment.b.id}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              className={
                segment.status === 'done'
                  ? 'map-route-done'
                  : segment.status === 'active'
                    ? 'map-route-active'
                    : 'map-route'
              }
            />
          )
        })}

        {floorSegments
          .filter((segment) => segment.status !== 'done')
          .map((segment) => {
            const a = project(segment.a)
            const b = project(segment.b)
            const angle = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI
            return (
              <path
                key={`chevron-${segment.a.id}-${segment.b.id}`}
                d="M-4.4 -4.4 L4.4 0 L-4.4 4.4 Z"
                transform={`translate(${(a.x + b.x) / 2},${(a.y + b.y) / 2}) rotate(${angle})`}
                className="map-chevron"
              />
            )
          })}

        {floorNodes.map((node) => {
          const p = project(node)
          const isCurrent = node.id === currentNode.id
          const isDestination = destinationNode?.id === node.id
          const onRoute = pathIds.has(node.id)
          const transfer = transfers.get(node.id)
          const isVertical = node.type === 'lift' || node.type === 'stairs'
          const radius = isVertical ? 10 : 8
          return (
            <g key={node.id}>
              {transfer && (
                <>
                  <circle cx={p.x} cy={p.y} r={radius + 7} className="map-transfer-ring" />
                  <text x={p.x} y={p.y - radius - 12} className="map-transfer-label">
                    {transfer}
                  </text>
                </>
              )}
              {isCurrent && (
                <>
                  <circle cx={p.x} cy={p.y} r={radius + 7} className="map-pulse-halo" />
                  <circle cx={p.x} cy={p.y} r={radius + 7} className="map-pulse" />
                </>
              )}
              <circle
                cx={p.x}
                cy={p.y}
                r={radius}
                className={
                  isCurrent
                    ? 'map-node-current'
                    : isDestination
                      ? 'map-node-dest'
                      : onRoute
                        ? 'map-node-route'
                        : 'map-node'
                }
              />
              {isVertical && (
                <g
                  transform={`translate(${p.x},${p.y})`}
                  className={isCurrent ? 'map-glyph-current' : onRoute ? 'map-glyph-route' : 'map-glyph'}
                >
                  {node.type === 'lift' ? <LiftGlyph /> : <StairsGlyph />}
                </g>
              )}
              {node.qrCode && (
                <g transform={`translate(${p.x + radius + 3},${p.y - radius - 3})`}>
                  <rect x={-3.5} y={-3.5} width={7} height={7} rx={1.6} className="map-qr-badge" />
                  <circle r={1.2} className="map-qr-dot" />
                </g>
              )}
              <text
                x={p.x}
                y={p.y + radius + 15}
                className={isCurrent || isDestination ? 'map-label-strong' : 'map-label'}
              >
                {node.name}
              </text>
              {isCurrent && (
                <text
                  x={p.x}
                  y={transfer ? p.y + radius + 29 : p.y - radius - 12}
                  className="map-marker-label map-marker-label-current"
                >
                  You are here
                </text>
              )}
              {isDestination && (
                <text
                  x={p.x}
                  y={p.y + radius + 29}
                  className="map-marker-label map-marker-label-destination"
                >
                  Destination
                </text>
              )}
              {isDestination && (
                <g transform={`translate(${p.x},${p.y - radius})`}>
                  <path
                    d="M0 0c-4.6-6.8-7.2-10-7.2-13.6a7.2 7.2 0 1 1 14.4 0C7.2-10 4.6-6.8 0 0Z"
                    className="map-dest-pin"
                  />
                  <circle cy={-13.6} r={2.6} className="map-dest-pin-dot" />
                </g>
              )}
            </g>
          )
        })}
      </svg>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line px-4 py-3 text-[10.5px] font-semibold text-inksoft">
        {LEGEND.map(({ label, swatch }) => (
          <span key={label} className="flex items-center gap-1.5">
            <svg viewBox="0 0 14 14" width="13" height="13" aria-hidden="true">
              {swatch}
            </svg>
            {label}
          </span>
        ))}
      </div>
    </section>
  )
}

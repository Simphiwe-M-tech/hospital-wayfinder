import { useMemo } from 'react'
import { demoMap } from '../lib/hospitals.js'

const VIEW_W = 640
const VIEW_H = 360
const PAD = 28

// Renders a hospital's discovery media: its preview image when the entry ships
// one, otherwise a schematic drawn from the real demo graph (the only hospital
// with mapped data). No geometry is invented for hospitals without a map.
function GraphPreview() {
  const drawing = useMemo(() => {
    if (!demoMap || demoMap.nodes.length === 0) return null
    const xs = demoMap.nodes.map((node) => node.x)
    const ys = demoMap.nodes.map((node) => node.y)
    const minX = Math.min(...xs)
    const minY = Math.min(...ys)
    const spanX = Math.max(Math.max(...xs) - minX, 1)
    const spanY = Math.max(Math.max(...ys) - minY, 1)
    const scale = Math.min((VIEW_W - PAD * 2) / spanX, (VIEW_H - PAD * 2) / spanY)
    const offsetX = (VIEW_W - spanX * scale) / 2 - minX * scale
    const offsetY = (VIEW_H - spanY * scale) / 2 - minY * scale
    const project = (node) => ({ x: offsetX + node.x * scale, y: offsetY + node.y * scale })
    const byId = new Map(demoMap.nodes.map((node) => [node.id, node]))
    const edges = demoMap.edges
      .map((edge) => ({ from: byId.get(edge.from), to: byId.get(edge.to) }))
      .filter((edge) => edge.from && edge.to)
      .map(({ from, to }) => ({ from: project(from), to: project(to), key: `${from.id}-${to.id}` }))
    const nodes = demoMap.nodes.map((node) => ({ id: node.id, point: project(node), qr: Boolean(node.qrCode) }))
    return { edges, nodes }
  }, [])

  if (!drawing) return null

  return (
    <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="hospital-preview-map" aria-hidden="true">
      {drawing.edges.map((edge) => (
        <line key={edge.key} x1={edge.from.x} y1={edge.from.y} x2={edge.to.x} y2={edge.to.y} />
      ))}
      {drawing.nodes.map((node) => (
        <circle
          key={node.id}
          cx={node.point.x}
          cy={node.point.y}
          r={node.qr ? 4.5 : 3}
          className={node.qr ? 'hospital-preview-node-qr' : 'hospital-preview-node'}
        />
      ))}
    </svg>
  )
}

export default function HospitalPreview({ hospital }) {
  if (hospital.image) {
    return <img src={hospital.image} alt={hospital.imageAlt ?? ''} loading="lazy" decoding="async" />
  }
  return <GraphPreview />
}

const DESTINATION_TYPES = new Set(['entrance', 'room', 'bathroom'])
const ELEVATOR_EDGE_TYPES = new Set(['elevator', 'lift'])
const STAIRS_EDGE_TYPES = new Set(['staircase', 'stairs'])

export function floorOrder(floor) {
  if (typeof floor !== 'string') return Number.POSITIVE_INFINITY
  if (floor === 'G' || floor === 'g') return 0
  const numeric = Number.parseInt(floor, 10)
  return Number.isNaN(numeric) ? Number.POSITIVE_INFINITY : numeric
}

export function floorList(map) {
  const floors = [...new Set(map.nodes.map((node) => node.floor))]
  floors.sort((a, b) => floorOrder(a) - floorOrder(b) || String(a).localeCompare(String(b)))
  return floors
}

// Frontend integration layer: validates a hospital graph, derives the pieces the UI
// needs (destination list, QR index) and normalises vertical transport so the shared
// A* and directions modules work unmodified. The raw JSON is never mutated.
export function adaptHospitalMap(rawMap) {
  const issues = []
  if (!rawMap || !Array.isArray(rawMap.nodes) || !Array.isArray(rawMap.edges)) {
    return { map: null, issues: ['Map data is missing or malformed — no nodes/edges arrays.'] }
  }

  const nodes = []
  const byId = new Map()
  for (const raw of rawMap.nodes) {
    if (!raw || typeof raw.id !== 'string' || raw.id.length === 0) {
      issues.push('A node without a valid id was skipped.')
      continue
    }
    if (byId.has(raw.id)) {
      issues.push(`Duplicate node id "${raw.id}" was skipped.`)
      continue
    }
    if (!Number.isFinite(raw.x) || !Number.isFinite(raw.y)) {
      issues.push(`Node "${raw.id}" has no usable coordinates and was skipped.`)
      continue
    }
    const node = { ...raw }
    if (typeof node.name !== 'string' || node.name.length === 0) {
      issues.push(`Node "${node.id}" has no name — its id is used as the label.`)
      node.name = node.id
    }
    if (typeof node.floor !== 'string' || node.floor.length === 0) {
      issues.push(`Node "${node.id}" has no floor — treated as Ground floor.`)
      node.floor = 'G'
    }
    nodes.push(node)
    byId.set(node.id, node)
  }

  if (nodes.length === 0) {
    return { map: null, issues: [...issues, 'The map has no usable nodes.'] }
  }

  const edges = []
  for (const raw of rawMap.edges) {
    if (!raw || !byId.has(raw.from) || !byId.has(raw.to)) {
      issues.push('An edge referencing an unknown node was skipped.')
      continue
    }
    if (raw.from === raw.to) {
      issues.push(`A self-edge on "${raw.from}" was skipped.`)
      continue
    }
    if (!Number.isFinite(raw.distance) || raw.distance < 0) {
      issues.push(`Edge ${raw.from} → ${raw.to} has an invalid distance and was skipped.`)
      continue
    }
    const edge = { ...raw }
    if (typeof edge.accessible !== 'boolean') {
      issues.push(`Edge ${edge.from} → ${edge.to} has no accessibility flag — treated as not step-free.`)
    }
    edges.push(edge)
  }

  // buildSteps infers "lift" vs "stairs" wording from node.type, while the school-building
  // map records vertical transport on the edge instead. Normalise junction endpoints so
  // the directions module keeps producing correct instructions without modification.
  for (const edge of edges) {
    const from = byId.get(edge.from)
    const to = byId.get(edge.to)
    if (from.floor === to.floor) continue
    const kind = ELEVATOR_EDGE_TYPES.has(edge.type)
      ? 'lift'
      : STAIRS_EDGE_TYPES.has(edge.type)
        ? 'stairs'
        : null
    if (!kind) {
      issues.push(`Vertical edge ${edge.from} → ${edge.to} has no recognised type (${JSON.stringify(edge.type) ?? 'missing'}) — directions may describe it as stairs.`)
      continue
    }
    for (const node of [from, to]) {
      if (node.type == null || node.type === 'junction') node.type = kind
      else if (node.type !== kind) {
        issues.push(`Vertical edge ${edge.from} → ${edge.to} reaches "${node.id}" of type "${node.type}" — the original node type was kept.`)
      }
    }
  }

  const destinations = nodes
    .filter((node) => DESTINATION_TYPES.has(node.type))
    .sort((a, b) => floorOrder(a.floor) - floorOrder(b.floor) || a.name.localeCompare(b.name))
    .map((node) => node.id)
  if (destinations.length === 0) {
    issues.push('No destinations could be derived — no entrance, room or bathroom nodes were found.')
  }

  const qrIndex = new Map()
  for (const node of nodes) {
    if (typeof node.qrCode === 'string' && node.qrCode.length > 0) qrIndex.set(node.qrCode, node.id)
  }

  return { map: { ...rawMap, nodes, edges, destinations, qrIndex }, issues }
}

// Accepts either a QR code value (from a real or simulated scan) or a raw node id.
export function resolveScan(map, code) {
  if (!map || typeof code !== 'string' || code.length === 0) return null
  const viaQr = map.qrIndex.get(code)
  if (viaQr) return viaQr
  if (map.nodes.some((node) => node.id === code)) return code
  return null
}

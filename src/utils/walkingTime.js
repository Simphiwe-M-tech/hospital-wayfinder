/** Typical indoor walking pace (m/s). Adjust here if the demo needs a different speed. */
export const WALKING_SPEED_MPS = 1.2

const VERTICAL_EDGE_TYPES = new Set(['elevator', 'lift', 'staircase', 'stairs'])

function edgeBetween(map, from, to, accessible = false) {
  const edges = map.edges.filter(
    (edge) =>
      (!accessible || edge.accessible === true) &&
      ((edge.from === from && edge.to === to) || (edge.from === to && edge.to === from)),
  )
  if (edges.length === 0) return null
  return edges.reduce((best, edge) => (edge.distance < best.distance ? edge : best))
}

/** Sum corridor-style distances along a path; skip lift/stairs ride segments. */
export function walkingDistanceMetres(map, path, accessible = false) {
  if (!map || !Array.isArray(path) || path.length < 2) return 0
  let total = 0
  for (let index = 0; index < path.length - 1; index += 1) {
    const edge = edgeBetween(map, path[index], path[index + 1], accessible)
    if (!edge || VERTICAL_EDGE_TYPES.has(edge.type)) continue
    total += edge.distance
  }
  return total
}

export function routeIncludesLift(map, path, accessible = false) {
  if (!map || !Array.isArray(path) || path.length < 2) return false
  for (let index = 0; index < path.length - 1; index += 1) {
    const edge = edgeBetween(map, path[index], path[index + 1], accessible)
    if (edge && (edge.type === 'elevator' || edge.type === 'lift')) return true
  }
  return false
}

/**
 * Convert estimated walking distance (metres) to whole minutes.
 * Uses WALKING_SPEED_MPS; short non-zero walks round up to at least 1 minute.
 */
export function estimateWalkingMinutes(distanceMetres, speedMps = WALKING_SPEED_MPS) {
  if (!Number.isFinite(distanceMetres) || distanceMetres <= 0) return 0
  if (!Number.isFinite(speedMps) || speedMps <= 0) return 0
  return Math.max(1, Math.round(distanceMetres / speedMps / 60))
}

export function formatEstimatedWalkingTime(distanceMetres, speedMps = WALKING_SPEED_MPS) {
  const minutes = estimateWalkingMinutes(distanceMetres, speedMps)
  if (minutes === 0) return 'Under 1 min walk'
  if (minutes === 1) return 'About 1 min walk'
  return `About ${minutes} min walk`
}

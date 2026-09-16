export function findRoute(map, start, end) {
  const byId = new Map(map.nodes.map((node) => [node.id, node]))
  if (!byId.has(start) || !byId.has(end)) return null

  const adjacency = new Map(map.nodes.map((node) => [node.id, []]))
  let heuristicScale = 1

  for (const edge of map.edges) {
    adjacency.get(edge.from).push({ to: edge.to, distance: edge.distance })
    adjacency.get(edge.to).push({ to: edge.from, distance: edge.distance })

    const from = byId.get(edge.from)
    const to = byId.get(edge.to)
    const coordinateDistance = Math.hypot(from.x - to.x, from.y - to.y)
    if (coordinateDistance > 0) {
      // Drawing coordinates are not metres; scale every edge to keep the estimate a lower bound.
      heuristicScale = Math.min(heuristicScale, edge.distance / coordinateDistance)
    }
  }

  function heuristic(id) {
    const node = byId.get(id)
    const destination = byId.get(end)
    return Math.hypot(node.x - destination.x, node.y - destination.y) * heuristicScale
  }

  const open = new Set([start])
  const cameFrom = new Map()
  const distances = new Map([[start, 0]])
  const estimates = new Map([[start, heuristic(start)]])

  while (open.size > 0) {
    let current
    let bestEstimate = Infinity
    for (const id of open) {
      if (estimates.get(id) < bestEstimate) {
        bestEstimate = estimates.get(id)
        current = id
      }
    }

    if (current === end) {
      const path = [current]
      while (cameFrom.has(current)) {
        current = cameFrom.get(current)
        path.push(current)
      }
      return { path: path.reverse(), distance: distances.get(end) }
    }

    open.delete(current)
    for (const edge of adjacency.get(current)) {
      const distance = distances.get(current) + edge.distance
      if (distance < (distances.get(edge.to) ?? Infinity)) {
        cameFrom.set(edge.to, current)
        distances.set(edge.to, distance)
        estimates.set(edge.to, distance + heuristic(edge.to))
        open.add(edge.to)
      }
    }
  }

  return null
}

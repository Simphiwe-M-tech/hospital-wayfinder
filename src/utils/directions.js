export function floorLabel(floor) {
  return floor === 'G' ? 'Ground floor' : `Floor ${floor}`
}

function bearing(from, to) {
  return Math.atan2(to.y - from.y, to.x - from.x)
}

function turnLabel(previous, current) {
  let difference = ((current - previous) * 180) / Math.PI
  while (difference > 180) difference -= 360
  while (difference < -180) difference += 360
  if (Math.abs(difference) < 25) return 'Continue straight'
  if (difference >= 25 && difference < 110) return 'Turn right'
  if (difference <= -25 && difference > -110) return 'Turn left'
  return 'Turn back'
}

export function buildSteps(map, path, accessible = false) {
  const byId = new Map(map.nodes.map((node) => [node.id, node]))
  return path.slice(0, -1).map((from, index) => {
    const to = path[index + 1]
    const nodeA = byId.get(from)
    const nodeB = byId.get(to)
    const edges = map.edges.filter((edge) =>
      (!accessible || edge.accessible === true) &&
      ((edge.from === from && edge.to === to) || (edge.from === to && edge.to === from)),
    )
    const distance = Math.min(...edges.map((edge) => edge.distance))
    let text
    if (nodeA.floor !== nodeB.floor) {
      const fromFloor = nodeA.floor === 'G' ? 0 : Number(nodeA.floor)
      const toFloor = nodeB.floor === 'G' ? 0 : Number(nodeB.floor)
      const direction = toFloor > fromFloor ? 'up' : 'down'
      const connection = nodeA.type === 'lift' ? 'lift' : 'stairs'
      text = `Take the ${connection} ${direction} to ${floorLabel(nodeB.floor)}`
    } else if (index === 0 || byId.get(path[index - 1]).floor !== nodeA.floor) {
      // Exiting a lift or stairwell does not establish the user's heading.
      text = `Head towards ${nodeB.name}`
    } else {
      const previous = byId.get(path[index - 1])
      text = `${turnLabel(bearing(previous, nodeA), bearing(nodeA, nodeB))} towards ${nodeB.name}`
    }
    return { from, to, text, distance, sub: `${distance} m · ${nodeB.name} · ${floorLabel(nodeB.floor)}` }
  })
}

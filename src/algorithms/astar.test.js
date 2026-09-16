import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { findRoute } from './astar.js'

const map = JSON.parse(readFileSync(new URL('../../public/hospital-map.json', import.meta.url), 'utf8'))

test('demo map has unique locations, valid edges, and selectable destinations', () => {
  const ids = new Set(map.nodes.map((node) => node.id))
  assert.equal(ids.size, map.nodes.length)
  assert.ok(ids.size > 0)
  for (const node of map.nodes) {
    assert.ok(node.id.length > 0)
    assert.ok(node.name.length > 0)
    assert.ok(['G', '1'].includes(node.floor))
    assert.ok(Number.isFinite(node.x))
    assert.ok(Number.isFinite(node.y))
  }
  for (const edge of map.edges) {
    assert.ok(ids.has(edge.from))
    assert.ok(ids.has(edge.to))
    assert.ok(Number.isFinite(edge.distance) && edge.distance >= 0)
    assert.equal(typeof edge.accessible, 'boolean')
  }
  assert.ok(map.destinations.length > 0)
  assert.equal(new Set(map.destinations).size, map.destinations.length)
  for (const id of map.destinations) assert.ok(ids.has(id))
  for (const id of ['entrance', 'reception', 'lift_g', 'stairs_g', 'radiology']) {
    assert.ok(ids.has(id))
  }
})

test('routes from the entrance to radiology across floors', () => {
  assert.deepEqual(findRoute(map, 'entrance', 'radiology'), {
    path: ['entrance', 'reception', 'corridor1', 'lift_g', 'lift_1', 'corridor2', 'radiology'],
    distance: 91,
  })
})

test('corridors can be traversed in both directions', () => {
  const forward = findRoute(map, 'entrance', 'radiology')
  assert.deepEqual(findRoute(map, 'radiology', 'entrance'), {
    path: [...forward.path].reverse(),
    distance: forward.distance,
  })
})

test('a location routes to itself with zero distance', () => {
  assert.deepEqual(findRoute(map, 'entrance', 'entrance'), {
    path: ['entrance'],
    distance: 0,
  })
})

test('unknown location IDs return no route', () => {
  assert.equal(findRoute(map, 'unknown', 'radiology'), null)
  assert.equal(findRoute(map, 'entrance', 'unknown'), null)
  assert.equal(findRoute(map, 'unknown', 'unknown'), null)
  assert.equal(findRoute(map, '__proto__', 'radiology'), null)
})

test('an empty map returns no route', () => {
  assert.equal(findRoute({ nodes: [], edges: [] }, 'entrance', 'radiology'), null)
})

test('an isolated node can route to itself', () => {
  const isolated = { nodes: [map.nodes[0]], edges: [] }
  assert.deepEqual(findRoute(isolated, 'entrance', 'entrance'), {
    path: ['entrance'],
    distance: 0,
  })
})

test('disconnected floors return no route', () => {
  const byId = new Map(map.nodes.map((node) => [node.id, node]))
  const disconnected = {
    ...map,
    edges: map.edges.filter((edge) => byId.get(edge.from).floor === byId.get(edge.to).floor),
  }
  assert.equal(findRoute(disconnected, 'entrance', 'radiology'), null)
})

test('drawing coordinates cannot hide a shorter detour', () => {
  const graph = {
    nodes: [
      { id: 'start', x: 0, y: 0, floor: 'G' },
      { id: 'detour', x: 100, y: 0, floor: 'G' },
      { id: 'end', x: 1, y: 0, floor: 'G' },
    ],
    edges: [
      { from: 'start', to: 'end', distance: 10 },
      { from: 'start', to: 'detour', distance: 1 },
      { from: 'detour', to: 'end', distance: 1 },
    ],
  }
  assert.deepEqual(findRoute(graph, 'start', 'end'), {
    path: ['start', 'detour', 'end'],
    distance: 2,
  })
})

test('identical coordinates on different floors retain their edge distance', () => {
  const graph = {
    nodes: [
      { id: 'lower', x: 0, y: 0, floor: 'G' },
      { id: 'upper', x: 0, y: 0, floor: '1' },
    ],
    edges: [{ from: 'lower', to: 'upper', distance: 8 }],
  }
  assert.deepEqual(findRoute(graph, 'lower', 'upper'), {
    path: ['lower', 'upper'],
    distance: 8,
  })
})

test('zero-distance edges do not cause loops or overestimated routes', () => {
  const graph = {
    nodes: [
      { id: 'start', x: 0, y: 0, floor: 'G' },
      { id: 'middle', x: 100, y: 0, floor: 'G' },
      { id: 'end', x: 1, y: 0, floor: 'G' },
    ],
    edges: [
      { from: 'start', to: 'end', distance: 5 },
      { from: 'start', to: 'middle', distance: 0 },
      { from: 'middle', to: 'end', distance: 0 },
    ],
  }
  assert.deepEqual(findRoute(graph, 'start', 'end'), {
    path: ['start', 'middle', 'end'],
    distance: 0,
  })
})

test('parallel connections use the shortest edge', () => {
  const graph = {
    nodes: [
      { id: 'start', x: 0, y: 0, floor: 'G' },
      { id: 'end', x: 10, y: 0, floor: 'G' },
    ],
    edges: [
      { from: 'start', to: 'end', distance: 9 },
      { from: 'start', to: 'end', distance: 3 },
    ],
  }
  assert.deepEqual(findRoute(graph, 'start', 'end'), {
    path: ['start', 'end'],
    distance: 3,
  })
})

test('all 256 demo location pairs match independently calculated shortest distances', () => {
  const ids = map.nodes.map((node) => node.id)
  const indexById = new Map(ids.map((id, index) => [id, index]))
  const expected = ids.map((_, i) => ids.map((_, j) => i === j ? 0 : Infinity))
  for (const edge of map.edges) {
    const i = indexById.get(edge.from)
    const j = indexById.get(edge.to)
    expected[i][j] = expected[j][i] = Math.min(expected[i][j], edge.distance)
  }
  for (let k = 0; k < ids.length; k++) {
    for (let i = 0; i < ids.length; i++) {
      for (let j = 0; j < ids.length; j++) {
        expected[i][j] = Math.min(expected[i][j], expected[i][k] + expected[k][j])
      }
    }
  }
  for (const [i, start] of ids.entries()) {
    for (const [j, end] of ids.entries()) {
      const route = findRoute(map, start, end)
      assert.ok(route, `${start} -> ${end} must be reachable`)
      assert.equal(route.distance, expected[i][j], `${start} -> ${end}`)
      assert.equal(route.path[0], start)
      assert.equal(route.path.at(-1), end)
      assert.equal(new Set(route.path).size, route.path.length)
      let distance = 0
      for (let step = 1; step < route.path.length; step++) {
        const from = route.path[step - 1]
        const to = route.path[step]
        const edge = map.edges.find((edge) =>
          (edge.from === from && edge.to === to) || (edge.from === to && edge.to === from),
        )
        assert.ok(edge, `${from} -> ${to} must be connected`)
        distance += edge.distance
      }
      assert.equal(distance, route.distance)
    }
  }
})

test('route calculation does not mutate the hospital map', () => {
  const before = structuredClone(map)
  findRoute(map, 'entrance', 'radiology')
  findRoute(map, 'stairs_g', 'radiology')
  assert.deepEqual(map, before)
})

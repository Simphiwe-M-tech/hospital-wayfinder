import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { findRoute } from './astar.js'
import { adaptHospitalMap } from '../lib/mapAdapter.js'

// This suite tests findRoute against the real school-building map the app actually
// serves (src/lib/hospitals.js loads src/data/hospital-map.json), run through the
// same adaptHospitalMap() step the app uses. Previously this file loaded
// public/hospital-map.json, an old placeholder demo graph the app no longer
// references at all — so this exhaustive check was never exercising real routes.
const rawMap = JSON.parse(readFileSync(new URL('../data/hospital-map.json', import.meta.url), 'utf8'))
const { map, issues } = adaptHospitalMap(rawMap)

test('map notes still flag placeholder geometry — once this fails, Person 2 has shipped real coordinates/distances; re-run this whole suite against the update, confirm the hardcoded distances below still hold, then delete this test', () => {
  assert.match(
    rawMap.notes ?? '',
    /placeholder/i,
    'hospital-map.json no longer mentions placeholder data',
  )
})

test('the school map adapts cleanly and has unique locations, valid edges, and selectable destinations', () => {
  assert.equal(issues.length, 0, issues.join(' | '))
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
  for (const id of ['reception', 'msl006', 'bathroom', 'lift_lobby', 'staircase_landing']) {
    assert.ok(ids.has(id))
  }
})

test('routes from reception to MSL 006 (F1) across floors', () => {
  assert.deepEqual(findRoute(map, 'reception', 'msl006_1'), {
    path: ['reception', 'msl006', 'staircase_landing', 'staircase_landing_1', 'msl006_1'],
    distance: 33,
  })
})

test('stairs are used normally but accessible routes use the lift', () => {
  const ordinary = {
    path: ['staircase_landing', 'staircase_landing_1', 'msl006_1'],
    distance: 13,
  }
  assert.deepEqual(findRoute(map, 'staircase_landing', 'msl006_1'), ordinary)
  assert.deepEqual(findRoute(map, 'staircase_landing', 'msl006_1', false), ordinary)

  const accessible = findRoute(map, 'staircase_landing', 'msl006_1', true)
  assert.ok(accessible)
  assert.equal(accessible.distance, 61)
  assert.equal(accessible.path[0], 'staircase_landing')
  assert.equal(accessible.path.at(-1), 'msl006_1')
  assert.ok(accessible.path.includes('lift_lobby'))
  assert.equal(accessible.path[accessible.path.indexOf('lift_lobby') + 1], 'lift_lobby_1')
  assert.ok(!accessible.path.includes('staircase_landing_1'))
})

for (const accessible of [false, true]) {
  test(`corridors can be traversed in both directions (accessible=${accessible})`, () => {
    const forward = findRoute(map, 'reception', 'msl006_1', accessible)
    assert.deepEqual(findRoute(map, 'msl006_1', 'reception', accessible), {
      path: [...forward.path].reverse(),
      distance: forward.distance,
    })
  })

  test(`a location routes to itself with zero distance (accessible=${accessible})`, () => {
    assert.deepEqual(findRoute(map, 'reception', 'reception', accessible), {
      path: ['reception'],
      distance: 0,
    })
  })

  test(`unknown location IDs return no route (accessible=${accessible})`, () => {
    assert.equal(findRoute(map, 'unknown', 'msl006_1', accessible), null)
    assert.equal(findRoute(map, 'reception', 'unknown', accessible), null)
    assert.equal(findRoute(map, 'unknown', 'unknown', accessible), null)
    assert.equal(findRoute(map, '__proto__', 'msl006_1', accessible), null)
  })

  test(`an empty map returns no route (accessible=${accessible})`, () => {
    assert.equal(findRoute({ nodes: [], edges: [] }, 'reception', 'msl006_1', accessible), null)
  })

  test(`an isolated node can route to itself (accessible=${accessible})`, () => {
    const isolated = { nodes: [map.nodes[0]], edges: [] }
    assert.deepEqual(findRoute(isolated, map.nodes[0].id, map.nodes[0].id, accessible), {
      path: [map.nodes[0].id],
      distance: 0,
    })
  })
}

test('a stairs-only floor connection has no accessible route in either direction', () => {
  const stairsOnly = {
    ...map,
    edges: map.edges.filter((edge) => !(edge.from === 'lift_lobby' && edge.to === 'lift_lobby_1')),
  }
  for (const [start, end] of [['reception', 'msl006_1'], ['msl006_1', 'reception']]) {
    const ordinary = findRoute(stairsOnly, start, end)
    assert.ok(ordinary)
    assert.equal(ordinary.distance, 33)
    assert.ok(ordinary.path.includes('staircase_landing'))
    assert.ok(ordinary.path.includes('staircase_landing_1'))
    assert.equal(findRoute(stairsOnly, start, end, true), null)
  }
})

test('accessible edges must explicitly opt in; ordinary routing ignores the flag', () => {
  for (const flag of [undefined, false, null, 0, 1, 'true', true]) {
    const edge = { from: 'start', to: 'end', distance: 8 }
    if (flag !== undefined) edge.accessible = flag
    const graph = {
      nodes: [{ id: 'start', x: 0, y: 0 }, { id: 'end', x: 10, y: 0 }],
      edges: [edge],
    }
    for (const [start, end] of [['start', 'end'], ['end', 'start']]) {
      const expected = { path: [start, end], distance: 8 }
      assert.deepEqual(findRoute(graph, start, end), expected)
      assert.deepEqual(findRoute(graph, start, end, false), expected)
      assert.deepEqual(findRoute(graph, start, end, true), flag === true ? expected : null)
      assert.deepEqual(findRoute(graph, start, start, true), { path: [start], distance: 0 })
    }
  }
})

test('disconnected floors return no route', () => {
  const byId = new Map(map.nodes.map((node) => [node.id, node]))
  const disconnected = {
    ...map,
    edges: map.edges.filter((edge) => byId.get(edge.from).floor === byId.get(edge.to).floor),
  }
  assert.equal(findRoute(disconnected, 'reception', 'msl006_1'), null)
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
  const expected = { path: ['start', 'detour', 'end'], distance: 2 }
  assert.deepEqual(findRoute(graph, 'start', 'end'), expected)
  const accessibleGraph = {
    ...graph,
    edges: graph.edges.map((edge) => ({ ...edge, accessible: true })),
  }
  assert.deepEqual(findRoute(accessibleGraph, 'start', 'end', true), expected)
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

for (const accessible of [false, true]) {
  test(`all school-map location pairs match Floyd-Warshall distances (accessible=${accessible})`, () => {
    const ids = map.nodes.map((node) => node.id)
    const indexById = new Map(ids.map((id, index) => [id, index]))
    const allowedEdges = accessible ? map.edges.filter((edge) => edge.accessible === true) : map.edges
    const expected = ids.map((_, i) => ids.map((_, j) => i === j ? 0 : Infinity))
    for (const edge of allowedEdges) {
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
        const route = findRoute(map, start, end, accessible)
        if (expected[i][j] === Infinity) {
          assert.equal(route, null, `${start} -> ${end} must be unreachable`)
          continue
        }
        assert.ok(route, `${start} -> ${end} must be reachable`)
        assert.equal(route.distance, expected[i][j], `${start} -> ${end}`)
        assert.equal(route.path[0], start)
        assert.equal(route.path.at(-1), end)
        assert.equal(new Set(route.path).size, route.path.length)
        let distance = 0
        for (let step = 1; step < route.path.length; step++) {
          const from = route.path[step - 1]
          const to = route.path[step]
          const edges = allowedEdges.filter((edge) =>
            (edge.from === from && edge.to === to) || (edge.from === to && edge.to === from),
          )
          assert.ok(edges.length > 0, `${from} -> ${to} must have an allowed edge`)
          distance += Math.min(...edges.map((edge) => edge.distance))
        }
        assert.equal(distance, route.distance)
      }
    }
  })
}

test('route calculation does not mutate the hospital map', () => {
  const before = structuredClone(map)
  for (const accessible of [false, true]) {
    findRoute(map, 'reception', 'msl006_1', accessible)
    findRoute(map, 'staircase_landing', 'msl006_1', accessible)
  }
  assert.deepEqual(map, before)
})
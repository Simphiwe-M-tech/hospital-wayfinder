import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { adaptHospitalMap, floorList, floorOrder, resolveScan } from './mapAdapter.js'
import { findRoute } from '../algorithms/astar.js'
import { buildSteps } from '../utils/directions.js'

const rawMap = JSON.parse(readFileSync(new URL('../data/hospital-map.json', import.meta.url), 'utf8'))

test('the school-building map adapts cleanly with no data issues', () => {
  const { map, issues } = adaptHospitalMap(rawMap)
  assert.equal(issues.length, 0, issues.join(' | '))
  assert.ok(map)
  assert.equal(map.nodes.length, rawMap.nodes.length)
  assert.equal(map.edges.length, rawMap.edges.length)
})

test('adapting the map does not mutate the raw JSON', () => {
  const before = structuredClone(rawMap)
  adaptHospitalMap(rawMap)
  assert.deepEqual(rawMap, before)
})

test('destinations are derived from room, bathroom and entrance nodes', () => {
  const { map } = adaptHospitalMap(rawMap)
  assert.deepEqual(map.destinations, [
    'bathroom', 'msl004', 'msl005', 'msl006', 'reception',
    'bathroom_1', 'msl004_1', 'msl005_1', 'msl006_1',
  ])
})

test('junctions such as lift lobbies and staircase landings are not destinations', () => {
  const { map } = adaptHospitalMap(rawMap)
  assert.ok(!map.destinations.includes('lift_lobby'))
  assert.ok(!map.destinations.includes('staircase_landing'))
  assert.ok(!map.destinations.includes('lift_lobby_1'))
})

test('the QR index maps checkpoint codes to node ids and skips unlabelled nodes', () => {
  const { map } = adaptHospitalMap(rawMap)
  assert.equal(map.qrIndex.get('QR-RECEPTION'), 'reception')
  assert.equal(map.qrIndex.get('QR-LIFT-LOBBY-1'), 'lift_lobby_1')
  assert.equal(map.qrIndex.size, 9)
  assert.ok(!map.qrIndex.has('QR-MSL005'))
})

test('resolveScan accepts QR codes, node ids and rejects unknown values', () => {
  const { map } = adaptHospitalMap(rawMap)
  assert.equal(resolveScan(map, 'QR-BATHROOM'), 'bathroom')
  assert.equal(resolveScan(map, 'reception'), 'reception')
  assert.equal(resolveScan(map, 'QR-UNKNOWN'), null)
  assert.equal(resolveScan(map, '__proto__'), null)
  assert.equal(resolveScan(map, ''), null)
  assert.equal(resolveScan(null, 'reception'), null)
})

test('floors are listed with Ground first and numeric floors ascending', () => {
  const { map } = adaptHospitalMap(rawMap)
  assert.deepEqual(floorList(map), ['G', '1'])
  assert.equal(floorOrder('G'), 0)
  assert.ok(floorOrder('1') > floorOrder('G'))
  assert.ok(floorOrder('2') > floorOrder('1'))
})

test('vertical transport nodes are normalised so directions name the lift correctly', () => {
  const { map } = adaptHospitalMap(rawMap)
  const byId = new Map(map.nodes.map((node) => [node.id, node]))
  assert.equal(byId.get('lift_lobby').type, 'lift')
  assert.equal(byId.get('lift_lobby_1').type, 'lift')
  assert.equal(byId.get('staircase_landing').type, 'stairs')
  assert.equal(byId.get('staircase_landing_1').type, 'stairs')
})

test('integration: buildSteps describes the school map lift and stairs correctly', () => {
  const { map } = adaptHospitalMap(rawMap)
  assert.equal(buildSteps(map, ['lift_lobby', 'lift_lobby_1'])[0].text, 'Take the lift up to Floor 1')
  assert.equal(buildSteps(map, ['lift_lobby_1', 'lift_lobby'])[0].text, 'Take the lift down to Ground floor')
  assert.equal(buildSteps(map, ['staircase_landing', 'staircase_landing_1'])[0].text, 'Take the stairs up to Floor 1')
})

test('integration: A* routes across floors on the adapted school map', () => {
  const { map } = adaptHospitalMap(rawMap)
  const route = findRoute(map, 'reception', 'msl006_1')
  assert.deepEqual(route, {
    path: ['reception', 'msl006', 'staircase_landing', 'staircase_landing_1', 'msl006_1'],
    distance: 33,
  })
  const stepFree = findRoute(map, 'reception', 'msl006_1', true)
  assert.deepEqual(stepFree, {
    path: ['reception', 'msl006', 'lift_lobby', 'lift_lobby_1', 'msl006_1'],
    distance: 71,
  })
})

test('integration: step-free routing avoids the staircase edge', () => {
  const { map } = adaptHospitalMap(rawMap)
  const stepFree = findRoute(map, 'bathroom', 'bathroom_1', true)
  assert.ok(stepFree)
  assert.ok(stepFree.path.includes('lift_lobby'))
  assert.ok(stepFree.path.includes('lift_lobby_1'))
  assert.ok(!stepFree.path.includes('staircase_landing'))
  assert.ok(!stepFree.path.includes('staircase_landing_1'))
})

test('malformed map data is rejected with an explanation', () => {
  assert.equal(adaptHospitalMap(null).map, null)
  assert.equal(adaptHospitalMap({ nodes: 'nope' }).map, null)
  const empty = adaptHospitalMap({ nodes: [], edges: [] })
  assert.equal(empty.map, null)
  assert.ok(empty.issues.length > 0)
})

test('invalid nodes and edges are skipped and reported as issues', () => {
  const broken = adaptHospitalMap({
    nodes: [
      { id: 'ok', name: 'OK', floor: 'G', x: 0, y: 0, type: 'room' },
      { id: 'ok', name: 'Duplicate', floor: 'G', x: 1, y: 1, type: 'room' },
      { id: 'noxy', name: 'No coordinates', floor: 'G', type: 'room' },
      { id: 'noname', floor: 'G', x: 2, y: 2, type: 'room' },
      { id: 'nofloor', name: 'No floor', x: 3, y: 3, type: 'room' },
    ],
    edges: [
      { from: 'ok', to: 'ghost', distance: 5, accessible: true },
      { from: 'ok', to: 'ok', distance: 1, accessible: true },
      { from: 'ok', to: 'noname', distance: -2, accessible: true },
    ],
  })
  assert.ok(broken.map)
  assert.equal(broken.map.nodes.length, 3)
  assert.equal(broken.map.edges.length, 0)
  const messages = broken.issues.join(' | ')
  assert.match(messages, /Duplicate node id/)
  assert.match(messages, /no usable coordinates/)
  assert.match(messages, /no name/)
  assert.match(messages, /no floor/)
  assert.match(messages, /unknown node/)
  assert.match(messages, /invalid distance/)
})

test('a map with no destination-like nodes reports the gap', () => {
  const junctionOnly = adaptHospitalMap({
    nodes: [{ id: 'a', name: 'A', floor: 'G', x: 0, y: 0, type: 'junction' }],
    edges: [],
  })
  assert.deepEqual(junctionOnly.map.destinations, [])
  assert.match(junctionOnly.issues.join(' | '), /No destinations could be derived/)
})

test('a vertical edge with an unrecognised type is reported, not invented', () => {
  const odd = adaptHospitalMap({
    nodes: [
      { id: 'g', name: 'G', floor: 'G', x: 0, y: 0, type: 'junction' },
      { id: 'f', name: 'F', floor: '1', x: 0, y: 0, type: 'junction' },
    ],
    edges: [{ from: 'g', to: 'f', distance: 5, accessible: true, type: 'ramp' }],
  })
  assert.equal(odd.map.nodes.find((node) => node.id === 'g').type, 'junction')
  assert.match(odd.issues.join(' | '), /no recognised type/)
})

test('a vertical edge reaching a non-junction node keeps the original node type', () => {
  const guarded = adaptHospitalMap({
    nodes: [
      { id: 'lobby', name: 'Lobby', floor: 'G', x: 0, y: 0, type: 'room' },
      { id: 'lobby1', name: 'Lobby 1', floor: '1', x: 0, y: 0, type: 'junction' },
    ],
    edges: [{ from: 'lobby', to: 'lobby1', distance: 5, accessible: true, type: 'elevator' }],
  })
  assert.equal(guarded.map.nodes.find((node) => node.id === 'lobby').type, 'room')
  assert.equal(guarded.map.nodes.find((node) => node.id === 'lobby1').type, 'lift')
  assert.match(guarded.issues.join(' | '), /original node type was kept/)
})

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { findRoute } from '../algorithms/astar.js'
import { adaptHospitalMap } from '../lib/mapAdapter.js'
import { buildSteps, floorLabel } from './directions.js'
import { classifyScan } from './reroute.js'

// Like astar.test.js, this loads the real school-building map the app actually serves
// (src/data/hospital-map.json), through the same adaptHospitalMap() step the app uses —
// not the old public/hospital-map.json demo graph the app no longer references.
const rawMap = JSON.parse(readFileSync(new URL('../data/hospital-map.json', import.meta.url), 'utf8'))
const { map } = adaptHospitalMap(rawMap)

test('floor labels distinguish ground from upper floors', () => {
  assert.equal(floorLabel('G'), 'Ground floor')
  assert.equal(floorLabel('1'), 'Floor 1')
})

test('empty and already-arrived paths have no walking instructions', () => {
  assert.deepEqual(buildSteps(map, []), [])
  assert.deepEqual(buildSteps(map, ['reception']), [])
})

test('lift and stairs directions work with the school-building lift and stairs IDs', () => {
  assert.equal(buildSteps(map, ['lift_lobby', 'lift_lobby_1'])[0].text, 'Take the lift up to Floor 1')
  assert.equal(buildSteps(map, ['lift_lobby_1', 'lift_lobby'])[0].text, 'Take the lift down to Ground floor')
  assert.equal(buildSteps(map, ['staircase_landing', 'staircase_landing_1'])[0].text, 'Take the stairs up to Floor 1')
  assert.equal(buildSteps(map, ['staircase_landing_1', 'staircase_landing'])[0].text, 'Take the stairs down to Ground floor')
})

test('the first instruction after a floor change does not guess the exit heading', () => {
  const steps = buildSteps(map, ['lift_lobby', 'lift_lobby_1', 'msl006_1'])
  assert.equal(steps[1].text, 'Head towards MSL 006 (F1)')
})

test('turn directions use the drawing coordinate orientation', () => {
  for (const [x, y, label] of [[20, 0, 'Continue straight'], [10, 10, 'Turn right'], [10, -10, 'Turn left'], [0, 0, 'Turn back']]) {
    const graph = {
      nodes: [
        { id: 'a', name: 'A', floor: 'G', x: 0, y: 0 },
        { id: 'b', name: 'B', floor: 'G', x: 10, y: 0 },
        { id: 'c', name: 'C', floor: 'G', x, y },
      ],
      edges: [{ from: 'a', to: 'b', distance: 10 }, { from: 'b', to: 'c', distance: 10 }],
    }
    assert.equal(buildSteps(graph, ['a', 'b', 'c'])[1].text, `${label} towards C`)
  }
})

test('directions use the correct parallel edge distance in each accessibility mode', () => {
  const graph = {
    nodes: map.nodes.slice(0, 2),
    edges: [
      { from: 'reception', to: 'msl006', distance: 2, accessible: false },
      { from: 'reception', to: 'msl006', distance: 5, accessible: true },
    ],
  }
  assert.equal(buildSteps(graph, ['reception', 'msl006'])[0].distance, 2)
  assert.equal(buildSteps(graph, ['reception', 'msl006'], true)[0].distance, 5)
})

for (const accessible of [false, true]) {
  test(`directions match every school-map route and its total distance (accessible=${accessible})`, () => {
    for (const start of map.nodes) {
      for (const end of map.nodes) {
        const route = findRoute(map, start.id, end.id, accessible)
        const steps = buildSteps(map, route.path, accessible)
        assert.equal(steps.length, route.path.length - 1)
        assert.equal(steps.reduce((sum, step) => sum + step.distance, 0), route.distance)
        steps.forEach((step, index) => {
          assert.equal(step.from, route.path[index])
          assert.equal(step.to, route.path[index + 1])
          assert.ok(step.text.length > 0)
          assert.ok(!step.text.includes('undefined'))
          if (accessible) assert.ok(!step.text.includes('Take the stairs'))
        })
      }
    }
  })
}

const journey = {
  path: ['reception', 'msl006', 'staircase_landing', 'staircase_landing_1', 'msl006_1'],
  stepIndex: 1,
  currentId: 'msl006',
  destinationId: 'msl006_1',
}

test('scanning the destination confirms arrival', () => {
  assert.equal(classifyScan({ ...journey, scannedId: 'msl006_1' }), 'arrived')
})

test('repeated scans do not advance progress or trigger rerouting', () => {
  assert.equal(classifyScan({ ...journey, scannedId: 'msl006' }), 'same')
})

test('expected and later checkpoints advance progress', () => {
  assert.equal(classifyScan({ ...journey, scannedId: 'staircase_landing' }), 'advance')
  assert.equal(classifyScan({ ...journey, scannedId: 'staircase_landing_1' }), 'advance')
})

test('backtracking and off-route scans need a new route', () => {
  assert.equal(classifyScan({ ...journey, scannedId: 'reception' }), 'reroute')
  assert.equal(classifyScan({ ...journey, scannedId: 'bathroom' }), 'reroute')
})

test('a new checkpoint can recover a journey with no route', () => {
  assert.equal(classifyScan({ ...journey, path: [], stepIndex: 0, scannedId: 'staircase_landing_1' }), 'reroute')
})
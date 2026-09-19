import assert from 'node:assert/strict'
import test from 'node:test'
import { previousScreen, reconcileJourney } from './navigationSession.js'

test('previousScreen follows the main journey without looping to itself', () => {
  assert.equal(previousScreen('hospital'), 'welcome')
  assert.equal(previousScreen('overview'), 'hospital')
  assert.equal(previousScreen('scan', { destinationId: null }), 'hospital')
  assert.equal(previousScreen('scan', { destinationId: 'room_a' }), 'route')
  assert.equal(previousScreen('destination', { destinationId: null }), 'scan')
  assert.equal(previousScreen('destination', { destinationId: 'room_a' }), 'route')
  assert.equal(previousScreen('route'), 'destination')
  assert.equal(previousScreen('arrival'), 'route')
  assert.equal(previousScreen('qrcodes'), 'welcome')
})

test('reconcileJourney falls back when checkpoint IDs are missing from the map', () => {
  const map = {
    nodes: [
      { id: 'a', name: 'A', floor: 'G', x: 0, y: 0 },
      { id: 'b', name: 'B', floor: 'G', x: 10, y: 0 },
    ],
    edges: [{ from: 'a', to: 'b', distance: 10, accessible: true }],
  }
  const result = reconcileJourney(map, {
    screen: 'route',
    currentId: 'missing',
    destinationId: 'b',
    accessible: false,
    route: { path: ['missing', 'b'], distance: 10 },
    stepIndex: 0,
  })
  assert.equal(result.screen, 'scan')
  assert.equal(result.currentId, null)
})

test('reconcileJourney rebuilds a valid route for restored checkpoints', () => {
  const map = {
    nodes: [
      { id: 'a', name: 'A', floor: 'G', x: 0, y: 0 },
      { id: 'b', name: 'B', floor: 'G', x: 10, y: 0 },
    ],
    edges: [{ from: 'a', to: 'b', distance: 10, accessible: true }],
  }
  const result = reconcileJourney(map, {
    screen: 'route',
    currentId: 'a',
    destinationId: 'b',
    accessible: true,
    route: null,
    stepIndex: 0,
  })
  assert.equal(result.screen, 'route')
  assert.deepEqual(result.route.path, ['a', 'b'])
  assert.equal(result.route.distance, 10)
})

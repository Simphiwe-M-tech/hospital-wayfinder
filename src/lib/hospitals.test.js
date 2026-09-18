import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import test from 'node:test'
import { demoMap, hospitals } from './hospitals.js'
import { floorList } from './mapAdapter.js'

test('the registry exposes the demo hospital plus three preview hospitals', () => {
  assert.equal(hospitals.length, 4)
  assert.equal(new Set(hospitals.map((hospital) => hospital.id)).size, 4)
  assert.equal(new Set(hospitals.map((hospital) => hospital.name)).size, 4)
  assert.deepEqual(
    hospitals.map((hospital) => hospital.name),
    [
      'MSL Demo Hospital',
      'Northview Medical Centre',
      'Greenfield General Hospital',
      'Riverside Community Hospital',
    ],
  )
})

test('only the mapped demo hospital can start navigation', () => {
  const navigable = hospitals.filter((hospital) => hospital.navigationAvailable)
  assert.deepEqual(navigable.map((hospital) => hospital.id), ['demo-hospital'])
  assert.equal(typeof navigable[0].loadMap, 'function')
  for (const hospital of hospitals) {
    if (hospital.id === 'demo-hospital') continue
    assert.equal(hospital.loadMap, null, `${hospital.id} must not attempt to load a map`)
  }
})

test('demo hospital counts are derived from its real map data', () => {
  const demo = hospitals[0]
  assert.ok(demoMap)
  assert.equal(demo.statsSource, 'map')
  assert.equal(demo.stats.floors, floorList(demoMap).length)
  assert.equal(demo.stats.destinations, demoMap.destinations.length)
  assert.equal(demo.stats.checkpoints, demoMap.qrIndex.size)
  assert.ok(demo.stats.floors > 0 && demo.stats.destinations > 0 && demo.stats.checkpoints > 0)
})

test('preview hospitals carry clearly labelled illustrative data', () => {
  for (const hospital of hospitals.slice(1)) {
    assert.equal(hospital.badge, 'Demo / Preview Only')
    assert.equal(hospital.statsSource, 'preview')
    assert.equal(hospital.navigationAvailable, false)
    assert.ok(hospital.tagline.length > 0)
    assert.ok(hospital.stats.floors > 0)
    assert.ok(hospital.stats.destinations > 0)
    assert.ok(hospital.stats.checkpoints > 0)
    assert.ok(hospital.image.endsWith('.jpg'), `${hospital.id} needs a local preview image`)
    assert.ok(hospital.imageAlt, `${hospital.id} needs descriptive alt text`)
  }
})

test('preview hospital images exist under public/images/hospitals', () => {
  for (const hospital of hospitals.slice(1)) {
    assert.ok(
      hospital.image.startsWith('/images/hospitals/'),
      `${hospital.id} image should be served from /images/hospitals/`,
    )
    const file = new URL(`../../public${hospital.image}`, import.meta.url)
    assert.ok(existsSync(file), `missing image asset for ${hospital.id}`)
  }
})

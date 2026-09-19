import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { adaptHospitalMap } from '../lib/mapAdapter.js'
import {
  WALKING_SPEED_MPS,
  estimateWalkingMinutes,
  formatEstimatedWalkingTime,
  routeIncludesLift,
  walkingDistanceMetres,
} from './walkingTime.js'

const rawMap = JSON.parse(readFileSync(new URL('../data/hospital-map.json', import.meta.url), 'utf8'))
const { map } = adaptHospitalMap(rawMap)

test('walking speed is a configurable indoor pace around 1–1.3 m/s', () => {
  assert.ok(WALKING_SPEED_MPS >= 1 && WALKING_SPEED_MPS <= 1.3)
})

test('short nearby distances estimate about one minute', () => {
  assert.equal(estimateWalkingMinutes(12), 1)
  assert.equal(estimateWalkingMinutes(60), 1)
  assert.equal(formatEstimatedWalkingTime(12), 'About 1 min walk')
})

test('longer distances scale with walking speed', () => {
  // 144 m at 1.2 m/s ≈ 2 minutes
  assert.equal(estimateWalkingMinutes(144), 2)
  assert.equal(formatEstimatedWalkingTime(144), 'About 2 min walk')
  assert.equal(estimateWalkingMinutes(0), 0)
  assert.equal(formatEstimatedWalkingTime(0), 'Under 1 min walk')
})

test('walking distance excludes lift and stair ride segments', () => {
  const path = ['lift_lobby_g', 'lift_g', 'lift_1', 'lift_lobby_1']
  assert.equal(walkingDistanceMetres(map, path), 3 + 3)
  assert.equal(routeIncludesLift(map, path), true)
})

test('same-floor corridor walks do not report a lift', () => {
  const path = ['hall_east_g', 'lift_lobby_g', 'female_toilet_g']
  assert.equal(walkingDistanceMetres(map, path), 7 + 4)
  assert.equal(routeIncludesLift(map, path), false)
})

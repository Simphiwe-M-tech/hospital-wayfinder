import { findRoute } from '../algorithms/astar.js'

export const SESSION_KEY = 'hospital-wayfinder-nav-v1'

const NAV_SCREENS = new Set(['scan', 'destination', 'route', 'arrival', 'loading'])

export function readNavigationSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (!data || typeof data.screen !== 'string') return null
    return data
  } catch {
    return null
  }
}

export function writeNavigationSession(snapshot) {
  try {
    if (!snapshot || snapshot.screen === 'welcome') {
      sessionStorage.removeItem(SESSION_KEY)
      return
    }
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(snapshot))
  } catch {
    // Ignore quota / private-mode failures — navigation still works without persistence.
  }
}

export function clearNavigationSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY)
  } catch {
    // ignore
  }
}

export function findHospital(hospitals, id) {
  if (!id) return null
  return hospitals.find((entry) => entry.id === id) ?? null
}

/** Logical previous screen in the user journey (UI Back / history fallback). */
export function previousScreen(screen, { destinationId, previewHospital } = {}) {
  switch (screen) {
    case 'hospital':
      return 'welcome'
    case 'overview':
      return 'hospital'
    case 'loading':
      return previewHospital ? 'overview' : 'hospital'
    case 'qrcodes':
      return 'welcome'
    case 'scan':
      return destinationId ? 'route' : 'hospital'
    case 'destination':
      return destinationId ? 'route' : 'scan'
    case 'route':
      return 'destination'
    case 'arrival':
      return 'route'
    default:
      return 'welcome'
  }
}

/**
 * After a map loads (or on restore), ensure IDs and route still exist.
 * Falls back to the nearest usable screen instead of crashing.
 */
export function reconcileJourney(map, draft) {
  const {
    screen,
    currentId,
    destinationId,
    accessible = false,
    route = null,
    stepIndex = 0,
  } = draft

  if (!map) {
    return {
      screen: NAV_SCREENS.has(screen) ? 'loading' : screen,
      currentId: null,
      destinationId: null,
      route: null,
      stepIndex: 0,
    }
  }

  const ids = new Set(map.nodes.map((node) => node.id))
  const current = currentId && ids.has(currentId) ? currentId : null
  const destination = destinationId && ids.has(destinationId) ? destinationId : null

  let nextScreen = screen
  if (NAV_SCREENS.has(nextScreen) && nextScreen !== 'loading') {
    if (!current && (nextScreen === 'destination' || nextScreen === 'route' || nextScreen === 'arrival')) {
      nextScreen = 'scan'
    } else if (current && !destination && (nextScreen === 'route' || nextScreen === 'arrival')) {
      nextScreen = 'destination'
    }
  }

  let nextRoute = null
  let nextStep = 0
  if (current && destination) {
    const recomputed = findRoute(map, current, destination, accessible)
    if (
      recomputed &&
      route?.path &&
      Array.isArray(route.path) &&
      route.path.length === recomputed.path.length &&
      route.path.every((id, index) => id === recomputed.path[index])
    ) {
      nextRoute = recomputed
    } else {
      nextRoute = recomputed
    }
    if (nextRoute) {
      nextStep = Math.max(0, Math.min(Number(stepIndex) || 0, nextRoute.path.length - 1))
    } else if (nextScreen === 'route' || nextScreen === 'arrival') {
      nextScreen = 'destination'
    }
  }

  if (nextScreen === 'arrival' && current && destination && current !== destination) {
    // Arrival is only valid once the destination checkpoint is current.
    nextScreen = nextRoute ? 'route' : 'destination'
  }

  if (nextScreen === 'loading') nextScreen = 'scan'

  return {
    screen: nextScreen,
    currentId: current,
    destinationId: destination,
    route: nextRoute,
    stepIndex: nextStep,
  }
}

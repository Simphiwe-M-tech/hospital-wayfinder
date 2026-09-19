import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, LoaderCircle } from 'lucide-react'
import { findRoute } from './algorithms/astar.js'
import { buildSteps, floorLabel } from './utils/directions.js'
import { classifyScan } from './utils/reroute.js'
import { routeIncludesLift, walkingDistanceMetres } from './utils/walkingTime.js'
import {
  clearNavigationSession,
  findHospital,
  previousScreen,
  readNavigationSession,
  reconcileJourney,
  writeNavigationSession,
} from './utils/navigationSession.js'
import { hospitals } from './lib/hospitals.js'
import { adaptHospitalMap, resolveScan } from './lib/mapAdapter.js'
import BrandMark from './components/BrandMark.jsx'
import WelcomeScreen from './components/WelcomeScreen.jsx'
import HospitalSelector from './components/HospitalSelector.jsx'
import HospitalOverview from './components/HospitalOverview.jsx'
import QRScanner from './components/QRScanner.jsx'
import DestinationPicker from './components/DestinationPicker.jsx'
import HospitalMap from './components/HospitalMap.jsx'
import RouteDirections from './components/RouteDirections.jsx'
import ArrivalScreen from './components/ArrivalScreen.jsx'
import QRCodePage from './components/QRCodePage.jsx'
import './App.css'

function ShellHeader({ hospital, currentNode, onSwitchHospital }) {
  return (
    <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
      <div className="flex min-w-0 items-center gap-2.5">
        <BrandMark size={30} />
        <div className="min-w-0">
          <p className="text-[14.5px] font-bold leading-tight tracking-tight text-ink">
            Hospital Wayfinder
          </p>
          {hospital && (
            <button
              type="button"
              onClick={onSwitchHospital}
              aria-label={`Switch hospital — currently ${hospital.name}`}
              className="truncate text-[11px] font-semibold leading-tight text-teal hover:underline"
            >
              {hospital.name} · change
            </button>
          )}
        </div>
      </div>
      <p className="shrink-0 text-right text-[11px] leading-snug text-inksoft" aria-live="polite">
        {currentNode ? `${currentNode.name} · ${floorLabel(currentNode.floor)}` : 'Location not set'}
      </p>
    </header>
  )
}

function ShellFooter() {
  return (
    <footer className="border-t border-line px-5 py-4 text-center text-[11.5px] leading-relaxed text-inksoft">
      Hospital Wayfinder
    </footer>
  )
}

function bootstrapState() {
  const session = readNavigationSession()
  if (!session) {
    return {
      screen: 'welcome',
      hospital: null,
      previewHospital: null,
      currentId: null,
      destinationId: null,
      accessible: false,
      route: null,
      stepIndex: 0,
      pendingScreen: null,
    }
  }

  const hospital = findHospital(hospitals, session.hospitalId)
  const previewHospital = findHospital(hospitals, session.previewHospitalId)
  let screen = session.screen
  let pendingScreen = null

  if (screen === 'overview' && !previewHospital) screen = 'hospital'
  if (screen === 'qrcodes') {
    // keep
  } else if (['loading', 'scan', 'destination', 'route', 'arrival'].includes(screen)) {
    if (!hospital?.loadMap) {
      screen = previewHospital ? 'overview' : 'hospital'
    } else {
      pendingScreen = screen === 'loading' ? 'scan' : screen
      screen = 'loading'
    }
  }

  return {
    screen,
    hospital: hospital?.loadMap ? hospital : null,
    previewHospital,
    currentId: typeof session.currentId === 'string' ? session.currentId : null,
    destinationId: typeof session.destinationId === 'string' ? session.destinationId : null,
    accessible: Boolean(session.accessible),
    route: session.route && Array.isArray(session.route.path) ? session.route : null,
    stepIndex: Number.isFinite(session.stepIndex) ? session.stepIndex : 0,
    pendingScreen,
  }
}

export default function App() {
  const [boot] = useState(bootstrapState)
  const [hospital, setHospital] = useState(boot.hospital)
  const [previewHospital, setPreviewHospital] = useState(boot.previewHospital)
  const [map, setMap] = useState(null)
  const [loadError, setLoadError] = useState(false)
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [screen, setScreen] = useState(boot.screen)
  const [currentId, setCurrentId] = useState(boot.currentId)
  const [destinationId, setDestinationId] = useState(boot.destinationId)
  const [accessible, setAccessible] = useState(boot.accessible)
  const [route, setRoute] = useState(boot.route)
  const [stepIndex, setStepIndex] = useState(boot.stepIndex)
  const [notice, setNotice] = useState(null)
  const mainRef = useRef(null)
  const pendingScreenRef = useRef(boot.pendingScreen)
  const historyDepthRef = useRef(0)
  const ignorePopRef = useRef(false)
  const skipPersistRef = useRef(true)

  // Seed browser history with the restored/current screen (no extra stack entry).
  useEffect(() => {
    window.history.replaceState({ hwScreen: screen }, '')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- mount only

  useEffect(() => {
    if (!hospital?.loadMap) return undefined
    let cancelled = false
    hospital
      .loadMap()
      .then((rawMap) => {
        if (cancelled) return
        const { map: adaptedMap } = adaptHospitalMap(rawMap)
        if (!adaptedMap) {
          setLoadError(true)
          return
        }
        const pending = pendingScreenRef.current ?? (screen === 'loading' ? 'scan' : screen)
        pendingScreenRef.current = null
        const reconciled = reconcileJourney(adaptedMap, {
          screen: pending,
          currentId,
          destinationId,
          accessible,
          route,
          stepIndex,
        })
        setMap(adaptedMap)
        setCurrentId(reconciled.currentId)
        setDestinationId(reconciled.destinationId)
        setRoute(reconciled.route)
        setStepIndex(reconciled.stepIndex)
        setScreen(reconciled.screen)
        window.history.replaceState({ hwScreen: reconciled.screen }, '')
      })
      .catch(() => {
        if (!cancelled) setLoadError(true)
      })
    return () => {
      cancelled = true
    }
    // Intentionally omit journey fields: restore/reconcile runs once per hospital load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hospital, loadAttempt])

  useEffect(() => {
    mainRef.current?.focus()
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [screen, map])

useEffect(() => {
    if (skipPersistRef.current) {
      skipPersistRef.current = false
      return
    }

    if (screen === 'welcome') {
      clearNavigationSession()
      return
    }

    writeNavigationSession({
      screen,
      hospitalId: hospital?.id ?? null,
      previewHospitalId: previewHospital?.id ?? null,
      currentId,
      destinationId,
      accessible,
      route: route ? { path: route.path, distance: route.distance } : null,
      stepIndex,
    })
  }, [screen, hospital, previewHospital, currentId, destinationId, accessible, route, stepIndex])

  useEffect(() => {
    if (!map) return undefined
    const ids = new Set(map.nodes.map((node) => node.id))
    if ((screen === 'destination' || screen === 'route' || screen === 'arrival') && (!currentId || !ids.has(currentId))) {
      navigateTo('scan', { replace: true })
    } else if ((screen === 'route' || screen === 'arrival') && (!destinationId || !ids.has(destinationId))) {
      navigateTo(currentId && ids.has(currentId) ? 'destination' : 'scan', { replace: true })
    }
    return undefined
  }, [map, screen, currentId, destinationId])

  function navigateTo(next, { replace = false } = {}) {
    setNotice(null)
    setScreen(next)
    if (ignorePopRef.current) return
    if (replace) {
      window.history.replaceState({ hwScreen: next }, '')
    } else {
      window.history.pushState({ hwScreen: next }, '')
      historyDepthRef.current += 1
    }
  }

  function applyLogicalBack() {
    const prev = previousScreen(screen, { destinationId, previewHospital })
    setNotice(null)

    if (prev === 'welcome') {
      resetJourney()
      setMap(null)
      setHospital(null)
      setPreviewHospital(null)
      setLoadError(false)
      clearNavigationSession()
      navigateTo('welcome', { replace: true })
      return
    }

    if (prev === 'hospital' && (screen === 'scan' || screen === 'loading' || screen === 'overview')) {
      if (screen === 'loading' || screen === 'scan') {
        setMap(null)
        setHospital(null)
        setLoadError(false)
        resetJourney()
      }
      navigateTo('hospital', { replace: true })
      return
    }

    if (prev === 'overview' && screen === 'loading') {
      setMap(null)
      setHospital(null)
      setLoadError(false)
      resetJourney()
      navigateTo('overview', { replace: true })
      return
    }

    navigateTo(prev, { replace: true })
  }

  function requestBack() {
    if (historyDepthRef.current > 0) {
      window.history.back()
      return
    }
    applyLogicalBack()
  }

  useEffect(() => {
    function onPopState(event) {
      ignorePopRef.current = true
      historyDepthRef.current = Math.max(0, historyDepthRef.current - 1)
      const target = event.state?.hwScreen
      if (typeof target === 'string') {
        setNotice(null)
        if (target === 'welcome') {
          resetJourney()
          setMap(null)
          setHospital(null)
          setPreviewHospital(null)
          setLoadError(false)
          clearNavigationSession()
        }
        if ((target === 'hospital' || target === 'overview') && screen === 'loading') {
          setMap(null)
          setHospital(null)
          setLoadError(false)
          resetJourney()
        }
        setScreen(target)
      } else {
        applyLogicalBack()
      }
      queueMicrotask(() => {
        ignorePopRef.current = false
      })
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- popstate handler uses latest apply via closure refresh on screen changes
  }, [screen, destinationId, previewHospital])

  function resetJourney() {
    setCurrentId(null)
    setDestinationId(null)
    setRoute(null)
    setStepIndex(0)
    setNotice(null)
  }

  function handleSelectHospital(entry) {
    resetJourney()
    setMap(null)
    setLoadError(false)
    setHospital(null)
    setPreviewHospital(entry)
    navigateTo('overview')
  }

  function handleStartNavigation(entry) {
    if (!entry.navigationAvailable || !entry.loadMap) return
    resetJourney()
    setMap(null)
    setLoadError(false)
    pendingScreenRef.current = 'scan'
    setHospital(entry)
    navigateTo('loading', { replace: true })
  }

  function handleSwitchHospital() {
    resetJourney()
    setMap(null)
    setHospital(null)
    setLoadError(false)
    navigateTo('hospital')
  }

  function handleScan(code) {
    const id = resolveScan(map, code)
    if (!id) {
      setNotice({ text: 'This checkpoint is not on the hospital map. Try another location.', tone: 'info' })
      return
    }
    setNotice(null)
    if (!destinationId) {
      setCurrentId(id)
      navigateTo('destination')
      return
    }
    const result = classifyScan({ path: route?.path ?? [], stepIndex, currentId, destinationId, scannedId: id })
    setCurrentId(id)
    if (result === 'arrived') {
      navigateTo('arrival')
      return
    }
    if (result === 'advance') {
      setStepIndex(route.path.indexOf(id, stepIndex + 1))
    } else if (result === 'same') {
      setNotice({ text: `You are still at ${byId.get(id).name}. Scan the next checkpoint to continue.`, tone: 'info' })
    } else {
      const nextRoute = findRoute(map, id, destinationId, accessible)
      setRoute(nextRoute)
      setStepIndex(0)
      if (nextRoute) setNotice({ text: `Route updated from ${byId.get(id).name}. Follow the updated directions.`, tone: 'success' })
    }
    navigateTo('route')
  }

  function handleChooseDestination(id) {
    setDestinationId(id)
    setRoute(findRoute(map, currentId, id, accessible))
    setStepIndex(0)
    setNotice(null)
    navigateTo(id === currentId ? 'arrival' : 'route')
  }

  function handleToggleAccessible() {
    const next = !accessible
    setAccessible(next)
    setNotice(null)
    if (currentId && destinationId) {
      setRoute(findRoute(map, currentId, destinationId, next))
      setStepIndex(0)
    }
  }

  function handleRestart() {
    resetJourney()
    navigateTo('scan')
  }

  function changeScreen(next) {
    navigateTo(next)
  }

  if (screen === 'welcome') {
    return (
      <>
        <WelcomeScreen onGetStarted={() => navigateTo('hospital')} />
          {
            import.meta.env.DEV && (
              <button type = "button" onClick = {() => navigateTo('qrcodes')} className = "primary-button">
              ⓘ
              </button>
            )}
      
      
      </>
    )
  }
     
  
  if (screen === 'qrcodes') {
    return <QRCodePage onBack={requestBack} />
  }

  if (screen === 'hospital') {
    return (
      <div className="wayfinder-shell">
        <ShellHeader hospital={null} currentNode={null} onSwitchHospital={() => navigateTo('welcome')} />
        <main ref={mainRef} tabIndex={-1} aria-labelledby="screen-heading" className="flex flex-1 flex-col outline-none">
          <HospitalSelector
            hospitals={hospitals}
            onSelect={handleSelectHospital}
            onBack={requestBack}
          />
        </main>
        <ShellFooter />
      </div>
    )
  }

  if (screen === 'overview') {
    if (!previewHospital) {
      return (
        <div className="wayfinder-shell">
          <ShellHeader hospital={null} currentNode={null} onSwitchHospital={() => navigateTo('welcome')} />
          <main ref={mainRef} tabIndex={-1} aria-labelledby="screen-heading" className="flex flex-1 flex-col outline-none">
            <HospitalSelector hospitals={hospitals} onSelect={handleSelectHospital} onBack={requestBack} />
          </main>
          <ShellFooter />
        </div>
      )
    }
    return (
      <div className="wayfinder-shell">
        <ShellHeader
          hospital={previewHospital}
          currentNode={null}
          onSwitchHospital={() => navigateTo('hospital')}
        />
        <main ref={mainRef} tabIndex={-1} aria-labelledby="screen-heading" className="flex flex-1 flex-col outline-none">
          <HospitalOverview
            hospital={previewHospital}
            onBack={requestBack}
            onStartNavigation={handleStartNavigation}
          />
        </main>
        <ShellFooter />
      </div>
    )
  }

  if (screen === 'loading' || ((screen === 'scan' || screen === 'destination' || screen === 'route' || screen === 'arrival') && !map)) {
    return (
      <div className="wayfinder-shell">
        <ShellHeader hospital={hospital} currentNode={null} onSwitchHospital={handleSwitchHospital} />
        <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
          {loadError ? (
            <>
              <h1 id="screen-heading" className="screen-heading text-[24px]">
                The hospital map could not be loaded
              </h1>
              <p role="alert" className="inline-notice">
                Check your connection and try again.
              </p>
              <div className="flex flex-wrap justify-center gap-2.5">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    setHospital(null)
                    setLoadError(false)
                    navigateTo('hospital')
                  }}
                >
                  Choose another hospital
                </button>
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => {
                    setLoadError(false)
                    setLoadAttempt((attempt) => attempt + 1)
                  }}
                >
                  Try again
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex w-full max-w-sm flex-col items-center gap-4">
                <button
                  type="button"
                  className="icon-button self-start"
                  onClick={requestBack}
                  aria-label="Back"
                >
                  <ArrowLeft size={20} aria-hidden="true" />
                </button>
                <LoaderCircle size={32} className="animate-spin text-teal" aria-hidden="true" />
                <h1 id="screen-heading" className="screen-heading text-[24px]">
                  Loading {hospital?.name ?? 'hospital'}…
                </h1>
                <p role="status" className="text-sm text-inksoft">
                  Preparing the floor map and checkpoints.
                </p>
              </div>
            </>
          )}
        </main>
        <ShellFooter />
      </div>
    )
  }

  const byId = new Map(map.nodes.map((node) => [node.id, node]))
  const currentNode = byId.get(currentId)
  const destinationNode = byId.get(destinationId)
  const steps = route ? buildSteps(map, route.path, accessible) : []

  return (
    <div className="wayfinder-shell">
      <ShellHeader hospital={hospital} currentNode={currentNode} onSwitchHospital={handleSwitchHospital} />
      <main ref={mainRef} tabIndex={-1} aria-labelledby="screen-heading" className="flex flex-1 flex-col outline-none">
        {screen === 'scan' && (
          <QRScanner
            map={map}
            currentId={currentId}
            isInitial={!destinationId}
            route={route}
            stepIndex={stepIndex}
            notice={notice}
            onScan={handleScan}
            onBack={requestBack}
          />
        )}
        {screen === 'destination' && currentNode && (
          <DestinationPicker
            map={map}
            currentNode={currentNode}
            accessible={accessible}
            onToggleAccessible={handleToggleAccessible}
            onChoose={handleChooseDestination}
            onBack={requestBack}
          />
        )}
        {screen === 'route' && currentNode && destinationNode && (
          <div className="nav-layout">
            <HospitalMap
              map={map}
              currentNode={currentNode}
              destinationNode={destinationNode}
              route={route}
              stepIndex={stepIndex}
            />
            <RouteDirections
              map={map}
              currentNode={currentNode}
              destinationNode={destinationNode}
              route={route}
              steps={steps}
              stepIndex={stepIndex}
              notice={notice}
              accessible={accessible}
              onToggleAccessible={handleToggleAccessible}
              onChangeDestination={() => changeScreen('destination')}
              onScanNext={() => changeScreen('scan')}
              onBack={requestBack}
            />
          </div>
        )}
        {screen === 'arrival' && destinationNode && (
          <ArrivalScreen
            destinationNode={destinationNode}
            journey={
              route
                ? {
                    distance: route.distance,
                    steps: steps.length,
                    walkingDistance: walkingDistanceMetres(map, route.path, accessible),
                    includesLift: routeIncludesLift(map, route.path, accessible),
                  }
                : null
            }
            onRestart={handleRestart}
            onBack={requestBack}
          />
        )}
      </main>
      <ShellFooter />
    </div>
  )
}

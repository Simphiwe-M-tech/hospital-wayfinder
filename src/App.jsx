import { useEffect, useRef, useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import { findRoute } from './algorithms/astar.js'
import { buildSteps, floorLabel } from './utils/directions.js'
import { classifyScan } from './utils/reroute.js'
import { hospitals } from './lib/hospitals.js'
import { adaptHospitalMap, resolveScan } from './lib/mapAdapter.js'
import BrandMark from './components/BrandMark.jsx'
import WelcomeScreen from './components/WelcomeScreen.jsx'
import HospitalSelector from './components/HospitalSelector.jsx'
import QRScanner from './components/QRScanner.jsx'
import DestinationPicker from './components/DestinationPicker.jsx'
import HospitalMap from './components/HospitalMap.jsx'
import RouteDirections from './components/RouteDirections.jsx'
import ArrivalScreen from './components/ArrivalScreen.jsx'
import QRCodePage from "./components/QRcodePage.jsx";
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
      Demo prototype · Map and distances are placeholder data · Uses your camera to scan real QR
      codes; tiles are a fallback if the camera is unavailable.
    </footer>
  )
}

export default function App() {
  const [hospital, setHospital] = useState(null)
  const [map, setMap] = useState(null)
  const [loadError, setLoadError] = useState(false)
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [screen, setScreen] = useState('welcome')
  const [currentId, setCurrentId] = useState(null)
  const [destinationId, setDestinationId] = useState(null)
  const [accessible, setAccessible] = useState(false)
  const [route, setRoute] = useState(null)
  const [stepIndex, setStepIndex] = useState(0)
  const [notice, setNotice] = useState(null)
  const mainRef = useRef(null)

  useEffect(() => {
    if (!hospital) return undefined
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
        setMap(adaptedMap)
        setScreen('scan')
      })
      .catch(() => {
        if (!cancelled) setLoadError(true)
      })
    return () => {
      cancelled = true
    }
  }, [hospital, loadAttempt])

  useEffect(() => {
    mainRef.current?.focus()
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [screen, map])

  /*if (screen === 'welcome') {
    return <WelcomeScreen onGetStarted={() => setScreen('hospital')} />
  }*/
 if (screen === 'welcome') {
  return (
    <>
      <WelcomeScreen onGetStarted={() => setScreen('hospital')} />

      <button
        type="button"
        onClick={() => setScreen('qrcodes')}
        className="primary-button"
      >
        Generate QR Codes
      </button>
    </>
  )
}
if (screen === 'qrcodes') {
  return <QRCodePage />
}

  if (screen === 'hospital') {
    return (
      <div className="wayfinder-shell">
        <ShellHeader hospital={hospital} currentNode={null} onSwitchHospital={() => setScreen('welcome')} />
        <main ref={mainRef} tabIndex={-1} aria-labelledby="screen-heading" className="flex flex-1 flex-col outline-none">
          <HospitalSelector
            hospitals={hospitals}
            onSelect={handleSelectHospital}
            onBack={() => setScreen('welcome')}
          />
        </main>
        <ShellFooter />
      </div>
    )
  }

  if (screen === 'loading') {
    return (
      <div className="wayfinder-shell">
        <ShellHeader hospital={hospital} currentNode={null} onSwitchHospital={() => {}} />
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
                    setScreen('hospital')
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
              <LoaderCircle size={32} className="animate-spin text-teal" aria-hidden="true" />
              <h1 id="screen-heading" className="screen-heading text-[24px]">
                Loading {hospital?.name ?? 'hospital'}…
              </h1>
              <p role="status" className="text-sm text-inksoft">
                Preparing the floor map and checkpoints.
              </p>
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
    setHospital(entry)
    setScreen('loading')
  }

  function handleSwitchHospital() {
    resetJourney()
    setMap(null)
    setHospital(null)
    setLoadError(false)
    setScreen('hospital')
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
      setScreen('destination')
      return
    }
    const result = classifyScan({ path: route?.path ?? [], stepIndex, currentId, destinationId, scannedId: id })
    setCurrentId(id)
    if (result === 'arrived') {
      setScreen('arrival')
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
    setScreen('route')
  }

  function handleChooseDestination(id) {
    setDestinationId(id)
    setRoute(findRoute(map, currentId, id, accessible))
    setStepIndex(0)
    setNotice(null)
    setScreen(id === currentId ? 'arrival' : 'route')
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
    setScreen('scan')
  }

  function changeScreen(next) {
    setNotice(null)
    setScreen(next)
  }

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
            onBack={destinationId ? () => changeScreen('route') : () => changeScreen('hospital')}
          />
        )}
        {screen === 'destination' && (
          <DestinationPicker
            map={map}
            currentNode={currentNode}
            accessible={accessible}
            onToggleAccessible={handleToggleAccessible}
            onChoose={handleChooseDestination}
            onBack={() => changeScreen(destinationId ? 'route' : 'scan')}
          />
        )}
        {screen === 'route' && (
          <div className="nav-layout">
            <HospitalMap
              map={map}
              currentNode={currentNode}
              destinationNode={destinationNode}
              route={route}
              stepIndex={stepIndex}
            />
            <RouteDirections
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
            />
          </div>
        )}
        {screen === 'arrival' && (
          <ArrivalScreen
            destinationNode={destinationNode}
            journey={route ? { distance: route.distance, steps: steps.length } : null}
            onRestart={handleRestart}
          />
        )}
      </main>
      <ShellFooter />
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { findRoute } from './algorithms/astar.js'
import { buildSteps, floorLabel } from './utils/directions.js'
import { classifyScan } from './utils/reroute.js'
import { Icon } from './components/Icon.jsx'
import AccessibleToggle from './components/AccessibleToggle.jsx'
import QRScanner from './components/QRScanner.jsx'
import DestinationPicker from './components/DestinationPicker.jsx'
import RouteDirections from './components/RouteDirections.jsx'
import ArrivalScreen from './components/ArrivalScreen.jsx'
import './App.css'

export default function App() {
  const [map, setMap] = useState(null)
  const [loadError, setLoadError] = useState(false)
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [screen, setScreen] = useState('scan')
  const [currentId, setCurrentId] = useState(null)
  const [destinationId, setDestinationId] = useState(null)
  const [accessible, setAccessible] = useState(false)
  const [route, setRoute] = useState(null)
  const [stepIndex, setStepIndex] = useState(0)
  const [notice, setNotice] = useState('')
  const mainRef = useRef(null)

  useEffect(() => {
    const controller = new AbortController()
    fetch(`${import.meta.env.BASE_URL}hospital-map.json`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('Map request failed')
        return response.json()
      })
      .then(setMap)
      .catch(() => {
        if (!controller.signal.aborted) setLoadError(true)
      })
    return () => controller.abort()
  }, [loadAttempt])

  useEffect(() => {
    mainRef.current?.focus()
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [screen, map])

  if (!map) {
    return (
      <main className="wayfinder-shell items-center justify-center gap-4 p-6 text-center">
        <h1 className="screen-heading">Hospital Wayfinder</h1>
        {loadError ? (
          <>
            <p role="alert" className="inline-notice">The hospital map could not be loaded. Check your connection and try again.</p>
            <button type="button" className="primary-button" onClick={() => { setLoadError(false); setLoadAttempt((attempt) => attempt + 1) }}>Try again</button>
          </>
        ) : <p role="status" className="text-sm text-inksoft">Loading the demo hospital map…</p>}
      </main>
    )
  }

  const byId = new Map(map.nodes.map((node) => [node.id, node]))
  const currentNode = byId.get(currentId)
  const destinationNode = byId.get(destinationId)
  const steps = route ? buildSteps(map, route.path, accessible) : []

  function handleScan(id) {
    if (!byId.has(id)) {
      setNotice('This checkpoint is not on the hospital map. Try another location.')
      return
    }
    setNotice('')
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
      setNotice(`You are still at ${byId.get(id).name}. Scan the next checkpoint to continue.`)
    } else {
      const nextRoute = findRoute(map, id, destinationId, accessible)
      setRoute(nextRoute)
      setStepIndex(0)
      if (nextRoute) setNotice(`Route updated from ${byId.get(id).name}. Follow the updated directions.`)
    }
    setScreen('route')
  }

  function handleChooseDestination(id) {
    setDestinationId(id)
    setRoute(findRoute(map, currentId, id, accessible))
    setStepIndex(0)
    setNotice('')
    setScreen(id === currentId ? 'arrival' : 'route')
  }

  function handleToggleAccessible() {
    const next = !accessible
    setAccessible(next)
    setNotice('')
    if (currentId && destinationId) {
      setRoute(findRoute(map, currentId, destinationId, next))
      setStepIndex(0)
    }
  }

  function handleRestart() {
    setCurrentId(null)
    setDestinationId(null)
    setRoute(null)
    setStepIndex(0)
    setNotice('')
    setScreen('scan')
  }

  function changeScreen(next) {
    setNotice('')
    setScreen(next)
  }

  return (
    <div className="wayfinder-shell">
      <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div className="flex items-center gap-2 text-base font-extrabold tracking-tight">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal text-white"><Icon name="mark" className="h-4 w-4" /></span>
          Wayfinder
        </div>
        <p className="max-w-[180px] text-right text-xs leading-relaxed text-inksoft" aria-live="polite">
          {currentNode ? `${currentNode.name} · ${floorLabel(currentNode.floor)}` : 'Location not set'}
        </p>
      </header>
      <AccessibleToggle accessible={accessible} onToggle={handleToggleAccessible} />
      <main ref={mainRef} tabIndex={-1} aria-labelledby="screen-heading" className="flex flex-1 flex-col px-5 py-6 outline-none">
        {screen === 'scan' && <QRScanner map={map} currentId={currentId} isInitial={!destinationId} notice={notice} onScan={handleScan} onBack={destinationId ? () => changeScreen('route') : undefined} />}
        {screen === 'destination' && <DestinationPicker map={map} currentNode={currentNode} onChoose={handleChooseDestination} onBack={() => changeScreen(destinationId ? 'route' : 'scan')} />}
        {screen === 'route' && <RouteDirections currentNode={currentNode} destinationNode={destinationNode} route={route} steps={steps} stepIndex={stepIndex} notice={notice} accessible={accessible} onChangeDestination={() => changeScreen('destination')} onScanNext={() => changeScreen('scan')} />}
        {screen === 'arrival' && <ArrivalScreen destinationNode={destinationNode} onRestart={handleRestart} />}
      </main>
      <footer className="border-t border-line px-5 py-4 text-center text-xs leading-relaxed text-inksoft">
        Hospital Wayfinder MVP · Demo map and distances<br />QR scans are simulated by tapping a tile.
      </footer>
    </div>
  )
}

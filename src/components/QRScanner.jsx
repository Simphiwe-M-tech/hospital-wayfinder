import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, ChevronDown, MapPin, QrCode } from 'lucide-react'
import jsQR from 'jsqr'
import { floorLabel } from '../utils/directions.js'
import { floorList } from '../lib/mapAdapter.js'
import QrTile from './QrTile.jsx'

// Once a code is decoded we keep reporting it as "new" until either a different
// code is seen or this cooldown elapses — otherwise every animation frame while
// the same label sits in frame would re-trigger onScan.
const RESCAN_COOLDOWN_MS = 2000

// Real camera-based QR scanning. Requests the rear camera, decodes frames with
// jsQR, and reports decoded text upward via onDetect (App.jsx resolves that
// string against each node's qrCode, same path the demo tiles already use).
function CameraScanner({ onDetect }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const rafRef = useRef(null)
  const lastRef = useRef({ code: null, time: 0 })
  const onDetectRef = useRef(onDetect)
  const [status, setStatus] = useState('starting') // starting | ready | denied | unsupported | error

  useEffect(() => {
    onDetectRef.current = onDetect
  }, [onDetect])

  useEffect(() => {
    let cancelled = false
    let stream = null

    function tick() {
      const video = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
        rafRef.current = requestAnimationFrame(tick)
        return
      }
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const context = canvas.getContext('2d', { willReadFrequently: true })
      context.drawImage(video, 0, 0, canvas.width, canvas.height)
      const frame = context.getImageData(0, 0, canvas.width, canvas.height)
      const result = jsQR(frame.data, frame.width, frame.height)
      if (result?.data) {
        const now = Date.now()
        const last = lastRef.current
        if (result.data !== last.code || now - last.time > RESCAN_COOLDOWN_MS) {
          lastRef.current = { code: result.data, time: now }
          onDetectRef.current(result.data)
        }
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus('unsupported')
        return
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
        if (cancelled) return
        setStatus('ready')
        rafRef.current = requestAnimationFrame(tick)
      } catch (error) {
        if (cancelled) return
        setStatus(error?.name === 'NotAllowedError' ? 'denied' : 'error')
      }
    }

    start()

    return () => {
      cancelled = true
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      stream?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  const statusMessage = {
    starting: 'Starting camera…',
    denied: 'Camera access was denied. Allow camera access for this site in your browser settings, or tap a checkpoint below.',
    unsupported: 'Camera scanning is not supported on this browser. Tap a checkpoint below instead.',
    error: 'Could not start the camera. Tap a checkpoint below instead.',
  }[status]

  return (
    <div className="card overflow-hidden">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-ink">
        <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
        <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
        {status === 'ready' && (
          <div
            className="pointer-events-none absolute inset-8 rounded-2xl border-2 border-white/80"
            aria-hidden="true"
          />
        )}
        {statusMessage && (
          <div
            role={status === 'denied' || status === 'error' ? 'alert' : 'status'}
            className="absolute inset-0 flex items-center justify-center bg-ink/85 px-6 text-center text-[13px] text-white"
          >
            {statusMessage}
          </div>
        )}
      </div>
      <p className="px-4 py-3 text-[12px] leading-relaxed text-inksoft">
        Point the camera at a checkpoint&apos;s QR code — it scans automatically, no need to tap anything.
      </p>
    </div>
  )
}

function ManualLocationPicker({ map, onPick }) {
  const [open, setOpen] = useState(false)
  const floors = floorList(map)

  return (
    <div className="card overflow-hidden">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5"
        onClick={() => setOpen((wasOpen) => !wasOpen)}
        aria-expanded={open}
      >
        <span className="flex items-center gap-2.5 text-[13.5px] font-semibold text-ink">
          <MapPin size={16} className="shrink-0 text-teal" aria-hidden="true" />
          Simulate a map location
        </span>
        <ChevronDown
          size={17}
          className={`shrink-0 text-inksoft transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div className="border-t border-line pb-3">
          <p className="px-4 pt-3 text-[12px] leading-relaxed text-inksoft">
            For this demo, select any point on the map — including rooms without
            a QR checkpoint.
          </p>
          {floors.map((floor) => (
            <div key={floor} className="px-2 pt-2">
              <p className="px-2 pb-1 pt-1.5 text-[10.5px] font-bold uppercase tracking-[0.08em] text-inksoft">
                {floorLabel(floor)}
              </p>
              {map.nodes
                .filter((node) => node.floor === floor)
                .map((node) => (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => onPick(node.id)}
                    className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-teal-soft/60"
                  >
                    <span className="text-[13.5px] text-ink">{node.name}</span>
                    <span className="shrink-0 font-mono text-[10px] tracking-tight text-inksoft/70">
                      {node.qrCode ?? 'no QR'}
                    </span>
                  </button>
                ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function QRScanner({ map, currentId, isInitial, route, stepIndex, notice, onScan, onBack }) {
  const floors = floorList(map)
  const [showTiles, setShowTiles] = useState(false)
  const handleDetect = useCallback((code) => onScan(code), [onScan])

  const highlights = useMemo(() => {
    const upcoming = new Map()
    if (!route) return upcoming
    for (const id of route.path.slice(stepIndex + 1)) {
      const node = map.nodes.find((candidate) => candidate.id === id)
      if (!node?.qrCode || upcoming.has(id)) continue
      if (upcoming.size === 0) upcoming.set(id, 'next')
      else upcoming.set(id, 'upcoming')
    }
    return upcoming
  }, [map, route, stepIndex])

  const next = route ? [...highlights].find(([, kind]) => kind === 'next') : null
  const nextNode = next ? map.nodes.find((node) => node.id === next[0]) : null

  return (
    <div className="app-frame">
      <div className="flex items-center gap-2">
        {onBack && (
          <button
            type="button"
            className="icon-button -ml-3 shrink-0"
            onClick={onBack}
            aria-label={isInitial ? 'Back to hospital selection' : 'Back to directions'}
          >
            <ArrowLeft size={20} aria-hidden="true" />
          </button>
        )}
        <div className="min-w-0">
          <p className="screen-eyebrow">
            {isInitial ? 'Step 2 of 4 · Set your location' : 'Scan a checkpoint'}
          </p>
          <h1 id="screen-heading" className="screen-heading mt-1 text-[26px]">
            {isInitial ? 'Where are you starting?' : 'Scan the nearest checkpoint'}
          </h1>
        </div>
      </div>

      <p className="screen-sub -mt-2">
        {isInitial
          ? 'Scan the QR checkpoint nearest to you, or tap it below if you can\u2019t use the camera.'
          : 'Scan the checkpoint you\u2019ve reached and we\u2019ll update the route from there.'}
      </p>

      {notice && (
        <p role="status" className="inline-notice" data-tone={notice.tone ?? 'info'}>
          {notice.text}
        </p>
      )}

      {nextNode && (
        <p className="inline-notice" data-tone="success">
          <span>
            Next checkpoint: <strong>{nextNode.name}</strong> — look for{' '}
            <span className="font-mono text-[12.5px]">{nextNode.qrCode}</span>
          </span>
        </p>
      )}

      <CameraScanner onDetect={handleDetect} />

      <div className="card overflow-hidden">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 px-4 py-3.5"
          onClick={() => setShowTiles((wasShown) => !wasShown)}
          aria-expanded={showTiles}
        >
          <span className="flex items-center gap-2.5 text-[13.5px] font-semibold text-ink">
            <QrCode size={16} className="shrink-0 text-teal" aria-hidden="true" />
            Camera not working? Tap a checkpoint instead
          </span>
          <ChevronDown
            size={17}
            className={`shrink-0 text-inksoft transition-transform ${showTiles ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </button>
        {showTiles && (
          <div className="border-t border-line p-4 pt-3">
            {floors.map((floor) => {
              const checkpoints = map.nodes.filter((node) => node.floor === floor && node.qrCode)
              if (checkpoints.length === 0) return null
              return (
                <section key={floor} className="mb-3 last:mb-0" aria-label={floorLabel(floor)}>
                  <h2 className="mb-3 flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-inksoft">
                    {floorLabel(floor)}
                    <span className="h-px flex-1 bg-line" aria-hidden="true" />
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    {checkpoints.map((node) => (
                      <QrTile
                        key={node.id}
                        node={node}
                        current={node.id === currentId}
                        highlight={highlights.get(node.id)}
                        onScan={onScan}
                      />
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        )}
      </div>

      <ManualLocationPicker map={map} onPick={onScan} />
    </div>
  )
}

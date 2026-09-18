import { ArrowLeft, Building2, Layers, MapPin, Navigation, QrCode } from 'lucide-react'
import HospitalPreview from './HospitalPreview.jsx'

const STATS = [
  { key: 'floors', icon: Layers, label: 'Floors' },
  { key: 'destinations', icon: MapPin, label: 'Destinations' },
  { key: 'checkpoints', icon: QrCode, label: 'QR checkpoints' },
]

export default function HospitalOverview({ hospital, onBack, onStartNavigation }) {
  const canNavigate = hospital.navigationAvailable && Boolean(hospital.loadMap)

  return (
    <div className="app-frame hospital-overview">
      <div className="hospital-overview-intro">
        <button
          type="button"
          className="icon-button -ml-3 shrink-0"
          onClick={onBack}
          aria-label="Back to hospital list"
        >
          <ArrowLeft size={20} aria-hidden="true" />
        </button>
        <div className="min-w-0">
          <p className="screen-eyebrow">Hospital overview</p>
          <h1 id="screen-heading" className="screen-heading mt-1 text-[26px]">
            {hospital.name}
          </h1>
        </div>
      </div>

      <figure className="hospital-overview-figure">
        <div className="hospital-overview-media">
          <HospitalPreview hospital={hospital} />
          <span className="hospital-card-badge">{hospital.badge}</span>
        </div>
        <figcaption className="hospital-overview-caption">
          {hospital.statsSource === 'map'
            ? 'Live demo floor plan — the only hospital in this demo with mapped data.'
            : 'Illustrative preview image and counts — not a real hospital.'}
        </figcaption>
      </figure>

      <p className="hospital-overview-description">{hospital.tagline}</p>

      {hospital.stats && (
        <div className="hospital-overview-stats">
          {STATS.map(({ key, icon: StatIcon, label }) => (
            <div key={key} className="hospital-stat">
              <StatIcon size={16} className="text-teal" aria-hidden="true" />
              <span className="hospital-stat-value">{hospital.stats[key]}</span>
              <span className="hospital-stat-label">{label}</span>
            </div>
          ))}
        </div>
      )}

      <p className="hospital-overview-source">
        {hospital.statsSource === 'map'
          ? 'Counts are derived from the mapped demo floor plan.'
          : 'Counts are illustrative preview data; this hospital has no mapped floor plan yet.'}
      </p>

      {canNavigate ? (
        <button
          type="button"
          className="primary-button w-full text-[15px]"
          onClick={() => onStartNavigation(hospital)}
        >
          <Navigation size={17} aria-hidden="true" />
          Start navigation
        </button>
      ) : (
        <p className="inline-notice" data-tone="info">
          <Building2 size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>
            <strong className="font-semibold">Preview hospital</strong> — navigation is not
            available yet.
          </span>
        </p>
      )}
    </div>
  )
}

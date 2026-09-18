import { useMemo, useState } from 'react'
import { ArrowLeft, ChevronRight, Layers, MapPin, QrCode, Search, X } from 'lucide-react'
import HospitalPreview from './HospitalPreview.jsx'

const STAT_ICONS = { floors: Layers, destinations: MapPin, checkpoints: QrCode }

export default function HospitalSelector({ hospitals, onSelect, onBack }) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return hospitals
    return hospitals.filter((hospital) => hospital.name.toLowerCase().includes(q))
  }, [hospitals, query])

  const liveCount = hospitals.filter((hospital) => hospital.navigationAvailable).length
  const availability = `${hospitals.length} hospitals in this demo · ${liveCount} with a working map · ${hospitals.length - liveCount} preview only.`

  return (
    <div className="app-frame hospital-selector">
      <div className="hospital-selector-intro">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="icon-button -ml-3 shrink-0"
            onClick={onBack}
            aria-label="Back to welcome screen"
          >
            <ArrowLeft size={20} aria-hidden="true" />
          </button>
          <div className="min-w-0">
            <p className="screen-eyebrow">Select a hospital</p>
            <h1 id="screen-heading" className="screen-heading mt-1 text-[26px]">
              Where are you headed?
            </h1>
          </div>
        </div>

        <p className="screen-sub">
          Pick a hospital to see its overview. Navigation is available where a floor
          map has been mapped; preview hospitals show illustrative data only.
        </p>

        <div className="relative">
          <Search
            size={17}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-inksoft"
            aria-hidden="true"
          />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search hospitals"
            aria-label="Search hospitals by name"
            enterKeyHint="search"
            className="h-11 w-full rounded-full border border-line bg-white pl-11 pr-11 text-[14.5px] text-ink outline-none placeholder:text-inksoft/70 focus:border-teal"
          />
          {query && (
            <button
              type="button"
              className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-inksoft transition-colors hover:bg-teal-soft hover:text-teal"
              onClick={() => setQuery('')}
              aria-label="Clear search"
            >
              <X size={15} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      <div className="hospital-selector-results">
        {filtered.length > 0 ? (
          <ul className="flex flex-col gap-4">
            {filtered.map((hospital) => (
              <li key={hospital.id}>
                <button
                  type="button"
                  className="card hospital-card group"
                  onClick={() => onSelect(hospital)}
                >
                  <span className="hospital-card-media">
                    <HospitalPreview hospital={hospital} />
                    <span className="hospital-card-badge">{hospital.badge}</span>
                  </span>

                  <span className="hospital-card-body">
                    <span className="flex items-start justify-between gap-3">
                      <span className="min-w-0">
                        <span className="block truncate text-[15.5px] font-bold leading-tight text-ink">
                          {hospital.name}
                        </span>
                        <span className="mt-1 block text-[11px] font-semibold text-inksoft">
                          {hospital.statsSource === 'map'
                            ? 'Live demo map'
                            : 'Preview only — no map'}
                        </span>
                      </span>
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-soft text-teal transition-colors group-hover:bg-teal group-hover:text-white">
                        <ChevronRight size={18} aria-hidden="true" />
                      </span>
                    </span>

                    {hospital.tagline && (
                      <span className="block text-[13.5px] leading-relaxed text-inksoft">
                        {hospital.tagline}
                      </span>
                    )}

                    {hospital.stats && (
                      <span className="hospital-card-stats">
                        {Object.entries(STAT_ICONS).map(([key, StatIcon]) => (
                          <span key={key} className="flex items-center gap-1.5">
                            <StatIcon size={13} aria-hidden="true" />
                            {hospital.stats[key]}{' '}
                            {key === 'checkpoints' ? 'QR checkpoints' : key}
                          </span>
                        ))}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="card flex flex-col items-center gap-3 px-4 py-8 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-soft text-teal">
              <Search size={20} aria-hidden="true" />
            </span>
            <p className="text-[14px] font-semibold text-ink">No hospitals found. Try another name.</p>
            <button type="button" className="secondary-button" onClick={() => setQuery('')}>
              Clear search
            </button>
          </div>
        )}
      </div>

      <p className="hospital-selector-footer text-center text-[12px] leading-relaxed text-inksoft">
        {availability}
      </p>
    </div>
  )
}

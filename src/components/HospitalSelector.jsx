import { useMemo, useState } from 'react'
import { ArrowLeft, Building2, ChevronRight, Layers, MapPin, QrCode, Search, X } from 'lucide-react'

export default function HospitalSelector({ hospitals, onSelect, onBack }) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return hospitals
    return hospitals.filter((hospital) =>
      `${hospital.name} ${hospital.tagline ?? ''}`.toLowerCase().includes(q),
    )
  }, [hospitals, query])

  const availability = `${hospitals.length} hospital${hospitals.length === 1 ? ' is' : 's are'} available in this demo.`

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
          Pick a hospital to load its floor map. Your location is set by scanning
          a QR checkpoint once you are inside.
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
            aria-label="Search hospitals"
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
          <ul className="flex flex-col gap-3">
            {filtered.map((hospital) => (
              <li key={hospital.id}>
                <button
                  type="button"
                  className="card group flex w-full flex-col gap-3 p-4 text-left transition-colors hover:border-teal/50"
                  onClick={() => onSelect(hospital)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-soft text-teal">
                        <Building2 size={22} strokeWidth={1.8} aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[15.5px] font-bold leading-tight text-ink">
                          {hospital.name}
                        </p>
                        {hospital.badge && (
                          <span className="mt-1 inline-block rounded-full bg-amber-soft px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-amber-text">
                            {hospital.badge}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-soft text-teal transition-colors group-hover:bg-teal group-hover:text-white">
                      <ChevronRight size={18} aria-hidden="true" />
                    </span>
                  </div>
                  {hospital.tagline && (
                    <p className="text-[13.5px] leading-relaxed text-inksoft">{hospital.tagline}</p>
                  )}
                  {hospital.stats && (
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 border-t border-line pt-3 text-[12px] text-inksoft">
                      <span className="flex items-center gap-1.5">
                        <Layers size={13} aria-hidden="true" />
                        {hospital.stats.floors} floors
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin size={13} aria-hidden="true" />
                        {hospital.stats.destinations} destinations
                      </span>
                      <span className="flex items-center gap-1.5">
                        <QrCode size={13} aria-hidden="true" />
                        {hospital.stats.checkpoints} QR checkpoints
                      </span>
                    </div>
                  )}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="card flex flex-col items-center gap-3 px-4 py-8 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-soft text-teal">
              <Search size={20} aria-hidden="true" />
            </span>
            <p className="text-[14px] font-semibold text-ink">
              No hospitals match “{query.trim()}”.
            </p>
            <button type="button" className="secondary-button" onClick={() => setQuery('')}>
              Clear search
            </button>
          </div>
        )}
      </div>

      <p className="hospital-selector-footer text-center text-[12px] leading-relaxed text-inksoft">
        {availability} The registry is ready for more.
      </p>
    </div>
  )
}

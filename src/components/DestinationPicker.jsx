import { useMemo, useState } from 'react'
import {
  ArrowLeft,
  Check,
  DoorClosed,
  DoorOpen,
  LocateFixed,
  MapPin,
  Navigation,
  Search,
  Toilet,
  X,
} from 'lucide-react'
import { floorLabel } from '../utils/directions.js'
import { floorList } from '../lib/mapAdapter.js'
import AccessibleToggle from './AccessibleToggle.jsx'

const TYPE_ICONS = { entrance: DoorOpen, room: DoorClosed, bathroom: Toilet }

export default function DestinationPicker({
  map,
  currentNode,
  accessible,
  onToggleAccessible,
  onChoose,
  onBack,
  backAriaLabel = 'Back to your location',
}) {
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState(null)

  const byId = useMemo(() => new Map(map.nodes.map((node) => [node.id, node])), [map])
  const destinations = useMemo(
    () => map.destinations.map((id) => byId.get(id)).filter(Boolean),
    [map, byId],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? destinations.filter((node) => node.name.toLowerCase().includes(q)) : destinations
  }, [destinations, query])

  const floors = floorList(map)
  const selectedNode = selectedId ? byId.get(selectedId) : null

  return (
    <div className="app-frame destination-picker">
      <div className="destination-picker-intro">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              type="button"
              className="icon-button -ml-3 shrink-0"
              onClick={onBack}
              aria-label={backAriaLabel}
            >
              <ArrowLeft size={20} aria-hidden="true" />
            </button>
          )}
          <div className="min-w-0">
            <p className="screen-eyebrow">Step 3 of 4 · Destination</p>
            <h1 id="screen-heading" className="screen-heading mt-1 text-[26px]">
              Where do you need to go?
            </h1>
          </div>
        </div>

        <p className="screen-sub">
          Choose where you are heading. We will guide you there turn by turn.
        </p>

        <div className="card flex items-center gap-3 px-4 py-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-soft text-teal">
            <LocateFixed size={17} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-inksoft">
              Starting from
            </p>
            <p className="truncate text-[14px] font-bold text-ink">
              {currentNode.name} · {floorLabel(currentNode.floor)}
            </p>
          </div>
        </div>

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
            placeholder="Search destinations"
            aria-label="Search destinations"
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

      <div className="destination-picker-layout">
        <div className="destination-picker-list">
          {filtered.length > 0 ? (
            floors.map((floor) => {
              const options = filtered.filter((node) => node.floor === floor)
              if (options.length === 0) return null
              return (
                <section key={floor} aria-label={`${floorLabel(floor)} destinations`}>
                  <h2 className="mb-3 flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-inksoft">
                    {floorLabel(floor)}
                    <span className="h-px flex-1 bg-line" aria-hidden="true" />
                  </h2>
                  <div className="flex flex-col gap-2">
                    {options.map((node) => {
                      const selected = node.id === selectedId
                      const TypeIcon = TYPE_ICONS[node.type] ?? MapPin
                      return (
                        <button
                          key={node.id}
                          type="button"
                          onClick={() => setSelectedId(node.id)}
                          aria-pressed={selected}
                          className={`flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition ${
                            selected
                              ? 'border-teal bg-teal-soft/50'
                              : 'border-line bg-white hover:border-teal/50'
                          }`}
                        >
                          <span
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                              selected ? 'bg-teal text-white' : 'bg-teal-soft text-teal'
                            }`}
                          >
                            <TypeIcon size={19} strokeWidth={1.8} aria-hidden="true" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[14.5px] font-bold text-ink">
                              {node.name}
                            </span>
                            <span className="block text-[12px] text-inksoft">
                              {floorLabel(node.floor)}
                              {node.id === currentNode.id ? ' · You are here' : ''}
                            </span>
                          </span>
                          <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition ${
                              selected ? 'border-teal bg-teal text-white' : 'border-line'
                            }`}
                            aria-hidden="true"
                          >
                            {selected && <Check size={14} strokeWidth={3} />}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </section>
              )
            })
          ) : (
            <div className="card flex flex-col items-center gap-3 px-4 py-8 text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-soft text-teal">
                <Search size={20} aria-hidden="true" />
              </span>
              <p className="text-[14px] font-semibold text-ink">
                No destinations match “{query.trim()}”.
              </p>
              <button type="button" className="secondary-button" onClick={() => setQuery('')}>
                Clear search
              </button>
            </div>
          )}
        </div>

        <div className="destination-summary">
          <div className="card flex flex-col gap-4 p-4 shadow-[0_18px_44px_-24px_rgba(20,38,43,0.45)]">
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-soft text-teal">
                  <LocateFixed size={15} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-inksoft">From</p>
                  <p className="truncate text-[13.5px] font-bold text-ink">{currentNode.name}</p>
                </div>
              </div>
              <div className="ml-4 h-4 w-px bg-line" aria-hidden="true" />
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-soft text-amber-text">
                  <MapPin size={15} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-inksoft">To</p>
                  <p className="truncate text-[13.5px] font-bold text-ink">
                    {selectedNode ? selectedNode.name : 'Select a destination above'}
                  </p>
                </div>
              </div>
            </div>

            {selectedNode && selectedNode.id === currentNode.id && (
              <p className="inline-notice" data-tone="info">
                You are already at this location.
              </p>
            )}

            <div className="border-t border-line pt-3.5">
              <AccessibleToggle accessible={accessible} onToggle={onToggleAccessible} />
            </div>

            <button
              type="button"
              className="primary-button w-full text-[15px]"
              disabled={!selectedNode}
              onClick={() => onChoose(selectedId)}
            >
              <Navigation size={17} aria-hidden="true" />
              Get directions
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

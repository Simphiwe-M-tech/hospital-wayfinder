import { useState } from 'react'
import { floorLabel } from '../utils/directions.js'

export default function DestinationPicker({ map, currentNode, onChoose, onBack }) {
  const [query, setQuery] = useState('')
  const byId = new Map(map.nodes.map((node) => [node.id, node]))
  const options = map.destinations.map((id) => byId.get(id))
    .filter((node) => node.name.toLowerCase().includes(query.trim().toLowerCase()))

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs font-semibold text-inksoft">Step 2 of 3 · Destination</p>
      <h1 id="screen-heading" className="screen-heading">Where are you headed?</h1>
      <p className="text-sm leading-relaxed text-inksoft">
        You are at <strong>{currentNode.name}</strong>. Choose a destination for step-by-step directions.
      </p>
      <div>
        <label htmlFor="destination-search" className="mb-2 block text-sm font-semibold">Search destinations</label>
        <input
          id="destination-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Try Radiology or Pharmacy"
          className="min-h-11 w-full rounded-xl border border-line bg-[#fbfcfd] px-3.5 py-2.5 text-base"
        />
      </div>
      <div className="flex flex-col gap-2">
        {options.map((node) => (
          <button
            key={node.id}
            type="button"
            onClick={() => onChoose(node.id)}
            className="flex items-center justify-between gap-3 rounded-xl border border-line border-l-[3px] border-l-teal px-3.5 py-3 text-left transition hover:bg-tealsoft"
          >
            <span>
              <span className="block text-sm font-bold">{node.name}</span>
              <span className="block text-xs text-inksoft">{floorLabel(node.floor)}{node.id === currentNode.id ? ' · You are here' : ''}</span>
            </span>
            <span aria-hidden="true" className="text-teal">→</span>
          </button>
        ))}
        {options.length === 0 && <p role="status" className="py-3 text-sm text-inksoft">No destinations match “{query}”. Try another name.</p>}
      </div>
      <button type="button" className="secondary-button" onClick={onBack}>Back</button>
    </div>
  )
}

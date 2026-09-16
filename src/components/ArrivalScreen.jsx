import { Icon } from './Icon.jsx'
import { floorLabel } from '../utils/directions.js'

export default function ArrivalScreen({ destinationNode, onRestart }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 py-10 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-tealsoft text-teal"><Icon name="check" className="h-9 w-9" /></div>
      <div>
        <p className="text-xs font-semibold text-teal">Destination confirmed</p>
        <h1 id="screen-heading" className="screen-heading mt-2">You have reached {destinationNode.name}</h1>
        <p className="mt-3 text-sm text-inksoft">{floorLabel(destinationNode.floor)} · Your journey is complete.</p>
      </div>
      <button type="button" onClick={onRestart} className="primary-button mt-3 w-full">Plan another route</button>
    </div>
  )
}

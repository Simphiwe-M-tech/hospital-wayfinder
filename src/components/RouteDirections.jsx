import { Icon } from './Icon.jsx'
import { floorLabel } from '../utils/directions.js'

export default function RouteDirections({ currentNode, destinationNode, route, steps, stepIndex, notice, accessible, onChangeDestination, onScanNext }) {
  const remainingDistance = steps.slice(stepIndex).reduce((total, step) => total + step.distance, 0)
  const progress = steps.length ? Math.round((stepIndex / steps.length) * 100) : 0

  return (
    <div className="flex flex-1 flex-col gap-4">
      <p className="text-xs font-semibold text-inksoft">Step 3 of 3 · Route</p>
      <div className="flex items-center justify-between gap-3 rounded-2xl bg-ink px-4 py-4 text-white">
        <div className="min-w-0">
          <p className="text-xs text-[#b9c4d6]">Route to</p>
          <h1 id="screen-heading" className="mt-1 text-xl font-extrabold leading-tight">{destinationNode.name}</h1>
          <p className="mt-1 text-xs text-[#b9c4d6]">{floorLabel(destinationNode.floor)}</p>
        </div>
        {route && <div className="shrink-0 text-right"><p className="text-xl font-extrabold">{Math.round(remainingDistance)} m</p><p className="text-xs text-[#b9c4d6]">remaining</p></div>}
      </div>
      <p className="text-xs font-semibold text-teal">{accessible ? 'Step-free route · stairs excluded' : 'Shortest route · may include stairs'}</p>
      {route ? (
        <>
          <div>
            <div className="mb-2 flex justify-between text-xs text-inksoft"><span>Journey progress</span><span>{progress}%</span></div>
            <div role="progressbar" aria-label="Journey progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} className="h-1.5 overflow-hidden rounded-full bg-line">
              <div className="h-full rounded-full bg-teal transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <ol className="flex flex-col">
            {steps.map((step, index) => {
              const done = index < stepIndex
              const current = index === stepIndex
              return (
                <li key={`${step.from}-${step.to}`} aria-current={current ? 'step' : undefined} className="flex gap-3 border-b border-line py-3 last:border-none">
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${done ? 'bg-teal text-white' : current ? 'bg-ink text-white' : 'bg-tealsoft text-teal'}`}>
                    {done ? <><Icon name="check" className="h-4 w-4" /><span className="sr-only">Completed</span></> : index + 1}
                  </span>
                  <div>
                    <p className={`text-sm font-semibold leading-snug ${done ? 'text-inksoft line-through' : ''}`}>{step.text}</p>
                    <p className="mt-1 text-xs leading-relaxed text-inksoft">{step.sub}</p>
                  </div>
                </li>
              )
            })}
          </ol>
        </>
      ) : (
        <p role="alert" className="inline-notice">
          No {accessible ? 'step-free ' : ''}route is available from {currentNode.name} to {destinationNode.name}.
          {' '}{accessible ? 'Keep Avoid stairs on if you need step-free access, and ask hospital staff for help or choose another destination.' : 'Choose another destination or ask hospital staff for help.'}
        </p>
      )}
      {notice && <p role="status" className="inline-notice">{notice}</p>}
      <div className="mt-auto grid gap-2.5 pt-2 min-[360px]:grid-cols-2">
        <button type="button" onClick={onChangeDestination} className="secondary-button">Change destination</button>
        <button type="button" onClick={onScanNext} className="primary-button">{route ? 'Scan next checkpoint' : 'Scan another location'}</button>
      </div>
    </div>
  )
}

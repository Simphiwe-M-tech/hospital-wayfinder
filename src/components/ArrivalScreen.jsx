import { Check, Navigation } from 'lucide-react'
import { floorLabel } from '../utils/directions.js'
import { formatEstimatedWalkingTime } from '../utils/walkingTime.js'

export default function ArrivalScreen({ destinationNode, journey, onRestart }) {
  return (
    <div className="app-frame">
      <div className="card overflow-hidden">
        <div className="flex flex-col items-center gap-4 bg-success-soft px-4 py-10 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-success text-white">
            <Check size={30} strokeWidth={2.6} aria-hidden="true" />
          </span>
          <div>
            <p className="screen-eyebrow text-success">Destination reached</p>
            <h1 id="screen-heading" className="screen-heading mt-1.5">
              Arrival at {destinationNode.name}
            </h1>
            <p className="screen-sub mt-2">
              {floorLabel(destinationNode.floor)} · You have reached your destination.
            </p>
          </div>
        </div>
        {journey && journey.steps > 0 && (
          <div className="flex items-stretch justify-center divide-x divide-line border-t border-line">
            <div className="px-5 py-3.5 text-center">
              <p className="text-[16px] font-extrabold leading-tight text-ink">
                {Math.round(journey.distance)} m
              </p>
              <p className="text-[10.5px] font-semibold uppercase tracking-wide text-inksoft">Route</p>
            </div>
            <div className="px-5 py-3.5 text-center">
              <p className="text-[16px] font-extrabold leading-tight text-ink">{journey.steps}</p>
              <p className="text-[10.5px] font-semibold uppercase tracking-wide text-inksoft">Steps</p>
            </div>
            {typeof journey.walkingDistance === 'number' && (
              <div className="px-5 py-3.5 text-center">
                <p className="text-[16px] font-extrabold leading-tight text-ink">
                  {formatEstimatedWalkingTime(journey.walkingDistance).replace(' walk', '')}
                </p>
                <p className="text-[10.5px] font-semibold uppercase tracking-wide text-inksoft">Est. walk</p>
              </div>
            )}
          </div>
        )}
      </div>

      <p className="screen-sub text-center">
        This confirmation is based on the QR checkpoint or map location selected in the app and does
        not independently verify your physical location.
        {journey?.includesLift
          ? ' Walking time excludes unverified lift waiting and ride time. Distances are provisional.'
          : ' Distances and walking times are provisional estimates.'}
      </p>

      <button type="button" onClick={onRestart} className="primary-button w-full text-[15px]">
        <Navigation size={17} aria-hidden="true" />
        Plan another route
      </button>
    </div>
  )
}

import {
  ArrowRight,
  Check,
  Compass,
  CornerUpLeft,
  CornerUpRight,
  MoveDown,
  MoveUp,
  Navigation,
  QrCode,
  RotateCcw,
  TriangleAlert,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { floorLabel } from '../utils/directions.js'
import { navigationLanguages } from '../utils/languages.js'
import {
  formatEstimatedWalkingTime,
  routeIncludesLift,
  walkingDistanceMetres,
} from '../utils/walkingTime.js'
import AccessibleToggle from './AccessibleToggle.jsx'

function stepIcon(step) {
  if (step.kind === 'floor-change') {
    return step.direction === 'down' ? MoveDown : MoveUp
  }

  if (step.kind === 'head') return Compass
  if (step.turn === 'Continue straight') return ArrowRight
  if (step.turn === 'Turn right') return CornerUpRight
  if (step.turn === 'Turn left') return CornerUpLeft
  if (step.turn === 'Turn back') return RotateCcw

  return Navigation
}

export default function RouteDirections({
  map,
  currentNode,
  destinationNode,
  route,
  steps,
  stepIndex,
  notice,
  accessible,
  voiceEnabled,
  voiceSupported,
  navigationLanguage,
  onToggleAccessible,
  onToggleVoice,
  onRepeatInstruction,
  onChangeNavigationLanguage,
  onChangeDestination,
  onScanNext,
}) {
  const remainingDistance = steps
    .slice(stepIndex)
    .reduce((total, step) => total + step.distance, 0)

  const remainingPath = route?.path?.slice(stepIndex) ?? []

  const remainingWalk =
    map && route
      ? walkingDistanceMetres(map, remainingPath, accessible)
      : 0

  const usesLift =
    map && route
      ? routeIncludesLift(map, route.path, accessible)
      : false

  const progress = steps.length
    ? Math.round((stepIndex / steps.length) * 100)
    : 0

  const noticeTone =
    typeof notice === 'string'
      ? 'info'
      : notice?.tone ?? 'info'

  const noticeText =
    typeof notice === 'string'
      ? notice
      : notice?.text

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="screen-eyebrow">
          Step 4 of 4 · Route
        </p>

        <h1
          id="screen-heading"
          className="screen-heading mt-1 text-[26px]"
        >
          On your way
        </h1>

        <p className="screen-sub mt-1.5">
          Follow the highlighted route on the map and scan each checkpoint as
          you reach it.
        </p>
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-start justify-between gap-3 bg-ink px-4 py-4 text-white">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-white/60">
              Route to
            </p>

            <p className="mt-1 truncate text-[16px] font-bold leading-tight">
              {destinationNode.name}
            </p>

            <p className="mt-1 text-[12px] text-white/70">
              {floorLabel(destinationNode.floor)}
            </p>
          </div>

          {route && (
            <div className="shrink-0 pl-2 text-right">
              <p className="text-[20px] font-extrabold leading-none">
                {Math.round(remainingDistance)} m
              </p>

              <p className="mt-1.5 text-[10.5px] text-white/70">
                of {Math.round(route.distance)} m left
              </p>

              <p className="mt-2 text-[12px] font-semibold text-teal-soft">
                {formatEstimatedWalkingTime(remainingWalk)}
              </p>

              <p className="mt-1 text-[10px] text-white/55">
                Est. walking time · provisional distances
              </p>
            </div>
          )}
        </div>

        {route && usesLift && (
          <p className="border-b border-line bg-teal-soft/40 px-4 py-2 text-[11px] leading-snug text-inksoft">
            Walking time only — lift waiting and ride time are not included
            (unverified).
          </p>
        )}

        <div className="px-4 py-3.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-inksoft">
            <span>Journey progress</span>
            <span>{progress}% complete</span>
          </div>

          <div
            role="progressbar"
            aria-label="Journey progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            className="mt-2 h-2 overflow-hidden rounded-full bg-teal-soft"
          >
            <div
              className="h-full rounded-full bg-teal"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="card px-4 py-3.5">
        <label
          htmlFor="navigation-language"
          className="text-[12px] font-bold text-ink"
        >
          Direction language
        </label>

        <select
          id="navigation-language"
          value={navigationLanguage}
          onChange={(event) =>
            onChangeNavigationLanguage(event.target.value)
          }
          className="mt-2 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-[13px] font-semibold text-ink outline-none focus:border-teal focus:ring-2 focus:ring-teal-soft"
        >
          {navigationLanguages.map((language) => (
            <option
              key={language.code}
              value={language.code}
            >
              {language.label}
            </option>
          ))}
        </select>

        <p className="mt-2 text-[11px] leading-snug text-inksoft">
          Written and spoken route instructions use the selected language.
          Available voices depend on your device.
        </p>
      </div>

      <div className="card px-4 py-3.5">
        <AccessibleToggle
          accessible={accessible}
          onToggle={onToggleAccessible}
        />
      </div>

      <div className="card px-4 py-3.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                voiceEnabled
                  ? 'bg-teal text-white'
                  : 'bg-teal-soft text-teal'
              }`}
            >
              {voiceEnabled ? (
                <Volume2
                  size={17}
                  aria-hidden="true"
                />
              ) : (
                <VolumeX
                  size={17}
                  aria-hidden="true"
                />
              )}
            </span>

            <div className="min-w-0">
              <p className="text-[13.5px] font-bold text-ink">
                Voice guidance
              </p>

              <p className="mt-0.5 text-[11px] leading-snug text-inksoft">
                {voiceSupported
                  ? voiceEnabled
                    ? 'Spoken directions are on.'
                    : 'Hear each new direction while navigating.'
                  : 'Voice guidance is not supported by this browser.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={voiceEnabled}
            aria-label="Voice guidance"
            disabled={!voiceSupported}
            onClick={onToggleVoice}
            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
              voiceEnabled
                ? 'bg-teal'
                : 'bg-line'
            }`}
          >
            <span
              className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                voiceEnabled
                  ? 'translate-x-5'
                  : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {voiceEnabled && route && steps[stepIndex] && (
          <button
            type="button"
            onClick={onRepeatInstruction}
            className="mt-3 inline-flex items-center gap-2 text-[12px] font-bold text-teal hover:underline"
          >
            <Volume2
              size={15}
              aria-hidden="true"
            />
            Repeat current direction
          </button>
        )}
      </div>

      {route ? (
        <ol className="flex flex-col gap-2">
          {steps.map((step, index) => {
            const done = index < stepIndex
            const current = index === stepIndex
            const StepIcon = stepIcon(step)

            return (
              <li
                key={`${step.from}-${step.to}`}
                aria-current={current ? 'step' : undefined}
              >
                <div
                  className={`flex items-start gap-3 rounded-2xl border p-3.5 ${
                    current
                      ? 'border-teal bg-teal-soft/50'
                      : 'border-line bg-white'
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                      done
                        ? 'bg-success-soft text-success'
                        : current
                          ? 'bg-teal text-white'
                          : 'bg-teal-soft text-teal'
                    }`}
                  >
                    {done ? (
                      <>
                        <Check
                          size={16}
                          strokeWidth={2.6}
                          aria-hidden="true"
                        />

                        <span className="sr-only">
                          Completed
                        </span>
                      </>
                    ) : (
                      <StepIcon
                        size={17}
                        strokeWidth={2}
                        aria-hidden="true"
                      />
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-[14px] font-semibold leading-snug ${
                        done
                          ? 'text-inksoft/80'
                          : 'text-ink'
                      }`}
                    >
                      {step.text}
                    </p>

                    <p className="mt-1 text-[11.5px] leading-relaxed text-inksoft">
                      {step.sub}
                    </p>
                  </div>

                  {current && (
                    <span className="shrink-0 rounded-full bg-teal px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                      Now
                    </span>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      ) : (
        <p
          role="alert"
          className="inline-notice"
        >
          <TriangleAlert
            size={17}
            className="mt-0.5 shrink-0"
            aria-hidden="true"
          />

          <span>
            No {accessible ? 'step-free ' : ''}route is available from{' '}
            {currentNode.name} to {destinationNode.name}.{' '}
            {accessible
              ? 'Turn step-free routing off to include stairs, or choose another destination or ask hospital staff for help.'
              : 'Choose another destination or ask hospital staff for help.'}
          </span>
        </p>
      )}

      {noticeText && (
        <p
          role="status"
          className="inline-notice"
          data-tone={noticeTone}
        >
          {noticeText}
        </p>
      )}

      <div className="grid gap-2.5 pt-1 min-[360px]:grid-cols-2">
        <button
          type="button"
          onClick={onChangeDestination}
          className="secondary-button"
        >
          Change destination
        </button>

        <button
          type="button"
          onClick={onScanNext}
          className="primary-button"
        >
          <QrCode
            size={17}
            aria-hidden="true"
          />

          {route
            ? 'Scan next checkpoint'
            : 'Scan another location'}
        </button>
      </div>
    </div>
  )
}
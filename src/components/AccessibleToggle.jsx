import { useId } from 'react'
import { Accessibility } from 'lucide-react'

export default function AccessibleToggle({ accessible, onToggle }) {
  const labelId = useId()

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
            accessible ? 'bg-success-soft text-success' : 'bg-teal-soft text-teal'
          }`}
        >
          <Accessibility size={20} strokeWidth={1.8} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p id={labelId} className="text-[13.5px] font-bold leading-tight text-ink">
            Step-free route
          </p>
          <p className="text-[12px] leading-tight text-inksoft">Prefer lifts over stairs</p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={accessible}
        aria-labelledby={labelId}
        onClick={onToggle}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
          accessible ? 'bg-success' : 'bg-[#a7bbb8]'
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
            accessible ? 'left-6' : 'left-1'
          }`}
          aria-hidden="true"
        />
      </button>
    </div>
  )
}

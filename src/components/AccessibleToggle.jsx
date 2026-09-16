import { Icon } from './Icon.jsx'

export default function AccessibleToggle({ accessible, onToggle }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line bg-tealsoft px-5 py-2">
      <span id="accessible-label" className="flex items-center gap-2 text-sm font-semibold">
        <Icon name="lift" className="h-4 w-4" />
        Avoid stairs
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={accessible}
        aria-labelledby="accessible-label"
        onClick={onToggle}
        className="flex min-h-11 min-w-11 items-center justify-end gap-2 rounded-lg"
      >
        <span className="text-xs font-semibold text-inksoft">{accessible ? 'On' : 'Off'}</span>
        <span className={`relative h-6 w-10 rounded-full transition-colors ${accessible ? 'bg-teal' : 'bg-[#a7bbb8]'}`}>
          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${accessible ? 'left-[18px]' : 'left-0.5'}`} />
        </span>
      </button>
    </div>
  )
}

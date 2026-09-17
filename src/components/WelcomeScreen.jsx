import { Accessibility, Navigation, QrCode } from 'lucide-react'
import BrandMark from './BrandMark.jsx'

const features = [
  { icon: Navigation, label: 'Turn-by-turn directions' },
  { icon: QrCode, label: 'QR checkpoints' },
  { icon: Accessibility, label: 'Step-free routing' },
]

function RouteIllustration({ className }) {
  return (
    <svg
      viewBox="0 0 340 192"
      className={className}
      role="img"
      aria-label="A dotted walking route leading from a QR checkpoint to a destination pin"
    >
      <g fill="none" stroke="rgba(244,248,247,0.13)" strokeWidth="2">
        <rect x="14" y="16" width="72" height="44" rx="8" />
        <rect x="14" y="72" width="48" height="44" rx="8" />
        <rect x="252" y="112" width="74" height="50" rx="8" />
        <rect x="298" y="16" width="28" height="38" rx="8" />
        <rect x="120" y="16" width="60" height="30" rx="8" />
      </g>
      <path
        d="M66 146H140C168 146 172 96 200 96H236C254 96 264 94 264 86"
        fill="none"
        stroke="rgba(244,248,247,0.92)"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeDasharray="0.5 13"
      />
      <g fill="none" stroke="#F4F8F7" strokeWidth="3" strokeLinejoin="round">
        <rect x="26" y="126" width="40" height="40" rx="9" />
      </g>
      <g fill="#F4F8F7">
        <rect x="34" y="134" width="9" height="9" rx="2" />
        <rect x="49" y="134" width="9" height="9" rx="2" />
        <rect x="34" y="149" width="9" height="9" rx="2" />
        <rect x="49" y="149" width="6" height="6" rx="1.5" opacity="0.75" />
        <rect x="52" y="155" width="6" height="6" rx="1.5" opacity="0.75" />
      </g>
      <path
        d="M264 86c-14-16-23-24-23-34a23 23 0 1 1 46 0c0 10-9 18-23 34z"
        fill="#E9A868"
        stroke="#0a474f"
        strokeWidth="3"
      />
      <circle cx="264" cy="52" r="8" fill="#0a474f" />
    </svg>
  )
}

export default function WelcomeScreen({ onGetStarted }) {
  return (
    <section className="welcome-hero">
      <div className="welcome-content">
        <div className="flex items-center gap-3">
          <BrandMark size={36} inverted />
          <div>
            <p className="text-[15px] font-bold leading-tight text-white">Hospital Wayfinder</p>
            <p className="text-[11.5px] leading-tight text-white/65">Indoor navigation demo</p>
          </div>
        </div>

        <div className="welcome-main">
          <div className="welcome-copy">
            <p className="screen-eyebrow text-white/70">Indoor hospital navigation</p>
            <h1 className="mt-3 text-[clamp(34px,9vw,42px)] font-bold leading-[1.08] tracking-[-0.025em] text-white">
              Find your way.
              <br />
              Feel at ease.
            </h1>
            <p className="mt-4 max-w-[40ch] text-[15.5px] leading-relaxed text-white/80">
              Clear, turn-by-turn directions inside the hospital — with QR
              checkpoints to keep you on track and step-free routes when you
              need them.
            </p>
          </div>
          <RouteIllustration className="welcome-route-illustration" />
        </div>

        <div className="welcome-actions">
          <div className="welcome-features">
            {features.map(({ icon: FeatureIcon, label }) => (
              <div
                key={label}
                className="flex flex-1 flex-col items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-2 py-3.5 text-center"
              >
                <FeatureIcon size={20} strokeWidth={1.8} className="text-white/90" aria-hidden="true" />
                <p className="text-[11.5px] font-semibold leading-tight text-white/85">{label}</p>
              </div>
            ))}
          </div>

          <div>
            <button
              type="button"
              className="primary-button on-dark w-full text-[15px]"
              onClick={onGetStarted}
            >
              Get started
            </button>
            <p className="mt-3 text-center text-[11.5px] leading-relaxed text-white/55">
              Demo prototype · QR scans are simulated in this build
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

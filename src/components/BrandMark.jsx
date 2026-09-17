export default function BrandMark({ size = 28, inverted = false, className }) {
  const bg = inverted ? '#F4F8F7' : '#0E5D66'
  const fg = inverted ? '#0E5D66' : '#F4F8F7'
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <rect width="64" height="64" rx="14" fill={bg} />
      <path d="M47 13 15 29.5l13.4 4.1L33 48 47 13Z" fill={fg} />
    </svg>
  )
}

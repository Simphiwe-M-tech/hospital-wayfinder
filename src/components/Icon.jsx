export function Icon({ name, className = 'h-5 w-5' }) {
  const paths = {
    lift: (
      <>
        <rect x="5" y="3" width="14" height="18" rx="1" />
        <path d="M10 9l2-2 2 2M10 15l2 2 2-2" />
      </>
    ),
    check: <path d="M20 6L9 17l-5-5" />,
    mark: (
      <>
        <path d="M12 21s-7-7.2-7-12a7 7 0 0114 0c0 4.8-7 12-7 12z" />
        <circle cx="12" cy="9" r="2.4" />
      </>
    ),
  }
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      {paths[name]}
    </svg>
  )
}

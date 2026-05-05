interface Props {
  size?: number
  style?: React.CSSProperties
}

export default function AppLogo({ size = 36, style }: Props) {
  const r = Math.round(size * 0.22)
  return (
    <svg
      width={size} height={size} viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0, ...style }}
    >
      <defs>
        <linearGradient id="af-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--accent-mid, #6d5ce6)" />
          <stop offset="100%" stopColor="var(--accent, #a78bfa)" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx={r} fill="url(#af-grad)" />
      {/* Rupee symbol */}
      <text
        x="32" y="38"
        dominantBaseline="middle" textAnchor="middle"
        fontFamily="Georgia, serif" fontSize="34" fontWeight="700"
        fill="white" opacity="0.96"
      >₹</text>
      {/* Upward trend tick — top-right corner */}
      <polyline
        points="42,20 48,13 48,21"
        fill="none" stroke="white" strokeWidth="2.6"
        strokeLinecap="round" strokeLinejoin="round" opacity="0.75"
      />
    </svg>
  )
}

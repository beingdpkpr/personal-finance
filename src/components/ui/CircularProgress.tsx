interface Props { pct: number; size?: number; color?: string; label?: string; subLabel?: string }

export default function CircularProgress({ pct, size = 100, color = 'var(--accent)', label, subLabel }: Props) {
  const r = 38, cx = size / 2, cy = size / 2, sw = 10
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border)" strokeWidth={sw} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={sw}
        strokeDasharray={`${dash} ${circ}`} strokeDashoffset={circ * 0.25}
        strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.9s ease' }} />
      {label && <text x={cx} y={cy - 4} textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--text)" fontFamily="DM Mono">{label}</text>}
      {subLabel && <text x={cx} y={cy + 12} textAnchor="middle" fontSize="9" fill="var(--text-dim)" fontFamily="DM Sans">{subLabel}</text>}
    </svg>
  )
}

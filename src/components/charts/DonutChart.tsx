import { useState, useEffect } from 'react'

interface Segment { label: string; pct: number; color: string }
interface Props { segments: Segment[]; size?: number; centerLabel?: string; centerSub?: string; onSegmentClick?: (index: number) => void }

export default function DonutChart({ segments, size = 120, centerLabel, centerSub, onSegmentClick }: Props) {
  const [drawn, setDrawn] = useState(false)
  const [hovered, setHovered] = useState<number | null>(null)
  useEffect(() => { const t = setTimeout(() => setDrawn(true), 500); return () => clearTimeout(t) }, [])
  const r = 44, cx = size / 2, cy = size / 2, sw = 16, circ = 2 * Math.PI * r
  let cum = 0
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      {segments.map((s, i) => {
        const off = (cum / 100) * circ
        const dash = drawn ? (s.pct / 100) * circ - 2 : 0
        cum += s.pct
        const isHov = hovered === i
        const dimmed = hovered !== null && !isHov
        return <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth={isHov ? sw + 3 : sw}
          strokeDasharray={`${dash} ${circ}`} strokeDashoffset={-off + circ * 0.25} strokeLinecap="round"
          opacity={dimmed ? 0.3 : 1}
          style={{ transition: `stroke-dasharray 0.9s ease ${0.5 + i * 0.12}s, opacity 0.2s, stroke-width 0.15s`, cursor: onSegmentClick ? 'pointer' : 'default' }}
          pointerEvents="visibleStroke"
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(null)}
          onClick={() => onSegmentClick?.(i)}
        />
      })}
      {centerLabel && <text x={cx} y={cy - 6} textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--text)" fontFamily="DM Sans">{centerLabel}</text>}
      {centerSub && <text x={cx} y={cy + 10} textAnchor="middle" fontSize="9" fill="var(--text-dim)" fontFamily="DM Sans">{centerSub}</text>}
    </svg>
  )
}

interface Props { pct: number; color?: string; height?: number }

export default function ProgressBar({ pct, color, height = 8 }: Props) {
  const c = color ?? (pct >= 90 ? 'var(--negative)' : pct >= 70 ? 'var(--warning)' : 'var(--positive)')
  return (
    <div style={{ height, borderRadius: height, background: 'var(--border)', overflow: 'hidden' }}>
      <div style={{ height: '100%', borderRadius: height, background: c, width: `${Math.min(pct, 100)}%`, transition: 'width 0.7s ease' }} />
    </div>
  )
}

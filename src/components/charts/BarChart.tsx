import { useState, useEffect } from 'react'

interface DataPoint { month: string; amount: number }
interface Props { data: DataPoint[]; color?: string }

export default function BarChart({ data, color = '#7c6ef5' }: Props) {
  const [grown, setGrown] = useState(false)
  useEffect(() => { const t = setTimeout(() => setGrown(true), 400); return () => clearTimeout(t) }, [])
  const max = Math.max(...data.map(d => d.amount), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80, paddingTop: 4 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
          <div style={{
            width: '100%', background: `${color}cc`, borderRadius: '4px 4px 0 0',
            height: grown ? `${(d.amount / max) * 100}%` : '0%',
            transition: `height 0.7s cubic-bezier(0.34,1.56,0.64,1) ${0.05 * i}s`,
            minHeight: grown ? 4 : 0,
          }} />
          <span style={{ fontSize: 9, color: 'var(--text-dim)', fontFamily: 'DM Sans' }}>{d.month}</span>
        </div>
      ))}
    </div>
  )
}

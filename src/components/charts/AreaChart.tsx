import { useState, useEffect } from 'react'

interface DataPoint { month: string; income: number; expense: number }
interface Props { data: DataPoint[]; color?: string; height?: number; showAvgLine?: boolean }

export default function AreaChart({ data, color = '#7c6ef5', height = 120, showAvgLine = false }: Props) {
  const [drawn, setDrawn] = useState(false)
  useEffect(() => { const t = setTimeout(() => setDrawn(true), 300); return () => clearTimeout(t) }, [])

  if (data.length < 2) return null

  const W = 500, H = height, PAD = 10
  const maxVal = Math.max(...data.map(d => Math.max(d.income, d.expense)), 1)
  const avgExp = data.reduce((s, d) => s + d.expense, 0) / data.length
  const avgExpY = H - PAD - (avgExp / maxVal) * (H - PAD * 2)
  const pts = (key: 'income' | 'expense') => data.map((d, i) => {
    const x = PAD + (i / (data.length - 1)) * (W - PAD * 2)
    const y = H - PAD - (d[key] / maxVal) * (H - PAD * 2)
    return [x, y] as [number, number]
  })
  const incPts = pts('income'), expPts = pts('expense')
  const line = (p: [number, number][]) => p.map((pt, i) => `${i === 0 ? 'M' : 'L'}${pt[0].toFixed(1)},${pt[1].toFixed(1)}`).join(' ')
  const area = (p: [number, number][]) => `${line(p)} L${p[p.length-1][0]},${H} L${p[0][0]},${H} Z`

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H + 12}`} style={{ overflow: 'visible', display: 'block' }}>
      <defs>
        <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
        <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f87171" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#f87171" stopOpacity="0" />
        </linearGradient>
        <filter id="lineGlow">
          <feGaussianBlur stdDeviation="2" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {showAvgLine && drawn && (
        <>
          <line x1={PAD} y1={avgExpY} x2={W - PAD} y2={avgExpY} stroke="#f87171" strokeWidth="1" strokeDasharray="5 3" opacity="0.45" />
          <text x={W - PAD - 2} y={avgExpY - 4} textAnchor="end" fontSize="7" fill="#f87171" opacity="0.7" fontFamily="DM Sans">avg</text>
        </>
      )}
      {[0.25, 0.5, 0.75].map(f => (
        <line key={f} x1={PAD} y1={H - PAD - f * (H - PAD * 2)} x2={W - PAD} y2={H - PAD - f * (H - PAD * 2)}
          stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4 4" />
      ))}
      {drawn && <path d={area(incPts)} fill="url(#incGrad)" />}
      {drawn && <path d={area(expPts)} fill="url(#expGrad)" />}
      <path d={line(incPts)} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        filter="url(#lineGlow)"
        style={{ strokeDasharray: 1200, strokeDashoffset: drawn ? 0 : 1200, transition: 'stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)' } as React.CSSProperties} />
      <path d={line(expPts)} fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        style={{ strokeDasharray: 1200, strokeDashoffset: drawn ? 0 : 1200, transition: 'stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1) 0.1s' } as React.CSSProperties} />
      {drawn && incPts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={data.length > 8 ? 2.5 : 3.5} fill={color} stroke="var(--surface2)" strokeWidth="2" />)}
      {drawn && expPts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={data.length > 8 ? 2 : 3} fill="#f87171" stroke="var(--surface2)" strokeWidth="2" />)}
      {data.map((d, i) => (data.length <= 8 || i % 2 === 0) && <text key={i} x={incPts[i][0]} y={H + 10} textAnchor="middle" fontSize="8" fill="var(--text-dim)" fontFamily="DM Sans">{d.month}</text>)}
    </svg>
  )
}

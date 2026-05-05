import React from 'react'
import Card from './Card'

interface Props {
  label: string
  value: string
  sub?: string
  icon: React.ReactNode
  color: string
  positive?: boolean
  delay?: number
  animate?: boolean
}

export default function StatCard({ label, value, sub, icon, color, positive, delay, animate }: Props) {
  return (
    <Card delay={delay} animate={animate} style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
          <span style={{ fontSize:12, color:'var(--text-dim)', textTransform:'uppercase', letterSpacing:'0.06em', fontWeight:500 }}>{label}</span>
          <span style={{ fontSize:26, fontWeight:700, color:'var(--text)', fontFamily:'DM Mono, monospace', letterSpacing:'-0.02em' }}>{value}</span>
        </div>
        <div style={{ width:42, height:42, borderRadius:12, background:`${color}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, border:`1px solid ${color}30` }}>
          {icon}
        </div>
      </div>
      {sub !== undefined && (
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          {positive !== undefined && (
            <span style={{ fontSize:11, fontWeight:600, borderRadius:20, padding:'3px 8px', color: positive ? 'oklch(0.68 0.18 145)' : 'oklch(0.64 0.2 25)', background: positive ? 'oklch(0.22 0.08 145)' : 'oklch(0.22 0.08 25)', display:'flex', alignItems:'center', gap:3 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                {positive ? <polyline points="18 15 12 9 6 15"/> : <polyline points="6 9 12 15 18 9"/>}
              </svg>
              {Math.abs(Number(sub))}%
            </span>
          )}
          <span style={{ fontSize:12, color:'var(--text-dim)' }}>vs last month</span>
        </div>
      )}
    </Card>
  )
}

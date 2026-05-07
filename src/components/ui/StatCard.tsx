import React from 'react'
import Card from './Card'

interface Props {
  label: string
  value: string
  sub?: string
  note?: string
  icon: React.ReactNode
  color: string
  positive?: boolean
  delay?: number
  animate?: boolean
  rate?: number
}

export default function StatCard({ label, value, sub, note, icon, color, positive, delay, animate, rate }: Props) {
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
      {rate !== undefined && (
        <div style={{ display:'flex', flexDirection:'column', gap:4, marginTop:-6 }}>
          <div style={{ height:3, borderRadius:2, background:'var(--surface3)', overflow:'hidden' }}>
            <div style={{ height:'100%', borderRadius:2, background: rate >= 20 ? 'var(--positive)' : rate >= 10 ? '#f59e0b' : 'var(--negative)', width:`${Math.min(Math.max(rate,0),100)}%`, transition:'width 0.8s ease' }} />
          </div>
          <span style={{ fontSize:10, color:'var(--text-dim)' }}>{rate}% savings rate</span>
        </div>
      )}
      {note && (
        <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:-6 }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          <span style={{ fontSize:11, color:'#f59e0b' }}>{note}</span>
        </div>
      )}
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

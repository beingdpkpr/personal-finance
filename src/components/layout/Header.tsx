import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useFinanceContext } from '../../hooks/FinanceContext'
import SettingsModal from './SettingsModal'

const TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard', '/accounts': 'Accounts',
  '/transactions': 'Transactions', '/analytics': 'Analytics',
  '/budget': 'Budget', '/goals': 'Goals', '/monthly': 'Monthly',
}

interface Props { onToggleSidebar: () => void }

export default function Header({ onToggleSidebar }: Props) {
  const { pathname } = useLocation()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const { name, picture } = useFinanceContext()
  const initials = name ? name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() : '?'

  return (
    <>
      <header style={{
        height: 72, borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center',
        padding: '0 28px', gap: 12,
        background: 'var(--bg)', flexShrink: 0,
      }}>
        {/* Sidebar toggle */}
        <button onClick={onToggleSidebar} style={{ width:36, height:36, borderRadius:9, background:'var(--surface2)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'var(--text-mid)', flexShrink:0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>

        <h1 style={{ fontSize:18, fontWeight:700, color:'var(--text)', flex:1, margin:0 }}>{TITLES[pathname] ?? ''}</h1>

        {/* Search */}
        <div style={{ position:'relative' }}>
          <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--text-dim)', pointerEvents:'none' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </span>
          <input placeholder="Search…" style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:10, padding:'8px 14px 8px 32px', fontSize:13, color:'var(--text)', outline:'none', fontFamily:'DM Sans, sans-serif', width:200 }} />
        </div>

        {/* Notification bell */}
        <button style={{ width:36, height:36, borderRadius:9, background:'var(--surface2)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'var(--text-mid)', position:'relative', flexShrink:0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <span style={{ position:'absolute', top:8, right:8, width:7, height:7, borderRadius:'50%', background:'var(--accent)', border:'2px solid var(--bg)' }}></span>
        </button>

        {/* Settings */}
        <button onClick={() => setSettingsOpen(true)} style={{ width:36, height:36, borderRadius:9, background:'var(--surface2)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'var(--text-mid)', flexShrink:0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>

        {/* User avatar */}
        <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg, var(--accent-mid), var(--accent))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, color:'#fff', fontWeight:700, cursor:'pointer', flexShrink:0, overflow:'hidden' }}>
          {picture ? <img src={picture} style={{ width:'100%', height:'100%', objectFit:'cover' }} alt="" /> : initials}
        </div>
      </header>
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </>
  )
}

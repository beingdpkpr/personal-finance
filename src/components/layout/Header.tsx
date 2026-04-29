import { useState } from 'react'
import { useLocation } from 'react-router-dom'
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

  return (
    <>
      <header style={{
        height: 56, borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center',
        padding: '0 24px', gap: 16,
        background: 'var(--sidebar)', flexShrink: 0,
      }}>
        <button onClick={onToggleSidebar} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-dim)', fontSize:18, padding:4, lineHeight:1 }}>☰</button>
        <h1 style={{ fontSize:17, fontWeight:600, color:'var(--text)', flex:1, margin:0 }}>{TITLES[pathname] ?? ''}</h1>
        <button onClick={() => setSettingsOpen(true)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-dim)', fontSize:18, padding:4, lineHeight:1 }}>⚙</button>
      </header>
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </>
  )
}

import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useFinanceContext } from '../../hooks/FinanceContext'
import SettingsModal from './SettingsModal'
import AppLogo from '../ui/AppLogo'

const NAV = [
  { to: '/dashboard',    label: 'Dashboard',    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg> },
  { to: '/accounts',     label: 'Accounts',     icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/><line x1="6" y1="15" x2="10" y2="15"/></svg> },
  { to: '/transactions', label: 'Transactions', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg> },
  { to: '/analytics',    label: 'Analytics',    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
  { to: '/budget',       label: 'Budget',       icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg> },
  { to: '/goals',        label: 'Goals',        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg> },
  { to: '/monthly',      label: 'Monthly',      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
]

interface Props { collapsed: boolean }

export default function Sidebar({ collapsed }: Props) {
  const { name, email, picture } = useFinanceContext()
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <aside style={{
      width: collapsed ? 64 : 220,
      height: '100%',
      background: 'var(--sidebar)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.25s ease',
      overflow: 'hidden',
      flexShrink: 0,
    }}>
      <div style={{ padding: collapsed ? '20px 0' : '20px 16px', display:'flex', alignItems:'center', gap:10, justifyContent: collapsed?'center':'flex-start', borderBottom:'1px solid var(--border)' }}>
        <AppLogo size={34} />
        {!collapsed && <span style={{ fontSize:16, fontWeight:700, color:'var(--text)', whiteSpace:'nowrap', letterSpacing:'-0.01em' }}>Arya's Finance</span>}
      </div>

      <nav style={{ flex:1, padding:'12px 8px', display:'flex', flexDirection:'column', gap:2 }}>
        {NAV.map(item => (
          <NavLink key={item.to} to={item.to} style={({ isActive }) => ({
            display:'flex', alignItems:'center', gap:10,
            padding: collapsed ? '10px 0' : '10px 12px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            borderRadius:10, textDecoration:'none',
            color: isActive ? 'var(--accent)' : 'var(--text-dim)',
            background: isActive ? 'var(--accent-dim)' : 'transparent',
            borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
            transition:'all 0.15s',
            fontSize:14, fontWeight: isActive ? 600 : 400,
          })}>
            <span style={{ flexShrink:0, display:'flex', alignItems:'center' }}>{item.icon}</span>
            {!collapsed && <span style={{ whiteSpace:'nowrap' }}>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <button
        onClick={() => setSettingsOpen(true)}
        style={{ padding: collapsed ? '12px 0' : '12px 16px', display:'flex', alignItems:'center', gap:10, justifyContent: collapsed?'center':'flex-start', background:'none', border:'none', borderTop:'1px solid var(--border)', width:'100%', cursor:'pointer', transition:'background 0.15s', textAlign:'left' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <div style={{ width:32, height:32, borderRadius:32, background:'var(--accent-dim)', border:'1px solid var(--border)', overflow:'hidden', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, color:'var(--accent)', fontWeight:700 }}>
          {picture ? <img src={picture} style={{ width:'100%', height:'100%', objectFit:'cover' }} alt="" /> : (name?.[0] ?? '?')}
        </div>
        {!collapsed && (
          <div style={{ minWidth:0, flex:1 }}>
            <div style={{ fontSize:13, fontWeight:600, color:'var(--text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{name ?? email}</div>
            <div style={{ fontSize:11, color:'var(--text-dim)', whiteSpace:'nowrap' }}>Settings & profile</div>
          </div>
        )}
      </button>

      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </aside>
  )
}

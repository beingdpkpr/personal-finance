import { NavLink } from 'react-router-dom'
import { useFinanceContext } from '../../hooks/FinanceContext'

const NAV = [
  { to: '/dashboard',    label: 'Dashboard',   icon: '⊞' },
  { to: '/accounts',     label: 'Accounts',     icon: '💳' },
  { to: '/transactions', label: 'Transactions', icon: '↕' },
  { to: '/analytics',    label: 'Analytics',    icon: '📊' },
  { to: '/budget',       label: 'Budget',       icon: '⏱' },
  { to: '/goals',        label: 'Goals',        icon: '◎' },
  { to: '/monthly',      label: 'Monthly',      icon: '📅' },
]

interface Props { collapsed: boolean }

export default function Sidebar({ collapsed }: Props) {
  const { name, email, picture } = useFinanceContext()

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
        <div style={{ width:32, height:32, borderRadius:10, background:'var(--accent-dim)', border:'1px solid var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>₿</div>
        {!collapsed && <span style={{ fontSize:16, fontWeight:700, color:'var(--text)', whiteSpace:'nowrap' }}>Fintrack</span>}
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
            <span style={{ fontSize:16, flexShrink:0 }}>{item.icon}</span>
            {!collapsed && <span style={{ whiteSpace:'nowrap' }}>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div style={{ padding: collapsed ? '12px 0' : '12px 16px', borderTop:'1px solid var(--border)', display:'flex', alignItems:'center', gap:10, justifyContent: collapsed?'center':'flex-start' }}>
        <div style={{ width:32, height:32, borderRadius:32, background:'var(--accent-dim)', border:'1px solid var(--border)', overflow:'hidden', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, color:'var(--accent)', fontWeight:700 }}>
          {picture ? <img src={picture} style={{ width:'100%', height:'100%', objectFit:'cover' }} alt="" /> : (name?.[0] ?? '?')}
        </div>
        {!collapsed && (
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:13, fontWeight:600, color:'var(--text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{name ?? email}</div>
            <div style={{ fontSize:11, color:'var(--text-dim)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>Pro Plan</div>
          </div>
        )}
      </div>
    </aside>
  )
}

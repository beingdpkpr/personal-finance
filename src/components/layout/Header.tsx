import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useFinanceContext } from '../../hooks/FinanceContext'
import { fmt } from '../../lib/format'
import { resolveLimit } from '../../lib/data'
import SettingsModal from './SettingsModal'

const TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard', '/accounts': 'Accounts',
  '/transactions': 'Transactions', '/analytics': 'Analytics',
  '/budget': 'Budget', '/goals': 'Goals', '/monthly': 'Monthly',
}

interface Props { onToggleSidebar: () => void }

export default function Header({ onToggleSidebar }: Props) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { name, picture, txns, budgets, expenseCats } = useFinanceContext()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [searchVal, setSearchVal] = useState('')
  const [notifOpen, setNotifOpen] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)

  const initials = name
    ? name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  // Budget alerts for notification panel
  const now = new Date()
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const monthTxns = txns.filter(t => t.date.startsWith(thisMonth))
  const monthIncome = monthTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const alerts = expenseCats.map(c => {
    const spent = monthTxns.filter(t => t.type === 'expense' && t.category === c.id).reduce((s, t) => s + t.amount, 0)
    const limit = resolveLimit(budgets[c.id], monthIncome)
    const pct = limit > 0 ? (spent / limit) * 100 : 0
    return { ...c, spent, limit, pct }
  }).filter(a => a.pct >= 80 && a.limit > 0)

  // Close notification panel on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
    }
    if (notifOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [notifOpen])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (searchVal.trim()) {
      navigate(`/transactions?q=${encodeURIComponent(searchVal.trim())}`)
      setSearchVal('')
    }
  }

  const btnStyle: React.CSSProperties = {
    width: 36, height: 36, borderRadius: 9,
    background: 'var(--surface2)', border: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: 'var(--text-mid)', flexShrink: 0,
  }

  return (
    <>
      <header style={{
        height: 72, borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center',
        padding: '0 28px', gap: 12,
        background: 'var(--bg)', flexShrink: 0,
      }}>
        {/* Sidebar toggle */}
        <button onClick={onToggleSidebar} style={btnStyle}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>

        <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', flex: 1, margin: 0 }}>
          {TITLES[pathname] ?? ''}
        </h1>

        {/* Search */}
        <form onSubmit={handleSearch} style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', pointerEvents: 'none' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </span>
          <input
            value={searchVal}
            onChange={e => setSearchVal(e.target.value)}
            placeholder="Search transactions…"
            style={{
              background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10,
              padding: '8px 14px 8px 32px', fontSize: 13, color: 'var(--text)',
              outline: 'none', fontFamily: 'DM Sans, sans-serif', width: 210,
              transition: 'border-color 0.15s, width 0.2s',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.width = '260px' }}
            onBlur={e  => { e.currentTarget.style.borderColor = 'var(--border)';  e.currentTarget.style.width = '210px' }}
          />
        </form>

        {/* Notification bell */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button onClick={() => setNotifOpen(o => !o)} style={{ ...btnStyle, background: notifOpen ? 'var(--accent-dim)' : 'var(--surface2)', borderColor: notifOpen ? 'var(--accent)' : 'var(--border)', color: notifOpen ? 'var(--accent)' : 'var(--text-mid)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {alerts.length > 0 && (
              <span style={{ position: 'absolute', top: 7, right: 7, width: 7, height: 7, borderRadius: '50%', background: alerts.some(a => a.pct >= 100) ? 'var(--negative)' : 'var(--warning)', border: '2px solid var(--bg)' }} />
            )}
          </button>

          {notifOpen && (
            <div style={{
              position: 'absolute', top: 44, right: 0, width: 300,
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 14, boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
              zIndex: 200, overflow: 'hidden', animation: 'scaleIn 0.15s ease both',
            }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                Notifications
              </div>
              {alerts.length === 0 ? (
                <div style={{ padding: '20px 16px', fontSize: 13, color: 'var(--text-dim)', textAlign: 'center' }}>
                  <div style={{ display:'flex', justifyContent:'center', marginBottom: 6, color:'var(--positive)' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  </div>
                  All budgets on track
                </div>
              ) : (
                <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                  {alerts.map(a => (
                    <div key={a.id} onClick={() => { navigate('/budget'); setNotifOpen(false) }}
                      style={{ display: 'flex', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${a.pct >= 100 ? 'var(--negative-dim)' : 'oklch(0.22 0.08 70)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: a.pct >= 100 ? 'var(--negative)' : 'var(--warning)' }}>
                        {a.pct >= 100
                          ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                          : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                        }
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>
                          {a.label} {a.pct >= 100 ? 'over budget' : 'near limit'}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
                          {fmt(a.spent)} spent of {fmt(a.limit)} · <span style={{ color: a.pct >= 100 ? 'var(--negative)' : 'var(--warning)', fontWeight: 600 }}>{Math.round(a.pct)}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* User avatar — opens settings */}
        <button onClick={() => setSettingsOpen(true)} style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, var(--accent-mid), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#fff', fontWeight: 700, cursor: 'pointer', flexShrink: 0, overflow: 'hidden', border: 'none', boxShadow: '0 2px 8px var(--accent-glow)' }}>
          {picture
            ? <img src={picture} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
            : initials}
        </button>
      </header>

      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </>
  )
}

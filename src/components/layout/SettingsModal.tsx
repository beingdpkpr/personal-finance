import { useState } from 'react'
import { useFinanceContext } from '../../hooks/FinanceContext'
import { useTheme } from '../../hooks/ThemeContext'
import { CURRENCIES } from '../../constants/categories'
import { useNavigate } from 'react-router-dom'

interface Props { onClose: () => void }

export default function SettingsModal({ onClose }: Props) {
  const { name, email, picture, currency, setCurrencyPref, logout, syncNow, user } = useFinanceContext()
  const { darkMode, themeName, toggleDarkMode, setTheme } = useTheme()
  const navigate = useNavigate()
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<{ ok: boolean; msg: string } | null>(null)

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  async function handleSync() {
    setSyncing(true); setSyncResult(null)
    const err = await syncNow()
    setSyncing(false)
    setSyncResult(err ? { ok: false, msg: err } : { ok: true, msg: 'Synced successfully.' })
    setTimeout(() => setSyncResult(null), 4000)
  }

  return (
    <div
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}
      onClick={onClose}
    >
      <div
        style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:20, width:420, maxHeight:'88vh', display:'flex', flexDirection:'column' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding:'20px 24px 16px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontSize:15, fontWeight:700, color:'var(--text)' }}>Settings</div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-dim)', fontSize:20, lineHeight:1 }}>×</button>
        </div>

        <div style={{ overflowY:'auto', padding:24, display:'flex', flexDirection:'column', gap:20 }}>
          {/* Profile */}
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:48, height:48, borderRadius:48, overflow:'hidden', background:'var(--accent-dim)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, color:'var(--accent)', fontWeight:700, flexShrink:0 }}>
              {picture ? <img src={picture} style={{ width:'100%', height:'100%', objectFit:'cover' }} alt="" /> : (name?.[0] ?? '?')}
            </div>
            <div>
              <div style={{ fontSize:15, fontWeight:600, color:'var(--text)' }}>{name}</div>
              <div style={{ fontSize:12, color:'var(--text-dim)' }}>{email}</div>
            </div>
          </div>

          <div style={{ height:1, background:'var(--border)' }} />

          {/* Dark mode */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:14, color:'var(--text)' }}>Dark Mode</span>
            <button onClick={toggleDarkMode} style={{ width:44, height:24, borderRadius:12, border:'none', cursor:'pointer', background: darkMode ? 'var(--accent)' : 'var(--border)', position:'relative', transition:'background 0.2s' }}>
              <span style={{ position:'absolute', top:3, left: darkMode?20:3, width:18, height:18, borderRadius:9, background:'white', transition:'left 0.2s', display:'block' }} />
            </button>
          </div>

          {/* Theme */}
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            <span style={{ fontSize:14, color:'var(--text)' }}>Accent Theme</span>
            <div style={{ display:'flex', gap:8 }}>
              {(['violet','slate','rose','mono'] as const).map(t => (
                <button key={t} onClick={() => setTheme(t)} style={{ flex:1, padding:'8px 0', borderRadius:10, border: themeName===t ? '2px solid var(--accent)' : '1px solid var(--border)', background: themeName===t ? 'var(--accent-dim)' : 'var(--surface2)', color: themeName===t ? 'var(--accent)' : 'var(--text-dim)', cursor:'pointer', fontSize:13, fontWeight: themeName===t?600:400, textTransform:'capitalize', transition:'all 0.15s' }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Currency */}
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            <span style={{ fontSize:14, color:'var(--text)' }}>Currency</span>
            <select value={currency.code} onChange={e => {
              const c = CURRENCIES.find(x => x.code === e.target.value)
              if (c) setCurrencyPref(c)
            }} style={{ padding:'8px 12px', borderRadius:10, border:'1px solid var(--border)', background:'var(--surface2)', color:'var(--text)', fontSize:13, cursor:'pointer', outline:'none' }}>
              {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>)}
            </select>
          </div>

          <div style={{ height:1, background:'var(--border)' }} />

          {/* Sync */}
          {user && user !== 'demo' && (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ fontSize:14, color:'var(--text)', fontWeight:500 }}>Google Sheets Sync</div>
                  <div style={{ fontSize:12, color:'var(--text-dim)', marginTop:2 }}>Push all local data to your sheet now</div>
                </div>
                <button onClick={handleSync} disabled={syncing} style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 16px', borderRadius:10, border:'1px solid var(--border)', background: syncing ? 'var(--surface2)' : 'var(--accent-dim)', color: syncing ? 'var(--text-dim)' : 'var(--accent)', cursor: syncing ? 'default' : 'pointer', fontSize:13, fontWeight:600, transition:'all 0.15s', opacity: syncing ? 0.7 : 1 }}>
                  {syncing ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation:'spin 1s linear infinite' }}>
                      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
                      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                    </svg>
                  )}
                  {syncing ? 'Syncing…' : 'Sync Now'}
                </button>
              </div>
              {syncResult && (
                <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, padding:'7px 10px', borderRadius:8, background: syncResult.ok ? 'oklch(0.2 0.06 145)' : 'oklch(0.22 0.08 25)', color: syncResult.ok ? 'var(--positive)' : 'var(--negative)', border:`1px solid ${syncResult.ok ? 'var(--positive)' : 'var(--negative)'}` }}>
                  {syncResult.ok
                    ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  }
                  {syncResult.msg}
                </div>
              )}
            </div>
          )}

          <div style={{ height:1, background:'var(--border)' }} />

          {/* Donate */}
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            <div style={{ fontSize:14, fontWeight:500, color:'var(--text)' }}>Support the App</div>
            <div style={{ fontSize:12, color:'var(--text-dim)', lineHeight:1.5 }}>If DKP Finance saves you time, a small coffee goes a long way.</div>
            <a
              href="upi://pay?pa=deepak.prasad.ai@okicici&pn=DKP%20Finance&cu=INR"
              style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'10px', borderRadius:10, border:'1px solid var(--border)', background:'var(--surface2)', color:'var(--text)', cursor:'pointer', fontSize:13, fontWeight:600, textDecoration:'none', marginTop:2 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              Buy me a coffee via UPI
            </a>
          </div>

          <div style={{ height:1, background:'var(--border)' }} />

          <button onClick={handleLogout} style={{ padding:'10px', borderRadius:10, border:'1px solid var(--border)', background:'var(--negative-dim)', color:'var(--negative)', cursor:'pointer', fontSize:14, fontWeight:600 }}>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}

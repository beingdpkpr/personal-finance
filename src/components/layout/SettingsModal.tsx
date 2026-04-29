import { useFinanceContext } from '../../hooks/FinanceContext'
import { useTheme } from '../../hooks/ThemeContext'
import { CURRENCIES } from '../../constants/categories'
import { useNavigate } from 'react-router-dom'

interface Props { onClose: () => void }

export default function SettingsModal({ onClose }: Props) {
  const { name, email, picture, currency, setCurrencyPref, logout } = useFinanceContext()
  const { darkMode, themeName, toggleDarkMode, setTheme } = useTheme()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={onClose}>
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:20, padding:28, width:380, display:'flex', flexDirection:'column', gap:20 }} onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:48, height:48, borderRadius:48, overflow:'hidden', background:'var(--accent-dim)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, color:'var(--accent)', fontWeight:700, flexShrink:0 }}>
            {picture ? <img src={picture} style={{ width:'100%', height:'100%', objectFit:'cover' }} alt="" /> : (name?.[0] ?? '?')}
          </div>
          <div>
            <div style={{ fontSize:15, fontWeight:600, color:'var(--text)' }}>{name}</div>
            <div style={{ fontSize:12, color:'var(--text-dim)' }}>{email}</div>
          </div>
        </div>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:14, color:'var(--text)' }}>Dark Mode</span>
          <button onClick={toggleDarkMode} style={{ width:44, height:24, borderRadius:12, border:'none', cursor:'pointer', background: darkMode ? 'var(--accent)' : 'var(--border)', position:'relative', transition:'background 0.2s' }}>
            <span style={{ position:'absolute', top:3, left: darkMode?20:3, width:18, height:18, borderRadius:9, background:'white', transition:'left 0.2s', display:'block' }} />
          </button>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          <span style={{ fontSize:14, color:'var(--text)' }}>Accent Theme</span>
          <div style={{ display:'flex', gap:8 }}>
            {(['violet','slate','rose'] as const).map(t => (
              <button key={t} onClick={() => setTheme(t)} style={{ flex:1, padding:'8px 0', borderRadius:10, border: themeName===t ? '2px solid var(--accent)' : '1px solid var(--border)', background: themeName===t ? 'var(--accent-dim)' : 'var(--surface2)', color: themeName===t ? 'var(--accent)' : 'var(--text-dim)', cursor:'pointer', fontSize:13, fontWeight: themeName===t?600:400, textTransform:'capitalize', transition:'all 0.15s' }}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          <span style={{ fontSize:14, color:'var(--text)' }}>Currency</span>
          <select value={currency.code} onChange={e => {
            const c = CURRENCIES.find(x => x.code === e.target.value)
            if (c) setCurrencyPref(c)
          }} style={{ padding:'8px 12px', borderRadius:10, border:'1px solid var(--border)', background:'var(--surface2)', color:'var(--text)', fontSize:13, cursor:'pointer' }}>
            {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>)}
          </select>
        </div>

        <button onClick={handleLogout} style={{ padding:'10px', borderRadius:10, border:'1px solid var(--border)', background:'var(--negative-dim)', color:'var(--negative)', cursor:'pointer', fontSize:14, fontWeight:600 }}>
          Sign Out
        </button>
      </div>
    </div>
  )
}

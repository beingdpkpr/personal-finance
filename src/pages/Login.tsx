import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFinanceContext } from '../hooks/FinanceContext'
import { openGoogleOAuthPopup } from '../lib/google-auth'
import AppLogo from '../components/ui/AppLogo'

export default function Login() {
  const { googleSignIn, loadDemoData, user, sessionNote } = useFinanceContext()
  const navigate = useNavigate()
  const [error, setError]       = useState('')
  const [busyMsg, setBusyMsg]   = useState('')
  const [demoBusy, setDemoBusy] = useState(false)

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true })
  }, [user, navigate])

  async function handleGoogleSignIn() {
    setBusyMsg('Opening Google sign-in…'); setError('')
    try {
      const { accessToken, expiresIn } = await openGoogleOAuthPopup()
      setBusyMsg('Syncing with Drive…')
      const err = await googleSignIn(accessToken, expiresIn)
      if (err) { setError(err); setBusyMsg(''); return }
      navigate('/dashboard', { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign-in failed')
      setBusyMsg('')
    }
  }

  async function handleDemo() {
    setDemoBusy(true)
    await loadDemoData()
    navigate('/dashboard', { replace: true })
  }

  return (
    <div style={{ minHeight:'100vh', background:'#d8ddf0', display:'flex', alignItems:'center', justifyContent:'center', padding:16, position:'relative', overflow:'hidden' }}>
      {/* Blobs */}
      <div style={{ position:'absolute', width:420, height:420, borderRadius:999, background:'#c4b5fd', top:-100, left:-80, opacity:0.55 }} />
      <div style={{ position:'absolute', width:340, height:340, borderRadius:999, background:'#fbcfe8', bottom:-80, right:-60, opacity:0.55 }} />

      <div style={{ position:'relative', width:'100%', maxWidth:400, background:'rgba(255,255,255,0.84)', borderRadius:24, padding:32, display:'flex', flexDirection:'column', gap:20, boxShadow:'0 8px 32px rgba(0,0,0,0.12)' }}>
        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <AppLogo size={36} />
          <span style={{ fontSize:20, fontWeight:800, color:'#0d1030', letterSpacing:'-0.02em' }}>Arya's Finance</span>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          <h1 style={{ fontSize:30, fontWeight:800, color:'#0d1030', lineHeight:1.2 }}>Your wealth,<br/>your purpose</h1>
          <p style={{ fontSize:14, color:'#8891b0', lineHeight:1.6 }}>Track expenses, plan budgets, and stay on top of every transaction.</p>
        </div>

        {sessionNote && !error && (
          <div style={{ fontSize:13, color:'#b45309', background:'rgba(245,158,11,0.12)', borderRadius:8, padding:'10px 14px', lineHeight:1.5 }}>
            {sessionNote}
          </div>
        )}
        {error && <div style={{ fontSize:13, color:'#f03d50', background:'rgba(240,61,80,0.1)', borderRadius:6, padding:'8px 12px' }}>{error}</div>}

        <button onClick={handleGoogleSignIn} disabled={!!busyMsg} style={{ background:'white', border:'1px solid #e0e4f2', borderRadius:100, padding:'14px 32px', display:'flex', alignItems:'center', justifyContent:'center', gap:10, cursor: busyMsg ? 'wait' : 'pointer', fontSize:15, fontWeight:700, color:'#0d1030', opacity: busyMsg?0.6:1 }}>
          {busyMsg ? (
            <span style={{ fontSize:13, color:'#8891b0' }}>{busyMsg}</span>
          ) : (
            <><span style={{ color:'#4285f4', fontWeight:800, fontSize:16 }}>G</span>Sign in with Google</>
          )}
        </button>

        <button onClick={handleDemo} disabled={demoBusy} style={{ background:'none', border:'1px solid #e0e4f2', borderRadius:100, padding:'12px 32px', cursor:'pointer', fontSize:14, color:'#8891b0', opacity: demoBusy?0.6:1 }}>
          {demoBusy ? 'Loading demo…' : 'Try Demo'}
        </button>
      </div>
    </div>
  )
}

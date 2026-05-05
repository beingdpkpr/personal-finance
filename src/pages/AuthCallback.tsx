import { useEffect } from 'react'

export default function AuthCallback() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1))
    const accessToken = params.get('access_token')
    const expiresIn   = parseInt(params.get('expires_in') ?? '3600', 10)
    const error       = params.get('error')

    if (window.opener) {
      if (accessToken) {
        window.opener.postMessage(
          { type: 'google-oauth', accessToken, expiresIn },
          window.location.origin,
        )
      } else {
        window.opener.postMessage(
          { type: 'google-oauth-error', error: error ?? 'Unknown error' },
          window.location.origin,
        )
      }
      window.close()
    }
  }, [])

  return (
    <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0c0d14', flexDirection:'column', gap:12 }}>
      <div style={{ width:34, height:34, borderRadius:10, background:'linear-gradient(135deg,#6d5ce6,#7c6ef5)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, color:'#fff', fontWeight:800 }}>A</div>
      <div style={{ color:'#8891b0', fontFamily:'DM Sans', fontSize:14 }}>Signing in…</div>
    </div>
  )
}

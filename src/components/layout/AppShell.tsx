import { Outlet } from 'react-router-dom'
export default function AppShell() {
  return (
    <div style={{display:'flex',height:'100vh',background:'var(--bg)'}}>
      <main style={{flex:1,overflowY:'auto',padding:28,color:'var(--text)'}}>
        <Outlet />
      </main>
    </div>
  )
}

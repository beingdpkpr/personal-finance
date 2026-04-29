import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import AddTransactionModal from '../modals/AddTransactionModal'
// TODO: mobile — import DockNav from './DockNav'

export default function AppShell() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div style={{ display:'flex', height:'100vh', background:'var(--bg)', overflow:'hidden' }}>
      <Sidebar collapsed={collapsed} />
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>
        <Header onToggleSidebar={() => setCollapsed(c => !c)} />
        <main style={{ flex:1, overflowY:'auto', background:'var(--bg)' }}>
          <Outlet />
        </main>
      </div>
      <AddTransactionModal />
    </div>
  )
}

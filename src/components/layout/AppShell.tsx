import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import AddTransactionModal from '../modals/AddTransactionModal'
import { useFinanceContext } from '../../hooks/FinanceContext'

export default function AppShell() {
  const [collapsed, setCollapsed] = useState(false)
  const { syncError } = useFinanceContext()
  const [visibleError, setVisibleError] = useState<string | null>(null)

  useEffect(() => {
    if (!syncError) return
    setVisibleError(syncError)
    const t = setTimeout(() => setVisibleError(null), 6000)
    return () => clearTimeout(t)
  }, [syncError])

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

      {/* Sync error toast */}
      {visibleError && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--surface)', border: '1px solid var(--negative)',
          borderRadius: 12, padding: '12px 18px', display: 'flex', alignItems: 'center',
          gap: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', zIndex: 2000,
          animation: 'slideUp 0.2s ease both', maxWidth: 420,
        }}>
          <span style={{ fontSize: 16 }}>⚠️</span>
          <span style={{ fontSize: 13, color: 'var(--text)', flex: 1, lineHeight: 1.4 }}>
            <strong style={{ color: 'var(--negative)' }}>Sync failed.</strong> Your changes are saved locally and will retry automatically.
          </span>
          <button
            onClick={() => setVisibleError(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', fontSize: 16, padding: '0 2px', flexShrink: 0 }}
          >×</button>
        </div>
      )}
    </div>
  )
}

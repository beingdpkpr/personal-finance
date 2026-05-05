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
          <span style={{ color: 'var(--warning)', display:'flex' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </span>
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

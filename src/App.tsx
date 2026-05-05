import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useFinanceContext } from './hooks/FinanceContext'
import AppShell from './components/layout/AppShell'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Accounts from './pages/Accounts'
import Transactions from './pages/Transactions'
import Analytics from './pages/Analytics'
import Budget from './pages/Budget'
import Goals from './pages/Goals'
import Monthly from './pages/Monthly'

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useFinanceContext()
  if (loading) return (
    <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)' }}>
      <div style={{ color:'var(--text-dim)', fontFamily:'DM Sans', fontSize:14 }}>Loading…</div>
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  const base = import.meta.env.BASE_URL   // '/' locally, '/personal-finance/' in prod
  return (
    <BrowserRouter basename={base}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<AuthGuard><AppShell /></AuthGuard>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"    element={<Dashboard />} />
          <Route path="accounts"     element={<Accounts />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="analytics"    element={<Analytics />} />
          <Route path="budget"       element={<Budget />} />
          <Route path="goals"        element={<Goals />} />
          <Route path="monthly"      element={<Monthly />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

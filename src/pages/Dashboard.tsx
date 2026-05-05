import { useNavigate } from 'react-router-dom'
import { useFinanceContext } from '../hooks/FinanceContext'
import { fmt } from '../lib/format'
import { EXPENSE_CATS, INCOME_CATS, MONTHS } from '../constants/categories'
import Card from '../components/ui/Card'
import StatCard from '../components/ui/StatCard'
import AreaChart from '../components/charts/AreaChart'
import DonutChart from '../components/charts/DonutChart'

const ACC_PALETTE = ['#7c6ef5','#22c55e','#f59e0b','#ec4899','#3b82f6','#f97316']

function pctChange(curr: number, prev: number): number {
  if (prev === 0) return 0
  return Math.round(Math.abs((curr - prev) / Math.abs(prev)) * 1000) / 10
}

function fmtShortDate(d: string): string {
  const date = new Date(d + 'T00:00:00')
  return `${MONTHS[date.getMonth()]} ${date.getDate()}`
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { txns, nw } = useFinanceContext()

  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`
  // Use the most recent month with transactions, capped at current month
  const txnMonths = [...new Set(txns.map(t => t.date.slice(0, 7)))].filter(m => m <= currentMonth).sort()
  const thisMonth = txnMonths.length > 0 ? txnMonths[txnMonths.length - 1] : currentMonth
  const [ty, tm] = thisMonth.split('-').map(Number)
  const prevD = new Date(ty, tm - 2, 1)
  const lastMonth = `${prevD.getFullYear()}-${String(prevD.getMonth()+1).padStart(2,'0')}`
  const monthLabel = new Date(ty, tm - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' })

  const monthTxns = txns.filter(t => t.date.startsWith(thisMonth))
  const lastTxns  = txns.filter(t => t.date.startsWith(lastMonth))

  const monthIncome   = monthTxns.filter(t => t.type==='income').reduce((s,t) => s+t.amount, 0)
  const monthExpense  = monthTxns.filter(t => t.type==='expense').reduce((s,t) => s+t.amount, 0)
  const lastIncome    = lastTxns.filter(t => t.type==='income').reduce((s,t) => s+t.amount, 0)
  const lastExpense   = lastTxns.filter(t => t.type==='expense').reduce((s,t) => s+t.amount, 0)
  const netSavings    = monthIncome - monthExpense
  const lastNetSavings = lastIncome - lastExpense

  const totalAssets = nw.assets.reduce((s,a) => s+a.value, 0)
  const totalLiab   = nw.liabilities.reduce((s,l) => s+l.value, 0)
  const netWorth    = totalAssets - totalLiab
  const lastNW      = netWorth - netSavings

  const areaData = Array.from({length:6}, (_,i) => {
    const d = new Date(ty, tm-1-5+i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
    const mt = txns.filter(t => t.date.startsWith(key))
    return {
      month: MONTHS[d.getMonth()],
      income:  mt.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0),
      expense: mt.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0),
    }
  })

  const catSpend = EXPENSE_CATS.map(c => ({
    label: c.label, color: c.color,
    amount: monthTxns.filter(t=>t.type==='expense'&&t.category===c.id).reduce((s,t)=>s+t.amount,0),
  })).filter(c => c.amount > 0)
  const totalCatSpend = catSpend.reduce((s,c)=>s+c.amount,0)
  const donutSegs = catSpend.map(c=>({ label:c.label, color:c.color, pct: totalCatSpend>0?(c.amount/totalCatSpend)*100:0 }))

  const recentTxns = [...txns].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,6)
  const allAccounts = [
    ...nw.assets.map(a => ({ ...a, isLiability: false })),
    ...nw.liabilities.map(l => ({ ...l, isLiability: true })),
  ]

  return (
    <div style={{ padding:28, display:'flex', flexDirection:'column', gap:22 }}>
      {/* Stat cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 }}>
        <StatCard label="Net Worth" value={fmt(netWorth)} color="#7c6ef5" delay={0}
          sub={String(pctChange(netWorth, lastNW))} positive={netWorth >= lastNW}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>} />
        <StatCard label={`Income · ${monthLabel}`} value={fmt(monthIncome)} color="#22c55e" delay={0.05}
          sub={String(pctChange(monthIncome, lastIncome))} positive={monthIncome >= lastIncome}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>} />
        <StatCard label={`Spend · ${monthLabel}`} value={fmt(monthExpense)} color="#f87171" delay={0.1}
          sub={String(pctChange(monthExpense, lastExpense))} positive={monthExpense <= lastExpense}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>} />
        <StatCard label={`Savings · ${monthLabel}`} value={fmt(netSavings)} color="#f59e0b" delay={0.15}
          sub={String(pctChange(netSavings, lastNetSavings))} positive={netSavings >= lastNetSavings}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M19 7H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M16 3H8l-1 4h10l-1-4z"/><circle cx="12" cy="13" r="2"/></svg>} />
      </div>

      {/* Charts row */}
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16 }}>
        <Card>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div>
              <div style={{ fontSize:14, fontWeight:600, color:'var(--text)' }}>Cash Flow</div>
              <div style={{ fontSize:12, color:'var(--text-dim)' }}>Income vs Expenses · Last 6 months</div>
            </div>
            <div style={{ display:'flex', gap:14, alignItems:'center' }}>
              <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'var(--text-mid)' }}><span style={{ width:10, height:3, borderRadius:2, background:'var(--accent)', display:'inline-block' }}></span>Income</span>
              <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'var(--text-mid)' }}><span style={{ width:10, height:3, borderRadius:2, background:'#f87171', display:'inline-block' }}></span>Expenses</span>
            </div>
          </div>
          <AreaChart data={areaData} />
        </Card>
        <Card>
          <div style={{ fontSize:14, fontWeight:600, color:'var(--text)', marginBottom:4 }}>Spending Breakdown</div>
          <div style={{ fontSize:12, color:'var(--text-dim)', marginBottom:16 }}>By category</div>
          <div style={{ display:'flex', gap:14, alignItems:'center' }}>
            <DonutChart segments={donutSegs} size={110} centerLabel={fmt(totalCatSpend)} centerSub={`${MONTHS[tm-1]} spend`} />
            <div style={{ flex:1, display:'flex', flexDirection:'column', gap:7 }}>
              {donutSegs.slice(0,5).map(c => (
                <div key={c.label} style={{ display:'flex', alignItems:'center', gap:7 }}>
                  <span style={{ width:8, height:8, borderRadius:'50%', background:c.color, flexShrink:0 }}></span>
                  <span style={{ fontSize:12, color:'var(--text-mid)', flex:1 }}>{c.label}</span>
                  <span style={{ fontSize:12, fontFamily:'DM Mono', color:'var(--text)' }}>{Math.round(c.pct)}%</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Recent transactions + Accounts */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        {/* Recent Transactions */}
        <Card>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div style={{ fontSize:14, fontWeight:600, color:'var(--text)' }}>Recent Transactions</div>
            <button onClick={() => navigate('/transactions')} style={{ background:'none', border:'none', color:'var(--accent)', cursor:'pointer', fontSize:12, fontWeight:500 }}>
              View all →
            </button>
          </div>
          {recentTxns.length === 0 ? (
            <div style={{ color:'var(--text-dim)', fontSize:13, textAlign:'center', padding:'20px 0' }}>No transactions yet</div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column' }}>
              {recentTxns.map((t) => {
                const cat = t.type === 'income'
                  ? INCOME_CATS.find(c => c.id === t.category)
                  : EXPENSE_CATS.find(c => c.id === t.category)
                const color = cat?.color ?? '#888'
                const initial = (cat?.label ?? t.category).slice(0,1).toUpperCase()
                return (
                  <div key={t.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'8px 10px', borderRadius:10, cursor:'pointer', transition:'background 0.15s' }}
                    onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='var(--surface3)'}
                    onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='transparent'}>
                    <div style={{ width:36, height:36, borderRadius:10, background:`${color}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color, flexShrink:0, fontFamily:'DM Sans, sans-serif' }}>
                      {initial}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:500, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.description}</div>
                      <div style={{ fontSize:11, color:'var(--text-dim)', marginTop:2 }}>{cat?.label ?? t.category} · {fmtShortDate(t.date)}</div>
                    </div>
                    <div style={{ fontSize:13, fontWeight:600, fontFamily:'DM Mono', color: t.type==='income' ? 'var(--positive)' : 'var(--text)', flexShrink:0 }}>
                      {t.type==='income' ? '+' : '-'}{fmt(t.amount)}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* Accounts */}
        <Card>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div style={{ fontSize:14, fontWeight:600, color:'var(--text)' }}>Accounts</div>
            <button onClick={() => navigate('/accounts')} style={{ background:'none', border:'none', color:'var(--accent)', cursor:'pointer', fontSize:12, fontWeight:500 }}>
              Manage →
            </button>
          </div>
          {allAccounts.length === 0 ? (
            <div style={{ color:'var(--text-dim)', fontSize:13, textAlign:'center', padding:'20px 0' }}>No accounts yet</div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column' }}>
              {allAccounts.slice(0, 6).map((acc, i) => {
                const accColor = ACC_PALETTE[i % ACC_PALETTE.length]
                const accInitial = acc.name.slice(0,1).toUpperCase()
                return (
                  <div key={acc.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'8px 10px', borderRadius:10, cursor:'pointer', transition:'background 0.15s' }}
                    onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='var(--surface3)'}
                    onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='transparent'}>
                    <div style={{ width:36, height:36, borderRadius:10, background:`${accColor}20`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:accColor, flexShrink:0, border:`1px solid ${accColor}30`, fontFamily:'DM Sans, sans-serif' }}>
                      {accInitial}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:500, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{acc.name}</div>
                      <div style={{ fontSize:11, color:'var(--text-dim)', marginTop:2 }}>{acc.isLiability ? 'Liability' : 'Asset'}</div>
                    </div>
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <div style={{ fontSize:13, fontWeight:700, fontFamily:'DM Mono', color: acc.isLiability ? 'var(--negative)' : 'var(--text)' }}>
                        {acc.isLiability ? '-' : ''}{fmt(acc.value)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

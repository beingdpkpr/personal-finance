import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFinanceContext } from '../hooks/FinanceContext'
import { fmt } from '../lib/format'
import { MONTHS, INCOME_CATS } from '../constants/categories'
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
  const { txns, nw, categories, openAdd, prefs, setPrefs } = useFinanceContext()
  const [cashFlowMonths, setCashFlowMonths] = useState<6 | 12>(() => prefs.defaultCashFlowMonths)

  function handleMonthToggle(n: 6 | 12) {
    setCashFlowMonths(n)
    setPrefs({ ...prefs, defaultCashFlowMonths: n })
  }

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
  const savingsRate   = monthIncome > 0 ? Math.round((netSavings / monthIncome) * 100) : 0

  const totalAssets = nw.assets.reduce((s,a) => s+a.value, 0)
  const totalLiab   = nw.liabilities.reduce((s,l) => s+l.value, 0)
  const netWorth    = totalAssets - totalLiab
  const lastNW      = netWorth - netSavings

  const areaData = Array.from({length: cashFlowMonths}, (_,i) => {
    const d = new Date(ty, tm-1-(cashFlowMonths-1)+i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
    const mt = txns.filter(t => t.date.startsWith(key))
    return {
      month: `${MONTHS[d.getMonth()]}${d.getFullYear() !== ty ? ` '${String(d.getFullYear()).slice(2)}` : ''}`,
      income:  mt.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0),
      expense: mt.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0),
    }
  })

  const catSpend = categories.map(c => ({
    label: c.label, color: c.color,
    amount: monthTxns.filter(t=>t.type==='expense'&&t.category===c.id).reduce((s,t)=>s+t.amount,0),
  })).filter(c => c.amount > 0).sort((a,b) => b.amount - a.amount)
  const totalCatSpend = catSpend.reduce((s,c)=>s+c.amount,0)
  const top5 = catSpend.slice(0, 5)
  const otherAmt = catSpend.slice(5).reduce((s,c) => s+c.amount, 0)
  const donutEntries = otherAmt > 0 ? [...top5, { label:'Other', color:'#6b7280', amount: otherAmt }] : top5
  const donutSegs = donutEntries.map(c=>({ label:c.label, color:c.color, pct: totalCatSpend>0?(c.amount/totalCatSpend)*100:0 }))

  // Net worth trend: reconstruct NW for last 6 months by reversing monthly net savings
  const nwTrend = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(ty, tm - 1 - (5 - i), 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const mt = txns.filter(t => t.date.startsWith(key))
    return mt.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
         - mt.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  }).reduce<number[]>((acc, delta, i) => {
    acc.push(i === 0 ? netWorth - areaData.slice(0, 5).reduce((s, d) => s + d.income - d.expense, 0) : acc[i - 1] + delta)
    return acc
  }, [])

  const recentTxns = [...txns].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,6)
  const allAccounts = [
    ...nw.assets.map(a => ({ ...a, isLiability: false })),
    ...nw.liabilities.map(l => ({ ...l, isLiability: true })),
  ]

  return (
    <div className="page-pad">
      {/* Stat cards */}
      <div className="grid-stat-cards">
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
          rate={savingsRate}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M19 7H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M16 3H8l-1 4h10l-1-4z"/><circle cx="12" cy="13" r="2"/></svg>} />
      </div>

      {/* Charts row */}
      <div className="grid-chart-row">
        <Card>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div>
              <div style={{ fontSize:14, fontWeight:600, color:'var(--text)' }}>Cash Flow</div>
              <div style={{ fontSize:12, color:'var(--text-dim)' }}>Income vs Expenses · Last {cashFlowMonths} months</div>
            </div>
              <div style={{ display:'flex', gap:4 }}>
                {([6, 12] as const).map(n => (
                  <button key={n} onClick={() => handleMonthToggle(n)} style={{ padding:'3px 10px', borderRadius:20, border: cashFlowMonths===n ? '1px solid var(--accent)' : '1px solid var(--border)', background: cashFlowMonths===n ? 'var(--accent-dim)' : 'transparent', color: cashFlowMonths===n ? 'var(--accent)' : 'var(--text-dim)', cursor:'pointer', fontSize:11, fontWeight: cashFlowMonths===n ? 600 : 400 }}>{n}M</button>
                ))}
              </div>
          </div>
          <AreaChart data={areaData} showAvgLine />
          <div style={{ display:'flex', gap:14, marginTop:8 }}>
            <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'var(--text-dim)' }}><span style={{ width:12, height:3, borderRadius:2, background:'var(--accent)', display:'inline-block' }}></span>Income</span>
            <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'var(--text-dim)' }}><span style={{ width:12, height:3, borderRadius:2, background:'#f87171', display:'inline-block' }}></span>Expenses</span>
            <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'var(--text-dim)' }}><span style={{ width:12, height:1, borderRadius:2, background:'#f87171', display:'inline-block', opacity:0.5 }}></span>Avg spend</span>
          </div>
        </Card>
        <Card>
          <div style={{ fontSize:14, fontWeight:600, color:'var(--text)', marginBottom:4 }}>Spending Breakdown</div>
          <div style={{ fontSize:12, color:'var(--text-dim)', marginBottom:16 }}>By category</div>
          <div style={{ display:'flex', gap:14, alignItems:'center' }}>
            <DonutChart segments={donutSegs} size={110} centerLabel={fmt(totalCatSpend)} centerSub={`${MONTHS[tm-1]} spend`}
              onSegmentClick={i => navigate(`/transactions?q=${encodeURIComponent(donutSegs[i].label)}`)} />
            <div style={{ flex:1, display:'flex', flexDirection:'column', gap:7 }}>
              {donutSegs.map((c, i) => (
                <div key={c.label} onClick={() => navigate(`/transactions?q=${encodeURIComponent(c.label)}`)}
                  style={{ display:'flex', alignItems:'center', gap:7, cursor:'pointer', borderRadius:6, padding:'2px 4px', transition:'background 0.12s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface3)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <span style={{ width:8, height:8, borderRadius:'50%', background:c.color, flexShrink:0 }}></span>
                  <span style={{ fontSize:12, color:'var(--text-mid)', flex:1 }}>{c.label}</span>
                  <span style={{ fontSize:11, fontFamily:'DM Mono', color:'var(--text-dim)' }}>{Math.round(c.pct)}%</span>
                  <span style={{ fontSize:12, fontFamily:'DM Mono', color:'var(--text)', minWidth:56, textAlign:'right' }}>{fmt(totalCatSpend * c.pct / 100)}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Recent transactions + Accounts */}
      <div className="grid-half">
        {/* Recent Transactions */}
        <Card>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div style={{ fontSize:14, fontWeight:600, color:'var(--text)' }}>Recent Transactions</div>
            <div style={{ display:'flex', gap:10, alignItems:'center' }}>
              <button onClick={openAdd} style={{ padding:'4px 12px', borderRadius:20, border:'1px solid var(--accent)', background:'var(--accent-dim)', color:'var(--accent)', cursor:'pointer', fontSize:12, fontWeight:600 }}>+ Add</button>
              <button onClick={() => navigate('/transactions')} style={{ background:'none', border:'none', color:'var(--accent)', cursor:'pointer', fontSize:12, fontWeight:500 }}>View all →</button>
            </div>
          </div>
          {recentTxns.length === 0 ? (
            <div style={{ color:'var(--text-dim)', fontSize:13, textAlign:'center', padding:'20px 0' }}>No transactions yet</div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column' }}>
              {recentTxns.map((t) => {
                const cat = t.type === 'income'
                  ? INCOME_CATS.find(c => c.id === t.category)
                  : categories.find(c => c.id === t.category)
                const color = cat?.color ?? '#888'
                return (
                  <div key={t.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'8px 10px', borderRadius:10, cursor:'pointer', transition:'background 0.15s' }}
                    onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='var(--surface3)'}
                    onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='transparent'}>
                    <div style={{ width:36, height:36, borderRadius:10, background:`${color}18`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, border:`1.5px solid ${color}40` }}>
                      <span style={{ width:10, height:10, borderRadius:'50%', background:color, display:'inline-block' }} />
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:500, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.description}</div>
                      <div style={{ fontSize:11, color:'var(--text-dim)', marginTop:2 }}>{cat?.label ?? t.category} · {fmtShortDate(t.date)}</div>
                    </div>
                    <div style={{ fontSize:13, fontWeight:600, fontFamily:'DM Mono', color: t.type==='income' ? 'var(--positive)' : 'var(--negative)', flexShrink:0 }}>
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
            <div>
              <div style={{ fontSize:14, fontWeight:600, color:'var(--text)' }}>Accounts</div>
              {nwTrend.length > 1 && (() => {
                const min = Math.min(...nwTrend), max = Math.max(...nwTrend)
                const range = max - min || 1
                const W = 80, H = 24
                const pts = nwTrend.map((v, i) => `${(i / (nwTrend.length - 1)) * W},${H - ((v - min) / range) * H}`).join(' ')
                const up = nwTrend[nwTrend.length - 1] >= nwTrend[0]
                return (
                  <svg width={W} height={H} style={{ display:'block', marginTop:4 }}>
                    <polyline points={pts} fill="none" stroke={up ? 'var(--positive)' : 'var(--negative)'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )
              })()}
            </div>
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
                return (
                  <div key={acc.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'8px 10px', borderRadius:10, cursor:'pointer', transition:'background 0.15s' }}
                    onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='var(--surface3)'}
                    onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='transparent'}>
                    <div style={{ width:36, height:36, borderRadius:10, background:`${accColor}18`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, border:`1.5px solid ${accColor}40` }}>
                      <span style={{ width:10, height:10, borderRadius:'50%', background:accColor, display:'inline-block' }} />
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
              {allAccounts.length > 6 && (
                <div style={{ padding:'4px 10px', fontSize:11, color:'var(--text-dim)' }}>and {allAccounts.length - 6} more · <span style={{ color:'var(--accent)', cursor:'pointer' }} onClick={() => navigate('/accounts')}>Manage →</span></div>
              )}
              <div style={{ borderTop:'1px solid var(--border)', marginTop:4, paddingTop:8, display:'flex', flexDirection:'column', gap:4 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'2px 10px' }}>
                  <span style={{ fontSize:11, color:'var(--text-dim)' }}>Total Assets</span>
                  <span style={{ fontSize:12, fontWeight:700, fontFamily:'DM Mono', color:'var(--positive)' }}>{fmt(totalAssets)}</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'2px 10px' }}>
                  <span style={{ fontSize:11, color:'var(--text-dim)' }}>Total Liabilities</span>
                  <span style={{ fontSize:12, fontWeight:700, fontFamily:'DM Mono', color:'var(--negative)' }}>-{fmt(totalLiab)}</span>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

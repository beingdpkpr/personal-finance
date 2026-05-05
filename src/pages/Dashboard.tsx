import { useNavigate } from 'react-router-dom'
import { useFinanceContext } from '../hooks/FinanceContext'
import { fmt } from '../lib/format'
import { EXPENSE_CATS, INCOME_CATS, MONTHS } from '../constants/categories'
import Card from '../components/ui/Card'
import StatCard from '../components/ui/StatCard'
import AreaChart from '../components/charts/AreaChart'
import DonutChart from '../components/charts/DonutChart'

const CAT_ICONS: Record<string, string> = {
  essentials: '🧾', food: '🍽', transport: '🚗', entertainment: '🎬',
  shopping: '🛍', health: '💊', savings: '📈', family: '👨‍👩‍👧', other: '📌',
  salary: '💰', freelance: '💻',
}

const ACC_PALETTE = ['#7c6ef5','#22c55e','#f59e0b','#ec4899','#3b82f6','#f97316']
const ACC_ICONS   = ['🏦','💰','📈','💵','🏛','📊']

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
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`
  const prevD = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonth = `${prevD.getFullYear()}-${String(prevD.getMonth()+1).padStart(2,'0')}`

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
    const d = new Date(now.getFullYear(), now.getMonth()-5+i, 1)
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
        <StatCard label="Net Worth"        value={fmt(netWorth)}    icon="💎" color="#7c6ef5" delay={0}
          sub={String(pctChange(netWorth, lastNW))} positive={netWorth >= lastNW} />
        <StatCard label="Monthly Income"   value={fmt(monthIncome)} icon="↑"  color="#22c55e" delay={0.05}
          sub={String(pctChange(monthIncome, lastIncome))} positive={monthIncome >= lastIncome} />
        <StatCard label="Monthly Spend"    value={fmt(monthExpense)} icon="↓" color="#f87171" delay={0.1}
          sub={String(pctChange(monthExpense, lastExpense))} positive={monthExpense <= lastExpense} />
        <StatCard label="Total Savings"    value={fmt(netSavings)}  icon="🏦" color="#f59e0b" delay={0.15}
          sub={String(pctChange(netSavings, lastNetSavings))} positive={netSavings >= lastNetSavings} />
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
            <DonutChart segments={donutSegs} size={110} centerLabel={fmt(totalCatSpend)} centerSub={`${MONTHS[now.getMonth()]} spend`} />
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
                const icon = CAT_ICONS[t.category] ?? (t.type==='income' ? '↑' : '↓')
                return (
                  <div key={t.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'8px 10px', borderRadius:10, cursor:'pointer', transition:'background 0.15s' }}
                    onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='var(--surface3)'}
                    onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='transparent'}>
                    <div style={{ width:36, height:36, borderRadius:10, background:`${color}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>
                      {icon}
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
                const accIcon  = acc.isLiability ? '💳' : ACC_ICONS[i % ACC_ICONS.length]
                return (
                  <div key={acc.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'8px 10px', borderRadius:10, cursor:'pointer', transition:'background 0.15s' }}
                    onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='var(--surface3)'}
                    onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='transparent'}>
                    <div style={{ width:36, height:36, borderRadius:10, background:`${accColor}20`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0, border:`1px solid ${accColor}30` }}>
                      {accIcon}
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

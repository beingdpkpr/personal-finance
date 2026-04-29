import { useNavigate } from 'react-router-dom'
import { useFinanceContext } from '../hooks/FinanceContext'
import { fmt } from '../lib/format'
import { EXPENSE_CATS, INCOME_CATS, MONTHS } from '../constants/categories'
import Card from '../components/ui/Card'
import StatCard from '../components/ui/StatCard'
import AreaChart from '../components/charts/AreaChart'
import DonutChart from '../components/charts/DonutChart'

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
              <div style={{ fontSize:14, fontWeight:600, color:'var(--text)' }}>Income vs Expenses</div>
              <div style={{ fontSize:12, color:'var(--text-dim)' }}>Last 6 months</div>
            </div>
            <div style={{ display:'flex', gap:12, fontSize:11 }}>
              <span style={{ color:'var(--text-dim)' }}><span style={{ color:'#7c6ef5' }}>●</span> Income</span>
              <span style={{ color:'var(--text-dim)' }}><span style={{ color:'#f87171' }}>●</span> Expenses</span>
            </div>
          </div>
          <AreaChart data={areaData} />
        </Card>
        <Card>
          <div style={{ fontSize:14, fontWeight:600, color:'var(--text)', marginBottom:4 }}>Spending</div>
          <div style={{ fontSize:12, color:'var(--text-dim)', marginBottom:16 }}>By category</div>
          <div style={{ display:'flex', justifyContent:'center' }}>
            <DonutChart segments={donutSegs} size={130} centerLabel={fmt(totalCatSpend)} centerSub="spent" />
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:6, marginTop:12 }}>
            {catSpend.slice(0,4).map(c => (
              <div key={c.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:11 }}>
                <span style={{ color:'var(--text-dim)', display:'flex', gap:6, alignItems:'center' }}><span style={{ color:c.color }}>●</span>{c.label}</span>
                <span style={{ color:'var(--text)', fontFamily:'DM Mono', fontWeight:500 }}>{fmt(c.amount)}</span>
              </div>
            ))}
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
              {recentTxns.map((t, i) => {
                const cat = t.type === 'income'
                  ? INCOME_CATS.find(c => c.id === t.category)
                  : EXPENSE_CATS.find(c => c.id === t.category)
                const color = cat?.color ?? '#888'
                return (
                  <div key={t.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom: i < recentTxns.length-1 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ width:38, height:38, borderRadius:10, background:`${color}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, flexShrink:0, color }}>
                      {t.type==='income' ? '↑' : '↓'}
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
              {allAccounts.slice(0, 6).map((acc, i) => (
                <div key={acc.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom: i < Math.min(allAccounts.length, 6)-1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ width:38, height:38, borderRadius:10, background: acc.isLiability ? 'oklch(0.22 0.08 25)' : 'oklch(0.22 0.08 145)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>
                    {acc.isLiability ? '💳' : '🏦'}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:500, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{acc.name}</div>
                    <div style={{ fontSize:11, color:'var(--text-dim)', marginTop:2 }}>{acc.isLiability ? 'Liability' : 'Asset'}</div>
                  </div>
                  <div style={{ fontSize:13, fontWeight:600, fontFamily:'DM Mono', color: acc.isLiability ? 'var(--negative)' : 'var(--text)', flexShrink:0 }}>
                    {acc.isLiability ? '-' : ''}{fmt(acc.value)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

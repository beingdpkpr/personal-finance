import { useFinanceContext } from '../hooks/FinanceContext'
import { fmt } from '../lib/format'
import { resolveLimit } from '../lib/data'
import { EXPENSE_CATS, MONTHS } from '../constants/categories'
import Card from '../components/ui/Card'
import StatCard from '../components/ui/StatCard'
import ProgressBar from '../components/ui/ProgressBar'
import AreaChart from '../components/charts/AreaChart'
import DonutChart from '../components/charts/DonutChart'

export default function Dashboard() {
  const { txns, budgets, nw, openAdd } = useFinanceContext()

  const now = new Date()
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`
  const monthTxns = txns.filter(t => t.date.startsWith(thisMonth))
  const monthIncome  = monthTxns.filter(t => t.type==='income').reduce((s,t) => s+t.amount, 0)
  const monthExpense = monthTxns.filter(t => t.type==='expense').reduce((s,t) => s+t.amount, 0)
  const netSavings   = monthIncome - monthExpense
  const savingsRate  = monthIncome > 0 ? Math.round((netSavings/monthIncome)*100) : 0
  const totalAssets  = nw.assets.reduce((s,a) => s+a.value, 0)
  const totalLiab    = nw.liabilities.reduce((s,l) => s+l.value, 0)
  const netWorth     = totalAssets - totalLiab

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

  const budgetAlerts = EXPENSE_CATS.map(c => {
    const spent = monthTxns.filter(t=>t.type==='expense'&&t.category===c.id).reduce((s,t)=>s+t.amount,0)
    const limit = resolveLimit(budgets[c.id], monthIncome)
    const pct   = limit > 0 ? (spent/limit)*100 : 0
    return { ...c, spent, limit, pct }
  }).filter(c => c.pct >= 80 && c.limit > 0)

  const recentTxns = [...txns].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,8)

  return (
    <div style={{ padding:28, display:'flex', flexDirection:'column', gap:22 }}>
      {/* Stat cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 }}>
        <StatCard label="Net Worth"      value={fmt(netWorth)}     icon="💼" color="#7c6ef5" delay={0}   />
        <StatCard label="Monthly Income" value={fmt(monthIncome)}  icon="↑"  color="#22c55e" delay={0.05}/>
        <StatCard label="Monthly Expenses" value={fmt(monthExpense)} icon="↓" color="#f87171" delay={0.1} />
        <StatCard label="Savings Rate"   value={`${savingsRate}%`} icon="💰" color="#f59e0b" delay={0.15}/>
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

      {/* Budget alerts */}
      {budgetAlerts.length > 0 && (
        <Card>
          <div style={{ fontSize:14, fontWeight:600, color:'var(--text)', marginBottom:14 }}>Budget Alerts</div>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {budgetAlerts.map(a => (
              <div key={a.id}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                  <span style={{ fontSize:13, color:'var(--text)' }}>{a.label}</span>
                  <span style={{ fontSize:12, fontFamily:'DM Mono', color: a.pct >= 100 ? 'var(--negative)' : 'var(--warning)' }}>
                    {fmt(a.spent)} / {fmt(a.limit)}
                  </span>
                </div>
                <ProgressBar pct={a.pct} />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent transactions */}
      <Card>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <div style={{ fontSize:14, fontWeight:600, color:'var(--text)' }}>Recent Transactions</div>
          <button onClick={openAdd} style={{ padding:'6px 14px', borderRadius:20, border:'1px solid var(--accent)', background:'var(--accent-dim)', color:'var(--accent)', cursor:'pointer', fontSize:12, fontWeight:600 }}>+ Add</button>
        </div>
        {recentTxns.length === 0 ? (
          <div style={{ color:'var(--text-dim)', fontSize:13, textAlign:'center', padding:'20px 0' }}>No transactions yet</div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {recentTxns.map(t => {
              const cat = EXPENSE_CATS.find(c=>c.id===t.category)
              return (
                <div key={t.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:`${cat?.color ?? '#888'}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>
                    {t.type==='income' ? '↑' : '↓'}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:500, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.description}</div>
                    <div style={{ fontSize:11, color:'var(--text-dim)' }}>{t.date} · {cat?.label ?? t.category}</div>
                  </div>
                  <div style={{ fontSize:14, fontWeight:600, fontFamily:'DM Mono', color: t.type==='income'?'var(--positive)':'var(--negative)', flexShrink:0 }}>
                    {t.type==='income'?'+':'-'}{fmt(t.amount)}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}

import { useFinanceContext } from '../hooks/FinanceContext'
import { fmt } from '../lib/format'
import { EXPENSE_CATS, MONTHS } from '../constants/categories'
import Card from '../components/ui/Card'
import ProgressBar from '../components/ui/ProgressBar'
import AreaChart from '../components/charts/AreaChart'
import BarChart from '../components/charts/BarChart'

export default function Analytics() {
  const { txns } = useFinanceContext()
  const now = new Date()

  // Last 6 months for area chart
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

  // Monthly expenses for current year (bar chart)
  const barData = Array.from({length:12}, (_,i) => {
    const key = `${now.getFullYear()}-${String(i+1).padStart(2,'0')}`
    const amount = txns.filter(t=>t.date.startsWith(key)&&t.type==='expense').reduce((s,t)=>s+t.amount,0)
    return { month: MONTHS[i], amount }
  })

  // Current month category breakdown
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`
  const monthExpTxns = txns.filter(t=>t.date.startsWith(thisMonth)&&t.type==='expense')
  const totalExp = monthExpTxns.reduce((s,t)=>s+t.amount,0)
  const catBreakdown = EXPENSE_CATS.map(c => ({
    ...c,
    amount: monthExpTxns.filter(t=>t.category===c.id).reduce((s,t)=>s+t.amount,0),
  })).filter(c=>c.amount>0).sort((a,b)=>b.amount-a.amount)

  // 6-month summary
  const totalIncome  = areaData.reduce((s,d)=>s+d.income,0)
  const totalExpense = areaData.reduce((s,d)=>s+d.expense,0)
  const avgSavings   = areaData.length > 0 ? Math.round(((totalIncome-totalExpense)/Math.max(totalIncome,1))*100) : 0

  return (
    <div style={{ padding:28, display:'flex', flexDirection:'column', gap:20 }}>
      {/* Area chart + summary */}
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16 }}>
        <Card>
          <div style={{ fontSize:14, fontWeight:600, color:'var(--text)', marginBottom:4 }}>Income vs Expenses</div>
          <div style={{ fontSize:12, color:'var(--text-dim)', marginBottom:16 }}>Last 6 months</div>
          <AreaChart data={areaData} />
        </Card>
        <Card>
          <div style={{ fontSize:14, fontWeight:600, color:'var(--text)', marginBottom:16 }}>6-Month Summary</div>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {[
              { label:'Total Income',  value: fmt(totalIncome),  color:'var(--positive)' },
              { label:'Total Expenses',value: fmt(totalExpense), color:'var(--negative)' },
              { label:'Net Savings',   value: fmt(totalIncome-totalExpense), color: totalIncome-totalExpense>=0?'var(--positive)':'var(--negative)' },
              { label:'Avg Savings Rate', value:`${avgSavings}%`, color:'var(--accent)' },
            ].map(s => (
              <div key={s.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:12, color:'var(--text-dim)' }}>{s.label}</span>
                <span style={{ fontSize:14, fontWeight:700, fontFamily:'DM Mono', color:s.color }}>{s.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Bar chart */}
      <Card>
        <div style={{ fontSize:14, fontWeight:600, color:'var(--text)', marginBottom:4 }}>Monthly Expenses</div>
        <div style={{ fontSize:12, color:'var(--text-dim)', marginBottom:16 }}>{now.getFullYear()}</div>
        <BarChart data={barData} />
      </Card>

      {/* Category breakdown */}
      <Card>
        <div style={{ fontSize:14, fontWeight:600, color:'var(--text)', marginBottom:4 }}>Spending by Category</div>
        <div style={{ fontSize:12, color:'var(--text-dim)', marginBottom:16 }}>Current month</div>
        {catBreakdown.length === 0 ? (
          <div style={{ color:'var(--text-dim)', fontSize:13, textAlign:'center', padding:'24px 0' }}>No expenses this month</div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {catBreakdown.map(c => {
              const pct = totalExp > 0 ? (c.amount/totalExp)*100 : 0
              return (
                <div key={c.id}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ width:10, height:10, borderRadius:5, background:c.color, flexShrink:0 }} />
                      <span style={{ fontSize:13, color:'var(--text)' }}>{c.label}</span>
                    </div>
                    <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                      <span style={{ fontSize:12, color:'var(--text-dim)' }}>{Math.round(pct)}%</span>
                      <span style={{ fontSize:13, fontWeight:600, fontFamily:'DM Mono', color:'var(--text)', minWidth:70, textAlign:'right' }}>{fmt(c.amount)}</span>
                    </div>
                  </div>
                  <ProgressBar pct={pct} color={c.color} height={6} />
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}

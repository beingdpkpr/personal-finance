import { useState } from 'react'
import { useFinanceContext } from '../hooks/FinanceContext'
import { fmt } from '../lib/format'
import { MONTHS } from '../constants/categories'
import { GROUPS, GROUP_LABELS } from '../lib/data'
import Card from '../components/ui/Card'
import ProgressBar from '../components/ui/ProgressBar'
import AreaChart from '../components/charts/AreaChart'
import BarChart from '../components/charts/BarChart'

export default function Analytics() {
  const { txns, categories } = useFinanceContext()
  const [months, setMonths] = useState<6 | 12>(6)
  const now = new Date()

  // Categories that fund accounts are savings transfers, not real spending
  const transferCatIds = new Set(categories.filter(c => c.depositsToAccount).map(c => c.id))
  const isTransfer = (t: { type: string; category?: string }) =>
    t.type === 'expense' && transferCatIds.has(t.category ?? '')

  const areaData = Array.from({length: months}, (_,i) => {
    const d = new Date(now.getFullYear(), now.getMonth()-(months-1)+i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
    const mt = txns.filter(t => t.date.startsWith(key))
    return {
      month: MONTHS[d.getMonth()],
      income:  mt.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0),
      expense: mt.filter(t=>t.type==='expense'&&!isTransfer(t)).reduce((s,t)=>s+t.amount,0),
    }
  })

  // Monthly expenses for current year (bar chart)
  const barData = Array.from({length:12}, (_,i) => {
    const key = `${now.getFullYear()}-${String(i+1).padStart(2,'0')}`
    const amount = txns.filter(t=>t.date.startsWith(key)&&t.type==='expense'&&!isTransfer(t)).reduce((s,t)=>s+t.amount,0)
    return { month: MONTHS[i], amount }
  })

  // Current month category breakdown
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`
  const monthExpTxns = txns.filter(t=>t.date.startsWith(thisMonth)&&t.type==='expense'&&!isTransfer(t))
  const totalExp = monthExpTxns.reduce((s,t)=>s+t.amount,0)
  const catBreakdown = categories.filter(c=>!c.depositsToAccount).map(c => ({
    ...c,
    amount: monthExpTxns.filter(t=>t.category===c.id).reduce((s,t)=>s+t.amount,0),
  })).filter(c=>c.amount>0).sort((a,b)=>b.amount-a.amount)

  const GROUP_COLORS: Record<string, string> = {
    needs: '#5a9fff', family: '#60d0e0', savings: '#2ed18a', wants: '#f05060',
  }
  const groupBreakdown = GROUPS.map(group => {
    const amount = catBreakdown.filter(c=>c.group===group).reduce((s,c)=>s+c.amount,0)
    return { group, label: GROUP_LABELS[group], color: GROUP_COLORS[group], amount,
      cats: catBreakdown.filter(c=>c.group===group) }
  }).filter(g=>g.amount>0)

  // 6-month summary
  const totalIncome  = areaData.reduce((s,d)=>s+d.income,0)
  const totalExpense = areaData.reduce((s,d)=>s+d.expense,0)
  const avgSavings   = areaData.length > 0 ? Math.round(((totalIncome-totalExpense)/Math.max(totalIncome,1))*100) : 0

  // Day-of-week heatmap (last 3 months of expense txns)
  const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
  const dowTotals = Array(7).fill(0)
  const dowCounts = Array(7).fill(0)
  txns.filter(t => t.type === 'expense' && !isTransfer(t)).forEach(t => {
    const d = new Date(t.date + 'T00:00:00')
    const dow = d.getDay()
    dowTotals[dow] += t.amount
    dowCounts[dow]++
  })
  const dowAvg = dowTotals.map((total, i) => ({ day: DAYS[i], avg: dowCounts[i] > 0 ? Math.round(total / dowCounts[i]) : 0, count: dowCounts[i] }))
  const maxDowAvg = Math.max(...dowAvg.map(d => d.avg), 1)

  // Year-over-year comparison
  const thisYear = now.getFullYear()
  const lastYear = thisYear - 1
  const yoyData = Array.from({ length: 12 }, (_, i) => {
    const mk1 = `${thisYear}-${String(i+1).padStart(2,'0')}`
    const mk2 = `${lastYear}-${String(i+1).padStart(2,'0')}`
    return {
      month: MONTHS[i],
      thisYear:  txns.filter(t=>t.date.startsWith(mk1)&&t.type==='expense'&&!isTransfer(t)).reduce((s,t)=>s+t.amount,0),
      lastYear:  txns.filter(t=>t.date.startsWith(mk2)&&t.type==='expense'&&!isTransfer(t)).reduce((s,t)=>s+t.amount,0),
    }
  })
  const hasLastYearData = yoyData.some(d => d.lastYear > 0)
  const yoyMax = Math.max(...yoyData.flatMap(d => [d.thisYear, d.lastYear]), 1)

  return (
    <div className="page-pad">
      {/* Area chart + summary */}
      <div className="grid-chart-row">
        <Card>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div>
              <div style={{ fontSize:14, fontWeight:600, color:'var(--text)' }}>Income vs Expenses</div>
              <div style={{ fontSize:12, color:'var(--text-dim)' }}>Last {months} months</div>
            </div>
            <div style={{ display:'flex', gap:4 }}>
              {([6, 12] as const).map(n => (
                <button key={n} onClick={() => setMonths(n)} style={{ padding:'3px 10px', borderRadius:20, border: months===n ? '1px solid var(--accent)' : '1px solid var(--border)', background: months===n ? 'var(--accent-dim)' : 'transparent', color: months===n ? 'var(--accent)' : 'var(--text-dim)', cursor:'pointer', fontSize:11, fontWeight: months===n ? 600 : 400 }}>{n}M</button>
              ))}
            </div>
          </div>
          <AreaChart data={areaData} />
        </Card>
        <Card>
          <div style={{ fontSize:14, fontWeight:600, color:'var(--text)', marginBottom:16 }}>{months}-Month Summary</div>
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

      {/* Day-of-week heatmap */}
      <Card>
        <div style={{ fontSize:14, fontWeight:600, color:'var(--text)', marginBottom:4 }}>Spending by Day of Week</div>
        <div style={{ fontSize:12, color:'var(--text-dim)', marginBottom:16 }}>Average expense per transaction, all time</div>
        <div style={{ display:'flex', gap:8, alignItems:'flex-end', height:80 }}>
          {dowAvg.map(d => {
            const barH = maxDowAvg > 0 ? Math.max((d.avg / maxDowAvg) * 64, d.avg > 0 ? 4 : 0) : 0
            const isWeekend = d.day === 'Sun' || d.day === 'Sat'
            return (
              <div key={d.day} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                <div style={{ fontSize:10, color:'var(--text-dim)', fontFamily:'DM Mono', textAlign:'center' }}>{d.avg > 0 ? fmt(d.avg) : ''}</div>
                <div style={{ width:'100%', borderRadius:4, background: isWeekend ? '#f59e0b' : 'var(--accent)', height: barH, minHeight: d.avg > 0 ? 4 : 0, opacity: d.avg > 0 ? 0.85 : 0.15, transition:'height 0.6s ease', alignSelf:'flex-end' }} />
                <div style={{ fontSize:11, color: isWeekend ? '#f59e0b' : 'var(--text-dim)', fontWeight: isWeekend ? 600 : 400 }}>{d.day}</div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Year-over-year comparison */}
      {hasLastYearData && (
        <Card>
          <div style={{ fontSize:14, fontWeight:600, color:'var(--text)', marginBottom:4 }}>Year-over-Year Expenses</div>
          <div style={{ fontSize:12, color:'var(--text-dim)', marginBottom:4 }}>Monthly comparison</div>
          <div style={{ display:'flex', gap:16, marginBottom:16 }}>
            <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'var(--text-dim)' }}><span style={{ width:10, height:10, borderRadius:3, background:'var(--accent)', display:'inline-block' }} />{thisYear}</span>
            <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'var(--text-dim)' }}><span style={{ width:10, height:10, borderRadius:3, background:'var(--border)', display:'inline-block' }} />{lastYear}</span>
          </div>
          <div style={{ display:'flex', gap:4, alignItems:'flex-end', height:100 }}>
            {yoyData.map(d => (
              <div key={d.month} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
                <div style={{ width:'100%', display:'flex', gap:1, alignItems:'flex-end', height:80 }}>
                  <div style={{ flex:1, borderRadius:'3px 3px 0 0', background:'var(--accent)', height: yoyMax > 0 ? `${(d.thisYear/yoyMax)*100}%` : 0, minHeight: d.thisYear > 0 ? 3 : 0, transition:'height 0.6s ease', opacity:0.85 }} />
                  <div style={{ flex:1, borderRadius:'3px 3px 0 0', background:'var(--border)', height: yoyMax > 0 ? `${(d.lastYear/yoyMax)*100}%` : 0, minHeight: d.lastYear > 0 ? 3 : 0, transition:'height 0.6s ease' }} />
                </div>
                <div style={{ fontSize:9, color:'var(--text-dim)', textAlign:'center' }}>{d.month}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Category breakdown — grouped */}
      <Card>
        <div style={{ fontSize:14, fontWeight:600, color:'var(--text)', marginBottom:4 }}>Spending by Group</div>
        <div style={{ fontSize:12, color:'var(--text-dim)', marginBottom:16 }}>Current month</div>
        {groupBreakdown.length === 0 ? (
          <div style={{ color:'var(--text-dim)', fontSize:13, textAlign:'center', padding:'24px 0' }}>No expenses this month</div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {groupBreakdown.map(g => {
              const groupPct = totalExp > 0 ? (g.amount/totalExp)*100 : 0
              return (
                <div key={g.group}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ width:10, height:10, borderRadius:3, background:g.color, flexShrink:0 }} />
                      <span style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>{g.label}</span>
                    </div>
                    <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                      <span style={{ fontSize:12, color:'var(--text-dim)' }}>{Math.round(groupPct)}%</span>
                      <span style={{ fontSize:13, fontWeight:600, fontFamily:'DM Mono', color:'var(--text)', minWidth:70, textAlign:'right' }}>{fmt(g.amount)}</span>
                    </div>
                  </div>
                  <ProgressBar pct={groupPct} color={g.color} height={7} />
                  {g.cats.length > 0 && (
                    <div style={{ display:'flex', flexDirection:'column', gap:5, marginTop:8, paddingLeft:18 }}>
                      {g.cats.map(c => {
                        const pct = totalExp > 0 ? (c.amount/totalExp)*100 : 0
                        return (
                          <div key={c.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                              <div style={{ width:6, height:6, borderRadius:'50%', background:c.color, flexShrink:0 }} />
                              <span style={{ fontSize:11, color:'var(--text-dim)' }}>{c.label}</span>
                            </div>
                            <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                              <span style={{ fontSize:11, color:'var(--text-dim)' }}>{Math.round(pct)}%</span>
                              <span style={{ fontSize:11, fontFamily:'DM Mono', color:'var(--text-dim)', minWidth:60, textAlign:'right' }}>{fmt(c.amount)}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}

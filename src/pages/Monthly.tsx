import { useState } from 'react'
import { useFinanceContext } from '../hooks/FinanceContext'
import { fmt } from '../lib/format'
import { EXPENSE_CATS, INCOME_CATS, MONTHS, MONTHS_FULL } from '../constants/categories'
import Card from '../components/ui/Card'
import ProgressBar from '../components/ui/ProgressBar'
import BarChart from '../components/charts/BarChart'

type ViewMode = 'monthly' | 'yearly'

export default function Monthly() {
  const { txns } = useFinanceContext()
  const now = new Date()
  const [view, setView]         = useState<ViewMode>('monthly')
  const [selMonth, setSelMonth] = useState(now.getMonth())   // 0-based
  const [selYear, setSelYear]   = useState(now.getFullYear())

  /* ──────── MONTHLY view data ──────── */
  const monthKey = `${selYear}-${String(selMonth+1).padStart(2,'0')}`
  const monthTxns = txns.filter(t => t.date.startsWith(monthKey))
  const income  = monthTxns.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0)
  const expense = monthTxns.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0)
  const savings = income - expense
  const savingsRate = income > 0 ? Math.round((savings/income)*100) : 0

  const incomeSources = INCOME_CATS.map(c => ({
    ...c, amount: monthTxns.filter(t=>t.type==='income'&&t.category===c.id).reduce((s,t)=>s+t.amount,0)
  })).filter(c=>c.amount>0)

  const expenseBycat = EXPENSE_CATS.map(c => ({
    ...c, amount: monthTxns.filter(t=>t.type==='expense'&&t.category===c.id).reduce((s,t)=>s+t.amount,0)
  })).filter(c=>c.amount>0).sort((a,b)=>b.amount-a.amount)

  /* ──────── YEARLY view data ──────── */
  const availYears = Array.from(new Set(txns.map(t=>Number(t.date.slice(0,4)))))
    .sort((a,b)=>b-a).slice(0,4)
  if (!availYears.includes(now.getFullYear())) availYears.unshift(now.getFullYear())

  const yearTxns = txns.filter(t=>t.date.startsWith(String(selYear)))
  const yearIncome  = yearTxns.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0)
  const yearExpense = yearTxns.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0)
  const yearSavings = yearIncome - yearExpense
  const yearSavingsRate = yearIncome > 0 ? Math.round((yearSavings/yearIncome)*100) : 0

  const yearBarData = Array.from({length:12}, (_,i) => {
    const key = `${selYear}-${String(i+1).padStart(2,'0')}`
    return { month: MONTHS[i], amount: txns.filter(t=>t.date.startsWith(key)&&t.type==='expense').reduce((s,t)=>s+t.amount,0) }
  })

  /* ──────── Shared styles ──────── */
  const pillBtn = (active: boolean): React.CSSProperties => ({
    padding:'6px 14px', borderRadius:20, border: active?'1px solid var(--accent)':'1px solid var(--border)',
    background: active?'var(--accent-dim)':'transparent', color: active?'var(--accent)':'var(--text-dim)',
    cursor:'pointer', fontSize:13, fontWeight: active?600:400, transition:'all 0.15s',
  })

  return (
    <div style={{ padding:28, display:'flex', flexDirection:'column', gap:20 }}>
      {/* View toggle */}
      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
        <button style={pillBtn(view==='monthly')} onClick={()=>setView('monthly')}>Monthly</button>
        <button style={pillBtn(view==='yearly')}  onClick={()=>setView('yearly')}>Yearly</button>
      </div>

      {view === 'monthly' ? (
        <>
          {/* Month + year selectors */}
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
            <select value={selYear} onChange={e=>setSelYear(Number(e.target.value))} style={{ padding:'5px 10px', borderRadius:10, border:'1px solid var(--border)', background:'var(--surface2)', color:'var(--text)', fontSize:13, cursor:'pointer', outline:'none' }}>
              {Array.from({length:5},(_,i)=>now.getFullYear()-i).map(y=><option key={y} value={y}>{y}</option>)}
            </select>
            <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
              {MONTHS.map((m,i) => (
                <button key={i} style={pillBtn(selMonth===i)} onClick={()=>setSelMonth(i)}>{m}</button>
              ))}
            </div>
          </div>

          {/* Stat cards */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
            {[
              { label:'Income',      value: fmt(income),      color:'var(--positive)' },
              { label:'Expenses',    value: fmt(expense),     color:'var(--negative)' },
              { label:'Net Savings', value: fmt(savings),     color: savings>=0?'var(--positive)':'var(--negative)' },
              { label:'Savings Rate',value:`${savingsRate}%`, color:'var(--accent)' },
            ].map((s,i) => (
              <Card key={i} delay={i*0.05}>
                <div style={{ fontSize:11, color:'var(--text-dim)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>{s.label}</div>
                <div style={{ fontSize:22, fontWeight:700, fontFamily:'DM Mono', color:s.color }}>{s.value}</div>
              </Card>
            ))}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            {/* Income sources */}
            <Card>
              <div style={{ fontSize:14, fontWeight:600, color:'var(--text)', marginBottom:14 }}>Income Sources</div>
              {incomeSources.length === 0 ? (
                <div style={{ color:'var(--text-dim)', fontSize:13 }}>No income in {MONTHS_FULL[selMonth]}</div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  {incomeSources.map(c => (
                    <div key={c.id}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                        <span style={{ fontSize:13, color:'var(--text)' }}>{c.label}</span>
                        <span style={{ fontSize:13, fontWeight:600, fontFamily:'DM Mono', color:'var(--positive)' }}>{fmt(c.amount)}</span>
                      </div>
                      <ProgressBar pct={income>0?(c.amount/income)*100:0} color={c.color} height={6} />
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Expenses by category */}
            <Card>
              <div style={{ fontSize:14, fontWeight:600, color:'var(--text)', marginBottom:14 }}>Spending Breakdown</div>
              {expenseBycat.length === 0 ? (
                <div style={{ color:'var(--text-dim)', fontSize:13 }}>No expenses in {MONTHS_FULL[selMonth]}</div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {expenseBycat.map(c => {
                    const pct = expense>0?(c.amount/expense)*100:0
                    return (
                      <div key={c.id}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                          <div style={{ display:'flex', gap:7, alignItems:'center' }}>
                            <div style={{ width:8, height:8, borderRadius:4, background:c.color }} />
                            <span style={{ fontSize:12, color:'var(--text)' }}>{c.label}</span>
                          </div>
                          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                            <span style={{ fontSize:11, color:'var(--text-dim)' }}>{Math.round(pct)}%</span>
                            <span style={{ fontSize:12, fontFamily:'DM Mono', color:'var(--text)', minWidth:60, textAlign:'right' }}>{fmt(c.amount)}</span>
                          </div>
                        </div>
                        <ProgressBar pct={pct} color={c.color} height={5} />
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>
          </div>
        </>
      ) : (
        <>
          {/* Year selector */}
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {availYears.map(y => (
              <button key={y} style={pillBtn(selYear===y)} onClick={()=>setSelYear(y)}>{y}</button>
            ))}
          </div>

          {/* Year stat cards */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
            {[
              { label:'Annual Income',  value: fmt(yearIncome),  color:'var(--positive)' },
              { label:'Annual Expenses',value: fmt(yearExpense), color:'var(--negative)' },
              { label:'Annual Savings', value: fmt(yearSavings), color: yearSavings>=0?'var(--positive)':'var(--negative)' },
              { label:'Savings Rate',   value:`${yearSavingsRate}%`, color:'var(--accent)' },
            ].map((s,i) => (
              <Card key={i} delay={i*0.05}>
                <div style={{ fontSize:11, color:'var(--text-dim)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>{s.label}</div>
                <div style={{ fontSize:22, fontWeight:700, fontFamily:'DM Mono', color:s.color }}>{s.value}</div>
              </Card>
            ))}
          </div>

          {/* Yearly bar chart */}
          <Card>
            <div style={{ fontSize:14, fontWeight:600, color:'var(--text)', marginBottom:4 }}>Monthly Expenses</div>
            <div style={{ fontSize:12, color:'var(--text-dim)', marginBottom:16 }}>{selYear}</div>
            <BarChart data={yearBarData} />
          </Card>
        </>
      )}
    </div>
  )
}

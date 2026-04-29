import { useState } from 'react'
import { useFinanceContext } from '../hooks/FinanceContext'
import { fmt } from '../lib/format'
import { EXPENSE_CATS, INCOME_CATS, MONTHS, MONTHS_FULL } from '../constants/categories'
import Card from '../components/ui/Card'
import ProgressBar from '../components/ui/ProgressBar'
import BarChart from '../components/charts/BarChart'

type ViewMode = 'monthly' | 'yearly'

function SavingsGauge({ rate }: { rate: number }) {
  const circ = 201
  const filled = (Math.min(rate, 100) / 100) * circ
  const color = rate >= 20 ? 'oklch(0.68 0.18 145)' : rate >= 10 ? '#f59e0b' : 'oklch(0.64 0.2 25)'
  return (
    <svg width="160" height="90" viewBox="0 0 160 90" style={{ overflow:'visible' }}>
      <defs>
        <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="oklch(0.64 0.2 25)"/>
          <stop offset="50%" stopColor="#f59e0b"/>
          <stop offset="100%" stopColor="oklch(0.68 0.18 145)"/>
        </linearGradient>
      </defs>
      <path d="M16,80 A64,64 0 0,1 144,80" fill="none" stroke="var(--border)" strokeWidth="12" strokeLinecap="round"/>
      <path d="M16,80 A64,64 0 0,1 144,80" fill="none" stroke="url(#gaugeGrad)" strokeWidth="12" strokeLinecap="round"
        strokeDasharray={`${filled} ${circ}`}
        style={{ transition:'stroke-dasharray 1.2s ease 0.3s', filter:`drop-shadow(0 0 6px ${color}80)` }}/>
      <text x="80" y="70" textAnchor="middle" fontSize="24" fontWeight="700" fill="var(--text)" fontFamily="DM Mono">{rate}%</text>
      <text x="80" y="86" textAnchor="middle" fontSize="10" fill="var(--text-dim)" fontFamily="DM Sans">savings rate</text>
      <text x="16" y="96" textAnchor="middle" fontSize="9" fill="var(--text-dim)" fontFamily="DM Sans">0%</text>
      <text x="144" y="96" textAnchor="middle" fontSize="9" fill="var(--text-dim)" fontFamily="DM Sans">100%</text>
    </svg>
  )
}

export default function Monthly() {
  const { txns } = useFinanceContext()
  const now = new Date()
  const [view, setView]         = useState<ViewMode>('monthly')
  const [selMonth, setSelMonth] = useState(now.getMonth())
  const [selYear, setSelYear]   = useState(now.getFullYear())

  /* â”€â”€â”€â”€â”€â”€â”€â”€ MONTHLY view data â”€â”€â”€â”€â”€â”€â”€â”€ */
  const monthKey  = `${selYear}-${String(selMonth+1).padStart(2,'0')}`
  const monthTxns = txns.filter(t => t.date.startsWith(monthKey))
  const income    = monthTxns.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0)
  const expense   = monthTxns.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0)
  const savings   = income - expense
  const savingsRate = income > 0 ? Math.round((savings/income)*100) : 0

  const incomeSources = INCOME_CATS.map(c => ({
    ...c, amount: monthTxns.filter(t=>t.type==='income'&&t.category===c.id).reduce((s,t)=>s+t.amount,0)
  })).filter(c=>c.amount>0)

  const expenseBycat = EXPENSE_CATS.map(c => ({
    ...c, amount: monthTxns.filter(t=>t.type==='expense'&&t.category===c.id).reduce((s,t)=>s+t.amount,0)
  })).filter(c=>c.amount>0).sort((a,b)=>b.amount-a.amount)

  /* 6-month summary (last 6 months ending at selected month) */
  const sixMonths = Array.from({length:6}, (_,i) => {
    const d = new Date(selYear, selMonth - 5 + i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
    const mt  = txns.filter(t => t.date.startsWith(key))
    const inc = mt.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0)
    const sp  = mt.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0)
    const sav = inc - sp
    return { month: MONTHS[d.getMonth()], year: d.getFullYear(), inc, sp, sav, rate: inc>0?Math.round((sav/inc)*100):0 }
  })

  /* â”€â”€â”€â”€â”€â”€â”€â”€ YEARLY view data â”€â”€â”€â”€â”€â”€â”€â”€ */
  const availYears = Array.from(new Set(txns.map(t=>Number(t.date.slice(0,4))))).sort((a,b)=>b-a).slice(0,4)
  if (!availYears.includes(now.getFullYear())) availYears.unshift(now.getFullYear())

  const yearTxns    = txns.filter(t=>t.date.startsWith(String(selYear)))
  const yearIncome  = yearTxns.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0)
  const yearExpense = yearTxns.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0)
  const yearSavings = yearIncome - yearExpense
  const yearSavingsRate = yearIncome > 0 ? Math.round((yearSavings/yearIncome)*100) : 0

  const yearBarData = Array.from({length:12}, (_,i) => {
    const key = `${selYear}-${String(i+1).padStart(2,'0')}`
    return { month: MONTHS[i], amount: txns.filter(t=>t.date.startsWith(key)&&t.type==='expense').reduce((s,t)=>s+t.amount,0) }
  })

  const yr2 = String(selYear).slice(2)

  /* â”€â”€â”€â”€â”€â”€â”€â”€ Shared styles â”€â”€â”€â”€â”€â”€â”€â”€ */
  const pillBtn = (active: boolean): React.CSSProperties => ({
    padding:'7px 20px', borderRadius:20, border:'none',
    background: active ? 'var(--accent)' : 'transparent',
    color: active ? '#fff' : 'var(--text-dim)',
    cursor:'pointer', fontSize:13, fontWeight: active ? 600 : 400,
    transition:'all 0.2s',
    boxShadow: active ? '0 2px 12px var(--accent-glow)' : 'none',
  })

  const monthPill = (active: boolean): React.CSSProperties => ({
    padding:'7px 16px', borderRadius:20,
    border: active ? 'none' : '1px solid var(--border)',
    background: active ? 'var(--accent-dim)' : 'transparent',
    color: active ? 'var(--accent)' : 'var(--text-dim)',
    cursor:'pointer', fontSize:13, fontWeight: active ? 600 : 400, transition:'all 0.2s',
  })

  return (
    <div style={{ padding:28, display:'flex', flexDirection:'column', gap:20 }}>
      {/* Contained toggle + month/year pickers */}
      <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
        {/* Toggle pill container */}
        <div style={{ display:'flex', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:24, padding:3, gap:2 }}>
          <button style={pillBtn(view==='monthly')} onClick={()=>setView('monthly')}>Monthly</button>
          <button style={pillBtn(view==='yearly')}  onClick={()=>setView('yearly')}>Yearly</button>
        </div>

        <span style={{ width:1, height:28, background:'var(--border)' }}></span>

        {view === 'monthly' && (
          <>
            <select value={selYear} onChange={e=>setSelYear(Number(e.target.value))} style={{ padding:'7px 10px', borderRadius:10, border:'1px solid var(--border)', background:'var(--surface2)', color:'var(--text)', fontSize:13, cursor:'pointer', outline:'none' }}>
              {Array.from({length:5},(_,i)=>now.getFullYear()-i).map(y=><option key={y} value={y}>{y}</option>)}
            </select>
            {MONTHS.map((m,i) => (
              <button key={i} style={monthPill(selMonth===i)} onClick={()=>setSelMonth(i)}>{m} '{yr2}</button>
            ))}
          </>
        )}

        {view === 'yearly' && availYears.map(y => (
          <button key={y} style={monthPill(selYear===y)} onClick={()=>setSelYear(y)}>{y}</button>
        ))}
      </div>

      {view === 'monthly' ? (
        <>
          {/* Stat cards */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
            {[
              { label:'Monthly Income',  value: fmt(income),      color:'var(--positive)', icon:'â†‘' },
              { label:'Monthly Spending',value: fmt(expense),     color:'var(--negative)', icon:'â†“' },
              { label:'Net Saved',       value: fmt(savings),     color: savings>=0?'var(--positive)':'var(--negative)', icon:'ðŸ’°' },
              { label:'Savings Rate',    value:`${savingsRate}%`, color:'var(--accent)',   icon:'%' },
            ].map((s,i) => (
              <Card key={i} delay={i*0.05}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                  <div style={{ fontSize:11, color:'var(--text-dim)', textTransform:'uppercase', letterSpacing:'0.06em' }}>{s.label}</div>
                  <span style={{ width:28, height:28, borderRadius:8, background:`${s.color}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, color:s.color, fontWeight:700 }}>{s.icon}</span>
                </div>
                <div style={{ fontSize:22, fontWeight:700, fontFamily:'DM Mono', color:s.color }}>{s.value}</div>
              </Card>
            ))}
          </div>

          {/* Income sources + Spending breakdown */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <Card>
              <div style={{ fontSize:14, fontWeight:600, color:'var(--text)', marginBottom:14 }}>Income Sources</div>
              {incomeSources.length === 0 ? (
                <div style={{ color:'var(--text-dim)', fontSize:13 }}>No income in {MONTHS_FULL[selMonth]}</div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  {incomeSources.map(c => {
                    const pct = income > 0 ? Math.round((c.amount/income)*100) : 0
                    return (
                      <div key={c.id}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                          <span style={{ fontSize:13, color:'var(--text)' }}>{c.label}</span>
                          <span style={{ fontSize:13, fontWeight:600, fontFamily:'DM Mono', color:'var(--positive)' }}>+{fmt(c.amount)}</span>
                        </div>
                        <ProgressBar pct={income>0?(c.amount/income)*100:0} color={c.color} height={6} />
                        <div style={{ fontSize:11, color:'var(--text-dim)', marginTop:3 }}>{pct}% of income</div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>

            <Card>
              <div style={{ fontSize:14, fontWeight:600, color:'var(--text)', marginBottom:14 }}>Spending Breakdown</div>
              {expenseBycat.length === 0 ? (
                <div style={{ color:'var(--text-dim)', fontSize:13 }}>No expenses in {MONTHS_FULL[selMonth]}</div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {expenseBycat.map(c => {
                    const pct = expense > 0 ? (c.amount/expense)*100 : 0
                    return (
                      <div key={c.id} style={{ display:'grid', gridTemplateColumns:'130px 1fr 70px 44px', gap:10, alignItems:'center' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                          <span style={{ width:9, height:9, borderRadius:'50%', background:c.color, flexShrink:0 }}></span>
                          <span style={{ fontSize:12, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.label}</span>
                        </div>
                        <div style={{ height:7, borderRadius:4, background:'var(--border)', overflow:'hidden' }}>
                          <div style={{ height:'100%', borderRadius:4, background:c.color, width:`${pct}%`, transition:'width 0.8s ease' }}></div>
                        </div>
                        <span style={{ fontSize:12, fontFamily:'DM Mono', color:'var(--text)', textAlign:'right' }}>{fmt(c.amount)}</span>
                        <span style={{ fontSize:11, color:'var(--text-dim)', textAlign:'right' }}>{Math.round(pct)}%</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Savings rate gauge */}
          <Card>
            <div style={{ fontSize:14, fontWeight:600, color:'var(--text)', marginBottom:10 }}>Savings Rate</div>
            <div style={{ display:'flex', gap:24, alignItems:'center', flexWrap:'wrap' }}>
              <SavingsGauge rate={savingsRate} />
              <div style={{ display:'flex', gap:20 }}>
                <div>
                  <div style={{ fontSize:11, color:'var(--text-dim)' }}>Saved</div>
                  <div style={{ fontSize:18, fontWeight:700, fontFamily:'DM Mono', color:'var(--accent)' }}>{fmt(savings)}</div>
                </div>
                <div>
                  <div style={{ fontSize:11, color:'var(--text-dim)' }}>Spent</div>
                  <div style={{ fontSize:18, fontWeight:700, fontFamily:'DM Mono', color:'var(--negative)' }}>{fmt(expense)}</div>
                </div>
              </div>
            </div>
          </Card>

          {/* 6-month summary table */}
          <Card>
            <div style={{ fontSize:14, fontWeight:600, color:'var(--text)', marginBottom:14 }}>6-Month Summary</div>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead>
                  <tr>
                    {['Month','Income','Spending','Saved','Rate','vs prev'].map(h => (
                      <th key={h} style={{ textAlign: h==='Month'?'left':'right', padding:'8px 12px', fontSize:11, fontWeight:600, color:'var(--text-dim)', textTransform:'uppercase', letterSpacing:'0.05em', borderBottom:'1px solid var(--border)', whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sixMonths.map((row, i) => {
                    const isSelected = row.month === MONTHS[selMonth] && row.year === selYear
                    const prev = sixMonths[i-1]
                    const diff = prev ? row.sp - prev.sp : null
                    return (
                      <tr key={i} onClick={()=>{ setSelMonth(MONTHS.indexOf(row.month)); setSelYear(row.year) }}
                        style={{ cursor:'pointer', background: isSelected ? 'var(--accent-dim)' : 'transparent', transition:'background 0.15s' }}
                        onMouseEnter={e=>{ if(!isSelected) (e.currentTarget as HTMLElement).style.background='var(--surface2)' }}
                        onMouseLeave={e=>{ if(!isSelected) (e.currentTarget as HTMLElement).style.background='transparent' }}>
                        <td style={{ padding:'10px 12px', color: isSelected?'var(--accent)':'var(--text)', fontWeight: isSelected?700:500, borderBottom:'1px solid var(--border)' }}>{row.month} '{String(row.year).slice(2)}</td>
                        <td style={{ padding:'10px 12px', textAlign:'right', fontFamily:'DM Mono', color:'var(--positive)', borderBottom:'1px solid var(--border)' }}>+{fmt(row.inc)}</td>
                        <td style={{ padding:'10px 12px', textAlign:'right', fontFamily:'DM Mono', color:'var(--text)', borderBottom:'1px solid var(--border)' }}>{fmt(row.sp)}</td>
                        <td style={{ padding:'10px 12px', textAlign:'right', fontFamily:'DM Mono', color:'var(--accent)', borderBottom:'1px solid var(--border)' }}>{fmt(row.sav)}</td>
                        <td style={{ padding:'10px 12px', textAlign:'right', borderBottom:'1px solid var(--border)' }}>
                          <span style={{ fontSize:11, borderRadius:6, padding:'3px 8px', fontWeight:600,
                            color: row.rate>=20?'oklch(0.68 0.18 145)':row.rate>=10?'#f59e0b':'oklch(0.64 0.2 25)',
                            background: row.rate>=20?'oklch(0.22 0.08 145)':row.rate>=10?'oklch(0.22 0.08 70)':'oklch(0.22 0.08 25)' }}>{row.rate}%</span>
                        </td>
                        <td style={{ padding:'10px 12px', textAlign:'right', fontFamily:'DM Mono', fontSize:12, borderBottom:'1px solid var(--border)',
                          color: diff===null?'var(--text-dim)':diff<0?'oklch(0.68 0.18 145)':'oklch(0.64 0.2 25)' }}>
                          {diff===null ? 'â€”' : `${diff<0?'â†“':'â†‘'} ${fmt(Math.abs(diff))}`}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      ) : (
        <>
          {/* Year stat cards */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
            {[
              { label:'Annual Income',  value: fmt(yearIncome),      color:'var(--positive)' },
              { label:'Annual Expenses',value: fmt(yearExpense),     color:'var(--negative)' },
              { label:'Annual Savings', value: fmt(yearSavings),     color: yearSavings>=0?'var(--positive)':'var(--negative)' },
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
            <div style={{ fontSize:14, fontWeight:600, color:'var(--text)', marginBottom:4 }}>Monthly Expenses â€” {selYear}</div>
            <div style={{ fontSize:12, color:'var(--text-dim)', marginBottom:16 }}>Bar view Â· 12 months</div>
            <BarChart data={yearBarData} />
          </Card>

          {/* Annual savings rate */}
          <Card>
            <div style={{ fontSize:14, fontWeight:600, color:'var(--text)', marginBottom:14 }}>Annual Savings Rate</div>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {availYears.map(y => {
                const yt  = txns.filter(t=>t.date.startsWith(String(y)))
                const yi  = yt.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0)
                const ys  = yi - yt.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0)
                const rate = yi > 0 ? Math.round((ys/yi)*100) : 0
                const isActive = y === selYear
                return (
                  <div key={y} onClick={()=>setSelYear(y)} style={{ display:'flex', flexDirection:'column', gap:6, cursor:'pointer', padding:'10px 12px', borderRadius:12, border:`1px solid ${isActive?'var(--accent)':'var(--border)'}`, background:isActive?'var(--accent-dim)':'transparent', transition:'all 0.2s' }}>
                    <div style={{ display:'flex', justifyContent:'space-between' }}>
                      <span style={{ fontSize:14, fontWeight:600, color: isActive?'var(--accent)':'var(--text)' }}>{y}</span>
                      <span style={{ fontSize:16, fontWeight:700, fontFamily:'DM Mono', color: rate>=20?'oklch(0.68 0.18 145)':rate>=12?'#f59e0b':'oklch(0.64 0.2 25)' }}>{rate}%</span>
                    </div>
                    <div style={{ height:8, borderRadius:6, background:'var(--border)', overflow:'hidden' }}>
                      <div style={{ height:'100%', borderRadius:6, background: rate>=20?'oklch(0.68 0.18 145)':rate>=12?'#f59e0b':'oklch(0.64 0.2 25)', width:`${rate}%`, transition:'width 1s ease 0.3s' }}></div>
                    </div>
                    <span style={{ fontSize:11, color:'var(--text-dim)' }}>{fmt(ys)} saved of {fmt(yi)}</span>
                  </div>
                )
              })}
            </div>
          </Card>
        </>
      )}
    </div>
  )
}

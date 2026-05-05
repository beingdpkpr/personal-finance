import { useState } from 'react'
import { useFinanceContext } from '../hooks/FinanceContext'
import { fmt } from '../lib/format'
import { resolveLimit } from '../lib/data'
import { EXPENSE_CATS } from '../constants/categories'
import Card from '../components/ui/Card'
import ProgressBar from '../components/ui/ProgressBar'

export default function Budget() {
  const { txns, budgets, setBudgets } = useFinanceContext()
  const [editing, setEditing] = useState<string | null>(null)
  const [editMode, setEditMode] = useState<'fixed'|'pct'>('fixed')
  const [editValue, setEditValue] = useState('')

  const now = new Date()
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`
  const monthTxns = txns.filter(t => t.date.startsWith(thisMonth))
  const monthIncome = monthTxns.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0)

  function startEdit(catId: string) {
    const entry = budgets[catId]
    setEditMode(entry?.mode ?? 'fixed')
    setEditValue(entry ? String(entry.value) : '')
    setEditing(catId)
  }

  function saveEdit(catId: string) {
    const v = parseFloat(editValue)
    if (!isNaN(v) && v >= 0) {
      setBudgets({ ...budgets, [catId]: { mode: editMode, value: v } })
    }
    setEditing(null)
  }

  function clearBudget(catId: string) {
    const next = { ...budgets }
    delete next[catId]
    setBudgets(next)
    setEditing(null)
  }

  return (
    <div style={{ padding:28, display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <div style={{ fontSize:16, fontWeight:700, color:'var(--text)' }}>Budget Tracker</div>
          <div style={{ fontSize:12, color:'var(--text-dim)', marginTop:2 }}>
            Month income: <span style={{ color:'var(--positive)', fontFamily:'DM Mono' }}>{fmt(monthIncome)}</span>
          </div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
        {EXPENSE_CATS.map((cat, i) => {
          const spent = monthTxns.filter(t=>t.type==='expense'&&t.category===cat.id).reduce((s,t)=>s+t.amount,0)
          const limit = resolveLimit(budgets[cat.id], monthIncome)
          const pct   = limit > 0 ? (spent/limit)*100 : 0
          const entry = budgets[cat.id]

          return (
            <Card key={cat.id} delay={i*0.04}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                <div>
                  <div style={{ width:8, height:8, borderRadius:4, background:cat.color, marginBottom:4 }} />
                  <div style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>{cat.label}</div>
                  {entry && (
                    <div style={{ fontSize:11, color:'var(--text-dim)', marginTop:2 }}>
                      {entry.mode==='pct' ? `${entry.value}% of income` : fmt(entry.value)}
                    </div>
                  )}
                </div>
                <div style={{ display:'flex', gap:4 }}>
                  <button onClick={()=>startEdit(cat.id)} style={{ fontSize:11, padding:'3px 8px', borderRadius:8, border:'1px solid var(--border)', background:'none', color:'var(--text-dim)', cursor:'pointer' }}>Edit</button>
                  {entry && <button onClick={()=>clearBudget(cat.id)} style={{ fontSize:11, padding:'3px 8px', borderRadius:8, border:'1px solid var(--border)', background:'none', color:'var(--negative)', cursor:'pointer' }}>✕</button>}
                </div>
              </div>

              {editing === cat.id ? (
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  <div style={{ display:'flex', gap:4 }}>
                    {(['fixed','pct'] as const).map(m => (
                      <button key={m} onClick={()=>setEditMode(m)} style={{ flex:1, padding:'5px 0', borderRadius:8, border: editMode===m?'1px solid var(--accent)':'1px solid var(--border)', background: editMode===m?'var(--accent-dim)':'var(--surface2)', color: editMode===m?'var(--accent)':'var(--text-dim)', cursor:'pointer', fontSize:11, fontWeight:600 }}>
                        {m === 'fixed' ? 'Fixed' : '% of income'}
                      </button>
                    ))}
                  </div>
                  <input
                    value={editValue} onChange={e=>setEditValue(e.target.value)}
                    type="number" min="0" placeholder={editMode==='pct'?'e.g. 15':'e.g. 5000'}
                    autoFocus
                    style={{ padding:'6px 10px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface2)', color:'var(--text)', fontSize:13, fontFamily:'DM Sans', outline:'none', width:'100%' }}
                    onKeyDown={e => { if(e.key==='Enter') saveEdit(cat.id); if(e.key==='Escape') setEditing(null) }}
                  />
                  <div style={{ display:'flex', gap:6 }}>
                    <button onClick={()=>saveEdit(cat.id)} style={{ flex:1, padding:'6px 0', borderRadius:8, border:'none', background:'var(--accent)', color:'#fff', cursor:'pointer', fontSize:12, fontWeight:600 }}>Save</button>
                    <button onClick={()=>setEditing(null)} style={{ flex:1, padding:'6px 0', borderRadius:8, border:'1px solid var(--border)', background:'none', color:'var(--text-dim)', cursor:'pointer', fontSize:12 }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <ProgressBar pct={pct} />
                  <div style={{ display:'flex', justifyContent:'space-between', marginTop:8, fontSize:12 }}>
                    <span style={{ color:'var(--text-dim)' }}>Spent: <span style={{ color:'var(--text)', fontFamily:'DM Mono' }}>{fmt(spent)}</span></span>
                    {limit > 0
                      ? <span style={{ color: pct>=90?'var(--negative)':pct>=70?'var(--warning)':'var(--positive)', fontWeight:600 }}>{Math.round(pct)}%</span>
                      : <span style={{ color:'var(--text-dim)' }}>No budget</span>
                    }
                  </div>
                  {limit > 0 && (
                    <div style={{ fontSize:11, color:'var(--text-dim)', marginTop:4 }}>
                      Remaining: <span style={{ color: limit-spent>=0?'var(--positive)':'var(--negative)', fontFamily:'DM Mono', fontWeight:500 }}>{fmt(Math.abs(limit-spent))}</span>
                    </div>
                  )}
                </>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}

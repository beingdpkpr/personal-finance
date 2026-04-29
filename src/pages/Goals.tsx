import { useState } from 'react'
import { useFinanceContext } from '../hooks/FinanceContext'
import { fmt } from '../lib/format'
import { Goal, uid } from '../lib/data'
import Card from '../components/ui/Card'
import CircularProgress from '../components/ui/CircularProgress'

const GOAL_COLORS = ['#7c6ef5','#22c55e','#f59e0b','#f87171','#38bdf8','#a07aff','#ff7eb3','#2ed18a']

function emptyForm(): Omit<Goal,'id'> {
  return { name:'', target:0, current:0, deadline:'' }
}

export default function Goals() {
  const { goals, setGoals } = useFinanceContext()
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId]   = useState<string | null>(null)
  const [form, setForm]       = useState<Omit<Goal,'id'>>(emptyForm())

  function openAdd() {
    setEditId(null); setForm(emptyForm()); setShowForm(true)
  }

  function openEdit(g: Goal) {
    setEditId(g.id)
    setForm({ name:g.name, target:g.target, current:g.current, deadline:g.deadline ?? '' })
    setShowForm(true)
  }

  function save() {
    if (!form.name || !form.target) return
    const goal: Goal = {
      id: editId ?? uid(),
      name: form.name,
      target: Number(form.target),
      current: Number(form.current),
      deadline: form.deadline || undefined,
    }
    if (editId) setGoals(goals.map(g => g.id===editId ? goal : g))
    else setGoals([...goals, goal])
    setShowForm(false)
  }

  function deleteGoal(id: string) {
    setGoals(goals.filter(g => g.id !== id))
  }

  const inputStyle: React.CSSProperties = {
    padding:'8px 12px', borderRadius:10, border:'1px solid var(--border)',
    background:'var(--surface2)', color:'var(--text)', fontSize:13,
    fontFamily:'DM Sans', outline:'none', width:'100%',
  }

  return (
    <div style={{ padding:28, display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ fontSize:16, fontWeight:700, color:'var(--text)' }}>Goals</div>
        <button onClick={openAdd} style={{ padding:'7px 16px', borderRadius:20, border:'none', background:'var(--accent)', color:'#fff', cursor:'pointer', fontSize:13, fontWeight:600 }}>+ New Goal</button>
      </div>

      {showForm && (
        <Card animate={false}>
          <div style={{ fontSize:14, fontWeight:600, color:'var(--text)', marginBottom:14 }}>{editId ? 'Edit Goal' : 'New Goal'}</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div style={{ gridColumn:'1/-1' }}>
              <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Goal name *" style={inputStyle} />
            </div>
            <input value={form.target||''} onChange={e=>setForm({...form,target:Number(e.target.value)})} placeholder="Target amount *" type="number" min="0" style={inputStyle} />
            <input value={form.current||''} onChange={e=>setForm({...form,current:Number(e.target.value)})} placeholder="Current amount" type="number" min="0" style={inputStyle} />
            <div style={{ gridColumn:'1/-1' }}>
              <input value={form.deadline||''} onChange={e=>setForm({...form,deadline:e.target.value})} type="date" placeholder="Deadline (optional)" style={inputStyle} />
            </div>
          </div>
          <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:12 }}>
            <button onClick={()=>setShowForm(false)} style={{ padding:'8px 18px', borderRadius:10, border:'1px solid var(--border)', background:'none', color:'var(--text-dim)', cursor:'pointer', fontSize:13 }}>Cancel</button>
            <button onClick={save} disabled={!form.name||!form.target} style={{ padding:'8px 18px', borderRadius:10, border:'none', background:'var(--accent)', color:'#fff', cursor:'pointer', fontSize:13, fontWeight:600, opacity:(!form.name||!form.target)?0.5:1 }}>Save</button>
          </div>
        </Card>
      )}

      {goals.length === 0 && !showForm ? (
        <div style={{ color:'var(--text-dim)', fontSize:14, textAlign:'center', padding:'48px 0' }}>No goals yet. Create your first goal!</div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:16 }}>
          {goals.map((g, i) => {
            const pct = g.target > 0 ? Math.min((g.current/g.target)*100, 100) : 0
            const color = GOAL_COLORS[i % GOAL_COLORS.length]
            const remaining = g.target - g.current
            return (
              <Card key={g.id} delay={i*0.05}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:14, fontWeight:600, color:'var(--text)', marginBottom:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{g.name}</div>
                    {g.deadline && <div style={{ fontSize:11, color:'var(--text-dim)' }}>Due {g.deadline}</div>}
                  </div>
                  <div style={{ display:'flex', gap:4, flexShrink:0 }}>
                    <button onClick={()=>openEdit(g)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-dim)', fontSize:13, padding:'2px 6px' }}>✎</button>
                    <button onClick={()=>deleteGoal(g.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--negative)', fontSize:13, padding:'2px 6px' }}>✕</button>
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:16 }}>
                  <CircularProgress pct={pct} size={90} color={color} label={`${Math.round(pct)}%`} subLabel="funded" />
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:4 }}>
                      <span style={{ color:'var(--text-dim)' }}>Current</span>
                      <span style={{ color:'var(--text)', fontFamily:'DM Mono', fontWeight:500 }}>{fmt(g.current)}</span>
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:4 }}>
                      <span style={{ color:'var(--text-dim)' }}>Target</span>
                      <span style={{ color:'var(--text)', fontFamily:'DM Mono', fontWeight:500 }}>{fmt(g.target)}</span>
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}>
                      <span style={{ color:'var(--text-dim)' }}>Remaining</span>
                      <span style={{ fontFamily:'DM Mono', fontWeight:600, color: remaining<=0?'var(--positive)':'var(--text)' }}>{remaining<=0?'✓ Complete':fmt(remaining)}</span>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

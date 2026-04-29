import { useState } from 'react'
import { useFinanceContext } from '../hooks/FinanceContext'
import { fmt } from '../lib/format'
import { Goal, uid } from '../lib/data'
import Card from '../components/ui/Card'

const GOAL_COLORS = ['#7c6ef5','#22c55e','#f59e0b','#f87171','#38bdf8','#a07aff','#ff7eb3','#2ed18a']
const GOAL_ICONS  = ['ðŸ›¡','âœˆ','ðŸ’»','ðŸ ','ðŸ’°','ðŸŽ¯','ðŸŽ“','ðŸš—','ðŸ‹','ðŸ’Ž']

function SemiGauge({ pct, color, current }: { pct: number; color: string; current: number }) {
  // Arc path: M10,60 A50,50 0 0,1 110,60  â€” semicircle, circumference â‰ˆ 157
  const circ = 157
  const filled = (Math.min(pct, 100) / 100) * circ
  return (
    <svg width="120" height="68" viewBox="0 0 120 68" style={{ overflow:'visible', display:'block' }}>
      <path d="M10,60 A50,50 0 0,1 110,60" fill="none" stroke="var(--border)" strokeWidth="8" strokeLinecap="round"/>
      <path d="M10,60 A50,50 0 0,1 110,60" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
        strokeDasharray={`${filled} ${circ}`}
        style={{ transition:'stroke-dasharray 1s ease 0.3s', filter:`drop-shadow(0 0 6px ${color}60)` }}/>
      <text x="60" y="52" textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--text)" fontFamily="DM Sans">{fmt(current, 0)}</text>
      <text x="10" y="76" textAnchor="middle" fontSize="9" fill="var(--text-dim)" fontFamily="DM Sans">0%</text>
      <text x="110" y="76" textAnchor="middle" fontSize="9" fill="var(--text-dim)" fontFamily="DM Sans">100%</text>
    </svg>
  )
}

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
            const icon  = GOAL_ICONS[i % GOAL_ICONS.length]
            const remaining = g.target - g.current
            return (
              <Card key={g.id} delay={i*0.05}>
                {/* Header: icon + name + % badge + actions */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
                  <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                    <div style={{ width:44, height:44, borderRadius:13, background:`${color}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, border:`1px solid ${color}30`, flexShrink:0 }}>{icon}</div>
                    <div>
                      <div style={{ fontSize:15, fontWeight:600, color:'var(--text)' }}>{g.name}</div>
                      <div style={{ fontSize:12, color:'var(--text-dim)', marginTop:2 }}>Target: {fmt(g.target, 0)}</div>
                    </div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <span style={{ fontSize:20, fontWeight:700, fontFamily:'DM Mono', color }}>{Math.round(pct)}%</span>
                    <button onClick={()=>openEdit(g)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-dim)', fontSize:13, padding:'2px 4px' }}>âœŽ</button>
                    <button onClick={()=>deleteGoal(g.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--negative)', fontSize:13, padding:'2px 4px' }}>âœ•</button>
                  </div>
                </div>

                {/* Semicircular gauge */}
                <div style={{ display:'flex', justifyContent:'center', marginBottom:8 }}>
                  <SemiGauge pct={pct} color={color} current={g.current} />
                </div>

                {/* Saved / To go */}
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                  <div style={{ textAlign:'center' }}>
                    <div style={{ fontSize:11, color:'var(--text-dim)' }}>Saved so far</div>
                    <div style={{ fontSize:14, fontWeight:700, fontFamily:'DM Mono', color }}>{fmt(g.current, 0)}</div>
                  </div>
                  {g.deadline && <div style={{ textAlign:'center' }}>
                    <div style={{ fontSize:11, color:'var(--text-dim)' }}>Deadline</div>
                    <div style={{ fontSize:12, color:'var(--text)' }}>{g.deadline}</div>
                  </div>}
                  <div style={{ textAlign:'center' }}>
                    <div style={{ fontSize:11, color:'var(--text-dim)' }}>{remaining<=0?'Status':'To go'}</div>
                    <div style={{ fontSize:14, fontWeight:700, fontFamily:'DM Mono', color: remaining<=0?'var(--positive)':'var(--text)' }}>{remaining<=0?'âœ“ Done':fmt(remaining, 0)}</div>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ height:6, borderRadius:4, background:'var(--border)', overflow:'hidden' }}>
                  <div style={{ height:'100%', borderRadius:4, background:color, width:`${pct}%`, transition:'width 1s ease 0.4s' }}></div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

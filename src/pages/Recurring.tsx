import { useState } from 'react'
import { useFinanceContext } from '../hooks/FinanceContext'
import { fmt } from '../lib/format'
import { RecurringRule, TxnType, uid } from '../lib/data'
import Card from '../components/ui/Card'

const GROUP_COLORS: Record<string, string> = {
  needs: '#5a9fff', family: '#60d0e0', savings: '#2ed18a', wants: '#f05060',
}

function nextRunDate(dayOfMonth: number): string {
  const now = new Date()
  const yr = now.getFullYear()
  const mo = now.getMonth()
  const day = Math.min(dayOfMonth, new Date(yr, mo + 1, 0).getDate())
  const candidate = new Date(yr, mo, day)
  if (candidate > now) return candidate.toLocaleDateString('default', { day: 'numeric', month: 'short' })
  const nextMo = new Date(yr, mo + 1, Math.min(dayOfMonth, new Date(yr, mo + 2, 0).getDate()))
  return nextMo.toLocaleDateString('default', { day: 'numeric', month: 'short' })
}

function emptyForm() {
  return { type: 'expense' as TxnType, description: '', amount: '', category: '', dayOfMonth: '1' }
}

export default function Recurring() {
  const { recurring, setRecurring, categories, incomeCats } = useFinanceContext()
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm())

  const expenseCats = categories
  const catOptions  = form.type === 'income' ? incomeCats : expenseCats

  function derivedGroup(catId: string): string | undefined {
    if (form.type === 'income') return undefined
    return categories.find(c => c.id === catId)?.group
  }

  function openAdd() {
    setEditId(null)
    setForm(emptyForm())
    setShowForm(true)
  }

  function openEdit(r: RecurringRule) {
    setEditId(r.id)
    setForm({
      type: r.type,
      description: r.description,
      amount: String(r.amount),
      category: r.category ?? '',
      dayOfMonth: String(r.dayOfMonth),
    })
    setShowForm(true)
  }

  function nextMonthKey(): string {
    const now = new Date()
    const d = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }

  function save() {
    const amt = parseFloat(form.amount)
    const day = Math.min(Math.max(1, parseInt(form.dayOfMonth) || 1), 28)
    if (!form.description || isNaN(amt) || amt <= 0) return
    const existing = editId ? recurring.find(r => r.id === editId) : null
    const rule: RecurringRule = {
      id: editId ?? uid(),
      type: form.type,
      amount: amt,
      group: derivedGroup(form.category) as RecurringRule['group'],
      category: form.category || undefined,
      description: form.description,
      dayOfMonth: day,
      startMonth: existing?.startMonth ?? nextMonthKey(),
    }
    if (editId) setRecurring(recurring.map(r => r.id === editId ? rule : r))
    else setRecurring([...recurring, rule])
    setShowForm(false)
  }

  function del(id: string) {
    setRecurring(recurring.filter(r => r.id !== id))
  }

  const inputStyle: React.CSSProperties = {
    padding: '8px 12px', borderRadius: 10, border: '1px solid var(--border)',
    background: 'var(--surface2)', color: 'var(--text)', fontSize: 13,
    fontFamily: 'DM Sans', outline: 'none', width: '100%',
  }

  return (
    <div className="page-pad">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Recurring</div>
          <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>
            Auto-logged each month on their due date
          </div>
        </div>
        <button onClick={openAdd} style={{ padding: '7px 16px', borderRadius: 20, border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
          + Add Rule
        </button>
      </div>

      {showForm && (
        <Card animate={false}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 14 }}>
            {editId ? 'Edit Rule' : 'New Rule'}
          </div>

          {/* Type toggle */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {(['expense', 'income'] as TxnType[]).map(t => (
              <button key={t} onClick={() => setForm(f => ({ ...f, type: t, category: '' }))}
                style={{ flex: 1, padding: '7px 0', borderRadius: 10, border: form.type === t ? '1px solid var(--accent)' : '1px solid var(--border)', background: form.type === t ? 'var(--accent-dim)' : 'var(--surface2)', color: form.type === t ? 'var(--accent)' : 'var(--text-dim)', cursor: 'pointer', fontSize: 13, fontWeight: 600, textTransform: 'capitalize' }}>
                {t}
              </button>
            ))}
          </div>

          <div className="grid-half" style={{ gap: 10 }}>
            <div style={{ gridColumn: '1/-1' }}>
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Description *" style={inputStyle} />
            </div>
            <input value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              type="number" min="0" placeholder="Amount *" style={inputStyle} />
            <input value={form.dayOfMonth} onChange={e => setForm(f => ({ ...f, dayOfMonth: e.target.value }))}
              type="number" min="1" max="28" placeholder="Day of month (1–28)" style={inputStyle} />
            <div style={{ gridColumn: '1/-1' }}>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value=''>— Category (optional) —</option>
                {catOptions.map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
            <button onClick={() => setShowForm(false)} style={{ padding: '8px 18px', borderRadius: 10, border: '1px solid var(--border)', background: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
            <button onClick={save} disabled={!form.description || !form.amount}
              style={{ padding: '8px 18px', borderRadius: 10, border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, opacity: (!form.description || !form.amount) ? 0.5 : 1 }}>
              Save
            </button>
          </div>
        </Card>
      )}

      {recurring.length === 0 && !showForm ? (
        <div style={{ color: 'var(--text-dim)', fontSize: 14, textAlign: 'center', padding: '48px 0' }}>
          No recurring rules. Add one to auto-log monthly transactions.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {recurring.map((r, i) => {
            const cat = r.type === 'income'
              ? incomeCats.find(c => c.id === r.category)
              : categories.find(c => c.id === r.category)
            const color = cat?.color ?? (r.group ? GROUP_COLORS[r.group] : '#888')
            const isExpense = r.type === 'expense'
            return (
              <Card key={r.id} delay={i * 0.04}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 11, background: `${color}18`, border: `1.5px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, display: 'inline-block' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.description}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {cat && <span>{cat.label}</span>}
                      {r.group && <span style={{ color: GROUP_COLORS[r.group] ?? 'var(--text-dim)' }}>{r.group}</span>}
                      <span>Every month · day {r.dayOfMonth}</span>
                      <span style={{ color: 'var(--accent)' }}>Next: {nextRunDate(r.dayOfMonth)}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, marginRight: 8 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, fontFamily: 'DM Mono', color: isExpense ? 'var(--negative)' : 'var(--positive)' }}>
                      {isExpense ? '-' : '+'}{fmt(r.amount)}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'capitalize', marginTop: 2 }}>{r.type}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => openEdit(r)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', padding: '4px', display: 'flex' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button onClick={() => del(r.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--negative)', padding: '4px', display: 'flex' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
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

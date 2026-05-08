import { useState } from 'react'
import { useFinanceContext } from '../hooks/FinanceContext'
import { fmt } from '../lib/format'
import { Group, GROUPS, GROUP_LABELS, resolveLimit } from '../lib/data'
import Card from '../components/ui/Card'

const GROUP_COLORS: Record<Group, string> = {
  needs: '#5a9fff', family: '#60d0e0', savings: '#2ed18a', wants: '#f05060',
}

function BudgetArc({ pct, spent, color, hasLimit }: { pct: number; spent: number; color: string; hasLimit: boolean }) {
  const circ = 157
  const clamped = Math.min(pct, 100)
  const filled = (clamped / 100) * circ
  const arcColor = !hasLimit ? 'var(--border)' : pct >= 90 ? 'oklch(0.64 0.2 25)' : pct >= 70 ? '#f59e0b' : color
  return (
    <svg width="130" height="74" viewBox="0 0 120 68" style={{ overflow: 'visible', display: 'block' }}>
      <path d="M10,60 A50,50 0 0,1 110,60" fill="none" stroke="var(--border)" strokeWidth="9" strokeLinecap="round"/>
      {hasLimit && (
        <path d="M10,60 A50,50 0 0,1 110,60" fill="none" stroke={arcColor} strokeWidth="9" strokeLinecap="round"
          strokeDasharray={`${filled} ${circ}`}
          style={{ transition: 'stroke-dasharray 1s ease 0.3s', filter: `drop-shadow(0 0 5px ${arcColor}70)` }}/>
      )}
      <text x="60" y="52" textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--text)" fontFamily="DM Mono">{fmt(spent)}</text>
      {hasLimit && (
        <text x="60" y="64" textAnchor="middle" fontSize="9" fill={arcColor} fontFamily="DM Sans" fontWeight="600">{Math.min(Math.round(pct), 100)}%</text>
      )}
      <text x="10" y="76" textAnchor="middle" fontSize="9" fill="var(--text-dim)" fontFamily="DM Sans">0%</text>
      <text x="110" y="76" textAnchor="middle" fontSize="9" fill="var(--text-dim)" fontFamily="DM Sans">100%</text>
    </svg>
  )
}

export default function Budget() {
  const { txns, budgets, setBudgets, categories } = useFinanceContext()
  const [editing, setEditing]   = useState<Group | null>(null)
  const [editMode, setEditMode] = useState<'fixed' | 'pct'>('fixed')
  const [editValue, setEditValue] = useState('')
  const [expanded, setExpanded] = useState<Group | null>(null)

  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)

  // Build list of months that have transactions, plus current month
  const availableMonths = [...new Set([
    ...txns.map(t => t.date.slice(0, 7)),
    currentMonth,
  ])].filter(m => m <= currentMonth).sort().reverse()

  const thisMonth = selectedMonth
  const [selY, selM] = selectedMonth.split('-').map(Number)
  const monthLabel = new Date(selY, selM - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' })

  const monthTxns = txns.filter(t => t.date.startsWith(thisMonth))
  const monthIncome = monthTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)

  // Projected end-of-month: extrapolate daily burn to full month
  const isCurrentMonth = selectedMonth === currentMonth
  const dayOfMonth = now.getDate()
  const daysInMonth = new Date(selY, selM, 0).getDate()

  function startEdit(group: Group) {
    const entry = budgets[group]
    setEditMode(entry?.mode ?? 'fixed')
    setEditValue(entry ? String(entry.value) : '')
    setEditing(group)
  }

  // Sum of % budgets across all OTHER groups
  function otherPctTotal(excludeGroup: Group): number {
    return GROUPS.filter(g => g !== excludeGroup).reduce((s, g) => {
      const e = budgets[g]
      return s + (e?.mode === 'pct' ? e.value : 0)
    }, 0)
  }

  function saveEdit(group: Group) {
    const v = parseFloat(editValue)
    if (!isNaN(v) && v >= 0) {
      let capped = v
      if (editMode === 'pct') {
        const remaining = 100 - otherPctTotal(group)
        capped = Math.min(v, Math.max(0, remaining))
      }
      setBudgets({ ...budgets, [group]: { mode: editMode, value: capped } })
    }
    setEditing(null)
  }

  function clearBudget(group: Group) {
    const next = { ...budgets }
    delete next[group]
    setBudgets(next)
    setEditing(null)
  }

  const totalPlannedPct = GROUPS.reduce((s, g) => {
    const e = budgets[g]
    return s + (e?.mode === 'pct' ? e.value : 0)
  }, 0)

  return (
    <div className="page-pad">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Budget Tracker</div>
          <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <span>{monthLabel} income: <span style={{ color: 'var(--positive)', fontFamily: 'DM Mono' }}>{fmt(monthIncome)}</span></span>
            {totalPlannedPct > 0 && (
              <span>Planned: <span style={{ color: totalPlannedPct > 100 ? 'var(--negative)' : totalPlannedPct === 100 ? 'var(--positive)' : 'var(--text)', fontFamily: 'DM Mono', fontWeight: 600 }}>{totalPlannedPct}%</span> of income</span>
            )}
          </div>
        </div>
        <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
          style={{ padding: '7px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: 13, fontFamily: 'DM Sans', outline: 'none', cursor: 'pointer' }}>
          {availableMonths.map(m => {
            const [y, mo] = m.split('-').map(Number)
            return <option key={m} value={m}>{new Date(y, mo - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' })}</option>
          })}
        </select>
      </div>

      <div className="grid-half">
        {GROUPS.map((group, i) => {
          const entry = budgets[group]
          const limit = resolveLimit(entry, monthIncome)
          const spent = monthTxns
            .filter(t => t.type === 'expense' && t.group === group)
            .reduce((s, t) => s + t.amount, 0)
          const pct = limit > 0 ? (spent / limit) * 100 : 0
          const groupColor = GROUP_COLORS[group]
          const arcColor = !entry ? 'var(--border)' : pct >= 90 ? 'oklch(0.64 0.2 25)' : pct >= 70 ? '#f59e0b' : groupColor
          const groupCats = categories.filter(c => c.group === group)
          const isExpanded = expanded === group

          return (
            <Card key={group} delay={i * 0.06}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: groupColor, flexShrink: 0 }} />
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{GROUP_LABELS[group]}</div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => startEdit(group)} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 8, border: '1px solid var(--border)', background: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
                    {entry ? 'Edit' : 'Set'}
                  </button>
                  {entry && (
                    <button onClick={() => clearBudget(group)} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 8, border: '1px solid var(--border)', background: 'none', color: 'var(--negative)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  )}
                </div>
              </div>

              {editing === group ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {(['fixed', 'pct'] as const).map(m => (
                      <button key={m} onClick={() => setEditMode(m)} style={{ flex: 1, padding: '5px 0', borderRadius: 8, border: editMode === m ? '1px solid var(--accent)' : '1px solid var(--border)', background: editMode === m ? 'var(--accent-dim)' : 'var(--surface2)', color: editMode === m ? 'var(--accent)' : 'var(--text-dim)', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                        {m === 'fixed' ? 'Fixed ₹' : '% of income'}
                      </button>
                    ))}
                  </div>
                  {(() => {
                    const maxPct = 100 - otherPctTotal(group)
                    const v = parseFloat(editValue)
                    const overLimit = editMode === 'pct' && !isNaN(v) && v > maxPct
                    return (
                      <>
                        <input
                          value={editValue} onChange={e => setEditValue(e.target.value)}
                          type="number" min="0" max={editMode === 'pct' ? maxPct : undefined}
                          placeholder={editMode === 'pct' ? `max ${maxPct}%` : 'e.g. 35000'}
                          autoFocus
                          style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${overLimit ? 'var(--negative)' : 'var(--border)'}`, background: 'var(--surface2)', color: 'var(--text)', fontSize: 13, fontFamily: 'DM Sans', outline: 'none', width: '100%' }}
                          onKeyDown={e => { if (e.key === 'Enter') saveEdit(group); if (e.key === 'Escape') setEditing(null) }}
                        />
                        {overLimit && (
                          <div style={{ fontSize: 11, color: 'var(--negative)' }}>
                            Total budget would exceed 100% — max {maxPct}% available for this group.
                          </div>
                        )}
                      </>
                    )
                  })()}
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => saveEdit(group)} style={{ flex: 1, padding: '6px 0', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Save</button>
                    <button onClick={() => setEditing(null)} style={{ flex: 1, padding: '6px 0', borderRadius: 8, border: '1px solid var(--border)', background: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 12 }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Arc */}
                  <div style={{ display: 'flex', justifyContent: 'center', margin: '6px 0 2px' }}>
                    <BudgetArc pct={pct} spent={spent} color={groupColor} hasLimit={!!entry} />
                  </div>

                  {/* Stats row */}
                  <div style={{ display: 'grid', gridTemplateColumns: entry ? '1fr 1fr 1fr' : '1fr', gap: 4, textAlign: 'center', marginBottom: 8 }}>
                    {entry ? (
                      <>
                        <div>
                          <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 2 }}>Spent</div>
                          <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'DM Mono', color: 'var(--text)' }}>{fmt(spent)}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 2 }}>Budget</div>
                          <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'DM Mono', color: groupColor }}>
                            {entry.mode === 'pct' ? `${entry.value}%` : fmt(limit)}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 2 }}>{limit - spent >= 0 ? 'Left' : 'Over'}</div>
                          <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'DM Mono', color: limit - spent >= 0 ? 'var(--positive)' : 'var(--negative)' }}>
                            {fmt(Math.abs(limit - spent))}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div style={{ fontSize: 12, color: 'var(--text-dim)', padding: '4px 0' }}>No budget set</div>
                    )}
                  </div>

                  {/* Thin progress bar */}
                  {entry && (
                    <div style={{ height: 4, borderRadius: 2, background: 'var(--border)', overflow: 'hidden', marginBottom: 8 }}>
                      <div style={{ height: '100%', borderRadius: 2, background: arcColor, width: `${Math.min(pct, 100)}%`, transition: 'width 1s ease 0.4s' }} />
                    </div>
                  )}
                  {/* Projected end-of-month spend + breach date */}
                  {entry && isCurrentMonth && dayOfMonth > 0 && spent > 0 && (
                    (() => {
                      const projected = Math.round((spent / dayOfMonth) * daysInMonth)
                      const projPct = limit > 0 ? Math.round((projected / limit) * 100) : 0
                      const dailyBurn = spent / dayOfMonth
                      const daysToLimit = limit > 0 && dailyBurn > 0 ? (limit - spent) / dailyBurn : null
                      const breachDay = daysToLimit !== null && daysToLimit > 0 ? Math.round(dayOfMonth + daysToLimit) : null
                      const breachDate = breachDay !== null && breachDay <= daysInMonth
                        ? new Date(now.getFullYear(), now.getMonth(), breachDay)
                        : null
                      return (
                        <>
                          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: breachDate ? 3 : 6 }}>
                            Projected: <span style={{ fontFamily: 'DM Mono', color: projected > limit && limit > 0 ? 'var(--negative)' : 'var(--text)', fontWeight: 600 }}>{fmt(projected)}</span>
                            {limit > 0 && <span style={{ marginLeft: 4, color: projPct > 100 ? 'var(--negative)' : 'var(--text-dim)' }}>({projPct}%)</span>}
                          </div>
                          {breachDate && (
                            <div style={{ fontSize: 11, color: 'var(--negative)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                              Hits limit ~{breachDate.toLocaleDateString('default', { day: 'numeric', month: 'short' })}
                            </div>
                          )}
                        </>
                      )
                    })()
                  )}

                  {/* Category breakdown toggle */}
                  {groupCats.length > 0 && (
                    <button
                      onClick={() => setExpanded(isExpanded ? null : group)}
                      style={{ fontSize: 11, color: 'var(--text-dim)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left', width: '100%' }}
                    >
                      {isExpanded ? '▲ Hide categories' : `▼ ${groupCats.length} categories`}
                    </button>
                  )}
                  {isExpanded && (
                    <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {groupCats.map(cat => {
                        const catSpent = monthTxns
                          .filter(t => t.type === 'expense' && t.group === group && t.category === cat.id)
                          .reduce((s, t) => s + t.amount, 0)
                        const catPct = spent > 0 ? (catSpent / spent) * 100 : 0
                        return (
                          <div key={cat.id}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginBottom: 3 }}>
                              <div style={{ width: 6, height: 6, borderRadius: 3, background: cat.color, flexShrink: 0 }} />
                              <span style={{ flex: 1, color: 'var(--text-dim)' }}>{cat.label}</span>
                              <span style={{ color: 'var(--text)', fontFamily: 'DM Mono' }}>{fmt(catSpent)}</span>
                            </div>
                            <div style={{ height: 3, borderRadius: 2, background: 'var(--border)', overflow: 'hidden', marginLeft: 14 }}>
                              <div style={{ height: '100%', borderRadius: 2, background: cat.color, width: `${catPct}%`, transition: 'width 0.8s ease' }} />
                            </div>
                          </div>
                        )
                      })}
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

import { useState, useRef } from 'react'
import { useFinanceContext } from '../hooks/FinanceContext'
import { Category, Group, GROUPS, GROUP_LABELS, IncomeCat, uid } from '../lib/data'
import { nextCatColor } from '../constants/categories'
import Card from '../components/ui/Card'

const GROUP_COLORS: Record<Group, string> = {
  needs: '#5a9fff', family: '#60d0e0', savings: '#2ed18a', wants: '#f05060',
}

const SWATCHES = [
  '#5a9fff','#60d0e0','#2ed18a','#f05060',
  '#f59e0b','#a07aff','#ff7eb3','#38bdf8',
  '#fb923c','#34d399','#e879f9','#94a3b8',
]

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
      {SWATCHES.map(c => (
        <button
          key={c} type="button"
          onClick={() => onChange(c)}
          style={{
            width: 20, height: 20, borderRadius: 6, background: c, border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0,
            outline: value === c ? `2px solid var(--text)` : '2px solid transparent',
            outlineOffset: 2,
          }}
        />
      ))}
      <input
        type="color" value={value} onChange={e => onChange(e.target.value)}
        title="Custom color"
        style={{ width: 20, height: 20, borderRadius: 6, border: '1px solid var(--border)', cursor: 'pointer', padding: 0, background: 'none' }}
      />
    </div>
  )
}

function nextIncomeColor(cats: IncomeCat[]): string {
  const palette = ['#2ed18a','#5a9fff','#f59e0b','#a07aff','#ff7eb3','#60d0e0','#fb923c','#34d399']
  const used = new Set(cats.map(c => c.color))
  return palette.find(c => !used.has(c)) ?? palette[cats.length % palette.length]
}

function IncomeSection() {
  const { incomeCats, setIncomeCats, txns } = useFinanceContext()
  const [editingId, setEditingId]           = useState<string | null>(null)
  const [adding, setAdding]                 = useState(false)
  const [labelInput, setLabelInput]         = useState('')
  const [colorInput, setColorInput]         = useState('#2ed18a')
  const [requiresAccount, setRequiresAccount] = useState(false)
  const INCOME_COLOR = '#2ed18a'

  const txnCountByCat = (id: string) => txns.filter(t => t.type === 'income' && t.category === id).length

  function startAdd() { setAdding(true); setEditingId(null); setLabelInput(''); setColorInput(nextIncomeColor(incomeCats)); setRequiresAccount(false) }
  function startEdit(c: IncomeCat) { setEditingId(c.id); setAdding(false); setLabelInput(c.label); setColorInput(c.color); setRequiresAccount(c.requiresAccount ?? false) }
  function cancel() { setAdding(false); setEditingId(null); setLabelInput('') }

  function saveAdd() {
    if (!labelInput.trim()) return
    setIncomeCats([...incomeCats, { id: uid(), label: labelInput.trim(), color: colorInput, requiresAccount: requiresAccount || undefined }])
    setAdding(false); setLabelInput('')
  }

  function saveEdit() {
    if (!labelInput.trim() || !editingId) return
    setIncomeCats(incomeCats.map(c => c.id === editingId ? { ...c, label: labelInput.trim(), color: colorInput, requiresAccount: requiresAccount || undefined } : c))
    setEditingId(null); setLabelInput('')
  }

  function deleteIncomeCat(id: string) { setIncomeCats(incomeCats.filter(c => c.id !== id)) }

  const inputStyle: React.CSSProperties = {
    padding: '7px 10px', borderRadius: 8, border: '1px solid var(--border)',
    background: 'var(--surface2)', color: 'var(--text)', fontSize: 13,
    fontFamily: 'DM Sans', outline: 'none', width: '100%',
  }

  return (
    <Card delay={0.2}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: 3, background: INCOME_COLOR }} />
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Income Sources</div>
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: `${INCOME_COLOR}22`, color: INCOME_COLOR }}>{incomeCats.length}</span>
      </div>

      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {incomeCats.length === 0 && !adding && (
          <div style={{ fontSize: 12, color: 'var(--text-dim)', padding: '10px 0', textAlign: 'center' }}>No income sources yet.</div>
        )}

        {incomeCats.map(cat => (
          <div key={cat.id}>
            {editingId === cat.id ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '8px 0' }}>
                <ColorPicker value={colorInput} onChange={setColorInput} />
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: colorInput, flexShrink: 0 }} />
                  <input value={labelInput} onChange={e => setLabelInput(e.target.value)} style={inputStyle} autoFocus
                    onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancel() }} />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
                  <input type="checkbox" checked={requiresAccount} onChange={e => setRequiresAccount(e.target.checked)}
                    style={{ width: 14, height: 14, accentColor: 'var(--accent)', cursor: 'pointer' }} />
                  <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Requires source account <span style={{ opacity: 0.6 }}>(withdrawal / drawdown)</span></span>
                </label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={saveEdit} style={{ flex: 1, padding: '6px 0', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Save</button>
                  <button onClick={cancel} style={{ flex: 1, padding: '6px 0', borderRadius: 8, border: '1px solid var(--border)', background: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 12 }}>Cancel</button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => startEdit(cat)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', borderRadius: 8, cursor: 'pointer', transition: 'background 0.12s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ width: 10, height: 10, borderRadius: 3, background: cat.color, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 13, color: 'var(--text)' }}>{cat.label}</span>
                {cat.requiresAccount && (
                  <span style={{ fontSize: 10, color: '#f59e0b', background: '#f59e0b18', border: '1px solid #f59e0b30', borderRadius: 20, padding: '1px 6px', fontWeight: 600 }}>account</span>
                )}
                {txnCountByCat(cat.id) > 0 && (
                  <span style={{ fontSize: 10, color: 'var(--text-dim)', background: 'var(--surface3)', borderRadius: 20, padding: '1px 6px', fontWeight: 500 }}>{txnCountByCat(cat.id)}</span>
                )}
                <button
                  onClick={e => { e.stopPropagation(); deleteIncomeCat(cat.id) }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', padding: '2px 4px', display: 'flex', opacity: 0.6 }}
                  title="Delete"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            )}
          </div>
        ))}

        {adding ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6, padding: '8px 0', borderTop: '1px solid var(--border)' }}>
            <ColorPicker value={colorInput} onChange={setColorInput} />
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: colorInput, flexShrink: 0 }} />
              <input value={labelInput} onChange={e => setLabelInput(e.target.value)} placeholder="Source name" style={inputStyle} autoFocus
                onKeyDown={e => { if (e.key === 'Enter') saveAdd(); if (e.key === 'Escape') cancel() }} />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
              <input type="checkbox" checked={requiresAccount} onChange={e => setRequiresAccount(e.target.checked)}
                style={{ width: 14, height: 14, accentColor: 'var(--accent)', cursor: 'pointer' }} />
              <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Requires source account <span style={{ opacity: 0.6 }}>(withdrawal / drawdown)</span></span>
            </label>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={saveAdd} style={{ flex: 1, padding: '6px 0', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Add</button>
              <button onClick={cancel} style={{ flex: 1, padding: '6px 0', borderRadius: 8, border: '1px solid var(--border)', background: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 12 }}>Cancel</button>
            </div>
          </div>
        ) : (
          <button
            onClick={startAdd}
            style={{ marginTop: 6, fontSize: 12, color: INCOME_COLOR, background: 'none', border: `1px dashed ${INCOME_COLOR}55`, borderRadius: 8, cursor: 'pointer', padding: '6px 0', width: '100%', textAlign: 'center', transition: 'background 0.12s' }}
            onMouseEnter={e => (e.currentTarget.style.background = `${INCOME_COLOR}11`)}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            + Add income source
          </button>
        )}
      </div>
    </Card>
  )
}

export default function CategorySetup() {
  const { categories, setCategories, txns } = useFinanceContext()
  const dragRef = useRef<{ id: string; group: Group } | null>(null)

  const txnCountByCat = (catId: string) => txns.filter(t => t.category === catId).length

  function handleDragStart(catId: string, group: Group) {
    dragRef.current = { id: catId, group }
  }

  function handleDrop(targetId: string, targetGroup: Group) {
    const src = dragRef.current
    if (!src || src.id === targetId || src.group !== targetGroup) return
    const groupCats = categories.filter(c => c.group === targetGroup)
    const others    = categories.filter(c => c.group !== targetGroup)
    const srcIdx = groupCats.findIndex(c => c.id === src.id)
    const tgtIdx = groupCats.findIndex(c => c.id === targetId)
    const reordered = [...groupCats]
    reordered.splice(srcIdx, 1)
    reordered.splice(tgtIdx, 0, groupCats[srcIdx])
    setCategories([...others, ...reordered])
    dragRef.current = null
  }
  const [openGroups, setOpenGroups]         = useState<Set<Group>>(new Set(GROUPS))
  const [editingId, setEditingId]           = useState<string | null>(null)
  const [addingGroup, setAddingGroup]       = useState<Group | null>(null)
  const [labelInput, setLabelInput]         = useState('')
  const [colorInput, setColorInput]         = useState('#5a9fff')
  const [depositsToAccount, setDepositsToAccount] = useState(false)

  function startAdd(group: Group) {
    setAddingGroup(group)
    setEditingId(null)
    setLabelInput('')
    setColorInput(nextCatColor(categories))
    setDepositsToAccount(false)
  }

  function startEdit(cat: Category) {
    setEditingId(cat.id)
    setAddingGroup(null)
    setLabelInput(cat.label)
    setColorInput(cat.color)
    setDepositsToAccount(cat.depositsToAccount ?? false)
  }

  function cancelEdit() {
    setEditingId(null)
    setAddingGroup(null)
    setLabelInput('')
  }

  function saveAdd() {
    if (!labelInput.trim() || !addingGroup) return
    const newCat: Category = {
      id: uid(), label: labelInput.trim(), group: addingGroup, color: colorInput, isCustom: true,
      depositsToAccount: depositsToAccount || undefined,
    }
    setCategories([...categories, newCat])
    setAddingGroup(null)
    setLabelInput('')
  }

  function saveEdit() {
    if (!labelInput.trim() || !editingId) return
    setCategories(categories.map(c =>
      c.id === editingId ? { ...c, label: labelInput.trim(), color: colorInput, depositsToAccount: depositsToAccount || undefined } : c,
    ))
    setEditingId(null)
    setLabelInput('')
  }

  function deleteCategory(id: string) {
    setCategories(categories.filter(c => c.id !== id))
  }

  function toggleGroup(group: Group) {
    setOpenGroups(prev => {
      const next = new Set(prev)
      next.has(group) ? next.delete(group) : next.add(group)
      return next
    })
  }

  const inputStyle: React.CSSProperties = {
    padding: '7px 10px', borderRadius: 8, border: '1px solid var(--border)',
    background: 'var(--surface2)', color: 'var(--text)', fontSize: 13,
    fontFamily: 'DM Sans', outline: 'none', width: '100%',
  }

  return (
    <div className="page-pad">
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Category Setup</div>
        <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>Define categories for each budget group. Used when adding transactions.</div>
      </div>

      <IncomeSection />

      <div className="grid-half">
        {GROUPS.map((group, i) => {
          const groupColor = GROUP_COLORS[group]
          const groupCats  = categories.filter(c => c.group === group)
          const isOpen     = openGroups.has(group)

          return (
            <Card key={group} delay={i * 0.05}>
              {/* Header */}
              <button
                onClick={() => toggleGroup(group)}
                style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: groupColor, flexShrink: 0 }} />
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{GROUP_LABELS[group]}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 20,
                    background: `${groupColor}22`, color: groupColor,
                  }}>{groupCats.length}</span>
                  <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>{isOpen ? '▲' : '▼'}</span>
                </div>
              </button>

              {/* Collapsed: color preview strip */}
              {!isOpen && groupCats.length > 0 && (
                <div style={{ display: 'flex', gap: 5, marginTop: 10, flexWrap: 'wrap' }}>
                  {groupCats.map(cat => (
                    <div key={cat.id} title={cat.label} style={{ width: 10, height: 10, borderRadius: 3, background: cat.color }} />
                  ))}
                </div>
              )}

              {/* Expanded body */}
              {isOpen && (
                <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {/* Empty state */}
                  {groupCats.length === 0 && addingGroup !== group && (
                    <div style={{ fontSize: 12, color: 'var(--text-dim)', padding: '10px 0', textAlign: 'center' }}>
                      No categories yet — add one below.
                    </div>
                  )}

                  {groupCats.map(cat => (
                    <div key={cat.id}>
                      {editingId === cat.id ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '8px 0' }}>
                          <ColorPicker value={colorInput} onChange={setColorInput} />
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <div style={{ width: 10, height: 10, borderRadius: 3, background: colorInput, flexShrink: 0 }} />
                            <input
                              value={labelInput} onChange={e => setLabelInput(e.target.value)}
                              style={inputStyle} autoFocus
                              onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit() }}
                            />
                          </div>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
                            <input type="checkbox" checked={depositsToAccount} onChange={e => setDepositsToAccount(e.target.checked)}
                              style={{ width: 14, height: 14, accentColor: 'var(--accent)', cursor: 'pointer' }} />
                            <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Deposits to account <span style={{ opacity: 0.6 }}>(savings / investment)</span></span>
                          </label>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={saveEdit} style={{ flex: 1, padding: '6px 0', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Save</button>
                            <button onClick={cancelEdit} style={{ flex: 1, padding: '6px 0', borderRadius: 8, border: '1px solid var(--border)', background: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 12 }}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => startEdit(cat)}
                          draggable
                          onDragStart={() => handleDragStart(cat.id, group)}
                          onDragOver={e => e.preventDefault()}
                          onDrop={() => handleDrop(cat.id, group)}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', borderRadius: 8, cursor: 'pointer', transition: 'background 0.12s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: 'var(--text-dim)', opacity: 0.4, flexShrink: 0, cursor: 'grab' }}>
                            <circle cx="9" cy="7" r="1" fill="currentColor"/><circle cx="15" cy="7" r="1" fill="currentColor"/>
                            <circle cx="9" cy="12" r="1" fill="currentColor"/><circle cx="15" cy="12" r="1" fill="currentColor"/>
                            <circle cx="9" cy="17" r="1" fill="currentColor"/><circle cx="15" cy="17" r="1" fill="currentColor"/>
                          </svg>
                          <div style={{ width: 10, height: 10, borderRadius: 3, background: cat.color, flexShrink: 0 }} />
                          <span style={{ flex: 1, fontSize: 13, color: 'var(--text)' }}>{cat.label}</span>
                          {cat.depositsToAccount && (
                            <span style={{ fontSize: 10, color: 'var(--positive)', background: 'oklch(0.22 0.1 145)', border: '1px solid oklch(0.35 0.1 145)', borderRadius: 20, padding: '1px 6px', fontWeight: 600 }}>account</span>
                          )}
                          {txnCountByCat(cat.id) > 0 && (
                            <span style={{ fontSize: 10, color: 'var(--text-dim)', background: 'var(--surface3)', borderRadius: 20, padding: '1px 6px', fontWeight: 500 }}>
                              {txnCountByCat(cat.id)}
                            </span>
                          )}
                          <button
                            onClick={e => { e.stopPropagation(); deleteCategory(cat.id) }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', padding: '2px 4px', display: 'flex', opacity: 0.6 }}
                            title="Delete"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Add form */}
                  {addingGroup === group ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6, padding: '8px 0', borderTop: '1px solid var(--border)' }}>
                      <ColorPicker value={colorInput} onChange={setColorInput} />
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <div style={{ width: 10, height: 10, borderRadius: 3, background: colorInput, flexShrink: 0 }} />
                        <input
                          value={labelInput} onChange={e => setLabelInput(e.target.value)}
                          placeholder="Category name" style={inputStyle} autoFocus
                          onKeyDown={e => { if (e.key === 'Enter') saveAdd(); if (e.key === 'Escape') cancelEdit() }}
                        />
                      </div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
                        <input type="checkbox" checked={depositsToAccount} onChange={e => setDepositsToAccount(e.target.checked)}
                          style={{ width: 14, height: 14, accentColor: 'var(--accent)', cursor: 'pointer' }} />
                        <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Deposits to account <span style={{ opacity: 0.6 }}>(savings / investment)</span></span>
                      </label>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={saveAdd} style={{ flex: 1, padding: '6px 0', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Add</button>
                        <button onClick={cancelEdit} style={{ flex: 1, padding: '6px 0', borderRadius: 8, border: '1px solid var(--border)', background: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 12 }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => startAdd(group)}
                      style={{ marginTop: 6, fontSize: 12, color: groupColor, background: 'none', border: `1px dashed ${groupColor}55`, borderRadius: 8, cursor: 'pointer', padding: '6px 0', width: '100%', textAlign: 'center', transition: 'background 0.12s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = `${groupColor}11`)}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      + Add category
                    </button>
                  )}
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}

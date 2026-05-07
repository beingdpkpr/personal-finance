import { useState, useRef } from 'react'
import { useFinanceContext } from '../hooks/FinanceContext'
import { Category, Group, GROUPS, GROUP_LABELS, uid } from '../lib/data'
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
  const [openGroups, setOpenGroups]   = useState<Set<Group>>(new Set(GROUPS))
  const [editingId, setEditingId]     = useState<string | null>(null)
  const [addingGroup, setAddingGroup] = useState<Group | null>(null)
  const [labelInput, setLabelInput]   = useState('')
  const [colorInput, setColorInput]   = useState('#5a9fff')

  function startAdd(group: Group) {
    setAddingGroup(group)
    setEditingId(null)
    setLabelInput('')
    setColorInput(nextCatColor(categories))
  }

  function startEdit(cat: Category) {
    setEditingId(cat.id)
    setAddingGroup(null)
    setLabelInput(cat.label)
    setColorInput(cat.color)
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
    }
    setCategories([...categories, newCat])
    setAddingGroup(null)
    setLabelInput('')
  }

  function saveEdit() {
    if (!labelInput.trim() || !editingId) return
    setCategories(categories.map(c =>
      c.id === editingId ? { ...c, label: labelInput.trim(), color: colorInput } : c,
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

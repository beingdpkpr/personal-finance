import { useState } from 'react'
import { useFinanceContext } from '../hooks/FinanceContext'
import { Category, Group, GROUPS, GROUP_LABELS, uid } from '../lib/data'
import { nextCatColor } from '../constants/categories'
import Card from '../components/ui/Card'

export default function CategorySetup() {
  const { categories, setCategories } = useFinanceContext()
  const [openGroup, setOpenGroup]     = useState<Group | null>('needs')
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

  function saveAdd() {
    if (!labelInput.trim() || !addingGroup) return
    const newCat: Category = {
      id:       uid(),
      label:    labelInput.trim(),
      group:    addingGroup,
      color:    colorInput,
      isCustom: true,
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

  const inputStyle: React.CSSProperties = {
    padding: '7px 10px', borderRadius: 8, border: '1px solid var(--border)',
    background: 'var(--surface2)', color: 'var(--text)', fontSize: 13,
    fontFamily: 'DM Sans', outline: 'none',
  }

  return (
    <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 640 }}>
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Category Setup</div>
        <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>Define categories for each budget group. Used when adding transactions.</div>
      </div>

      {GROUPS.map((group, i) => {
        const groupCats = categories.filter(c => c.group === group)
        const isOpen = openGroup === group

        return (
          <Card key={group} delay={i * 0.05}>
            <button
              onClick={() => setOpenGroup(isOpen ? null : group)}
              style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{GROUP_LABELS[group]}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{groupCats.length} categories</span>
                <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>{isOpen ? '▲' : '▼'}</span>
              </div>
            </button>

            {isOpen && (
              <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {groupCats.map(cat => (
                  <div key={cat.id}>
                    {editingId === cat.id ? (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <input type="color" value={colorInput} onChange={e => setColorInput(e.target.value)} style={{ width: 32, height: 32, borderRadius: 6, border: 'none', cursor: 'pointer', padding: 2, background: 'none' }} />
                        <input value={labelInput} onChange={e => setLabelInput(e.target.value)} style={{ ...inputStyle, flex: 1 }} onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditingId(null) }} autoFocus />
                        <button onClick={saveEdit} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Save</button>
                        <button onClick={() => setEditingId(null)} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 12 }}>Cancel</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0' }}>
                        <div style={{ width: 10, height: 10, borderRadius: 5, background: cat.color, flexShrink: 0 }} />
                        <span style={{ flex: 1, fontSize: 13, color: 'var(--text)' }}>{cat.label}</span>
                        <button onClick={() => startEdit(cat)} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>Edit</button>
                        <button onClick={() => deleteCategory(cat.id)} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'none', color: 'var(--negative)', cursor: 'pointer' }}>Delete</button>
                      </div>
                    )}
                  </div>
                ))}

                {addingGroup === group ? (
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4 }}>
                    <input type="color" value={colorInput} onChange={e => setColorInput(e.target.value)} style={{ width: 32, height: 32, borderRadius: 6, border: 'none', cursor: 'pointer', padding: 2, background: 'none' }} />
                    <input value={labelInput} onChange={e => setLabelInput(e.target.value)} placeholder="Category name" style={{ ...inputStyle, flex: 1 }} onKeyDown={e => { if (e.key === 'Enter') saveAdd(); if (e.key === 'Escape') setAddingGroup(null) }} autoFocus />
                    <button onClick={saveAdd} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Add</button>
                    <button onClick={() => setAddingGroup(null)} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 12 }}>Cancel</button>
                  </div>
                ) : (
                  <button onClick={() => startAdd(group)} style={{ marginTop: 4, fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', textAlign: 'left' }}>+ Add category</button>
                )}
              </div>
            )}
          </Card>
        )
      })}
    </div>
  )
}

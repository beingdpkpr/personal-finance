import { useState } from 'react'
import { useFinanceContext } from '../../hooks/FinanceContext'
import { useTheme } from '../../hooks/ThemeContext'
import { CURRENCIES, nextCatColor } from '../../constants/categories'
import { Group, GROUPS, GROUP_LABELS, Category, uid } from '../../lib/data'
import { useNavigate } from 'react-router-dom'

interface Props { onClose: () => void }

const GROUP_COLORS: Record<Group, string> = {
  needs:    '#5a9fff',
  family:   '#60d0e0',
  savings:  '#2ed18a',
  wants:    '#f05060',
}
const SWATCH_COLORS = ['#5a9fff','#f0b030','#a07aff','#f05060','#ff7eb3','#2ed18a','#f0722a','#60d0e0','#8888aa','#e879f9','#fb923c','#34d399']

export default function SettingsModal({ onClose }: Props) {
  const { name, email, picture, currency, setCurrencyPref, logout, categories, setCategories } = useFinanceContext()
  const { darkMode, themeName, toggleDarkMode, setTheme } = useTheme()
  const navigate = useNavigate()

  const [tab, setTab] = useState<'general' | 'categories'>('general')
  const [addingGroup, setAddingGroup] = useState<Group | null>(null)
  const [newLabel, setNewLabel] = useState('')
  const [newColor, setNewColor] = useState(SWATCH_COLORS[0])
  const [editId, setEditId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [editColor, setEditColor] = useState('')

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  function startAdd(group: Group) {
    setAddingGroup(group)
    setNewLabel('')
    setNewColor(nextCatColor(categories))
    setEditId(null)
  }

  function confirmAdd() {
    if (!newLabel.trim() || !addingGroup) return
    const cat: Category = {
      id:       uid(),
      label:    newLabel.trim(),
      color:    newColor,
      group:    addingGroup,
      isCustom: true,
    }
    setCategories([...categories, cat])
    setAddingGroup(null)
    setNewLabel('')
  }

  function startEdit(cat: Category) {
    setEditId(cat.id)
    setEditLabel(cat.label)
    setEditColor(cat.color)
    setAddingGroup(null)
  }

  function confirmEdit() {
    if (!editLabel.trim()) return
    setCategories(categories.map(c => c.id === editId ? { ...c, label: editLabel.trim(), color: editColor } : c))
    setEditId(null)
  }

  function deleteCat(id: string) {
    setCategories(categories.filter(c => c.id !== id))
    if (editId === id) setEditId(null)
  }

  const inputStyle: React.CSSProperties = {
    padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)',
    background: 'var(--surface2)', color: 'var(--text)', fontSize: 12,
    fontFamily: 'DM Sans', outline: 'none', flex: 1, minWidth: 0,
  }

  return (
    <div
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}
      onClick={onClose}
    >
      <div
        style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:20, width:420, maxHeight:'88vh', display:'flex', flexDirection:'column' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Tabs */}
        <div style={{ display:'flex', borderBottom:'1px solid var(--border)', padding:'12px 20px 0', gap:4 }}>
          {(['general','categories'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding:'6px 16px', borderRadius:'8px 8px 0 0', border:'none', cursor:'pointer', fontSize:13, fontWeight:600,
              background: tab===t ? 'var(--surface2)' : 'transparent',
              color: tab===t ? 'var(--text)' : 'var(--text-dim)',
              textTransform:'capitalize',
            }}>{t}</button>
          ))}
        </div>

        <div style={{ overflowY:'auto', padding:24, display:'flex', flexDirection:'column', gap:18 }}>
          {tab === 'general' ? (
            <>
              {/* Profile */}
              <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ width:48, height:48, borderRadius:48, overflow:'hidden', background:'var(--accent-dim)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, color:'var(--accent)', fontWeight:700, flexShrink:0 }}>
                  {picture ? <img src={picture} style={{ width:'100%', height:'100%', objectFit:'cover' }} alt="" /> : (name?.[0] ?? '?')}
                </div>
                <div>
                  <div style={{ fontSize:15, fontWeight:600, color:'var(--text)' }}>{name}</div>
                  <div style={{ fontSize:12, color:'var(--text-dim)' }}>{email}</div>
                </div>
              </div>

              {/* Dark mode */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:14, color:'var(--text)' }}>Dark Mode</span>
                <button onClick={toggleDarkMode} style={{ width:44, height:24, borderRadius:12, border:'none', cursor:'pointer', background: darkMode ? 'var(--accent)' : 'var(--border)', position:'relative', transition:'background 0.2s' }}>
                  <span style={{ position:'absolute', top:3, left: darkMode?20:3, width:18, height:18, borderRadius:9, background:'white', transition:'left 0.2s', display:'block' }} />
                </button>
              </div>

              {/* Theme */}
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                <span style={{ fontSize:14, color:'var(--text)' }}>Accent Theme</span>
                <div style={{ display:'flex', gap:8 }}>
                  {(['violet','slate','rose'] as const).map(t => (
                    <button key={t} onClick={() => setTheme(t)} style={{ flex:1, padding:'8px 0', borderRadius:10, border: themeName===t ? '2px solid var(--accent)' : '1px solid var(--border)', background: themeName===t ? 'var(--accent-dim)' : 'var(--surface2)', color: themeName===t ? 'var(--accent)' : 'var(--text-dim)', cursor:'pointer', fontSize:13, fontWeight: themeName===t?600:400, textTransform:'capitalize', transition:'all 0.15s' }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Currency */}
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                <span style={{ fontSize:14, color:'var(--text)' }}>Currency</span>
                <select value={currency.code} onChange={e => {
                  const c = CURRENCIES.find(x => x.code === e.target.value)
                  if (c) setCurrencyPref(c)
                }} style={{ padding:'8px 12px', borderRadius:10, border:'1px solid var(--border)', background:'var(--surface2)', color:'var(--text)', fontSize:13, cursor:'pointer' }}>
                  {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>)}
                </select>
              </div>

              <button onClick={handleLogout} style={{ padding:'10px', borderRadius:10, border:'1px solid var(--border)', background:'var(--negative-dim)', color:'var(--negative)', cursor:'pointer', fontSize:14, fontWeight:600 }}>
                Sign Out
              </button>
            </>
          ) : (
            /* Categories tab */
            <>
              <div style={{ fontSize:12, color:'var(--text-dim)', lineHeight:1.5 }}>
                Built-in categories are fixed. Add custom sub-categories under any group.
              </div>
              {GROUP_LABELS && GROUPS.map(group => {
                const groupColor = GROUP_COLORS[group]
                const builtIn = categories.filter(c => !c.isCustom && c.group === group)
                const custom  = categories.filter(c => c.isCustom && c.group === group)

                return (
                  <div key={group} style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    {/* Group header */}
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ width:10, height:10, borderRadius:3, background:groupColor, display:'inline-block' }} />
                        <span style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>{GROUP_LABELS[group]}</span>
                      </div>
                      <button onClick={() => addingGroup === group ? setAddingGroup(null) : startAdd(group)}
                        style={{ fontSize:11, padding:'3px 10px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface2)', color:'var(--text-dim)', cursor:'pointer' }}>
                        + Add
                      </button>
                    </div>

                    {/* Built-in chips */}
                    <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                      {builtIn.map(c => (
                        <span key={c.id} style={{ padding:'4px 10px', borderRadius:20, background:`${c.color}22`, border:`1px solid ${c.color}44`, color:c.color, fontSize:12, fontWeight:500 }}>
                          {c.label}
                        </span>
                      ))}

                      {/* Custom cat chips */}
                      {custom.map(c => (
                        editId === c.id ? (
                          <div key={c.id} style={{ display:'flex', flexDirection:'column', gap:6, width:'100%', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:10, padding:'10px 12px' }}>
                            <div style={{ display:'flex', gap:6 }}>
                              <input value={editLabel} onChange={e => setEditLabel(e.target.value)}
                                autoFocus style={inputStyle} placeholder="Category name"
                                onKeyDown={e => { if(e.key==='Enter') confirmEdit(); if(e.key==='Escape') setEditId(null) }} />
                            </div>
                            <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                              {SWATCH_COLORS.map(sw => (
                                <button key={sw} onClick={() => setEditColor(sw)} style={{ width:20, height:20, borderRadius:10, background:sw, border: editColor===sw?'2px solid var(--text)':'2px solid transparent', cursor:'pointer', flexShrink:0 }} />
                              ))}
                            </div>
                            <div style={{ display:'flex', gap:6 }}>
                              <button onClick={confirmEdit} style={{ flex:1, padding:'5px 0', borderRadius:8, border:'none', background:'var(--accent)', color:'#fff', cursor:'pointer', fontSize:12, fontWeight:600 }}>Save</button>
                              <button onClick={() => setEditId(null)} style={{ flex:1, padding:'5px 0', borderRadius:8, border:'1px solid var(--border)', background:'none', color:'var(--text-dim)', cursor:'pointer', fontSize:12 }}>Cancel</button>
                              <button onClick={() => deleteCat(c.id)} style={{ padding:'5px 10px', borderRadius:8, border:'1px solid var(--border)', background:'var(--negative-dim)', color:'var(--negative)', cursor:'pointer', fontSize:12 }}>Delete</button>
                            </div>
                          </div>
                        ) : (
                          <button key={c.id} onClick={() => startEdit(c)}
                            style={{ padding:'4px 10px', borderRadius:20, background:`${c.color}22`, border:`1px solid ${c.color}44`, color:c.color, fontSize:12, fontWeight:500, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
                            {c.label}
                            <span style={{ fontSize:10, opacity:0.7 }}>✏</span>
                          </button>
                        )
                      ))}
                    </div>

                    {/* Add form */}
                    {addingGroup === group && (
                      <div style={{ display:'flex', flexDirection:'column', gap:8, background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:10, padding:'10px 12px' }}>
                        <input value={newLabel} onChange={e => setNewLabel(e.target.value)}
                          autoFocus style={inputStyle} placeholder="Category name"
                          onKeyDown={e => { if(e.key==='Enter') confirmAdd(); if(e.key==='Escape') setAddingGroup(null) }} />
                        <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                          {SWATCH_COLORS.map(sw => (
                            <button key={sw} onClick={() => setNewColor(sw)} style={{ width:20, height:20, borderRadius:10, background:sw, border: newColor===sw?'2px solid var(--text)':'2px solid transparent', cursor:'pointer', flexShrink:0 }} />
                          ))}
                        </div>
                        <div style={{ display:'flex', gap:6 }}>
                          <button onClick={confirmAdd} disabled={!newLabel.trim()} style={{ flex:1, padding:'5px 0', borderRadius:8, border:'none', background:'var(--accent)', color:'#fff', cursor:'pointer', fontSize:12, fontWeight:600, opacity:newLabel.trim()?1:0.5 }}>Add</button>
                          <button onClick={() => setAddingGroup(null)} style={{ flex:1, padding:'5px 0', borderRadius:8, border:'1px solid var(--border)', background:'none', color:'var(--text-dim)', cursor:'pointer', fontSize:12 }}>Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

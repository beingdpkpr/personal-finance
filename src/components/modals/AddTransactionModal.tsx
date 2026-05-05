import { useState, useEffect } from 'react'
import { useFinanceContext } from '../../hooks/FinanceContext'
import { CatGroup, GROUP_LABELS, TxnType } from '../../lib/data'

export default function AddTransactionModal() {
  const { modalVisible, editItem, closeModal, addTxn, editTxn, expenseCats, incomeCats } = useFinanceContext()
  const [type, setType]         = useState<TxnType>('expense')
  const [amount, setAmount]     = useState('')
  const [cat, setCat]           = useState('')
  const [subCat, setSubCat]     = useState('')
  const [desc, setDesc]         = useState('')
  const [date, setDate]         = useState(new Date().toISOString().slice(0, 10))
  const [notes, setNotes]       = useState('')
  const [tags, setTags]         = useState('')

  useEffect(() => {
    if (editItem) {
      setType(editItem.type); setAmount(String(editItem.amount)); setCat(editItem.category)
      setSubCat(editItem.subCategory ?? '')
      setDesc(editItem.description); setDate(editItem.date)
      setNotes(editItem.notes ?? ''); setTags((editItem.tags ?? []).join(', '))
    } else {
      setType('expense'); setAmount(''); setCat(''); setSubCat(''); setDesc('')
      setDate(new Date().toISOString().slice(0, 10)); setNotes(''); setTags('')
    }
  }, [editItem, modalVisible])

  if (!modalVisible) return null

  const cats = type === 'expense' ? expenseCats : incomeCats
  const GROUP_ORDER: CatGroup[] = ['essentials', 'family', 'savings', 'wants']

  function handleSave() {
    const amt = parseFloat(amount)
    if (!amt || !cat || !desc) return
    const txn = {
      type, amount: amt, category: cat, subCategory: subCat.trim() || undefined,
      description: desc, date,
      notes: notes || undefined,
      tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
    }
    if (editItem) editTxn({ ...txn, id: editItem.id })
    else addTxn(txn)
    closeModal()
  }

  const inputStyle: React.CSSProperties = {
    padding:'9px 12px', borderRadius:10, border:'1px solid var(--border)',
    background:'var(--surface2)', color:'var(--text)', fontSize:13,
    width:'100%', fontFamily:'DM Sans', outline:'none',
  }

  return (
    <div
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
      onClick={closeModal}
    >
      <div
        style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:22, padding:28, width:'100%', maxWidth:440, display:'flex', flexDirection:'column', gap:16, animation:'scaleIn 0.2s ease both' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h2 style={{ fontSize:16, fontWeight:700, color:'var(--text)' }}>{editItem ? 'Edit Transaction' : 'Add Transaction'}</h2>
          <button onClick={closeModal} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-dim)', fontSize:20, lineHeight:1 }}>×</button>
        </div>

        {/* Type toggle */}
        <div style={{ display:'flex', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:24, padding:3, gap:2 }}>
          {(['expense','income'] as TxnType[]).map(t => (
            <button key={t} onClick={() => { setType(t); setCat('') }} style={{ flex:1, padding:'7px 0', borderRadius:20, border:'none', cursor:'pointer', background: type===t?'var(--accent)':'transparent', color: type===t?'#fff':'var(--text-dim)', fontWeight:600, fontSize:13, textTransform:'capitalize', transition:'all 0.2s' }}>{t}</button>
          ))}
        </div>

        <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Description *" style={inputStyle} />
        <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount *" type="number" min="0" step="0.01" style={inputStyle} />
        <input value={date} onChange={e => setDate(e.target.value)} type="date" style={inputStyle} />

        {/* Category picker */}
        <div>
          <div style={{ fontSize:12, color:'var(--text-dim)', marginBottom:8 }}>Category *</div>
          {type === 'expense' ? (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {GROUP_ORDER.map(group => {
                const groupCats = expenseCats.filter(c => c.group === group)
                if (groupCats.length === 0) return null
                return (
                  <div key={group}>
                    <div style={{ fontSize:10, fontWeight:600, color:'var(--text-dim)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>{GROUP_LABELS[group]}</div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                      {groupCats.map(c => (
                        <button key={c.id} onClick={() => setCat(c.id)} style={{
                          padding:'5px 11px', borderRadius:20, cursor:'pointer', fontSize:11, fontWeight: cat===c.id?600:400,
                          border: cat===c.id?`1px solid ${c.color}`:'1px solid var(--border)',
                          background: cat===c.id?`${c.color}22`:'var(--surface2)',
                          color: cat===c.id?c.color:'var(--text-dim)',
                          transition:'all 0.12s',
                        }}>{c.label}</button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
              {cats.map(c => (
                <button key={c.id} onClick={() => setCat(c.id)} style={{
                  padding:'5px 11px', borderRadius:20, cursor:'pointer', fontSize:11, fontWeight: cat===c.id?600:400,
                  border: cat===c.id?`1px solid ${c.color}`:'1px solid var(--border)',
                  background: cat===c.id?`${c.color}22`:'var(--surface2)',
                  color: cat===c.id?c.color:'var(--text-dim)',
                  transition:'all 0.12s',
                }}>{c.label}</button>
              ))}
            </div>
          )}
        </div>

        <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes (optional)" style={inputStyle} />
        <input value={subCat} onChange={e => setSubCat(e.target.value)} placeholder="Sub-category (optional, e.g. SIP, Rent, Groceries)" style={inputStyle} />
        <input value={tags} onChange={e => setTags(e.target.value)} placeholder="Tags, comma separated" style={inputStyle} />

        <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:4 }}>
          <button onClick={closeModal} style={{ padding:'10px 20px', borderRadius:10, border:'1px solid var(--border)', background:'none', color:'var(--text-dim)', cursor:'pointer', fontSize:13 }}>Cancel</button>
          <button onClick={handleSave} disabled={!parseFloat(amount) || !cat || !desc} style={{ padding:'10px 20px', borderRadius:10, border:'none', background:'var(--accent)', color:'#fff', cursor:'pointer', fontSize:13, fontWeight:600, opacity:(!parseFloat(amount)||!cat||!desc)?0.5:1 }}>Save</button>
        </div>
      </div>
    </div>
  )
}

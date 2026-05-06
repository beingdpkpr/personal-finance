import { useState, useEffect } from 'react'
import { NetWorthItem, uid } from '../../lib/data'

interface Props {
  type: 'asset' | 'liability'
  onClose: () => void
  onSave: (item: NetWorthItem) => void
  editItem?: NetWorthItem
}

export default function AddAccountModal({ type, onClose, onSave, editItem }: Props) {
  const [name, setName]               = useState(editItem?.name ?? '')
  const [value, setValue]             = useState(editItem ? String(editItem.value) : '')
  const [institution, setInstitution] = useState(editItem?.institution ?? '')
  const [accountNumber, setAccountNumber] = useState(editItem?.accountNumber ?? '')
  const [notes, setNotes]             = useState(editItem?.notes ?? '')

  useEffect(() => {
    setName(editItem?.name ?? '')
    setValue(editItem ? String(editItem.value) : '')
    setInstitution(editItem?.institution ?? '')
    setAccountNumber(editItem?.accountNumber ?? '')
    setNotes(editItem?.notes ?? '')
  }, [editItem])

  function handleSave() {
    const v = parseFloat(value)
    if (!name || isNaN(v)) return
    onSave({
      id: editItem?.id ?? uid(), name, value: v,
      institution: institution.trim() || undefined,
      accountNumber: accountNumber.trim() || undefined,
      notes: notes.trim() || undefined,
    })
  }

  const inputStyle: React.CSSProperties = {
    padding:'9px 12px', borderRadius:10, border:'1px solid var(--border)',
    background:'var(--surface2)', color:'var(--text)', fontSize:13,
    fontFamily:'DM Sans', outline:'none', width:'100%',
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} onClick={onClose}>
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:20, padding:28, width:'100%', maxWidth:380, display:'flex', flexDirection:'column', gap:16, animation:'scaleIn 0.2s ease both' }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h2 style={{ fontSize:15, fontWeight:700, color:'var(--text)' }}>{editItem ? 'Edit' : 'Add'} {type === 'asset' ? 'Asset' : 'Liability'}</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-dim)', fontSize:20, lineHeight:1 }}>×</button>
        </div>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Account name (e.g. HDFC Savings)" style={inputStyle} />
        <input value={institution} onChange={e=>setInstitution(e.target.value)} placeholder="Institution (e.g. HDFC Bank, Zerodha)" style={inputStyle} />
        <input value={accountNumber} onChange={e=>setAccountNumber(e.target.value)} placeholder="Account number (optional)" style={inputStyle} />
        <input value={value} onChange={e=>setValue(e.target.value)} placeholder="Current value / balance" type="number" min="0" step="0.01" style={inputStyle} />
        <input value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Notes (optional)" style={inputStyle} />
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'9px 18px', borderRadius:10, border:'1px solid var(--border)', background:'none', color:'var(--text-dim)', cursor:'pointer', fontSize:13 }}>Cancel</button>
          <button onClick={handleSave} disabled={!name||!value} style={{ padding:'9px 18px', borderRadius:10, border:'none', background: type==='asset'?'var(--positive)':'var(--negative)', color:'#fff', cursor:'pointer', fontSize:13, fontWeight:600, opacity:(!name||!value)?0.5:1 }}>Save</button>
        </div>
      </div>
    </div>
  )
}

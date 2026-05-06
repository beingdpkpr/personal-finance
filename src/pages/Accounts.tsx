import { useState } from 'react'
import { useFinanceContext } from '../hooks/FinanceContext'
import { fmt } from '../lib/format'
import { NetWorthItem } from '../lib/data'
import AddAccountModal from '../components/modals/AddAccountModal'

type ModalState = { open: false } | { open: true; type: 'asset'|'liability'; editItem?: NetWorthItem }

const ACC_PALETTE = ['#7c6ef5','#22c55e','#f59e0b','#ec4899','#3b82f6','#f97316','#e879f9','#38bdf8']

export default function Accounts() {
  const { nw, setNw } = useFinanceContext()
  const [modal, setModal]   = useState<ModalState>({ open: false })
  const [hovId, setHovId]   = useState<string | null>(null)

  const totalAssets = nw.assets.reduce((s,a) => s+a.value, 0)
  const totalLiab   = nw.liabilities.reduce((s,l) => s+l.value, 0)
  const netWorth    = totalAssets - totalLiab

  const allItems = [
    ...nw.assets.map((a, i) => ({ ...a, isLiability: false, colorIdx: i })),
    ...nw.liabilities.map((l, i) => ({ ...l, isLiability: true, colorIdx: nw.assets.length + i })),
  ]

  function saveItem(item: NetWorthItem) {
    if (!modal.open) return
    const { type, editItem } = modal
    const list = type === 'asset' ? nw.assets : nw.liabilities
    const updated = editItem
      ? list.map(x => x.id === editItem.id ? item : x)
      : [...list, item]
    setNw(type === 'asset' ? { ...nw, assets: updated } : { ...nw, liabilities: updated })
    setModal({ open: false })
  }

  function deleteItem(isLiability: boolean, id: string) {
    if (!isLiability) setNw({ ...nw, assets: nw.assets.filter(a=>a.id!==id) })
    else setNw({ ...nw, liabilities: nw.liabilities.filter(l=>l.id!==id) })
  }

  return (
    <div style={{ padding:28, display:'flex', flexDirection:'column', gap:22 }}>
      {/* Net worth header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <div style={{ fontSize:12, color:'var(--text-dim)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>Total Net Worth</div>
          <div style={{ fontSize:28, fontWeight:700, fontFamily:'DM Mono', color:'var(--text)', letterSpacing:'-0.02em' }}>{fmt(netWorth)}</div>
          <div style={{ display:'flex', gap:16, marginTop:6 }}>
            <span style={{ fontSize:12, color:'var(--positive)' }}>Assets {fmt(totalAssets)}</span>
            <span style={{ fontSize:12, color:'var(--negative)' }}>Liabilities {fmt(totalLiab)}</span>
          </div>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={()=>setModal({open:true,type:'liability'})} style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 18px', borderRadius:12, border:'1px solid var(--border)', background:'transparent', color:'var(--text-dim)', cursor:'pointer', fontSize:13, fontWeight:500 }}>
            + Liability
          </button>
          <button onClick={()=>setModal({open:true,type:'asset'})} style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 18px', borderRadius:12, border:'none', background:'var(--accent)', color:'#fff', cursor:'pointer', fontSize:13, fontWeight:600, boxShadow:'0 4px 16px var(--accent-glow)' }}>
            + Add Account
          </button>
        </div>
      </div>

      {/* Unified card grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:18 }}>
        {allItems.map((item) => {
          const color = item.isLiability ? '#ec4899' : ACC_PALETTE[item.colorIdx % ACC_PALETTE.length]
          const initial = item.name.slice(0,1).toUpperCase()
          const hov   = hovId === item.id
          return (
            <div key={item.id}
              onMouseEnter={() => setHovId(item.id)}
              onMouseLeave={() => setHovId(null)}
              style={{
                background: `linear-gradient(145deg, var(--surface2) 60%, ${color}18)`,
                border: `1px solid ${hov ? color+'60' : 'var(--border)'}`,
                borderRadius:16, padding:20, display:'flex', flexDirection:'column', gap:14,
                position:'relative', overflow:'hidden',
                transition:'border-color 0.2s, box-shadow 0.2s',
                boxShadow: hov ? `0 8px 24px ${color}20` : 'none',
              }}>
              {/* Edit / Delete (on hover) */}
              {hov && (
                <div style={{ position:'absolute', top:12, right:12, display:'flex', gap:6, animation:'fadeIn 0.15s ease' }}>
                  <button onClick={()=>setModal({open:true, type: item.isLiability ? 'liability' : 'asset', editItem: item})}
                    style={{ width:28, height:28, borderRadius:8, background:'var(--surface3)', border:'1px solid var(--border)', cursor:'pointer', color:'var(--text-dim)', display:'flex', alignItems:'center', justifyContent:'center' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                  <button onClick={()=>deleteItem(item.isLiability, item.id)}
                    style={{ width:28, height:28, borderRadius:8, background:'oklch(0.22 0.08 25)', border:'1px solid var(--negative)', cursor:'pointer', color:'var(--negative)', display:'flex', alignItems:'center', justifyContent:'center' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
                </div>
              )}
              {/* Icon + name */}
              <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                <div style={{ width:46, height:46, borderRadius:14, background:`${color}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:700, color, border:`1px solid ${color}30`, flexShrink:0, fontFamily:'DM Sans, sans-serif' }}>{initial}</div>
                <div style={{ minWidth:0 }}>
                  <div style={{ fontSize:15, fontWeight:700, color:'var(--text)' }}>{item.name}</div>
                  <div style={{ fontSize:12, color:'var(--text-dim)', marginTop:2 }}>
                    {item.institution && <span>{item.institution}</span>}
                    {item.institution && item.accountNumber && <span style={{ margin:'0 4px', opacity:0.4 }}>·</span>}
                    {item.accountNumber && <span style={{ fontFamily:'DM Mono', letterSpacing:'0.03em' }}>••{item.accountNumber.slice(-4)}</span>}
                    {!item.institution && !item.accountNumber && <span>{item.isLiability ? 'Liability' : 'Asset'}</span>}
                  </div>
                  {item.notes && <div style={{ fontSize:11, color:'var(--text-dim)', marginTop:3, opacity:0.7, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.notes}</div>}
                </div>
              </div>
              {/* Balance */}
              <div>
                <div style={{ fontSize:11, color:'var(--text-dim)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>Balance</div>
                <div style={{ fontSize:28, fontWeight:700, fontFamily:'DM Mono', color: item.isLiability ? 'var(--negative)' : 'var(--text)', letterSpacing:'-0.02em' }}>
                  {item.isLiability ? '-' : ''}{fmt(item.value)}
                </div>
              </div>
            </div>
          )
        })}

        {/* Add account placeholder */}
        <button onClick={()=>setModal({open:true,type:'asset'})}
          style={{ background:'transparent', border:`2px dashed var(--border)`, borderRadius:16, padding:'20px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10, cursor:'pointer', color:'var(--text-dim)', transition:'all 0.2s', minHeight:160 }}
          onMouseEnter={e=>{ (e.currentTarget as HTMLElement).style.borderColor='var(--accent)'; (e.currentTarget as HTMLElement).style.color='var(--accent)' }}
          onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.borderColor='var(--border)'; (e.currentTarget as HTMLElement).style.color='var(--text-dim)' }}>
          <div style={{ width:44, height:44, borderRadius:12, border:'2px dashed currentColor', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>+</div>
          <span style={{ fontSize:13, fontWeight:500 }}>Add Account</span>
        </button>
      </div>

      {modal.open && (
        <AddAccountModal
          type={modal.type}
          editItem={modal.editItem}
          onClose={()=>setModal({open:false})}
          onSave={saveItem}
        />
      )}
    </div>
  )
}

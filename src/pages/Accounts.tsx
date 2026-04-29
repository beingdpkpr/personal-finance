import { useState } from 'react'
import { useFinanceContext } from '../hooks/FinanceContext'
import { fmt } from '../lib/format'
import { NetWorthItem, uid } from '../lib/data'
import AddAccountModal from '../components/modals/AddAccountModal'

type ModalState = { open: false } | { open: true; type: 'asset'|'liability'; editItem?: NetWorthItem }

const ACC_PALETTE = ['#7c6ef5','#22c55e','#f59e0b','#ec4899','#3b82f6','#f97316','#e879f9','#38bdf8']
const ACC_ICONS   = ['🏦','💰','📈','💵','🏛','📊','💎','🔒']

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
          const icon  = item.isLiability ? '💳' : ACC_ICONS[item.colorIdx % ACC_ICONS.length]
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
                    style={{ width:28, height:28, borderRadius:8, background:'var(--surface3)', border:'1px solid var(--border)', cursor:'pointer', color:'var(--text-dim)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12 }}>✎</button>
                  <button onClick={()=>deleteItem(item.isLiability, item.id)}
                    style={{ width:28, height:28, borderRadius:8, background:'oklch(0.22 0.08 25)', border:'1px solid var(--negative)', cursor:'pointer', color:'var(--negative)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13 }}>✕</button>
                </div>
              )}
              {/* Icon + name */}
              <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                <div style={{ width:46, height:46, borderRadius:14, background:`${color}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, border:`1px solid ${color}30`, flexShrink:0 }}>{icon}</div>
                <div>
                  <div style={{ fontSize:15, fontWeight:700, color:'var(--text)' }}>{item.name}</div>
                  <div style={{ fontSize:12, color:'var(--text-dim)', marginTop:2 }}>{item.isLiability ? 'Liability' : 'Asset'}</div>
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

export default function Accounts() {
  const { nw, setNw } = useFinanceContext()
  const [modal, setModal] = useState<ModalState>({ open: false })

  const totalAssets = nw.assets.reduce((s,a) => s+a.value, 0)
  const totalLiab   = nw.liabilities.reduce((s,l) => s+l.value, 0)
  const netWorth    = totalAssets - totalLiab

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

  function deleteItem(type: 'asset'|'liability', id: string) {
    if (type === 'asset') setNw({ ...nw, assets: nw.assets.filter(a=>a.id!==id) })
    else setNw({ ...nw, liabilities: nw.liabilities.filter(l=>l.id!==id) })
  }

  return (
    <div style={{ padding:28, display:'flex', flexDirection:'column', gap:22 }}>
      {/* Net worth summary */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
        {[
          { label:'Total Assets',      value: fmt(totalAssets), color:'var(--positive)' },
          { label:'Total Liabilities', value: fmt(totalLiab),   color:'var(--negative)' },
          { label:'Net Worth',         value: fmt(netWorth),    color: netWorth>=0?'var(--positive)':'var(--negative)' },
        ].map((s,i) => (
          <Card key={i} delay={i*0.05}>
            <div style={{ fontSize:11, color:'var(--text-dim)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>{s.label}</div>
            <div style={{ fontSize:24, fontWeight:700, fontFamily:'DM Mono', color:s.color }}>{s.value}</div>
          </Card>
        ))}
      </div>

      {/* Assets */}
      <div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <div style={{ fontSize:14, fontWeight:600, color:'var(--text)' }}>Assets</div>
          <button onClick={()=>setModal({open:true,type:'asset'})} style={{ padding:'5px 14px', borderRadius:20, border:'1px solid var(--positive)', background:'oklch(0.22 0.08 145)', color:'var(--positive)', cursor:'pointer', fontSize:12, fontWeight:600 }}>+ Add Asset</button>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:12 }}>
          {nw.assets.length === 0 && <div style={{ color:'var(--text-dim)', fontSize:13, gridColumn:'1/-1', padding:'12px 0' }}>No assets yet</div>}
          {nw.assets.map((a,i) => (
            <Card key={a.id} delay={i*0.04}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:500, color:'var(--text)' }}>{a.name}</div>
                  <div style={{ fontSize:16, fontWeight:700, fontFamily:'DM Mono', color:'var(--positive)', marginTop:4 }}>{fmt(a.value)}</div>
                </div>
                <div style={{ display:'flex', gap:4 }}>
                  <button onClick={()=>setModal({open:true,type:'asset',editItem:a})} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-dim)', fontSize:14, padding:'3px 6px' }}>✎</button>
                  <button onClick={()=>deleteItem('asset',a.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--negative)', fontSize:14, padding:'3px 6px' }}>✕</button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Liabilities */}
      <div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <div style={{ fontSize:14, fontWeight:600, color:'var(--text)' }}>Liabilities</div>
          <button onClick={()=>setModal({open:true,type:'liability'})} style={{ padding:'5px 14px', borderRadius:20, border:'1px solid var(--negative)', background:'oklch(0.22 0.08 25)', color:'var(--negative)', cursor:'pointer', fontSize:12, fontWeight:600 }}>+ Add Liability</button>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:12 }}>
          {nw.liabilities.length === 0 && <div style={{ color:'var(--text-dim)', fontSize:13, gridColumn:'1/-1', padding:'12px 0' }}>No liabilities yet</div>}
          {nw.liabilities.map((l,i) => (
            <Card key={l.id} delay={i*0.04}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:500, color:'var(--text)' }}>{l.name}</div>
                  <div style={{ fontSize:16, fontWeight:700, fontFamily:'DM Mono', color:'var(--negative)', marginTop:4 }}>{fmt(l.value)}</div>
                </div>
                <div style={{ display:'flex', gap:4 }}>
                  <button onClick={()=>setModal({open:true,type:'liability',editItem:l})} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-dim)', fontSize:14, padding:'3px 6px' }}>✎</button>
                  <button onClick={()=>deleteItem('liability',l.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--negative)', fontSize:14, padding:'3px 6px' }}>✕</button>
                </div>
              </div>
            </Card>
          ))}
        </div>
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

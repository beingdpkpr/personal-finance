import { useState } from 'react'
import { useFinanceContext } from '../hooks/FinanceContext'
import { fmt } from '../lib/format'
import { NetWorthItem, uid } from '../lib/data'
import Card from '../components/ui/Card'
import AddAccountModal from '../components/modals/AddAccountModal'

type ModalState = { open: false } | { open: true; type: 'asset'|'liability'; editItem?: NetWorthItem }

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

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFinanceContext } from '../hooks/FinanceContext'
import { fmt } from '../lib/format'
import { NetWorthItem } from '../lib/data'
import AddAccountModal from '../components/modals/AddAccountModal'

type ModalState = { open: false } | { open: true; type: 'asset'|'liability'; editItem?: NetWorthItem }

const ACC_PALETTE = ['#7c6ef5','#22c55e','#f59e0b','#ec4899','#3b82f6','#f97316','#e879f9','#38bdf8']

export default function Accounts() {
  const navigate = useNavigate()
  const { nw, setNw, txns } = useFinanceContext()
  const [modal, setModal] = useState<ModalState>({ open: false })
  const [hovId, setHovId] = useState<string | null>(null)

  const totalAssets = nw.assets.reduce((s,a) => s+a.value, 0)
  const totalLiab   = nw.liabilities.reduce((s,l) => s+l.value, 0)
  const netWorth    = totalAssets - totalLiab

  // Approximate last month NW using this month's net savings
  const now = new Date()
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`
  const monthTxns = txns.filter(t => t.date.startsWith(thisMonth))
  const monthNet  = monthTxns.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0)
                  - monthTxns.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0)
  const lastNW    = netWorth - monthNet
  const nwDelta   = lastNW !== 0 ? Math.round(Math.abs((netWorth - lastNW) / Math.abs(lastNW)) * 1000) / 10 : 0
  const nwUp      = netWorth >= lastNW

  const assetBarPct = totalAssets + totalLiab > 0 ? (totalAssets / (totalAssets + totalLiab)) * 100 : 100

  const assets      = nw.assets.map((a, i) => ({ ...a, isLiability: false, color: ACC_PALETTE[i % ACC_PALETTE.length] }))
  const liabilities = nw.liabilities.map((l, i) => ({ ...l, isLiability: true, color: ACC_PALETTE[(nw.assets.length + i) % ACC_PALETTE.length] }))

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

  function renderSection(items: typeof assets, total: number, sectionLabel: string) {
    return (
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:12, fontWeight:700, color:'var(--text-dim)', textTransform:'uppercase', letterSpacing:'0.07em' }}>{sectionLabel}</span>
            <span style={{ fontSize:11, color:'var(--text-dim)', background:'var(--surface3)', padding:'1px 8px', borderRadius:20 }}>{items.length}</span>
          </div>
          <span style={{ fontSize:13, fontWeight:700, fontFamily:'DM Mono', color: sectionLabel === 'Liabilities' ? 'var(--negative)' : 'var(--positive)' }}>
            {sectionLabel === 'Liabilities' ? '-' : ''}{fmt(total)}
          </span>
        </div>
        <div className="grid-accounts">
          {items.map((item) => {
            const { color } = item
            const hov = hovId === item.id
            const pct = total > 0 ? Math.round((item.value / total) * 100) : 0
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
                {hov && (
                  <div style={{ position:'absolute', top:12, right:12, display:'flex', gap:6 }}>
                    <button onClick={()=>navigate(`/transactions?q=${encodeURIComponent(item.name)}`)}
                      title="View transactions"
                      style={{ height:28, padding:'0 10px', borderRadius:8, background:'var(--surface3)', border:'1px solid var(--border)', cursor:'pointer', color:'var(--text-dim)', display:'flex', alignItems:'center', gap:4, fontSize:11 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg>
                      Txns
                    </button>
                    <button onClick={()=>setModal({open:true, type: item.isLiability ? 'liability' : 'asset', editItem: item})}
                      style={{ width:28, height:28, borderRadius:8, background:'var(--surface3)', border:'1px solid var(--border)', cursor:'pointer', color:'var(--text-dim)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button onClick={()=>deleteItem(item.isLiability, item.id)}
                      style={{ width:28, height:28, borderRadius:8, background:'oklch(0.22 0.08 25)', border:'1px solid var(--negative)', cursor:'pointer', color:'var(--negative)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                )}
                <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                  <div style={{ width:46, height:46, borderRadius:14, background:`${color}18`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, border:`1.5px solid ${color}40` }}>
                    <span style={{ width:14, height:14, borderRadius:'50%', background:color, display:'inline-block' }} />
                  </div>
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
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
                  <div>
                    <div style={{ fontSize:24, fontWeight:700, fontFamily:'DM Mono', color: item.isLiability ? 'var(--negative)' : 'var(--text)', letterSpacing:'-0.02em' }}>
                      {item.isLiability ? '-' : ''}{fmt(item.value)}
                    </div>
                  </div>
                  <span style={{ fontSize:11, color, background:`${color}18`, border:`1px solid ${color}30`, padding:'2px 8px', borderRadius:20, fontWeight:600 }}>{pct < 1 ? '< 1' : pct}%</span>
                </div>
              </div>
            )
          })}
          <button onClick={()=>setModal({open:true, type: sectionLabel === 'Assets' ? 'asset' : 'liability'})}
            style={{ background:'transparent', border:`2px dashed var(--border)`, borderRadius:16, padding:'20px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10, cursor:'pointer', color:'var(--text-dim)', transition:'all 0.2s', minHeight:160 }}
            onMouseEnter={e=>{ (e.currentTarget as HTMLElement).style.borderColor='var(--accent)'; (e.currentTarget as HTMLElement).style.color='var(--accent)' }}
            onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.borderColor='var(--border)'; (e.currentTarget as HTMLElement).style.color='var(--text-dim)' }}>
            <div style={{ width:44, height:44, borderRadius:12, border:'2px dashed currentColor', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>+</div>
            <span style={{ fontSize:13, fontWeight:500 }}>{sectionLabel === 'Assets' ? 'Add Account' : 'Add Liability'}</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page-pad" style={{ gap:24 }}>
      {/* Net worth header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          <div style={{ fontSize:12, color:'var(--text-dim)', textTransform:'uppercase', letterSpacing:'0.06em' }}>Total Net Worth</div>
          <div style={{ display:'flex', alignItems:'baseline', gap:12 }}>
            <div style={{ fontSize:32, fontWeight:700, fontFamily:'DM Mono', color:'var(--text)', letterSpacing:'-0.02em' }}>{fmt(netWorth)}</div>
            {nwDelta > 0 && (
              <span style={{ fontSize:12, fontWeight:600, borderRadius:20, padding:'3px 8px', color: nwUp ? 'oklch(0.68 0.18 145)' : 'oklch(0.64 0.2 25)', background: nwUp ? 'oklch(0.22 0.08 145)' : 'oklch(0.22 0.08 25)', display:'flex', alignItems:'center', gap:3 }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  {nwUp ? <polyline points="18 15 12 9 6 15"/> : <polyline points="6 9 12 15 18 9"/>}
                </svg>
                {nwDelta}% vs last month
              </span>
            )}
          </div>
          {/* Composition bar */}
          <div style={{ display:'flex', flexDirection:'column', gap:6, marginTop:2 }}>
            <div style={{ height:6, borderRadius:3, overflow:'hidden', display:'flex', gap:1, maxWidth:360 }}>
              <div style={{ height:'100%', borderRadius:'3px 0 0 3px', background:'var(--positive)', width:`${assetBarPct}%`, transition:'width 0.6s ease', flexShrink:0 }} />
              <div style={{ height:'100%', borderRadius:'0 3px 3px 0', background:'var(--negative)', flex:1, transition:'flex 0.6s ease' }} />
            </div>
            <div style={{ display:'flex', gap:16 }}>
              <span style={{ fontSize:12, color:'var(--positive)' }}>Assets {fmt(totalAssets)} <span style={{ opacity:0.6 }}>· {Math.round(assetBarPct)}%</span></span>
              <span style={{ fontSize:12, color:'var(--negative)' }}>Liabilities {fmt(totalLiab)} <span style={{ opacity:0.6 }}>· {Math.round(100 - assetBarPct)}%</span></span>
            </div>
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

      {assets.length > 0 && renderSection(assets, totalAssets, 'Assets')}
      {liabilities.length > 0 && renderSection(liabilities, totalLiab, 'Liabilities')}

      {assets.length === 0 && liabilities.length === 0 && (
        <div style={{ textAlign:'center', color:'var(--text-dim)', padding:'48px 0', fontSize:14 }}>No accounts yet — add your first account above.</div>
      )}

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

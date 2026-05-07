import { useState, useRef, useEffect, useMemo, Fragment } from 'react'
import { useFinanceContext } from '../hooks/FinanceContext'
import { useSearchParams } from 'react-router-dom'
import { fmt } from '../lib/format'
import { Group, GROUPS, GROUP_LABELS } from '../lib/data'
import { MONTHS_FULL } from '../constants/categories'
import Card from '../components/ui/Card'
import GooglePayImportModal from '../components/modals/GooglePayImportModal'

const GROUP_COLORS: Record<Group, string> = {
  needs: '#5a9fff', family: '#60d0e0', savings: '#2ed18a', wants: '#f05060',
}

type Filter = 'all' | 'income' | 'expense'

function Checkbox({ checked, indeterminate, onChange }: { checked: boolean; indeterminate?: boolean; onChange: () => void }) {
  return (
    <div
      onClick={e => { e.stopPropagation(); onChange() }}
      style={{
        width: 16, height: 16, borderRadius: 4, flexShrink: 0, cursor: 'pointer',
        border: checked || indeterminate ? 'none' : '1.5px solid var(--border)',
        background: checked ? 'var(--accent)' : indeterminate ? 'var(--accent)' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s', boxSizing: 'border-box',
      }}
    >
      {checked && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
      {!checked && indeterminate && <svg width="8" height="2" viewBox="0 0 8 2"><rect width="8" height="2" rx="1" fill="white" /></svg>}
    </div>
  )
}

export default function Transactions() {
  const { txns, deleteTxn, deleteTxns, openAdd, openEdit, addTxn, editTxn, editTxns, categories, incomeCats } = useFinanceContext()
  const [searchParams] = useSearchParams()
  const [search, setSearch]           = useState(searchParams.get('q') ?? '')
  const [filter, setFilter]           = useState<Filter>('all')
  const [groupFilter, setGroupFilter] = useState<Group | 'all' | 'uncategorized'>('all')
  const [subCatFilter, setSubCatFilter] = useState<string | 'all'>('all')
  const [openFilter, setOpenFilter]   = useState<string | null>(null)
  const [dateFrom, setDateFrom]       = useState(searchParams.get('from') ?? '')
  const [dateTo, setDateTo]           = useState(searchParams.get('to') ?? '')
  const [sortCol, setSortCol]         = useState<'date' | 'amount'>('date')
  const [sortDir, setSortDir]         = useState<'asc' | 'desc'>('desc')
  const [page, setPage]               = useState(1)
  const [editingAmountId, setEditingAmountId] = useState<string | null>(null)
  const [editingAmountVal, setEditingAmountVal] = useState('')
  const [collapsedMonths, setCollapsedMonths] = useState<Set<string>>(new Set())
  const [gpayOpen, setGpayOpen]       = useState(false)
  const [selected, setSelected]       = useState<Set<string>>(new Set())
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showRecat, setShowRecat]     = useState(false)
  const [recatGroup, setRecatGroup]   = useState<Group | ''>('')
  const [recatCat, setRecatCat]       = useState('')
  const [selectedMonth, setSelectedMonth] = useState(searchParams.get('month') ?? '')
  const [toast, setToast]             = useState<{ msg: string; ok: boolean } | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function showToast(msg: string, ok: boolean) {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ msg, ok })
    toastTimer.current = setTimeout(() => setToast(null), 5000)
  }

  function selectMonth(ym: string) {
    setSelectedMonth(ym)
    if (!ym) { setDateFrom(''); setDateTo(''); return }
    const [y, m] = ym.split('-').map(Number)
    const lastDay = new Date(y, m, 0).getDate()
    setDateFrom(`${ym}-01`)
    setDateTo(`${ym}-${String(lastDay).padStart(2, '0')}`)
  }

  useEffect(() => {
    const q     = searchParams.get('q')
    const from  = searchParams.get('from')
    const to    = searchParams.get('to')
    const month = searchParams.get('month')
    if (q     !== null) setSearch(q)
    if (month !== null) selectMonth(month)
    else {
      if (from !== null) setDateFrom(from)
      if (to   !== null) setDateTo(to)
    }
  }, [searchParams])
  useEffect(() => { setSelected(new Set()); setPage(1) }, [search, filter, groupFilter, subCatFilter, dateFrom, dateTo, sortCol, sortDir])
  useEffect(() => {
    if (!openFilter) return
    function handle() { setOpenFilter(null) }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [openFilter])

  const fileRef = useRef<HTMLInputElement>(null)

  const fmtDate = (d: string) => {
    const [y, m, day] = d.split('-').map(Number)
    const label = `${day} ${MONTHS_FULL[m - 1].slice(0, 3)}`
    return y !== new Date().getFullYear() ? `${label} '${String(y).slice(2)}` : label
  }

  const PAGE_SIZE = 50
  const allCats = [...categories, ...incomeCats]

  const getCatLabel = (id: string | undefined, type?: string) => {
    if (!id) return ''
    if (type === 'income') return incomeCats.find(c => c.id === id)?.label ?? ''
    if (type === 'expense') return categories.find(c => c.id === id)?.label ?? ''
    return allCats.find(c => c.id === id)?.label ?? ''
  }
  const getCatColor = (id: string | undefined, type?: string) => {
    if (!id) return '#888'
    if (type === 'income') return incomeCats.find(c => c.id === id)?.color ?? '#888'
    if (type === 'expense') return categories.find(c => c.id === id)?.color ?? '#888'
    return allCats.find(c => c.id === id)?.color ?? '#888'
  }

  const availableMonths = useMemo(() =>
    [...new Set(txns.filter(t => !!t.date).map(t => t.date.slice(0, 7)))].sort((a, b) => b.localeCompare(a)),
  [txns])

  const usedGroups = useMemo(() => GROUPS.filter(g => txns.some(t => t.type === 'expense' && t.group === g)), [txns])
  const hasIncome = useMemo(() => txns.some(t => t.type === 'income'), [txns])
  const hasUncategorized = useMemo(() => txns.some(t => t.type === 'expense' && !t.group), [txns])

  const filtered = txns
    .filter(t => filter === 'all' || t.type === filter)
    .filter(t => {
      if (groupFilter === 'all') return true
      if (groupFilter === 'uncategorized') return t.type === 'expense' && !t.group
      return t.type === 'expense' && t.group === groupFilter
    })
    .filter(t => subCatFilter === 'all' || t.category === subCatFilter)
    .filter(t => !dateFrom || t.date >= dateFrom)
    .filter(t => !dateTo   || t.date <= dateTo)
    .filter(t => {
      const q = search.toLowerCase()
      return !q
        || t.description.toLowerCase().includes(q)
        || getCatLabel(t.category, t.type).toLowerCase().includes(q)
        || (t.notes ?? '').toLowerCase().includes(q)
        || (t.tags ?? []).some(tag => tag.toLowerCase().includes(q))
    })
    .sort((a, b) => {
      if (sortCol === 'amount') return sortDir === 'asc' ? a.amount - b.amount : b.amount - a.amount
      return sortDir === 'asc' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)
    })

  const paged = filtered.slice(0, page * PAGE_SIZE)
  const hasMore = paged.length < filtered.length

  const monthGroups: { key: string; label: string; items: typeof filtered; netTotal: number }[] = []
  for (const t of paged) {
    const mk = t.date.slice(0, 7)
    const last = monthGroups[monthGroups.length - 1]
    if (last && last.key === mk) {
      last.items.push(t); last.netTotal += t.type === 'income' ? t.amount : -t.amount
    } else {
      const [y, mo] = mk.split('-')
      monthGroups.push({ key: mk, label: `${MONTHS_FULL[parseInt(mo) - 1]} ${y}`, items: [t], netTotal: t.type === 'income' ? t.amount : -t.amount })
    }
  }

  const totalIn  = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalOut = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const net      = totalIn - totalOut

  function toggleRow(id: string) {
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  }
  function toggleAll() {
    setSelected(prev => prev.size === filtered.length ? new Set() : new Set(filtered.map(t => t.id)))
  }
  function bulkDelete() {
    deleteTxns([...selected]); setSelected(new Set()); setConfirmDelete(false)
  }
  function bulkRecategorize() {
    if (!recatGroup) return
    const validCat = categories.find(c => c.id === recatCat && c.group === recatGroup)?.id
    const updated = txns
      .filter(t => selected.has(t.id) && t.type === 'expense')
      .map(t => ({ ...t, group: recatGroup as Group, category: validCat }))
    editTxns(updated)
    setSelected(new Set()); setShowRecat(false); setRecatGroup(''); setRecatCat('')
  }

  function exportCSV() {
    const headers = ['Date', 'Description', 'Category', 'Type', 'Amount', 'Notes', 'Tags']
    const rows = filtered.map(t => [t.date, t.description, getCatLabel(t.category, t.type), t.type, t.amount, t.notes ?? '', (t.tags ?? []).join(';')])
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = 'transactions.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  function importCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const text = ev.target?.result as string
        const lines = text.trim().split(/\r?\n/).slice(1)
        const existingKeys = new Set(txns.map(t => `${t.date}|${t.amount}|${t.description.toLowerCase()}`))
        let imported = 0, skipped = 0
        lines.forEach(line => {
          // Proper RFC-4180 CSV parse (handles quoted fields with embedded commas)
          const cols: string[] = []
          let cur = '', inQ = false
          for (let i = 0; i < line.length; i++) {
            const ch = line[i]
            if (inQ) {
              if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++ }
              else if (ch === '"') inQ = false
              else cur += ch
            } else {
              if (ch === '"') inQ = true
              else if (ch === ',') { cols.push(cur); cur = '' }
              else cur += ch
            }
          }
          cols.push(cur)

          let [date, description, category, type, amount, rawNotes] = cols
          if (!date || !description || !type || !amount) return

          // Normalise date: accept YYYY-MM-DD (pass through) or DD-MM-YYYY → YYYY-MM-DD
          const ddmmyyyy = date.match(/^(\d{2})-(\d{2})-(\d{4})$/)
          if (ddmmyyyy) date = `${ddmmyyyy[3]}-${ddmmyyyy[2]}-${ddmmyyyy[1]}`
          if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return

          let notes: string | undefined
          const match = rawNotes?.match(/subcat:([^|;]+)/)
          if (match) notes = rawNotes.replace(/subcat:[^|;]*/, '').replace(/^[|;\s]+/, '').trim() || undefined
          else notes = rawNotes || undefined

          const key = `${date}|${parseFloat(amount)}|${description.toLowerCase()}`
          if (existingKeys.has(key)) { skipped++; return }
          existingKeys.add(key)
          addTxn({ date, description, category: category || undefined, type: type as 'expense' | 'income', amount: parseFloat(amount) || 0, notes })
          imported++
        })
        const parts = []
        if (imported > 0) parts.push(`${imported} imported`)
        if (skipped > 0) parts.push(`${skipped} duplicate${skipped !== 1 ? 's' : ''} skipped`)
        if (parts.length > 0) showToast(parts.join(', ') + '.', imported > 0)
        else showToast('No valid transactions found in the file.', false)
      } catch {
        showToast('Import failed — could not parse the CSV file.', false)
      }
    }
    reader.onerror = () => showToast('Import failed — could not read the file.', false)
    reader.readAsText(file); e.target.value = ''
  }

  function toggleMonthCollapse(key: string) {
    setCollapsedMonths(prev => {
      const s = new Set(prev); s.has(key) ? s.delete(key) : s.add(key); return s
    })
  }

  const selectedExpenses = [...selected].filter(id => txns.find(t => t.id === id)?.type === 'expense')

  return (
    <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        {[
          { label: 'Total In',  value: fmt(totalIn),  color: 'var(--positive)' },
          { label: 'Total Out', value: fmt(totalOut), color: 'var(--negative)' },
          { label: 'Net',       value: fmt(net),      color: net >= 0 ? 'var(--positive)' : 'var(--negative)' },
        ].map((s, i) => (
          <Card key={i} delay={i * 0.05}>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'DM Mono', color: s.color }}>{s.value}</div>
          </Card>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 160, position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search transactions…"
            style={{ width: '100%', padding: '8px 32px 8px 14px', borderRadius: 20, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: 13, fontFamily: 'DM Sans', outline: 'none', boxSizing: 'border-box' }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', padding: 2, borderRadius: '50%', lineHeight: 1 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          )}
        </div>
        {/* Month picker */}
        <select value={selectedMonth} onChange={e => selectMonth(e.target.value)}
          style={{ height: 36, padding: '0 10px', borderRadius: 10, border: `1px solid ${selectedMonth ? 'var(--accent)' : 'var(--border)'}`, background: selectedMonth ? 'var(--accent-dim)' : 'var(--surface2)', color: selectedMonth ? 'var(--accent)' : 'var(--text)', fontSize: 13, cursor: 'pointer', fontFamily: 'DM Sans', outline: 'none', fontWeight: selectedMonth ? 600 : 400 }}>
          <option value=''>All months</option>
          {availableMonths.map(ym => {
            const [y, m] = ym.split('-')
            return <option key={ym} value={ym}>{MONTHS_FULL[parseInt(m) - 1]} {y}</option>
          })}
        </select>
        {/* Date range */}
        <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setSelectedMonth('') }}
          style={{ padding: '7px 10px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface2)', color: dateFrom ? 'var(--text)' : 'var(--text-dim)', fontSize: 12, fontFamily: 'DM Sans', outline: 'none', cursor: 'pointer' }} />
        <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>–</span>
        <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setSelectedMonth('') }}
          style={{ padding: '7px 10px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface2)', color: dateTo ? 'var(--text)' : 'var(--text-dim)', fontSize: 12, fontFamily: 'DM Sans', outline: 'none', cursor: 'pointer' }} />
        {(dateFrom || dateTo || selectedMonth) && (
          <button onClick={() => { setDateFrom(''); setDateTo(''); setSelectedMonth('') }} style={{ fontSize: 11, padding: '4px 8px', borderRadius: 8, border: '1px solid var(--border)', background: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>✕ Clear</button>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <button onClick={exportCSV} style={{ padding: '7px 14px', borderRadius: 20, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 12 }}>↓ Export</button>
          <button onClick={() => fileRef.current?.click()} style={{ padding: '7px 14px', borderRadius: 20, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 12 }}>↑ Import CSV</button>
          <input ref={fileRef} type="file" accept=".csv" onChange={importCSV} style={{ display: 'none' }} />
          <button onClick={() => setGpayOpen(true)} style={{ padding: '7px 14px', borderRadius: 20, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontWeight: 700, color: '#4285f4', fontSize: 13 }}>G</span> GPay
          </button>
          <button onClick={openAdd} style={{ padding: '7px 14px', borderRadius: 20, border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>+ Add</button>
        </div>
      </div>

      {/* Confirm delete dialog */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setConfirmDelete(false)}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: 28, width: 360, display: 'flex', flexDirection: 'column', gap: 16, animation: 'scaleIn 0.15s ease both' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Delete {selected.size} transaction{selected.size !== 1 ? 's' : ''}?</div>
            <div style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.6 }}>This cannot be undone.</div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmDelete(false)} style={{ padding: '9px 20px', borderRadius: 10, border: '1px solid var(--border)', background: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
              <button onClick={bulkDelete} style={{ padding: '9px 20px', borderRadius: 10, border: 'none', background: 'var(--negative)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk recategorize dialog */}
      {showRecat && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowRecat(false)}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: 24, width: 380, display: 'flex', flexDirection: 'column', gap: 14, animation: 'scaleIn 0.15s ease both' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Recategorize {selectedExpenses.length} transaction{selectedExpenses.length !== 1 ? 's' : ''}</div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 8 }}>Group</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {GROUPS.map(g => {
                  const gc = GROUP_COLORS[g]; const active = recatGroup === g
                  return (
                    <button key={g} onClick={() => { setRecatGroup(g); setRecatCat('') }} style={{
                      padding: '6px 14px', borderRadius: 20, cursor: 'pointer', fontSize: 12, fontWeight: active ? 600 : 400,
                      border: active ? `1px solid ${gc}` : '1px solid var(--border)',
                      background: active ? `${gc}22` : 'var(--surface2)', color: active ? gc : 'var(--text-dim)',
                    }}>{GROUP_LABELS[g]}</button>
                  )
                })}
              </div>
            </div>
            {recatGroup && categories.filter(c => c.group === recatGroup).length > 0 && (
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 8 }}>Sub-category (optional)</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {categories.filter(c => c.group === recatGroup).map(c => (
                    <button key={c.id} onClick={() => setRecatCat(recatCat === c.id ? '' : c.id)} style={{
                      padding: '5px 12px', borderRadius: 20, cursor: 'pointer', fontSize: 11,
                      border: recatCat === c.id ? `1px solid ${c.color}` : '1px solid var(--border)',
                      background: recatCat === c.id ? `${c.color}22` : 'var(--surface2)',
                      color: recatCat === c.id ? c.color : 'var(--text-dim)',
                    }}>{c.label}</button>
                  ))}
                </div>
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
              <button onClick={() => setShowRecat(false)} style={{ padding: '8px 18px', borderRadius: 10, border: '1px solid var(--border)', background: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
              <button onClick={bulkRecategorize} disabled={!recatGroup} style={{ padding: '8px 18px', borderRadius: 10, border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, opacity: recatGroup ? 1 : 0.5 }}>Apply</button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      <Card hover={false} style={{ padding: 0, overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ color: 'var(--text-dim)', fontSize: 13, textAlign: 'center', padding: '32px 0' }}>No transactions found</div>
        ) : (<>
          {/* Desktop table */}
          <div className="txn-table txn-scroll"><div className="txn-min-width" style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Header / bulk action bar */}
            <div style={{ display: 'grid', gridTemplateColumns: '44px 95px 110px 110px 1fr 90px 80px', gap: 12, padding: '10px 16px', borderBottom: '1px solid var(--border)', alignItems: 'center', background: selected.size > 0 ? 'var(--accent-dim)' : 'var(--surface2)', transition: 'background 0.2s' }}>
              <Checkbox checked={filtered.length > 0 && selected.size === filtered.length} indeterminate={selected.size > 0 && selected.size < filtered.length} onChange={toggleAll} />
              {selected.size > 0 ? (
                <>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', gridColumn: '2 / 6' }}>{selected.size} of {filtered.length} selected</span>
                  <div style={{ gridColumn: '6 / 8', display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    <button onClick={() => setSelected(new Set())} style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 11 }}>Deselect</button>
                    {selectedExpenses.length > 0 && (
                      <button onClick={() => setShowRecat(true)} style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid var(--accent)', background: 'var(--accent-dim)', color: 'var(--accent)', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>Recategorize</button>
                    )}
                    <button onClick={() => setConfirmDelete(true)} style={{ padding: '5px 10px', borderRadius: 8, border: 'none', background: 'var(--negative)', color: '#fff', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>Delete {selected.size}</button>
                  </div>
                </>
              ) : (
                <>
                  <button onClick={() => { if (sortCol === 'date') setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortCol('date'); setSortDir('desc') } }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 11, color: sortCol === 'date' ? 'var(--accent)' : 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'DM Sans', display: 'flex', alignItems: 'center', gap: 3 }}>Date {sortCol === 'date' ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}</button>
                  <div style={{ position: 'relative' }} onMouseDown={e => e.stopPropagation()}>
                    <button onClick={() => setOpenFilter(openFilter === 'cat' ? null : 'cat')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 11, letterSpacing: '0.06em', fontFamily: 'DM Sans', textTransform: 'uppercase', color: (filter !== 'all' || groupFilter !== 'all') ? 'var(--accent)' : 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      Category
                      {(filter !== 'all' || groupFilter !== 'all') && <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', flexShrink: 0 }} />}
                      <svg width="10" height="7" viewBox="0 0 10 7" fill="none"><path d="M1 1.5h8M2.5 3.75h5M4 6h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                    </button>
                    {openFilter === 'cat' && (
                      <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 300, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, minWidth: 160, boxShadow: '0 8px 24px rgba(0,0,0,0.35)', overflow: 'hidden', maxHeight: 300, overflowY: 'auto' }}>
                        <button onClick={() => { setFilter('all'); setGroupFilter('all'); setSubCatFilter('all'); setOpenFilter(null) }} style={{ display: 'block', width: '100%', padding: '9px 14px', background: filter === 'all' && groupFilter === 'all' ? 'var(--accent-dim)' : 'transparent', border: 'none', borderBottom: '1px solid var(--border)', textAlign: 'left', cursor: 'pointer', fontSize: 12, color: filter === 'all' && groupFilter === 'all' ? 'var(--accent)' : 'var(--text)', fontWeight: filter === 'all' && groupFilter === 'all' ? 600 : 400, fontFamily: 'DM Sans' }}>All</button>
                        {hasIncome && <button onClick={() => { setFilter('income'); setGroupFilter('all'); setSubCatFilter('all'); setOpenFilter(null) }} style={{ display: 'block', width: '100%', padding: '9px 14px', background: filter === 'income' ? 'var(--accent-dim)' : 'transparent', border: 'none', borderBottom: '1px solid var(--border)', textAlign: 'left', cursor: 'pointer', fontSize: 12, color: filter === 'income' ? 'var(--accent)' : 'var(--positive)', fontWeight: filter === 'income' ? 600 : 400, fontFamily: 'DM Sans' }}>Income</button>}
                        {usedGroups.map(g => (
                          <button key={g} onClick={() => { setFilter('expense'); setGroupFilter(g); setSubCatFilter('all'); setOpenFilter(null) }} style={{ display: 'block', width: '100%', padding: '9px 14px', background: groupFilter === g ? 'var(--accent-dim)' : 'transparent', border: 'none', borderBottom: '1px solid var(--border)', textAlign: 'left', cursor: 'pointer', fontSize: 12, color: groupFilter === g ? 'var(--accent)' : GROUP_COLORS[g], fontWeight: groupFilter === g ? 600 : 400, fontFamily: 'DM Sans' }}>{GROUP_LABELS[g]}</button>
                        ))}
                        {hasUncategorized && <button onClick={() => { setFilter('expense'); setGroupFilter('uncategorized'); setSubCatFilter('all'); setOpenFilter(null) }} style={{ display: 'block', width: '100%', padding: '9px 14px', background: groupFilter === 'uncategorized' ? 'var(--accent-dim)' : 'transparent', border: 'none', borderBottom: 'none', textAlign: 'left', cursor: 'pointer', fontSize: 12, color: groupFilter === 'uncategorized' ? 'var(--accent)' : 'var(--text-dim)', fontWeight: groupFilter === 'uncategorized' ? 600 : 400, fontFamily: 'DM Sans', fontStyle: 'italic' }}>Uncategorized</button>}
                      </div>
                    )}
                  </div>
                  <div style={{ position: 'relative' }} onMouseDown={e => e.stopPropagation()}>
                    <button onClick={() => setOpenFilter(openFilter === 'subcat' ? null : 'subcat')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 11, letterSpacing: '0.06em', fontFamily: 'DM Sans', textTransform: 'uppercase', color: subCatFilter !== 'all' ? 'var(--accent)' : 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      Sub-category
                      {subCatFilter !== 'all' && <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', flexShrink: 0 }} />}
                      <svg width="10" height="7" viewBox="0 0 10 7" fill="none"><path d="M1 1.5h8M2.5 3.75h5M4 6h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                    </button>
                    {openFilter === 'subcat' && (
                      <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 300, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, minWidth: 160, boxShadow: '0 8px 24px rgba(0,0,0,0.35)', overflow: 'hidden', maxHeight: 280, overflowY: 'auto' }}>
                        {(() => {
                          const opts = filter === 'income' ? incomeCats : groupFilter !== 'all' ? categories.filter(c => c.group === groupFilter) : categories
                          return <>
                            <button onClick={() => { setSubCatFilter('all'); setOpenFilter(null) }} style={{ display: 'block', width: '100%', padding: '9px 14px', background: subCatFilter === 'all' ? 'var(--accent-dim)' : 'transparent', border: 'none', borderBottom: '1px solid var(--border)', textAlign: 'left', cursor: 'pointer', fontSize: 12, color: subCatFilter === 'all' ? 'var(--accent)' : 'var(--text)', fontWeight: subCatFilter === 'all' ? 600 : 400, fontFamily: 'DM Sans' }}>All</button>
                            {opts.map((c, i) => (
                              <button key={c.id} onClick={() => { setSubCatFilter(c.id); setOpenFilter(null) }} style={{ display: 'block', width: '100%', padding: '9px 14px', background: subCatFilter === c.id ? 'var(--accent-dim)' : 'transparent', border: 'none', borderBottom: i < opts.length - 1 ? '1px solid var(--border)' : 'none', textAlign: 'left', cursor: 'pointer', fontSize: 12, color: subCatFilter === c.id ? 'var(--accent)' : c.color, fontWeight: subCatFilter === c.id ? 600 : 400, fontFamily: 'DM Sans' }}>{c.label}</button>
                            ))}
                          </>
                        })()}
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Description</span>
                  <button onClick={() => { if (sortCol === 'amount') setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortCol('amount'); setSortDir('desc') } }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 11, color: sortCol === 'amount' ? 'var(--accent)' : 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'DM Sans', textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3 }}>Amount {sortCol === 'amount' ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}</button>
                  <span style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'right' }}>Actions</span>
                </>
              )}
            </div>

            {monthGroups.map(g => (
              <Fragment key={g.key}>
                <div
                  onClick={() => toggleMonthCollapse(g.key)}
                  style={{ padding: '7px 16px', background: 'var(--surface2)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}
                >
                  <span style={{ fontSize: 11, color: 'var(--text-dim)', transition: 'transform 0.15s', display: 'inline-block', transform: collapsedMonths.has(g.key) ? 'rotate(-90deg)' : 'rotate(0deg)' }}>▾</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{g.label}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{g.items.length} transaction{g.items.length !== 1 ? 's' : ''}</span>
                  <span style={{ fontSize: 11, fontFamily: 'DM Mono', color: g.netTotal >= 0 ? 'var(--positive)' : 'var(--negative)', marginLeft: 'auto' }}>{g.netTotal >= 0 ? '+' : ''}{fmt(g.netTotal)}</span>
                </div>
                {!collapsedMonths.has(g.key) && g.items.map(t => {
                  const isSel = selected.has(t.id)
                  return (
                    <div key={t.id} onClick={() => toggleRow(t.id)} style={{ display: 'grid', gridTemplateColumns: '44px 95px 110px 110px 1fr 90px 80px', gap: 12, padding: '11px 16px', borderBottom: '1px solid var(--border)', borderLeft: isSel ? '3px solid var(--accent)' : '3px solid transparent', alignItems: 'center', background: isSel ? 'var(--accent-dim)' : 'transparent', transition: 'background 0.12s, border-left-color 0.12s', cursor: 'pointer' }}
                      onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = 'var(--surface3)' }}
                      onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = 'transparent' }}>
                      <Checkbox checked={isSel} onChange={() => toggleRow(t.id)} />
                      <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{fmtDate(t.date)}</div>
                      <div>
                        {t.type === 'expense' && t.group ? (
                          <div style={{ fontSize: 11, padding: '3px 8px', borderRadius: 20, background: `${GROUP_COLORS[t.group]}22`, color: GROUP_COLORS[t.group], fontWeight: 600, width: 'fit-content', whiteSpace: 'nowrap' }}>{GROUP_LABELS[t.group]}</div>
                        ) : t.type === 'income' && getCatLabel(t.category, t.type) ? (
                          <div style={{ fontSize: 11, padding: '3px 8px', borderRadius: 20, background: `${getCatColor(t.category, t.type)}22`, color: getCatColor(t.category, t.type), fontWeight: 600, width: 'fit-content', whiteSpace: 'nowrap' }}>{getCatLabel(t.category, t.type)}</div>
                        ) : <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>—</span>}
                      </div>
                      <div>
                        {t.type === 'expense' && getCatLabel(t.category, t.type) ? (
                          <div style={{ fontSize: 11, padding: '3px 8px', borderRadius: 20, background: `${getCatColor(t.category, t.type)}22`, color: getCatColor(t.category, t.type), fontWeight: 600, width: 'fit-content', whiteSpace: 'nowrap' }}>{getCatLabel(t.category, t.type)}</div>
                        ) : <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>—</span>}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                          <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 10, fontWeight: 700, flexShrink: 0, background: t.type === 'income' ? '#1a3a2a' : '#3a1a1a', color: t.type === 'income' ? 'var(--positive)' : 'var(--negative)' }}>{t.type === 'income' ? 'IN' : 'OUT'}</span>
                          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.description}</div>
                        </div>
                        {t.notes && <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.notes}</div>}
                        {t.tags?.length ? <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 1 }}>{t.tags.map(tg => `#${tg}`).join(' ')}</div> : null}
                      </div>
                      <div style={{ textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                        {editingAmountId === t.id ? (
                          <input autoFocus type="number" min="0" step="0.01" value={editingAmountVal} onChange={e => setEditingAmountVal(e.target.value)}
                            onBlur={() => { const v = parseFloat(editingAmountVal); if (v > 0) editTxn({ ...t, amount: v }); setEditingAmountId(null) }}
                            onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') setEditingAmountId(null) }}
                            style={{ width: 80, padding: '3px 6px', borderRadius: 6, border: '1px solid var(--accent)', background: 'var(--surface2)', color: 'var(--text)', fontSize: 12, fontFamily: 'DM Mono', textAlign: 'right', outline: 'none' }} />
                        ) : (
                          <div title="Click to edit amount" onClick={() => { setEditingAmountId(t.id); setEditingAmountVal(String(t.amount)) }}
                            style={{ fontSize: 13, fontWeight: 600, fontFamily: 'DM Mono', color: t.type === 'income' ? 'var(--positive)' : 'var(--negative)', cursor: 'text', display: 'inline-block', padding: '2px 4px', borderRadius: 4 }}>
                            {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => openEdit(t)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', padding: '3px 6px', borderRadius: 6, display: 'flex' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                        <button onClick={() => deleteTxn(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--negative)', padding: '3px 6px', borderRadius: 6, display: 'flex' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
                      </div>
                    </div>
                  )
                })}
              </Fragment>
            ))}
            {hasMore && (
              <div style={{ padding: '14px 16px', textAlign: 'center', borderTop: '1px solid var(--border)' }}>
                <button onClick={() => setPage(p => p + 1)} style={{ padding: '8px 24px', borderRadius: 20, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 13 }}>
                  Load more ({filtered.length - paged.length} remaining)
                </button>
              </div>
            )}
          </div></div>

          {/* Mobile card list */}
          <div className="txn-cards" style={{ gap: 0 }}>
            {monthGroups.map(g => (
              <Fragment key={g.key}>
                <div
                  onClick={() => toggleMonthCollapse(g.key)}
                  style={{ padding: '8px 14px', background: 'var(--surface2)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-dim)', transition: 'transform 0.15s', display: 'inline-block', transform: collapsedMonths.has(g.key) ? 'rotate(-90deg)' : 'rotate(0deg)' }}>▾</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{g.label}</span>
                  </div>
                  <span style={{ fontSize: 11, fontFamily: 'DM Mono', color: g.netTotal >= 0 ? 'var(--positive)' : 'var(--negative)' }}>{g.netTotal >= 0 ? '+' : ''}{fmt(g.netTotal)}</span>
                </div>
                {!collapsedMonths.has(g.key) && g.items.map(t => {
                  const catColor = getCatColor(t.category, t.type)
                  const catLabel = getCatLabel(t.category, t.type)
                  return (
                    <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderBottom: '1px solid var(--border)' }}
                      onClick={() => openEdit(t)}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: `${catColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1.5px solid ${catColor}40` }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: catColor, display: 'inline-block' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.description}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
                          {fmtDate(t.date)}{catLabel ? ` · ${catLabel}` : ''}
                        </div>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'DM Mono', color: t.type === 'income' ? 'var(--positive)' : 'var(--negative)', flexShrink: 0 }}>
                        {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                      </div>
                    </div>
                  )
                })}
              </Fragment>
            ))}
            {hasMore && (
              <div style={{ padding: '14px', textAlign: 'center' }}>
                <button onClick={() => setPage(p => p + 1)} style={{ padding: '8px 24px', borderRadius: 20, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 13 }}>
                  Load more ({filtered.length - paged.length} remaining)
                </button>
              </div>
            )}
          </div>
        </>)}
      </Card>

      {gpayOpen && <GooglePayImportModal onClose={() => setGpayOpen(false)} />}

      {/* Import toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--surface)', border: `1px solid ${toast.ok ? 'var(--positive)' : 'var(--negative)'}`,
          borderRadius: 12, padding: '12px 18px', display: 'flex', alignItems: 'center',
          gap: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', zIndex: 2000,
          animation: 'slideUp 0.2s ease both', maxWidth: 420,
        }}>
          <span style={{ color: toast.ok ? 'var(--positive)' : 'var(--negative)', display: 'flex', flexShrink: 0 }}>
            {toast.ok
              ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            }
          </span>
          <span style={{ fontSize: 13, color: 'var(--text)', flex: 1, lineHeight: 1.4 }}>{toast.msg}</span>
          <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', fontSize: 16, padding: '0 2px', flexShrink: 0 }}>×</button>
        </div>
      )}
    </div>
  )
}

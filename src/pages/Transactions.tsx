import { useState, useRef, useEffect } from 'react'
import { useFinanceContext } from '../hooks/FinanceContext'
import { useSearchParams } from 'react-router-dom'
import { fmt } from '../lib/format'
import { EXPENSE_CATS, INCOME_CATS } from '../constants/categories'
import Card from '../components/ui/Card'
import GooglePayImportModal from '../components/modals/GooglePayImportModal'

type Filter = 'all' | 'income' | 'expense'

export default function Transactions() {
  const { txns, deleteTxn, deleteTxns, openAdd, openEdit, addTxn } = useFinanceContext()
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('q') ?? '')
  const [filter, setFilter] = useState<Filter>('all')
  const [gpayOpen, setGpayOpen] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    const q = searchParams.get('q')
    if (q) setSearch(q)
  }, [searchParams])

  useEffect(() => { setSelected(new Set()) }, [search, filter])
  const fileRef = useRef<HTMLInputElement>(null)

  const allCats = [...EXPENSE_CATS, ...INCOME_CATS]
  const getCatLabel = (id: string) => allCats.find(c => c.id === id)?.label ?? id
  const getCatColor = (id: string) => allCats.find(c => c.id === id)?.color ?? '#888'

  const filtered = txns
    .filter(t => filter === 'all' || t.type === filter)
    .filter(t => {
      const q = search.toLowerCase()
      return !q || t.description.toLowerCase().includes(q) || getCatLabel(t.category).toLowerCase().includes(q)
    })
    .sort((a, b) => b.date.localeCompare(a.date))

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
    deleteTxns([...selected])
    setSelected(new Set())
    setConfirmDelete(false)
  }

  function exportCSV() {
    const headers = ['Date', 'Description', 'Category', 'Type', 'Amount', 'Notes', 'Tags']
    const rows = filtered.map(t => [
      t.date, t.description, t.category, t.type, t.amount,
      t.notes ?? '', (t.tags ?? []).join(';')
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = 'transactions.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  function importCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const text = ev.target?.result as string
      const lines = text.trim().split('\n').slice(1)
      lines.forEach(line => {
        const cols = line.split(',').map(c => c.replace(/^"|"$/g, '').replace(/""/g, '"'))
        const [date, description, category, type, amount] = cols
        if (date && description && category && type && amount) {
          addTxn({ date, description, category, type: type as 'expense' | 'income', amount: parseFloat(amount) || 0 })
        }
      })
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const btnStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 16px', borderRadius: 20,
    border: active ? '1px solid var(--accent)' : '1px solid var(--border)',
    background: active ? 'var(--accent-dim)' : 'transparent',
    color: active ? 'var(--accent)' : 'var(--text-dim)',
    cursor: 'pointer', fontSize: 13, fontWeight: active ? 600 : 400, transition: 'all 0.15s',
  })

  return (
    <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        {[
          { label: 'Total In',  value: fmt(totalIn),  color: 'var(--positive)' },
          { label: 'Total Out', value: fmt(totalOut), color: 'var(--negative)' },
          { label: 'Net',       value: fmt(net),       color: net >= 0 ? 'var(--positive)' : 'var(--negative)' },
        ].map((s, i) => (
          <Card key={i} delay={i * 0.05}>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'DM Mono', color: s.color }}>{s.value}</div>
          </Card>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search transactions…"
          style={{ flex: 1, minWidth: 180, padding: '8px 14px', borderRadius: 20, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: 13, fontFamily: 'DM Sans', outline: 'none' }}
        />
        <div style={{ display: 'flex', gap: 6 }}>
          <button style={btnStyle(filter === 'all')}     onClick={() => setFilter('all')}>All</button>
          <button style={btnStyle(filter === 'income')}  onClick={() => setFilter('income')}>Income</button>
          <button style={btnStyle(filter === 'expense')} onClick={() => setFilter('expense')}>Expense</button>
        </div>
        <button onClick={exportCSV} style={{ padding: '7px 14px', borderRadius: 20, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 12 }}>↓ Export</button>
        <button onClick={() => fileRef.current?.click()} style={{ padding: '7px 14px', borderRadius: 20, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 12 }}>↑ Import CSV</button>
        <input ref={fileRef} type="file" accept=".csv" onChange={importCSV} style={{ display: 'none' }} />
        <button onClick={() => setGpayOpen(true)} style={{ padding: '7px 14px', borderRadius: 20, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontWeight: 700, color: '#4285f4', fontSize: 13 }}>G</span> GPay Import
        </button>
        <button onClick={openAdd} style={{ padding: '7px 14px', borderRadius: 20, border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>+ Add</button>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: 'var(--accent-dim)', border: '1px solid var(--accent)', borderRadius: 12, animation: 'slideUp 0.15s ease both' }}>
          <span style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600, flex: 1 }}>
            {selected.size} selected
          </span>
          <button
            onClick={() => setSelected(new Set())}
            style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 12 }}
          >
            Deselect all
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: 'var(--negative)', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
          >
            Delete {selected.size}
          </button>
        </div>
      )}

      {/* Confirm delete dialog */}
      {confirmDelete && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setConfirmDelete(false)}
        >
          <div
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: 28, width: 360, display: 'flex', flexDirection: 'column', gap: 16, animation: 'scaleIn 0.15s ease both' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Delete {selected.size} transactions?</div>
            <div style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.5 }}>This cannot be undone. All selected transactions will be permanently removed.</div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmDelete(false)} style={{ padding: '9px 20px', borderRadius: 10, border: '1px solid var(--border)', background: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
              <button onClick={bulkDelete} style={{ padding: '9px 20px', borderRadius: 10, border: 'none', background: 'var(--negative)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      <Card hover={false}>
        {filtered.length === 0 ? (
          <div style={{ color: 'var(--text-dim)', fontSize: 13, textAlign: 'center', padding: '32px 0' }}>No transactions found</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 120px 100px 90px 80px', gap: 12, padding: '8px 12px', borderBottom: '1px solid var(--border)', fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={filtered.length > 0 && selected.size === filtered.length}
                ref={el => { if (el) el.indeterminate = selected.size > 0 && selected.size < filtered.length }}
                onChange={toggleAll}
                style={{ cursor: 'pointer', accentColor: 'var(--accent)', width: 14, height: 14 }}
              />
              <span>Description</span><span>Category</span><span>Date</span><span style={{ textAlign: 'right' }}>Amount</span><span style={{ textAlign: 'right' }}>Actions</span>
            </div>
            {filtered.map(t => (
              <div
                key={t.id}
                style={{ display: 'grid', gridTemplateColumns: '32px 1fr 120px 100px 90px 80px', gap: 12, padding: '10px 12px', borderBottom: '1px solid var(--border)', alignItems: 'center', background: selected.has(t.id) ? 'var(--accent-dim)' : 'transparent', transition: 'background 0.1s' }}
                onMouseEnter={e => { if (!selected.has(t.id)) e.currentTarget.style.background = 'var(--surface3)' }}
                onMouseLeave={e => { if (!selected.has(t.id)) e.currentTarget.style.background = 'transparent' }}
              >
                <input
                  type="checkbox"
                  checked={selected.has(t.id)}
                  onChange={() => toggleRow(t.id)}
                  style={{ cursor: 'pointer', accentColor: 'var(--accent)', width: 14, height: 14 }}
                />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.description}</div>
                  {t.tags?.length ? <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{t.tags.join(' · ')}</div> : null}
                </div>
                <div style={{ fontSize: 11, padding: '3px 8px', borderRadius: 20, background: `${getCatColor(t.category)}22`, color: getCatColor(t.category), fontWeight: 600, width: 'fit-content', whiteSpace: 'nowrap' }}>
                  {getCatLabel(t.category)}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{t.date}</div>
                <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'DM Mono', color: t.type === 'income' ? 'var(--positive)' : 'var(--negative)', textAlign: 'right' }}>
                  {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                </div>
                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                  <button onClick={() => openEdit(t)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', fontSize: 13, padding: '2px 6px' }}>✎</button>
                  <button onClick={() => deleteTxn(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--negative)', fontSize: 13, padding: '2px 6px' }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {gpayOpen && <GooglePayImportModal onClose={() => setGpayOpen(false)} />}
    </div>
  )
}

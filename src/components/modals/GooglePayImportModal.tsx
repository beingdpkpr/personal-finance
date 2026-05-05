import { useState, useRef } from 'react'
import { useFinanceContext } from '../../hooks/FinanceContext'
import { parseGooglePayFile, deduplicateRows, ParsedRow } from '../../lib/gpay-parser'
import { parseGooglePayPDF } from '../../lib/gpay-pdf-parser'

interface Props { onClose: () => void }

type Step = 'upload' | 'preview' | 'done'


export default function GooglePayImportModal({ onClose }: Props) {
  const { txns, addTxn, expenseCats, incomeCats } = useFinanceContext()
  const [step, setStep]       = useState<Step>('upload')
  const [rows, setRows]       = useState<ParsedRow[]>([])
  const [skipped, setSkipped] = useState(0)
  const [dupes, setDupes]     = useState(0)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [imported, setImported] = useState(0)
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const inputStyle: React.CSSProperties = {
    padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)',
    background: 'var(--surface2)', color: 'var(--text)', fontSize: 12,
    fontFamily: 'DM Sans', outline: 'none', width: '100%',
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(''); setLoading(true)
    try {
      const isPDF = file.name.toLowerCase().endsWith('.pdf')
      const { rows: parsed, skipped: sk } = isPDF
        ? await parseGooglePayPDF(file)
        : await new Promise<{ rows: ParsedRow[]; skipped: number }>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = ev => {
              try { resolve(parseGooglePayFile(ev.target?.result as string)) }
              catch (err) { reject(err) }
            }
            reader.readAsText(file)
          })

      if (parsed.length === 0) {
        setError('No valid transactions found. Check the file format and try again.')
        setLoading(false); return
      }

      const existingTxnIds = txns.map(t => t.tags ?? [])
      const unique = deduplicateRows(parsed, existingTxnIds)
      setRows(unique)
      setSkipped(sk)
      setDupes(parsed.length - unique.length)
      setSelected(new Set(unique.map((_, i) => i)))
      setStep('preview')
    } catch {
      setError('Failed to parse file. Please check the format.')
    }
    setLoading(false)
    e.target.value = ''
  }

  function updateRow(idx: number, patch: Partial<ParsedRow>) {
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, ...patch } : r))
  }

  function toggleAll() {
    setSelected(prev => prev.size === rows.length ? new Set() : new Set(rows.map((_, i) => i)))
  }

  function doImport() {
    let count = 0
    rows.forEach((r, i) => {
      if (!selected.has(i)) return
      addTxn({
        date: r.date,
        description: r.description,
        amount: r.amount,
        type: r.type,
        category: r.category,
        tags: [r.txnId],  // store txnId as tag for future dedup
      })
      count++
    })
    setImported(count)
    setStep('done')
  }

  const expCatOptions = expenseCats.map(c => <option key={c.id} value={c.id}>{c.label}</option>)
  const incCatOptions = incomeCats.map(c => <option key={c.id} value={c.id}>{c.label}</option>)

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={step !== 'preview' ? onClose : undefined}
    >
      <div
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 22, width: '100%', maxWidth: step === 'preview' ? 860 : 480, maxHeight: '90vh', display: 'flex', flexDirection: 'column', animation: 'scaleIn 0.2s ease both' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>G</span> Google Pay Import
            </div>
            {step === 'preview' && (
              <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>
                {rows.length} transactions · {skipped} skipped (failed/pending) · {dupes} duplicates removed
              </div>
            )}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', fontSize: 20, lineHeight: 1 }}>×</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>

          {/* ── STEP: UPLOAD ── */}
          {step === 'upload' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 14, padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>How to export from Google Pay</div>
                {[
                  ['PDF', 'Open Google Pay → Transactions → See all → menu → Get statements'],
                  ['CSV', 'Google Takeout → google.com/takeout → select Google Pay → Export'],
                  ['Bank', 'Download UPI statement from your bank app or net banking'],
                ].map(([n, t]) => (
                  <div key={n} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ width: 20, height: 20, borderRadius: 10, background: 'var(--accent-dim)', color: 'var(--accent)', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{n}</span>
                    <span style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.5 }}>{t}</span>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: 12, color: 'var(--text-dim)', background: 'var(--surface2)', borderRadius: 10, padding: '10px 14px', border: '1px solid var(--border)' }}>
                Also works with <strong style={{ color: 'var(--text)' }}>bank statement CSVs</strong> — HDFC, ICICI, SBI, Axis, Kotak, and most UPI statement exports.
              </div>

              {error && <div style={{ fontSize: 13, color: 'var(--negative)', background: 'var(--negative-dim)', borderRadius: 8, padding: '10px 14px' }}>{error}</div>}

              <button
                onClick={() => fileRef.current?.click()}
                disabled={loading}
                style={{ padding: '14px', borderRadius: 14, border: '2px dashed var(--accent)', background: 'var(--accent-dim)', color: 'var(--accent)', cursor: loading ? 'wait' : 'pointer', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loading ? 0.7 : 1 }}
              >
                <span style={{ display:'flex' }}>{loading ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 8 12 16"/><polyline points="8 12 12 8 16 12"/></svg> : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>}</span>
                {loading ? 'Reading file…' : 'Choose PDF or CSV file'}
              </button>
              <input ref={fileRef} type="file" accept=".csv,.tsv,.txt,.pdf" onChange={handleFile} style={{ display: 'none' }} />
            </div>
          )}

          {/* ── STEP: PREVIEW ── */}
          {step === 'preview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {rows.length === 0 ? (
                <div style={{ color: 'var(--text-dim)', fontSize: 14, textAlign: 'center', padding: '32px 0' }}>
                  All transactions already imported (no new entries found).
                </div>
              ) : (
                <>
                  {/* Table */}
                  <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                    {/* Table header */}
                    <div style={{ display: 'grid', gridTemplateColumns: '32px 100px 1fr 110px 80px 80px', gap: 8, padding: '10px 14px', background: 'var(--surface2)', borderBottom: '1px solid var(--border)', fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', alignItems: 'center' }}>
                      <input type="checkbox" checked={selected.size === rows.length} onChange={toggleAll} style={{ cursor: 'pointer', accentColor: 'var(--accent)' }} />
                      <span>Date</span><span>Description</span><span>Category</span>
                      <span style={{ textAlign: 'right' }}>Amount</span><span style={{ textAlign: 'right' }}>Type</span>
                    </div>

                    <div style={{ maxHeight: 420, overflowY: 'auto' }}>
                      {rows.map((r, i) => (
                        <div
                          key={i}
                          style={{ display: 'grid', gridTemplateColumns: '32px 100px 1fr 110px 80px 80px', gap: 8, padding: '9px 14px', borderBottom: '1px solid var(--border)', alignItems: 'center', background: selected.has(i) ? 'transparent' : 'var(--surface2)', opacity: selected.has(i) ? 1 : 0.45, transition: 'all 0.15s' }}
                        >
                          <input type="checkbox" checked={selected.has(i)} onChange={() => setSelected(prev => { const s = new Set(prev); s.has(i) ? s.delete(i) : s.add(i); return s })} style={{ cursor: 'pointer', accentColor: 'var(--accent)' }} />
                          <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{r.date}</span>
                          <div style={{ minWidth: 0 }}>
                            <input
                              value={r.description}
                              onChange={e => updateRow(i, { description: e.target.value })}
                              style={{ ...inputStyle, background: 'transparent', border: '1px solid transparent', padding: '3px 6px' }}
                              onFocus={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                              onBlur={e  => (e.currentTarget.style.borderColor = 'transparent')}
                            />
                          </div>
                          <select
                            value={r.category}
                            onChange={e => updateRow(i, { category: e.target.value })}
                            style={{ ...inputStyle, fontSize: 11, padding: '4px 6px' }}
                          >
                            <optgroup label="Expenses">{expCatOptions}</optgroup>
                            <optgroup label="Income">{incCatOptions}</optgroup>
                          </select>
                          <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'DM Mono', color: r.type === 'income' ? 'var(--positive)' : 'var(--negative)', textAlign: 'right' }}>
                            {r.type === 'income' ? '+' : '-'}₹{r.amount.toLocaleString('en-IN')}
                          </div>
                          <select
                            value={r.type}
                            onChange={e => updateRow(i, { type: e.target.value as 'expense' | 'income' })}
                            style={{ ...inputStyle, fontSize: 11, padding: '4px 6px', color: r.type === 'income' ? 'var(--positive)' : 'var(--negative)' }}
                          >
                            <option value="expense">Expense</option>
                            <option value="income">Income</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                    <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{selected.size}</span> of {rows.length} selected · Click description to edit · Change category/type per row
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── STEP: DONE ── */}
          {step === 'done' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '16px 0' }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--positive-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="oklch(0.68 0.18 145)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>Import complete</div>
              <div style={{ fontSize: 14, color: 'var(--text-dim)', textAlign: 'center', lineHeight: 1.6 }}>
                <span style={{ color: 'var(--positive)', fontWeight: 700, fontSize: 22, display: 'block', fontFamily: 'DM Mono' }}>{imported}</span>
                transactions added successfully
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 'preview' && rows.length > 0 && (
          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, justifyContent: 'flex-end', flexShrink: 0 }}>
            <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid var(--border)', background: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
            <button onClick={doImport} disabled={selected.size === 0} style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: 'var(--accent)', color: '#fff', cursor: selected.size === 0 ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, opacity: selected.size === 0 ? 0.5 : 1 }}>
              Import {selected.size} transactions
            </button>
          </div>
        )}
        {step === 'done' && (
          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
            <button onClick={onClose} style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Done</button>
          </div>
        )}
      </div>
    </div>
  )
}

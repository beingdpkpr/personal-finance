export interface ParsedRow {
  date: string;           // YYYY-MM-DD
  description: string;
  amount: number;
  type: 'expense' | 'income';
  txnId: string;          // for dedup
  category: string;       // auto-detected
}

/* ── Date parsing ── */
function parseDate(raw: string): string {
  raw = raw.trim().replace(/['"]/g, '')

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10)

  // DD/MM/YYYY or MM/DD/YYYY
  const slash = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/)
  if (slash) {
    const [, a, b, y] = slash
    const year = y.length === 2 ? '20' + y : y
    // assume DD/MM for Indian format
    return `${year}-${b.padStart(2, '0')}-${a.padStart(2, '0')}`
  }

  // "Jan 15, 2024" or "15 Jan 2024" or "Jan 15, 2024, 7:30 PM IST"
  const months: Record<string, string> = {
    jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',
    jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12',
  }
  const mdy = raw.match(/([A-Za-z]{3})\s+(\d{1,2}),?\s+(\d{4})/)
  if (mdy) {
    const [, m, d, y] = mdy
    return `${y}-${months[m.toLowerCase()]}-${d.padStart(2, '0')}`
  }
  const dmy = raw.match(/(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})/)
  if (dmy) {
    const [, d, m, y] = dmy
    return `${y}-${months[m.toLowerCase()]}-${d.padStart(2, '0')}`
  }

  // fallback: today
  return new Date().toISOString().slice(0, 10)
}

/* ── Amount parsing ── */
function parseAmount(raw: string): { amount: number; type: 'expense' | 'income' } {
  const s = raw.trim().replace(/['"₹$,\s]/g, '').toLowerCase()
  const isCr = s.endsWith('cr') || raw.toLowerCase().includes('credit')
  const isDr = s.endsWith('dr') || raw.toLowerCase().includes('debit')
  const num = parseFloat(s.replace(/[a-z]/g, '')) || 0
  const isNeg = num < 0
  const amount = Math.abs(num)
  const type: 'expense' | 'income' = isCr ? 'income' : isDr ? 'expense' : isNeg ? 'income' : 'expense'
  return { amount, type }
}

/* ── Keyword → category auto-detection ── */
const CAT_KEYWORDS: [string, string][] = [
  // food
  ['swiggy|zomato|dunzo|blinkit|bigbasket|grofer|domino|pizza|burger|cafe|restaurant|canteen|hotel|dhaba|biryani|chai|tea|coffee|starbucks|mcdonald|kfc|subway', 'food'],
  // transport
  ['ola|uber|rapido|metro|irctc|redbus|airline|flight|indigo|air india|spicejet|vistara|railway|train|auto|rickshaw|petrol|fuel|parking|fastag|toll', 'transport'],
  // shopping
  ['amazon|flipkart|myntra|meesho|ajio|nykaa|reliance|dmart|bigbazar|shoppers|lifestyle|westside|zara|h&m|ikea|decathlon', 'shopping'],
  // entertainment
  ['netflix|hotstar|prime|spotify|youtube|bookmyshow|pvr|inox|disney|zee|sony|jio cinema|apple|google play|steam|gaming', 'entertainment'],
  // health
  ['hospital|clinic|doctor|pharmacy|medical|chemist|lab|diagnostic|apollo|fortis|medplus|netmeds|1mg|practo|health', 'health'],
  // essentials
  ['electricity|water|gas|mobile|broadband|internet|dth|tata|airtel|jio|vodafone|bsnl|lpg|insurance|lic|emi|loan|rent|society|maintenance', 'essentials'],
  // family
  ['school|college|tuition|coaching|education|fees|childcare|daycare|toys|kids|family', 'family'],
  // savings
  ['mutual fund|sip|zerodha|groww|upstox|smallcase|nps|ppf|fd|fixed deposit|gold|investment|savings|hdfc securities|icici direct', 'savings'],
  // income
  ['salary|payroll|stipend|freelance|refund|cashback|reward|bonus|dividend|interest|credited by', 'salary'],
]

function detectCategory(desc: string): string {
  const d = desc.toLowerCase()
  for (const [pattern, cat] of CAT_KEYWORDS) {
    if (new RegExp(pattern).test(d)) return cat
  }
  return 'other'
}

/* ── CSV line splitter (handles quoted fields) ── */
function splitCSVLine(line: string): string[] {
  const cols: string[] = []
  let cur = '', inQ = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; continue }
    if (c === '"') { inQ = !inQ; continue }
    if (c === ',' && !inQ) { cols.push(cur.trim()); cur = ''; continue }
    cur += c
  }
  cols.push(cur.trim())
  return cols
}

/* ── Column index detection ── */
function findCol(headers: string[], ...keywords: string[]): number {
  return headers.findIndex(h =>
    keywords.some(k => h.toLowerCase().includes(k))
  )
}

/* ── Main parser ── */
export function parseGooglePayFile(text: string): { rows: ParsedRow[]; skipped: number } {
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) return { rows: [], skipped: 0 }

  const headers = splitCSVLine(lines[0]).map(h => h.replace(/['"]/g, '').trim())

  const dateCol   = findCol(headers, 'date', 'time', 'transaction date')
  const descCol   = findCol(headers, 'description', 'narration', 'particulars', 'remarks', 'merchant', 'title', 'details')
  const amtCol    = findCol(headers, 'amount', 'inr', 'transaction amount', 'debit', 'credit', 'withdrawal', 'deposit')
  const typeCol   = findCol(headers, 'type', 'dr/cr', 'transaction type', 'debit/credit')
  const idCol     = findCol(headers, 'transaction id', 'ref', 'utr', 'txn id', 'id', 'reference')
  const statusCol = findCol(headers, 'status', 'payment status', 'state')

  const rows: ParsedRow[] = []
  let skipped = 0

  for (let i = 1; i < lines.length; i++) {
    const cols = splitCSVLine(lines[i])
    if (cols.every(c => !c)) continue

    // Skip failed/pending transactions
    if (statusCol >= 0) {
      const status = (cols[statusCol] ?? '').toLowerCase()
      if (status && !status.includes('complet') && !status.includes('success') && !status.includes('credit') && !status.includes('debit')) {
        skipped++; continue
      }
    }

    const rawDate = cols[dateCol >= 0 ? dateCol : 0] ?? ''
    const rawDesc = cols[descCol >= 0 ? descCol : 1] ?? ''
    const rawAmt  = cols[amtCol  >= 0 ? amtCol  : 2] ?? ''
    const rawType = cols[typeCol >= 0 ? typeCol : -1] ?? ''
    const rawId   = cols[idCol   >= 0 ? idCol   : -1] ?? ''

    if (!rawDate || !rawAmt) { skipped++; continue }

    const date = parseDate(rawDate)
    const description = rawDesc.replace(/['"]/g, '').trim() || 'Unknown'
    let { amount, type } = parseAmount(rawAmt)

    // Override type from explicit type column
    if (rawType) {
      const t = rawType.toLowerCase()
      if (t.includes('cr') || t.includes('credit') || t.includes('received')) type = 'income'
      else if (t.includes('dr') || t.includes('debit') || t.includes('paid') || t.includes('sent')) type = 'expense'
    }
    // Override from description keywords
    const descLower = description.toLowerCase()
    if (descLower.includes('received') || descLower.includes('refund') || descLower.includes('cashback')) type = 'income'

    // Auto-detect category; income gets 'salary' or 'other' income cat
    let category = detectCategory(description)
    if (type === 'income' && category !== 'savings') {
      category = category === 'salary' ? 'salary' : 'other'
    }

    const txnId = rawId.replace(/['"]/g, '').trim() || `${date}-${description}-${amount}`

    rows.push({ date, description, amount, type, txnId, category })
  }

  return { rows, skipped }
}

/* ── Deduplication against existing txns ── */
export function deduplicateRows(rows: ParsedRow[], existingTags: string[][]): ParsedRow[] {
  const existingIds = new Set(existingTags.flat())
  return rows.filter(r => !existingIds.has(r.txnId))
}

import type { ParsedRow } from './gpay-parser'

let _pdfjs: typeof import('pdfjs-dist') | null = null
async function getPdfjs() {
  if (!_pdfjs) {
    const [lib, workerUrl] = await Promise.all([
      import('pdfjs-dist'),
      import('pdfjs-dist/build/pdf.worker.min.mjs?url').then(m => m.default),
    ])
    lib.GlobalWorkerOptions.workerSrc = workerUrl
    _pdfjs = lib
  }
  return _pdfjs
}

/*
 * Google Pay PDF statement format (confirmed from real statement):
 *
 * Each transaction = 3 consecutive Y-lines:
 *   Line A (date/details/amount):  "02 Apr, 2026  Paid to DURGESH SINGH  ₹30"
 *   Line B (time/UPI ID):          "07:10 PM  UPI Transaction ID: 645837984628"
 *   Line C (bank info):            "Paid by ICICI Bank 3732"
 *
 * Income entries say "Received from NAME", expenses say "Paid to NAME".
 * Amount is always ₹-prefixed on Line A. UPI ID is always on Line B.
 *
 * The PDF items are grouped by Y coordinate. Items on the same Y row are
 * sorted by X position (left→right), so Line A naturally reads as:
 * "DD Mon, YYYY  Paid to/Received from NAME  ₹AMOUNT"
 */

interface PdfRow {
  items: { x: number; str: string }[]
}

async function extractRows(file: File): Promise<PdfRow[][]> {
  const pdfjsLib = await getPdfjs()
  const buffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
  const allPages: PdfRow[][] = []

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p)
    const content = await page.getTextContent()

    // Group items by Y position
    const byY: Record<number, { x: number; str: string }[]> = {}
    for (const item of content.items) {
      if (!('str' in item) || !(item as { str: string }).str.trim()) continue
      const y = Math.round((item as { transform: number[] }).transform[5])
      const x = Math.round((item as { transform: number[] }).transform[4])
      if (!byY[y]) byY[y] = []
      byY[y].push({ x, str: (item as { str: string }).str })
    }

    // Sort Y descending (top→bottom), sort items within each row by X (left→right)
    const rows: PdfRow[] = Object.keys(byY)
      .map(Number)
      .sort((a, b) => b - a)
      .map(y => ({ items: byY[y].sort((a, b) => a.x - b.x) }))

    allPages.push(rows)
  }

  return allPages
}

function rowText(row: PdfRow): string {
  return row.items.map(i => i.str).join(' ').trim()
}

/* ── Date parsing — handles "02 Apr, 2026" and "15 Jan 2024" ── */
const MONTHS: Record<string, string> = {
  jan:'01', feb:'02', mar:'03', apr:'04', may:'05', jun:'06',
  jul:'07', aug:'08', sep:'09', oct:'10', nov:'11', dec:'12',
}

function parseDate(raw: string): string | null {
  // "02 Apr, 2026" or "15 Jan 2024" — 3-letter month only (avoids matching "01 April 2026" header)
  const dmy = raw.match(/(\d{1,2})\s+([A-Za-z]{3}),?\s+(\d{4})/)
  if (dmy) {
    const mon = MONTHS[dmy[2].toLowerCase()]
    if (mon) return `${dmy[3]}-${mon}-${dmy[1].padStart(2, '0')}`
  }
  return null
}

/* ── Keyword → category ── */
const CAT_MAP: [RegExp, string][] = [
  [/swiggy|zomato|dunzo|blinkit|bigbasket|grofer|domino|pizza|burger|restaurant|cafe|food|chai|coffee|starbucks|mcdonald|kfc|subway|biryani|chicken|bakery|dhaba|canteen|mellow|foodies|fresh cut/i, 'food'],
  [/ola|uber|rapido|metro|irctc|redbus|airline|flight|indigo|spicejet|railway|train|auto|petrol|fuel|fastag|toll|playo|sports|wellness/i, 'transport'],
  [/amazon|flipkart|myntra|meesho|ajio|nykaa|dmart|reliance|shoppers|lifestyle|zara|h&m|decathlon|nexus|retail/i, 'shopping'],
  [/netflix|hotstar|prime|spotify|youtube|bookmyshow|pvr|inox|disney|google play|steam|gaming|cinepolis/i, 'entertainment'],
  [/hospital|clinic|doctor|pharmacy|medical|chemist|lab|diagnostic|apollo|medplus|1mg|practo|health/i, 'health'],
  [/electricity|water|gas|mobile|broadband|internet|dth|airtel|jio|vodafone|bsnl|lpg|insurance|lic|emi|loan|rent|maintenance|smartq/i, 'essentials'],
  [/school|college|tuition|education|fees|coaching|childcare|kids|family/i, 'family'],
  [/mutual fund|sip|zerodha|groww|upstox|nps|ppf|fixed deposit|investment|savings/i, 'savings'],
  [/salary|payroll|stipend|freelance|bonus|dividend|interest/i, 'salary'],
]

function detectCategory(desc: string, type: 'expense' | 'income'): string {
  for (const [re, cat] of CAT_MAP) {
    if (re.test(desc)) return cat
  }
  return type === 'income' ? 'other' : 'other'
}

/* ── Main PDF parser ── */
export async function parseGooglePayPDF(file: File): Promise<{ rows: ParsedRow[]; skipped: number }> {
  const pages = await extractRows(file)
  const rows: ParsedRow[] = []
  let skipped = 0

  for (const pageRows of pages) {
    let i = 0
    while (i < pageRows.length) {
      const lineA = rowText(pageRows[i])

      // Line A must contain a date AND a ₹ amount AND "Paid to" or "Received from"
      const date = parseDate(lineA)
      if (!date) { i++; continue }

      // Must have a ₹ amount on this line
      const amtOnLineA = lineA.match(/₹\s*([\d,]+(?:\.\d{2})?)/)
      if (!amtOnLineA) { i++; continue }

      // Must describe a payment or receipt
      const txnMatch = lineA.match(/(?:Paid to|Received from)\s+(.+?)\s*₹/i)
      if (!txnMatch) { i++; continue }

      const amount = parseFloat(amtOnLineA[1].replace(/,/g, ''))
      if (!amount || amount <= 0) { skipped++; i++; continue }

      const isIncome = /Received from/i.test(lineA)
      const type: 'expense' | 'income' = isIncome ? 'income' : 'expense'
      const desc = txnMatch[1].trim()

      // Look at next lines for UPI Transaction ID (Line B)
      let txnId = `${date}-${desc}-${amount}`
      for (let k = i + 1; k < pageRows.length && k <= i + 3; k++) {
        const lineK = rowText(pageRows[k])
        const upiMatch = lineK.match(/UPI Transaction ID:\s*(\d+)/i)
        if (upiMatch) { txnId = upiMatch[1]; break }
        // Stop if we hit the next transaction date
        if (parseDate(lineK) && /(?:Paid to|Received from)/i.test(lineK)) break
      }

      const category = detectCategory(desc, type)
      rows.push({ date, description: desc, amount, type, txnId, category })
      i++
    }
  }

  return { rows, skipped }
}

# DKP Finance — Personal Finance Tracker

A privacy-first personal finance web app built with React + TypeScript. All your data lives in your own Google Drive — the app has no backend server.

**[Privacy Policy](https://beingdpkpr.github.io/aryas-finance/privacy) · [Terms of Service](https://beingdpkpr.github.io/aryas-finance/terms)**

---

## Features

### Dashboard
Monthly income/expense summary, savings rate, top spending categories, recent transactions, and a savings trend indicator (compares last 3 months vs prior 3 months).

### Transactions
Full ledger with search, date range filter, month picker, bulk delete, CSV import/export, and GPay PDF import. Account-linked transactions (withdrawals reduce account balance; savings deposits increase it).

### Budget
Per-group budget limits (fixed ₹ or % of income) with animated arc gauges, category breakdown, projected end-of-month spend, and a breach-date warning ("Hits limit ~May 22").

### Monthly
Month-by-month breakdown with grouped spending, income sources, savings rate gauge, 6-month summary table, and category anomaly badges (↑/↓ vs 3-month average).

### Analytics
Charts and trends across time — spending by group, income vs expense, category breakdown.

### Accounts (Net Worth)
Track assets and liabilities. Mark accounts as liquid/illiquid. Linked to transactions so savings deposits and withdrawals update balances automatically.

### Goals
Savings goals with progress tracking and projected completion date. Savings rate calculation excludes internal transfers to avoid double-counting.

### Recurring Rules
Set up recurring income or expense rules. Rules apply automatically on their day of the month — only for upcoming months, never backfilled. View due-soon highlights and monthly committed totals.

### Categories
Fully customisable expense categories (grouped under Needs / Wants / Savings / Family) and income categories. Savings categories can be linked to accounts.

### Notifications
Smart alerts for budget overruns and approaching limits, with per-alert dismiss and clear-all.

---

## Privacy

- **No backend server** — your data is never sent to the developer
- All financial data is stored in a **Google Sheets spreadsheet in your own Google Drive**
- Google OAuth scopes: `openid`, `email`, `profile`, `spreadsheets`, `drive.file` (limited to files the app creates)
- Browser `localStorage` stores only your access token, email, display name, and UI preferences — cleared on sign-out
- No analytics, no ads, no tracking

---

## PWA — Install on Android / iOS

DKP Finance is a Progressive Web App. On Android, open it in Chrome and tap **Add to Home screen**. On iOS, use Safari → Share → Add to Home Screen. The app works offline after the first load (shell cached via Workbox service worker).

---

## Getting Started

### Prerequisites
- Node.js 18+
- (Optional) A Google Cloud project with the Sheets API and Drive API enabled

### Install & run

```bash
npm install
npm run dev
```

Open [http://localhost:8081](http://localhost:8081).

### Build

```bash
npm run build
```

Output goes to `dist/`. The build generates a service worker (`sw.js`) and web manifest automatically.

---

## Data Import

A conversion script is provided for the legacy spreadsheet format:

```bash
cd Data
python convert.py
```

Reads all `*Transactions*.csv` files in `Data/` and writes `Data/import.csv`.

Then in the app: **Transactions → Import CSV** and select `Data/import.csv`.

Expected CSV format:

```
date,description,category,type,amount,notes,tags
2026-01-01,Salary,salary,income,252189,,
2026-01-02,Zerodha,savings,expense,30000,,
```

- `category` must match a category ID (e.g. `savings`, `food`, `transport`)
- `type` is `income` or `expense`

---

## Google Sheets Sync

Sign in with Google. The app creates (or reuses) a spreadsheet named `DKP Finance - <email>` in your Drive with these tabs:

| Tab | Contents |
|---|---|
| Transactions | All transactions |
| Budgets | Per-group budget settings |
| Goals | Savings goals |
| Recurring | Recurring rules |
| NetWorth | Assets and liabilities |
| Categories | Custom expense categories |
| IncomeCats | Custom income categories |
| Settings | Currency, theme, preferences |

---

## Tech Stack

| | |
|---|---|
| [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) | UI framework |
| [Vite](https://vitejs.dev/) | Build tool |
| [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) + Workbox | PWA / service worker |
| [React Router v6](https://reactrouter.com/) | Client-side routing |
| [Google Sheets API v4](https://developers.google.com/sheets/api) | Data persistence |
| [pdf.js](https://mozilla.github.io/pdf.js/) | GPay PDF transaction import |
| CSS custom properties | Light / dark theming, 4 accent colour themes |

---

## Support

If DKP Finance saves you time, a small coffee is appreciated:

- 🌍 [Ko-fi](https://ko-fi.com/deepakprasad) — worldwide (cards, PayPal)
- 🇮🇳 UPI: `deepak.prasad.ai@okicici`

---

## License

Personal use. Not open for commercial redistribution. See [Terms of Service](https://beingdpkpr.github.io/aryas-finance/terms).

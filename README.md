# Artha — Personal Finance Tracker

A privacy-first personal finance app built with React + TypeScript. All data lives in your browser (localStorage) with optional sync to your own Google Sheet.

## Features

- **Dashboard** — monthly income/expense summary, top spending categories, recent transactions
- **Transactions** — full list with search, filter, bulk delete, CSV import/export, GPay PDF import
- **Budget** — per-category budget limits with progress tracking, grouped by Essentials / Family / Savings / Wants
- **Monthly** — month-by-month breakdown with grouped spending, income sources, savings rate gauge, and 6-month summary table
- **Analytics** — charts and trends across time
- **Accounts** — net worth tracking
- **Goals** — savings goals with progress
- **Google Sheets sync** — push/pull all data to a spreadsheet named `Artha - <your email>`

## Category System

Expenses are organised into four groups:

| Group | Purpose |
|---|---|
| **Essentials** | Rent, food, transport, health |
| **Family** | Family commitments, dependants |
| **Savings** | Investments, SIPs, FDs, RDs |
| **Wants** | Entertainment, shopping, leisure |

Built-in categories can be extended with custom sub-categories via **Settings → Categories**.

## Getting Started

### Prerequisites

- Node.js 18+
- (Optional) A Google Cloud project with the Sheets API enabled, for sync

### Install & run

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Build

```bash
npm run build
```

Output goes to `dist/`.

## Data Import

A one-time conversion script is provided for the source spreadsheet format:

```bash
cd Data
python convert.py
```

This reads all `*Transactions*.csv` files in the `Data/` folder and writes `Data/import.csv` (336 transactions as of April 2026).

Then in the app: **Transactions → Import CSV** and select `Data/import.csv`.

The CSV format expected by the importer:

```
date,description,category,type,amount,notes,tags
2026-01-01,Salary,salary,income,252189,,
2026-01-02,Zerodha,savings,expense,30000,subcat:Stocks,
```

- `category` must match a category ID (e.g. `savings`, `food`, `transport`)
- `notes` can contain `subcat:<name>` to populate the sub-category field

## Google Sheets Sync

Sign in with Google on the Login page. The app will create (or reuse) a spreadsheet called `Artha - <email>` with these tabs:

| Tab | Contents |
|---|---|
| Transactions | All transactions including sub-category |
| Budgets | Per-category budget settings |
| Goals | Savings goals |
| Recurring | Recurring rules |
| NetWorth | Account/net-worth snapshots |
| Settings | Currency and preferences |
| CustomCategories | User-defined categories |

## Tech Stack

- [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/) — build tool
- [React Router v6](https://reactrouter.com/)
- [Google Sheets API v4](https://developers.google.com/sheets/api)
- [pdf.js](https://mozilla.github.io/pdf.js/) — GPay PDF parsing
- CSS custom properties for theming (light/dark)

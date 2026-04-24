# Personal Finance — Mobile App Design Spec
**Date:** 2026-04-24  
**Status:** Approved

## Overview

Port the existing "Finance — Personal Tracker" web design into a cross-platform mobile + web app using Expo (React Native). The app tracks personal income, expenses, budgets, goals, and net worth entirely offline with local storage. No backend required.

**Target platforms:** iOS · Android · Web (single codebase)  
**Stack:** Expo SDK (latest) · Expo Router · TypeScript · AsyncStorage · Victory Native (charts)

---

## Architecture

### Project Structure

```
personal-finance/
├── app/
│   ├── _layout.tsx              # Root layout, auth guard
│   ├── login.tsx                # Login / register screen
│   └── (tabs)/
│       ├── _layout.tsx          # Responsive tab/sidebar layout
│       ├── index.tsx            # Dashboard
│       ├── monthly.tsx          # Monthly Report
│       ├── yearly.tsx           # Yearly Report
│       ├── budgets.tsx          # Budget Planner
│       ├── goals.tsx            # Savings Goals
│       ├── networth.tsx         # Net Worth
│       ├── recurring.tsx        # Recurring Transactions
│       └── transactions.tsx     # All Transactions
├── components/
│   ├── StatCard.tsx
│   ├── CategoryBar.tsx
│   ├── AddModal.tsx             # Add/Edit transaction (bottom sheet mobile, modal web)
│   ├── ExportMenu.tsx
│   └── icons/                  # SVG icon components
├── lib/
│   ├── storage.ts               # AsyncStorage wrappers (replaces localStorage)
│   ├── data.ts                  # Types + shared calculations
│   ├── recurring.ts             # Auto-apply recurring logic
│   └── format.ts                # fmt(), fmtFull(), currency utils
├── constants/
│   ├── theme.ts                 # Design tokens (colors, typography)
│   └── categories.ts            # EXPENSE_CATS, INCOME_CATS, CURRENCIES
└── hooks/
    └── useFinance.ts            # Central state + persistence hook
```

### What ports directly from the web design (minimal changes)
- All business logic: `applyRecurring`, `resolveLimit`, `fmt`, `fmtFull`
- All constants: `EXPENSE_CATS`, `INCOME_CATS`, `CURRENCIES`, `MONTHS`
- All per-view data calculations (dashboard stats, budget progress, net worth totals)

### What requires rewriting
- All JSX: `div` → `View`, `span` → `Text`, `button` → `Pressable`, inline styles → `StyleSheet`
- CSS variables → `theme.ts` constants
- `localStorage` → `AsyncStorage`
- Chart.js → Victory Native

---

## Data Model

### Types

```typescript
type TxnType = 'expense' | 'income';

interface Transaction {
  id: string;
  type: TxnType;
  amount: number;
  category: string;
  description: string;
  date: string;           // 'YYYY-MM-DD'
  notes?: string;
  tags?: string[];
  recurringId?: string;
  auto?: boolean;
}

interface BudgetEntry {
  mode: 'fixed' | 'pct'; // fixed amount or % of monthly income
  value: number;
}

interface RecurringRule {
  id: string;
  type: TxnType;
  amount: number;
  category: string;
  description: string;
  dayOfMonth: number;
}

interface Goal {
  id: string;
  name: string;
  target: number;
  current: number;
  deadline?: string;
}

interface NetWorth {
  assets:      { id: string; name: string; value: number }[];
  liabilities: { id: string; name: string; value: number }[];
}

interface Currency {
  code:   string; // 'INR'
  symbol: string; // '₹'
  locale: string; // 'en-IN'
}
```

### State Management

A single `useFinance` hook owns all state and async persistence. No external state library. Each state slice auto-saves to AsyncStorage via `useEffect`.

```typescript
const {
  txns, addTxn, editTxn, deleteTxn,
  budgets, setBudgets,
  goals, setGoals,
  nw, setNw,
  recurring, setRecurring,
  currency, setCurrency,
  user, login, logout,
} = useFinance();
```

### AsyncStorage Key Scheme (user-scoped)

| Key | Value |
|-----|-------|
| `pf_users` | `{ [username]: { password } }` |
| `pf_session` | current username string |
| `pf_txns_{user}` | `Transaction[]` |
| `pf_budgets_{user}` | `{ [catId]: BudgetEntry }` |
| `pf_recurring_{user}` | `RecurringRule[]` |
| `pf_goals_{user}` | `Goal[]` |
| `pf_nw_{user}` | `NetWorth` |
| `pf_currency_{user}` | `Currency` |

---

## UI & Theme

### Design Tokens

```typescript
// constants/theme.ts
export const colors = {
  bg:        '#0b0c14',
  surface:   '#13141f',
  surface2:  '#1c1d2e',
  border:    '#252640',
  text:      '#e4e5f0',
  muted:     '#6b6c8a',
  accent:    '#f0722a',
  accentDim: 'rgba(240,114,42,0.12)',
  green:     '#2ed18a',
  greenDim:  'rgba(46,209,138,0.10)',
  red:       '#f05060',
  redDim:    'rgba(240,80,96,0.10)',
  blue:      '#5a9fff',
  purple:    '#a07aff',
};

export const font = 'PlusJakartaSans'; // loaded via expo-font
```

### Responsive Navigation

| Breakpoint | Layout |
|---|---|
| Mobile (`< 768px`) | Bottom tab bar — 4 primary tabs + "More" tab, which opens a sheet for the remaining 4 views |
| Tablet / Web (`≥ 768px`) | 230px fixed sidebar — all 8 items visible, matches original design |

**Primary tabs (mobile):** Dashboard · Transactions · Budgets · Monthly · More  
**"More" sheet:** Yearly · Goals · Net Worth · Recurring

---

## Screens

### Login
Centered card with logo, username/password fields, login/register toggle. Identical layout to web design.

### Dashboard
- 4 stat cards: Total Income · Total Expenses · Net Savings · Transaction Count
  - 2×2 grid on mobile, 4-column row on wider screens
- Budget alerts for categories ≥ 80% of limit (amber) or over limit (red)
- Spending forecast chip (daily average × days in month)
- Recent 8 transactions list with edit/delete actions

### Monthly Report
- Month picker (prev/next arrows)
- Income vs expense bar chart (Victory Native `VictoryBar`)
- Category breakdown list with colored progress bars
- Tap any transaction to edit

### Yearly Report
- Year picker
- Summary stat cards (total income, total expenses, net savings, savings rate)
- Monthly breakdown table (rows: Income / Expenses / Net; columns: months)
- Download button → CSV export (share sheet on mobile, file download on web)

### Budget Planner
- Monthly income display
- Per-category rows with progress bars (green → amber → red)
- Inline edit: toggle fixed amount vs % of income
- Summary: total budgeted, total spent, over-budget count

### Savings Goals
- Goal cards with circular progress indicator, target, current, deadline
- Add / edit / delete via modal

### Net Worth
- Assets list + liabilities list, each with add/edit/delete
- Net total displayed prominently
- Simple row editor (name + value)

### Recurring Transactions
- List of recurring rules with next application date
- Add / edit / delete
- Auto-applied on app load for current month if day has passed

### All Transactions
- Searchable, filterable list (by type, category, month)
- Swipe-to-delete on mobile, delete button on web
- Tap to edit

### Add / Edit Transaction Modal
- Bottom sheet on mobile, centered modal on web
- Expense / Income toggle
- Fields: amount, category (picker), description, date, notes, tags
- Pre-fills when editing

---

## Export

- **CSV:** Generated client-side, shared via `expo-sharing` on mobile, downloaded on web
- **PDF:** Not supported on mobile (share sheet with CSV instead); could be added later via `expo-print`

---

## Out of Scope

- Cloud sync / backend
- Biometric auth
- Push notifications for budget alerts
- Multi-account support
- PDF export on mobile

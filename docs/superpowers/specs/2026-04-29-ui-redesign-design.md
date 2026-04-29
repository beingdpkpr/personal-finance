# UI Redesign: React Native → React + Vite Web App

**Date:** 2026-04-29  
**Status:** Approved — implementation in progress

---

## Context

The personal finance app was originally built as a React Native / Expo Router mobile app. A desktop web mockup was created (`Design/Finance Tracker Desktop.html`) that the product owner wants to use as the new primary UI. The decision is to replace the React Native root with a React + Vite web app — web-first now, with React Native mobile as a separate future app reusing the business logic layer.

**Problem:** The current mobile-first UI limits the app to phone form factors and makes it difficult to use on desktop.

**Outcome:** A polished web app matching the mockup design, with all existing functionality preserved (Google OAuth, Sheets sync, CSV import/export, budgets, goals, net worth, recurring transactions).

---

## Tech Stack

- **React 18 + Vite 5 + TypeScript 5** — web app
- **React Router v6** — client-side routing
- **Tailwind CSS v3** — utility styling
- **CSS custom properties** — theme system (3 accent themes × light/dark mode)
- **DM Sans + DM Mono** — typography (Google Fonts, matching mockup)
- **SVG charts** — ported directly from `Design/Finance Tracker Desktop.html` (no chart library)

---

## Screen Mapping

| New Web Screen | Migrated From (RN) | Key Functionality |
|---|---|---|
| Login | `app/login.tsx` | Google OAuth browser popup + demo mode |
| Dashboard | `app/(tabs)/index.tsx` | Net savings, budget alerts, recent txns, area + donut charts |
| Accounts | `app/(tabs)/networth.tsx` | Assets/liabilities as account cards, add/delete, net worth total |
| Transactions | `app/(tabs)/transactions.tsx` | Search, filter, CSV import/export, add/edit/delete |
| Analytics | `app/(tabs)/monthly.tsx` + `yearly.tsx` | Area chart, bar chart, category breakdown table |
| Budget | `app/(tabs)/budgets.tsx` | 3-col grid, progress bars, fixed/percentage modes |
| Goals | `app/(tabs)/goals.tsx` | Circular progress rings, add/edit/delete with deadlines |
| Monthly | `app/(tabs)/monthly.tsx` | Month/year toggle, income sources, category breakdown |

**Deferred (logic preserved in state, no screen yet):**
- Planning screen (`app/(tabs)/planning.tsx`) → `// TODO: Planning screen` in useFinance
- Recurring transactions screen → rules still run automatically; `// TODO: Recurring screen`
- Profile screen → becomes SettingsModal accessible from Header

---

## Architecture

```
src/
├── lib/          # Business logic — migrated unchanged
│   ├── data.ts       # Types, uid(), resolveLimit()
│   ├── format.ts     # fmt(), fmtFull(), setCurrency()
│   ├── storage.ts    # localStorage wrapper (was AsyncStorage)
│   ├── google-auth.ts # localStorage + browser OAuth popup (was expo-auth-session)
│   ├── sync.ts       # Google Sheets push/pull — unchanged
│   ├── sheets.ts     # Sheets API helpers — unchanged
│   └── recurring.ts  # Recurring rule engine — unchanged
├── hooks/
│   ├── useFinance.ts       # Core state — unchanged logic
│   ├── FinanceContext.tsx  # Context + modal state — unchanged
│   └── ThemeContext.tsx    # Rewritten: drives CSS custom properties
├── constants/
│   └── categories.ts  # Expense/income categories, currencies — unchanged
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx      # Root: sidebar + header + <Outlet>
│   │   ├── Sidebar.tsx       # Collapsible 220px/64px, nav items, user profile
│   │   ├── Header.tsx        # Page title, sidebar toggle, settings button
│   │   ├── SettingsModal.tsx # Dark mode, accent theme, currency, logout
│   │   └── DockNav.tsx       # Mobile placeholder (TODO)
│   ├── ui/
│   │   ├── Card.tsx            # Surface2 card with hover lift
│   │   ├── StatCard.tsx        # Label + value (DM Mono) + sub-metric badge
│   │   ├── ProgressBar.tsx     # Animated, color by threshold
│   │   ├── CircularProgress.tsx # SVG arc gauge
│   │   └── Badge.tsx           # Pill badge
│   ├── charts/
│   │   ├── AreaChart.tsx   # Income vs expense SVG area chart
│   │   ├── DonutChart.tsx  # Category spending donut
│   │   └── BarChart.tsx    # Monthly expense bars
│   └── modals/
│       ├── AddTransactionModal.tsx  # Add/edit transaction
│       └── AddAccountModal.tsx      # Add account/asset/liability
└── pages/
    ├── Login.tsx
    ├── Dashboard.tsx
    ├── Accounts.tsx
    ├── Transactions.tsx
    ├── Analytics.tsx
    ├── Budget.tsx
    ├── Goals.tsx
    └── Monthly.tsx
```

---

## Theme System

Three accent themes (Violet, Slate, Rose) × Dark/Light mode = 6 visual configurations.

Implemented as CSS custom properties on `:root` with `data-theme` and `data-light` attributes driven by `ThemeContext`. No React re-renders needed for theme changes — pure CSS.

```css
:root                    /* violet dark (default) */
:root[data-theme="slate"]
:root[data-theme="rose"]
:root[data-light="true"] /* overrides bg/surface/text for any theme */
```

Key variables: `--accent`, `--bg`, `--sidebar`, `--surface`, `--surface2`, `--border`, `--text`, `--text-dim`, `--positive`, `--negative`, `--warning`

---

## Key Migrations

| React Native | Web |
|---|---|
| `AsyncStorage` | `localStorage` (same async API shape) |
| `expo-auth-session` | `window.open()` OAuth popup + interval polling |
| `expo-document-picker` | `<input type="file" accept=".csv">` |
| `expo-file-system` + `expo-sharing` | `Blob` + `URL.createObjectURL` + `<a download>` |
| `react-native-svg` + `victory-native` | Hand-rolled SVG (ported from mockup) |
| Expo Router | React Router v6 |
| `StyleSheet.create()` | Inline style objects + Tailwind |

---

## Mobile Placeholder

`MOBILE.md` at repo root documents the future React Native app architecture. The `src/lib/` and `src/hooks/` layers are designed to be shared. The `DockNav.tsx` stub is the entry point for mobile navigation implementation.

---

## Verification Checklist

1. `npm run dev` → login page loads at localhost:5173
2. Demo mode → dashboard with sample data (INR, transactions, budgets, goals)
3. Google Sign-In → OAuth popup opens, signs in, Sheets sync fires
4. All 7 sidebar nav links navigate correctly
5. Add transaction → modal opens, saves, appears in Transactions and Dashboard
6. Budget alerts on Dashboard when category >80% spent
7. CSV export → `.csv` file downloads
8. CSV import → file picker opens, transactions load
9. Dark mode toggle → background/text flips, persists on refresh
10. Accent theme switch (violet/slate/rose) → colors change immediately
11. Sidebar collapse → icons-only mode
12. Settings modal → currency change reflected in all formatted values

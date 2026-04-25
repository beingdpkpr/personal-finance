# Personal Finance Mobile App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a cross-platform Expo app (iOS · Android · Web) that ports the "Finance — Personal Tracker" web design into a fully native mobile experience.

**Architecture:** Single Expo codebase using Expo Router for file-based navigation. All data stored locally in AsyncStorage. A `useFinance` hook manages state and is shared via React Context. Responsive layout: bottom tabs on mobile (< 768px), sidebar on tablet/web (≥ 768px).

**Tech Stack:** Expo SDK 51, Expo Router 3, TypeScript, @react-native-async-storage/async-storage, victory-native@^36, react-native-svg, @expo-google-fonts/plus-jakarta-sans, expo-sharing, expo-file-system, jest-expo

---

## File Map

| File | Responsibility |
|------|---------------|
| `constants/theme.ts` | Colors, spacing, border-radius tokens |
| `constants/categories.ts` | EXPENSE_CATS, INCOME_CATS, CURRENCIES, MONTHS |
| `lib/data.ts` | TypeScript interfaces, uid(), resolveLimit() |
| `lib/format.ts` | fmt(), fmtFull(), setCurrency(), getCurrency() |
| `lib/recurring.ts` | applyRecurring() |
| `lib/storage.ts` | AsyncStorage wrappers for all stores |
| `hooks/useFinance.ts` | Central state hook |
| `hooks/FinanceContext.tsx` | React Context provider + useFinanceContext() |
| `app/_layout.tsx` | Root layout: fonts, auth guard, context |
| `app/login.tsx` | Login / register screen |
| `components/icons/index.tsx` | All SVG icon components |
| `components/StatCard.tsx` | Metric card (Dashboard, Budget) |
| `components/CategoryBar.tsx` | Colored progress bar |
| `components/AddModal.tsx` | Add/Edit transaction modal |
| `components/SidebarNav.tsx` | Wide-screen sidebar navigation |
| `components/BottomNav.tsx` | Mobile bottom tab bar |
| `app/(tabs)/_layout.tsx` | Responsive nav layout |
| `app/(tabs)/index.tsx` | Dashboard |
| `app/(tabs)/transactions.tsx` | All Transactions |
| `app/(tabs)/budgets.tsx` | Budget Planner |
| `app/(tabs)/monthly.tsx` | Monthly Report |
| `app/(tabs)/yearly.tsx` | Yearly Report + CSV export |
| `app/(tabs)/goals.tsx` | Savings Goals |
| `app/(tabs)/networth.tsx` | Net Worth |
| `app/(tabs)/recurring.tsx` | Recurring Transactions |
| `app/(tabs)/more.tsx` | Mobile "More" hub screen |
| `__tests__/format.test.ts` | Unit tests: format utils |
| `__tests__/recurring.test.ts` | Unit tests: recurring logic |

---

### Task 1: Initialize Expo project and install dependencies

**Files:**
- Create: `app.json`
- Create: `package.json` (modify after init)
- Create: `tsconfig.json`
- Create: `babel.config.js`

- [ ] **Step 1: Scaffold the project**

Run from `d:/work/mine/personal-finance`:
```bash
npx create-expo-app@latest . --template blank-typescript
```
Expected: Project files created. Confirm with `ls app.json`.

- [ ] **Step 2: Install all dependencies**

```bash
npx expo install expo-router @react-native-async-storage/async-storage expo-sharing expo-file-system react-native-svg
npm install victory-native@^36
npx expo install @expo-google-fonts/plus-jakarta-sans expo-font expo-splash-screen
npm install --save-dev jest-expo @testing-library/react-native
```

- [ ] **Step 3: Replace `app.json`**

```json
{
  "expo": {
    "name": "Finance",
    "slug": "personal-finance",
    "version": "1.0.0",
    "scheme": "finance",
    "userInterfaceStyle": "dark",
    "platforms": ["ios", "android", "web"],
    "ios": { "supportsTablet": true, "bundleIdentifier": "com.personal.finance" },
    "android": {
      "package": "com.personal.finance",
      "adaptiveIcon": { "backgroundColor": "#0b0c14" }
    },
    "web": { "bundler": "metro", "output": "static" },
    "plugins": ["expo-router", "expo-font"],
    "experiments": { "typedRoutes": true }
  }
}
```

- [ ] **Step 4: Set `main` and jest config in `package.json`**

Add/replace these keys in `package.json`:
```json
{
  "main": "expo-router/entry",
  "jest": {
    "preset": "jest-expo",
    "transformIgnorePatterns": [
      "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|victory-native|react-native-svg)"
    ]
  }
}
```

- [ ] **Step 5: Verify app starts**

```bash
npx expo start --web
```
Expected: Browser opens to Expo blank app with no errors.

- [ ] **Step 6: Create placeholder `__tests__` dir and commit**

```bash
mkdir __tests__
git add -A
git commit -m "feat: initialize Expo project with dependencies"
```

---

### Task 2: Design constants

**Files:**
- Create: `constants/theme.ts`
- Create: `constants/categories.ts`

- [ ] **Step 1: Create `constants/theme.ts`**

```typescript
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
  yellow:    '#f0b030',
};

export const radius = { sm: 6, md: 10, lg: 14, xl: 20 };
export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
export const SIDEBAR_W = 230;
export const WIDE_BREAKPOINT = 768;
```

- [ ] **Step 2: Create `constants/categories.ts`**

```typescript
export const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
export const MONTHS_FULL = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

export const EXPENSE_CATS = [
  { id: 'essentials',    label: 'Essentials',           color: '#5a9fff' },
  { id: 'food',          label: 'Food & Dining',         color: '#f0b030' },
  { id: 'transport',     label: 'Transport',             color: '#a07aff' },
  { id: 'entertainment', label: 'Entertainment',         color: '#f05060' },
  { id: 'shopping',      label: 'Shopping',              color: '#ff7eb3' },
  { id: 'health',        label: 'Health',                color: '#2ed18a' },
  { id: 'savings',       label: 'Savings & Investments', color: '#f0722a' },
  { id: 'family',        label: 'Family & Commitments',  color: '#60d0e0' },
  { id: 'other',         label: 'Other',                 color: '#8888aa' },
] as const;

export const INCOME_CATS = [
  { id: 'salary',    label: 'Salary / Wages', color: '#2ed18a' },
  { id: 'freelance', label: 'Freelance',      color: '#5a9fff' },
  { id: 'other',     label: 'Other Income',   color: '#a07aff' },
] as const;

export const CURRENCIES = [
  { code: 'INR', symbol: '₹',    locale: 'en-IN' },
  { code: 'USD', symbol: '$',    locale: 'en-US' },
  { code: 'EUR', symbol: '€',    locale: 'de-DE' },
  { code: 'GBP', symbol: '£',    locale: 'en-GB' },
  { code: 'JPY', symbol: '¥',    locale: 'ja-JP' },
  { code: 'AED', symbol: 'د.إ', locale: 'ar-AE' },
  { code: 'SGD', symbol: 'S$',   locale: 'en-SG' },
] as const;
```

- [ ] **Step 3: Commit**

```bash
git add constants/
git commit -m "feat: add design tokens and category constants"
```

---

### Task 3: Core types and utilities

**Files:**
- Create: `lib/data.ts`

- [ ] **Step 1: Create `lib/data.ts`**

```typescript
export type TxnType = 'expense' | 'income';

export interface Transaction {
  id: string;
  type: TxnType;
  amount: number;
  category: string;
  description: string;
  date: string;         // 'YYYY-MM-DD'
  notes?: string;
  tags?: string[];
  recurringId?: string;
  auto?: boolean;
}

export interface BudgetEntry {
  mode: 'fixed' | 'pct';
  value: number;
}

export interface BudgetMap {
  [catId: string]: BudgetEntry;
}

export interface RecurringRule {
  id: string;
  type: TxnType;
  amount: number;
  category: string;
  description: string;
  dayOfMonth: number;
}

export interface Goal {
  id: string;
  name: string;
  target: number;
  current: number;
  deadline?: string;
}

export interface NetWorthItem {
  id: string;
  name: string;
  value: number;
}

export interface NetWorthData {
  assets: NetWorthItem[];
  liabilities: NetWorthItem[];
}

export interface Currency {
  code: string;
  symbol: string;
  locale: string;
}

export interface UserStore {
  [username: string]: { password: string };
}

export function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function resolveLimit(entry: BudgetEntry | undefined, monthIncome: number): number {
  if (!entry) return 0;
  if (entry.mode === 'pct') return (entry.value / 100) * monthIncome;
  return entry.value;
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/data.ts
git commit -m "feat: add core TypeScript types and utilities"
```

---

### Task 4: Format utilities (TDD)

**Files:**
- Create: `lib/format.ts`
- Create: `__tests__/format.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// __tests__/format.test.ts
import { fmt, fmtFull, setCurrency, getCurrency } from '../lib/format';
import { Currency } from '../lib/data';

const INR: Currency = { code: 'INR', symbol: '₹', locale: 'en-IN' };
const USD: Currency = { code: 'USD', symbol: '$', locale: 'en-US' };

beforeEach(() => setCurrency(INR));

describe('fmt', () => {
  it('returns symbol+0 for null', () => expect(fmt(null as any)).toBe('₹0'));
  it('returns symbol+0 for undefined', () => expect(fmt(undefined as any)).toBe('₹0'));
  it('formats zero', () => expect(fmt(0)).toBe('₹0'));
  it('formats small positive', () => expect(fmt(500)).toBe('₹500'));
  it('formats negative', () => expect(fmt(-500)).toBe('-₹500'));
  it('abbreviates lakhs', () => expect(fmt(100000)).toBe('₹1L'));
  it('abbreviates 1.5L', () => expect(fmt(150000)).toBe('₹1.5L'));
  it('strips trailing zeros in lakh abbreviation', () => expect(fmt(200000)).toBe('₹2L'));
});

describe('fmtFull', () => {
  it('returns symbol+0 for null', () => expect(fmtFull(null as any)).toBe('₹0'));
  it('formats without abbreviation', () => {
    setCurrency(USD);
    expect(fmtFull(100000)).toBe('$100,000');
  });
  it('formats negative', () => expect(fmtFull(-1000)).toBe('-₹1,000'));
});

describe('getCurrency', () => {
  it('returns current currency', () => {
    setCurrency(USD);
    expect(getCurrency().code).toBe('USD');
  });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
npx jest __tests__/format.test.ts --no-coverage
```
Expected: FAIL — `Cannot find module '../lib/format'`

- [ ] **Step 3: Implement `lib/format.ts`**

```typescript
import { Currency } from './data';

let __curr: Currency = { code: 'INR', symbol: '₹', locale: 'en-IN' };

export function setCurrency(c: Currency): void { __curr = c; }
export function getCurrency(): Currency { return __curr; }

export function fmt(n: number | null | undefined): string {
  if (n === undefined || n === null) return __curr.symbol + '0';
  const abs = Math.abs(n);
  const str =
    abs >= 1e5
      ? (abs / 1e5).toFixed(2).replace(/\.?0+$/, '') + 'L'
      : abs.toLocaleString(__curr.locale);
  return (n < 0 ? '-' : '') + __curr.symbol + str;
}

export function fmtFull(n: number | null | undefined): string {
  if (n === undefined || n === null) return __curr.symbol + '0';
  return (n < 0 ? '-' : '') + __curr.symbol + Math.abs(n).toLocaleString(__curr.locale);
}
```

- [ ] **Step 4: Run to verify pass**

```bash
npx jest __tests__/format.test.ts --no-coverage
```
Expected: PASS — all tests green.

- [ ] **Step 5: Commit**

```bash
git add lib/format.ts __tests__/format.test.ts
git commit -m "feat: add format utilities with tests"
```

---

### Task 5: Recurring logic (TDD)

**Files:**
- Create: `lib/recurring.ts`
- Create: `__tests__/recurring.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// __tests__/recurring.test.ts
import { applyRecurring } from '../lib/recurring';
import { RecurringRule, Transaction } from '../lib/data';

const now = new Date();
const yr = now.getFullYear();
const mo = now.getMonth();
const monthKey = `${yr}-${String(mo + 1).padStart(2, '0')}`;

const rule: RecurringRule = {
  id: 'r1',
  type: 'expense',
  amount: 1000,
  category: 'essentials',
  description: 'Rent',
  dayOfMonth: 1,
};

describe('applyRecurring', () => {
  it('returns existing array unchanged when no rules', () => {
    const txns: Transaction[] = [{ id: 't1', type: 'expense', amount: 50, category: 'food', description: 'Lunch', date: `${monthKey}-01` }];
    expect(applyRecurring([], txns)).toBe(txns);
  });

  it('adds a recurring transaction for the current month', () => {
    const result = applyRecurring([rule], []);
    expect(result).toHaveLength(1);
    expect(result[0].recurringId).toBe('r1');
    expect(result[0].auto).toBe(true);
    expect(result[0].date.startsWith(monthKey)).toBe(true);
  });

  it('does not duplicate when already applied this month', () => {
    const existing: Transaction[] = [{
      id: 'x1', type: 'expense', amount: 1000, category: 'essentials',
      description: 'Rent', date: `${monthKey}-01`, recurringId: 'r1', auto: true,
    }];
    const result = applyRecurring([rule], existing);
    expect(result).toHaveLength(1);
  });

  it('does not add if the day is in the future', () => {
    const futureDay = now.getDate() + 5;
    if (futureDay > 28) return; // skip if near month end
    const futureRule: RecurringRule = { ...rule, dayOfMonth: futureDay };
    const result = applyRecurring([futureRule], []);
    expect(result).toHaveLength(0);
  });

  it('handles dayOfMonth exceeding days in month (clamps to last day)', () => {
    const clampRule: RecurringRule = { ...rule, id: 'r2', dayOfMonth: 31 };
    const result = applyRecurring([clampRule], []);
    const lastDay = new Date(yr, mo + 1, 0).getDate();
    const expectedDate = `${monthKey}-${String(lastDay).padStart(2, '0')}`;
    if (new Date(expectedDate) <= now) {
      expect(result[0].date).toBe(expectedDate);
    }
  });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
npx jest __tests__/recurring.test.ts --no-coverage
```
Expected: FAIL — `Cannot find module '../lib/recurring'`

- [ ] **Step 3: Implement `lib/recurring.ts`**

```typescript
import { RecurringRule, Transaction, uid } from './data';

export function applyRecurring(
  recurringList: RecurringRule[],
  existingTxns: Transaction[],
): Transaction[] {
  if (!recurringList.length) return existingTxns;

  const now = new Date();
  const yr = now.getFullYear();
  const mo = now.getMonth();
  const monthKey = `${yr}-${String(mo + 1).padStart(2, '0')}`;
  const added: Transaction[] = [];

  for (const r of recurringList) {
    const day = Math.min(r.dayOfMonth || 1, new Date(yr, mo + 1, 0).getDate());
    const date = `${monthKey}-${String(day).padStart(2, '0')}`;
    if (new Date(date) > now) continue;
    const exists = existingTxns.some(
      t => t.recurringId === r.id && t.date.startsWith(monthKey),
    );
    if (!exists) {
      added.push({
        id: uid(),
        type: r.type,
        amount: r.amount,
        category: r.category,
        description: r.description,
        date,
        recurringId: r.id,
        auto: true,
      });
    }
  }

  return added.length ? [...existingTxns, ...added] : existingTxns;
}
```

- [ ] **Step 4: Run to verify pass**

```bash
npx jest __tests__/recurring.test.ts --no-coverage
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/recurring.ts __tests__/recurring.test.ts
git commit -m "feat: add recurring transaction logic with tests"
```

---

### Task 6: Storage layer

**Files:**
- Create: `lib/storage.ts`

- [ ] **Step 1: Create `lib/storage.ts`**

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  BudgetMap, Currency, Goal, NetWorthData,
  RecurringRule, Transaction, UserStore,
} from './data';

const DEFAULT_CURRENCY: Currency = { code: 'INR', symbol: '₹', locale: 'en-IN' };
const DEFAULT_NW: NetWorthData = { assets: [], liabilities: [] };

async function get<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw !== null ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

async function set(key: string, value: unknown): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

async function remove(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}

export const storage = {
  getUsers:    ()                              => get<UserStore>('pf_users', {}),
  saveUsers:   (u: UserStore)                  => set('pf_users', u),

  getSession:  ()                              => get<string | null>('pf_session', null),
  setSession:  (u: string)                     => set('pf_session', u),
  clearSession: ()                             => remove('pf_session'),

  getTxns:     (user: string)                  => get<Transaction[]>(`pf_txns_${user}`, []),
  saveTxns:    (user: string, d: Transaction[]) => set(`pf_txns_${user}`, d),

  getBudgets:  (user: string)                  => get<BudgetMap>(`pf_budgets_${user}`, {}),
  saveBudgets: (user: string, d: BudgetMap)    => set(`pf_budgets_${user}`, d),

  getRecurring:  (user: string)                      => get<RecurringRule[]>(`pf_recurring_${user}`, []),
  saveRecurring: (user: string, d: RecurringRule[])  => set(`pf_recurring_${user}`, d),

  getGoals:  (user: string)              => get<Goal[]>(`pf_goals_${user}`, []),
  saveGoals: (user: string, d: Goal[])   => set(`pf_goals_${user}`, d),

  getNetWorth:  (user: string)                   => get<NetWorthData>(`pf_nw_${user}`, DEFAULT_NW),
  saveNetWorth: (user: string, d: NetWorthData)  => set(`pf_nw_${user}`, d),

  getCurrency:  (user: string)                => get<Currency>(`pf_currency_${user}`, DEFAULT_CURRENCY),
  saveCurrency: (user: string, d: Currency)   => set(`pf_currency_${user}`, d),
};
```

- [ ] **Step 2: Commit**

```bash
git add lib/storage.ts
git commit -m "feat: add AsyncStorage layer"
```

---

### Task 7: Finance hook and context

**Files:**
- Create: `hooks/useFinance.ts`
- Create: `hooks/FinanceContext.tsx`

- [ ] **Step 1: Create `hooks/useFinance.ts`**

```typescript
import { useCallback, useEffect, useState } from 'react';
import {
  BudgetMap, Currency, Goal, NetWorthData,
  RecurringRule, Transaction, uid,
} from '../lib/data';
import { storage } from '../lib/storage';
import { setCurrency } from '../lib/format';
import { applyRecurring } from '../lib/recurring';

const DEFAULT_CURRENCY: Currency = { code: 'INR', symbol: '₹', locale: 'en-IN' };

export interface FinanceState {
  user: string | null;
  loading: boolean;
  txns: Transaction[];
  budgets: BudgetMap;
  goals: Goal[];
  nw: NetWorthData;
  recurring: RecurringRule[];
  currency: Currency;
  login: (username: string, password: string) => Promise<string | null>;
  register: (username: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  addTxn: (t: Omit<Transaction, 'id'>) => void;
  editTxn: (t: Transaction) => void;
  deleteTxn: (id: string) => void;
  setBudgets: (b: BudgetMap) => void;
  setGoals: (g: Goal[]) => void;
  setNw: (n: NetWorthData) => void;
  setRecurring: (r: RecurringRule[]) => void;
  setCurrencyPref: (c: Currency) => void;
}

export function useFinance(): FinanceState {
  const [user, setUser]         = useState<string | null>(null);
  const [loading, setLoading]   = useState(true);
  const [txns, setTxns]         = useState<Transaction[]>([]);
  const [budgets, setBudgets]   = useState<BudgetMap>({});
  const [goals, setGoals]       = useState<Goal[]>([]);
  const [nw, setNw]             = useState<NetWorthData>({ assets: [], liabilities: [] });
  const [recurring, setRec]     = useState<RecurringRule[]>([]);
  const [currency, setCurrState] = useState<Currency>(DEFAULT_CURRENCY);

  async function loadUser(u: string) {
    const [t, b, r, g, n, c] = await Promise.all([
      storage.getTxns(u),
      storage.getBudgets(u),
      storage.getRecurring(u),
      storage.getGoals(u),
      storage.getNetWorth(u),
      storage.getCurrency(u),
    ]);
    const applied = applyRecurring(r, t);
    setCurrency(c);
    setUser(u);
    setTxns(applied);
    setBudgets(b);
    setRec(r);
    setGoals(g);
    setNw(n);
    setCurrState(c);
  }

  useEffect(() => {
    storage.getSession().then(async u => {
      if (u) await loadUser(u);
      setLoading(false);
    });
  }, []);

  useEffect(() => { if (user) storage.saveTxns(user, txns); }, [txns, user]);
  useEffect(() => { if (user) storage.saveBudgets(user, budgets); }, [budgets, user]);
  useEffect(() => { if (user) storage.saveRecurring(user, recurring); }, [recurring, user]);
  useEffect(() => { if (user) storage.saveGoals(user, goals); }, [goals, user]);
  useEffect(() => { if (user) storage.saveNetWorth(user, nw); }, [nw, user]);
  useEffect(() => { if (user) storage.saveCurrency(user, currency); }, [currency, user]);

  const login = useCallback(async (username: string, password: string) => {
    const users = await storage.getUsers();
    const u = users[username.trim()];
    if (!u || u.password !== password) return 'Invalid username or password.';
    await storage.setSession(username.trim());
    await loadUser(username.trim());
    return null;
  }, []);

  const register = useCallback(async (username: string, password: string) => {
    if (!username.trim() || !password.trim()) return 'Please fill in all fields.';
    const users = await storage.getUsers();
    if (users[username.trim()]) return 'Username already taken.';
    users[username.trim()] = { password };
    await storage.saveUsers(users);
    await storage.setSession(username.trim());
    await loadUser(username.trim());
    return null;
  }, []);

  const logout = useCallback(async () => {
    await storage.clearSession();
    const def = DEFAULT_CURRENCY;
    setCurrency(def);
    setUser(null);
    setTxns([]);
    setBudgets({});
    setRec([]);
    setGoals([]);
    setNw({ assets: [], liabilities: [] });
    setCurrState(def);
  }, []);

  const addTxn = useCallback((t: Omit<Transaction, 'id'>) => {
    setTxns(prev => [{ ...t, id: uid() }, ...prev]);
  }, []);

  const editTxn = useCallback((t: Transaction) => {
    setTxns(prev => prev.map(x => x.id === t.id ? t : x));
  }, []);

  const deleteTxn = useCallback((id: string) => {
    setTxns(prev => prev.filter(x => x.id !== id));
  }, []);

  const setCurrencyPref = useCallback((c: Currency) => {
    setCurrency(c);
    setCurrState(c);
  }, []);

  const setRecurring = useCallback((r: RecurringRule[]) => {
    setRec(r);
    setTxns(prev => applyRecurring(r, prev));
  }, []);

  return {
    user, loading, txns, budgets, goals, nw,
    recurring, currency,
    login, register, logout,
    addTxn, editTxn, deleteTxn,
    setBudgets, setGoals, setNw,
    setRecurring, setCurrencyPref,
  };
}
```

- [ ] **Step 2: Create `hooks/FinanceContext.tsx`**

```typescript
import React, { createContext, useContext } from 'react';
import { FinanceState, useFinance } from './useFinance';

const FinanceContext = createContext<FinanceState | null>(null);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const finance = useFinance();
  return (
    <FinanceContext.Provider value={finance}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinanceContext(): FinanceState {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinanceContext must be used within FinanceProvider');
  return ctx;
}
```

- [ ] **Step 3: Commit**

```bash
git add hooks/
git commit -m "feat: add useFinance hook and FinanceContext"
```

---

### Task 8: Root layout with fonts and auth guard

**Files:**
- Create: `app/_layout.tsx`

- [ ] **Step 1: Create `app/_layout.tsx`**

```typescript
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { Redirect, Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { View } from 'react-native';
import { FinanceProvider, useFinanceContext } from '../hooks/FinanceContext';
import { colors } from '../constants/theme';

SplashScreen.preventAutoHideAsync();

function AuthGate() {
  const { user, loading } = useFinanceContext();
  if (loading) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  if (!user) return <Redirect href="/login" />;
  return <Slot />;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <FinanceProvider>
      <AuthGate />
    </FinanceProvider>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/_layout.tsx
git commit -m "feat: add root layout with font loading and auth guard"
```

---

### Task 9: Login screen

**Files:**
- Create: `app/login.tsx`

- [ ] **Step 1: Create `app/login.tsx`**

```typescript
import { useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform,
  Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { useFinanceContext } from '../hooks/FinanceContext';
import { colors, radius, spacing } from '../constants/theme';

export default function LoginScreen() {
  const { login, register } = useFinanceContext();
  const [mode, setMode]         = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSubmit() {
    setError('');
    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    const err = mode === 'login'
      ? await login(username.trim(), password)
      : await register(username.trim(), password);
    setLoading(false);
    if (err) setError(err);
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Background glow */}
        <View style={styles.glow} />

        {/* Logo */}
        <View style={styles.logoWrap}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoIconText}>₹</Text>
          </View>
          <Text style={styles.logoSub}>PERSONAL</Text>
          <Text style={styles.logoTitle}>Finance</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </Text>

          {/* Mode toggle */}
          <View style={styles.toggle}>
            {(['login', 'register'] as const).map(m => (
              <Pressable
                key={m}
                onPress={() => { setMode(m); setError(''); }}
                style={[styles.toggleBtn, mode === m && styles.toggleBtnActive]}
              >
                <Text style={[styles.toggleText, mode === m && styles.toggleTextActive]}>
                  {m === 'login' ? 'Sign In' : 'Register'}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="Enter username"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter password"
            placeholderTextColor={colors.muted}
            secureTextEntry
          />

          {!!error && <Text style={styles.error}>{error}</Text>}

          <Pressable style={styles.btn} onPress={handleSubmit} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                </Text>
            }
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: colors.bg },
  scroll:        { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  glow:          { position: 'absolute', width: 400, height: 400, borderRadius: 200, backgroundColor: 'rgba(240,114,42,0.06)', top: '30%', alignSelf: 'center' },
  logoWrap:      { alignItems: 'center', marginBottom: 36 },
  logoIcon:      { width: 52, height: 52, borderRadius: 16, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  logoIconText:  { color: '#fff', fontSize: 22, fontFamily: 'PlusJakartaSans_700Bold' },
  logoSub:       { fontSize: 11, fontFamily: 'PlusJakartaSans_700Bold', letterSpacing: 2, color: colors.muted, textTransform: 'uppercase' },
  logoTitle:     { fontSize: 26, fontFamily: 'PlusJakartaSans_800ExtraBold', color: colors.text, marginTop: 2 },
  card:          { width: '100%', maxWidth: 400, backgroundColor: colors.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, padding: spacing.lg },
  cardTitle:     { fontSize: 20, fontFamily: 'PlusJakartaSans_700Bold', color: colors.text, marginBottom: 20 },
  toggle:        { flexDirection: 'row', backgroundColor: colors.surface2, borderRadius: radius.md, padding: 4, marginBottom: 20 },
  toggleBtn:     { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  toggleBtnActive: { backgroundColor: colors.accent },
  toggleText:    { fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.muted },
  toggleTextActive: { color: '#fff' },
  label:         { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input:         { backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.sm, color: colors.text, fontSize: 14, fontFamily: 'PlusJakartaSans_400Regular', marginBottom: 16 },
  error:         { color: colors.red, fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', marginBottom: 12 },
  btn:           { backgroundColor: colors.accent, borderRadius: radius.md, padding: spacing.md, alignItems: 'center', marginTop: 4 },
  btnText:       { color: '#fff', fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold' },
});
```

- [ ] **Step 2: Run on web and verify login flow**

```bash
npx expo start --web
```
Expected: Login screen renders. Registering a user and logging in redirects to the (tabs) route (shows blank screen for now — tabs not built yet).

- [ ] **Step 3: Commit**

```bash
git add app/login.tsx
git commit -m "feat: add login/register screen"
```

---

### Task 10: Icon components

**Files:**
- Create: `components/icons/index.tsx`

- [ ] **Step 1: Create `components/icons/index.tsx`**

```typescript
import Svg, { Path, Polyline, Line, Rect, Circle } from 'react-native-svg';
import { colors } from '../../constants/theme';

interface IconProps { color?: string; size?: number; }
const D = ({ color = colors.muted, size = 18 }: IconProps) => ({ color, size });

export function GridIcon({ color, size }: IconProps) {
  const { color: c, size: s } = D({ color, size });
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="7" height="7" rx="1" stroke={c} strokeWidth="1.5" />
      <Rect x="14" y="3" width="7" height="7" rx="1" stroke={c} strokeWidth="1.5" />
      <Rect x="3" y="14" width="7" height="7" rx="1" stroke={c} strokeWidth="1.5" />
      <Rect x="14" y="14" width="7" height="7" rx="1" stroke={c} strokeWidth="1.5" />
    </Svg>
  );
}

export function ListIcon({ color, size }: IconProps) {
  const { color: c, size: s } = D({ color, size });
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Line x1="8" y1="6" x2="21" y2="6" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="8" y1="12" x2="21" y2="12" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="8" y1="18" x2="21" y2="18" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      <Circle cx="3.5" cy="6" r="1" fill={c} />
      <Circle cx="3.5" cy="12" r="1" fill={c} />
      <Circle cx="3.5" cy="18" r="1" fill={c} />
    </Svg>
  );
}

export function CalIcon({ color, size }: IconProps) {
  const { color: c, size: s } = D({ color, size });
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={c} strokeWidth="1.5" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={c} strokeWidth="1.5" />
    </Svg>
  );
}

export function ChartIcon({ color, size }: IconProps) {
  const { color: c, size: s } = D({ color, size });
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M3 3v18h18" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M7 16l4-4 4 4 4-7" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function BudgetIcon({ color, size }: IconProps) {
  const { color: c, size: s } = D({ color, size });
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={c} strokeWidth="1.5" />
      <Path d="M12 7v1m0 8v1M9.5 9.5C9.5 8.4 10.6 8 12 8s2.5.4 2.5 1.5S13.4 11 12 11s-2.5.6-2.5 1.5S10.6 14 12 14s2.5.4 2.5 1.5" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

export function GoalIcon({ color, size }: IconProps) {
  const { color: c, size: s } = D({ color, size });
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={c} strokeWidth="1.5" />
      <Circle cx="12" cy="12" r="4" stroke={c} strokeWidth="1.5" />
      <Circle cx="12" cy="12" r="1" fill={c} />
    </Svg>
  );
}

export function NetWorthIcon({ color, size }: IconProps) {
  const { color: c, size: s } = D({ color, size });
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke={c} strokeWidth="1.5" />
      <Polyline points="9 22 9 12 15 12 15 22" stroke={c} strokeWidth="1.5" />
    </Svg>
  );
}

export function RecurIcon({ color, size }: IconProps) {
  const { color: c, size: s } = D({ color, size });
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M17 1l4 4-4 4" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3 11V9a4 4 0 0 1 4-4h14" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M7 23l-4-4 4-4" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M21 13v2a4 4 0 0 1-4 4H3" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

export function MoreIcon({ color, size }: IconProps) {
  const { color: c, size: s } = D({ color, size });
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Circle cx="5" cy="12" r="1.5" fill={c} />
      <Circle cx="12" cy="12" r="1.5" fill={c} />
      <Circle cx="19" cy="12" r="1.5" fill={c} />
    </Svg>
  );
}

export function PlusIcon({ color, size }: IconProps) {
  const { color: c, size: s } = D({ color, size });
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Line x1="12" y1="5" x2="12" y2="19" stroke={c} strokeWidth="2" strokeLinecap="round" />
      <Line x1="5" y1="12" x2="19" y2="12" stroke={c} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function LogoutIcon({ color, size }: IconProps) {
  const { color: c, size: s } = D({ color, size });
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      <Polyline points="16 17 21 12 16 7" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="21" y1="12" x2="9" y2="12" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

export function ChevronLeftIcon({ color, size }: IconProps) {
  const { color: c, size: s } = D({ color, size });
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M15 18l-6-6 6-6" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ChevronRightIcon({ color, size }: IconProps) {
  const { color: c, size: s } = D({ color, size });
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function TrashIcon({ color, size }: IconProps) {
  const { color: c, size: s } = D({ color, size });
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Polyline points="3 6 5 6 21 6" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M10 11v6M14 11v6" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

export function EditIcon({ color, size }: IconProps) {
  const { color: c, size: s } = D({ color, size });
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/icons/
git commit -m "feat: add SVG icon components"
```

---

### Task 11: StatCard and CategoryBar components

**Files:**
- Create: `components/StatCard.tsx`
- Create: `components/CategoryBar.tsx`

- [ ] **Step 1: Create `components/StatCard.tsx`**

```typescript
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../constants/theme';

interface StatCardProps {
  label: string;
  value: string | number;
  color?: string;
  sub?: string;
}

export function StatCard({ label, value, color = colors.text, sub }: StatCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color }]}>{value}</Text>
      {!!sub && <Text style={styles.sub}>{sub}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card:  { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, flex: 1 },
  label: { fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  value: { fontSize: 20, fontFamily: 'PlusJakartaSans_700Bold' },
  sub:   { fontSize: 11, fontFamily: 'PlusJakartaSans_400Regular', color: colors.muted, marginTop: 4 },
});
```

- [ ] **Step 2: Create `components/CategoryBar.tsx`**

```typescript
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../constants/theme';
import { fmtFull } from '../lib/format';

interface CategoryBarProps {
  label: string;
  color: string;
  spent: number;
  budget?: number;
  showBudget?: boolean;
}

export function CategoryBar({ label, color, spent, budget, showBudget = false }: CategoryBarProps) {
  const pct = budget && budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
  const over = !!budget && spent > budget;
  const barColor = over ? colors.red : pct >= 80 ? colors.yellow : color;

  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.label}>{label}</Text>
          <Text style={[styles.amount, over && { color: colors.red }]}>{fmtFull(spent)}</Text>
        </View>
        {showBudget && !!budget && (
          <>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${pct}%` as any, backgroundColor: barColor }]} />
            </View>
            <Text style={styles.budgetText}>
              {fmtFull(budget)} budget · {over ? 'over by ' + fmtFull(spent - budget) : fmtFull(budget - spent) + ' left'}
            </Text>
          </>
        )}
        {!showBudget && (
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${pct || 30}%` as any, backgroundColor: color, opacity: 0.6 }]} />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row:        { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.sm },
  dot:        { width: 8, height: 8, borderRadius: 4, marginTop: 6, marginRight: spacing.sm, flexShrink: 0 },
  content:    { flex: 1 },
  topRow:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label:      { fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium', color: colors.text },
  amount:     { fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.text },
  track:      { height: 4, backgroundColor: colors.border, borderRadius: radius.sm, overflow: 'hidden' },
  fill:       { height: 4, borderRadius: radius.sm },
  budgetText: { fontSize: 11, fontFamily: 'PlusJakartaSans_400Regular', color: colors.muted, marginTop: 3 },
});
```

- [ ] **Step 3: Commit**

```bash
git add components/StatCard.tsx components/CategoryBar.tsx
git commit -m "feat: add StatCard and CategoryBar components"
```

---

### Task 12: AddModal (Add/Edit Transaction)

**Files:**
- Create: `components/AddModal.tsx`

- [ ] **Step 1: Create `components/AddModal.tsx`**

```typescript
import { useState, useEffect } from 'react';
import {
  Modal, KeyboardAvoidingView, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { colors, radius, spacing } from '../constants/theme';
import { EXPENSE_CATS, INCOME_CATS } from '../constants/categories';
import { Transaction, TxnType, uid } from '../lib/data';
import { getCurrency } from '../lib/format';

interface AddModalProps {
  visible: boolean;
  editItem?: Transaction | null;
  onClose: () => void;
  onSave: (t: Transaction) => void;
}

export function AddModal({ visible, editItem, onClose, onSave }: AddModalProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [type, setType]         = useState<TxnType>('expense');
  const [amount, setAmount]     = useState('');
  const [category, setCategory] = useState('essentials');
  const [desc, setDesc]         = useState('');
  const [date, setDate]         = useState(today);
  const [notes, setNotes]       = useState('');
  const [tags, setTags]         = useState('');

  useEffect(() => {
    if (editItem) {
      setType(editItem.type);
      setAmount(String(editItem.amount));
      setCategory(editItem.category);
      setDesc(editItem.description);
      setDate(editItem.date);
      setNotes(editItem.notes || '');
      setTags(editItem.tags?.join(', ') || '');
    } else {
      setType('expense');
      setAmount('');
      setCategory('essentials');
      setDesc('');
      setDate(today);
      setNotes('');
      setTags('');
    }
  }, [editItem, visible]);

  useEffect(() => {
    setCategory(type === 'expense' ? 'essentials' : 'salary');
  }, [type]);

  const cats = type === 'expense' ? EXPENSE_CATS : INCOME_CATS;
  const sym = getCurrency().symbol;

  function handleSave() {
    const n = parseFloat(amount);
    if (isNaN(n) || n <= 0 || !desc.trim()) return;
    const tagArr = tags.split(',').map(t => t.trim()).filter(Boolean);
    onSave({
      id: editItem?.id || uid(),
      type, amount: n, category,
      description: desc.trim(),
      date, notes: notes.trim(),
      tags: tagArr,
      recurringId: editItem?.recurringId,
      auto: editItem?.auto,
    });
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <KeyboardAvoidingView
        style={styles.sheet}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView keyboardShouldPersistTaps="handled">
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>{editItem ? 'Edit' : 'Add'} Transaction</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeX}>×</Text>
            </Pressable>
          </View>

          {/* Type toggle */}
          <View style={styles.toggle}>
            {(['expense', 'income'] as TxnType[]).map(t => (
              <Pressable
                key={t}
                onPress={() => setType(t)}
                style={[
                  styles.toggleBtn,
                  type === t && { backgroundColor: t === 'expense' ? colors.red : colors.green },
                ]}
              >
                <Text style={[styles.toggleText, type === t && styles.toggleTextActive]}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Amount ({sym})</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            placeholder="0"
            placeholderTextColor={colors.muted}
            keyboardType="decimal-pad"
          />

          <Text style={styles.label}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            {cats.map(c => (
              <Pressable
                key={c.id}
                onPress={() => setCategory(c.id)}
                style={[
                  styles.catChip,
                  category === c.id && { backgroundColor: c.color + '33', borderColor: c.color },
                ]}
              >
                <View style={[styles.catDot, { backgroundColor: c.color }]} />
                <Text style={[styles.catLabel, category === c.id && { color: c.color }]}>{c.label}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={styles.input}
            value={desc}
            onChangeText={setDesc}
            placeholder="What was this for?"
            placeholderTextColor={colors.muted}
          />

          <Text style={styles.label}>Date</Text>
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.muted}
          />

          <Text style={styles.label}>Notes (optional)</Text>
          <TextInput
            style={[styles.input, { height: 72, textAlignVertical: 'top' }]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Any additional notes..."
            placeholderTextColor={colors.muted}
            multiline
          />

          <Text style={styles.label}>Tags (comma separated)</Text>
          <TextInput
            style={styles.input}
            value={tags}
            onChangeText={setTags}
            placeholder="e.g. work, personal"
            placeholderTextColor={colors.muted}
          />

          <Pressable style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>{editItem ? 'Save Changes' : 'Add Transaction'}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet:          { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%', paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  handle:         { width: 36, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginVertical: spacing.sm },
  header:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title:          { fontSize: 18, fontFamily: 'PlusJakartaSans_700Bold', color: colors.text },
  closeBtn:       { width: 32, height: 32, borderRadius: 8, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  closeX:         { fontSize: 20, color: colors.muted, lineHeight: 24 },
  toggle:         { flexDirection: 'row', backgroundColor: colors.surface2, borderRadius: radius.md, padding: 4, marginBottom: 20 },
  toggleBtn:      { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  toggleText:     { fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.muted, textTransform: 'capitalize' },
  toggleTextActive: { color: '#fff' },
  label:          { fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  input:          { backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.sm, color: colors.text, fontSize: 14, fontFamily: 'PlusJakartaSans_400Regular', marginBottom: 16 },
  catChip:        { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12, marginRight: 8, backgroundColor: colors.surface2 },
  catDot:         { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  catLabel:       { fontSize: 12, fontFamily: 'PlusJakartaSans_500Medium', color: colors.muted },
  saveBtn:        { backgroundColor: colors.accent, borderRadius: radius.md, padding: spacing.md, alignItems: 'center', marginTop: spacing.sm, marginBottom: spacing.lg },
  saveBtnText:    { color: '#fff', fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold' },
});
```

- [ ] **Step 2: Commit**

```bash
git add components/AddModal.tsx
git commit -m "feat: add AddModal component for transactions"
```

---

### Task 13: Responsive navigation layout

**Files:**
- Create: `components/SidebarNav.tsx`
- Create: `components/BottomNav.tsx`
- Create: `app/(tabs)/_layout.tsx`
- Create: `app/(tabs)/more.tsx` (placeholder for now, completed in Task 22)

- [ ] **Step 1: Create `components/SidebarNav.tsx`**

```typescript
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { colors, radius, spacing, SIDEBAR_W } from '../constants/theme';
import { CURRENCIES } from '../constants/categories';
import { useFinanceContext } from '../hooks/FinanceContext';
import {
  GridIcon, ListIcon, CalIcon, ChartIcon, BudgetIcon,
  GoalIcon, NetWorthIcon, RecurIcon, LogoutIcon, PlusIcon,
} from './icons';

const NAV_ITEMS = [
  { href: '/(tabs)/',             label: 'Dashboard',      Icon: GridIcon },
  { href: '/(tabs)/monthly',      label: 'Monthly Report', Icon: CalIcon },
  { href: '/(tabs)/yearly',       label: 'Yearly Report',  Icon: ChartIcon },
  { href: '/(tabs)/budgets',      label: 'Budgets',        Icon: BudgetIcon },
  { href: '/(tabs)/goals',        label: 'Savings Goals',  Icon: GoalIcon },
  { href: '/(tabs)/networth',     label: 'Net Worth',      Icon: NetWorthIcon },
  { href: '/(tabs)/recurring',    label: 'Recurring',      Icon: RecurIcon },
  { href: '/(tabs)/transactions', label: 'Transactions',   Icon: ListIcon },
];

export function SidebarNav({ onAdd }: { onAdd: () => void }) {
  const router   = useRouter();
  const pathname = usePathname();
  const { user, logout, currency, setCurrencyPref } = useFinanceContext();

  return (
    <View style={styles.sidebar}>
      <View style={styles.brandWrap}>
        <Text style={styles.brandSub}>Personal</Text>
        <Text style={styles.brandTitle}>Finance</Text>
      </View>

      {/* User pill */}
      <View style={styles.userPill}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.userName} numberOfLines={1}>{user}</Text>
          <Text style={styles.userSub}>Signed in</Text>
        </View>
        <Pressable onPress={logout} style={styles.logoutBtn}>
          <LogoutIcon size={14} />
        </Pressable>
      </View>

      {/* Nav items */}
      <ScrollView style={styles.nav} showsVerticalScrollIndicator={false}>
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = pathname === href || (href === '/(tabs)/' && pathname === '/');
          return (
            <Pressable
              key={href}
              onPress={() => router.push(href as any)}
              style={[styles.navItem, active && styles.navItemActive]}
            >
              <Icon color={active ? colors.accent : colors.muted} size={16} />
              <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Currency picker */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.currencyRow}>
        {CURRENCIES.map(c => (
          <Pressable
            key={c.code}
            onPress={() => setCurrencyPref(c)}
            style={[styles.currChip, currency.code === c.code && styles.currChipActive]}
          >
            <Text style={[styles.currText, currency.code === c.code && { color: colors.accent }]}>
              {c.symbol} {c.code}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Add button */}
      <Pressable style={styles.addBtn} onPress={onAdd}>
        <PlusIcon color="#fff" size={16} />
        <Text style={styles.addBtnText}>Add Transaction</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar:        { width: SIDEBAR_W, backgroundColor: colors.surface, borderRightWidth: 1, borderColor: colors.border, flexShrink: 0, height: '100%' },
  brandWrap:      { padding: spacing.lg, paddingBottom: spacing.md },
  brandSub:       { fontSize: 10, fontFamily: 'PlusJakartaSans_700Bold', letterSpacing: 2, color: colors.muted, textTransform: 'uppercase' },
  brandTitle:     { fontSize: 20, fontFamily: 'PlusJakartaSans_800ExtraBold', color: colors.text },
  userPill:       { marginHorizontal: 12, marginBottom: 12, padding: 10, backgroundColor: colors.surface2, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatar:         { width: 28, height: 28, borderRadius: 8, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  avatarText:     { color: '#fff', fontSize: 12, fontFamily: 'PlusJakartaSans_700Bold' },
  userName:       { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.text },
  userSub:        { fontSize: 10, color: colors.muted },
  logoutBtn:      { padding: 4 },
  nav:            { flex: 1, paddingHorizontal: 12 },
  navItem:        { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: radius.md, marginBottom: 2 },
  navItemActive:  { backgroundColor: colors.accentDim },
  navLabel:       { fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium', color: colors.muted },
  navLabelActive: { color: colors.accent, fontFamily: 'PlusJakartaSans_600SemiBold' },
  currencyRow:    { paddingHorizontal: 12, paddingVertical: 8 },
  currChip:       { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: colors.border, marginRight: 6 },
  currChipActive: { borderColor: colors.accent, backgroundColor: colors.accentDim },
  currText:       { fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.muted },
  addBtn:         { margin: 12, backgroundColor: colors.accent, borderRadius: radius.md, padding: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  addBtnText:     { color: '#fff', fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold' },
});
```

- [ ] **Step 2: Create `components/BottomNav.tsx`**

```typescript
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { colors, spacing } from '../constants/theme';
import { GridIcon, ListIcon, BudgetIcon, CalIcon, MoreIcon } from './icons';

const TABS = [
  { href: '/(tabs)/',             label: 'Dashboard',    Icon: GridIcon },
  { href: '/(tabs)/monthly',      label: 'Monthly',      Icon: CalIcon },
  { href: '/(tabs)/budgets',      label: 'Budgets',      Icon: BudgetIcon },
  { href: '/(tabs)/transactions', label: 'Transactions', Icon: ListIcon },
  { href: '/(tabs)/more',         label: 'More',         Icon: MoreIcon },
];

export function BottomNav() {
  const router   = useRouter();
  const pathname = usePathname();

  return (
    <View style={styles.bar}>
      {TABS.map(({ href, label, Icon }) => {
        const active = pathname === href || (href === '/(tabs)/' && pathname === '/');
        return (
          <Pressable key={href} onPress={() => router.push(href as any)} style={styles.tab}>
            <Icon color={active ? colors.accent : colors.muted} size={20} />
            <Text style={[styles.label, active && { color: colors.accent }]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar:   { flexDirection: 'row', backgroundColor: colors.surface, borderTopWidth: 1, borderColor: colors.border, paddingBottom: spacing.sm },
  tab:   { flex: 1, alignItems: 'center', paddingTop: spacing.sm, gap: 3 },
  label: { fontSize: 10, fontFamily: 'PlusJakartaSans_500Medium', color: colors.muted },
});
```

- [ ] **Step 3: Create `app/(tabs)/_layout.tsx`**

```typescript
import { useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { Slot } from 'expo-router';
import { colors, WIDE_BREAKPOINT } from '../../constants/theme';
import { SidebarNav } from '../../components/SidebarNav';
import { BottomNav } from '../../components/BottomNav';
import { AddModal } from '../../components/AddModal';
import { useFinanceContext } from '../../hooks/FinanceContext';

export default function TabsLayout() {
  const { width }    = useWindowDimensions();
  const isWide       = width >= WIDE_BREAKPOINT;
  const { addTxn, editTxn } = useFinanceContext();
  const [modalOpen, setModalOpen]   = useState(false);
  const [editItem, setEditItem]     = useState(null);

  function handleSave(t: any) {
    if (editItem) editTxn(t); else addTxn(t);
    setEditItem(null);
  }

  return (
    <View style={[styles.root, { flexDirection: isWide ? 'row' : 'column' }]}>
      {isWide && <SidebarNav onAdd={() => setModalOpen(true)} />}
      <View style={styles.content}>
        <Slot />
      </View>
      {!isWide && <BottomNav />}
      <AddModal
        visible={modalOpen}
        editItem={editItem}
        onClose={() => { setModalOpen(false); setEditItem(null); }}
        onSave={handleSave}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, overflow: 'hidden' },
});
```

Note: The `editItem` and `setEditItem` need to be accessible to child screens. Add these to `FinanceContext` in the next step.

- [ ] **Step 4: Expose `openEdit` via context — update `hooks/FinanceContext.tsx`**

Replace `hooks/FinanceContext.tsx` with:
```typescript
import React, { createContext, useContext, useState } from 'react';
import { FinanceState, useFinance } from './useFinance';
import { Transaction } from '../lib/data';

interface FinanceContextValue extends FinanceState {
  openAdd: () => void;
  openEdit: (t: Transaction) => void;
  modalVisible: boolean;
  editItem: Transaction | null;
  closeModal: () => void;
}

const FinanceContext = createContext<FinanceContextValue | null>(null);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const finance = useFinance();
  const [modalVisible, setModalVisible] = useState(false);
  const [editItem, setEditItem]         = useState<Transaction | null>(null);

  function openAdd()              { setEditItem(null); setModalVisible(true); }
  function openEdit(t: Transaction) { setEditItem(t); setModalVisible(true); }
  function closeModal()           { setModalVisible(false); setEditItem(null); }

  return (
    <FinanceContext.Provider value={{ ...finance, openAdd, openEdit, modalVisible, editItem, closeModal }}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinanceContext(): FinanceContextValue {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinanceContext must be used within FinanceProvider');
  return ctx;
}
```

- [ ] **Step 5: Update `app/(tabs)/_layout.tsx` to use context modal state**

Replace `app/(tabs)/_layout.tsx` with:
```typescript
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { Slot } from 'expo-router';
import { colors, WIDE_BREAKPOINT } from '../../constants/theme';
import { SidebarNav } from '../../components/SidebarNav';
import { BottomNav } from '../../components/BottomNav';
import { AddModal } from '../../components/AddModal';
import { useFinanceContext } from '../../hooks/FinanceContext';

export default function TabsLayout() {
  const { width } = useWindowDimensions();
  const isWide    = width >= WIDE_BREAKPOINT;
  const { addTxn, editTxn, modalVisible, editItem, closeModal, openAdd } = useFinanceContext();

  function handleSave(t: any) {
    if (editItem) editTxn(t); else addTxn(t);
    closeModal();
  }

  return (
    <View style={[styles.root, { flexDirection: isWide ? 'row' : 'column' }]}>
      {isWide && <SidebarNav onAdd={openAdd} />}
      <View style={styles.content}>
        <Slot />
      </View>
      {!isWide && <BottomNav />}
      <AddModal
        visible={modalVisible}
        editItem={editItem}
        onClose={closeModal}
        onSave={handleSave}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, overflow: 'hidden' },
});
```

- [ ] **Step 6: Create `app/(tabs)/more.tsx` placeholder**

```typescript
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, radius, spacing } from '../../constants/theme';
import { ChartIcon, GoalIcon, NetWorthIcon, RecurIcon } from '../../components/icons';

const MORE_ITEMS = [
  { href: '/(tabs)/yearly',    label: 'Yearly Report',         sub: 'Annual income & expense summary',    Icon: ChartIcon },
  { href: '/(tabs)/goals',     label: 'Savings Goals',         sub: 'Track progress toward your goals',   Icon: GoalIcon },
  { href: '/(tabs)/networth',  label: 'Net Worth',             sub: 'Assets minus liabilities',           Icon: NetWorthIcon },
  { href: '/(tabs)/recurring', label: 'Recurring Transactions', sub: 'Manage auto-applied transactions',  Icon: RecurIcon },
];

export default function MoreScreen() {
  const router = useRouter();
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>More</Text>
      {MORE_ITEMS.map(({ href, label, sub, Icon }) => (
        <Pressable key={href} onPress={() => router.push(href as any)} style={styles.row}>
          <View style={styles.iconWrap}>
            <Icon color={colors.accent} size={20} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowLabel}>{label}</Text>
            <Text style={styles.rowSub}>{sub}</Text>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg },
  heading: { fontSize: 22, fontFamily: 'PlusJakartaSans_800ExtraBold', color: colors.text, marginBottom: spacing.lg },
  row:     { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.sm, gap: spacing.md },
  iconWrap:{ width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.accentDim, alignItems: 'center', justifyContent: 'center' },
  rowLabel:{ fontSize: 15, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.text },
  rowSub:  { fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', color: colors.muted, marginTop: 2 },
});
```

- [ ] **Step 7: Verify navigation works on web**

```bash
npx expo start --web
```
Expected: After login, sidebar appears on wide screen. Clicking nav items routes to blank screens (not built yet). Bottom tabs appear on narrow window.

- [ ] **Step 8: Commit**

```bash
git add components/SidebarNav.tsx components/BottomNav.tsx app/\(tabs\)/
git commit -m "feat: add responsive navigation layout (sidebar + bottom tabs)"
```

---

### Task 14: Dashboard Screen

**Files:**
- Create: `app/(tabs)/index.tsx`

- [ ] **Step 1: Write failing test**

```typescript
// __tests__/dashboard.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import DashboardScreen from '../app/(tabs)/index';
import { FinanceContext } from '../hooks/FinanceContext';

const mockCtx = {
  txns: [
    { id:'1', type:'income',  amount:5000, category:'salary', description:'Jan pay', date:'2026-01-15', auto:false },
    { id:'2', type:'expense', amount:1200, category:'food',   description:'Groceries', date:'2026-01-20', auto:false },
  ],
  budgets: {},
  goals: [], nw: { assets:[], liabilities:[] }, recurring: [],
  currency: { code:'USD', symbol:'$', locale:'en-US' },
  user: 'alice',
  addTxn: jest.fn(), editTxn: jest.fn(), deleteTxn: jest.fn(),
  setBudgets: jest.fn(), setGoals: jest.fn(), setNw: jest.fn(),
  setRecurring: jest.fn(), setCurrencyPref: jest.fn(),
  login: jest.fn(), logout: jest.fn(),
  openAdd: jest.fn(), openEdit: jest.fn(),
  modalVisible: false, editItem: null, closeModal: jest.fn(),
};

it('shows income and expense stat cards', () => {
  render(<FinanceContext.Provider value={mockCtx as any}><DashboardScreen /></FinanceContext.Provider>);
  expect(screen.getByText('Total Income')).toBeTruthy();
  expect(screen.getByText('Total Expenses')).toBeTruthy();
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest __tests__/dashboard.test.tsx --no-coverage
```
Expected: FAIL — cannot find module `../app/(tabs)/index`

- [ ] **Step 3: Implement Dashboard screen**

Create `app/(tabs)/index.tsx`:

```typescript
import React, { useMemo } from 'react';
import { View, Text, FlatList, Pressable, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { useFinance } from '../../hooks/FinanceContext';
import StatCard from '../../components/StatCard';
import CategoryBar from '../../components/CategoryBar';
import { colors, spacing, radius, WIDE_BREAKPOINT } from '../../constants/theme';
import { fmt, fmtFull } from '../../lib/format';
import { resolveLimit, EXPENSE_CATS } from '../../lib/data';
import { TrashIcon, EditIcon } from '../../components/icons';

export default function DashboardScreen() {
  const { txns, budgets, currency, openEdit, deleteTxn } = useFinance();
  const { width } = useWindowDimensions();
  const wide = width >= WIDE_BREAKPOINT;

  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const { income, expenses, monthTxns } = useMemo(() => {
    const monthTxns = txns.filter(t => t.date.startsWith(ym));
    const income   = monthTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expenses = monthTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { income, expenses, monthTxns };
  }, [txns, ym]);

  const savings = income - expenses;
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const forecast = (expenses / now.getDate()) * daysInMonth;

  const recent = [...txns].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);

  const alerts = useMemo(() => {
    return EXPENSE_CATS.filter(cat => {
      const limit = resolveLimit(budgets[cat.id], income);
      if (!limit) return false;
      const spent = monthTxns.filter(t => t.type === 'expense' && t.category === cat.id)
        .reduce((s, t) => s + t.amount, 0);
      return spent / limit >= 0.8;
    }).map(cat => {
      const limit = resolveLimit(budgets[cat.id], income)!;
      const spent = monthTxns.filter(t => t.type === 'expense' && t.category === cat.id)
        .reduce((s, t) => s + t.amount, 0);
      return { cat, spent, limit, over: spent > limit };
    });
  }, [budgets, monthTxns, income]);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Dashboard</Text>
      <Text style={styles.sub}>{now.toLocaleString('default', { month: 'long', year: 'numeric' })}</Text>

      {/* Stat cards */}
      <View style={[styles.grid, wide && styles.gridWide]}>
        <StatCard label="Total Income"    value={fmtFull(income,   currency)} color={colors.green}  />
        <StatCard label="Total Expenses"  value={fmtFull(expenses, currency)} color={colors.red}    />
        <StatCard label="Net Savings"     value={fmtFull(savings,  currency)} color={savings >= 0 ? colors.green : colors.red} />
        <StatCard label="Transactions"    value={String(monthTxns.length)}    color={colors.blue}   />
      </View>

      {/* Forecast */}
      <View style={styles.forecastRow}>
        <Text style={styles.forecastLabel}>Spending forecast this month</Text>
        <Text style={styles.forecastValue}>{fmtFull(forecast, currency)}</Text>
      </View>

      {/* Budget alerts */}
      {alerts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Budget Alerts</Text>
          {alerts.map(({ cat, spent, limit, over }) => (
            <CategoryBar
              key={cat.id}
              label={cat.label}
              color={over ? colors.red : colors.yellow}
              spent={spent}
              budget={limit}
              showBudget
            />
          ))}
        </View>
      )}

      {/* Recent transactions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        {recent.map(t => (
          <View key={t.id} style={styles.txnRow}>
            <View style={styles.txnLeft}>
              <Text style={styles.txnDesc}>{t.description}</Text>
              <Text style={styles.txnMeta}>{t.category} · {t.date}</Text>
            </View>
            <Text style={[styles.txnAmt, { color: t.type === 'income' ? colors.green : colors.red }]}>
              {t.type === 'income' ? '+' : '-'}{fmt(t.amount, currency)}
            </Text>
            <Pressable onPress={() => openEdit(t)} style={styles.iconBtn}><EditIcon size={16} color={colors.muted} /></Pressable>
            <Pressable onPress={() => deleteTxn(t.id)} style={styles.iconBtn}><TrashIcon size={16} color={colors.muted} /></Pressable>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: colors.bg },
  content:     { padding: spacing.md, paddingBottom: spacing.xl * 2 },
  heading:     { fontSize: 22, fontFamily: 'PlusJakartaSans_800ExtraBold', color: colors.text, marginBottom: 2 },
  sub:         { fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', color: colors.muted, marginBottom: spacing.md },
  grid:        { gap: spacing.sm, marginBottom: spacing.md },
  gridWide:    { flexDirection: 'row', flexWrap: 'wrap' },
  forecastRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                 backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1,
                 borderColor: colors.border, padding: spacing.md, marginBottom: spacing.md },
  forecastLabel:{ fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', color: colors.muted },
  forecastValue:{ fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', color: colors.accent },
  section:     { marginBottom: spacing.md },
  sectionTitle:{ fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: colors.muted,
                 textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing.sm },
  txnRow:      { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
                 borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
                 padding: spacing.sm, marginBottom: spacing.xs, gap: spacing.xs },
  txnLeft:     { flex: 1 },
  txnDesc:     { fontSize: 14, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.text },
  txnMeta:     { fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', color: colors.muted, marginTop: 2 },
  txnAmt:      { fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', marginHorizontal: spacing.xs },
  iconBtn:     { padding: 6 },
});
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest __tests__/dashboard.test.tsx --no-coverage
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/\(tabs\)/index.tsx __tests__/dashboard.test.tsx
git commit -m "feat: add Dashboard screen"
```

---

### Task 15: All Transactions Screen

**Files:**
- Create: `app/(tabs)/transactions.tsx`

- [ ] **Step 1: Write failing test**

```typescript
// __tests__/transactions.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import TransactionsScreen from '../app/(tabs)/transactions';
import { FinanceContext } from '../hooks/FinanceContext';

const txns = [
  { id:'1', type:'income',  amount:5000, category:'salary', description:'January salary', date:'2026-01-15', auto:false },
  { id:'2', type:'expense', amount:300,  category:'food',   description:'Weekly shop',    date:'2026-01-20', auto:false },
];
const mockCtx = {
  txns, budgets:{}, goals:[], nw:{assets:[],liabilities:[]}, recurring:[],
  currency:{ code:'USD', symbol:'$', locale:'en-US' }, user:'alice',
  addTxn:jest.fn(), editTxn:jest.fn(), deleteTxn:jest.fn(),
  setBudgets:jest.fn(), setGoals:jest.fn(), setNw:jest.fn(),
  setRecurring:jest.fn(), setCurrencyPref:jest.fn(),
  login:jest.fn(), logout:jest.fn(),
  openAdd:jest.fn(), openEdit:jest.fn(),
  modalVisible:false, editItem:null, closeModal:jest.fn(),
};

it('renders transactions and filters by type', () => {
  render(<FinanceContext.Provider value={mockCtx as any}><TransactionsScreen /></FinanceContext.Provider>);
  expect(screen.getByText('January salary')).toBeTruthy();
  expect(screen.getByText('Weekly shop')).toBeTruthy();
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest __tests__/transactions.test.tsx --no-coverage
```
Expected: FAIL — cannot find module `../app/(tabs)/transactions`

- [ ] **Step 3: Implement Transactions screen**

Create `app/(tabs)/transactions.tsx`:

```typescript
import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, FlatList, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { useFinance } from '../../hooks/FinanceContext';
import { colors, spacing, radius, WIDE_BREAKPOINT } from '../../constants/theme';
import { fmt } from '../../lib/format';
import { EXPENSE_CATS, INCOME_CATS } from '../../lib/data';
import { TrashIcon, EditIcon } from '../../components/icons';

const ALL_CATS = [...EXPENSE_CATS, ...INCOME_CATS];

export default function TransactionsScreen() {
  const { txns, currency, openEdit, deleteTxn } = useFinance();
  const { width } = useWindowDimensions();
  const wide = width >= WIDE_BREAKPOINT;

  const [search, setSearch]     = useState('');
  const [typeFilter, setType]   = useState<'all' | 'income' | 'expense'>('all');
  const [catFilter, setCat]     = useState('all');
  const [monthFilter, setMonth] = useState('all');

  const months = useMemo(() => {
    const set = new Set(txns.map(t => t.date.slice(0, 7)));
    return ['all', ...Array.from(set).sort().reverse()];
  }, [txns]);

  const filtered = useMemo(() => {
    return txns
      .filter(t => typeFilter === 'all' || t.type === typeFilter)
      .filter(t => catFilter === 'all'  || t.category === catFilter)
      .filter(t => monthFilter === 'all' || t.date.startsWith(monthFilter))
      .filter(t => !search || t.description.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [txns, typeFilter, catFilter, monthFilter, search]);

  return (
    <View style={styles.root}>
      <Text style={styles.heading}>All Transactions</Text>

      {/* Search */}
      <TextInput
        style={styles.search}
        placeholder="Search transactions…"
        placeholderTextColor={colors.muted}
        value={search}
        onChangeText={setSearch}
      />

      {/* Type filter chips */}
      <View style={styles.chips}>
        {(['all', 'income', 'expense'] as const).map(v => (
          <Pressable key={v} onPress={() => setType(v)}
            style={[styles.chip, typeFilter === v && styles.chipActive]}>
            <Text style={[styles.chipText, typeFilter === v && styles.chipTextActive]}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={t => t.id}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xl * 2 }}
        ListEmptyComponent={<Text style={styles.empty}>No transactions found.</Text>}
        renderItem={({ item: t }) => (
          <View style={[styles.row, wide && styles.rowWide]}>
            <View style={styles.rowLeft}>
              <Text style={styles.desc}>{t.description}</Text>
              <Text style={styles.meta}>{t.category} · {t.date}</Text>
              {t.tags && t.tags.length > 0 && (
                <View style={styles.tags}>
                  {t.tags.map(tag => (
                    <View key={tag} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
            <Text style={[styles.amt, { color: t.type === 'income' ? colors.green : colors.red }]}>
              {t.type === 'income' ? '+' : '-'}{fmt(t.amount, currency)}
            </Text>
            <Pressable onPress={() => openEdit(t)} style={styles.iconBtn}>
              <EditIcon size={16} color={colors.muted} />
            </Pressable>
            <Pressable onPress={() => deleteTxn(t.id)} style={styles.iconBtn}>
              <TrashIcon size={16} color={colors.muted} />
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: colors.bg },
  heading:       { fontSize: 22, fontFamily: 'PlusJakartaSans_800ExtraBold', color: colors.text,
                   padding: spacing.md, paddingBottom: spacing.xs },
  search:        { margin: spacing.md, marginTop: 0, backgroundColor: colors.surface,
                   borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
                   color: colors.text, padding: spacing.sm, fontSize: 14,
                   fontFamily: 'PlusJakartaSans_400Regular' },
  chips:         { flexDirection: 'row', gap: spacing.xs, paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  chip:          { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.xl,
                   backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  chipActive:    { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText:      { fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.muted },
  chipTextActive:{ color: '#fff' },
  row:           { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
                   borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
                   padding: spacing.sm, marginBottom: spacing.xs, gap: spacing.xs },
  rowWide:       { paddingHorizontal: spacing.md },
  rowLeft:       { flex: 1 },
  desc:          { fontSize: 14, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.text },
  meta:          { fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', color: colors.muted, marginTop: 2 },
  tags:          { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  tag:           { backgroundColor: colors.accentDim, borderRadius: radius.sm, paddingHorizontal: 6, paddingVertical: 2 },
  tagText:       { fontSize: 11, fontFamily: 'PlusJakartaSans_400Regular', color: colors.accent },
  amt:           { fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', marginHorizontal: spacing.xs },
  iconBtn:       { padding: 6 },
  empty:         { textAlign: 'center', color: colors.muted, marginTop: spacing.xl,
                   fontFamily: 'PlusJakartaSans_400Regular' },
});
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest __tests__/transactions.test.tsx --no-coverage
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/\(tabs\)/transactions.tsx __tests__/transactions.test.tsx
git commit -m "feat: add All Transactions screen"
```

---

### Task 16: Budget Planner Screen

**Files:**
- Create: `app/(tabs)/budgets.tsx`

- [ ] **Step 1: Write failing test**

```typescript
// __tests__/budgets.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import BudgetsScreen from '../app/(tabs)/budgets';
import { FinanceContext } from '../hooks/FinanceContext';

const mockCtx = {
  txns: [{ id:'1', type:'income', amount:5000, category:'salary', description:'Pay', date:'2026-01-15', auto:false }],
  budgets: { food: { mode: 'fixed', value: 600 } },
  goals:[], nw:{assets:[],liabilities:[]}, recurring:[],
  currency:{ code:'USD', symbol:'$', locale:'en-US' }, user:'alice',
  addTxn:jest.fn(), editTxn:jest.fn(), deleteTxn:jest.fn(),
  setBudgets:jest.fn(), setGoals:jest.fn(), setNw:jest.fn(),
  setRecurring:jest.fn(), setCurrencyPref:jest.fn(),
  login:jest.fn(), logout:jest.fn(),
  openAdd:jest.fn(), openEdit:jest.fn(),
  modalVisible:false, editItem:null, closeModal:jest.fn(),
};

it('shows budget planner heading and a category row', () => {
  render(<FinanceContext.Provider value={mockCtx as any}><BudgetsScreen /></FinanceContext.Provider>);
  expect(screen.getByText('Budget Planner')).toBeTruthy();
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest __tests__/budgets.test.tsx --no-coverage
```
Expected: FAIL — cannot find module `../app/(tabs)/budgets`

- [ ] **Step 3: Implement Budget Planner screen**

Create `app/(tabs)/budgets.tsx`:

```typescript
import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useFinance } from '../../hooks/FinanceContext';
import CategoryBar from '../../components/CategoryBar';
import { colors, spacing, radius } from '../../constants/theme';
import { fmt, fmtFull } from '../../lib/format';
import { resolveLimit, EXPENSE_CATS, BudgetMap } from '../../lib/data';

export default function BudgetsScreen() {
  const { txns, budgets, setBudgets, currency } = useFinance();
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft]     = useState('');
  const [draftMode, setDraftMode] = useState<'fixed' | 'pct'>('fixed');

  const now = new Date();
  const ym  = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const monthIncome = useMemo(() =>
    txns.filter(t => t.type === 'income' && t.date.startsWith(ym))
        .reduce((s, t) => s + t.amount, 0),
    [txns, ym]);

  const catData = useMemo(() => EXPENSE_CATS.map(cat => {
    const spent = txns
      .filter(t => t.type === 'expense' && t.category === cat.id && t.date.startsWith(ym))
      .reduce((s, t) => s + t.amount, 0);
    const limit = resolveLimit(budgets[cat.id], monthIncome);
    return { cat, spent, limit };
  }), [txns, budgets, monthIncome, ym]);

  const totalBudgeted = catData.reduce((s, { limit }) => s + (limit ?? 0), 0);
  const totalSpent    = catData.reduce((s, { spent }) => s + spent, 0);
  const overCount     = catData.filter(({ spent, limit }) => limit !== null && spent > limit).length;

  function startEdit(catId: string) {
    const entry = budgets[catId];
    setDraftMode(entry?.mode ?? 'fixed');
    setDraft(entry ? String(entry.value) : '');
    setEditing(catId);
  }

  function saveEdit(catId: string) {
    const val = parseFloat(draft);
    if (!isNaN(val) && val > 0) {
      setBudgets({ ...budgets, [catId]: { mode: draftMode, value: val } } as BudgetMap);
    } else {
      const next = { ...budgets };
      delete next[catId];
      setBudgets(next);
    }
    setEditing(null);
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Budget Planner</Text>
      <Text style={styles.income}>Monthly income: <Text style={styles.incomeVal}>{fmtFull(monthIncome, currency)}</Text></Text>

      {/* Summary strip */}
      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Budgeted</Text>
          <Text style={styles.summaryVal}>{fmt(totalBudgeted, currency)}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Spent</Text>
          <Text style={[styles.summaryVal, { color: totalSpent > totalBudgeted ? colors.red : colors.text }]}>
            {fmt(totalSpent, currency)}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Over Budget</Text>
          <Text style={[styles.summaryVal, { color: overCount > 0 ? colors.red : colors.green }]}>{overCount}</Text>
        </View>
      </View>

      {/* Category rows */}
      {catData.map(({ cat, spent, limit }) => (
        <View key={cat.id} style={styles.catCard}>
          <View style={styles.catHeader}>
            <View style={[styles.catDot, { backgroundColor: cat.color }]} />
            <Text style={styles.catName}>{cat.label}</Text>
            <Pressable onPress={() => startEdit(cat.id)} style={styles.editBtn}>
              <Text style={styles.editBtnText}>{limit ? 'Edit' : 'Set'}</Text>
            </Pressable>
          </View>

          {editing === cat.id ? (
            <View style={styles.editRow}>
              <Pressable
                onPress={() => setDraftMode(draftMode === 'fixed' ? 'pct' : 'fixed')}
                style={styles.modeBtn}>
                <Text style={styles.modeBtnText}>{draftMode === 'fixed' ? currency.symbol : '%'}</Text>
              </Pressable>
              <TextInput
                style={styles.editInput}
                keyboardType="numeric"
                value={draft}
                onChangeText={setDraft}
                placeholder={draftMode === 'fixed' ? 'Amount' : 'Percent'}
                placeholderTextColor={colors.muted}
                autoFocus
              />
              <Pressable onPress={() => saveEdit(cat.id)} style={styles.saveBtn}>
                <Text style={styles.saveBtnText}>Save</Text>
              </Pressable>
              <Pressable onPress={() => setEditing(null)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
            </View>
          ) : (
            <CategoryBar
              label=""
              color={cat.color}
              spent={spent}
              budget={limit ?? undefined}
              showBudget
            />
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:         { flex: 1, backgroundColor: colors.bg },
  content:      { padding: spacing.md, paddingBottom: spacing.xl * 2 },
  heading:      { fontSize: 22, fontFamily: 'PlusJakartaSans_800ExtraBold', color: colors.text, marginBottom: spacing.xs },
  income:       { fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', color: colors.muted, marginBottom: spacing.md },
  incomeVal:    { color: colors.green, fontFamily: 'PlusJakartaSans_600SemiBold' },
  summary:      { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.lg,
                  borderWidth: 1, borderColor: colors.border, padding: spacing.md,
                  marginBottom: spacing.md, gap: spacing.md },
  summaryItem:  { flex: 1, alignItems: 'center' },
  summaryLabel: { fontSize: 11, fontFamily: 'PlusJakartaSans_400Regular', color: colors.muted, marginBottom: 4 },
  summaryVal:   { fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold', color: colors.text },
  catCard:      { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1,
                  borderColor: colors.border, padding: spacing.md, marginBottom: spacing.sm },
  catHeader:    { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  catDot:       { width: 10, height: 10, borderRadius: 5, marginRight: spacing.sm },
  catName:      { flex: 1, fontSize: 14, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.text },
  editBtn:      { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.sm,
                  backgroundColor: colors.accentDim },
  editBtnText:  { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.accent },
  editRow:      { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  modeBtn:      { width: 36, height: 36, borderRadius: radius.sm, backgroundColor: colors.surface2,
                  alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  modeBtnText:  { fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: colors.accent },
  editInput:    { flex: 1, backgroundColor: colors.surface2, borderRadius: radius.sm, borderWidth: 1,
                  borderColor: colors.border, color: colors.text, padding: spacing.sm, fontSize: 14,
                  fontFamily: 'PlusJakartaSans_400Regular' },
  saveBtn:      { paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.sm,
                  backgroundColor: colors.accent },
  saveBtnText:  { fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', color: '#fff' },
  cancelBtn:    { paddingHorizontal: spacing.sm, paddingVertical: 8 },
  cancelBtnText:{ fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', color: colors.muted },
});
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest __tests__/budgets.test.tsx --no-coverage
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/\(tabs\)/budgets.tsx __tests__/budgets.test.tsx
git commit -m "feat: add Budget Planner screen"
```

---

### Task 17: Monthly Report Screen

**Files:**
- Create: `app/(tabs)/monthly.tsx`

- [ ] **Step 1: Write failing test**

```typescript
// __tests__/monthly.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import MonthlyScreen from '../app/(tabs)/monthly';
import { FinanceContext } from '../hooks/FinanceContext';

const mockCtx = {
  txns: [
    { id:'1', type:'income',  amount:5000, category:'salary', description:'Pay', date:'2026-01-15', auto:false },
    { id:'2', type:'expense', amount:300,  category:'food',   description:'Shop', date:'2026-01-20', auto:false },
  ],
  budgets:{}, goals:[], nw:{assets:[],liabilities:[]}, recurring:[],
  currency:{ code:'USD', symbol:'$', locale:'en-US' }, user:'alice',
  addTxn:jest.fn(), editTxn:jest.fn(), deleteTxn:jest.fn(),
  setBudgets:jest.fn(), setGoals:jest.fn(), setNw:jest.fn(),
  setRecurring:jest.fn(), setCurrencyPref:jest.fn(),
  login:jest.fn(), logout:jest.fn(),
  openAdd:jest.fn(), openEdit:jest.fn(),
  modalVisible:false, editItem:null, closeModal:jest.fn(),
};

it('renders Monthly Report heading', () => {
  render(<FinanceContext.Provider value={mockCtx as any}><MonthlyScreen /></FinanceContext.Provider>);
  expect(screen.getByText('Monthly Report')).toBeTruthy();
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest __tests__/monthly.test.tsx --no-coverage
```
Expected: FAIL — cannot find module `../app/(tabs)/monthly`

- [ ] **Step 3: Implement Monthly Report screen**

Create `app/(tabs)/monthly.tsx`:

```typescript
import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { VictoryBar, VictoryChart, VictoryAxis, VictoryGroup } from 'victory-native';
import { useFinance } from '../../hooks/FinanceContext';
import CategoryBar from '../../components/CategoryBar';
import { colors, spacing, radius } from '../../constants/theme';
import { fmt, fmtFull } from '../../lib/format';
import { EXPENSE_CATS } from '../../lib/data';
import { ChevronLeftIcon, ChevronRightIcon, EditIcon } from '../../components/icons';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function MonthlyScreen() {
  const { txns, currency, openEdit } = useFinance();
  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-indexed

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  const ym = `${year}-${String(month + 1).padStart(2, '0')}`;

  const { income, expenses, catBreakdown, monthTxns } = useMemo(() => {
    const monthTxns = txns.filter(t => t.date.startsWith(ym));
    const income    = monthTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expenses  = monthTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const catBreakdown = EXPENSE_CATS.map(cat => ({
      cat,
      spent: monthTxns.filter(t => t.type === 'expense' && t.category === cat.id)
                      .reduce((s, t) => s + t.amount, 0),
    })).filter(({ spent }) => spent > 0)
      .sort((a, b) => b.spent - a.spent);
    return { income, expenses, catBreakdown, monthTxns };
  }, [txns, ym]);

  // 6-month trend for chart
  const chartData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(year, month - 5 + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const inc = txns.filter(t => t.type === 'income'  && t.date.startsWith(key)).reduce((s, t) => s + t.amount, 0);
      const exp = txns.filter(t => t.type === 'expense' && t.date.startsWith(key)).reduce((s, t) => s + t.amount, 0);
      return { x: MONTHS[d.getMonth()], inc, exp };
    });
  }, [txns, year, month]);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Monthly Report</Text>

      {/* Month picker */}
      <View style={styles.picker}>
        <Pressable onPress={prevMonth} style={styles.arrow}><ChevronLeftIcon size={20} color={colors.text} /></Pressable>
        <Text style={styles.pickerLabel}>{MONTHS[month]} {year}</Text>
        <Pressable onPress={nextMonth} style={styles.arrow}><ChevronRightIcon size={20} color={colors.text} /></Pressable>
      </View>

      {/* Summary cards */}
      <View style={styles.row2}>
        <View style={[styles.card, { flex: 1 }]}>
          <Text style={styles.cardLabel}>Income</Text>
          <Text style={[styles.cardVal, { color: colors.green }]}>{fmtFull(income, currency)}</Text>
        </View>
        <View style={[styles.card, { flex: 1 }]}>
          <Text style={styles.cardLabel}>Expenses</Text>
          <Text style={[styles.cardVal, { color: colors.red }]}>{fmtFull(expenses, currency)}</Text>
        </View>
      </View>

      {/* Bar chart - 6 month trend */}
      <View style={styles.chartWrap}>
        <Text style={styles.sectionTitle}>6-Month Trend</Text>
        <VictoryChart height={200} padding={{ top: 10, bottom: 40, left: 50, right: 20 }}>
          <VictoryAxis style={{ tickLabels: { fill: colors.muted, fontSize: 10, fontFamily: 'PlusJakartaSans_400Regular' }, axis: { stroke: colors.border } }} />
          <VictoryAxis dependentAxis
            style={{ tickLabels: { fill: colors.muted, fontSize: 10, fontFamily: 'PlusJakartaSans_400Regular' }, axis: { stroke: colors.border }, grid: { stroke: colors.border, strokeDasharray: '4,4' } }}
            tickFormat={v => fmt(v, currency)}
          />
          <VictoryGroup offset={12}>
            <VictoryBar data={chartData} x="x" y="inc" style={{ data: { fill: colors.green, width: 10 } }} cornerRadius={{ top: 3 }} />
            <VictoryBar data={chartData} x="x" y="exp" style={{ data: { fill: colors.red,   width: 10 } }} cornerRadius={{ top: 3 }} />
          </VictoryGroup>
        </VictoryChart>
      </View>

      {/* Category breakdown */}
      {catBreakdown.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category Breakdown</Text>
          {catBreakdown.map(({ cat, spent }) => (
            <CategoryBar key={cat.id} label={cat.label} color={cat.color} spent={spent} />
          ))}
        </View>
      )}

      {/* Transactions list */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Transactions</Text>
        {monthTxns.sort((a, b) => b.date.localeCompare(a.date)).map(t => (
          <Pressable key={t.id} onPress={() => openEdit(t)} style={styles.txnRow}>
            <View style={styles.txnLeft}>
              <Text style={styles.txnDesc}>{t.description}</Text>
              <Text style={styles.txnMeta}>{t.category} · {t.date}</Text>
            </View>
            <Text style={[styles.txnAmt, { color: t.type === 'income' ? colors.green : colors.red }]}>
              {t.type === 'income' ? '+' : '-'}{fmt(t.amount, currency)}
            </Text>
            <EditIcon size={14} color={colors.muted} />
          </Pressable>
        ))}
        {monthTxns.length === 0 && <Text style={styles.empty}>No transactions this month.</Text>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:         { flex: 1, backgroundColor: colors.bg },
  content:      { padding: spacing.md, paddingBottom: spacing.xl * 2 },
  heading:      { fontSize: 22, fontFamily: 'PlusJakartaSans_800ExtraBold', color: colors.text, marginBottom: spacing.md },
  picker:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                  gap: spacing.lg, marginBottom: spacing.md },
  arrow:        { padding: spacing.sm },
  pickerLabel:  { fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold', color: colors.text, minWidth: 110, textAlign: 'center' },
  row2:         { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  card:         { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1,
                  borderColor: colors.border, padding: spacing.md },
  cardLabel:    { fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', color: colors.muted, marginBottom: 4 },
  cardVal:      { fontSize: 18, fontFamily: 'PlusJakartaSans_700Bold' },
  chartWrap:    { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1,
                  borderColor: colors.border, padding: spacing.md, marginBottom: spacing.md },
  section:      { marginBottom: spacing.md },
  sectionTitle: { fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold', color: colors.muted,
                  textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing.sm },
  txnRow:       { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
                  borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
                  padding: spacing.sm, marginBottom: spacing.xs, gap: spacing.xs },
  txnLeft:      { flex: 1 },
  txnDesc:      { fontSize: 14, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.text },
  txnMeta:      { fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', color: colors.muted, marginTop: 2 },
  txnAmt:       { fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', marginHorizontal: spacing.xs },
  empty:        { color: colors.muted, fontFamily: 'PlusJakartaSans_400Regular', textAlign: 'center', marginTop: spacing.md },
});
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest __tests__/monthly.test.tsx --no-coverage
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/\(tabs\)/monthly.tsx __tests__/monthly.test.tsx
git commit -m "feat: add Monthly Report screen with 6-month bar chart"
```

---

### Task 18: Yearly Report Screen

**Files:**
- Create: `app/(tabs)/yearly.tsx`

- [ ] **Step 1: Write failing test**

```typescript
// __tests__/yearly.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import YearlyScreen from '../app/(tabs)/yearly';
import { FinanceContext } from '../hooks/FinanceContext';

const mockCtx = {
  txns: [
    { id:'1', type:'income',  amount:5000, category:'salary', description:'Pay', date:'2026-01-15', auto:false },
    { id:'2', type:'expense', amount:300,  category:'food',   description:'Shop', date:'2026-01-20', auto:false },
  ],
  budgets:{}, goals:[], nw:{assets:[],liabilities:[]}, recurring:[],
  currency:{ code:'USD', symbol:'$', locale:'en-US' }, user:'alice',
  addTxn:jest.fn(), editTxn:jest.fn(), deleteTxn:jest.fn(),
  setBudgets:jest.fn(), setGoals:jest.fn(), setNw:jest.fn(),
  setRecurring:jest.fn(), setCurrencyPref:jest.fn(),
  login:jest.fn(), logout:jest.fn(),
  openAdd:jest.fn(), openEdit:jest.fn(),
  modalVisible:false, editItem:null, closeModal:jest.fn(),
};

it('renders Yearly Report heading', () => {
  render(<FinanceContext.Provider value={mockCtx as any}><YearlyScreen /></FinanceContext.Provider>);
  expect(screen.getByText('Yearly Report')).toBeTruthy();
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest __tests__/yearly.test.tsx --no-coverage
```
Expected: FAIL — cannot find module `../app/(tabs)/yearly`

- [ ] **Step 3: Implement Yearly Report screen**

Create `app/(tabs)/yearly.tsx`:

```typescript
import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useFinance } from '../../hooks/FinanceContext';
import StatCard from '../../components/StatCard';
import { colors, spacing, radius } from '../../constants/theme';
import { fmt, fmtFull } from '../../lib/format';
import { ChevronLeftIcon, ChevronRightIcon } from '../../components/icons';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function YearlyScreen() {
  const { txns, currency } = useFinance();
  const [year, setYear] = useState(new Date().getFullYear());

  const monthlyData = useMemo(() => {
    return MONTHS.map((label, idx) => {
      const key = `${year}-${String(idx + 1).padStart(2, '0')}`;
      const inc = txns.filter(t => t.type === 'income'  && t.date.startsWith(key)).reduce((s, t) => s + t.amount, 0);
      const exp = txns.filter(t => t.type === 'expense' && t.date.startsWith(key)).reduce((s, t) => s + t.amount, 0);
      return { label, inc, exp, net: inc - exp };
    });
  }, [txns, year]);

  const totalIncome   = monthlyData.reduce((s, m) => s + m.inc, 0);
  const totalExpenses = monthlyData.reduce((s, m) => s + m.exp, 0);
  const totalNet      = totalIncome - totalExpenses;
  const savingsRate   = totalIncome > 0 ? ((totalNet / totalIncome) * 100).toFixed(1) : '0.0';

  async function exportCSV() {
    const header = 'Month,Income,Expenses,Net\n';
    const rows   = monthlyData.map(m => `${m.label} ${year},${m.inc},${m.exp},${m.net}`).join('\n');
    const csv    = header + rows;

    if (Platform.OS === 'web') {
      const blob = new Blob([csv], { type: 'text/csv' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = `yearly-${year}.csv`; a.click();
      URL.revokeObjectURL(url);
    } else {
      const path = `${FileSystem.cacheDirectory}yearly-${year}.csv`;
      await FileSystem.writeAsStringAsync(path, csv, { encoding: FileSystem.EncodingType.UTF8 });
      await Sharing.shareAsync(path, { mimeType: 'text/csv', dialogTitle: `Yearly Report ${year}` });
    }
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>Yearly Report</Text>
        <Pressable onPress={exportCSV} style={styles.exportBtn}>
          <Text style={styles.exportBtnText}>Export CSV</Text>
        </Pressable>
      </View>

      {/* Year picker */}
      <View style={styles.picker}>
        <Pressable onPress={() => setYear(y => y - 1)} style={styles.arrow}><ChevronLeftIcon size={20} color={colors.text} /></Pressable>
        <Text style={styles.pickerLabel}>{year}</Text>
        <Pressable onPress={() => setYear(y => y + 1)} style={styles.arrow}><ChevronRightIcon size={20} color={colors.text} /></Pressable>
      </View>

      {/* Summary stat cards */}
      <View style={styles.grid}>
        <StatCard label="Total Income"   value={fmtFull(totalIncome, currency)}   color={colors.green} />
        <StatCard label="Total Expenses" value={fmtFull(totalExpenses, currency)} color={colors.red}   />
        <StatCard label="Net Savings"    value={fmtFull(totalNet, currency)}      color={totalNet >= 0 ? colors.green : colors.red} />
        <StatCard label="Savings Rate"   value={`${savingsRate}%`}                color={colors.blue}  />
      </View>

      {/* Monthly breakdown table */}
      <View style={styles.tableWrap}>
        <Text style={styles.sectionTitle}>Monthly Breakdown</Text>
        {/* Header row */}
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={[styles.tableCell, styles.tableHeaderText, { flex: 1.2 }]}>Month</Text>
          <Text style={[styles.tableCell, styles.tableHeaderText]}>Income</Text>
          <Text style={[styles.tableCell, styles.tableHeaderText]}>Expenses</Text>
          <Text style={[styles.tableCell, styles.tableHeaderText]}>Net</Text>
        </View>
        {monthlyData.map(m => (
          <View key={m.label} style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.tableMonthCell, { flex: 1.2 }]}>{m.label}</Text>
            <Text style={[styles.tableCell, { color: m.inc > 0 ? colors.green : colors.muted }]}>{fmt(m.inc, currency)}</Text>
            <Text style={[styles.tableCell, { color: m.exp > 0 ? colors.red   : colors.muted }]}>{fmt(m.exp, currency)}</Text>
            <Text style={[styles.tableCell, { color: m.net >= 0 ? colors.green : colors.red   }]}>{fmt(Math.abs(m.net), currency)}</Text>
          </View>
        ))}
        {/* Total row */}
        <View style={[styles.tableRow, styles.tableTotal]}>
          <Text style={[styles.tableCell, styles.tableTotalText, { flex: 1.2 }]}>Total</Text>
          <Text style={[styles.tableCell, styles.tableTotalText, { color: colors.green }]}>{fmt(totalIncome, currency)}</Text>
          <Text style={[styles.tableCell, styles.tableTotalText, { color: colors.red }]}>{fmt(totalExpenses, currency)}</Text>
          <Text style={[styles.tableCell, styles.tableTotalText, { color: totalNet >= 0 ? colors.green : colors.red }]}>{fmt(Math.abs(totalNet), currency)}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:           { flex: 1, backgroundColor: colors.bg },
  content:        { padding: spacing.md, paddingBottom: spacing.xl * 2 },
  headerRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  heading:        { fontSize: 22, fontFamily: 'PlusJakartaSans_800ExtraBold', color: colors.text },
  exportBtn:      { paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.md,
                    backgroundColor: colors.accentDim, borderWidth: 1, borderColor: colors.accent },
  exportBtnText:  { fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.accent },
  picker:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                    gap: spacing.lg, marginBottom: spacing.md },
  arrow:          { padding: spacing.sm },
  pickerLabel:    { fontSize: 18, fontFamily: 'PlusJakartaSans_700Bold', color: colors.text, minWidth: 60, textAlign: 'center' },
  grid:           { gap: spacing.sm, marginBottom: spacing.md },
  tableWrap:      { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  sectionTitle:   { fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold', color: colors.muted,
                    textTransform: 'uppercase', letterSpacing: 0.8, padding: spacing.md, paddingBottom: spacing.sm },
  tableRow:       { flexDirection: 'row', paddingHorizontal: spacing.md, paddingVertical: 10,
                    borderTopWidth: 1, borderTopColor: colors.border },
  tableHeader:    { backgroundColor: colors.surface2 },
  tableHeaderText:{ fontFamily: 'PlusJakartaSans_700Bold', color: colors.muted, fontSize: 12 },
  tableCell:      { flex: 1, fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', color: colors.text },
  tableMonthCell: { fontFamily: 'PlusJakartaSans_600SemiBold' },
  tableTotal:     { backgroundColor: colors.surface2 },
  tableTotalText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13 },
});
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest __tests__/yearly.test.tsx --no-coverage
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/\(tabs\)/yearly.tsx __tests__/yearly.test.tsx
git commit -m "feat: add Yearly Report screen with CSV export"
```

---

### Task 19: Savings Goals Screen

**Files:**
- Create: `app/(tabs)/goals.tsx`

- [ ] **Step 1: Write failing test**

```typescript
// __tests__/goals.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import GoalsScreen from '../app/(tabs)/goals';
import { FinanceContext } from '../hooks/FinanceContext';

const goals = [{ id:'g1', name:'Emergency Fund', target:10000, current:4000, deadline:'2026-12-31' }];
const mockCtx = {
  txns:[], budgets:{}, goals, nw:{assets:[],liabilities:[]}, recurring:[],
  currency:{ code:'USD', symbol:'$', locale:'en-US' }, user:'alice',
  addTxn:jest.fn(), editTxn:jest.fn(), deleteTxn:jest.fn(),
  setBudgets:jest.fn(), setGoals:jest.fn(), setNw:jest.fn(),
  setRecurring:jest.fn(), setCurrencyPref:jest.fn(),
  login:jest.fn(), logout:jest.fn(),
  openAdd:jest.fn(), openEdit:jest.fn(),
  modalVisible:false, editItem:null, closeModal:jest.fn(),
};

it('renders goal name and progress', () => {
  render(<FinanceContext.Provider value={mockCtx as any}><GoalsScreen /></FinanceContext.Provider>);
  expect(screen.getByText('Emergency Fund')).toBeTruthy();
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest __tests__/goals.test.tsx --no-coverage
```
Expected: FAIL — cannot find module `../app/(tabs)/goals`

- [ ] **Step 3: Implement Savings Goals screen**

Create `app/(tabs)/goals.tsx`:

```typescript
import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Modal, TextInput } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useFinance } from '../../hooks/FinanceContext';
import { colors, spacing, radius } from '../../constants/theme';
import { fmt, fmtFull } from '../../lib/format';
import { uid, Goal } from '../../lib/data';
import { PlusIcon, TrashIcon, EditIcon } from '../../components/icons';

function CircleProgress({ pct, size = 80, stroke = 7 }: { pct: number; size?: number; stroke?: number }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(pct, 1));
  const center = size / 2;
  const color = pct >= 1 ? colors.green : pct >= 0.7 ? colors.blue : colors.accent;
  return (
    <Svg width={size} height={size}>
      <Circle cx={center} cy={center} r={r} fill="none" stroke={colors.border} strokeWidth={stroke} />
      <Circle cx={center} cy={center} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${circ}`} strokeDashoffset={offset}
        strokeLinecap="round" rotation="-90" origin={`${center},${center}`} />
    </Svg>
  );
}

export default function GoalsScreen() {
  const { goals, setGoals, currency } = useFinance();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]     = useState<Goal | null>(null);
  const [name,    setName]        = useState('');
  const [target,  setTarget]      = useState('');
  const [current, setCurrent]     = useState('');
  const [deadline,setDeadline]    = useState('');

  function openNew() {
    setEditing(null); setName(''); setTarget(''); setCurrent(''); setDeadline('');
    setModalOpen(true);
  }

  function openEdit(g: Goal) {
    setEditing(g); setName(g.name); setTarget(String(g.target));
    setCurrent(String(g.current)); setDeadline(g.deadline ?? '');
    setModalOpen(true);
  }

  function save() {
    const t = parseFloat(target), c = parseFloat(current);
    if (!name || isNaN(t) || isNaN(c)) return;
    if (editing) {
      setGoals(goals.map(g => g.id === editing.id
        ? { ...g, name, target: t, current: c, deadline: deadline || undefined }
        : g));
    } else {
      setGoals([...goals, { id: uid(), name, target: t, current: c, deadline: deadline || undefined }]);
    }
    setModalOpen(false);
  }

  function remove(id: string) { setGoals(goals.filter(g => g.id !== id)); }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.heading}>Savings Goals</Text>
        <Pressable onPress={openNew} style={styles.addBtn}>
          <PlusIcon size={18} color="#fff" />
          <Text style={styles.addBtnText}>Add Goal</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {goals.length === 0 && (
          <Text style={styles.empty}>No goals yet. Add one to start tracking!</Text>
        )}
        {goals.map(g => {
          const pct = g.target > 0 ? g.current / g.target : 0;
          return (
            <View key={g.id} style={styles.card}>
              <View style={styles.cardTop}>
                <CircleProgress pct={pct} />
                <View style={styles.cardInfo}>
                  <Text style={styles.goalName}>{g.name}</Text>
                  <Text style={styles.goalProgress}>
                    {fmtFull(g.current, currency)} <Text style={styles.goalOf}>of</Text> {fmtFull(g.target, currency)}
                  </Text>
                  <Text style={styles.goalPct}>{(pct * 100).toFixed(1)}% complete</Text>
                  {g.deadline && <Text style={styles.goalDeadline}>Deadline: {g.deadline}</Text>}
                </View>
                <View style={styles.cardActions}>
                  <Pressable onPress={() => openEdit(g)} style={styles.iconBtn}><EditIcon size={16} color={colors.muted} /></Pressable>
                  <Pressable onPress={() => remove(g.id)}  style={styles.iconBtn}><TrashIcon size={16} color={colors.muted} /></Pressable>
                </View>
              </View>
              {/* Linear progress bar */}
              <View style={styles.progBg}>
                <View style={[styles.progFill, { width: `${Math.min(pct * 100, 100)}%` as any,
                  backgroundColor: pct >= 1 ? colors.green : pct >= 0.7 ? colors.blue : colors.accent }]} />
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal visible={modalOpen} transparent animationType="slide" onRequestClose={() => setModalOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editing ? 'Edit Goal' : 'New Goal'}</Text>
            <TextInput style={styles.input} placeholder="Goal name" placeholderTextColor={colors.muted}
              value={name} onChangeText={setName} />
            <TextInput style={styles.input} placeholder="Target amount" placeholderTextColor={colors.muted}
              keyboardType="numeric" value={target} onChangeText={setTarget} />
            <TextInput style={styles.input} placeholder="Current amount" placeholderTextColor={colors.muted}
              keyboardType="numeric" value={current} onChangeText={setCurrent} />
            <TextInput style={styles.input} placeholder="Deadline (YYYY-MM-DD, optional)"
              placeholderTextColor={colors.muted} value={deadline} onChangeText={setDeadline} />
            <View style={styles.modalActions}>
              <Pressable onPress={() => setModalOpen(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={save} style={styles.saveBtn}>
                <Text style={styles.saveBtnText}>{editing ? 'Update' : 'Create'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: colors.bg },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                   padding: spacing.md },
  heading:       { fontSize: 22, fontFamily: 'PlusJakartaSans_800ExtraBold', color: colors.text },
  addBtn:        { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.md,
                   paddingVertical: 8, borderRadius: radius.md, backgroundColor: colors.accent },
  addBtnText:    { fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', color: '#fff' },
  content:       { padding: spacing.md, paddingTop: 0, paddingBottom: spacing.xl * 2 },
  empty:         { textAlign: 'center', color: colors.muted, marginTop: spacing.xl,
                   fontFamily: 'PlusJakartaSans_400Regular' },
  card:          { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1,
                   borderColor: colors.border, padding: spacing.md, marginBottom: spacing.sm },
  cardTop:       { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  cardInfo:      { flex: 1, marginLeft: spacing.md },
  goalName:      { fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold', color: colors.text },
  goalProgress:  { fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', color: colors.muted, marginTop: 2 },
  goalOf:        { color: colors.muted },
  goalPct:       { fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.accent, marginTop: 2 },
  goalDeadline:  { fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', color: colors.muted, marginTop: 2 },
  cardActions:   { gap: spacing.xs },
  iconBtn:       { padding: 6 },
  progBg:        { height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' },
  progFill:      { height: 6, borderRadius: 3 },
  overlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalCard:     { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
                   padding: spacing.lg, gap: spacing.sm },
  modalTitle:    { fontSize: 18, fontFamily: 'PlusJakartaSans_700Bold', color: colors.text, marginBottom: spacing.xs },
  input:         { backgroundColor: colors.surface2, borderRadius: radius.md, borderWidth: 1,
                   borderColor: colors.border, color: colors.text, padding: spacing.sm, fontSize: 14,
                   fontFamily: 'PlusJakartaSans_400Regular' },
  modalActions:  { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.xs },
  cancelBtn:     { paddingHorizontal: spacing.md, paddingVertical: 10 },
  cancelBtnText: { fontSize: 14, fontFamily: 'PlusJakartaSans_400Regular', color: colors.muted },
  saveBtn:       { paddingHorizontal: spacing.lg, paddingVertical: 10, borderRadius: radius.md,
                   backgroundColor: colors.accent },
  saveBtnText:   { fontSize: 14, fontFamily: 'PlusJakartaSans_600SemiBold', color: '#fff' },
});
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest __tests__/goals.test.tsx --no-coverage
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/\(tabs\)/goals.tsx __tests__/goals.test.tsx
git commit -m "feat: add Savings Goals screen with circular progress"
```

---

### Task 20: Net Worth Screen

**Files:**
- Create: `app/(tabs)/networth.tsx`

- [ ] **Step 1: Write failing test**

```typescript
// __tests__/networth.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import NetWorthScreen from '../app/(tabs)/networth';
import { FinanceContext } from '../hooks/FinanceContext';

const nw = { assets: [{ id:'a1', name:'Savings account', value:15000 }], liabilities: [{ id:'l1', name:'Car loan', value:5000 }] };
const mockCtx = {
  txns:[], budgets:{}, goals:[], nw, recurring:[],
  currency:{ code:'USD', symbol:'$', locale:'en-US' }, user:'alice',
  addTxn:jest.fn(), editTxn:jest.fn(), deleteTxn:jest.fn(),
  setBudgets:jest.fn(), setGoals:jest.fn(), setNw:jest.fn(),
  setRecurring:jest.fn(), setCurrencyPref:jest.fn(),
  login:jest.fn(), logout:jest.fn(),
  openAdd:jest.fn(), openEdit:jest.fn(),
  modalVisible:false, editItem:null, closeModal:jest.fn(),
};

it('renders assets and liabilities', () => {
  render(<FinanceContext.Provider value={mockCtx as any}><NetWorthScreen /></FinanceContext.Provider>);
  expect(screen.getByText('Savings account')).toBeTruthy();
  expect(screen.getByText('Car loan')).toBeTruthy();
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest __tests__/networth.test.tsx --no-coverage
```
Expected: FAIL — cannot find module `../app/(tabs)/networth`

- [ ] **Step 3: Implement Net Worth screen**

Create `app/(tabs)/networth.tsx`:

```typescript
import React, { useState } from 'react';
import { View, Text, Pressable, FlatList, StyleSheet, Modal, TextInput } from 'react-native';
import { useFinance } from '../../hooks/FinanceContext';
import { colors, spacing, radius } from '../../constants/theme';
import { fmtFull } from '../../lib/format';
import { uid, NetWorthItem } from '../../lib/data';
import { PlusIcon, TrashIcon, EditIcon } from '../../components/icons';

type ItemMode = 'asset' | 'liability';

export default function NetWorthScreen() {
  const { nw, setNw, currency } = useFinance();
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode]           = useState<ItemMode>('asset');
  const [editId, setEditId]       = useState<string | null>(null);
  const [name, setName]           = useState('');
  const [value, setValue]         = useState('');

  const totalAssets      = nw.assets.reduce((s, a) => s + a.value, 0);
  const totalLiabilities = nw.liabilities.reduce((s, l) => s + l.value, 0);
  const netWorth         = totalAssets - totalLiabilities;

  function openNew(m: ItemMode) {
    setMode(m); setEditId(null); setName(''); setValue(''); setModalOpen(true);
  }

  function openEdit(item: NetWorthItem, m: ItemMode) {
    setMode(m); setEditId(item.id); setName(item.name); setValue(String(item.value)); setModalOpen(true);
  }

  function save() {
    const v = parseFloat(value);
    if (!name || isNaN(v)) return;
    if (editId) {
      const update = (list: NetWorthItem[]) => list.map(i => i.id === editId ? { ...i, name, value: v } : i);
      setNw({ assets: mode === 'asset' ? update(nw.assets) : nw.assets,
               liabilities: mode === 'liability' ? update(nw.liabilities) : nw.liabilities });
    } else {
      const item = { id: uid(), name, value: v };
      setNw({ assets:      mode === 'asset'     ? [...nw.assets,      item] : nw.assets,
               liabilities: mode === 'liability' ? [...nw.liabilities, item] : nw.liabilities });
    }
    setModalOpen(false);
  }

  function remove(id: string, m: ItemMode) {
    setNw({ assets:      m === 'asset'     ? nw.assets.filter(i => i.id !== id)      : nw.assets,
             liabilities: m === 'liability' ? nw.liabilities.filter(i => i.id !== id) : nw.liabilities });
  }

  function renderItem(item: NetWorthItem, m: ItemMode) {
    return (
      <View key={item.id} style={styles.itemRow}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={[styles.itemValue, { color: m === 'asset' ? colors.green : colors.red }]}>
          {fmtFull(item.value, currency)}
        </Text>
        <Pressable onPress={() => openEdit(item, m)} style={styles.iconBtn}><EditIcon size={15} color={colors.muted} /></Pressable>
        <Pressable onPress={() => remove(item.id, m)}  style={styles.iconBtn}><TrashIcon size={15} color={colors.muted} /></Pressable>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* Net worth total */}
      <View style={styles.netCard}>
        <Text style={styles.netLabel}>Net Worth</Text>
        <Text style={[styles.netValue, { color: netWorth >= 0 ? colors.green : colors.red }]}>
          {fmtFull(netWorth, currency)}
        </Text>
        <View style={styles.netRow}>
          <Text style={styles.netSub}>Assets <Text style={{ color: colors.green }}>{fmtFull(totalAssets, currency)}</Text></Text>
          <Text style={styles.netSub}>  –  Liabilities <Text style={{ color: colors.red }}>{fmtFull(totalLiabilities, currency)}</Text></Text>
        </View>
      </View>

      <FlatList
        data={[1]}
        keyExtractor={() => 'main'}
        contentContainerStyle={styles.content}
        renderItem={() => (
          <>
            {/* Assets */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Assets</Text>
                <Pressable onPress={() => openNew('asset')} style={styles.addBtn}>
                  <PlusIcon size={14} color={colors.green} />
                  <Text style={[styles.addBtnText, { color: colors.green }]}>Add</Text>
                </Pressable>
              </View>
              {nw.assets.map(a => renderItem(a, 'asset'))}
              {nw.assets.length === 0 && <Text style={styles.empty}>No assets added yet.</Text>}
            </View>

            {/* Liabilities */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Liabilities</Text>
                <Pressable onPress={() => openNew('liability')} style={styles.addBtn}>
                  <PlusIcon size={14} color={colors.red} />
                  <Text style={[styles.addBtnText, { color: colors.red }]}>Add</Text>
                </Pressable>
              </View>
              {nw.liabilities.map(l => renderItem(l, 'liability'))}
              {nw.liabilities.length === 0 && <Text style={styles.empty}>No liabilities added yet.</Text>}
            </View>
          </>
        )}
      />

      {/* Add/Edit Modal */}
      <Modal visible={modalOpen} transparent animationType="slide" onRequestClose={() => setModalOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editId ? 'Edit' : 'Add'} {mode === 'asset' ? 'Asset' : 'Liability'}</Text>
            <TextInput style={styles.input} placeholder="Name" placeholderTextColor={colors.muted}
              value={name} onChangeText={setName} />
            <TextInput style={styles.input} placeholder="Value" placeholderTextColor={colors.muted}
              keyboardType="numeric" value={value} onChangeText={setValue} />
            <View style={styles.modalActions}>
              <Pressable onPress={() => setModalOpen(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={save} style={styles.saveBtn}>
                <Text style={styles.saveBtnText}>{editId ? 'Update' : 'Add'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: colors.bg },
  netCard:       { margin: spacing.md, backgroundColor: colors.surface, borderRadius: radius.xl,
                   borderWidth: 1, borderColor: colors.border, padding: spacing.lg, alignItems: 'center' },
  netLabel:      { fontSize: 14, fontFamily: 'PlusJakartaSans_400Regular', color: colors.muted, marginBottom: 4 },
  netValue:      { fontSize: 32, fontFamily: 'PlusJakartaSans_800ExtraBold' },
  netRow:        { flexDirection: 'row', marginTop: 8 },
  netSub:        { fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', color: colors.muted },
  content:       { paddingHorizontal: spacing.md, paddingBottom: spacing.xl * 2 },
  section:       { marginBottom: spacing.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  sectionTitle:  { fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: colors.muted,
                   textTransform: 'uppercase', letterSpacing: 0.8 },
  addBtn:        { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm,
                   paddingVertical: 4, borderRadius: radius.sm, backgroundColor: colors.surface2 },
  addBtnText:    { fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold' },
  itemRow:       { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
                   borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
                   padding: spacing.sm, marginBottom: spacing.xs, gap: spacing.xs },
  itemName:      { flex: 1, fontSize: 14, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.text },
  itemValue:     { fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', marginHorizontal: spacing.xs },
  iconBtn:       { padding: 6 },
  empty:         { color: colors.muted, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, textAlign: 'center', paddingVertical: spacing.sm },
  overlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalCard:     { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
                   padding: spacing.lg, gap: spacing.sm },
  modalTitle:    { fontSize: 18, fontFamily: 'PlusJakartaSans_700Bold', color: colors.text, marginBottom: spacing.xs },
  input:         { backgroundColor: colors.surface2, borderRadius: radius.md, borderWidth: 1,
                   borderColor: colors.border, color: colors.text, padding: spacing.sm, fontSize: 14,
                   fontFamily: 'PlusJakartaSans_400Regular' },
  modalActions:  { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.xs },
  cancelBtn:     { paddingHorizontal: spacing.md, paddingVertical: 10 },
  cancelBtnText: { fontSize: 14, fontFamily: 'PlusJakartaSans_400Regular', color: colors.muted },
  saveBtn:       { paddingHorizontal: spacing.lg, paddingVertical: 10, borderRadius: radius.md,
                   backgroundColor: colors.accent },
  saveBtnText:   { fontSize: 14, fontFamily: 'PlusJakartaSans_600SemiBold', color: '#fff' },
});
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest __tests__/networth.test.tsx --no-coverage
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/\(tabs\)/networth.tsx __tests__/networth.test.tsx
git commit -m "feat: add Net Worth screen"
```

---

### Task 21: Recurring Transactions Screen

**Files:**
- Create: `app/(tabs)/recurring.tsx`

- [ ] **Step 1: Write failing test**

```typescript
// __tests__/recurring.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import RecurringScreen from '../app/(tabs)/recurring';
import { FinanceContext } from '../hooks/FinanceContext';

const recurring = [{ id:'r1', type:'expense', amount:50, category:'subscriptions', description:'Netflix', dayOfMonth:1 }];
const mockCtx = {
  txns:[], budgets:{}, goals:[], nw:{assets:[],liabilities:[]}, recurring,
  currency:{ code:'USD', symbol:'$', locale:'en-US' }, user:'alice',
  addTxn:jest.fn(), editTxn:jest.fn(), deleteTxn:jest.fn(),
  setBudgets:jest.fn(), setGoals:jest.fn(), setNw:jest.fn(),
  setRecurring:jest.fn(), setCurrencyPref:jest.fn(),
  login:jest.fn(), logout:jest.fn(),
  openAdd:jest.fn(), openEdit:jest.fn(),
  modalVisible:false, editItem:null, closeModal:jest.fn(),
};

it('renders recurring rule description', () => {
  render(<FinanceContext.Provider value={mockCtx as any}><RecurringScreen /></FinanceContext.Provider>);
  expect(screen.getByText('Netflix')).toBeTruthy();
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest __tests__/recurring.test.tsx --no-coverage
```
Expected: FAIL — cannot find module `../app/(tabs)/recurring`

- [ ] **Step 3: Implement Recurring Transactions screen**

Create `app/(tabs)/recurring.tsx`:

```typescript
import React, { useState } from 'react';
import { View, Text, Pressable, FlatList, StyleSheet, Modal, TextInput } from 'react-native';
import { useFinance } from '../../hooks/FinanceContext';
import { colors, spacing, radius } from '../../constants/theme';
import { fmt } from '../../lib/format';
import { uid, RecurringRule, EXPENSE_CATS, INCOME_CATS } from '../../lib/data';
import { PlusIcon, TrashIcon, EditIcon } from '../../components/icons';

const ALL_CATS = [...EXPENSE_CATS, ...INCOME_CATS];

export default function RecurringScreen() {
  const { recurring, setRecurring, currency } = useFinance();
  const [modalOpen, setModalOpen] = useState(false);
  const [editId,    setEditId]    = useState<string | null>(null);
  const [type,      setType]      = useState<'expense' | 'income'>('expense');
  const [amount,    setAmount]    = useState('');
  const [category,  setCategory]  = useState('food');
  const [desc,      setDesc]      = useState('');
  const [day,       setDay]       = useState('1');

  function openNew() {
    setEditId(null); setType('expense'); setAmount(''); setCategory('food'); setDesc(''); setDay('1');
    setModalOpen(true);
  }

  function openEdit(r: RecurringRule) {
    setEditId(r.id); setType(r.type as 'expense' | 'income'); setAmount(String(r.amount));
    setCategory(r.category); setDesc(r.description); setDay(String(r.dayOfMonth));
    setModalOpen(true);
  }

  function save() {
    const amt = parseFloat(amount), d = parseInt(day, 10);
    if (!desc || isNaN(amt) || isNaN(d) || d < 1 || d > 28) return;
    const rule: RecurringRule = { id: editId ?? uid(), type, amount: amt, category, description: desc, dayOfMonth: d };
    setRecurring(editId ? recurring.map(r => r.id === editId ? rule : r) : [...recurring, rule]);
    setModalOpen(false);
  }

  function nextDate(dayOfMonth: number) {
    const now = new Date();
    const d   = new Date(now.getFullYear(), now.getMonth(), dayOfMonth);
    if (d <= now) d.setMonth(d.getMonth() + 1);
    return d.toISOString().slice(0, 10);
  }

  const catColors: Record<string, string> = Object.fromEntries(ALL_CATS.map(c => [c.id, c.color]));

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.heading}>Recurring Transactions</Text>
        <Pressable onPress={openNew} style={styles.addBtn}>
          <PlusIcon size={18} color="#fff" />
          <Text style={styles.addBtnText}>Add</Text>
        </Pressable>
      </View>

      <FlatList
        data={recurring}
        keyExtractor={r => r.id}
        contentContainerStyle={styles.content}
        ListEmptyComponent={<Text style={styles.empty}>No recurring rules yet.</Text>}
        renderItem={({ item: r }) => (
          <View style={styles.card}>
            <View style={[styles.typeDot, { backgroundColor: r.type === 'income' ? colors.green : colors.red }]} />
            <View style={styles.cardInfo}>
              <Text style={styles.cardDesc}>{r.description}</Text>
              <Text style={styles.cardMeta}>
                {r.category} · Every month on day {r.dayOfMonth}
              </Text>
              <Text style={styles.cardNext}>Next: {nextDate(r.dayOfMonth)}</Text>
            </View>
            <Text style={[styles.cardAmt, { color: r.type === 'income' ? colors.green : colors.red }]}>
              {r.type === 'income' ? '+' : '-'}{fmt(r.amount, currency)}
            </Text>
            <Pressable onPress={() => openEdit(r)}             style={styles.iconBtn}><EditIcon  size={15} color={colors.muted} /></Pressable>
            <Pressable onPress={() => setRecurring(recurring.filter(x => x.id !== r.id))} style={styles.iconBtn}><TrashIcon size={15} color={colors.muted} /></Pressable>
          </View>
        )}
      />

      {/* Add/Edit Modal */}
      <Modal visible={modalOpen} transparent animationType="slide" onRequestClose={() => setModalOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editId ? 'Edit' : 'New'} Recurring Rule</Text>

            {/* Type toggle */}
            <View style={styles.typeToggle}>
              {(['expense', 'income'] as const).map(v => (
                <Pressable key={v} onPress={() => setType(v)}
                  style={[styles.typeBtn, type === v && { backgroundColor: v === 'income' ? colors.green : colors.red }]}>
                  <Text style={[styles.typeBtnText, type === v && { color: '#fff' }]}>
                    {v.charAt(0).toUpperCase() + v.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>

            <TextInput style={styles.input} placeholder="Description" placeholderTextColor={colors.muted}
              value={desc} onChangeText={setDesc} />
            <TextInput style={styles.input} placeholder="Amount" placeholderTextColor={colors.muted}
              keyboardType="numeric" value={amount} onChangeText={setAmount} />
            <TextInput style={styles.input} placeholder="Day of month (1–28)" placeholderTextColor={colors.muted}
              keyboardType="numeric" value={day} onChangeText={setDay} />

            <View style={styles.modalActions}>
              <Pressable onPress={() => setModalOpen(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={save} style={styles.saveBtn}>
                <Text style={styles.saveBtnText}>{editId ? 'Update' : 'Create'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: colors.bg },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md },
  heading:       { fontSize: 22, fontFamily: 'PlusJakartaSans_800ExtraBold', color: colors.text },
  addBtn:        { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.md,
                   paddingVertical: 8, borderRadius: radius.md, backgroundColor: colors.accent },
  addBtnText:    { fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', color: '#fff' },
  content:       { paddingHorizontal: spacing.md, paddingBottom: spacing.xl * 2 },
  empty:         { textAlign: 'center', color: colors.muted, marginTop: spacing.xl, fontFamily: 'PlusJakartaSans_400Regular' },
  card:          { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
                   borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
                   padding: spacing.sm, marginBottom: spacing.xs, gap: spacing.xs },
  typeDot:       { width: 8, height: 8, borderRadius: 4 },
  cardInfo:      { flex: 1 },
  cardDesc:      { fontSize: 14, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.text },
  cardMeta:      { fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', color: colors.muted, marginTop: 2 },
  cardNext:      { fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', color: colors.blue, marginTop: 1 },
  cardAmt:       { fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', marginHorizontal: spacing.xs },
  iconBtn:       { padding: 6 },
  overlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalCard:     { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
                   padding: spacing.lg, gap: spacing.sm },
  modalTitle:    { fontSize: 18, fontFamily: 'PlusJakartaSans_700Bold', color: colors.text, marginBottom: spacing.xs },
  typeToggle:    { flexDirection: 'row', gap: spacing.sm },
  typeBtn:       { flex: 1, paddingVertical: 10, borderRadius: radius.md, backgroundColor: colors.surface2,
                   borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  typeBtnText:   { fontSize: 14, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.muted },
  input:         { backgroundColor: colors.surface2, borderRadius: radius.md, borderWidth: 1,
                   borderColor: colors.border, color: colors.text, padding: spacing.sm, fontSize: 14,
                   fontFamily: 'PlusJakartaSans_400Regular' },
  modalActions:  { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.xs },
  cancelBtn:     { paddingHorizontal: spacing.md, paddingVertical: 10 },
  cancelBtnText: { fontSize: 14, fontFamily: 'PlusJakartaSans_400Regular', color: colors.muted },
  saveBtn:       { paddingHorizontal: spacing.lg, paddingVertical: 10, borderRadius: radius.md,
                   backgroundColor: colors.accent },
  saveBtnText:   { fontSize: 14, fontFamily: 'PlusJakartaSans_600SemiBold', color: '#fff' },
});
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest __tests__/recurring.test.tsx --no-coverage
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/\(tabs\)/recurring.tsx __tests__/recurring.test.tsx
git commit -m "feat: add Recurring Transactions screen"
```

---

### Task 22: Final Verification & Cleanup

**Files:**
- Delete: `temp_app.js`, `temp_app_source.jsx`, `temp_react_dom.js`, `temp_template.html`, `temp1.js`, `temp2.js`

- [ ] **Step 1: Install all dependencies**

```bash
npx expo install \
  expo-router \
  @react-native-async-storage/async-storage \
  react-native-svg \
  victory-native@^36 \
  expo-font \
  @expo-google-fonts/plus-jakarta-sans \
  expo-splash-screen \
  expo-file-system \
  expo-sharing
```
Expected: All packages install without peer dependency errors.

- [ ] **Step 2: TypeScript type-check**

```bash
npx tsc --noEmit
```
Expected: No type errors. If there are errors, fix them before continuing.

- [ ] **Step 3: Run all tests**

```bash
npx jest --no-coverage
```
Expected: All test suites PASS (storage, data, recurring, format, login, navigation, dashboard, transactions, budgets, monthly, yearly, goals, networth, recurring screens).

- [ ] **Step 4: Verify app starts on web**

```bash
npx expo start --web
```
Expected:
1. Login screen loads at `localhost:8081`
2. Register as a new user — redirects to Dashboard
3. Sidebar visible on wide window (≥ 768px), bottom tabs visible on narrow
4. All 8 nav items route correctly to their screens
5. Add a transaction via the modal — it appears on Dashboard and All Transactions
6. Set a budget — Budget Planner shows the progress bar

- [ ] **Step 5: Clean up temp files**

```bash
rm -f temp_app.js temp_app_source.jsx temp_react_dom.js temp_template.html temp1.js temp2.js
```

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "chore: remove temp extraction files, complete personal finance mobile app"
```

---

## Summary

| Task | Component | Status |
|------|-----------|--------|
| 1    | Project scaffold (package.json, tsconfig, jest.config) | [ ] |
| 2    | constants/theme.ts + constants/categories.ts | [ ] |
| 3    | lib/data.ts | [ ] |
| 4    | lib/format.ts | [ ] |
| 5    | lib/recurring.ts | [ ] |
| 6    | lib/storage.ts | [ ] |
| 7    | hooks/useFinance.ts | [ ] |
| 8    | hooks/FinanceContext.tsx | [ ] |
| 9    | app/_layout.tsx | [ ] |
| 10   | app/login.tsx | [ ] |
| 11   | components/icons/index.tsx | [ ] |
| 12   | components/StatCard, CategoryBar, AddModal | [ ] |
| 13   | components/SidebarNav, BottomNav + navigation layout | [ ] |
| 14   | app/(tabs)/index.tsx — Dashboard | [ ] |
| 15   | app/(tabs)/transactions.tsx | [ ] |
| 16   | app/(tabs)/budgets.tsx | [ ] |
| 17   | app/(tabs)/monthly.tsx | [ ] |
| 18   | app/(tabs)/yearly.tsx | [ ] |
| 19   | app/(tabs)/goals.tsx | [ ] |
| 20   | app/(tabs)/networth.tsx | [ ] |
| 21   | app/(tabs)/recurring.tsx | [ ] |
| 22   | Final verification & cleanup | [ ] |

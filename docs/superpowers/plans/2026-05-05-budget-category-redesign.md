# Budget Category Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the budget system so budgets are set at the Group level (Needs/Wants/Savings/Family) with user-defined Categories beneath them for transaction tagging and analytics.

**Architecture:** Replace the flat `CatGroup`+`ExpenseCat` hierarchy with `Group` (4 budget units) and `Category` (user-defined items under each group). Transactions gain a `group?: Group` field and their `category` field now stores a Category ID for expenses. A one-time migration maps existing data.

**Tech Stack:** React 18, TypeScript ~5.7, Vite 6, localStorage + Google Sheets sync, React Router v6, no test framework (TypeScript compilation is the verification gate).

---

## File Map

| Action | File | Responsibility |
|---|---|---|
| Modify | `src/lib/data.ts` | Core types: `Group`, `Category`, updated `Transaction`, `BudgetMap` |
| Modify | `src/constants/categories.ts` | `DEFAULT_CATEGORIES`, `GROUPS`, `CAT_TO_GROUP` migration map |
| Create | `src/lib/migration.ts` | One-time v1→v2 data migration |
| Modify | `src/lib/storage.ts` | Add Category storage, remove CustomCats storage |
| Modify | `src/lib/sheets.ts` | Update tab headers for new field names; add Categories tab |
| Modify | `src/lib/sync.ts` | Update serializers, add category sync, remove customCat sync |
| Modify | `src/hooks/useFinance.ts` | Add `categories` state, remove `customCats`/`expenseCats`/`incomeCats`, run migration |
| Modify | `src/hooks/FinanceContext.tsx` | Surface `categories`/`setCategories` through context |
| Modify | `src/pages/Budget.tsx` | 4 group cards with expandable category breakdown |
| Modify | `src/components/modals/AddTransactionModal.tsx` | Two-step group→category picker for expenses |
| Create | `src/pages/CategorySetup.tsx` | Category management screen (one-time setup) |
| Modify | `src/App.tsx` | Add `/categories` route |
| Modify | `src/components/layout/Sidebar.tsx` | Add Categories nav item |
| Modify | `src/pages/Analytics.tsx` | Group-level + category drill-down analytics |
| Modify | `src/pages/Dashboard.tsx` | Replace `expenseCats` with `categories` |
| Modify | `src/pages/Monthly.tsx` | Replace `expenseCats`/`CatGroup` with `categories`/`Group` |

---

## Task 1: Update core types in `src/lib/data.ts`

**Files:**
- Modify: `src/lib/data.ts`

This is the foundation. All other tasks depend on these types. Expect TypeScript errors in other files after this task — that's expected and fixed in subsequent tasks.

- [ ] **Step 1: Replace the file contents**

```typescript
export type TxnType = 'expense' | 'income';

export type Group = 'needs' | 'wants' | 'savings' | 'family';

export const GROUP_LABELS: Record<Group, string> = {
  needs:   'Needs',
  wants:   'Wants',
  savings: 'Savings',
  family:  'Family',
};

export const GROUPS: Group[] = ['needs', 'family', 'savings', 'wants'];

export interface Category {
  id:        string;
  label:     string;
  group:     Group;
  color:     string;
  isCustom?: boolean;
}

export interface IncomeCat {
  id:    string;
  label: string;
  color: string;
}

export interface Transaction {
  id:           string;
  type:         TxnType;
  amount:       number;
  group?:       Group;    // budget group — set for expense transactions
  category?:    string;   // Category.id for expenses; income cat id for income
  description:  string;
  date:         string;   // 'YYYY-MM-DD'
  notes?:       string;
  tags?:        string[];
  recurringId?: string;
  auto?:        boolean;
}

export interface BudgetEntry {
  mode: 'fixed' | 'pct';
  value: number;
}

export type BudgetMap = Partial<Record<Group, BudgetEntry>>;

export interface RecurringRule {
  id:          string;
  type:        TxnType;
  amount:      number;
  group?:      Group;    // set for expense recurring rules
  category?:   string;  // Category.id or income cat id
  description: string;
  dayOfMonth:  number;
}

export interface Goal {
  id:        string;
  name:      string;
  target:    number;
  current:   number;
  deadline?: string;
}

export interface NetWorthItem {
  id:             string;
  name:           string;
  value:          number;
  institution?:   string;
  accountNumber?: string;
  notes?:         string;
}

export interface NetWorthData {
  assets:      NetWorthItem[];
  liabilities: NetWorthItem[];
}

export interface Currency {
  code:   string;
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

- [ ] **Step 2: Verify the file was written correctly**

Run: `npx tsc --noEmit 2>&1 | head -40`

Expected: Many errors in other files (that's fine — they reference the old types). No errors inside `src/lib/data.ts` itself.

- [ ] **Step 3: Commit**

```bash
git add src/lib/data.ts
git commit -m "refactor: update core types — Group, Category, Transaction with group field"
```

---

## Task 2: Update `src/constants/categories.ts`

**Files:**
- Modify: `src/constants/categories.ts`

Add `DEFAULT_CATEGORIES`, `CAT_TO_GROUP` migration map, and remove the old `EXPENSE_CATS` array.

- [ ] **Step 1: Replace the file contents**

```typescript
import type { Category, Group, IncomeCat } from '../lib/data';

export const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
export const MONTHS_FULL = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

export const INCOME_CATS: IncomeCat[] = [
  { id: 'salary',    label: 'Salary / Wages', color: '#2ed18a' },
  { id: 'freelance', label: 'Freelance',       color: '#5a9fff' },
  { id: 'other',     label: 'Other Income',    color: '#a07aff' },
];

// Seeded defaults — used when a user has no categories yet.
// IDs match the old EXPENSE_CATS ids so migrated transactions link up correctly.
export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'essentials',    label: 'Essentials',           color: '#5a9fff', group: 'needs'   },
  { id: 'food',          label: 'Food & Dining',         color: '#f0b030', group: 'needs'   },
  { id: 'transport',     label: 'Transport',             color: '#a07aff', group: 'needs'   },
  { id: 'health',        label: 'Health',                color: '#2ed18a', group: 'needs'   },
  { id: 'family',        label: 'Family & Commitments',  color: '#60d0e0', group: 'family'  },
  { id: 'savings',       label: 'Savings & Investments', color: '#f0722a', group: 'savings' },
  { id: 'entertainment', label: 'Entertainment',         color: '#f05060', group: 'wants'   },
  { id: 'shopping',      label: 'Shopping',              color: '#ff7eb3', group: 'wants'   },
  { id: 'other',         label: 'Other',                 color: '#8888aa', group: 'wants'   },
];

// Maps old category IDs to the new Group they belong to.
// Used during the one-time migration in src/lib/migration.ts.
export const CAT_TO_GROUP: Record<string, Group> = {
  essentials:    'needs',
  food:          'needs',
  transport:     'needs',
  health:        'needs',
  family:        'family',
  savings:       'savings',
  entertainment: 'wants',
  shopping:      'wants',
  other:         'wants',
};

const CAT_COLORS = ['#f0722a','#5a9fff','#2ed18a','#a07aff','#f05060','#f0b030','#60d0e0','#ff7eb3','#8888aa'];
export function nextCatColor(existing: Category[]): string {
  return CAT_COLORS[existing.length % CAT_COLORS.length];
}

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

- [ ] **Step 2: Commit**

```bash
git add src/constants/categories.ts
git commit -m "refactor: replace EXPENSE_CATS with DEFAULT_CATEGORIES and CAT_TO_GROUP"
```

---

## Task 3: Write `src/lib/migration.ts`

**Files:**
- Create: `src/lib/migration.ts`

Runs once on app load. Maps old expense transactions (`category` → `group`, keeps `category` as Category.id). Seeds default categories. Discards old per-category budgets.

- [ ] **Step 1: Create the migration file**

```typescript
import { Transaction, RecurringRule, Group } from './data';
import { DEFAULT_CATEGORIES, CAT_TO_GROUP } from '../constants/categories';

const VERSION_KEY = 'pf_data_version';
const TARGET_VERSION = '2';

function storageGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function storageSet(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function runMigrationIfNeeded(userId: string): void {
  if (localStorage.getItem(VERSION_KEY) === TARGET_VERSION) return;

  // 1. Migrate transactions: map old category → group, keep category as Category.id
  const txns = storageGet<Transaction[]>(`pf_txns_${userId}`, []);
  const migratedTxns: Transaction[] = txns.map(t => {
    if (t.type !== 'expense') {
      // Income transactions: strip subCategory, keep category as-is
      const { ...rest } = t as Transaction & { subCategory?: string };
      delete (rest as { subCategory?: string }).subCategory;
      return rest;
    }
    const oldCat = (t as Transaction & { category?: string }).category ?? '';
    const group: Group = CAT_TO_GROUP[oldCat] ?? 'needs';
    const result: Transaction = {
      id:          t.id,
      type:        t.type,
      amount:      t.amount,
      group,
      category:    oldCat || undefined,
      description: t.description,
      date:        t.date,
    };
    if (t.notes)       result.notes       = t.notes;
    if (t.tags)        result.tags        = t.tags;
    if (t.recurringId) result.recurringId = t.recurringId;
    if (t.auto)        result.auto        = t.auto;
    return result;
  });
  storageSet(`pf_txns_${userId}`, migratedTxns);

  // 2. Migrate recurring rules
  const rules = storageGet<(RecurringRule & { category?: string })[]>(`pf_recurring_${userId}`, []);
  const migratedRules: RecurringRule[] = rules.map(r => {
    if (r.type !== 'expense') return { id: r.id, type: r.type, amount: r.amount, category: r.category, description: r.description, dayOfMonth: r.dayOfMonth };
    const oldCat = r.category ?? '';
    return {
      id:          r.id,
      type:        r.type,
      amount:      r.amount,
      group:       CAT_TO_GROUP[oldCat] ?? 'needs',
      category:    oldCat || undefined,
      description: r.description,
      dayOfMonth:  r.dayOfMonth,
    };
  });
  storageSet(`pf_recurring_${userId}`, migratedRules);

  // 3. Discard old per-category budgets (incompatible with group-level budgeting)
  storageSet(`pf_budgets_${userId}`, {});

  // 4. Seed default categories if none exist
  const existingCats = storageGet<unknown[]>(`pf_cats_${userId}`, []);
  if (existingCats.length === 0) {
    storageSet(`pf_cats_${userId}`, DEFAULT_CATEGORIES);
  }

  localStorage.setItem(VERSION_KEY, TARGET_VERSION);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/migration.ts
git commit -m "feat: add one-time v2 data migration — groups, categories, budget reset"
```

---

## Task 4: Update `src/lib/storage.ts`

**Files:**
- Modify: `src/lib/storage.ts`

Add `getCategories`/`saveCategories`. Remove `getCustomCats`/`saveCustomCats`.

- [ ] **Step 1: Replace the file contents**

```typescript
import {
  BudgetMap, Category, Currency, Goal, NetWorthData,
  RecurringRule, Transaction, UserStore,
} from './data';

const DEFAULT_CURRENCY: Currency = { code: 'INR', symbol: '₹', locale: 'en-IN' };
const DEFAULT_NW: NetWorthData = { assets: [], liabilities: [] };

function get<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function set(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function remove(key: string): void {
  localStorage.removeItem(key);
}

const p = <T>(v: T): Promise<T> => Promise.resolve(v);

export const storage = {
  getUsers:       ()                                => p(get<UserStore>('pf_users', {})),
  saveUsers:      (u: UserStore)                    => p(set('pf_users', u)),
  getSession:     ()                                => p(get<string | null>('pf_session', null)),
  setSession:     (u: string)                       => p(set('pf_session', u)),
  clearSession:   ()                                => p(remove('pf_session')),
  getTxns:        (user: string)                    => p(get<Transaction[]>(`pf_txns_${user}`, [])),
  saveTxns:       (user: string, d: Transaction[])  => p(set(`pf_txns_${user}`, d)),
  getBudgets:     (user: string)                    => p(get<BudgetMap>(`pf_budgets_${user}`, {})),
  saveBudgets:    (user: string, d: BudgetMap)      => p(set(`pf_budgets_${user}`, d)),
  getRecurring:   (user: string)                       => p(get<RecurringRule[]>(`pf_recurring_${user}`, [])),
  saveRecurring:  (user: string, d: RecurringRule[])   => p(set(`pf_recurring_${user}`, d)),
  getGoals:       (user: string)                    => p(get<Goal[]>(`pf_goals_${user}`, [])),
  saveGoals:      (user: string, d: Goal[])         => p(set(`pf_goals_${user}`, d)),
  getNetWorth:    (user: string)                    => p(get<NetWorthData>(`pf_nw_${user}`, DEFAULT_NW)),
  saveNetWorth:   (user: string, d: NetWorthData)   => p(set(`pf_nw_${user}`, d)),
  getCurrency:    (user: string)                    => p(get<Currency>(`pf_currency_${user}`, DEFAULT_CURRENCY)),
  saveCurrency:   (user: string, d: Currency)       => p(set(`pf_currency_${user}`, d)),
  getCategories:  (user: string)                    => p(get<Category[]>(`pf_cats_${user}`, [])),
  saveCategories: (user: string, d: Category[])     => p(set(`pf_cats_${user}`, d)),
};
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/storage.ts
git commit -m "refactor: replace customCats storage with categories storage"
```

---

## Task 5: Update `src/lib/sheets.ts`

**Files:**
- Modify: `src/lib/sheets.ts`

Update tab headers: Transactions (`group`/`category`), Budgets (`group`), add `Categories` tab, remove `CustomCategories`.

- [ ] **Step 1: Replace the `TabName` type and `TAB_HEADERS` constant (lines 5–15)**

```typescript
export type TabName = 'Transactions' | 'Budgets' | 'Goals' | 'Recurring' | 'NetWorth' | 'Settings' | 'Categories';

export const TAB_HEADERS: Record<TabName, string[]> = {
  Transactions: ['id', 'type', 'amount', 'group', 'category', 'description', 'date', 'notes', 'tags', 'recurringId', 'auto'],
  Budgets:      ['group', 'mode', 'value'],
  Goals:        ['id', 'name', 'target', 'current', 'deadline'],
  Recurring:    ['id', 'type', 'amount', 'group', 'category', 'description', 'dayOfMonth'],
  NetWorth:     ['id', 'name', 'type', 'value', 'institution', 'accountNumber', 'notes'],
  Settings:     ['currency_code', 'currency_symbol', 'currency_locale', 'lastSyncedAt', 'dark_mode', 'theme_name'],
  Categories:   ['id', 'label', 'group', 'color'],
};
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/sheets.ts
git commit -m "refactor: update Sheets tab headers for Group/Category model"
```

---

## Task 6: Update `src/lib/sync.ts`

**Files:**
- Modify: `src/lib/sync.ts`

Update all serializers and the `pushAll`/`pullAll` functions. Remove `customCat` sync, add `category` sync.

- [ ] **Step 1: Replace the full file**

```typescript
import { storage } from './storage';
import { writeTab, readTab, createSpreadsheet, verifySpreadsheet, findSpreadsheetByName } from './sheets';
import { saveSpreadsheetId } from './google-auth';
import {
  Transaction, BudgetMap, BudgetEntry, Goal,
  RecurringRule, NetWorthItem, Currency, Category, Group,
} from './data';

// ── Serializers ──────────────────────────────────────────────────────────────

function txnToRow(t: Transaction): string[] {
  return [
    t.id, t.type, String(t.amount),
    t.group ?? '', t.category ?? '',
    t.description, t.date,
    t.notes ?? '', JSON.stringify(t.tags ?? []),
    t.recurringId ?? '', t.auto ? '1' : '0',
  ];
}

function rowToTxn(r: Record<string, string>): Transaction {
  let tags: string[] | undefined;
  if (r.tags) {
    try {
      const parsed = JSON.parse(r.tags);
      tags = Array.isArray(parsed) && parsed.length > 0 ? parsed : undefined;
    } catch {
      tags = undefined;
    }
  }
  return {
    id:          r.id,
    type:        r.type as Transaction['type'],
    amount:      Number(r.amount),
    group:       (r.group || undefined) as Group | undefined,
    category:    r.category || undefined,
    description: r.description,
    date:        r.date,
    notes:       r.notes || undefined,
    tags,
    recurringId: r.recurringId || undefined,
    auto:        r.auto === '1',
  };
}

function budgetToRow(group: string, entry: BudgetEntry): string[] {
  return [group, entry.mode, String(entry.value)];
}

function rowToBudget(r: Record<string, string>): [string, BudgetEntry] {
  return [r.group, { mode: r.mode as BudgetEntry['mode'], value: Number(r.value) }];
}

function catToRow(c: Category): string[] {
  return [c.id, c.label, c.group, c.color];
}

function rowToCat(r: Record<string, string>): Category | null {
  if (!r.id || !r.label || !r.group) return null;
  return {
    id:    r.id,
    label: r.label,
    group: r.group as Group,
    color: r.color || '#8888aa',
  };
}

function goalToRow(g: Goal): string[] {
  return [g.id, g.name, String(g.target), String(g.current), g.deadline ?? ''];
}

function rowToGoal(r: Record<string, string>): Goal {
  return {
    id: r.id, name: r.name,
    target: Number(r.target), current: Number(r.current),
    deadline: r.deadline || undefined,
  };
}

function recurringToRow(r: RecurringRule): string[] {
  return [r.id, r.type, String(r.amount), r.group ?? '', r.category ?? '', r.description, String(r.dayOfMonth)];
}

function rowToRecurring(r: Record<string, string>): RecurringRule {
  return {
    id:          r.id,
    type:        r.type as RecurringRule['type'],
    amount:      Number(r.amount),
    group:       (r.group || undefined) as Group | undefined,
    category:    r.category || undefined,
    description: r.description,
    dayOfMonth:  Number(r.dayOfMonth),
  };
}

function nwItemToRow(item: NetWorthItem, type: 'asset' | 'liability'): string[] {
  return [item.id, item.name, type, String(item.value), item.institution ?? '', item.accountNumber ?? '', item.notes ?? ''];
}

function rowToNwItem(r: Record<string, string>): { item: NetWorthItem; type: 'asset' | 'liability' } {
  return {
    item: {
      id: r.id, name: r.name, value: Number(r.value),
      institution:   r.institution   || undefined,
      accountNumber: r.accountNumber || undefined,
      notes:         r.notes         || undefined,
    },
    type: r.type as 'asset' | 'liability',
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function ensureSpreadsheet(
  accessToken: string,
  spreadsheetId: string | null,
  email: string,
): Promise<{ id: string; isNew: boolean }> {
  if (spreadsheetId && await verifySpreadsheet(accessToken, spreadsheetId)) {
    return { id: spreadsheetId, isNew: false };
  }
  const namesToTry = [
    `Arya's Finance - ${email}`,
    `Artha - ${email}`,
    `Personal Finance - ${email}`,
  ];
  for (const name of namesToTry) {
    const existingId = await findSpreadsheetByName(accessToken, name);
    if (existingId) {
      await saveSpreadsheetId(existingId);
      return { id: existingId, isNew: false };
    }
  }
  const newId = await createSpreadsheet(accessToken, email);
  await saveSpreadsheetId(newId);
  return { id: newId, isNew: true };
}

export async function pushAll(
  accessToken: string,
  spreadsheetId: string,
  userId: string,
): Promise<void> {
  const [txns, budgets, goals, recurring, nw, currency, cats] = await Promise.all([
    storage.getTxns(userId),
    storage.getBudgets(userId),
    storage.getGoals(userId),
    storage.getRecurring(userId),
    storage.getNetWorth(userId),
    storage.getCurrency(userId),
    storage.getCategories(userId),
  ]);

  const budgetRows = Object.entries(budgets as BudgetMap).map(([group, entry]) =>
    budgetToRow(group, entry!),
  );
  const nwRows = [
    ...nw.assets.map(i => nwItemToRow(i, 'asset')),
    ...nw.liabilities.map(i => nwItemToRow(i, 'liability')),
  ];

  await Promise.all([
    writeTab(accessToken, spreadsheetId, 'Transactions', txns.map(txnToRow)),
    writeTab(accessToken, spreadsheetId, 'Budgets', budgetRows),
    writeTab(accessToken, spreadsheetId, 'Goals', goals.map(goalToRow)),
    writeTab(accessToken, spreadsheetId, 'Recurring', recurring.map(recurringToRow)),
    writeTab(accessToken, spreadsheetId, 'NetWorth', nwRows),
    writeTab(accessToken, spreadsheetId, 'Categories', cats.map(catToRow)),
    writeTab(accessToken, spreadsheetId, 'Settings', [
      [
        currency.code, currency.symbol, currency.locale, new Date().toISOString(),
        localStorage.getItem('pf_dark_mode') ?? 'true',
        localStorage.getItem('pf_theme_name') ?? 'violet',
      ],
    ]),
  ]);
}

export async function pullAll(
  accessToken: string,
  spreadsheetId: string,
  _userId: string,
): Promise<{
  txns:       Transaction[];
  budgets:    BudgetMap;
  goals:      Goal[];
  recurring:  RecurringRule[];
  nw:         { assets: NetWorthItem[]; liabilities: NetWorthItem[] };
  currency:   Currency;
  categories: Category[];
  prefs:      { darkMode: boolean; themeName: string };
}> {
  const DEFAULT_CURRENCY: Currency = { code: 'INR', symbol: '₹', locale: 'en-IN' };

  const [txnRows, budgetRows, goalRows, recurringRows, nwRows, catRows, settingsRows] = await Promise.all([
    readTab(accessToken, spreadsheetId, 'Transactions'),
    readTab(accessToken, spreadsheetId, 'Budgets'),
    readTab(accessToken, spreadsheetId, 'Goals'),
    readTab(accessToken, spreadsheetId, 'Recurring'),
    readTab(accessToken, spreadsheetId, 'NetWorth'),
    readTab(accessToken, spreadsheetId, 'Categories'),
    readTab(accessToken, spreadsheetId, 'Settings'),
  ]);

  const s0 = settingsRows[0];
  const nwItems = nwRows.map(rowToNwItem);
  const currency: Currency = s0
    ? {
        code:   s0.currency_code   || DEFAULT_CURRENCY.code,
        symbol: s0.currency_symbol || DEFAULT_CURRENCY.symbol,
        locale: s0.currency_locale || DEFAULT_CURRENCY.locale,
      }
    : DEFAULT_CURRENCY;

  const validThemes = ['violet', 'slate', 'rose'];
  const themeName = validThemes.includes(s0?.theme_name ?? '') ? s0!.theme_name : 'violet';

  return {
    txns:       txnRows.map(rowToTxn),
    budgets:    Object.fromEntries(budgetRows.map(rowToBudget)),
    goals:      goalRows.map(rowToGoal),
    recurring:  recurringRows.map(rowToRecurring),
    nw: {
      assets:      nwItems.filter(x => x.type === 'asset').map(x => x.item),
      liabilities: nwItems.filter(x => x.type === 'liability').map(x => x.item),
    },
    currency,
    categories: catRows.map(rowToCat).filter((c): c is Category => c !== null),
    prefs: {
      darkMode:  (s0?.dark_mode ?? 'true') !== 'false',
      themeName,
    },
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/sync.ts
git commit -m "refactor: update sync serializers for Group/Category model"
```

---

## Task 7: Update `src/hooks/useFinance.ts`

**Files:**
- Modify: `src/hooks/useFinance.ts`

Add `categories` state, remove `customCats`/`expenseCats`/`incomeCats`, run migration on `loadUser`, update demo data to use groups.

- [ ] **Step 1: Replace the imports block (lines 1–15)**

```typescript
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BudgetMap, Category, Currency, Goal, Group, NetWorthData,
  RecurringRule, Transaction, uid,
} from '../lib/data';
import { DEFAULT_CATEGORIES, INCOME_CATS } from '../constants/categories';
import { storage } from '../lib/storage';
import { setCurrency } from '../lib/format';
import { applyRecurring } from '../lib/recurring';
import {
  saveGoogleSession, getGoogleSession, clearGoogleSession,
  isTokenExpired, hasMigrated, setMigrated,
} from '../lib/google-auth';
import { ensureSpreadsheet, pushAll, pullAll } from '../lib/sync';
import { runMigrationIfNeeded } from '../lib/migration';
```

- [ ] **Step 2: Replace the `FinanceState` interface (lines 18–48)**

```typescript
export interface FinanceState {
  user:            string | null;
  email:           string | null;
  name:            string | null;
  picture:         string | null;
  loading:         boolean;
  syncError:       string | null;
  sessionNote:     string | null;
  txns:            Transaction[];
  budgets:         BudgetMap;
  goals:           Goal[];
  nw:              NetWorthData;
  recurring:       RecurringRule[];
  currency:        Currency;
  categories:      Category[];
  googleSignIn:    (accessToken: string, expiresIn: number) => Promise<string | null>;
  logout:          () => Promise<void>;
  loadDemoData:    () => Promise<void>;
  addTxn:          (t: Omit<Transaction, 'id'>) => void;
  editTxn:         (t: Transaction) => void;
  deleteTxn:       (id: string) => void;
  deleteTxns:      (ids: string[]) => void;
  setBudgets:      (b: BudgetMap) => void;
  setGoals:        (g: Goal[]) => void;
  setNw:           (n: NetWorthData) => void;
  setRecurring:    (r: RecurringRule[]) => void;
  setCurrencyPref: (c: Currency) => void;
  setCategories:   (c: Category[]) => void;
}
```

- [ ] **Step 3: Replace the state declarations inside `useFinance()` (lines 51–63) — add `categoriesState`, remove `customCats`**

```typescript
  const [user, setUser]                  = useState<string | null>(null);
  const [email, setEmail]                = useState<string | null>(null);
  const [name, setName]                  = useState<string | null>(null);
  const [picture, setPicture]            = useState<string | null>(null);
  const [loading, setLoading]            = useState(true);
  const [txns, setTxnsState]             = useState<Transaction[]>([]);
  const [budgets, setBudgetsState]       = useState<BudgetMap>({});
  const [goals, setGoalsState]           = useState<Goal[]>([]);
  const [nw, setNwState]                 = useState<NetWorthData>({ assets: [], liabilities: [] });
  const [recurring, setRecurringState]   = useState<RecurringRule[]>([]);
  const [currency, setCurrencyState]     = useState<Currency>(DEFAULT_CURRENCY);
  const [categories, setCategoriesState] = useState<Category[]>([]);
  const [syncError, setSyncError]        = useState<string | null>(null);
  const [sessionNote, setSessionNote]    = useState<string | null>(null);
```

- [ ] **Step 4: Replace the `loadUser` function (lines 89–112)**

```typescript
  async function loadUser(userId: string, userEmail?: string | null, userName?: string | null, userPicture?: string | null) {
    runMigrationIfNeeded(userId);
    const [t, b, r, g, n, c, cats] = await Promise.all([
      storage.getTxns(userId),
      storage.getBudgets(userId),
      storage.getRecurring(userId),
      storage.getGoals(userId),
      storage.getNetWorth(userId),
      storage.getCurrency(userId),
      storage.getCategories(userId),
    ]);
    const applied = applyRecurring(r, t);
    setCurrency(c);
    setUser(userId);
    setEmail(userEmail ?? null);
    setName(userName ?? null);
    setPicture(userPicture ?? null);
    setTxnsState(applied);
    setBudgetsState(b);
    setRecurringState(r);
    setGoalsState(g);
    setNwState(n);
    setCurrencyState(c);
    setCategoriesState(cats.length > 0 ? cats : DEFAULT_CATEGORIES);
  }
```

- [ ] **Step 5: Replace the sync `useEffect` lines (lines 123–129) — add categories sync, remove customCats**

```typescript
  useEffect(() => { if (user) { storage.saveTxns(user, txns);             scheduleSync(); } }, [txns,       user, scheduleSync]);
  useEffect(() => { if (user) { storage.saveBudgets(user, budgets);       scheduleSync(); } }, [budgets,    user, scheduleSync]);
  useEffect(() => { if (user) { storage.saveRecurring(user, recurring);   scheduleSync(); } }, [recurring,  user, scheduleSync]);
  useEffect(() => { if (user) { storage.saveGoals(user, goals);           scheduleSync(); } }, [goals,      user, scheduleSync]);
  useEffect(() => { if (user) { storage.saveNetWorth(user, nw);           scheduleSync(); } }, [nw,         user, scheduleSync]);
  useEffect(() => { if (user) { storage.saveCurrency(user, currency);     scheduleSync(); } }, [currency,   user, scheduleSync]);
  useEffect(() => { if (user) { storage.saveCategories(user, categories); scheduleSync(); } }, [categories, user, scheduleSync]);
```

- [ ] **Step 6: Replace the `logout` callback — remove `setCustomCatsState` call**

```typescript
  const logout = useCallback(async () => {
    if (syncTimer.current) clearTimeout(syncTimer.current);
    await clearGoogleSession();
    setUser(null);
    setEmail(null);
    setName(null);
    setPicture(null);
    setTxnsState([]);
    setBudgetsState({});
    setRecurringState([]);
    setGoalsState([]);
    setNwState({ assets: [], liabilities: [] });
    setCurrencyState(DEFAULT_CURRENCY);
    setCategoriesState([]);
  }, []);
```

- [ ] **Step 7: Replace the `googleSignIn` block that saves/loads `customCats` (lines 171–188)**

In the `isNew && !migrated` branch, replace the customCats save with categories:
```typescript
        await Promise.all([
          storage.saveTxns(info.sub, t), storage.saveBudgets(info.sub, b),
          storage.saveRecurring(info.sub, r), storage.saveGoals(info.sub, g),
          storage.saveNetWorth(info.sub, n), storage.saveCurrency(info.sub, c),
        ]);
```

In the `pullAll` branch, replace `data.customCats` with `data.categories`:
```typescript
        await Promise.all([
          storage.saveTxns(info.sub, data.txns),
          storage.saveBudgets(info.sub, data.budgets),
          storage.saveGoals(info.sub, data.goals),
          storage.saveRecurring(info.sub, data.recurring),
          storage.saveNetWorth(info.sub, data.nw),
          storage.saveCurrency(info.sub, data.currency),
          storage.saveCategories(info.sub, data.categories),
        ]);
```

- [ ] **Step 8: Replace `loadDemoData` demo budgets and add demo categories**

Replace the `DEMO_BUDGETS` and `DEMO_TXNS` inside `loadDemoData`. The demo transactions already use old category IDs — after migration they'll have `group` set. Update the budgets to use groups and add seeded categories for demo:

```typescript
    const DEMO_BUDGETS: BudgetMap = {
      needs:   { mode: 'fixed', value: 35000 },
      wants:   { mode: 'fixed', value: 20000 },
      savings: { mode: 'fixed', value: 10000 },
      family:  { mode: 'fixed', value: 6000  },
    };
```

Update `DEMO_TXNS` to use `group` and `category` fields (replace `category` with `group`+`category`):
```typescript
    const DEMO_TXNS: Transaction[] = [
      // April 2026
      { id: 'dd01', type: 'income',  amount: 85000, category: 'salary',     description: 'Monthly Salary',        date: '2026-04-01' },
      { id: 'dd02', type: 'income',  amount: 15000, category: 'freelance',  description: 'Freelance Project',      date: '2026-04-15' },
      { id: 'dd03', type: 'expense', amount: 22000, group: 'needs',   category: 'essentials',    description: 'Rent',                   date: '2026-04-02' },
      { id: 'dd04', type: 'expense', amount: 3200,  group: 'needs',   category: 'essentials',    description: 'Electricity & Internet',  date: '2026-04-05' },
      { id: 'dd05', type: 'expense', amount: 2800,  group: 'needs',   category: 'food',          description: 'Grocery Shopping',        date: '2026-04-06' },
      { id: 'dd06', type: 'expense', amount: 1200,  group: 'needs',   category: 'food',          description: 'Dinner - Zomato',         date: '2026-04-09' },
      { id: 'dd07', type: 'expense', amount: 900,   group: 'needs',   category: 'food',          description: 'Team Lunch',              date: '2026-04-12' },
      { id: 'dd08', type: 'expense', amount: 2400,  group: 'needs',   category: 'food',          description: 'Weekend Meals',           date: '2026-04-19' },
      { id: 'dd09', type: 'expense', amount: 1200,  group: 'needs',   category: 'food',          description: 'Café & Snacks',           date: '2026-04-24' },
      { id: 'dd10', type: 'expense', amount: 1800,  group: 'needs',   category: 'transport',     description: 'Petrol',                  date: '2026-04-07' },
      { id: 'dd11', type: 'expense', amount: 600,   group: 'needs',   category: 'transport',     description: 'Cab Rides',               date: '2026-04-14' },
      { id: 'dd12', type: 'expense', amount: 800,   group: 'needs',   category: 'transport',     description: 'Metro Pass',              date: '2026-04-01' },
      { id: 'dd13', type: 'expense', amount: 3500,  group: 'wants',   category: 'entertainment', description: 'OTT + Cinema',            date: '2026-04-10' },
      { id: 'dd14', type: 'expense', amount: 2800,  group: 'wants',   category: 'entertainment', description: 'Weekend Getaway',         date: '2026-04-21' },
      { id: 'dd15', type: 'expense', amount: 8500,  group: 'wants',   category: 'shopping',      description: 'Clothing - Myntra',       date: '2026-04-17' },
      { id: 'dd16', type: 'expense', amount: 3800,  group: 'wants',   category: 'shopping',      description: 'Electronics - Amazon',    date: '2026-04-22' },
      { id: 'dd17', type: 'expense', amount: 2500,  group: 'needs',   category: 'health',        description: 'Health Checkup + Meds',  date: '2026-04-11' },
      { id: 'dd18', type: 'expense', amount: 10000, group: 'savings', category: 'savings',       description: 'SIP Investment',          date: '2026-04-05' },
      { id: 'dd19', type: 'expense', amount: 5000,  group: 'family',  category: 'family',        description: 'Parents Transfer',        date: '2026-04-08' },
      { id: 'dd20', type: 'expense', amount: 3200,  group: 'wants',   category: 'shopping',      description: 'Amazon Order',            date: '2026-04-22' },
      { id: 'dd21', type: 'expense', amount: 800,   group: 'needs',   category: 'food',          description: 'Coffee & Snacks',         date: '2026-04-23' },
      { id: 'dd22', type: 'expense', amount: 1500,  group: 'needs',   category: 'food',          description: 'Restaurant',              date: '2026-04-24' },
      { id: 'dd23', type: 'expense', amount: 2100,  group: 'needs',   category: 'transport',     description: 'Cab - Airport',           date: '2026-04-26' },
      { id: 'dd24', type: 'expense', amount: 4200,  group: 'wants',   category: 'entertainment', description: 'Concert Tickets',         date: '2026-04-27' },
      { id: 'dd25', type: 'expense', amount: 1200,  group: 'needs',   category: 'food',          description: 'Breakfast - Swiggy',      date: '2026-04-28' },
      // March 2026
      { id: 'dd26', type: 'income',  amount: 85000, category: 'salary',     description: 'Monthly Salary',        date: '2026-03-01' },
      { id: 'dd27', type: 'expense', amount: 22000, group: 'needs',   category: 'essentials',    description: 'Rent',                   date: '2026-03-02' },
      { id: 'dd28', type: 'expense', amount: 7800,  group: 'needs',   category: 'food',          description: 'Food & Dining',          date: '2026-03-15' },
      { id: 'dd29', type: 'expense', amount: 4200,  group: 'wants',   category: 'shopping',      description: 'Shopping',               date: '2026-03-20' },
      { id: 'dd30', type: 'expense', amount: 3100,  group: 'wants',   category: 'entertainment', description: 'Entertainment',          date: '2026-03-12' },
      { id: 'dd31', type: 'expense', amount: 10000, group: 'savings', category: 'savings',       description: 'SIP Investment',         date: '2026-03-05' },
      { id: 'dd32', type: 'expense', amount: 5000,  group: 'family',  category: 'family',        description: 'Parents Transfer',       date: '2026-03-08' },
      { id: 'dd33', type: 'expense', amount: 2800,  group: 'needs',   category: 'transport',     description: 'Transport',              date: '2026-03-10' },
      // February 2026
      { id: 'dd34', type: 'income',  amount: 85000, category: 'salary',     description: 'Monthly Salary',        date: '2026-02-01' },
      { id: 'dd35', type: 'income',  amount: 8000,  category: 'freelance',  description: 'Freelance - Design',    date: '2026-02-20' },
      { id: 'dd36', type: 'expense', amount: 22000, group: 'needs',   category: 'essentials',    description: 'Rent',                   date: '2026-02-02' },
      { id: 'dd37', type: 'expense', amount: 9200,  group: 'needs',   category: 'food',          description: 'Food & Dining',          date: '2026-02-14' },
      { id: 'dd38', type: 'expense', amount: 6500,  group: 'wants',   category: 'shopping',      description: 'Valentine Shopping',     date: '2026-02-14' },
      { id: 'dd39', type: 'expense', amount: 5800,  group: 'wants',   category: 'entertainment', description: 'Entertainment',          date: '2026-02-18' },
      { id: 'dd40', type: 'expense', amount: 10000, group: 'savings', category: 'savings',       description: 'SIP Investment',         date: '2026-02-05' },
      { id: 'dd41', type: 'expense', amount: 5000,  group: 'family',  category: 'family',        description: 'Parents Transfer',       date: '2026-02-08' },
      // January 2026
      { id: 'dd42', type: 'income',  amount: 85000, category: 'salary',     description: 'Monthly Salary',        date: '2026-01-01' },
      { id: 'dd43', type: 'expense', amount: 22000, group: 'needs',   category: 'essentials',    description: 'Rent',                   date: '2026-01-02' },
      { id: 'dd44', type: 'expense', amount: 6800,  group: 'needs',   category: 'food',          description: 'Food & Dining',          date: '2026-01-15' },
      { id: 'dd45', type: 'expense', amount: 3200,  group: 'wants',   category: 'shopping',      description: 'Shopping',               date: '2026-01-22' },
      { id: 'dd46', type: 'expense', amount: 2800,  group: 'wants',   category: 'entertainment', description: 'Entertainment',          date: '2026-01-12' },
      { id: 'dd47', type: 'expense', amount: 10000, group: 'savings', category: 'savings',       description: 'SIP Investment',         date: '2026-01-05' },
      { id: 'dd48', type: 'expense', amount: 5000,  group: 'family',  category: 'family',        description: 'Parents Transfer',       date: '2026-01-08' },
    ];
```

Also update `loadDemoData`'s storage calls and state setters — replace `customCats` with `categories`:
```typescript
    await Promise.all([
      storage.saveTxns('demo', DEMO_TXNS),
      storage.saveBudgets('demo', DEMO_BUDGETS),
      storage.saveGoals('demo', DEMO_GOALS),
      storage.saveNetWorth('demo', DEMO_NW),
      storage.saveCategories('demo', DEFAULT_CATEGORIES),
    ]);
    // ... (keep the existing saveGoogleSession / setCurrency calls) ...
    setCategoriesState(DEFAULT_CATEGORIES);
```

- [ ] **Step 9: Replace the return statement — remove `expenseCats`/`incomeCats`/`customCats`, add `categories`/`setCategories`**

```typescript
  const setCategories = useCallback((c: Category[]) => setCategoriesState(c), []);

  return {
    user, email, name, picture, loading, txns, budgets, goals, nw, recurring, currency, categories,
    syncError, sessionNote,
    googleSignIn, logout, loadDemoData,
    addTxn, editTxn, deleteTxn, deleteTxns,
    setBudgets, setGoals, setNw, setRecurring, setCurrencyPref, setCategories,
  };
```

- [ ] **Step 10: Verify TypeScript compiles (errors expected only in UI files not yet updated)**

Run: `npx tsc --noEmit 2>&1 | grep "error TS" | head -20`

Expected: Errors in `Budget.tsx`, `AddTransactionModal.tsx`, `Analytics.tsx`, `Dashboard.tsx`, `Monthly.tsx`. No errors in `useFinance.ts` itself.

- [ ] **Step 11: Commit**

```bash
git add src/hooks/useFinance.ts
git commit -m "refactor: replace customCats/expenseCats with categories in useFinance"
```

---

## Task 8: Update `src/hooks/FinanceContext.tsx`

**Files:**
- Modify: `src/hooks/FinanceContext.tsx`

The context is a thin wrapper — `FinanceState` already has the new shape, so this file just needs the import cleaned up.

- [ ] **Step 1: Replace the file**

```typescript
import React, { createContext, useContext, useState } from 'react';
import { useFinance, FinanceState } from './useFinance';
import { Transaction } from '../lib/data';

interface FinanceContextValue extends FinanceState {
  openAdd:      () => void;
  openEdit:     (t: Transaction) => void;
  modalVisible: boolean;
  editItem:     Transaction | null;
  closeModal:   () => void;
}

export const FinanceContext = createContext<FinanceContextValue | null>(null);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const finance = useFinance();
  const [modalVisible, setModalVisible] = useState(false);
  const [editItem, setEditItem]         = useState<Transaction | null>(null);

  const openAdd   = () => { setEditItem(null); setModalVisible(true); };
  const openEdit  = (t: Transaction) => { setEditItem(t); setModalVisible(true); };
  const closeModal = () => { setModalVisible(false); setEditItem(null); };

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

export { useFinanceContext as useFinance };
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/FinanceContext.tsx
git commit -m "refactor: update FinanceContext for new FinanceState shape"
```

---

## Task 9: Rewrite `src/pages/Budget.tsx`

**Files:**
- Modify: `src/pages/Budget.tsx`

4 group cards, budget keyed by group, expandable category breakdown per card.

- [ ] **Step 1: Replace the full file**

```typescript
import { useState } from 'react'
import { useFinanceContext } from '../hooks/FinanceContext'
import { fmt } from '../lib/format'
import { Group, GROUPS, GROUP_LABELS, resolveLimit } from '../lib/data'
import Card from '../components/ui/Card'
import ProgressBar from '../components/ui/ProgressBar'

export default function Budget() {
  const { txns, budgets, setBudgets, categories } = useFinanceContext()
  const [editing, setEditing]   = useState<Group | null>(null)
  const [editMode, setEditMode] = useState<'fixed' | 'pct'>('fixed')
  const [editValue, setEditValue] = useState('')
  const [expanded, setExpanded] = useState<Group | null>(null)

  const now = new Date()
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`
  const monthTxns = txns.filter(t => t.date.startsWith(thisMonth))
  const monthIncome = monthTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)

  function startEdit(group: Group) {
    const entry = budgets[group]
    setEditMode(entry?.mode ?? 'fixed')
    setEditValue(entry ? String(entry.value) : '')
    setEditing(group)
  }

  function saveEdit(group: Group) {
    const v = parseFloat(editValue)
    if (!isNaN(v) && v >= 0) {
      setBudgets({ ...budgets, [group]: { mode: editMode, value: v } })
    }
    setEditing(null)
  }

  function clearBudget(group: Group) {
    const next = { ...budgets }
    delete next[group]
    setBudgets(next)
    setEditing(null)
  }

  return (
    <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Budget Tracker</div>
        <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>
          Month income: <span style={{ color: 'var(--positive)', fontFamily: 'DM Mono' }}>{fmt(monthIncome)}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        {GROUPS.map((group, i) => {
          const entry = budgets[group]
          const limit = resolveLimit(entry, monthIncome)
          const spent = monthTxns
            .filter(t => t.type === 'expense' && t.group === group)
            .reduce((s, t) => s + t.amount, 0)
          const pct = limit > 0 ? (spent / limit) * 100 : 0
          const groupCats = categories.filter(c => c.group === group)
          const isExpanded = expanded === group

          return (
            <Card key={group} delay={i * 0.06}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{GROUP_LABELS[group]}</div>
                  {entry && (
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
                      {entry.mode === 'pct' ? `${entry.value}% of income` : fmt(entry.value)}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => startEdit(group)} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 8, border: '1px solid var(--border)', background: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>Edit</button>
                  {entry && <button onClick={() => clearBudget(group)} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 8, border: '1px solid var(--border)', background: 'none', color: 'var(--negative)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>}
                </div>
              </div>

              {editing === group ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {(['fixed', 'pct'] as const).map(m => (
                      <button key={m} onClick={() => setEditMode(m)} style={{ flex: 1, padding: '5px 0', borderRadius: 8, border: editMode === m ? '1px solid var(--accent)' : '1px solid var(--border)', background: editMode === m ? 'var(--accent-dim)' : 'var(--surface2)', color: editMode === m ? 'var(--accent)' : 'var(--text-dim)', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                        {m === 'fixed' ? 'Fixed' : '% of income'}
                      </button>
                    ))}
                  </div>
                  <input
                    value={editValue} onChange={e => setEditValue(e.target.value)}
                    type="number" min="0" placeholder={editMode === 'pct' ? 'e.g. 40' : 'e.g. 35000'}
                    autoFocus
                    style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: 13, fontFamily: 'DM Sans', outline: 'none', width: '100%' }}
                    onKeyDown={e => { if (e.key === 'Enter') saveEdit(group); if (e.key === 'Escape') setEditing(null) }}
                  />
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => saveEdit(group)} style={{ flex: 1, padding: '6px 0', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Save</button>
                    <button onClick={() => setEditing(null)} style={{ flex: 1, padding: '6px 0', borderRadius: 8, border: '1px solid var(--border)', background: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 12 }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <ProgressBar pct={pct} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12 }}>
                    <span style={{ color: 'var(--text-dim)' }}>Spent: <span style={{ color: 'var(--text)', fontFamily: 'DM Mono' }}>{fmt(spent)}</span></span>
                    {limit > 0
                      ? <span style={{ color: pct >= 90 ? 'var(--negative)' : pct >= 70 ? 'var(--warning)' : 'var(--positive)', fontWeight: 600 }}>{Math.round(pct)}%</span>
                      : <span style={{ color: 'var(--text-dim)' }}>No budget</span>
                    }
                  </div>
                  {limit > 0 && (
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
                      Remaining: <span style={{ color: limit - spent >= 0 ? 'var(--positive)' : 'var(--negative)', fontFamily: 'DM Mono', fontWeight: 500 }}>{fmt(Math.abs(limit - spent))}</span>
                    </div>
                  )}

                  {/* Category breakdown toggle */}
                  {groupCats.length > 0 && (
                    <button
                      onClick={() => setExpanded(isExpanded ? null : group)}
                      style={{ marginTop: 10, fontSize: 11, color: 'var(--text-dim)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}
                    >
                      {isExpanded ? '▲ Hide categories' : `▼ ${groupCats.length} categories`}
                    </button>
                  )}
                  {isExpanded && (
                    <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {groupCats.map(cat => {
                        const catSpent = monthTxns
                          .filter(t => t.type === 'expense' && t.group === group && t.category === cat.id)
                          .reduce((s, t) => s + t.amount, 0)
                        return (
                          <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                            <div style={{ width: 6, height: 6, borderRadius: 3, background: cat.color, flexShrink: 0 }} />
                            <span style={{ flex: 1, color: 'var(--text-dim)' }}>{cat.label}</span>
                            <span style={{ color: 'var(--text)', fontFamily: 'DM Mono' }}>{fmt(catSpent)}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/Budget.tsx
git commit -m "feat: rewrite Budget page with 4 group cards and category breakdown"
```

---

## Task 10: Update `src/components/modals/AddTransactionModal.tsx`

**Files:**
- Modify: `src/components/modals/AddTransactionModal.tsx`

Two-step group → category picker for expenses. Income uses flat single-step picker.

- [ ] **Step 1: Replace the full file**

```typescript
import { useState, useEffect } from 'react'
import { useFinanceContext } from '../../hooks/FinanceContext'
import { Group, GROUPS, GROUP_LABELS, TxnType } from '../../lib/data'
import { INCOME_CATS } from '../../constants/categories'

export default function AddTransactionModal() {
  const { modalVisible, editItem, closeModal, addTxn, editTxn, categories } = useFinanceContext()
  const [type, setType]         = useState<TxnType>('expense')
  const [amount, setAmount]     = useState('')
  const [group, setGroup]       = useState<Group | ''>('')
  const [cat, setCat]           = useState('')
  const [desc, setDesc]         = useState('')
  const [date, setDate]         = useState(new Date().toISOString().slice(0, 10))
  const [notes, setNotes]       = useState('')
  const [tags, setTags]         = useState('')

  useEffect(() => {
    if (editItem) {
      setType(editItem.type)
      setAmount(String(editItem.amount))
      setGroup((editItem.group ?? '') as Group | '')
      setCat(editItem.category ?? '')
      setDesc(editItem.description)
      setDate(editItem.date)
      setNotes(editItem.notes ?? '')
      setTags((editItem.tags ?? []).join(', '))
    } else {
      setType('expense'); setAmount(''); setGroup(''); setCat('')
      setDesc(''); setDate(new Date().toISOString().slice(0, 10))
      setNotes(''); setTags('')
    }
  }, [editItem, modalVisible])

  if (!modalVisible) return null

  const groupCats = group ? categories.filter(c => c.group === group) : []

  function handleSave() {
    const amt = parseFloat(amount)
    if (!amt || !desc) return
    if (type === 'expense' && !group) return
    const txn = {
      type,
      amount: amt,
      group:     type === 'expense' ? (group as Group) : undefined,
      category:  cat || undefined,
      description: desc,
      date,
      notes:  notes || undefined,
      tags:   tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
    }
    if (editItem) editTxn({ ...txn, id: editItem.id })
    else addTxn(txn)
    closeModal()
  }

  const canSave = !!parseFloat(amount) && !!desc && (type === 'income' || !!group)

  const inputStyle: React.CSSProperties = {
    padding: '9px 12px', borderRadius: 10, border: '1px solid var(--border)',
    background: 'var(--surface2)', color: 'var(--text)', fontSize: 13,
    width: '100%', fontFamily: 'DM Sans', outline: 'none',
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={closeModal}
    >
      <div
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 22, padding: 28, width: '100%', maxWidth: 440, display: 'flex', flexDirection: 'column', gap: 16, animation: 'scaleIn 0.2s ease both' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{editItem ? 'Edit Transaction' : 'Add Transaction'}</h2>
          <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', fontSize: 20, lineHeight: 1 }}>×</button>
        </div>

        {/* Type toggle */}
        <div style={{ display: 'flex', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 24, padding: 3, gap: 2 }}>
          {(['expense', 'income'] as TxnType[]).map(t => (
            <button key={t} onClick={() => { setType(t); setGroup(''); setCat('') }} style={{ flex: 1, padding: '7px 0', borderRadius: 20, border: 'none', cursor: 'pointer', background: type === t ? 'var(--accent)' : 'transparent', color: type === t ? '#fff' : 'var(--text-dim)', fontWeight: 600, fontSize: 13, textTransform: 'capitalize', transition: 'all 0.2s' }}>{t}</button>
          ))}
        </div>

        <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Description *" style={inputStyle} />
        <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount *" type="number" min="0" step="0.01" style={inputStyle} />
        <input value={date} onChange={e => setDate(e.target.value)} type="date" style={inputStyle} />

        {/* Group + Category pickers (expenses) */}
        {type === 'expense' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 8 }}>Group *</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {GROUPS.map(g => (
                  <button key={g} onClick={() => { setGroup(g); setCat('') }} style={{
                    padding: '6px 14px', borderRadius: 20, cursor: 'pointer', fontSize: 12, fontWeight: group === g ? 600 : 400,
                    border: group === g ? '1px solid var(--accent)' : '1px solid var(--border)',
                    background: group === g ? 'var(--accent-dim)' : 'var(--surface2)',
                    color: group === g ? 'var(--accent)' : 'var(--text-dim)',
                    transition: 'all 0.12s',
                  }}>{GROUP_LABELS[g]}</button>
                ))}
              </div>
            </div>

            {group && groupCats.length > 0 && (
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 8 }}>Category <span style={{ opacity: 0.6 }}>(optional)</span></div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {groupCats.map(c => (
                    <button key={c.id} onClick={() => setCat(cat === c.id ? '' : c.id)} style={{
                      padding: '5px 11px', borderRadius: 20, cursor: 'pointer', fontSize: 11, fontWeight: cat === c.id ? 600 : 400,
                      border: cat === c.id ? `1px solid ${c.color}` : '1px solid var(--border)',
                      background: cat === c.id ? `${c.color}22` : 'var(--surface2)',
                      color: cat === c.id ? c.color : 'var(--text-dim)',
                      transition: 'all 0.12s',
                    }}>{c.label}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Income category picker (flat) */}
        {type === 'income' && (
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 8 }}>Category</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {INCOME_CATS.map(c => (
                <button key={c.id} onClick={() => setCat(cat === c.id ? '' : c.id)} style={{
                  padding: '5px 11px', borderRadius: 20, cursor: 'pointer', fontSize: 11, fontWeight: cat === c.id ? 600 : 400,
                  border: cat === c.id ? `1px solid ${c.color}` : '1px solid var(--border)',
                  background: cat === c.id ? `${c.color}22` : 'var(--surface2)',
                  color: cat === c.id ? c.color : 'var(--text-dim)',
                  transition: 'all 0.12s',
                }}>{c.label}</button>
              ))}
            </div>
          </div>
        )}

        <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes (optional)" style={inputStyle} />
        <input value={tags} onChange={e => setTags(e.target.value)} placeholder="Tags, comma separated" style={inputStyle} />

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
          <button onClick={closeModal} style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid var(--border)', background: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
          <button onClick={handleSave} disabled={!canSave} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, opacity: !canSave ? 0.5 : 1 }}>Save</button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/modals/AddTransactionModal.tsx
git commit -m "feat: two-step group→category picker in AddTransactionModal"
```

---

## Task 11: Create `src/pages/CategorySetup.tsx`

**Files:**
- Create: `src/pages/CategorySetup.tsx`

Four collapsible group sections. Add/edit/delete categories per group.

- [ ] **Step 1: Create the file**

```typescript
import { useState } from 'react'
import { useFinanceContext } from '../hooks/FinanceContext'
import { Category, Group, GROUPS, GROUP_LABELS, uid } from '../lib/data'
import { nextCatColor } from '../constants/categories'
import Card from '../components/ui/Card'

export default function CategorySetup() {
  const { categories, setCategories } = useFinanceContext()
  const [openGroup, setOpenGroup]   = useState<Group | null>('needs')
  const [editingId, setEditingId]   = useState<string | null>(null)
  const [addingGroup, setAddingGroup] = useState<Group | null>(null)
  const [labelInput, setLabelInput] = useState('')
  const [colorInput, setColorInput] = useState('#5a9fff')

  function startAdd(group: Group) {
    setAddingGroup(group)
    setEditingId(null)
    setLabelInput('')
    setColorInput(nextCatColor(categories))
  }

  function startEdit(cat: Category) {
    setEditingId(cat.id)
    setAddingGroup(null)
    setLabelInput(cat.label)
    setColorInput(cat.color)
  }

  function saveAdd() {
    if (!labelInput.trim() || !addingGroup) return
    const newCat: Category = {
      id:       uid(),
      label:    labelInput.trim(),
      group:    addingGroup,
      color:    colorInput,
      isCustom: true,
    }
    setCategories([...categories, newCat])
    setAddingGroup(null)
    setLabelInput('')
  }

  function saveEdit() {
    if (!labelInput.trim() || !editingId) return
    setCategories(categories.map(c =>
      c.id === editingId ? { ...c, label: labelInput.trim(), color: colorInput } : c,
    ))
    setEditingId(null)
    setLabelInput('')
  }

  function deleteCategory(id: string) {
    setCategories(categories.filter(c => c.id !== id))
  }

  const inputStyle: React.CSSProperties = {
    padding: '7px 10px', borderRadius: 8, border: '1px solid var(--border)',
    background: 'var(--surface2)', color: 'var(--text)', fontSize: 13,
    fontFamily: 'DM Sans', outline: 'none',
  }

  return (
    <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 640 }}>
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Category Setup</div>
        <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>Define categories for each budget group. Used when adding transactions.</div>
      </div>

      {GROUPS.map((group, i) => {
        const groupCats = categories.filter(c => c.group === group)
        const isOpen = openGroup === group

        return (
          <Card key={group} delay={i * 0.05}>
            <button
              onClick={() => setOpenGroup(isOpen ? null : group)}
              style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{GROUP_LABELS[group]}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{groupCats.length} categories</span>
                <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>{isOpen ? '▲' : '▼'}</span>
              </div>
            </button>

            {isOpen && (
              <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {groupCats.map(cat => (
                  <div key={cat.id}>
                    {editingId === cat.id ? (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <input type="color" value={colorInput} onChange={e => setColorInput(e.target.value)} style={{ width: 32, height: 32, borderRadius: 6, border: 'none', cursor: 'pointer', padding: 2, background: 'none' }} />
                        <input value={labelInput} onChange={e => setLabelInput(e.target.value)} style={{ ...inputStyle, flex: 1 }} onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditingId(null) }} autoFocus />
                        <button onClick={saveEdit} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Save</button>
                        <button onClick={() => setEditingId(null)} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 12 }}>Cancel</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0' }}>
                        <div style={{ width: 10, height: 10, borderRadius: 5, background: cat.color, flexShrink: 0 }} />
                        <span style={{ flex: 1, fontSize: 13, color: 'var(--text)' }}>{cat.label}</span>
                        <button onClick={() => startEdit(cat)} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>Edit</button>
                        <button onClick={() => deleteCategory(cat.id)} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'none', color: 'var(--negative)', cursor: 'pointer' }}>Delete</button>
                      </div>
                    )}
                  </div>
                ))}

                {addingGroup === group ? (
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4 }}>
                    <input type="color" value={colorInput} onChange={e => setColorInput(e.target.value)} style={{ width: 32, height: 32, borderRadius: 6, border: 'none', cursor: 'pointer', padding: 2, background: 'none' }} />
                    <input value={labelInput} onChange={e => setLabelInput(e.target.value)} placeholder="Category name" style={{ ...inputStyle, flex: 1 }} onKeyDown={e => { if (e.key === 'Enter') saveAdd(); if (e.key === 'Escape') setAddingGroup(null) }} autoFocus />
                    <button onClick={saveAdd} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Add</button>
                    <button onClick={() => setAddingGroup(null)} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 12 }}>Cancel</button>
                  </div>
                ) : (
                  <button onClick={() => startAdd(group)} style={{ marginTop: 4, fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', textAlign: 'left' }}>+ Add category</button>
                )}
              </div>
            )}
          </Card>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/CategorySetup.tsx
git commit -m "feat: add CategorySetup page for managing categories per group"
```

---

## Task 12: Wire up routing and navigation

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/layout/Sidebar.tsx`

- [ ] **Step 1: Add the `/categories` route in `src/App.tsx`**

Add the import at the top:
```typescript
import CategorySetup from './pages/CategorySetup'
```

Add the route inside the authenticated `<Route path="/">`:
```typescript
          <Route path="categories" element={<CategorySetup />} />
```

- [ ] **Step 2: Add the Categories nav item in `src/components/layout/Sidebar.tsx`**

Add to the `NAV` array after the Budget entry:
```typescript
  { to: '/categories', label: 'Categories', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg> },
```

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx src/components/layout/Sidebar.tsx
git commit -m "feat: add Categories route and sidebar nav entry"
```

---

## Task 13: Update `src/pages/Analytics.tsx`

**Files:**
- Modify: `src/pages/Analytics.tsx`

Replace `expenseCats` usage with `categories`. Add a two-level view: group-level breakdown and optional category drill-down.

- [ ] **Step 1: Replace the relevant state and data computations (read the full file first)**

Read the full file:

```
src/pages/Analytics.tsx
```

Replace the destructure and `catBreakdown` computation:

```typescript
  const { txns, categories } = useFinanceContext()
```

Replace the `catBreakdown` block with a group-level and category-level breakdown:
```typescript
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)

  // Group-level breakdown for current month
  const groupBreakdown = (['needs', 'family', 'savings', 'wants'] as const).map(group => {
    const amount = monthExpTxns.filter(t => t.group === group).reduce((s, t) => s + t.amount, 0)
    const groupCats = categories.filter(c => c.group === group)
    const color = groupCats[0]?.color ?? '#8888aa'
    return { id: group, label: GROUP_LABELS[group], amount, color, groupCats }
  }).filter(g => g.amount > 0).sort((a, b) => b.amount - a.amount)

  // Category-level drill-down for selected group
  const catBreakdown = selectedGroup
    ? categories
        .filter(c => c.group === selectedGroup)
        .map(c => ({
          ...c,
          amount: monthExpTxns.filter(t => t.group === selectedGroup && t.category === c.id).reduce((s, t) => s + t.amount, 0),
        }))
        .filter(c => c.amount > 0)
        .sort((a, b) => b.amount - a.amount)
    : []
```

Also add the import for `GROUP_LABELS` and `Group`:
```typescript
import { GROUP_LABELS } from '../lib/data'
```

- [ ] **Step 2: Replace the category breakdown section in the JSX**

Replace the section that renders `catBreakdown` (the "This Month" card) with:
```typescript
        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>This Month by Group</div>
          <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 16 }}>{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {groupBreakdown.map(g => (
              <div key={g.id}>
                <div
                  onClick={() => setSelectedGroup(selectedGroup === g.id ? null : g.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: selectedGroup === g.id ? 6 : 0 }}
                >
                  <div style={{ width: 8, height: 8, borderRadius: 4, background: g.color, flexShrink: 0 }} />
                  <div style={{ flex: 1, fontSize: 13, color: 'var(--text)' }}>{g.label}</div>
                  <div style={{ fontSize: 13, color: 'var(--text)', fontFamily: 'DM Mono' }}>{fmt(g.amount)}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', minWidth: 36, textAlign: 'right' }}>{totalExp > 0 ? `${Math.round((g.amount / totalExp) * 100)}%` : '—'}</div>
                </div>
                {selectedGroup === g.id && catBreakdown.map(c => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0 3px 16px' }}>
                    <div style={{ width: 6, height: 6, borderRadius: 3, background: c.color, flexShrink: 0 }} />
                    <div style={{ flex: 1, fontSize: 12, color: 'var(--text-dim)' }}>{c.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--text)', fontFamily: 'DM Mono' }}>{fmt(c.amount)}</div>
                  </div>
                ))}
              </div>
            ))}
            {groupBreakdown.length === 0 && <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>No expenses this month.</div>}
          </div>
        </Card>
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/Analytics.tsx
git commit -m "feat: update Analytics with group-level breakdown and category drill-down"
```

---

## Task 14: Update `src/pages/Dashboard.tsx` and `src/pages/Monthly.tsx`

**Files:**
- Modify: `src/pages/Dashboard.tsx`
- Modify: `src/pages/Monthly.tsx`

- [ ] **Step 1: Fix `Dashboard.tsx` — replace `expenseCats`/`incomeCats` references**

In `Dashboard.tsx`, the `expenseCats` and `incomeCats` are used for the spending breakdown donut. Replace the destructure:

```typescript
  const { txns, nw, categories } = useFinanceContext()
```

Find the section that computes the donut chart data using `expenseCats` and replace it with groups:
```typescript
  // Spending by group for donut chart
  const monthExpTxns = monthTxns.filter(t => t.type === 'expense')
  const totalMonthExp = monthExpTxns.reduce((s, t) => s + t.amount, 0)
  const donutData = (['needs', 'family', 'savings', 'wants'] as const)
    .map(group => {
      const amount = monthExpTxns.filter(t => t.group === group).reduce((s, t) => s + t.amount, 0)
      const firstCat = categories.find(c => c.group === group)
      return { label: GROUP_LABELS[group], amount, color: firstCat?.color ?? '#8888aa' }
    })
    .filter(d => d.amount > 0)
```

Add the import for `GROUP_LABELS`:
```typescript
import { GROUP_LABELS } from '../lib/data'
```

- [ ] **Step 2: Fix `Monthly.tsx` — replace `expenseCats`/`CatGroup` references**

In `Monthly.tsx`, replace the destructure:
```typescript
  const { txns, categories } = useFinanceContext()
```

Replace `import { CatGroup, GROUP_LABELS } from '../lib/data'` → `import { Group, GROUP_LABELS, GROUPS } from '../lib/data'`

Find the section computing expense breakdown by category and replace with group-level:
```typescript
  const expByGroup = GROUPS.map(group => ({
    group,
    label:  GROUP_LABELS[group],
    amount: monthTxns.filter(t => t.type === 'expense' && t.group === group).reduce((s, t) => s + t.amount, 0),
    cats:   categories.filter(c => c.group === group).map(cat => ({
      ...cat,
      amount: monthTxns.filter(t => t.type === 'expense' && t.group === group && t.category === cat.id).reduce((s, t) => s + t.amount, 0),
    })).filter(c => c.amount > 0),
  })).filter(g => g.amount > 0)
```

Update any JSX that maps over `expenseCats` or `CatGroup` to use `expByGroup` instead.

- [ ] **Step 3: Verify the build compiles**

Run: `npm run build`

Expected: Build succeeds with zero TypeScript errors. Fix any remaining TS errors before continuing.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Dashboard.tsx src/pages/Monthly.tsx
git commit -m "refactor: replace expenseCats/CatGroup with categories/Group in Dashboard and Monthly"
```

---

## Task 15: Fix `src/pages/Transactions.tsx` CSV import

**Files:**
- Modify: `src/pages/Transactions.tsx`

The CSV import parses a `subcat:` prefix in notes to extract a sub-category. Update this to map the imported category to a group and store it correctly.

- [ ] **Step 1: Update the CSV import parsing block (lines 103–119)**

Find the CSV import section and update it to derive `group` from the imported category:

```typescript
        const cols = line.split(',').map(c => c.replace(/^"|"$/g, '').replace(/""/g, '"'))
        const [date, description, category, type, amount, rawNotes] = cols
        if (date && description && category && type && amount) {
          let notes: string | undefined
          if (rawNotes) {
            const rest = rawNotes.replace(/subcat:[^|;]*/, '').replace(/^[|;\s]+/, '').trim()
            notes = rest || undefined
          }
          const txnGroup = CAT_TO_GROUP[category] ?? undefined
          addTxn({
            date, description,
            group:    txnGroup,
            category: category || undefined,
            type:     type as 'expense' | 'income',
            amount:   parseFloat(amount) || 0,
            notes,
          })
        }
```

Add the import at the top of Transactions.tsx:
```typescript
import { CAT_TO_GROUP } from '../constants/categories'
```

- [ ] **Step 2: Update the transaction list display — replace `t.subCategory` with `t.category`**

Find the line that renders `{t.subCategory && ...}` (line 268) and replace:
```typescript
                    {t.category && t.type === 'expense' && <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 1 }}>{t.category}</div>}
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/Transactions.tsx
git commit -m "refactor: update Transactions CSV import and display for new group/category fields"
```

---

## Task 16: Final build verification

- [ ] **Step 1: Run full build**

```bash
npm run build
```

Expected: Exits with code 0. No TypeScript errors.

- [ ] **Step 2: Start dev server and verify manually**

```bash
npm run dev
```

Open the app in a browser and verify:
1. Budget page shows 4 group cards (Needs, Wants, Savings, Family) — not 9 category cards
2. Click "Edit" on a card — fixed/% toggle + input + save/cancel works
3. Click "▼ N categories" — category breakdown expands
4. Add Transaction → Expense: Group buttons appear, after picking a group, Category chips appear below
5. Add Transaction → Income: flat category chips (Salary, Freelance, Other)
6. Categories page (sidebar): all 4 groups visible, categories listed, add/edit/delete works
7. Analytics page: "This Month by Group" card shows groups; clicking a group row expands category breakdown
8. Dashboard donut chart reflects group-level spending (not individual categories)

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "chore: final cleanup after budget category redesign"
```

---

## Self-Review Notes

**Spec coverage check:**
- ✅ Group type with 4 values including `needs` (renamed from `essentials`)
- ✅ `Category` interface with `id`, `label`, `group`, `color`, `isCustom`
- ✅ `BudgetMap` keyed by `Group`
- ✅ Transaction: `group?: Group`, `category?: string`
- ✅ One-time migration in Task 3
- ✅ Default categories seeded (Task 3 + Task 2)
- ✅ Category Setup screen (Task 11) with add/edit/delete per group
- ✅ Budget page: 4 group cards, expandable breakdown (Task 9)
- ✅ Transaction modal: two-step group→category for expenses (Task 10)
- ✅ Income transactions: flat single-step picker, no group (Task 10)
- ✅ Analytics: group-level + category drill-down (Task 13)
- ✅ Google Sheets sync: updated headers, Categories tab added, CustomCategories removed (Tasks 5–6)
- ✅ Recurring rules: `group`/`category` fields added (Task 3 migration, Task 6 sync)
- ✅ Demo data updated to use new schema (Task 7)

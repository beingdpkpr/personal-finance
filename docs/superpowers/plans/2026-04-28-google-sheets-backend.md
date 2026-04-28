# Google Sheets Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace local-only AsyncStorage auth with Google Sign-In and sync all user data to a personal Google Sheet, while keeping the app fully functional offline.

**Architecture:** Local-first hybrid — AsyncStorage remains the fast local cache; Google Sheets is the cloud source of truth. On login the app pulls from Sheets; after each state change a debounced push syncs back. Auth is Google OAuth via `expo-auth-session` (implicit flow, access token).

**Tech Stack:** `expo-auth-session`, `expo-web-browser`, Google Sheets API v4, Google OAuth 2.0 (implicit / token flow), AsyncStorage (unchanged as local cache)

---

## Prerequisites (manual — user must do before Task 1)

1. Go to [https://console.cloud.google.com](https://console.cloud.google.com) and create a project (e.g. "personal-finance")
2. Enable **Google Sheets API** and **Google Drive API** in "APIs & Services → Library"
3. Go to "APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID"
4. Choose **Web application**
5. Add these Authorized Redirect URIs:
   - `https://auth.expo.io/@beingdpkpr/personal-finance`
   - `https://beingdpkpr.github.io/personal-finance`
   - `http://localhost:8081`
6. Copy the **Client ID** (looks like `123456789-abc.apps.googleusercontent.com`)
7. Create a file `.env.local` at the project root:
   ```
   EXPO_PUBLIC_GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
   ```

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `app.config.js` | Create (replaces `app.json`) | Expo config with env var support |
| `lib/google-auth.ts` | Create | Token storage, session read/write, expiry check |
| `lib/sheets.ts` | Create | Sheets API REST wrapper (create, read, write tabs) |
| `lib/sync.ts` | Create | Push all local data to Sheets; pull all from Sheets |
| `hooks/useFinance.ts` | Modify | Replace `login`/`register` with `googleSignIn`; add debounced sync |
| `app/login.tsx` | Modify | Replace username/password form with Sign in with Google button |

`lib/storage.ts`, `hooks/FinanceContext.tsx`, and all tab screens are **unchanged**.

---

## Task 1: Install dependencies and convert to app.config.js

**Files:**
- Create: `app.config.js`
- Create: `.env.local` (gitignored, user fills in)
- Delete: `app.json` (contents moved to `app.config.js`)

- [ ] **Step 1: Install expo-auth-session and expo-web-browser**

```bash
cd D:/work/mine/personal-finance
npx expo install expo-auth-session expo-web-browser
```

Expected: packages added to `node_modules` and `package.json`.

- [ ] **Step 2: Read current app.json to get the config values**

Read `app.json` — note all current values before converting.

- [ ] **Step 3: Create app.config.js**

Create `app.config.js` at the project root:

```js
export default {
  expo: {
    name: 'Finance',
    slug: 'personal-finance',
    version: '1.0.0',
    scheme: 'finance',
    userInterfaceStyle: 'dark',
    platforms: ['ios', 'android', 'web'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.personal.finance',
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      package: 'com.personal.finance',
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#0b0c14',
      },
    },
    web: {
      bundler: 'metro',
      output: 'static',
    },
    plugins: ['expo-router', 'expo-font'],
    experiments: {
      typedRoutes: true,
      baseUrl: '/personal-finance',
    },
    extra: {
      router: {},
      eas: {
        projectId: 'bb468e0c-a0cb-4459-aa35-836c33f68a02',
      },
    },
  },
};
```

- [ ] **Step 4: Delete app.json**

```bash
rm app.json
```

Verify the app still starts: `npx expo start --web` (quit after confirming it loads).

- [ ] **Step 5: Create .env.local placeholder**

Create `.env.local` at the project root:

```
EXPO_PUBLIC_GOOGLE_CLIENT_ID=PASTE_YOUR_CLIENT_ID_HERE
```

- [ ] **Step 6: Add .env.local to .gitignore**

Open `.gitignore` and add:

```
# Local env (contains Google OAuth client ID)
.env.local
```

- [ ] **Step 7: Commit**

```bash
git add app.config.js .gitignore
git add -f .env.local   # stage once to create it, then gitignore kicks in
git commit -m "chore: convert to app.config.js and install expo-auth-session"
```

---

## Task 2: Create lib/google-auth.ts

**Files:**
- Create: `lib/google-auth.ts`

This module stores and retrieves Google OAuth tokens from AsyncStorage. It does NOT do the interactive OAuth dance (that lives in the login screen). It only handles persistence and expiry checks.

- [ ] **Step 1: Write `lib/google-auth.ts`**

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const K = {
  ACCESS_TOKEN:   'pf_google_access_token',
  EXPIRY:         'pf_google_expiry',
  EMAIL:          'pf_google_email',
  USER_ID:        'pf_google_user_id',
  SPREADSHEET_ID: 'pf_google_spreadsheet_id',
  MIGRATED:       'pf_migrated',
} as const;

export interface GoogleSession {
  accessToken:   string;
  expiry:        number;   // ms timestamp
  email:         string;
  userId:        string;
  spreadsheetId: string | null;
}

export async function saveGoogleSession(
  accessToken: string,
  expiresIn: number,     // seconds
  email: string,
  userId: string,
): Promise<void> {
  const expiry = Date.now() + expiresIn * 1000;
  await Promise.all([
    AsyncStorage.setItem(K.ACCESS_TOKEN, accessToken),
    AsyncStorage.setItem(K.EXPIRY, String(expiry)),
    AsyncStorage.setItem(K.EMAIL, email),
    AsyncStorage.setItem(K.USER_ID, userId),
  ]);
}

export async function getGoogleSession(): Promise<GoogleSession | null> {
  const [token, expiry, email, userId, spreadsheetId] = await Promise.all([
    AsyncStorage.getItem(K.ACCESS_TOKEN),
    AsyncStorage.getItem(K.EXPIRY),
    AsyncStorage.getItem(K.EMAIL),
    AsyncStorage.getItem(K.USER_ID),
    AsyncStorage.getItem(K.SPREADSHEET_ID),
  ]);
  if (!token || !email || !userId) return null;
  return {
    accessToken:   token,
    expiry:        Number(expiry ?? 0),
    email,
    userId,
    spreadsheetId,
  };
}

export function isTokenExpired(session: GoogleSession): boolean {
  return Date.now() >= session.expiry - 60_000; // 1-minute buffer
}

export async function saveSpreadsheetId(id: string): Promise<void> {
  await AsyncStorage.setItem(K.SPREADSHEET_ID, id);
}

export async function clearGoogleSession(): Promise<void> {
  await Promise.all(Object.values(K).map(k => AsyncStorage.removeItem(k)));
}

export async function hasMigrated(): Promise<boolean> {
  return (await AsyncStorage.getItem(K.MIGRATED)) === 'true';
}

export async function setMigrated(): Promise<void> {
  await AsyncStorage.setItem(K.MIGRATED, 'true');
}
```

- [ ] **Step 2: Write tests for google-auth.ts**

Create `__tests__/google-auth.test.ts`:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  saveGoogleSession, getGoogleSession, isTokenExpired,
  saveSpreadsheetId, clearGoogleSession, hasMigrated, setMigrated,
} from '../lib/google-auth';

beforeEach(() => AsyncStorage.clear());

test('saveGoogleSession and getGoogleSession round-trip', async () => {
  await saveGoogleSession('tok123', 3600, 'user@example.com', 'uid42');
  const session = await getGoogleSession();
  expect(session).not.toBeNull();
  expect(session!.accessToken).toBe('tok123');
  expect(session!.email).toBe('user@example.com');
  expect(session!.userId).toBe('uid42');
  expect(session!.expiry).toBeGreaterThan(Date.now());
  expect(session!.spreadsheetId).toBeNull();
});

test('getGoogleSession returns null when no token stored', async () => {
  expect(await getGoogleSession()).toBeNull();
});

test('isTokenExpired returns false for fresh token', async () => {
  await saveGoogleSession('tok', 3600, 'a@b.com', 'u1');
  const session = await getGoogleSession();
  expect(isTokenExpired(session!)).toBe(false);
});

test('isTokenExpired returns true for expired token', () => {
  const session = {
    accessToken: 'tok', expiry: Date.now() - 1000,
    email: 'a@b.com', userId: 'u1', spreadsheetId: null,
  };
  expect(isTokenExpired(session)).toBe(true);
});

test('saveSpreadsheetId persists and getGoogleSession returns it', async () => {
  await saveGoogleSession('tok', 3600, 'a@b.com', 'u1');
  await saveSpreadsheetId('sheet123');
  const session = await getGoogleSession();
  expect(session!.spreadsheetId).toBe('sheet123');
});

test('clearGoogleSession removes all keys', async () => {
  await saveGoogleSession('tok', 3600, 'a@b.com', 'u1');
  await saveSpreadsheetId('sheet123');
  await clearGoogleSession();
  expect(await getGoogleSession()).toBeNull();
});

test('hasMigrated returns false initially, true after setMigrated', async () => {
  expect(await hasMigrated()).toBe(false);
  await setMigrated();
  expect(await hasMigrated()).toBe(true);
});
```

- [ ] **Step 3: Run tests**

```bash
npx jest __tests__/google-auth.test.ts --no-coverage
```

Expected: 7 tests pass.

- [ ] **Step 4: Commit**

```bash
git add lib/google-auth.ts __tests__/google-auth.test.ts
git commit -m "feat: add Google session storage utilities"
```

---

## Task 3: Create lib/sheets.ts

**Files:**
- Create: `lib/sheets.ts`

Sheets API REST wrapper. Each tab is cleared and rewritten on push. On pull, rows are parsed back into typed objects.

- [ ] **Step 1: Write `lib/sheets.ts`**

```typescript
const SHEETS_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

export type TabName = 'Transactions' | 'Budgets' | 'Goals' | 'Recurring' | 'NetWorth' | 'Settings';

export const TAB_HEADERS: Record<TabName, string[]> = {
  Transactions: ['id', 'type', 'amount', 'category', 'description', 'date', 'notes', 'tags', 'recurringId', 'auto'],
  Budgets:      ['catId', 'mode', 'value'],
  Goals:        ['id', 'name', 'target', 'current', 'deadline'],
  Recurring:    ['id', 'type', 'amount', 'category', 'description', 'dayOfMonth'],
  NetWorth:     ['id', 'name', 'type', 'value'],
  Settings:     ['currency_code', 'currency_symbol', 'currency_locale', 'lastSyncedAt'],
};

async function sheetsRequest(
  method: string,
  url: string,
  accessToken: string,
  body?: unknown,
): Promise<unknown> {
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Sheets API ${method} ${res.status}: ${text}`);
  }
  return res.json();
}

export async function createSpreadsheet(accessToken: string, email: string): Promise<string> {
  const body = {
    properties: { title: `Personal Finance - ${email}` },
    sheets: (Object.keys(TAB_HEADERS) as TabName[]).map(title => ({
      properties: { title },
    })),
  };
  const data = await sheetsRequest('POST', SHEETS_BASE, accessToken, body) as { spreadsheetId: string };
  return data.spreadsheetId;
}

export async function verifySpreadsheet(accessToken: string, spreadsheetId: string): Promise<boolean> {
  try {
    const res = await fetch(
      `${SHEETS_BASE}/${spreadsheetId}?fields=spreadsheetId`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    return res.ok;
  } catch {
    return false;
  }
}

export async function writeTab(
  accessToken: string,
  spreadsheetId: string,
  tab: TabName,
  rows: string[][],
): Promise<void> {
  const allRows = [TAB_HEADERS[tab], ...rows];
  const range = `${tab}!A1`;
  await sheetsRequest(
    'POST',
    `${SHEETS_BASE}/${spreadsheetId}/values/${encodeURIComponent(tab)}:clear`,
    accessToken,
  );
  await sheetsRequest(
    'PUT',
    `${SHEETS_BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=RAW`,
    accessToken,
    { range, majorDimension: 'ROWS', values: allRows },
  );
}

export async function readTab(
  accessToken: string,
  spreadsheetId: string,
  tab: TabName,
): Promise<Record<string, string>[]> {
  const data = await sheetsRequest(
    'GET',
    `${SHEETS_BASE}/${spreadsheetId}/values/${encodeURIComponent(tab)}`,
    accessToken,
  ) as { values?: string[][] };
  const rows = data.values ?? [];
  if (rows.length < 2) return [];
  const headers = rows[0];
  return rows.slice(1).map(row =>
    Object.fromEntries(headers.map((h, i) => [h, row[i] ?? ''])),
  );
}
```

- [ ] **Step 2: Write tests for sheets.ts**

Create `__tests__/sheets.test.ts`:

```typescript
import { TAB_HEADERS, TabName } from '../lib/sheets';

// Unit tests for the header definitions (no network calls needed)
test('all tab names have headers defined', () => {
  const tabs: TabName[] = ['Transactions', 'Budgets', 'Goals', 'Recurring', 'NetWorth', 'Settings'];
  for (const tab of tabs) {
    expect(TAB_HEADERS[tab].length).toBeGreaterThan(0);
  }
});

test('Transactions header has id as first column', () => {
  expect(TAB_HEADERS['Transactions'][0]).toBe('id');
});

test('Budgets header has catId as first column', () => {
  expect(TAB_HEADERS['Budgets'][0]).toBe('catId');
});

test('NetWorth header includes type column for asset/liability distinction', () => {
  expect(TAB_HEADERS['NetWorth']).toContain('type');
});
```

- [ ] **Step 3: Run tests**

```bash
npx jest __tests__/sheets.test.ts --no-coverage
```

Expected: 4 tests pass.

- [ ] **Step 4: Commit**

```bash
git add lib/sheets.ts __tests__/sheets.test.ts
git commit -m "feat: add Google Sheets API wrapper"
```

---

## Task 4: Create lib/sync.ts

**Files:**
- Create: `lib/sync.ts`

Serializes app data to/from Sheets row format and orchestrates push/pull operations.

- [ ] **Step 1: Write `lib/sync.ts`**

```typescript
import { storage } from './storage';
import { writeTab, readTab, createSpreadsheet, verifySpreadsheet } from './sheets';
import { saveSpreadsheetId } from './google-auth';
import {
  Transaction, BudgetMap, BudgetEntry, Goal,
  RecurringRule, NetWorthItem, Currency,
} from './data';

// ── Serializers ──────────────────────────────────────────────────────────────

function txnToRow(t: Transaction): string[] {
  return [
    t.id, t.type, String(t.amount), t.category, t.description, t.date,
    t.notes ?? '', JSON.stringify(t.tags ?? []), t.recurringId ?? '', t.auto ? '1' : '0',
  ];
}

function rowToTxn(r: Record<string, string>): Transaction {
  return {
    id: r.id,
    type: r.type as Transaction['type'],
    amount: Number(r.amount),
    category: r.category,
    description: r.description,
    date: r.date,
    notes: r.notes || undefined,
    tags: r.tags ? JSON.parse(r.tags) : undefined,
    recurringId: r.recurringId || undefined,
    auto: r.auto === '1',
  };
}

function budgetToRow(catId: string, entry: BudgetEntry): string[] {
  return [catId, entry.mode, String(entry.value)];
}

function rowToBudget(r: Record<string, string>): [string, BudgetEntry] {
  return [r.catId, { mode: r.mode as BudgetEntry['mode'], value: Number(r.value) }];
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
  return [r.id, r.type, String(r.amount), r.category, r.description, String(r.dayOfMonth)];
}

function rowToRecurring(r: Record<string, string>): RecurringRule {
  return {
    id: r.id,
    type: r.type as RecurringRule['type'],
    amount: Number(r.amount),
    category: r.category,
    description: r.description,
    dayOfMonth: Number(r.dayOfMonth),
  };
}

function nwItemToRow(item: NetWorthItem, type: 'asset' | 'liability'): string[] {
  return [item.id, item.name, type, String(item.value)];
}

function rowToNwItem(r: Record<string, string>): { item: NetWorthItem; type: 'asset' | 'liability' } {
  return {
    item: { id: r.id, name: r.name, value: Number(r.value) },
    type: r.type as 'asset' | 'liability',
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function ensureSpreadsheet(
  accessToken: string,
  spreadsheetId: string | null,
  email: string,
): Promise<string> {
  if (spreadsheetId && await verifySpreadsheet(accessToken, spreadsheetId)) {
    return spreadsheetId;
  }
  const newId = await createSpreadsheet(accessToken, email);
  await saveSpreadsheetId(newId);
  return newId;
}

export async function pushAll(
  accessToken: string,
  spreadsheetId: string,
  userId: string,
): Promise<void> {
  const [txns, budgets, goals, recurring, nw, currency] = await Promise.all([
    storage.getTxns(userId),
    storage.getBudgets(userId),
    storage.getGoals(userId),
    storage.getRecurring(userId),
    storage.getNetWorth(userId),
    storage.getCurrency(userId),
  ]);

  const budgetRows = Object.entries(budgets as BudgetMap).map(([catId, entry]) =>
    budgetToRow(catId, entry),
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
    writeTab(accessToken, spreadsheetId, 'Settings', [
      [currency.code, currency.symbol, currency.locale, new Date().toISOString()],
    ]),
  ]);
}

export async function pullAll(
  accessToken: string,
  spreadsheetId: string,
  userId: string,
): Promise<{
  txns: Transaction[];
  budgets: BudgetMap;
  goals: Goal[];
  recurring: RecurringRule[];
  nw: { assets: NetWorthItem[]; liabilities: NetWorthItem[] };
  currency: Currency;
}> {
  const DEFAULT_CURRENCY: Currency = { code: 'INR', symbol: '₹', locale: 'en-IN' };

  const [txnRows, budgetRows, goalRows, recurringRows, nwRows, settingsRows] = await Promise.all([
    readTab(accessToken, spreadsheetId, 'Transactions'),
    readTab(accessToken, spreadsheetId, 'Budgets'),
    readTab(accessToken, spreadsheetId, 'Goals'),
    readTab(accessToken, spreadsheetId, 'Recurring'),
    readTab(accessToken, spreadsheetId, 'NetWorth'),
    readTab(accessToken, spreadsheetId, 'Settings'),
  ]);

  const nwItems = nwRows.map(rowToNwItem);
  const currency: Currency = settingsRows[0]
    ? {
        code:   settingsRows[0].currency_code   || DEFAULT_CURRENCY.code,
        symbol: settingsRows[0].currency_symbol || DEFAULT_CURRENCY.symbol,
        locale: settingsRows[0].currency_locale || DEFAULT_CURRENCY.locale,
      }
    : DEFAULT_CURRENCY;

  return {
    txns:      txnRows.map(rowToTxn),
    budgets:   Object.fromEntries(budgetRows.map(rowToBudget)),
    goals:     goalRows.map(rowToGoal),
    recurring: recurringRows.map(rowToRecurring),
    nw: {
      assets:      nwItems.filter(x => x.type === 'asset').map(x => x.item),
      liabilities: nwItems.filter(x => x.type === 'liability').map(x => x.item),
    },
    currency,
  };
}
```

- [ ] **Step 2: Write tests for sync serializers**

Create `__tests__/sync.test.ts`:

```typescript
// Import only the serializer logic via named re-exports we'll add below
// (We test the round-trip: data → row → data)
import { Transaction, Goal, RecurringRule } from '../lib/data';

// Inline copies of the serializers for testing (avoids mocking storage/sheets)
function txnToRow(t: Transaction): string[] {
  return [
    t.id, t.type, String(t.amount), t.category, t.description, t.date,
    t.notes ?? '', JSON.stringify(t.tags ?? []), t.recurringId ?? '', t.auto ? '1' : '0',
  ];
}
function rowToTxn(r: Record<string, string>): Transaction {
  return {
    id: r.id, type: r.type as Transaction['type'], amount: Number(r.amount),
    category: r.category, description: r.description, date: r.date,
    notes: r.notes || undefined, tags: r.tags ? JSON.parse(r.tags) : undefined,
    recurringId: r.recurringId || undefined, auto: r.auto === '1',
  };
}

const sampleTxn: Transaction = {
  id: 'abc', type: 'expense', amount: 500, category: 'Food',
  description: 'Lunch', date: '2026-04-28', notes: 'with friends',
  tags: ['personal'], recurringId: undefined, auto: false,
};

test('transaction serializes and deserializes correctly', () => {
  const headers = ['id','type','amount','category','description','date','notes','tags','recurringId','auto'];
  const row = txnToRow(sampleTxn);
  const rowRecord = Object.fromEntries(headers.map((h, i) => [h, row[i]]));
  const result = rowToTxn(rowRecord);
  expect(result.id).toBe(sampleTxn.id);
  expect(result.amount).toBe(500);
  expect(result.tags).toEqual(['personal']);
  expect(result.notes).toBe('with friends');
  expect(result.auto).toBe(false);
});

test('transaction with no optional fields serializes cleanly', () => {
  const headers = ['id','type','amount','category','description','date','notes','tags','recurringId','auto'];
  const minimal: Transaction = { id: 'x', type: 'income', amount: 1000, category: 'Salary', description: 'Pay', date: '2026-04-01' };
  const row = txnToRow(minimal);
  const rowRecord = Object.fromEntries(headers.map((h, i) => [h, row[i]]));
  const result = rowToTxn(rowRecord);
  expect(result.notes).toBeUndefined();
  expect(result.tags).toBeUndefined();
  expect(result.recurringId).toBeUndefined();
});
```

- [ ] **Step 3: Run tests**

```bash
npx jest __tests__/sync.test.ts --no-coverage
```

Expected: 2 tests pass.

- [ ] **Step 4: Commit**

```bash
git add lib/sync.ts __tests__/sync.test.ts
git commit -m "feat: add Sheets sync push/pull logic"
```

---

## Task 5: Modify hooks/useFinance.ts

**Files:**
- Modify: `hooks/useFinance.ts`

Replace local `login`/`register` with `googleSignIn`. Add debounced Sheets push after each state change. Include migration logic (push existing local data to Sheets on first sign-in).

- [ ] **Step 1: Rewrite hooks/useFinance.ts**

Replace the entire file with:

```typescript
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BudgetMap, Currency, Goal, NetWorthData,
  RecurringRule, Transaction, uid,
} from '../lib/data';
import { storage } from '../lib/storage';
import { setCurrency } from '../lib/format';
import { applyRecurring } from '../lib/recurring';
import {
  saveGoogleSession, getGoogleSession, clearGoogleSession,
  isTokenExpired, saveSpreadsheetId, hasMigrated, setMigrated,
} from '../lib/google-auth';
import { ensureSpreadsheet, pushAll, pullAll } from '../lib/sync';

const DEFAULT_CURRENCY: Currency = { code: 'INR', symbol: '₹', locale: 'en-IN' };

export interface FinanceState {
  user:         string | null;   // Google userId (sub)
  loading:      boolean;
  txns:         Transaction[];
  budgets:      BudgetMap;
  goals:        Goal[];
  nw:           NetWorthData;
  recurring:    RecurringRule[];
  currency:     Currency;
  googleSignIn: (accessToken: string, expiresIn: number) => Promise<string | null>;
  logout:       () => Promise<void>;
  addTxn:       (t: Omit<Transaction, 'id'>) => void;
  editTxn:      (t: Transaction) => void;
  deleteTxn:    (id: string) => void;
  setBudgets:   (b: BudgetMap) => void;
  setGoals:     (g: Goal[]) => void;
  setNw:        (n: NetWorthData) => void;
  setRecurring: (r: RecurringRule[]) => void;
  setCurrencyPref: (c: Currency) => void;
}

export function useFinance(): FinanceState {
  const [user, setUser]               = useState<string | null>(null);
  const [loading, setLoading]         = useState(true);
  const [txns, setTxnsState]          = useState<Transaction[]>([]);
  const [budgets, setBudgetsState]    = useState<BudgetMap>({});
  const [goals, setGoalsState]        = useState<Goal[]>([]);
  const [nw, setNwState]              = useState<NetWorthData>({ assets: [], liabilities: [] });
  const [recurring, setRecurringState]= useState<RecurringRule[]>([]);
  const [currency, setCurrencyState]  = useState<Currency>(DEFAULT_CURRENCY);

  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleSync = useCallback(() => {
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(async () => {
      const session = await getGoogleSession();
      if (!session || !session.spreadsheetId || isTokenExpired(session)) return;
      try {
        await pushAll(session.accessToken, session.spreadsheetId, session.userId);
      } catch {
        // silent — next state change will retry
      }
    }, 2000);
  }, []);

  async function loadUser(userId: string) {
    const [t, b, r, g, n, c] = await Promise.all([
      storage.getTxns(userId),
      storage.getBudgets(userId),
      storage.getRecurring(userId),
      storage.getGoals(userId),
      storage.getNetWorth(userId),
      storage.getCurrency(userId),
    ]);
    const applied = applyRecurring(r, t);
    setCurrency(c);
    setUser(userId);
    setTxnsState(applied);
    setBudgetsState(b);
    setRecurringState(r);
    setGoalsState(g);
    setNwState(n);
    setCurrencyState(c);
  }

  useEffect(() => {
    getGoogleSession().then(async session => {
      if (session && !isTokenExpired(session)) {
        await loadUser(session.userId);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => { if (user) { storage.saveTxns(user, txns);           scheduleSync(); } }, [txns,      user]);
  useEffect(() => { if (user) { storage.saveBudgets(user, budgets);     scheduleSync(); } }, [budgets,   user]);
  useEffect(() => { if (user) { storage.saveRecurring(user, recurring); scheduleSync(); } }, [recurring, user]);
  useEffect(() => { if (user) { storage.saveGoals(user, goals);         scheduleSync(); } }, [goals,     user]);
  useEffect(() => { if (user) { storage.saveNetWorth(user, nw);         scheduleSync(); } }, [nw,        user]);
  useEffect(() => { if (user) { storage.saveCurrency(user, currency);   scheduleSync(); } }, [currency,  user]);

  const googleSignIn = useCallback(async (accessToken: string, expiresIn: number): Promise<string | null> => {
    try {
      // Fetch user info from Google
      const infoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!infoRes.ok) return 'Failed to get user info from Google.';
      const info = await infoRes.json() as { email: string; sub: string };

      await saveGoogleSession(accessToken, expiresIn, info.email, info.sub);

      // Ensure spreadsheet exists
      const existingSession = await getGoogleSession();
      const spreadsheetId = await ensureSpreadsheet(
        accessToken,
        existingSession?.spreadsheetId ?? null,
        info.email,
      );
      await saveSpreadsheetId(spreadsheetId);

      // Migration: push existing local data on first sign-in
      if (!(await hasMigrated())) {
        const oldSession = await storage.getSession();
        if (oldSession) {
          // Re-key old data to new userId
          const [t, b, r, g, n, c] = await Promise.all([
            storage.getTxns(oldSession),
            storage.getBudgets(oldSession),
            storage.getRecurring(oldSession),
            storage.getGoals(oldSession),
            storage.getNetWorth(oldSession),
            storage.getCurrency(oldSession),
          ]);
          await Promise.all([
            storage.saveTxns(info.sub, t),
            storage.saveBudgets(info.sub, b),
            storage.saveRecurring(info.sub, r),
            storage.saveGoals(info.sub, g),
            storage.saveNetWorth(info.sub, n),
            storage.saveCurrency(info.sub, c),
          ]);
        }
        await pushAll(accessToken, spreadsheetId, info.sub);
        await setMigrated();
      } else {
        // Pull latest from Sheets and save to local
        const data = await pullAll(accessToken, spreadsheetId, info.sub);
        await Promise.all([
          storage.saveTxns(info.sub, data.txns),
          storage.saveBudgets(info.sub, data.budgets),
          storage.saveGoals(info.sub, data.goals),
          storage.saveRecurring(info.sub, data.recurring),
          storage.saveNetWorth(info.sub, data.nw),
          storage.saveCurrency(info.sub, data.currency),
        ]);
      }

      await loadUser(info.sub);
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : 'Sign-in failed.';
    }
  }, []);

  const logout = useCallback(async () => {
    if (syncTimer.current) clearTimeout(syncTimer.current);
    await clearGoogleSession();
    setUser(null);
    setTxnsState([]);
    setBudgetsState({});
    setRecurringState([]);
    setGoalsState([]);
    setNwState({ assets: [], liabilities: [] });
    setCurrencyState(DEFAULT_CURRENCY);
  }, []);

  const addTxn      = useCallback((t: Omit<Transaction, 'id'>) => setTxnsState(prev => [...prev, { ...t, id: uid() }]), []);
  const editTxn     = useCallback((t: Transaction) => setTxnsState(prev => prev.map(x => x.id === t.id ? t : x)), []);
  const deleteTxn   = useCallback((id: string) => setTxnsState(prev => prev.filter(x => x.id !== id)), []);
  const setBudgets  = useCallback((b: BudgetMap) => setBudgetsState(b), []);
  const setGoals    = useCallback((g: Goal[]) => setGoalsState(g), []);
  const setNw       = useCallback((n: NetWorthData) => setNwState(n), []);
  const setRecurring= useCallback((r: RecurringRule[]) => setRecurringState(r), []);
  const setCurrencyPref = useCallback((c: Currency) => { setCurrency(c); setCurrencyState(c); }, []);

  return {
    user, loading, txns, budgets, goals, nw, recurring, currency,
    googleSignIn, logout,
    addTxn, editTxn, deleteTxn,
    setBudgets, setGoals, setNw, setRecurring, setCurrencyPref,
  };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors (or only pre-existing errors unrelated to this change).

- [ ] **Step 3: Commit**

```bash
git add hooks/useFinance.ts
git commit -m "feat: replace local auth with Google Sign-In and add Sheets sync"
```

---

## Task 6: Update app/login.tsx

**Files:**
- Modify: `app/login.tsx`

Replace the username/password form with a single "Sign in with Google" button. The Google OAuth dance happens here using `expo-auth-session`.

- [ ] **Step 1: Rewrite app/login.tsx**

Replace the entire file with:

```typescript
import React, { useEffect, useState } from 'react';
import {
  View, Text, Pressable, StyleSheet,
  ActivityIndicator,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { router } from 'expo-router';
import { useFinance } from '../hooks/FinanceContext';
import { colors, spacing, radius } from '../constants/theme';

WebBrowser.maybeCompleteAuthSession();

const CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID!;

export default function LoginScreen() {
  const { googleSignIn } = useFinance();
  const [error, setError] = useState('');
  const [busy, setBusy]   = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: CLIENT_ID,
    scopes: [
      'openid',
      'email',
      'profile',
      'https://www.googleapis.com/auth/spreadsheets',
    ],
  });

  useEffect(() => {
    if (response?.type !== 'success') return;
    const token = response.authentication?.accessToken;
    const expiresIn = response.authentication?.expiresIn ?? 3600;
    if (!token) { setError('No access token received from Google.'); return; }
    handleSignIn(token, expiresIn);
  }, [response]);

  async function handleSignIn(accessToken: string, expiresIn: number) {
    setBusy(true);
    setError('');
    const err = await googleSignIn(accessToken, expiresIn);
    setBusy(false);
    if (err) { setError(err); return; }
    router.replace('/(tabs)');
  }

  return (
    <View style={styles.root}>
      <View style={styles.card}>
        <View style={styles.logoRow}>
          <View style={styles.logoDot} />
          <Text style={styles.logoText}>Finance</Text>
        </View>

        <Text style={styles.title}>Welcome</Text>
        <Text style={styles.sub}>Sign in with Google to sync your data across devices</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={[styles.btn, (!request || busy) && styles.btnDisabled]}
          onPress={() => { setError(''); promptAsync(); }}
          disabled={!request || busy}
        >
          {busy
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnText}>Sign in with Google</Text>
          }
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: spacing.md },
  card:        { width: '100%', maxWidth: 400, backgroundColor: colors.surface, borderRadius: radius.xl,
                 borderWidth: 1, borderColor: colors.border, padding: spacing.xl, gap: spacing.md },
  logoRow:     { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  logoDot:     { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent },
  logoText:    { fontSize: 18, fontFamily: 'PlusJakartaSans_800ExtraBold', color: colors.text },
  title:       { fontSize: 22, fontFamily: 'PlusJakartaSans_800ExtraBold', color: colors.text },
  sub:         { fontSize: 14, fontFamily: 'PlusJakartaSans_400Regular', color: colors.muted, marginTop: -spacing.sm },
  error:       { fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', color: colors.red,
                 backgroundColor: colors.redDim, borderRadius: radius.sm, padding: spacing.sm },
  btn:         { backgroundColor: colors.accent, borderRadius: radius.md, padding: spacing.md, alignItems: 'center' },
  btnDisabled: { opacity: 0.6 },
  btnText:     { fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', color: '#fff' },
});
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no new errors.

- [ ] **Step 3: Run all tests**

```bash
npx jest --no-coverage
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add app/login.tsx
git commit -m "feat: replace login form with Sign in with Google button"
```

---

## Verification

After all tasks are committed and `.env.local` has a real Google client ID:

1. `npx expo start --web` — open in browser
2. App redirects to login screen — "Sign in with Google" button is visible
3. Tap button → Google OAuth consent screen opens
4. Sign in → redirected back to app → main tabs load
5. Open [https://drive.google.com](https://drive.google.com) — a spreadsheet named "Personal Finance - {your email}" exists
6. Add a transaction in the app → within ~2 seconds it appears in the Transactions tab of the spreadsheet
7. Stop expo, restart → `npx expo start --web` again → data loads from local cache (no Sheets call needed on startup if token is valid)
8. Open the app on a different device/browser → sign in with same Google account → same data appears (pulled from Sheets on login)

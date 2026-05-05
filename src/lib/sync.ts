import { storage } from './storage';
import { writeTab, readTab, createSpreadsheet, verifySpreadsheet, findSpreadsheetByName } from './sheets';
import { saveSpreadsheetId } from './google-auth';
import {
  Transaction, BudgetMap, BudgetEntry, Goal,
  RecurringRule, NetWorthItem, Currency, CustomCategory, CatGroup,
} from './data';

// ── Serializers ──────────────────────────────────────────────────────────────

function txnToRow(t: Transaction): string[] {
  return [
    t.id, t.type, String(t.amount), t.category, t.subCategory ?? '', t.description, t.date,
    t.notes ?? '', JSON.stringify(t.tags ?? []), t.recurringId ?? '', t.auto ? '1' : '0',
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
    id: r.id,
    type: r.type as Transaction['type'],
    amount: Number(r.amount),
    category: r.category,
    subCategory: r.subCategory || undefined,
    description: r.description,
    date: r.date,
    notes: r.notes || undefined,
    tags,
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

function customCatToRow(c: CustomCategory): string[] {
  return [c.id, c.label, c.color, c.txnType, c.group];
}

function rowToCustomCat(r: Record<string, string>): CustomCategory | null {
  if (!r.id || !r.label || !r.txnType || !r.group) return null;
  return {
    id:      r.id,
    label:   r.label,
    color:   r.color || '#8888aa',
    txnType: r.txnType as CustomCategory['txnType'],
    group:   r.group as CatGroup,
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function ensureSpreadsheet(
  accessToken: string,
  spreadsheetId: string | null,
  email: string,
): Promise<{ id: string; isNew: boolean }> {
  // 1. Cached ID still valid
  if (spreadsheetId && await verifySpreadsheet(accessToken, spreadsheetId)) {
    return { id: spreadsheetId, isNew: false };
  }

  // 2. Search Drive for an existing "Arya's Finance - email" spreadsheet
  const existingId = await findSpreadsheetByName(accessToken, `Arya's Finance - ${email}`);
  if (existingId) {
    await saveSpreadsheetId(existingId);
    return { id: existingId, isNew: false };
  }

  // 3. Nothing found — create a new one (placed in the Arya's Finance folder)
  const newId = await createSpreadsheet(accessToken, email);
  await saveSpreadsheetId(newId);
  return { id: newId, isNew: true };
}

export async function pushAll(
  accessToken: string,
  spreadsheetId: string,
  userId: string,
): Promise<void> {
  const [txns, budgets, goals, recurring, nw, currency, customCats] = await Promise.all([
    storage.getTxns(userId),
    storage.getBudgets(userId),
    storage.getGoals(userId),
    storage.getRecurring(userId),
    storage.getNetWorth(userId),
    storage.getCurrency(userId),
    storage.getCustomCats(userId),
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
    writeTab(accessToken, spreadsheetId, 'CustomCategories', customCats.map(customCatToRow)),
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
  txns: Transaction[];
  budgets: BudgetMap;
  goals: Goal[];
  recurring: RecurringRule[];
  nw: { assets: NetWorthItem[]; liabilities: NetWorthItem[] };
  currency: Currency;
  customCats: CustomCategory[];
  prefs: { darkMode: boolean; themeName: string };
}> {
  const DEFAULT_CURRENCY: Currency = { code: 'INR', symbol: '₹', locale: 'en-IN' };

  const [txnRows, budgetRows, goalRows, recurringRows, nwRows, customCatRows, settingsRows] = await Promise.all([
    readTab(accessToken, spreadsheetId, 'Transactions'),
    readTab(accessToken, spreadsheetId, 'Budgets'),
    readTab(accessToken, spreadsheetId, 'Goals'),
    readTab(accessToken, spreadsheetId, 'Recurring'),
    readTab(accessToken, spreadsheetId, 'NetWorth'),
    readTab(accessToken, spreadsheetId, 'CustomCategories'),
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
    txns:      txnRows.map(rowToTxn),
    budgets:   Object.fromEntries(budgetRows.map(rowToBudget)),
    goals:     goalRows.map(rowToGoal),
    recurring: recurringRows.map(rowToRecurring),
    nw: {
      assets:      nwItems.filter(x => x.type === 'asset').map(x => x.item),
      liabilities: nwItems.filter(x => x.type === 'liability').map(x => x.item),
    },
    currency,
    customCats: customCatRows.map(rowToCustomCat).filter((c): c is CustomCategory => c !== null),
    prefs: {
      darkMode:  (s0?.dark_mode ?? 'true') !== 'false',
      themeName,
    },
  };
}

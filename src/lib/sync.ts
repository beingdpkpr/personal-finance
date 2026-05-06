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

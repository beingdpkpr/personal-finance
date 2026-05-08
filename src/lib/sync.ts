import { storage } from './storage';
import { writeTab, readTab, createSpreadsheet, verifySpreadsheet, findSpreadsheetByName } from './sheets';
import { saveSpreadsheetId } from './google-auth';
import {
  Transaction, BudgetMap, BudgetEntry, Goal, IncomeCat,
  NetWorthItem, Currency, Category, Group, UserPrefs, DEFAULT_PREFS,
} from './data';
// ── Serializers ──────────────────────────────────────────────────────────────

function txnToRow(t: Transaction): string[] {
  return [
    t.id, t.type, String(t.amount),
    t.group ?? '', t.category ?? '',
    t.description, t.date,
    t.notes ?? '', JSON.stringify(t.tags ?? []),
    t.recurringId ?? '', t.auto ? '1' : '0',
    t.sourceAccountId ?? '', t.destinationAccountId ?? '',
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
    recurringId:     r.recurringId     || undefined,
    auto:            r.auto === '1',
    sourceAccountId:      r.sourceAccountId      || undefined,
    destinationAccountId: r.destinationAccountId || undefined,
  };
}

function budgetToRow(group: string, entry: BudgetEntry): string[] {
  return [group, entry.mode, String(entry.value)];
}

function rowToBudget(r: Record<string, string>): [string, BudgetEntry] {
  return [r.group, { mode: r.mode as BudgetEntry['mode'], value: Number(r.value) }];
}

function catToRow(c: Category): string[] {
  return [c.id, c.label, c.group, c.color, c.depositsToAccount ? '1' : '0'];
}

function rowToCat(r: Record<string, string>): Category | null {
  if (!r.id || !r.label || !r.group) return null;
  return {
    id:                 r.id,
    label:              r.label,
    group:              r.group as Group,
    color:              r.color || '#8888aa',
    depositsToAccount:  r.depositsToAccount === '1' || undefined,
  };
}

function incomeCatToRow(c: IncomeCat): string[] {
  return [c.id, c.label, c.color, c.requiresAccount ? '1' : '0'];
}
function rowToIncomeCat(r: Record<string, string>): IncomeCat | null {
  if (!r.id || !r.label) return null;
  return { id: r.id, label: r.label, color: r.color || '#2ed18a', requiresAccount: r.requiresAccount === '1' || undefined };
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


function nwItemToRow(item: NetWorthItem, type: 'asset' | 'liability'): string[] {
  return [item.id, item.name, type, String(item.value), item.institution ?? '', item.accountNumber ?? '', item.notes ?? '', item.liquid === false ? '0' : '1'];
}

function rowToNwItem(r: Record<string, string>): { item: NetWorthItem; type: 'asset' | 'liability' } {
  return {
    item: {
      id: r.id, name: r.name, value: Number(r.value),
      institution:   r.institution   || undefined,
      accountNumber: r.accountNumber || undefined,
      notes:         r.notes         || undefined,
      liquid:        r.liquid === '0' ? false : undefined,
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
  const [txns, budgets, goals, nw, currency, cats, incomeCats, prefs] = await Promise.all([
    storage.getTxns(userId),
    storage.getBudgets(userId),
    storage.getGoals(userId),
    storage.getNetWorth(userId),
    storage.getCurrency(userId),
    storage.getCategories(userId),
    storage.getIncomeCats(userId),
    storage.getPrefs(userId),
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
    writeTab(accessToken, spreadsheetId, 'NetWorth', nwRows),
    writeTab(accessToken, spreadsheetId, 'Categories', cats.map(catToRow)),
    writeTab(accessToken, spreadsheetId, 'IncomeCats', incomeCats.map(incomeCatToRow)),
    writeTab(accessToken, spreadsheetId, 'Settings', [
      [
        currency.code, currency.symbol, currency.locale, new Date().toISOString(),
        localStorage.getItem('pf_dark_mode') ?? 'true',
        localStorage.getItem('pf_theme_name') ?? 'violet',
        JSON.stringify(prefs),
      ],
    ]),
  ]);
}

export async function pullAll(
  accessToken: string,
  spreadsheetId: string,
): Promise<{
  txns:       Transaction[];
  budgets:    BudgetMap;
  goals:      Goal[];
  nw:         { assets: NetWorthItem[]; liabilities: NetWorthItem[] };
  currency:   Currency;
  categories: Category[];
  incomeCats: IncomeCat[];
  prefs:      { darkMode: boolean; themeName: string };
  userPrefs:  UserPrefs;
}> {
  const DEFAULT_CURRENCY: Currency = { code: 'INR', symbol: '₹', locale: 'en-IN' };

  const [txnRows, budgetRows, goalRows, nwRows, catRows, incomeCatRows, settingsRows] = await Promise.all([
    readTab(accessToken, spreadsheetId, 'Transactions'),
    readTab(accessToken, spreadsheetId, 'Budgets'),
    readTab(accessToken, spreadsheetId, 'Goals'),
    readTab(accessToken, spreadsheetId, 'NetWorth'),
    readTab(accessToken, spreadsheetId, 'Categories'),
    readTab(accessToken, spreadsheetId, 'IncomeCats'),
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

  let userPrefs: UserPrefs = DEFAULT_PREFS;
  if (s0?.prefs) {
    try { userPrefs = { ...DEFAULT_PREFS, ...JSON.parse(s0.prefs) }; } catch { /* use default */ }
  }

  return {
    txns:       txnRows.map(rowToTxn),
    budgets:    Object.fromEntries(budgetRows.map(rowToBudget)),
    goals:      goalRows.map(rowToGoal),
    nw: {
      assets:      nwItems.filter(x => x.type === 'asset').map(x => x.item),
      liabilities: nwItems.filter(x => x.type === 'liability').map(x => x.item),
    },
    currency,
    categories: catRows.map(rowToCat).filter((c): c is Category => c !== null),
    incomeCats: incomeCatRows.map(rowToIncomeCat).filter((c): c is IncomeCat => c !== null),
    prefs: {
      darkMode:  (s0?.dark_mode ?? 'true') !== 'false',
      themeName,
    },
    userPrefs,
  };
}

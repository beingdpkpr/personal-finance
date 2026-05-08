import { Transaction, Group } from './data';
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
      const rest = { ...t } as Transaction & { subCategory?: string };
      delete rest.subCategory;
      return rest as Transaction;
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

  // 2. Clear legacy recurring rules (feature removed)
  localStorage.removeItem(`pf_recurring_${userId}`);

  // 3. Discard old per-category budgets (incompatible with group-level budgeting)
  storageSet(`pf_budgets_${userId}`, {});

  // 4. Seed default categories if none exist
  const existingCats = storageGet<unknown[]>(`pf_cats_${userId}`, []);
  if (existingCats.length === 0) {
    storageSet(`pf_cats_${userId}`, DEFAULT_CATEGORIES);
  }

  localStorage.setItem(VERSION_KEY, TARGET_VERSION);
}

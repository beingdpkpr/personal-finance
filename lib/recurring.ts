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

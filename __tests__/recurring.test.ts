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
    const txns: Transaction[] = [{ id: 't1', type: 'expense', amount: 50, category: 'food', description: 'Lunch', date: `${monthKey}-01`, auto: false }];
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
    if (futureDay > 28) return;
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

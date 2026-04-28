import { Transaction } from '../lib/data';

// Inline serializer copies for testing round-trip logic without mocking storage/sheets
function txnToRow(t: Transaction): string[] {
  return [
    t.id, t.type, String(t.amount), t.category, t.description, t.date,
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
    id: r.id, type: r.type as Transaction['type'], amount: Number(r.amount),
    category: r.category, description: r.description, date: r.date,
    notes: r.notes || undefined, tags,
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

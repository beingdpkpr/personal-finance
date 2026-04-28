import { TAB_HEADERS, TabName } from '../lib/sheets';

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

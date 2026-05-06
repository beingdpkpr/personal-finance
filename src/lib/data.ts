export type TxnType = 'expense' | 'income';

export type CatGroup = 'essentials' | 'family' | 'savings' | 'wants';

export const GROUP_LABELS: Record<CatGroup, string> = {
  essentials: 'Essentials',
  family:     'Family',
  savings:    'Savings',
  wants:      'Wants',
};

export interface ExpenseCat {
  id:       string;
  label:    string;
  color:    string;
  group:    CatGroup;
  isCustom?: boolean;
}

export interface IncomeCat {
  id:       string;
  label:    string;
  color:    string;
  isCustom?: boolean;
}

export interface CustomCategory {
  id:      string;
  label:   string;
  color:   string;
  txnType: 'expense' | 'income';
  group:   CatGroup;
}

const CAT_COLORS = ['#f0722a','#5a9fff','#2ed18a','#a07aff','#f05060','#f0b030','#60d0e0','#ff7eb3','#8888aa'];
export function nextCatColor(existing: CustomCategory[]): string {
  return CAT_COLORS[existing.length % CAT_COLORS.length];
}

export interface Transaction {
  id: string;
  type: TxnType;
  amount: number;
  category: string;
  subCategory?: string;
  description: string;
  date: string;         // 'YYYY-MM-DD'
  notes?: string;
  tags?: string[];
  recurringId?: string;
  auto?: boolean;
}

export interface BudgetEntry {
  mode: 'fixed' | 'pct';
  value: number;
}

export interface BudgetMap {
  [catId: string]: BudgetEntry;
}

export interface RecurringRule {
  id: string;
  type: TxnType;
  amount: number;
  category: string;
  description: string;
  dayOfMonth: number;
}

export interface Goal {
  id: string;
  name: string;
  target: number;
  current: number;
  deadline?: string;
}

export interface NetWorthItem {
  id: string;
  name: string;
  value: number;
  institution?: string;   // e.g. HDFC Bank, Zerodha
  accountNumber?: string; // last 4 digits or full number
  notes?: string;
}

export interface NetWorthData {
  assets: NetWorthItem[];
  liabilities: NetWorthItem[];
}

export interface Currency {
  code: string;
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

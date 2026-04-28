export type TxnType = 'expense' | 'income';

export type SpendType = 'essentials' | 'wants' | 'investments' | 'family';

export const SPEND_TYPES: { id: SpendType; label: string; color: string }[] = [
  { id: 'essentials',  label: 'Essentials',  color: '#5a9fff' },
  { id: 'wants',       label: 'Wants',       color: '#f05060' },
  { id: 'investments', label: 'Investments', color: '#2ed18a' },
  { id: 'family',      label: 'Family',      color: '#60d0e0' },
];

// Default expense category → spend type mapping
export const DEFAULT_SPEND_MAP: Record<string, SpendType> = {
  essentials:    'essentials',
  food:          'essentials',
  transport:     'essentials',
  health:        'essentials',
  entertainment: 'wants',
  shopping:      'wants',
  other:         'wants',
  savings:       'investments',
  family:        'family',
};

export type SpendTypeMap = Record<string, SpendType>;

export interface Transaction {
  id: string;
  type: TxnType;
  amount: number;
  category: string;
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

export type TxnType = 'expense' | 'income';

export type Group = 'needs' | 'wants' | 'savings' | 'family';

export const GROUP_LABELS: Record<Group, string> = {
  needs:   'Needs',
  wants:   'Wants',
  savings: 'Savings',
  family:  'Family',
};

export const GROUPS: Group[] = ['needs', 'family', 'savings', 'wants'];

export interface Category {
  id:        string;
  label:     string;
  group:     Group;
  color:     string;
  isCustom?: boolean;
}

export interface IncomeCat {
  id:    string;
  label: string;
  color: string;
}

export interface Transaction {
  id:           string;
  type:         TxnType;
  amount:       number;
  group?:       Group;    // budget group — set for expense transactions
  category?:    string;   // Category.id for expenses; income cat id for income
  description:  string;
  date:         string;   // 'YYYY-MM-DD'
  notes?:       string;
  tags?:        string[];
  recurringId?: string;
  auto?:        boolean;
}

export interface BudgetEntry {
  mode: 'fixed' | 'pct';
  value: number;
}

export type BudgetMap = Partial<Record<Group, BudgetEntry>>;

export interface RecurringRule {
  id:          string;
  type:        TxnType;
  amount:      number;
  group?:      Group;    // set for expense recurring rules
  category?:   string;  // Category.id or income cat id
  description: string;
  dayOfMonth:  number;
}

export interface Goal {
  id:        string;
  name:      string;
  target:    number;
  current:   number;
  deadline?: string;
}

export interface NetWorthItem {
  id:             string;
  name:           string;
  value:          number;
  institution?:   string;
  accountNumber?: string;
  notes?:         string;
}

export interface NetWorthData {
  assets:      NetWorthItem[];
  liabilities: NetWorthItem[];
}

export interface Currency {
  code:   string;
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

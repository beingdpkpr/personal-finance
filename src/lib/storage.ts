import {
  BudgetMap, Currency, CustomCategory, Goal, NetWorthData,
  RecurringRule, SpendTypeMap, Transaction, UserStore,
} from './data';

const DEFAULT_CURRENCY: Currency = { code: 'INR', symbol: '₹', locale: 'en-IN' };
const DEFAULT_NW: NetWorthData = { assets: [], liabilities: [] };

function get<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function set(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function remove(key: string): void {
  localStorage.removeItem(key);
}

const p = <T>(v: T): Promise<T> => Promise.resolve(v);

export const storage = {
  getUsers:    ()                               => p(get<UserStore>('pf_users', {})),
  saveUsers:   (u: UserStore)                   => p(set('pf_users', u)),
  getSession:  ()                               => p(get<string | null>('pf_session', null)),
  setSession:  (u: string)                      => p(set('pf_session', u)),
  clearSession: ()                              => p(remove('pf_session')),
  getTxns:     (user: string)                   => p(get<Transaction[]>(`pf_txns_${user}`, [])),
  saveTxns:    (user: string, d: Transaction[]) => p(set(`pf_txns_${user}`, d)),
  getBudgets:  (user: string)                   => p(get<BudgetMap>(`pf_budgets_${user}`, {})),
  saveBudgets: (user: string, d: BudgetMap)     => p(set(`pf_budgets_${user}`, d)),
  getRecurring:  (user: string)                     => p(get<RecurringRule[]>(`pf_recurring_${user}`, [])),
  saveRecurring: (user: string, d: RecurringRule[]) => p(set(`pf_recurring_${user}`, d)),
  getGoals:  (user: string)            => p(get<Goal[]>(`pf_goals_${user}`, [])),
  saveGoals: (user: string, d: Goal[]) => p(set(`pf_goals_${user}`, d)),
  getNetWorth:  (user: string)                  => p(get<NetWorthData>(`pf_nw_${user}`, DEFAULT_NW)),
  saveNetWorth: (user: string, d: NetWorthData) => p(set(`pf_nw_${user}`, d)),
  getCurrency:  (user: string)              => p(get<Currency>(`pf_currency_${user}`, DEFAULT_CURRENCY)),
  saveCurrency: (user: string, d: Currency) => p(set(`pf_currency_${user}`, d)),
  getSpendTypeMap:  (user: string)                   => p(get<SpendTypeMap>(`pf_spendmap_${user}`, {})),
  saveSpendTypeMap: (user: string, d: SpendTypeMap)  => p(set(`pf_spendmap_${user}`, d)),
  getCustomCats:  (user: string)                       => p(get<CustomCategory[]>(`pf_customcats_${user}`, [])),
  saveCustomCats: (user: string, d: CustomCategory[]) => p(set(`pf_customcats_${user}`, d)),
};

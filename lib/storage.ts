import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  BudgetMap, Currency, Goal, NetWorthData,
  RecurringRule, SpendTypeMap, Transaction, UserStore,
} from './data';

const DEFAULT_CURRENCY: Currency = { code: 'INR', symbol: '₹', locale: 'en-IN' };
const DEFAULT_NW: NetWorthData = { assets: [], liabilities: [] };

async function get<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw !== null ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

async function set(key: string, value: unknown): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

async function remove(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}

export const storage = {
  getUsers:    ()                               => get<UserStore>('pf_users', {}),
  saveUsers:   (u: UserStore)                   => set('pf_users', u),

  getSession:  ()                               => get<string | null>('pf_session', null),
  setSession:  (u: string)                      => set('pf_session', u),
  clearSession: ()                              => remove('pf_session'),

  getTxns:     (user: string)                   => get<Transaction[]>(`pf_txns_${user}`, []),
  saveTxns:    (user: string, d: Transaction[]) => set(`pf_txns_${user}`, d),

  getBudgets:  (user: string)                   => get<BudgetMap>(`pf_budgets_${user}`, {}),
  saveBudgets: (user: string, d: BudgetMap)     => set(`pf_budgets_${user}`, d),

  getRecurring:  (user: string)                       => get<RecurringRule[]>(`pf_recurring_${user}`, []),
  saveRecurring: (user: string, d: RecurringRule[])   => set(`pf_recurring_${user}`, d),

  getGoals:  (user: string)               => get<Goal[]>(`pf_goals_${user}`, []),
  saveGoals: (user: string, d: Goal[])    => set(`pf_goals_${user}`, d),

  getNetWorth:  (user: string)                    => get<NetWorthData>(`pf_nw_${user}`, DEFAULT_NW),
  saveNetWorth: (user: string, d: NetWorthData)   => set(`pf_nw_${user}`, d),

  getCurrency:  (user: string)                 => get<Currency>(`pf_currency_${user}`, DEFAULT_CURRENCY),
  saveCurrency: (user: string, d: Currency)    => set(`pf_currency_${user}`, d),

  getSpendTypeMap:  (user: string)                      => get<SpendTypeMap>(`pf_spendmap_${user}`, {}),
  saveSpendTypeMap: (user: string, d: SpendTypeMap)     => set(`pf_spendmap_${user}`, d),
};

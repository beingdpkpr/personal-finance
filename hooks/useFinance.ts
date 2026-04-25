import { useCallback, useEffect, useState } from 'react';
import {
  BudgetMap, Currency, Goal, NetWorthData,
  RecurringRule, Transaction, uid,
} from '../lib/data';
import { storage } from '../lib/storage';
import { setCurrency } from '../lib/format';
import { applyRecurring } from '../lib/recurring';

const DEFAULT_CURRENCY: Currency = { code: 'INR', symbol: '₹', locale: 'en-IN' };

export interface FinanceState {
  user: string | null;
  loading: boolean;
  txns: Transaction[];
  budgets: BudgetMap;
  goals: Goal[];
  nw: NetWorthData;
  recurring: RecurringRule[];
  currency: Currency;
  login: (username: string, password: string) => Promise<string | null>;
  register: (username: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  addTxn: (t: Omit<Transaction, 'id'>) => void;
  editTxn: (t: Transaction) => void;
  deleteTxn: (id: string) => void;
  setBudgets: (b: BudgetMap) => void;
  setGoals: (g: Goal[]) => void;
  setNw: (n: NetWorthData) => void;
  setRecurring: (r: RecurringRule[]) => void;
  setCurrencyPref: (c: Currency) => void;
}

export function useFinance(): FinanceState {
  const [user, setUser]                     = useState<string | null>(null);
  const [loading, setLoading]               = useState(true);
  const [txns, setTxnsState]                = useState<Transaction[]>([]);
  const [budgets, setBudgetsState]          = useState<BudgetMap>({});
  const [goals, setGoalsState]              = useState<Goal[]>([]);
  const [nw, setNwState]                    = useState<NetWorthData>({ assets: [], liabilities: [] });
  const [recurring, setRecurringState]      = useState<RecurringRule[]>([]);
  const [currency, setCurrencyState]        = useState<Currency>(DEFAULT_CURRENCY);

  async function loadUser(u: string) {
    const [t, b, r, g, n, c] = await Promise.all([
      storage.getTxns(u),
      storage.getBudgets(u),
      storage.getRecurring(u),
      storage.getGoals(u),
      storage.getNetWorth(u),
      storage.getCurrency(u),
    ]);
    const applied = applyRecurring(r, t);
    setCurrency(c);
    setUser(u);
    setTxnsState(applied);
    setBudgetsState(b);
    setRecurringState(r);
    setGoalsState(g);
    setNwState(n);
    setCurrencyState(c);
  }

  useEffect(() => {
    storage.getSession().then(async u => {
      if (u) await loadUser(u);
      setLoading(false);
    });
  }, []);

  useEffect(() => { if (user) storage.saveTxns(user, txns); },           [txns, user]);
  useEffect(() => { if (user) storage.saveBudgets(user, budgets); },     [budgets, user]);
  useEffect(() => { if (user) storage.saveRecurring(user, recurring); }, [recurring, user]);
  useEffect(() => { if (user) storage.saveGoals(user, goals); },         [goals, user]);
  useEffect(() => { if (user) storage.saveNetWorth(user, nw); },         [nw, user]);
  useEffect(() => { if (user) storage.saveCurrency(user, currency); },   [currency, user]);

  const login = useCallback(async (username: string, password: string) => {
    const users = await storage.getUsers();
    const u = users[username.trim()];
    if (!u || u.password !== password) return 'Invalid username or password.';
    await storage.setSession(username.trim());
    await loadUser(username.trim());
    return null;
  }, []);

  const register = useCallback(async (username: string, password: string) => {
    if (!username.trim() || !password.trim()) return 'Please fill in all fields.';
    const users = await storage.getUsers();
    if (users[username.trim()]) return 'Username already taken.';
    users[username.trim()] = { password };
    await storage.saveUsers(users);
    await storage.setSession(username.trim());
    await loadUser(username.trim());
    return null;
  }, []);

  const logout = useCallback(async () => {
    await storage.clearSession();
    setUser(null);
    setTxnsState([]);
    setBudgetsState({});
    setRecurringState([]);
    setGoalsState([]);
    setNwState({ assets: [], liabilities: [] });
    setCurrencyState(DEFAULT_CURRENCY);
  }, []);

  const addTxn = useCallback((t: Omit<Transaction, 'id'>) => {
    setTxnsState(prev => [...prev, { ...t, id: uid() }]);
  }, []);

  const editTxn = useCallback((t: Transaction) => {
    setTxnsState(prev => prev.map(x => x.id === t.id ? t : x));
  }, []);

  const deleteTxn = useCallback((id: string) => {
    setTxnsState(prev => prev.filter(x => x.id !== id));
  }, []);

  const setBudgets      = useCallback((b: BudgetMap)      => setBudgetsState(b),     []);
  const setGoals        = useCallback((g: Goal[])          => setGoalsState(g),       []);
  const setNw           = useCallback((n: NetWorthData)    => setNwState(n),          []);
  const setRecurring    = useCallback((r: RecurringRule[]) => setRecurringState(r),   []);
  const setCurrencyPref = useCallback((c: Currency) => {
    setCurrency(c);
    setCurrencyState(c);
  }, []);

  return {
    user, loading, txns, budgets, goals, nw, recurring, currency,
    login, register, logout,
    addTxn, editTxn, deleteTxn,
    setBudgets, setGoals, setNw, setRecurring, setCurrencyPref,
  };
}

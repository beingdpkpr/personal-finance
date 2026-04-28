import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BudgetMap, Currency, Goal, NetWorthData,
  RecurringRule, Transaction, uid,
} from '../lib/data';
import { storage } from '../lib/storage';
import { setCurrency } from '../lib/format';
import { applyRecurring } from '../lib/recurring';
import {
  saveGoogleSession, getGoogleSession, clearGoogleSession,
  isTokenExpired, saveSpreadsheetId, hasMigrated, setMigrated,
} from '../lib/google-auth';
import { ensureSpreadsheet, pushAll, pullAll } from '../lib/sync';

const DEFAULT_CURRENCY: Currency = { code: 'INR', symbol: '₹', locale: 'en-IN' };

export interface FinanceState {
  user:         string | null;   // Google userId (sub)
  loading:      boolean;
  txns:         Transaction[];
  budgets:      BudgetMap;
  goals:        Goal[];
  nw:           NetWorthData;
  recurring:    RecurringRule[];
  currency:     Currency;
  googleSignIn: (accessToken: string, expiresIn: number) => Promise<string | null>;
  logout:       () => Promise<void>;
  addTxn:       (t: Omit<Transaction, 'id'>) => void;
  editTxn:      (t: Transaction) => void;
  deleteTxn:    (id: string) => void;
  setBudgets:   (b: BudgetMap) => void;
  setGoals:     (g: Goal[]) => void;
  setNw:        (n: NetWorthData) => void;
  setRecurring: (r: RecurringRule[]) => void;
  setCurrencyPref: (c: Currency) => void;
}

export function useFinance(): FinanceState {
  const [user, setUser]               = useState<string | null>(null);
  const [loading, setLoading]         = useState(true);
  const [txns, setTxnsState]          = useState<Transaction[]>([]);
  const [budgets, setBudgetsState]    = useState<BudgetMap>({});
  const [goals, setGoalsState]        = useState<Goal[]>([]);
  const [nw, setNwState]              = useState<NetWorthData>({ assets: [], liabilities: [] });
  const [recurring, setRecurringState]= useState<RecurringRule[]>([]);
  const [currency, setCurrencyState]  = useState<Currency>(DEFAULT_CURRENCY);

  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleSync = useCallback(() => {
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(async () => {
      const session = await getGoogleSession();
      if (!session || !session.spreadsheetId || isTokenExpired(session)) return;
      try {
        await pushAll(session.accessToken, session.spreadsheetId, session.userId);
      } catch {
        // silent — next state change will retry
      }
    }, 2000);
  }, []);

  async function loadUser(userId: string) {
    const [t, b, r, g, n, c] = await Promise.all([
      storage.getTxns(userId),
      storage.getBudgets(userId),
      storage.getRecurring(userId),
      storage.getGoals(userId),
      storage.getNetWorth(userId),
      storage.getCurrency(userId),
    ]);
    const applied = applyRecurring(r, t);
    setCurrency(c);
    setUser(userId);
    setTxnsState(applied);
    setBudgetsState(b);
    setRecurringState(r);
    setGoalsState(g);
    setNwState(n);
    setCurrencyState(c);
  }

  useEffect(() => {
    getGoogleSession().then(async session => {
      if (session && !isTokenExpired(session)) {
        await loadUser(session.userId);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => { if (user) { storage.saveTxns(user, txns);           scheduleSync(); } }, [txns,      user, scheduleSync]);
  useEffect(() => { if (user) { storage.saveBudgets(user, budgets);     scheduleSync(); } }, [budgets,   user, scheduleSync]);
  useEffect(() => { if (user) { storage.saveRecurring(user, recurring); scheduleSync(); } }, [recurring, user, scheduleSync]);
  useEffect(() => { if (user) { storage.saveGoals(user, goals);         scheduleSync(); } }, [goals,     user, scheduleSync]);
  useEffect(() => { if (user) { storage.saveNetWorth(user, nw);         scheduleSync(); } }, [nw,        user, scheduleSync]);
  useEffect(() => { if (user) { storage.saveCurrency(user, currency);   scheduleSync(); } }, [currency,  user, scheduleSync]);

  const googleSignIn = useCallback(async (accessToken: string, expiresIn: number): Promise<string | null> => {
    try {
      // Fetch user info from Google
      const infoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!infoRes.ok) return 'Failed to get user info from Google.';
      const info = await infoRes.json() as { email: string; sub: string };

      await saveGoogleSession(accessToken, expiresIn, info.email, info.sub);

      // Ensure spreadsheet exists
      const existingSession = await getGoogleSession();
      const spreadsheetId = await ensureSpreadsheet(
        accessToken,
        existingSession?.spreadsheetId ?? null,
        info.email,
      );
      await saveSpreadsheetId(spreadsheetId);

      // Migration: push existing local data on first sign-in
      if (!(await hasMigrated())) {
        const oldSession = await storage.getSession();
        if (oldSession) {
          // Re-key old data from username to Google userId
          const [t, b, r, g, n, c] = await Promise.all([
            storage.getTxns(oldSession),
            storage.getBudgets(oldSession),
            storage.getRecurring(oldSession),
            storage.getGoals(oldSession),
            storage.getNetWorth(oldSession),
            storage.getCurrency(oldSession),
          ]);
          await Promise.all([
            storage.saveTxns(info.sub, t),
            storage.saveBudgets(info.sub, b),
            storage.saveRecurring(info.sub, r),
            storage.saveGoals(info.sub, g),
            storage.saveNetWorth(info.sub, n),
            storage.saveCurrency(info.sub, c),
          ]);
        }
        await pushAll(accessToken, spreadsheetId, info.sub);
        await setMigrated();
      } else {
        // Pull latest from Sheets and save to local
        const data = await pullAll(accessToken, spreadsheetId, info.sub);
        await Promise.all([
          storage.saveTxns(info.sub, data.txns),
          storage.saveBudgets(info.sub, data.budgets),
          storage.saveGoals(info.sub, data.goals),
          storage.saveRecurring(info.sub, data.recurring),
          storage.saveNetWorth(info.sub, data.nw),
          storage.saveCurrency(info.sub, data.currency),
        ]);
      }

      await loadUser(info.sub);
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : 'Sign-in failed.';
    }
  }, []);

  const logout = useCallback(async () => {
    if (syncTimer.current) clearTimeout(syncTimer.current);
    await clearGoogleSession();
    setUser(null);
    setTxnsState([]);
    setBudgetsState({});
    setRecurringState([]);
    setGoalsState([]);
    setNwState({ assets: [], liabilities: [] });
    setCurrencyState(DEFAULT_CURRENCY);
  }, []);

  const addTxn      = useCallback((t: Omit<Transaction, 'id'>) => setTxnsState(prev => [...prev, { ...t, id: uid() }]), []);
  const editTxn     = useCallback((t: Transaction) => setTxnsState(prev => prev.map(x => x.id === t.id ? t : x)), []);
  const deleteTxn   = useCallback((id: string) => setTxnsState(prev => prev.filter(x => x.id !== id)), []);
  const setBudgets  = useCallback((b: BudgetMap) => setBudgetsState(b), []);
  const setGoals    = useCallback((g: Goal[]) => setGoalsState(g), []);
  const setNw       = useCallback((n: NetWorthData) => setNwState(n), []);
  const setRecurring= useCallback((r: RecurringRule[]) => setRecurringState(r), []);
  const setCurrencyPref = useCallback((c: Currency) => { setCurrency(c); setCurrencyState(c); }, []);

  return {
    user, loading, txns, budgets, goals, nw, recurring, currency,
    googleSignIn, logout,
    addTxn, editTxn, deleteTxn,
    setBudgets, setGoals, setNw, setRecurring, setCurrencyPref,
  };
}

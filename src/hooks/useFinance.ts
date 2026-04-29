import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BudgetMap, Currency, CustomCategory, Goal, NetWorthData,
  RecurringRule, SpendTypeMap, Transaction, uid,
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
  email:        string | null;
  name:         string | null;
  picture:      string | null;
  loading:      boolean;
  txns:         Transaction[];
  budgets:      BudgetMap;
  goals:        Goal[];
  nw:           NetWorthData;
  recurring:    RecurringRule[];
  currency:     Currency;
  spendTypeMap: SpendTypeMap;
  googleSignIn: (accessToken: string, expiresIn: number) => Promise<string | null>;
  logout:       () => Promise<void>;
  loadDemoData: () => Promise<void>;
  addTxn:       (t: Omit<Transaction, 'id'>) => void;
  editTxn:      (t: Transaction) => void;
  deleteTxn:    (id: string) => void;
  setBudgets:   (b: BudgetMap) => void;
  setGoals:     (g: Goal[]) => void;
  setNw:        (n: NetWorthData) => void;
  setRecurring: (r: RecurringRule[]) => void;
  setCurrencyPref: (c: Currency) => void;
  setSpendTypeMap: (m: SpendTypeMap) => void;
  customCats:   CustomCategory[];
  setCustomCats:(c: CustomCategory[]) => void;
}

export function useFinance(): FinanceState {
  const [user, setUser]               = useState<string | null>(null);
  const [email, setEmail]             = useState<string | null>(null);
  const [name, setName]               = useState<string | null>(null);
  const [picture, setPicture]         = useState<string | null>(null);
  const [loading, setLoading]         = useState(true);
  const [txns, setTxnsState]          = useState<Transaction[]>([]);
  const [budgets, setBudgetsState]    = useState<BudgetMap>({});
  const [goals, setGoalsState]        = useState<Goal[]>([]);
  const [nw, setNwState]              = useState<NetWorthData>({ assets: [], liabilities: [] });
  const [recurring, setRecurringState]= useState<RecurringRule[]>([]);
  const [currency, setCurrencyState]  = useState<Currency>(DEFAULT_CURRENCY);
  const [spendTypeMap, setSpendTypeMapState] = useState<SpendTypeMap>({});
  const [customCats, setCustomCatsState]     = useState<CustomCategory[]>([]);

  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleSync = useCallback(() => {
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(async () => {
      const session = await getGoogleSession();
      if (!session) return;
      if (isTokenExpired(session)) {
        await clearGoogleSession();
        setUser(null);
        return;
      }
      if (!session.spreadsheetId) return;
      try {
        await pushAll(session.accessToken, session.spreadsheetId, session.userId);
      } catch {
        // silent — next state change will retry
      }
    }, 2000);
  }, []);

async function loadUser(userId: string, userEmail?: string | null, userName?: string | null, userPicture?: string | null) {
    const [t, b, r, g, n, c, sm, cc] = await Promise.all([
      storage.getTxns(userId),
      storage.getBudgets(userId),
      storage.getRecurring(userId),
      storage.getGoals(userId),
      storage.getNetWorth(userId),
      storage.getCurrency(userId),
      storage.getSpendTypeMap(userId),
      storage.getCustomCats(userId),
    ]);
    const applied = applyRecurring(r, t);
    setCurrency(c);
    setUser(userId);
    setEmail(userEmail ?? null);
    setName(userName ?? null);
    setPicture(userPicture ?? null);
    setTxnsState(applied);
    setBudgetsState(b);
    setRecurringState(r);
    setGoalsState(g);
    setNwState(n);
    setCurrencyState(c);
    setSpendTypeMapState(sm);
    setCustomCatsState(cc);
  }

  useEffect(() => {
    getGoogleSession().then(async session => {
      if (session && !isTokenExpired(session)) {
        await loadUser(session.userId, session.email, session.name, session.picture);
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
  useEffect(() => { if (user) { storage.saveSpendTypeMap(user, spendTypeMap); } }, [spendTypeMap, user]);
  useEffect(() => { if (user) { storage.saveCustomCats(user, customCats); } }, [customCats, user]);

  const googleSignIn = useCallback(async (accessToken: string, expiresIn: number): Promise<string | null> => {
    try {
      // Fetch user info from Google
      const infoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!infoRes.ok) return 'Failed to get user info from Google.';
      const info = await infoRes.json() as { email: string; sub: string; name?: string; picture?: string };
      if (!info?.sub || !info?.email) return 'Incomplete user info from Google.';

      await saveGoogleSession(accessToken, expiresIn, info.email, info.sub, info.name, info.picture);

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

      await loadUser(info.sub, info.email, info.name, info.picture);
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : 'Sign-in failed.';
    }
  }, []);

  const logout = useCallback(async () => {
    if (syncTimer.current) clearTimeout(syncTimer.current);
    await clearGoogleSession();
    setUser(null);
    setEmail(null);
    setName(null);
    setPicture(null);
    setTxnsState([]);
    setBudgetsState({});
    setRecurringState([]);
    setGoalsState([]);
    setNwState({ assets: [], liabilities: [] });
    setCurrencyState(DEFAULT_CURRENCY);
    setSpendTypeMapState({});
    setCustomCatsState([]);
  }, []);

  const addTxn      = useCallback((t: Omit<Transaction, 'id'>) => setTxnsState(prev => [...prev, { ...t, id: uid() }]), []);
  const editTxn     = useCallback((t: Transaction) => setTxnsState(prev => prev.map(x => x.id === t.id ? t : x)), []);
  const deleteTxn   = useCallback((id: string) => setTxnsState(prev => prev.filter(x => x.id !== id)), []);
  const setBudgets  = useCallback((b: BudgetMap) => setBudgetsState(b), []);
  const setGoals    = useCallback((g: Goal[]) => setGoalsState(g), []);
  const setNw       = useCallback((n: NetWorthData) => setNwState(n), []);
  const setRecurring= useCallback((r: RecurringRule[]) => setRecurringState(r), []);
  const setCurrencyPref = useCallback((c: Currency) => { setCurrency(c); setCurrencyState(c); }, []);
  const setSpendTypeMap = useCallback((m: SpendTypeMap) => setSpendTypeMapState(m), []);
  const setCustomCats   = useCallback((c: CustomCategory[]) => setCustomCatsState(c), []);

  const loadDemoData = useCallback(async () => {
    const DEMO_TXNS: Transaction[] = [
      // April 2026
      { id: 'dd01', type: 'income',  amount: 85000, category: 'salary',        description: 'Monthly Salary',          date: '2026-04-01' },
      { id: 'dd02', type: 'income',  amount: 15000, category: 'freelance',     description: 'Freelance Project',        date: '2026-04-15' },
      { id: 'dd03', type: 'expense', amount: 22000, category: 'essentials',    description: 'Rent',                     date: '2026-04-02' },
      { id: 'dd04', type: 'expense', amount: 3200,  category: 'essentials',    description: 'Electricity & Internet',   date: '2026-04-05' },
      { id: 'dd05', type: 'expense', amount: 2800,  category: 'food',          description: 'Grocery Shopping',         date: '2026-04-06' },
      { id: 'dd06', type: 'expense', amount: 1200,  category: 'food',          description: 'Dinner - Zomato',          date: '2026-04-09' },
      { id: 'dd07', type: 'expense', amount: 900,   category: 'food',          description: 'Team Lunch',               date: '2026-04-12' },
      { id: 'dd08', type: 'expense', amount: 2400,  category: 'food',          description: 'Weekend Meals',            date: '2026-04-19' },
      { id: 'dd09', type: 'expense', amount: 1200,  category: 'food',          description: 'Café & Snacks',            date: '2026-04-24' },
      { id: 'dd10', type: 'expense', amount: 1800,  category: 'transport',     description: 'Petrol',                   date: '2026-04-07' },
      { id: 'dd11', type: 'expense', amount: 600,   category: 'transport',     description: 'Cab Rides',                date: '2026-04-14' },
      { id: 'dd12', type: 'expense', amount: 800,   category: 'transport',     description: 'Metro Pass',               date: '2026-04-01' },
      { id: 'dd13', type: 'expense', amount: 3500,  category: 'entertainment', description: 'OTT + Cinema',             date: '2026-04-10' },
      { id: 'dd14', type: 'expense', amount: 2800,  category: 'entertainment', description: 'Weekend Getaway',          date: '2026-04-21' },
      { id: 'dd15', type: 'expense', amount: 8500,  category: 'shopping',      description: 'Clothing - Myntra',        date: '2026-04-17' },
      { id: 'dd16', type: 'expense', amount: 3800,  category: 'shopping',      description: 'Electronics - Amazon',     date: '2026-04-22' },
      { id: 'dd17', type: 'expense', amount: 2500,  category: 'health',        description: 'Health Checkup + Meds',    date: '2026-04-11' },
      { id: 'dd18', type: 'expense', amount: 10000, category: 'savings',       description: 'SIP Investment',           date: '2026-04-05' },
      { id: 'dd19', type: 'expense', amount: 5000,  category: 'family',        description: 'Parents Transfer',         date: '2026-04-08' },
      // 7-day sparkline data
      { id: 'dd20', type: 'expense', amount: 3200,  category: 'shopping',      description: 'Amazon Order',             date: '2026-04-22' },
      { id: 'dd21', type: 'expense', amount: 800,   category: 'food',          description: 'Coffee & Snacks',          date: '2026-04-23' },
      { id: 'dd22', type: 'expense', amount: 1500,  category: 'food',          description: 'Restaurant',               date: '2026-04-24' },
      { id: 'dd23', type: 'expense', amount: 2100,  category: 'transport',     description: 'Cab - Airport',            date: '2026-04-26' },
      { id: 'dd24', type: 'expense', amount: 4200,  category: 'entertainment', description: 'Concert Tickets',          date: '2026-04-27' },
      { id: 'dd25', type: 'expense', amount: 1200,  category: 'food',          description: 'Breakfast - Swiggy',       date: '2026-04-28' },
      // March 2026
      { id: 'dd26', type: 'income',  amount: 85000, category: 'salary',        description: 'Monthly Salary',          date: '2026-03-01' },
      { id: 'dd27', type: 'expense', amount: 22000, category: 'essentials',    description: 'Rent',                     date: '2026-03-02' },
      { id: 'dd28', type: 'expense', amount: 7800,  category: 'food',          description: 'Food & Dining',            date: '2026-03-15' },
      { id: 'dd29', type: 'expense', amount: 4200,  category: 'shopping',      description: 'Shopping',                 date: '2026-03-20' },
      { id: 'dd30', type: 'expense', amount: 3100,  category: 'entertainment', description: 'Entertainment',            date: '2026-03-12' },
      { id: 'dd31', type: 'expense', amount: 10000, category: 'savings',       description: 'SIP Investment',           date: '2026-03-05' },
      { id: 'dd32', type: 'expense', amount: 5000,  category: 'family',        description: 'Parents Transfer',         date: '2026-03-08' },
      { id: 'dd33', type: 'expense', amount: 2800,  category: 'transport',     description: 'Transport',                date: '2026-03-10' },
      // February 2026
      { id: 'dd34', type: 'income',  amount: 85000, category: 'salary',        description: 'Monthly Salary',          date: '2026-02-01' },
      { id: 'dd35', type: 'income',  amount: 8000,  category: 'freelance',     description: 'Freelance - Design',       date: '2026-02-20' },
      { id: 'dd36', type: 'expense', amount: 22000, category: 'essentials',    description: 'Rent',                     date: '2026-02-02' },
      { id: 'dd37', type: 'expense', amount: 9200,  category: 'food',          description: 'Food & Dining',            date: '2026-02-14' },
      { id: 'dd38', type: 'expense', amount: 6500,  category: 'shopping',      description: 'Valentine Shopping',      date: '2026-02-14' },
      { id: 'dd39', type: 'expense', amount: 5800,  category: 'entertainment', description: 'Entertainment',            date: '2026-02-18' },
      { id: 'dd40', type: 'expense', amount: 10000, category: 'savings',       description: 'SIP Investment',           date: '2026-02-05' },
      { id: 'dd41', type: 'expense', amount: 5000,  category: 'family',        description: 'Parents Transfer',         date: '2026-02-08' },
      // January 2026
      { id: 'dd42', type: 'income',  amount: 85000, category: 'salary',        description: 'Monthly Salary',          date: '2026-01-01' },
      { id: 'dd43', type: 'expense', amount: 22000, category: 'essentials',    description: 'Rent',                     date: '2026-01-02' },
      { id: 'dd44', type: 'expense', amount: 6800,  category: 'food',          description: 'Food & Dining',            date: '2026-01-15' },
      { id: 'dd45', type: 'expense', amount: 3200,  category: 'shopping',      description: 'Shopping',                 date: '2026-01-22' },
      { id: 'dd46', type: 'expense', amount: 2800,  category: 'entertainment', description: 'Entertainment',            date: '2026-01-12' },
      { id: 'dd47', type: 'expense', amount: 10000, category: 'savings',       description: 'SIP Investment',           date: '2026-01-05' },
      { id: 'dd48', type: 'expense', amount: 5000,  category: 'family',        description: 'Parents Transfer',         date: '2026-01-08' },
    ];
    const DEMO_BUDGETS: BudgetMap = {
      essentials:    { mode: 'fixed', value: 28000 },
      food:          { mode: 'fixed', value: 10000 },
      transport:     { mode: 'fixed', value: 5000  },
      entertainment: { mode: 'fixed', value: 6000  },
      shopping:      { mode: 'fixed', value: 10000 },
      health:        { mode: 'fixed', value: 5000  },
      savings:       { mode: 'fixed', value: 10000 },
      family:        { mode: 'fixed', value: 6000  },
    };
    const DEMO_GOALS: Goal[] = [
      { id: 'dg1', name: 'Emergency Fund',     target: 300000,  current: 180000, deadline: '2026-12-31' },
      { id: 'dg2', name: 'Vacation — Bali',    target: 150000,  current: 95000,  deadline: '2026-10-01' },
      { id: 'dg3', name: 'New Laptop',          target: 120000,  current: 45000,  deadline: '2026-08-15' },
      { id: 'dg4', name: 'House Down Payment',  target: 2000000, current: 380000, deadline: '2028-01-01' },
    ];
    const DEMO_NW: NetWorthData = {
      assets:      [
        { id: 'na1', name: 'Savings Account',  value: 250000 },
        { id: 'na2', name: 'Mutual Funds',      value: 380000 },
        { id: 'na3', name: 'EPF Balance',       value: 220000 },
        { id: 'na4', name: 'Fixed Deposit',     value: 100000 },
      ],
      liabilities: [
        { id: 'nl1', name: 'Home Loan',         value: 1800000 },
        { id: 'nl2', name: 'Personal Loan',     value: 80000  },
      ],
    };
    // Persist so page refresh survives
    await Promise.all([
      storage.saveTxns('demo', DEMO_TXNS),
      storage.saveBudgets('demo', DEMO_BUDGETS),
      storage.saveGoals('demo', DEMO_GOALS),
      storage.saveNetWorth('demo', DEMO_NW),
    ]);
    await saveGoogleSession('demo_token', 99999999, 'demo@example.com', 'demo', 'Demo User', null);
    setCurrency(DEFAULT_CURRENCY);
    setUser('demo');
    setEmail('demo@example.com');
    setName('Demo User');
    setPicture(null);
    setTxnsState(DEMO_TXNS);
    setBudgetsState(DEMO_BUDGETS);
    setGoalsState(DEMO_GOALS);
    setNwState(DEMO_NW);
    setCurrencyState(DEFAULT_CURRENCY);
    setSpendTypeMapState({});
    setCustomCatsState([]);
  }, []);

  return {
    user, email, name, picture, loading, txns, budgets, goals, nw, recurring, currency, spendTypeMap, customCats,
    googleSignIn, logout, loadDemoData,
    addTxn, editTxn, deleteTxn,
    setBudgets, setGoals, setNw, setRecurring, setCurrencyPref, setSpendTypeMap, setCustomCats,
  };
}

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BudgetMap, Category, Currency, Goal, IncomeCat, NetWorthData,
  Transaction, UserPrefs, DEFAULT_PREFS, uid,
} from '../lib/data';
import { DEFAULT_CATEGORIES, INCOME_CATS, CAT_TO_GROUP } from '../constants/categories';
import { storage } from '../lib/storage';
import { setCurrency } from '../lib/format';
import {
  saveGoogleSession, getGoogleSession, clearGoogleSession,
  isTokenExpired, hasMigrated, setMigrated, silentTokenRefresh,
} from '../lib/google-auth';
import { ensureSpreadsheet, pushAll, pullAll } from '../lib/sync';
import { runMigrationIfNeeded } from '../lib/migration';

const DEFAULT_CURRENCY: Currency = { code: 'INR', symbol: '₹', locale: 'en-IN' };

export interface FinanceState {
  user:            string | null;
  email:           string | null;
  name:            string | null;
  picture:         string | null;
  loading:         boolean;
  syncError:       string | null;
  sessionNote:     string | null;
  txns:            Transaction[];
  budgets:         BudgetMap;
  goals:           Goal[];
  nw:              NetWorthData;
  currency:        Currency;
  categories:      Category[];
  incomeCats:      IncomeCat[];
  googleSignIn:    (accessToken: string, expiresIn: number) => Promise<string | null>;
  logout:          () => Promise<void>;
  loadDemoData:    () => Promise<void>;
  syncNow:         () => Promise<string | null>;
  addTxn:          (t: Omit<Transaction, 'id'>) => void;
  editTxn:         (t: Transaction) => void;
  editTxns:        (ts: Transaction[]) => void;
  deleteTxn:       (id: string) => void;
  deleteTxns:      (ids: string[]) => void;
  setBudgets:      (b: BudgetMap) => void;
  setGoals:        (g: Goal[]) => void;
  setNw:           (n: NetWorthData) => void;
  setCurrencyPref: (c: Currency) => void;
  setCategories:   (c: Category[]) => void;
  setIncomeCats:   (c: IncomeCat[]) => void;
  prefs:           UserPrefs;
  setPrefs:        (p: UserPrefs) => void;
}

export function useFinance(): FinanceState {
  const [user, setUser]                  = useState<string | null>(null);
  const [email, setEmail]                = useState<string | null>(null);
  const [name, setName]                  = useState<string | null>(null);
  const [picture, setPicture]            = useState<string | null>(null);
  const [loading, setLoading]            = useState(true);
  const [txns, setTxnsState]             = useState<Transaction[]>([]);
  const [budgets, setBudgetsState]       = useState<BudgetMap>({});
  const [goals, setGoalsState]           = useState<Goal[]>([]);
  const [nw, setNwState]                 = useState<NetWorthData>({ assets: [], liabilities: [] });
  const [currency, setCurrencyState]     = useState<Currency>(DEFAULT_CURRENCY);
  const [categories, setCategoriesState]   = useState<Category[]>([]);
  const [incomeCatsState, setIncomeCatsState] = useState<IncomeCat[]>(INCOME_CATS);
  const [prefs, setPrefsState]             = useState<UserPrefs>(DEFAULT_PREFS);
  const [syncError, setSyncError]        = useState<string | null>(null);
  const [sessionNote, setSessionNote]    = useState<string | null>(null);

  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleSync = useCallback(() => {
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(async () => {
      let session = await getGoogleSession();
      if (!session) return;
      if (isTokenExpired(session)) {
        try {
          const { accessToken, expiresIn } = await silentTokenRefresh();
          await saveGoogleSession(accessToken, expiresIn, session.email, session.userId, session.name, session.picture);
          session = { ...session, accessToken, expiry: Date.now() + expiresIn * 1000 };
        } catch {
          setSessionNote('Your Google session expired. Open Settings to re-sync.');
          return;
        }
      }
      if (!session.spreadsheetId) return;
      try {
        await pushAll(session.accessToken, session.spreadsheetId, session.userId);
        setSyncError(null);
        setSessionNote(null);
      } catch (e) {
        setSyncError(e instanceof Error ? e.message : 'Sync failed. Changes are saved locally.');
      }
    }, 30_000);
  }, []);

  async function loadUser(userId: string, userEmail?: string | null, userName?: string | null, userPicture?: string | null) {
    runMigrationIfNeeded(userId);
    const [t, b, g, n, c, cats, ic, p] = await Promise.all([
      storage.getTxns(userId),
      storage.getBudgets(userId),
      storage.getGoals(userId),
      storage.getNetWorth(userId),
      storage.getCurrency(userId),
      storage.getCategories(userId),
      storage.getIncomeCats(userId),
      storage.getPrefs(userId),
    ]);
    const applied = t;
    // Normalise dates + always re-derive group from category (fixes wrong 'needs' fallback from migration)
    const resolvedCats: Category[] = cats.length > 0 ? cats : DEFAULT_CATEGORIES;
    const normalised = applied.map(txn => {
      let out = txn;
      const m = out.date?.match(/^(\d{2})-(\d{2})-(\d{4})$/);
      if (m) out = { ...out, date: `${m[3]}-${m[2]}-${m[1]}` };
      if (out.type === 'expense' && out.category) {
        const cat = resolvedCats.find(c => c.id === out.category);
        const correctGroup = cat?.group ?? CAT_TO_GROUP[out.category];
        if (correctGroup && correctGroup !== out.group) out = { ...out, group: correctGroup };
      }
      return out;
    });
    setCurrency(c);
    setUser(userId);
    setEmail(userEmail ?? null);
    setName(userName ?? null);
    setPicture(userPicture ?? null);
    setTxnsState(normalised);
    setBudgetsState(b);
    setGoalsState(g);
    setNwState(n);
    setCurrencyState(c);
    setCategoriesState(cats.length > 0 ? cats : DEFAULT_CATEGORIES);
    setIncomeCatsState(ic.length > 0 ? ic : INCOME_CATS);
    setPrefsState(p);
  }

  useEffect(() => {
    getGoogleSession().then(async session => {
      if (session && !isTokenExpired(session)) {
        await loadUser(session.userId, session.email, session.name, session.picture);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => { if (user) { storage.saveTxns(user, txns);             scheduleSync(); } }, [txns,       user, scheduleSync]);
  useEffect(() => { if (user) { storage.saveBudgets(user, budgets);       scheduleSync(); } }, [budgets,    user, scheduleSync]);
  useEffect(() => { if (user) { storage.saveGoals(user, goals);           scheduleSync(); } }, [goals,      user, scheduleSync]);
  useEffect(() => { if (user) { storage.saveNetWorth(user, nw);           scheduleSync(); } }, [nw,         user, scheduleSync]);
  useEffect(() => { if (user) { storage.saveCurrency(user, currency);     scheduleSync(); } }, [currency,   user, scheduleSync]);
  useEffect(() => { if (user) { storage.saveCategories(user, categories);  scheduleSync(); } }, [categories,  user, scheduleSync]);
  useEffect(() => { if (user) { storage.saveIncomeCats(user, incomeCatsState); scheduleSync(); } }, [incomeCatsState, user, scheduleSync]);
  useEffect(() => { if (user) { storage.savePrefs(user, prefs);           scheduleSync(); } }, [prefs,      user, scheduleSync]);

  const googleSignIn = useCallback(async (accessToken: string, expiresIn: number): Promise<string | null> => {
    try {
      const infoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!infoRes.ok) return 'Failed to get user info from Google.';
      const info = await infoRes.json() as { email: string; sub: string; name?: string; picture?: string };
      if (!info?.sub || !info?.email) return 'Incomplete user info from Google.';

      await saveGoogleSession(accessToken, expiresIn, info.email, info.sub, info.name, info.picture);

      const existingSession = await getGoogleSession();
      const { id: spreadsheetId, isNew } = await ensureSpreadsheet(
        accessToken,
        existingSession?.spreadsheetId ?? null,
        info.email,
      );

      const migrated = await hasMigrated();

      if (isNew && !migrated) {
        const oldSession = await storage.getSession();
        if (oldSession) {
          const [t, b, g, n, c] = await Promise.all([
            storage.getTxns(oldSession), storage.getBudgets(oldSession),
            storage.getGoals(oldSession),
            storage.getNetWorth(oldSession), storage.getCurrency(oldSession),
          ]);
          await Promise.all([
            storage.saveTxns(info.sub, t), storage.saveBudgets(info.sub, b),
            storage.saveGoals(info.sub, g),
            storage.saveNetWorth(info.sub, n), storage.saveCurrency(info.sub, c),
          ]);
        }
        await pushAll(accessToken, spreadsheetId, info.sub);
        await setMigrated();
      } else {
        const data = await pullAll(accessToken, spreadsheetId);
        await Promise.all([
          storage.saveTxns(info.sub, data.txns),
          storage.saveBudgets(info.sub, data.budgets),
          storage.saveGoals(info.sub, data.goals),
          storage.saveRecurring(info.sub, data.recurring),
          storage.saveNetWorth(info.sub, data.nw),
          storage.saveCurrency(info.sub, data.currency),
          storage.saveCategories(info.sub, data.categories),
          storage.saveIncomeCats(info.sub, data.incomeCats.length > 0 ? data.incomeCats : INCOME_CATS),
          storage.savePrefs(info.sub, data.userPrefs),
        ]);
        localStorage.setItem('pf_dark_mode', String(data.prefs.darkMode));
        localStorage.setItem('pf_theme_name', data.prefs.themeName);
        window.dispatchEvent(new CustomEvent('artha:theme-restored'));
        if (!migrated) await setMigrated();
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
    setGoalsState([]);
    setNwState({ assets: [], liabilities: [] });
    setCurrencyState(DEFAULT_CURRENCY);
    setCategoriesState([]);
  }, []);

  // Helper: compute net NW delta for one transaction being applied (+1) or reversed (-1)
  function applyTxnToNw(
    assets: NetWorthData['assets'],
    t: Pick<Transaction, 'amount' | 'sourceAccountId' | 'destinationAccountId'>,
    sign: 1 | -1,
  ): NetWorthData['assets'] {
    let changed = false;
    const next = assets.map(a => {
      let val = a.value;
      if (a.id === t.sourceAccountId)      val -= sign * t.amount;  // withdrawal
      if (a.id === t.destinationAccountId) val += sign * t.amount;  // deposit
      if (val !== a.value) { changed = true; return { ...a, value: val }; }
      return a;
    });
    return changed ? next : assets;
  }

  const addTxn = useCallback((t: Omit<Transaction, 'id'>) => {
    setTxnsState(prev => [...prev, { ...t, id: uid() }]);
    if (t.sourceAccountId || t.destinationAccountId) {
      setNwState(n => ({ ...n, assets: applyTxnToNw(n.assets, t, 1) }));
    }
  }, []);

  const editTxn = useCallback((t: Transaction) => {
    setTxnsState(prev => {
      const old = prev.find(x => x.id === t.id);
      if (old?.sourceAccountId || old?.destinationAccountId || t.sourceAccountId || t.destinationAccountId) {
        setNwState(n => {
          let assets = n.assets;
          if (old) assets = applyTxnToNw(assets, old, -1);  // undo old
          assets = applyTxnToNw(assets, t, 1);              // apply new
          return { ...n, assets };
        });
      }
      return prev.map(x => x.id === t.id ? t : x);
    });
  }, []);

  const editTxns = useCallback((ts: Transaction[]) => {
    const map = new Map(ts.map(t => [t.id, t]));
    setTxnsState(prev => {
      const linked = ts.filter(t => {
        const old = prev.find(x => x.id === t.id);
        return t.sourceAccountId || t.destinationAccountId || old?.sourceAccountId || old?.destinationAccountId;
      });
      if (linked.length > 0) {
        setNwState(n => {
          let assets = n.assets;
          linked.forEach(t => {
            const old = prev.find(x => x.id === t.id);
            if (old) assets = applyTxnToNw(assets, old, -1);
            assets = applyTxnToNw(assets, t, 1);
          });
          return { ...n, assets };
        });
      }
      return prev.map(x => map.has(x.id) ? map.get(x.id)! : x);
    });
  }, []);

  const deleteTxn = useCallback((id: string) => {
    setTxnsState(prev => {
      const txn = prev.find(x => x.id === id);
      if (txn && (txn.sourceAccountId || txn.destinationAccountId)) {
        setNwState(n => ({ ...n, assets: applyTxnToNw(n.assets, txn, -1) }));
      }
      return prev.filter(x => x.id !== id);
    });
  }, []);

  const deleteTxns = useCallback((ids: string[]) => {
    const set = new Set(ids);
    setTxnsState(prev => {
      const linked = prev.filter(x => set.has(x.id) && (x.sourceAccountId || x.destinationAccountId));
      if (linked.length > 0) {
        setNwState(n => {
          let assets = n.assets;
          linked.forEach(t => { assets = applyTxnToNw(assets, t, -1); });
          return { ...n, assets };
        });
      }
      return prev.filter(x => !set.has(x.id));
    });
  }, []);
  const setBudgets  = useCallback((b: BudgetMap) => setBudgetsState(b), []);
  const setGoals    = useCallback((g: Goal[]) => setGoalsState(g), []);
  const setNw       = useCallback((n: NetWorthData) => setNwState(n), []);
  const setCurrencyPref = useCallback((c: Currency) => { setCurrency(c); setCurrencyState(c); }, []);
  const setCategories   = useCallback((c: Category[]) => setCategoriesState(c), []);
  const setIncomeCats   = useCallback((c: IncomeCat[]) => setIncomeCatsState(c), []);
  const setPrefs        = useCallback((p: UserPrefs) => setPrefsState(p), []);

  const syncNow = useCallback(async (): Promise<string | null> => {
    let session = await getGoogleSession();
    if (!session) return 'Not signed in to Google.';
    if (isTokenExpired(session)) {
      try {
        const { accessToken, expiresIn } = await silentTokenRefresh();
        await saveGoogleSession(accessToken, expiresIn, session.email, session.userId, session.name, session.picture);
        session = { ...session, accessToken, expiry: Date.now() + expiresIn * 1000 };
      } catch {
        return 'Session expired. Please sign out and sign in again.';
      }
    }
    if (!session.spreadsheetId) return 'No spreadsheet linked.';
    try {
      await pushAll(session.accessToken, session.spreadsheetId, session.userId);
      setSyncError(null);
      setSessionNote(null);
      return null;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Sync failed.';
      setSyncError(msg);
      return msg;
    }
  }, []);

  const loadDemoData = useCallback(async () => {
    const DEMO_TXNS: Transaction[] = [
      // April 2026
      { id: 'dd01', type: 'income',  amount: 85000, category: 'salary',     description: 'Monthly Salary',        date: '2026-04-01' },
      { id: 'dd02', type: 'income',  amount: 15000, category: 'freelance',  description: 'Freelance Project',      date: '2026-04-15' },
      { id: 'dd03', type: 'expense', amount: 22000, group: 'needs',   category: 'essentials',    description: 'Rent',                   date: '2026-04-02' },
      { id: 'dd04', type: 'expense', amount: 3200,  group: 'needs',   category: 'essentials',    description: 'Electricity & Internet',  date: '2026-04-05' },
      { id: 'dd05', type: 'expense', amount: 2800,  group: 'needs',   category: 'food',          description: 'Grocery Shopping',        date: '2026-04-06' },
      { id: 'dd06', type: 'expense', amount: 1200,  group: 'needs',   category: 'food',          description: 'Dinner - Zomato',         date: '2026-04-09' },
      { id: 'dd07', type: 'expense', amount: 900,   group: 'needs',   category: 'food',          description: 'Team Lunch',              date: '2026-04-12' },
      { id: 'dd08', type: 'expense', amount: 2400,  group: 'needs',   category: 'food',          description: 'Weekend Meals',           date: '2026-04-19' },
      { id: 'dd09', type: 'expense', amount: 1200,  group: 'needs',   category: 'food',          description: 'Café & Snacks',           date: '2026-04-24' },
      { id: 'dd10', type: 'expense', amount: 1800,  group: 'needs',   category: 'transport',     description: 'Petrol',                  date: '2026-04-07' },
      { id: 'dd11', type: 'expense', amount: 600,   group: 'needs',   category: 'transport',     description: 'Cab Rides',               date: '2026-04-14' },
      { id: 'dd12', type: 'expense', amount: 800,   group: 'needs',   category: 'transport',     description: 'Metro Pass',              date: '2026-04-01' },
      { id: 'dd13', type: 'expense', amount: 3500,  group: 'wants',   category: 'entertainment', description: 'OTT + Cinema',            date: '2026-04-10' },
      { id: 'dd14', type: 'expense', amount: 2800,  group: 'wants',   category: 'entertainment', description: 'Weekend Getaway',         date: '2026-04-21' },
      { id: 'dd15', type: 'expense', amount: 8500,  group: 'wants',   category: 'shopping',      description: 'Clothing - Myntra',       date: '2026-04-17' },
      { id: 'dd16', type: 'expense', amount: 3800,  group: 'wants',   category: 'shopping',      description: 'Electronics - Amazon',    date: '2026-04-22' },
      { id: 'dd17', type: 'expense', amount: 2500,  group: 'needs',   category: 'health',        description: 'Health Checkup + Meds',  date: '2026-04-11' },
      { id: 'dd18', type: 'expense', amount: 10000, group: 'savings', category: 'savings',       description: 'SIP Investment',          date: '2026-04-05' },
      { id: 'dd19', type: 'expense', amount: 5000,  group: 'family',  category: 'family',        description: 'Parents Transfer',        date: '2026-04-08' },
      { id: 'dd20', type: 'expense', amount: 3200,  group: 'wants',   category: 'shopping',      description: 'Amazon Order',            date: '2026-04-22' },
      { id: 'dd21', type: 'expense', amount: 800,   group: 'needs',   category: 'food',          description: 'Coffee & Snacks',         date: '2026-04-23' },
      { id: 'dd22', type: 'expense', amount: 1500,  group: 'needs',   category: 'food',          description: 'Restaurant',              date: '2026-04-24' },
      { id: 'dd23', type: 'expense', amount: 2100,  group: 'needs',   category: 'transport',     description: 'Cab - Airport',           date: '2026-04-26' },
      { id: 'dd24', type: 'expense', amount: 4200,  group: 'wants',   category: 'entertainment', description: 'Concert Tickets',         date: '2026-04-27' },
      { id: 'dd25', type: 'expense', amount: 1200,  group: 'needs',   category: 'food',          description: 'Breakfast - Swiggy',      date: '2026-04-28' },
      // March 2026
      { id: 'dd26', type: 'income',  amount: 85000, category: 'salary',     description: 'Monthly Salary',        date: '2026-03-01' },
      { id: 'dd27', type: 'expense', amount: 22000, group: 'needs',   category: 'essentials',    description: 'Rent',                   date: '2026-03-02' },
      { id: 'dd28', type: 'expense', amount: 7800,  group: 'needs',   category: 'food',          description: 'Food & Dining',          date: '2026-03-15' },
      { id: 'dd29', type: 'expense', amount: 4200,  group: 'wants',   category: 'shopping',      description: 'Shopping',               date: '2026-03-20' },
      { id: 'dd30', type: 'expense', amount: 3100,  group: 'wants',   category: 'entertainment', description: 'Entertainment',          date: '2026-03-12' },
      { id: 'dd31', type: 'expense', amount: 10000, group: 'savings', category: 'savings',       description: 'SIP Investment',         date: '2026-03-05' },
      { id: 'dd32', type: 'expense', amount: 5000,  group: 'family',  category: 'family',        description: 'Parents Transfer',       date: '2026-03-08' },
      { id: 'dd33', type: 'expense', amount: 2800,  group: 'needs',   category: 'transport',     description: 'Transport',              date: '2026-03-10' },
      // February 2026
      { id: 'dd34', type: 'income',  amount: 85000, category: 'salary',     description: 'Monthly Salary',        date: '2026-02-01' },
      { id: 'dd35', type: 'income',  amount: 8000,  category: 'freelance',  description: 'Freelance - Design',    date: '2026-02-20' },
      { id: 'dd36', type: 'expense', amount: 22000, group: 'needs',   category: 'essentials',    description: 'Rent',                   date: '2026-02-02' },
      { id: 'dd37', type: 'expense', amount: 9200,  group: 'needs',   category: 'food',          description: 'Food & Dining',          date: '2026-02-14' },
      { id: 'dd38', type: 'expense', amount: 6500,  group: 'wants',   category: 'shopping',      description: 'Valentine Shopping',     date: '2026-02-14' },
      { id: 'dd39', type: 'expense', amount: 5800,  group: 'wants',   category: 'entertainment', description: 'Entertainment',          date: '2026-02-18' },
      { id: 'dd40', type: 'expense', amount: 10000, group: 'savings', category: 'savings',       description: 'SIP Investment',         date: '2026-02-05' },
      { id: 'dd41', type: 'expense', amount: 5000,  group: 'family',  category: 'family',        description: 'Parents Transfer',       date: '2026-02-08' },
      // January 2026
      { id: 'dd42', type: 'income',  amount: 85000, category: 'salary',     description: 'Monthly Salary',        date: '2026-01-01' },
      { id: 'dd43', type: 'expense', amount: 22000, group: 'needs',   category: 'essentials',    description: 'Rent',                   date: '2026-01-02' },
      { id: 'dd44', type: 'expense', amount: 6800,  group: 'needs',   category: 'food',          description: 'Food & Dining',          date: '2026-01-15' },
      { id: 'dd45', type: 'expense', amount: 3200,  group: 'wants',   category: 'shopping',      description: 'Shopping',               date: '2026-01-22' },
      { id: 'dd46', type: 'expense', amount: 2800,  group: 'wants',   category: 'entertainment', description: 'Entertainment',          date: '2026-01-12' },
      { id: 'dd47', type: 'expense', amount: 10000, group: 'savings', category: 'savings',       description: 'SIP Investment',         date: '2026-01-05' },
      { id: 'dd48', type: 'expense', amount: 5000,  group: 'family',  category: 'family',        description: 'Parents Transfer',       date: '2026-01-08' },
    ];
    const DEMO_BUDGETS: BudgetMap = {
      needs:   { mode: 'fixed', value: 35000 },
      wants:   { mode: 'fixed', value: 20000 },
      savings: { mode: 'fixed', value: 10000 },
      family:  { mode: 'fixed', value: 6000  },
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
    await Promise.all([
      storage.saveTxns('demo', DEMO_TXNS),
      storage.saveBudgets('demo', DEMO_BUDGETS),
      storage.saveGoals('demo', DEMO_GOALS),
      storage.saveNetWorth('demo', DEMO_NW),
      storage.saveCategories('demo', DEFAULT_CATEGORIES),
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
    setCategoriesState(DEFAULT_CATEGORIES);
  }, []);

  return {
    user, email, name, picture, loading, txns, budgets, goals, nw, currency, categories, incomeCats: incomeCatsState,
    syncError, sessionNote,
    googleSignIn, logout, loadDemoData, syncNow,
    addTxn, editTxn, editTxns, deleteTxn, deleteTxns,
    setBudgets, setGoals, setNw, setCurrencyPref, setCategories, setIncomeCats, setPrefs,
    prefs,
  };
}

import React, { useMemo } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { useFinance } from '../../hooks/FinanceContext';
import StatCard from '../../components/StatCard';
import CategoryBar from '../../components/CategoryBar';
import { colors, spacing, radius, WIDE_BREAKPOINT } from '../../constants/theme';
import { fmt, fmtFull } from '../../lib/format';
import { resolveLimit } from '../../lib/data';
import { EXPENSE_CATS, INCOME_CATS } from '../../constants/categories';
import { TrashIcon, EditIcon } from '../../components/icons';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardScreen() {
  const { txns, budgets, currency, openEdit, deleteTxn, customCats } = useFinance();
  const { width } = useWindowDimensions();
  const wide = width >= WIDE_BREAKPOINT;

  const now = new Date();
  const ym  = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const { income, expenses, monthTxns } = useMemo(() => {
    const monthTxns = txns.filter(t => t.date.startsWith(ym));
    const income    = monthTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expenses  = monthTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { income, expenses, monthTxns };
  }, [txns, ym]);

  const savings  = income - expenses;
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const forecast = now.getDate() > 0 ? (expenses / now.getDate()) * daysInMonth : 0;

  const allCats = useMemo(
    () => Object.fromEntries([...EXPENSE_CATS, ...INCOME_CATS, ...customCats].map(c => [c.id, c])),
    [customCats],
  );

  const recent = [...txns].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);

  const alerts = useMemo(() => {
    return EXPENSE_CATS.filter(cat => {
      const limit = resolveLimit(budgets[cat.id], income);
      if (!limit) return false;
      const spent = monthTxns.filter(t => t.type === 'expense' && t.category === cat.id)
        .reduce((s, t) => s + t.amount, 0);
      return spent / limit >= 0.8;
    }).map(cat => {
      const limit = resolveLimit(budgets[cat.id], income)!;
      const spent = monthTxns.filter(t => t.type === 'expense' && t.category === cat.id)
        .reduce((s, t) => s + t.amount, 0);
      return { cat, spent, limit, over: spent > limit };
    });
  }, [budgets, monthTxns, income]);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>{getGreeting()}</Text>
      <Text style={styles.heading}>{now.toLocaleString('default', { month: 'long', year: 'numeric' })}</Text>

      <View style={[styles.grid, wide && styles.gridWide]}>
        <StatCard label="Total Income"   value={fmtFull(income)}   color={colors.green} />
        <StatCard label="Total Expenses" value={fmtFull(expenses)} color={colors.red}   />
        <StatCard label="Net Savings"    value={fmtFull(savings)}  color={savings >= 0 ? colors.green : colors.red} />
        <StatCard label="Transactions"   value={String(monthTxns.length)} color={colors.blue} />
      </View>

      <View style={styles.forecastRow}>
        <Text style={styles.forecastLabel}>Spending forecast this month</Text>
        <Text style={styles.forecastValue}>{fmtFull(forecast)}</Text>
      </View>

      {alerts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Budget Alerts</Text>
          {alerts.map(({ cat, spent, limit, over }) => (
            <CategoryBar key={cat.id} label={cat.label} color={over ? colors.red : colors.yellow}
              spent={spent} budget={limit} showBudget />
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        {recent.map(t => {
          const cat = allCats[t.category];
          return (
            <View key={t.id} style={styles.txnRow}>
              <View style={[styles.catDot, { backgroundColor: cat?.color ?? colors.muted }]} />
              <View style={styles.txnLeft}>
                <Text style={styles.txnDesc}>{t.description}</Text>
                <Text style={styles.txnMeta}>{cat?.label ?? t.category} · {t.date}</Text>
              </View>
              <View style={styles.txnRight}>
                <Text style={[styles.txnAmt, { color: t.type === 'income' ? colors.green : colors.red }]}>
                  {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                </Text>
                <View style={styles.txnActions}>
                  <Pressable onPress={() => openEdit(t)} style={styles.iconBtn}><EditIcon size={14} color={colors.muted} /></Pressable>
                  <Pressable onPress={() => deleteTxn(t.id)} style={styles.iconBtn}><TrashIcon size={14} color={colors.muted} /></Pressable>
                </View>
              </View>
            </View>
          );
        })}
        {recent.length === 0 && <Text style={styles.empty}>No transactions yet. Add one to get started!</Text>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: colors.bg },
  content:       { padding: spacing.md, paddingBottom: spacing.xl * 2 },
  greeting:      { fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.accent, marginBottom: 2 },
  heading:       { fontSize: 24, fontFamily: 'PlusJakartaSans_800ExtraBold', color: colors.text, marginBottom: spacing.md },
  grid:          { gap: spacing.sm, marginBottom: spacing.md },
  gridWide:      { flexDirection: 'row', flexWrap: 'wrap' },
  forecastRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                   backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1,
                   borderColor: colors.border, padding: spacing.md, marginBottom: spacing.md },
  forecastLabel: { fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', color: colors.muted },
  forecastValue: { fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', color: colors.accent },
  section:       { marginBottom: spacing.md },
  sectionTitle:  { fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold', color: colors.muted,
                   textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing.sm },
  txnRow:        { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
                   borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
                   paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginBottom: spacing.xs },
  catDot:        { width: 8, height: 8, borderRadius: 4, marginRight: spacing.sm },
  txnLeft:       { flex: 1 },
  txnDesc:       { fontSize: 14, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.text },
  txnMeta:       { fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', color: colors.muted, marginTop: 2 },
  txnRight:      { alignItems: 'flex-end' },
  txnAmt:        { fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold' },
  txnActions:    { flexDirection: 'row', marginTop: 2 },
  iconBtn:       { padding: 4 },
  empty:         { color: colors.muted, fontFamily: 'PlusJakartaSans_400Regular', textAlign: 'center', marginTop: spacing.md },
});

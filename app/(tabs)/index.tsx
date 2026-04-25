import React, { useMemo } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { useFinance } from '../../hooks/FinanceContext';
import StatCard from '../../components/StatCard';
import CategoryBar from '../../components/CategoryBar';
import { colors, spacing, radius, WIDE_BREAKPOINT } from '../../constants/theme';
import { fmt, fmtFull } from '../../lib/format';
import { resolveLimit } from '../../lib/data';
import { EXPENSE_CATS } from '../../constants/categories';
import { TrashIcon, EditIcon } from '../../components/icons';

export default function DashboardScreen() {
  const { txns, budgets, currency, openEdit, deleteTxn } = useFinance();
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
      <Text style={styles.heading}>Dashboard</Text>
      <Text style={styles.sub}>{now.toLocaleString('default', { month: 'long', year: 'numeric' })}</Text>

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
        {recent.map(t => (
          <View key={t.id} style={styles.txnRow}>
            <View style={styles.txnLeft}>
              <Text style={styles.txnDesc}>{t.description}</Text>
              <Text style={styles.txnMeta}>{t.category} · {t.date}</Text>
            </View>
            <Text style={[styles.txnAmt, { color: t.type === 'income' ? colors.green : colors.red }]}>
              {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
            </Text>
            <Pressable onPress={() => openEdit(t)} style={styles.iconBtn}><EditIcon size={16} color={colors.muted} /></Pressable>
            <Pressable onPress={() => deleteTxn(t.id)} style={styles.iconBtn}><TrashIcon size={16} color={colors.muted} /></Pressable>
          </View>
        ))}
        {recent.length === 0 && <Text style={styles.empty}>No transactions yet. Add one to get started!</Text>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: colors.bg },
  content:       { padding: spacing.md, paddingBottom: spacing.xl * 2 },
  heading:       { fontSize: 22, fontFamily: 'PlusJakartaSans_800ExtraBold', color: colors.text, marginBottom: 2 },
  sub:           { fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', color: colors.muted, marginBottom: spacing.md },
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
                   padding: spacing.sm, marginBottom: spacing.xs, gap: spacing.xs },
  txnLeft:       { flex: 1 },
  txnDesc:       { fontSize: 14, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.text },
  txnMeta:       { fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', color: colors.muted, marginTop: 2 },
  txnAmt:        { fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', marginHorizontal: spacing.xs },
  iconBtn:       { padding: 6 },
  empty:         { color: colors.muted, fontFamily: 'PlusJakartaSans_400Regular', textAlign: 'center', marginTop: spacing.md },
});

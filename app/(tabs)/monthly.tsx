import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { VictoryBar, VictoryChart, VictoryAxis, VictoryGroup } from 'victory-native';
import { useFinance } from '../../hooks/FinanceContext';
import CategoryBar from '../../components/CategoryBar';
import { colors, spacing, radius } from '../../constants/theme';
import { fmt, fmtFull } from '../../lib/format';
import { EXPENSE_CATS, MONTHS } from '../../constants/categories';
import { ChevronLeftIcon, ChevronRightIcon, EditIcon } from '../../components/icons';

export default function MonthlyScreen() {
  const { txns, openEdit } = useFinance();
  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  const ym = `${year}-${String(month + 1).padStart(2, '0')}`;

  const { income, expenses, catBreakdown, monthTxns } = useMemo(() => {
    const monthTxns  = txns.filter(t => t.date.startsWith(ym));
    const income     = monthTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expenses   = monthTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const catBreakdown = EXPENSE_CATS
      .map(cat => ({
        cat,
        spent: monthTxns.filter(t => t.type === 'expense' && t.category === cat.id)
                        .reduce((s, t) => s + t.amount, 0),
      }))
      .filter(({ spent }) => spent > 0)
      .sort((a, b) => b.spent - a.spent);
    return { income, expenses, catBreakdown, monthTxns };
  }, [txns, ym]);

  const chartData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d   = new Date(year, month - 5 + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const inc = txns.filter(t => t.type === 'income'  && t.date.startsWith(key)).reduce((s, t) => s + t.amount, 0);
      const exp = txns.filter(t => t.type === 'expense' && t.date.startsWith(key)).reduce((s, t) => s + t.amount, 0);
      return { x: MONTHS[d.getMonth()], inc, exp };
    });
  }, [txns, year, month]);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Monthly Report</Text>

      <View style={styles.picker}>
        <Pressable onPress={prevMonth} style={styles.arrow}><ChevronLeftIcon size={20} color={colors.text} /></Pressable>
        <Text style={styles.pickerLabel}>{MONTHS[month]} {year}</Text>
        <Pressable onPress={nextMonth} style={styles.arrow}><ChevronRightIcon size={20} color={colors.text} /></Pressable>
      </View>

      <View style={styles.row2}>
        <View style={[styles.card, { flex: 1 }]}>
          <Text style={styles.cardLabel}>Income</Text>
          <Text style={[styles.cardVal, { color: colors.green }]}>{fmtFull(income)}</Text>
        </View>
        <View style={[styles.card, { flex: 1 }]}>
          <Text style={styles.cardLabel}>Expenses</Text>
          <Text style={[styles.cardVal, { color: colors.red }]}>{fmtFull(expenses)}</Text>
        </View>
      </View>

      <View style={styles.chartWrap}>
        <Text style={styles.sectionTitle}>6-Month Trend</Text>
        <VictoryChart height={200} padding={{ top: 10, bottom: 40, left: 50, right: 20 }}>
          <VictoryAxis
            style={{ tickLabels: { fill: colors.muted, fontSize: 10 }, axis: { stroke: colors.border } }}
          />
          <VictoryAxis dependentAxis
            style={{ tickLabels: { fill: colors.muted, fontSize: 10 }, axis: { stroke: colors.border },
                     grid: { stroke: colors.border, strokeDasharray: '4,4' } }}
            tickFormat={(v: number) => fmt(v)}
          />
          <VictoryGroup offset={12}>
            <VictoryBar data={chartData} x="x" y="inc"
              style={{ data: { fill: colors.green, width: 10 } }} cornerRadius={{ top: 3 }} />
            <VictoryBar data={chartData} x="x" y="exp"
              style={{ data: { fill: colors.red, width: 10 } }} cornerRadius={{ top: 3 }} />
          </VictoryGroup>
        </VictoryChart>
      </View>

      {catBreakdown.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category Breakdown</Text>
          {catBreakdown.map(({ cat, spent }) => (
            <CategoryBar key={cat.id} label={cat.label} color={cat.color} spent={spent} />
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Transactions</Text>
        {[...monthTxns].sort((a, b) => b.date.localeCompare(a.date)).map(t => (
          <Pressable key={t.id} onPress={() => openEdit(t)} style={styles.txnRow}>
            <View style={styles.txnLeft}>
              <Text style={styles.txnDesc}>{t.description}</Text>
              <Text style={styles.txnMeta}>{t.category} · {t.date}</Text>
            </View>
            <Text style={[styles.txnAmt, { color: t.type === 'income' ? colors.green : colors.red }]}>
              {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
            </Text>
            <EditIcon size={14} color={colors.muted} />
          </Pressable>
        ))}
        {monthTxns.length === 0 && <Text style={styles.empty}>No transactions this month.</Text>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:         { flex: 1, backgroundColor: colors.bg },
  content:      { padding: spacing.md, paddingBottom: spacing.xl * 2 },
  heading:      { fontSize: 22, fontFamily: 'PlusJakartaSans_800ExtraBold', color: colors.text, marginBottom: spacing.md },
  picker:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.lg, marginBottom: spacing.md },
  arrow:        { padding: spacing.sm },
  pickerLabel:  { fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold', color: colors.text, minWidth: 110, textAlign: 'center' },
  row2:         { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  card:         { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  cardLabel:    { fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', color: colors.muted, marginBottom: 4 },
  cardVal:      { fontSize: 18, fontFamily: 'PlusJakartaSans_700Bold' },
  chartWrap:    { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.md },
  section:      { marginBottom: spacing.md },
  sectionTitle: { fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing.sm },
  txnRow:       { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.sm, marginBottom: spacing.xs, gap: spacing.xs },
  txnLeft:      { flex: 1 },
  txnDesc:      { fontSize: 14, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.text },
  txnMeta:      { fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', color: colors.muted, marginTop: 2 },
  txnAmt:       { fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', marginHorizontal: spacing.xs },
  empty:        { color: colors.muted, fontFamily: 'PlusJakartaSans_400Regular', textAlign: 'center', marginTop: spacing.md },
});

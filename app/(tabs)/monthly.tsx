import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Animated } from 'react-native';
import { VictoryBar, VictoryChart, VictoryAxis, VictoryGroup } from 'victory-native';
import { useFinance } from '../../hooks/FinanceContext';
import CategoryBar from '../../components/CategoryBar';
import { spacing, radius, Colors } from '../../constants/theme';
import { useColors } from '../../hooks/ThemeContext';
import { fmt, fmtFull } from '../../lib/format';
import { EXPENSE_CATS, MONTHS } from '../../constants/categories';
import { ChevronLeftIcon, ChevronRightIcon, EditIcon } from '../../components/icons';

function WaffleChart({ data }: { data: { label: string; color: string; value: number }[] }) {
  const colors = useColors();
  const total = useMemo(() => data.reduce((s, d) => s + d.value, 0), [data]);

  const [count, setCount] = useState(0);
  useEffect(() => {
    setCount(0);
    let c = 0;
    const timer = setInterval(() => {
      c += 2;
      setCount(Math.min(c, 100));
      if (c >= 100) clearInterval(timer);
    }, 24);
    return () => clearInterval(timer);
  }, []);

  const dots = useMemo(() => {
    const arr = new Array(100).fill(colors.border);
    if (total === 0) return arr;
    let filled = 0;
    for (const d of data) {
      const dotCount = Math.round((d.value / total) * 100);
      for (let i = 0; i < dotCount && filled < 100; i++, filled++) {
        arr[filled] = d.color;
      }
    }
    return arr;
  }, [data, total, colors.border]);

  if (total === 0) return null;

  return (
    <View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.md }}>
        {dots.map((dotColor, i) => (
          <View key={i} style={{ width: '10%', aspectRatio: 1, padding: 2.5 }}>
            <View style={{
              flex: 1,
              borderRadius: 100,
              backgroundColor: i < count ? dotColor : 'rgba(255,255,255,0.06)',
            }} />
          </View>
        ))}
      </View>
      <View style={{ gap: 6 }}>
        {data.map(d => (
          <View key={d.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: d.color }} />
            <Text style={{ flex: 1, fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', color: colors.text }}>
              {d.label}
            </Text>
            <Text style={{ fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.muted }}>
              {total > 0 ? ((d.value / total) * 100).toFixed(0) : 0}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function MonthlyScreen() {
  const colors = useColors();
  const { txns, openEdit } = useFinance();
  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  // Fade-up entrance animation
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);
  const animStyle = { opacity: fadeAnim, transform: [{ translateY: slideAnim }] };

  const styles = useMemo(() => makeStyles(colors), [colors]);

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
      <Animated.View style={animStyle}>
        <Text style={styles.heading}>Monthly Report</Text>

        <View style={styles.picker}>
          <Pressable onPress={prevMonth} style={styles.arrow}><ChevronLeftIcon size={20} color={colors.text} /></Pressable>
          <Text style={styles.pickerLabel}>{MONTHS[month]} {year}</Text>
          <Pressable onPress={nextMonth} style={styles.arrow}><ChevronRightIcon size={20} color={colors.text} /></Pressable>
        </View>

        {/* Glass summary cards */}
        <View style={styles.row2}>
          <View style={styles.summaryCard}>
            <Text style={styles.cardLabel}>Income</Text>
            <Text style={[styles.cardVal, { color: colors.green }]}>{fmtFull(income)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.cardLabel}>Expenses</Text>
            <Text style={[styles.cardVal, { color: colors.red }]}>{fmtFull(expenses)}</Text>
          </View>
        </View>
      </Animated.View>

      {/* Chart wrapped in glass card */}
      <View style={styles.chartCard}>
        <Text style={styles.sectionTitle}>6-Month Trend</Text>
        <VictoryChart height={200} padding={{ top: 10, bottom: 40, left: 50, right: 20 }}
          style={{ parent: { backgroundColor: 'transparent' } }}>
          <VictoryAxis
            style={{ tickLabels: { fill: colors.muted, fontSize: 10 }, axis: { stroke: colors.glassBorder } }}
          />
          <VictoryAxis dependentAxis
            style={{ tickLabels: { fill: colors.muted, fontSize: 10 }, axis: { stroke: colors.glassBorder },
                     grid: { stroke: colors.glassBorder, strokeDasharray: '4,4' } }}
            tickFormat={(v: number) => fmt(v)}
          />
          <VictoryGroup offset={12}>
            <VictoryBar data={chartData} x="x" y="inc"
              style={{ data: { fill: colors.green, width: 10 } }} cornerRadius={{ top: 3 }} />
            <VictoryBar data={chartData} x="x" y="exp"
              style={{ data: { fill: colors.accent, width: 10 } }} cornerRadius={{ top: 3 }} />
          </VictoryGroup>
        </VictoryChart>
      </View>

      {catBreakdown.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Spending by Category</Text>
          {/* Glass wrapper around waffle + bars */}
          <View style={styles.catBreakdownCard}>
            <Text style={styles.waffleTotal}>{fmtFull(expenses)}</Text>
            <WaffleChart
              data={catBreakdown.slice(0, 8).map(({ cat, spent }) => ({ label: cat.label, color: cat.color, value: spent }))}
            />
          </View>
          {catBreakdown.map(({ cat, spent }) => (
            <CategoryBar key={cat.id} label={cat.label} color={cat.color} spent={spent} budget={expenses} />
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

function makeStyles(colors: Colors) { return StyleSheet.create({
  root:             { flex: 1, backgroundColor: colors.bg },
  content:          { padding: spacing.md, paddingBottom: spacing.xl * 2 },
  heading:          { fontSize: 22, fontFamily: 'PlusJakartaSans_800ExtraBold', color: colors.text, marginBottom: spacing.md },
  picker:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.lg, marginBottom: spacing.md },
  arrow:            { padding: spacing.sm },
  pickerLabel:      { fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold', color: colors.text, minWidth: 110, textAlign: 'center' },
  row2:             { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  // Glass summary cards
  summaryCard:      { flex: 1, backgroundColor: colors.glass, borderWidth: 1,
                      borderColor: colors.glassBorder, borderRadius: radius.xl, padding: spacing.md },
  cardLabel:        { fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', color: colors.muted, marginBottom: 4 },
  cardVal:          { fontSize: 18, fontFamily: 'PlusJakartaSans_700Bold' },
  // Glass chart card
  chartCard:        { backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.glassBorder,
                      borderRadius: radius.xl, padding: spacing.md, marginBottom: spacing.sm },
  section:          { marginBottom: spacing.md },
  sectionTitle:     { fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold', color: colors.muted,
                      textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing.sm },
  // Glass category breakdown card
  catBreakdownCard: { backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.glassBorder,
                      borderRadius: radius.xl, padding: spacing.md, marginBottom: spacing.sm },
  waffleTotal:      { fontSize: 28, fontFamily: 'PlusJakartaSans_800ExtraBold', color: colors.text, marginBottom: spacing.md },
  txnRow:           { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.glass,
                      borderRadius: radius.md, borderWidth: 1, borderColor: colors.glassBorder,
                      padding: spacing.sm, marginBottom: spacing.xs, gap: spacing.xs },
  txnLeft:          { flex: 1 },
  txnDesc:          { fontSize: 14, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.text },
  txnMeta:          { fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', color: colors.muted, marginTop: 2 },
  txnAmt:           { fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', marginHorizontal: spacing.xs },
  empty:            { color: colors.muted, fontFamily: 'PlusJakartaSans_400Regular', textAlign: 'center', marginTop: spacing.md },
}); }

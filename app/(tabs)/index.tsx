import React, { useMemo, useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Animated } from 'react-native';
import { useFinance } from '../../hooks/FinanceContext';
import CategoryBar from '../../components/CategoryBar';
import { spacing, radius, Colors } from '../../constants/theme';
import { useColors } from '../../hooks/ThemeContext';
import { fmt, fmtFull } from '../../lib/format';
import { resolveLimit } from '../../lib/data';
import { EXPENSE_CATS, INCOME_CATS } from '../../constants/categories';
import { TrashIcon, EditIcon } from '../../components/icons';
import Svg, { Rect } from 'react-native-svg';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function useCountUp(target: number, duration = 900) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    setVal(0);
    const steps = 45;
    const stepDur = duration / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const t = step / steps;
      const eased = t * (2 - t);
      setVal(target * eased);
      if (step >= steps) { setVal(target); clearInterval(timer); }
    }, stepDur);
    return () => clearInterval(timer);
  }, [target]);
  return val;
}

function SparklineChart({ data, barColor, width = 120, height = 44 }: { data: number[]; barColor: string; width?: number; height?: number }) {
  const max = Math.max(...data, 1);
  const gap = 3;
  const barW = Math.floor((width - gap * (data.length - 1)) / data.length);
  return (
    <Svg width={width} height={height}>
      {data.map((v, i) => {
        const barH = Math.max((v / max) * (height - 4), 2);
        const x = i * (barW + gap);
        const y = height - barH;
        return <Rect key={i} x={x} y={y} width={barW} height={barH} rx={2} fill={barColor} opacity={0.4 + 0.6 * (v / max)} />;
      })}
    </Svg>
  );
}

export default function DashboardScreen() {
  const colors = useColors();
  const { txns, budgets, openEdit, deleteTxn, customCats } = useFinance();

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

  const now = new Date();
  const ym  = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const { income, expenses, monthTxns } = useMemo(() => {
    const monthTxns = txns.filter(t => t.date.startsWith(ym));
    const income    = monthTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expenses  = monthTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { income, expenses, monthTxns };
  }, [txns, ym]);

  const savings  = income - expenses;
  const savingsRate = income > 0 ? Math.round(((income - expenses) / income) * 100) : 0;
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const forecast = now.getDate() > 0 ? (expenses / now.getDate()) * daysInMonth : 0;

  const sparkData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (6 - i));
      const key = d.toISOString().slice(0, 10);
      return txns.filter(t => t.type === 'expense' && t.date === key).reduce((s, t) => s + t.amount, 0);
    });
  }, [txns]);

  const animatedSavings = useCountUp(savings);

  const allCats = useMemo(
    () => Object.fromEntries([...EXPENSE_CATS, ...INCOME_CATS, ...customCats].map(c => [c.id, c])),
    [customCats],
  );

  const recent = [...txns].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);

  const styles = useMemo(() => makeStyles(colors), [colors]);

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

      {/* Hero savings card — glass + ambient glow */}
      <Animated.View style={[styles.heroOuter, animStyle]}>
        <View style={styles.glowBlobPurple} />
        <View style={styles.glowBlobGreen} />
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View>
              <Text style={styles.heroLabel}>Net Savings</Text>
              <Text style={styles.heroSubLabel}>This month</Text>
            </View>
            <View style={styles.sparkBox}>
              <Text style={styles.sparkLabel}>7-day spend</Text>
              <SparklineChart data={sparkData} barColor={savings >= 0 ? colors.green : colors.red} />
            </View>
          </View>
          <Text style={[styles.heroAmount, { color: savings >= 0 ? colors.green : colors.red }]}>
            {fmtFull(Math.round(animatedSavings))}
          </Text>
          <View style={styles.heroRow}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatLabel}>↑  Income</Text>
              <Text style={[styles.heroStatVal, { color: colors.green }]}>{fmtFull(income)}</Text>
            </View>
            <View style={styles.heroDiv} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatLabel}>↓  Expenses</Text>
              <Text style={[styles.heroStatVal, { color: colors.red }]}>{fmtFull(expenses)}</Text>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* 3-tile bento grid */}
      <Animated.View style={[styles.bento, animStyle]}>
        {[
          { label: 'Income', value: fmt(income),       color: colors.green,  bg: 'rgba(46,209,138,0.07)',   border: 'rgba(46,209,138,0.2)'   },
          { label: 'Spent',  value: fmt(expenses),     color: colors.red,    bg: 'rgba(240,80,96,0.07)',    border: 'rgba(240,80,96,0.2)'    },
          { label: 'Rate',   value: `${savingsRate}%`, color: colors.purple, bg: 'rgba(159,110,255,0.07)',  border: 'rgba(159,110,255,0.2)'  },
        ].map(t => (
          <View key={t.label} style={[styles.bentoTile, { backgroundColor: t.bg, borderColor: t.border }]}>
            <Text style={styles.tileLabel}>{t.label}</Text>
            <Text style={[styles.tileValue, { color: t.color }]}>{t.value}</Text>
          </View>
        ))}
      </Animated.View>

      <View style={styles.forecastRow}>
        <Text style={styles.forecastLabel}>Spending forecast this month</Text>
        <Text style={styles.forecastValue}>{fmtFull(forecast)}</Text>
      </View>

      {alerts.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <View style={[styles.sectionAccent, { backgroundColor: colors.red }]} />
            <Text style={styles.sectionTitle}>Budget Alerts</Text>
          </View>
          {alerts.map(({ cat, spent, limit, over }) => (
            <View key={cat.id} style={styles.alertCard}>
              <CategoryBar label={cat.label} color={over ? colors.red : colors.yellow}
                spent={spent} budget={limit} showBudget />
              <View style={[styles.badge, { backgroundColor: over ? colors.redDim : colors.accentDim }]}>
                <Text style={[styles.badgeText, { color: over ? colors.red : colors.accent }]}>
                  {over ? '● Over budget' : '▲ Warning'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <View style={[styles.sectionAccent, { backgroundColor: colors.accent }]} />
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
        </View>
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

function makeStyles(colors: Colors) { return StyleSheet.create({
  root:            { flex: 1, backgroundColor: colors.bg },
  content:         { padding: spacing.md, paddingBottom: spacing.md },
  greeting:        { fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.accent, marginBottom: 2 },
  heading:         { fontSize: 24, fontFamily: 'PlusJakartaSans_800ExtraBold', color: colors.text, marginBottom: spacing.md },
  // Hero card — glass + glow
  heroOuter:       { position: 'relative', marginBottom: spacing.sm },
  glowBlobPurple:  { position: 'absolute', top: -30, right: -20, width: 160, height: 160,
                     backgroundColor: colors.glowPurple, borderRadius: 80 },
  glowBlobGreen:   { position: 'absolute', bottom: -10, left: 10, width: 100, height: 100,
                     backgroundColor: colors.glowGreen, borderRadius: 50 },
  heroCard:        { backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.glassBorder,
                     borderRadius: radius.xl, padding: spacing.lg, overflow: 'hidden' },
  heroHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xs },
  heroLabel:       { fontSize: 10, color: colors.muted, textTransform: 'uppercase',
                     letterSpacing: 1.5, fontFamily: 'PlusJakartaSans_600SemiBold', marginBottom: 4 },
  heroSubLabel:    { fontSize: 11, fontFamily: 'PlusJakartaSans_400Regular', color: 'rgba(255,255,255,0.38)', marginTop: 2 },
  sparkBox:        { alignItems: 'flex-end' },
  sparkLabel:      { fontSize: 10, fontFamily: 'PlusJakartaSans_400Regular', color: 'rgba(255,255,255,0.35)', marginBottom: 4 },
  heroAmount:      { fontSize: 38, fontFamily: 'PlusJakartaSans_800ExtraBold', marginBottom: spacing.md, letterSpacing: -1 },
  heroTrend:       { fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', marginTop: 4 },
  heroRow:         { flexDirection: 'row', alignItems: 'center' },
  heroStat:        { flex: 1 },
  heroStatLabel:   { fontSize: 11, fontFamily: 'PlusJakartaSans_400Regular', color: 'rgba(255,255,255,0.45)', marginBottom: 3 },
  heroStatVal:     { fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold' },
  heroDiv:         { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.12)', marginHorizontal: spacing.md },
  // Bento grid
  bento:           { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  bentoTile:       { flex: 1, borderWidth: 1, borderRadius: radius.lg, padding: spacing.sm },
  tileLabel:       { fontSize: 9, color: colors.muted, textTransform: 'uppercase',
                     letterSpacing: 1, fontFamily: 'PlusJakartaSans_600SemiBold', marginBottom: 4 },
  tileValue:       { fontSize: 15, fontFamily: 'PlusJakartaSans_800ExtraBold' },
  forecastRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                     backgroundColor: colors.glass, borderRadius: radius.md, borderWidth: 1,
                     borderColor: colors.glassBorder, padding: spacing.md, marginBottom: spacing.md },
  forecastLabel:   { fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', color: colors.muted },
  forecastValue:   { fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', color: colors.accent },
  section:         { marginBottom: spacing.md },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, gap: spacing.xs },
  sectionAccent:   { width: 3, height: 16, borderRadius: 2 },
  sectionTitle:    { fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold', color: colors.muted,
                     textTransform: 'uppercase', letterSpacing: 0.8 },
  alertCard:       { backgroundColor: colors.glass, borderRadius: radius.md, borderWidth: 1,
                     borderColor: colors.glassBorder, padding: spacing.sm, marginBottom: spacing.xs },
  badge:           { alignSelf: 'flex-start', borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3, marginTop: 4 },
  badgeText:       { fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', letterSpacing: 0.3 },
  txnRow:          { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.glass,
                     borderRadius: radius.md, borderWidth: 1, borderColor: colors.glassBorder,
                     paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginBottom: spacing.xs },
  catDot:          { width: 8, height: 8, borderRadius: 4, marginRight: spacing.sm },
  txnLeft:         { flex: 1 },
  txnDesc:         { fontSize: 14, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.text },
  txnMeta:         { fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', color: colors.muted, marginTop: 2 },
  txnRight:        { alignItems: 'flex-end' },
  txnAmt:          { fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold' },
  txnActions:      { flexDirection: 'row', marginTop: 2 },
  iconBtn:         { padding: 4 },
  empty:           { color: colors.muted, fontFamily: 'PlusJakartaSans_400Regular', textAlign: 'center', marginTop: spacing.md },
}); }

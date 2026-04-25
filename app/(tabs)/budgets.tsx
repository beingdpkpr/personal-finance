import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useFinance } from '../../hooks/FinanceContext';
import CategoryBar from '../../components/CategoryBar';
import { colors, spacing, radius } from '../../constants/theme';
import { fmt, fmtFull } from '../../lib/format';
import { resolveLimit, BudgetMap } from '../../lib/data';
import { EXPENSE_CATS } from '../../constants/categories';

export default function BudgetsScreen() {
  const { txns, budgets, setBudgets, currency } = useFinance();
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft]     = useState('');
  const [draftMode, setDraftMode] = useState<'fixed' | 'pct'>('fixed');

  const now = new Date();
  const ym  = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const monthIncome = useMemo(() =>
    txns.filter(t => t.type === 'income' && t.date.startsWith(ym))
        .reduce((s, t) => s + t.amount, 0),
    [txns, ym]);

  const catData = useMemo(() => EXPENSE_CATS.map(cat => ({
    cat,
    spent: txns.filter(t => t.type === 'expense' && t.category === cat.id && t.date.startsWith(ym))
               .reduce((s, t) => s + t.amount, 0),
    limit: resolveLimit(budgets[cat.id], monthIncome) || null,
  })), [txns, budgets, monthIncome, ym]);

  const totalBudgeted = catData.reduce((s, { limit }) => s + (limit ?? 0), 0);
  const totalSpent    = catData.reduce((s, { spent }) => s + spent, 0);
  const overCount     = catData.filter(({ spent, limit }) => limit !== null && spent > limit).length;

  function startEdit(catId: string) {
    const entry = budgets[catId];
    setDraftMode(entry?.mode ?? 'fixed');
    setDraft(entry ? String(entry.value) : '');
    setEditing(catId);
  }

  function saveEdit(catId: string) {
    const val = parseFloat(draft);
    if (!isNaN(val) && val > 0) {
      setBudgets({ ...budgets, [catId]: { mode: draftMode, value: val } } as BudgetMap);
    } else {
      const next = { ...budgets };
      delete next[catId];
      setBudgets(next);
    }
    setEditing(null);
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Budget Planner</Text>
      <Text style={styles.income}>Monthly income: <Text style={styles.incomeVal}>{fmtFull(monthIncome)}</Text></Text>

      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Budgeted</Text>
          <Text style={styles.summaryVal}>{fmt(totalBudgeted)}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Spent</Text>
          <Text style={[styles.summaryVal, { color: totalSpent > totalBudgeted ? colors.red : colors.text }]}>
            {fmt(totalSpent)}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Over Budget</Text>
          <Text style={[styles.summaryVal, { color: overCount > 0 ? colors.red : colors.green }]}>{overCount}</Text>
        </View>
      </View>

      {catData.map(({ cat, spent, limit }) => (
        <View key={cat.id} style={styles.catCard}>
          <View style={styles.catHeader}>
            <View style={[styles.catDot, { backgroundColor: cat.color }]} />
            <Text style={styles.catName}>{cat.label}</Text>
            <Pressable onPress={() => startEdit(cat.id)} style={styles.editBtn}>
              <Text style={styles.editBtnText}>{limit ? 'Edit' : 'Set'}</Text>
            </Pressable>
          </View>

          {editing === cat.id ? (
            <View style={styles.editRow}>
              <Pressable onPress={() => setDraftMode(draftMode === 'fixed' ? 'pct' : 'fixed')} style={styles.modeBtn}>
                <Text style={styles.modeBtnText}>{draftMode === 'fixed' ? currency.symbol : '%'}</Text>
              </Pressable>
              <TextInput
                style={styles.editInput}
                keyboardType="numeric"
                value={draft}
                onChangeText={setDraft}
                placeholder={draftMode === 'fixed' ? 'Amount' : 'Percent'}
                placeholderTextColor={colors.muted}
                autoFocus
              />
              <Pressable onPress={() => saveEdit(cat.id)} style={styles.saveBtn}>
                <Text style={styles.saveBtnText}>Save</Text>
              </Pressable>
              <Pressable onPress={() => setEditing(null)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
            </View>
          ) : (
            <CategoryBar label="" color={cat.color} spent={spent} budget={limit ?? undefined} showBudget />
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: colors.bg },
  content:       { padding: spacing.md, paddingBottom: spacing.xl * 2 },
  heading:       { fontSize: 22, fontFamily: 'PlusJakartaSans_800ExtraBold', color: colors.text, marginBottom: spacing.xs },
  income:        { fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', color: colors.muted, marginBottom: spacing.md },
  incomeVal:     { color: colors.green, fontFamily: 'PlusJakartaSans_600SemiBold' },
  summary:       { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.lg,
                   borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.md, gap: spacing.md },
  summaryItem:   { flex: 1, alignItems: 'center' },
  summaryLabel:  { fontSize: 11, fontFamily: 'PlusJakartaSans_400Regular', color: colors.muted, marginBottom: 4 },
  summaryVal:    { fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold', color: colors.text },
  catCard:       { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1,
                   borderColor: colors.border, padding: spacing.md, marginBottom: spacing.sm },
  catHeader:     { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  catDot:        { width: 10, height: 10, borderRadius: 5, marginRight: spacing.sm },
  catName:       { flex: 1, fontSize: 14, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.text },
  editBtn:       { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.sm, backgroundColor: colors.accentDim },
  editBtnText:   { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.accent },
  editRow:       { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  modeBtn:       { width: 36, height: 36, borderRadius: radius.sm, backgroundColor: colors.surface2,
                   alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  modeBtnText:   { fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: colors.accent },
  editInput:     { flex: 1, backgroundColor: colors.surface2, borderRadius: radius.sm, borderWidth: 1,
                   borderColor: colors.border, color: colors.text, padding: spacing.sm, fontSize: 14,
                   fontFamily: 'PlusJakartaSans_400Regular' },
  saveBtn:       { paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.sm, backgroundColor: colors.accent },
  saveBtnText:   { fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', color: '#fff' },
  cancelBtn:     { paddingHorizontal: spacing.sm, paddingVertical: 8 },
  cancelBtnText: { fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', color: colors.muted },
});

import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Modal } from 'react-native';
import { useFinance } from '../../hooks/FinanceContext';
import CategoryBar from '../../components/CategoryBar';
import { spacing, radius, Colors } from '../../constants/theme';
import { useColors } from '../../hooks/ThemeContext';
import { fmt, fmtFull } from '../../lib/format';
import {
  resolveLimit, BudgetMap,
  SPEND_TYPES, DEFAULT_SPEND_MAP, SpendType, SpendTypeMap,
  CustomCategory, nextCatColor, uid,
} from '../../lib/data';
import { EXPENSE_CATS, INCOME_CATS } from '../../constants/categories';

export default function PlannerScreen() {
  const colors = useColors();
  const { txns, budgets, setBudgets, currency, spendTypeMap, setSpendTypeMap, customCats, setCustomCats } = useFinance();

  const styles = useMemo(() => makeStyles(colors), [colors]);

  const now = new Date();
  const ym  = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const monthIncome = useMemo(() =>
    txns.filter(t => t.type === 'income' && t.date.startsWith(ym)).reduce((s, t) => s + t.amount, 0),
    [txns, ym]);

  const effectiveMap: SpendTypeMap = useMemo(() => ({
    ...DEFAULT_SPEND_MAP,
    ...spendTypeMap,
    ...Object.fromEntries(customCats.filter(c => c.txnType === 'expense').map(c => [c.id, spendTypeMap[c.id] ?? 'wants'])),
  }), [spendTypeMap, customCats]);

  // Budget inline editing
  const [editing, setEditing]     = useState<string | null>(null);
  const [draft, setDraft]         = useState('');
  const [draftMode, setDraftMode] = useState<'fixed' | 'pct'>('fixed');

  // Reassign custom category modal
  const [pickedCat, setPickedCat] = useState<string | null>(null);

  // Add custom category modal
  const [addForBucket, setAddForBucket] = useState<SpendType | 'income' | null>(null);
  const [newCatName, setNewCatName]     = useState('');

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

  function reassign(catId: string, type: SpendType) {
    setSpendTypeMap({ ...effectiveMap, [catId]: type });
    setPickedCat(null);
  }

  function deleteCustomCat(id: string) {
    setCustomCats(customCats.filter(c => c.id !== id));
  }

  function addCategory() {
    const label = newCatName.trim();
    if (!label || !addForBucket) return;
    const txnType = addForBucket === 'income' ? 'income' : 'expense';
    const newCat: CustomCategory = { id: uid(), label, color: nextCatColor(customCats), txnType };
    setCustomCats([...customCats, newCat]);
    if (txnType === 'expense') {
      setSpendTypeMap({ ...effectiveMap, [newCat.id]: addForBucket as SpendType });
    }
    setNewCatName('');
    setAddForBucket(null);
  }

  const spendTotals = useMemo(() => {
    const totals: Record<SpendType, number> = { essentials: 0, wants: 0, investments: 0, family: 0 };
    for (const t of txns) {
      if (t.type !== 'expense' || !t.date.startsWith(ym)) continue;
      totals[effectiveMap[t.category] ?? 'wants'] += t.amount;
    }
    return totals;
  }, [txns, ym, effectiveMap]);

  const totalExpenses = Object.values(spendTotals).reduce((s, v) => s + v, 0);

  const catData = useMemo(() => EXPENSE_CATS.map(cat => ({
    cat,
    spent: txns.filter(t => t.type === 'expense' && t.category === cat.id && t.date.startsWith(ym))
               .reduce((s, t) => s + t.amount, 0),
    limit: resolveLimit(budgets[cat.id], monthIncome) || null,
  })), [txns, budgets, monthIncome, ym]);

  const totalBudgeted = catData.reduce((s, { limit }) => s + (limit ?? 0), 0);
  const totalSpent    = catData.reduce((s, { spent }) => s + spent, 0);
  const overCount     = catData.filter(({ spent, limit }) => limit !== null && spent > limit).length;

  const customExpCats = useMemo(() =>
    customCats.filter(c => c.txnType === 'expense'), [customCats]);

  const incomeCats = useMemo(() => [
    ...INCOME_CATS.map(c => ({ ...c, isCustom: false })),
    ...customCats.filter(c => c.txnType === 'income').map(c => ({ ...c, isCustom: true })),
  ], [customCats]);

  const pickedCatLabel = customExpCats.find(c => c.id === pickedCat)?.label;

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Budget Planner</Text>
      <Text style={styles.income}>
        Monthly income: <Text style={styles.incomeVal}>{fmtFull(monthIncome)}</Text>
      </Text>

      {/* Summary */}
      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Budgeted</Text>
          <Text style={styles.summaryVal}>{fmt(totalBudgeted)}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Spent</Text>
          <Text style={[styles.summaryVal, { color: totalSpent > totalBudgeted ? colors.red : colors.text }]}>
            {fmt(totalSpent)}
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Over Budget</Text>
          <Text style={[styles.summaryVal, { color: overCount > 0 ? colors.red : colors.green }]}>
            {overCount}
          </Text>
        </View>
      </View>

      {/* Spend type buckets */}
      {SPEND_TYPES.map(st => {
        const mainCats   = catData.filter(({ cat }) => effectiveMap[cat.id] === st.id);
        const customInBucket = customExpCats.filter(c => effectiveMap[c.id] === st.id);
        const total = spendTotals[st.id];
        const pct   = totalExpenses > 0 ? Math.round((total / totalExpenses) * 100) : 0;

        return (
          <View key={st.id} style={[styles.bucket, { borderColor: st.color + '44' }]}>
            {/* Bucket header */}
            <View style={styles.bucketHeader}>
              <View style={[styles.bucketDot, { backgroundColor: st.color }]} />
              <Text style={styles.bucketLabel}>{st.label}</Text>
              <View style={{ flex: 1 }} />
              <Text style={[styles.bucketAmt, { color: st.color }]}>{fmt(total)}</Text>
              <Text style={styles.bucketPct}>{pct}%</Text>
            </View>

            {/* Bucket progress bar */}
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${pct}%` as any, backgroundColor: st.color }]} />
            </View>

            {/* Main categories with budget editing */}
            {mainCats.map(({ cat, spent, limit }) => (
              <View key={cat.id} style={styles.catCard}>
                <View style={styles.catCardTop}>
                  <View style={[styles.catDot, { backgroundColor: cat.color }]} />
                  <Text style={styles.catName}>{cat.label}</Text>
                  <Pressable onPress={() => startEdit(cat.id)} style={styles.editBtn}>
                    <Text style={styles.editBtnText}>{limit ? 'Edit' : 'Set limit'}</Text>
                  </Pressable>
                </View>

                {editing === cat.id ? (
                  <View style={styles.editRow}>
                    <Pressable onPress={() => setDraftMode(draftMode === 'fixed' ? 'pct' : 'fixed')}
                      style={styles.modeBtn}>
                      <Text style={styles.modeBtnText}>{draftMode === 'fixed' ? currency.symbol : '%'}</Text>
                    </Pressable>
                    <TextInput
                      style={styles.editInput}
                      keyboardType="numeric"
                      value={draft}
                      onChangeText={setDraft}
                      placeholder={draftMode === 'fixed' ? 'Amount' : '% of income'}
                      placeholderTextColor={colors.muted}
                      autoFocus
                    />
                    <Pressable onPress={() => saveEdit(cat.id)} style={styles.saveBtn}>
                      <Text style={styles.saveBtnText}>Save</Text>
                    </Pressable>
                    <Pressable onPress={() => setEditing(null)} style={styles.cancelBtn}>
                      <Text style={styles.cancelBtnText}>✕</Text>
                    </Pressable>
                  </View>
                ) : (
                  <CategoryBar label="" color={cat.color} spent={spent} budget={limit ?? undefined} showBudget />
                )}
              </View>
            ))}

            {/* Custom category chips */}
            {customInBucket.length > 0 && (
              <View style={styles.chipRow}>
                {customInBucket.map(c => (
                  <View key={c.id} style={[styles.chip, { borderColor: c.color + '88', backgroundColor: c.color + '18' }]}>
                    <Pressable onPress={() => setPickedCat(c.id)}>
                      <Text style={[styles.chipText, { color: c.color }]}>{c.label}</Text>
                    </Pressable>
                    <Pressable onPress={() => deleteCustomCat(c.id)} style={styles.chipDel} hitSlop={8}>
                      <Text style={[styles.chipDelText, { color: c.color }]}>×</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            <Pressable onPress={() => { setAddForBucket(st.id); setNewCatName(''); }}
              style={styles.addChip}>
              <Text style={styles.addChipText}>+ Add category</Text>
            </Pressable>
          </View>
        );
      })}

      {/* Income categories */}
      <View style={[styles.bucket, { borderColor: colors.green + '44' }]}>
        <View style={styles.bucketHeader}>
          <View style={[styles.bucketDot, { backgroundColor: colors.green }]} />
          <Text style={styles.bucketLabel}>Income Categories</Text>
        </View>
        <View style={styles.chipRow}>
          {incomeCats.map(c => (
            <View key={c.id} style={[styles.chip, { borderColor: c.color + '88', backgroundColor: c.color + '18' }]}>
              <Text style={[styles.chipText, { color: c.color }]}>{c.label}</Text>
              {c.isCustom && (
                <Pressable onPress={() => deleteCustomCat(c.id)} style={styles.chipDel} hitSlop={8}>
                  <Text style={[styles.chipDelText, { color: c.color }]}>×</Text>
                </Pressable>
              )}
            </View>
          ))}
          <Pressable onPress={() => { setAddForBucket('income'); setNewCatName(''); }}
            style={styles.addChip}>
            <Text style={styles.addChipText}>+ Add</Text>
          </Pressable>
        </View>
      </View>

      {/* Reassign custom cat modal */}
      <Modal visible={!!pickedCat} transparent animationType="fade" onRequestClose={() => setPickedCat(null)}>
        <Pressable style={styles.overlay} onPress={() => setPickedCat(null)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Move "{pickedCatLabel}" to…</Text>
            {SPEND_TYPES.map(st => (
              <Pressable key={st.id} onPress={() => reassign(pickedCat!, st.id)}
                style={[styles.modalRow, effectiveMap[pickedCat!] === st.id && { backgroundColor: st.color + '22' }]}>
                <View style={[styles.bucketDot, { backgroundColor: st.color }]} />
                <Text style={[styles.modalRowText, effectiveMap[pickedCat!] === st.id && { color: st.color }]}>
                  {st.label}
                </Text>
                {effectiveMap[pickedCat!] === st.id && (
                  <Text style={[styles.modalCheck, { color: st.color }]}>✓</Text>
                )}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* Add category modal */}
      <Modal visible={!!addForBucket} transparent animationType="fade" onRequestClose={() => setAddForBucket(null)}>
        <Pressable style={styles.overlay} onPress={() => setAddForBucket(null)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>
              New {addForBucket === 'income' ? 'income' : SPEND_TYPES.find(s => s.id === addForBucket)?.label} category
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Category name"
              placeholderTextColor={colors.muted}
              value={newCatName}
              onChangeText={setNewCatName}
              autoFocus
              onSubmitEditing={addCategory}
            />
            <View style={styles.modalActions}>
              <Pressable onPress={() => setAddForBucket(null)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={addCategory} style={styles.saveBtn}>
                <Text style={styles.saveBtnText}>Add</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

function makeStyles(colors: Colors) { return StyleSheet.create({
  root:          { flex: 1, backgroundColor: colors.bg },
  content:       { padding: spacing.md, paddingBottom: spacing.xl * 2, gap: spacing.md },
  heading:       { fontSize: 22, fontFamily: 'PlusJakartaSans_800ExtraBold', color: colors.text },
  income:        { fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', color: colors.muted, marginTop: -spacing.sm },
  incomeVal:     { color: colors.green, fontFamily: 'PlusJakartaSans_600SemiBold' },
  summary:       { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.lg,
                   borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  summaryItem:   { flex: 1, alignItems: 'center' },
  summaryDivider:{ width: 1, backgroundColor: colors.border },
  summaryLabel:  { fontSize: 11, fontFamily: 'PlusJakartaSans_400Regular', color: colors.muted, marginBottom: 4 },
  summaryVal:    { fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold', color: colors.text },
  bucket:        { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1,
                   padding: spacing.md, gap: spacing.sm },
  bucketHeader:  { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  bucketDot:     { width: 10, height: 10, borderRadius: 5 },
  bucketLabel:   { fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', color: colors.text },
  bucketAmt:     { fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold' },
  bucketPct:     { fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', color: colors.muted,
                   marginLeft: spacing.xs, minWidth: 32, textAlign: 'right' },
  barTrack:      { height: 4, backgroundColor: colors.surface2, borderRadius: 2, overflow: 'hidden' },
  barFill:       { height: 4, borderRadius: 2 },
  catCard:       { backgroundColor: colors.surface2, borderRadius: radius.md, borderWidth: 1,
                   borderColor: colors.border, padding: spacing.sm, gap: 6 },
  catCardTop:    { flexDirection: 'row', alignItems: 'center' },
  catDot:        { width: 8, height: 8, borderRadius: 4, marginRight: spacing.sm },
  catName:       { flex: 1, fontSize: 14, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.text },
  editBtn:       { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.sm,
                   backgroundColor: colors.accentDim },
  editBtnText:   { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.accent },
  editRow:       { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  modeBtn:       { width: 36, height: 36, borderRadius: radius.sm, backgroundColor: colors.surface,
                   alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  modeBtnText:   { fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: colors.accent },
  editInput:     { flex: 1, backgroundColor: colors.surface, borderRadius: radius.sm, borderWidth: 1,
                   borderColor: colors.border, color: colors.text, padding: spacing.sm, fontSize: 14,
                   fontFamily: 'PlusJakartaSans_400Regular' },
  saveBtn:       { paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.sm,
                   backgroundColor: colors.accent },
  saveBtnText:   { fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', color: '#fff' },
  cancelBtn:     { paddingHorizontal: spacing.sm, paddingVertical: 8 },
  cancelBtnText: { fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', color: colors.muted },
  chipRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm,
                   paddingVertical: 5, borderRadius: radius.sm, borderWidth: 1, gap: 4 },
  chipText:      { fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular' },
  chipDel:       { marginLeft: 2 },
  chipDelText:   { fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', lineHeight: 16 },
  addChip:       { paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radius.sm,
                   borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed', alignSelf: 'flex-start' },
  addChipText:   { fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', color: colors.muted },
  overlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center',
                   alignItems: 'center', padding: spacing.lg },
  modalCard:     { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg,
                   width: '100%', maxWidth: 360, gap: spacing.sm, borderWidth: 1, borderColor: colors.border },
  modalTitle:    { fontSize: 15, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.text,
                   marginBottom: spacing.xs },
  modalRow:      { flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
                   padding: spacing.sm, borderRadius: radius.md },
  modalRowText:  { flex: 1, fontSize: 14, fontFamily: 'PlusJakartaSans_400Regular', color: colors.text },
  modalCheck:    { fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold' },
  modalInput:    { backgroundColor: colors.surface2, borderRadius: radius.md, borderWidth: 1,
                   borderColor: colors.border, color: colors.text, padding: spacing.sm,
                   fontSize: 14, fontFamily: 'PlusJakartaSans_400Regular' },
  modalActions:  { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm },
}); }

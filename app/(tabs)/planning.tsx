import React, { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, Modal, TextInput,
} from 'react-native';
import { useFinance } from '../../hooks/FinanceContext';
import { colors, spacing, radius } from '../../constants/theme';
import { EXPENSE_CATS, INCOME_CATS } from '../../constants/categories';
import {
  SPEND_TYPES, DEFAULT_SPEND_MAP, SpendType, SpendTypeMap,
  CustomCategory, nextCatColor, uid,
} from '../../lib/data';
import { fmt } from '../../lib/format';

export default function PlanningScreen() {
  const { txns, spendTypeMap, setSpendTypeMap, currency, customCats, setCustomCats } = useFinance();

  const effectiveMap: SpendTypeMap = useMemo(() => ({
    ...DEFAULT_SPEND_MAP,
    ...spendTypeMap,
    // custom cats carry their spend type in the map
    ...Object.fromEntries(customCats.filter(c => c.txnType === 'expense').map(c => [c.id, spendTypeMap[c.id] ?? 'wants'])),
  }), [spendTypeMap, customCats]);

  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const spendTotals = useMemo(() => {
    const totals: Record<SpendType, number> = { essentials: 0, wants: 0, investments: 0, family: 0 };
    for (const t of txns) {
      if (t.type !== 'expense') continue;
      if (!t.date.startsWith(monthKey)) continue;
      const bucket = effectiveMap[t.category] ?? 'wants';
      totals[bucket] += t.amount;
    }
    return totals;
  }, [txns, monthKey, effectiveMap]);

  const totalExpenses = Object.values(spendTotals).reduce((s, v) => s + v, 0);

  // Reassign modal
  const [pickedCat, setPickedCat] = useState<string | null>(null);
  // Add category modal
  const [addForBucket, setAddForBucket]     = useState<SpendType | 'income' | null>(null);
  const [newCatName, setNewCatName]         = useState('');

  function reassign(catId: string, type: SpendType) {
    setSpendTypeMap({ ...effectiveMap, [catId]: type });
    setPickedCat(null);
  }

  function deleteCustomCat(id: string) {
    setCustomCats(customCats.filter(c => c.id !== id));
    setPickedCat(null);
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

  const allCats = useMemo(() => [
    ...EXPENSE_CATS.map(c => ({ ...c, isCustom: false })),
    ...customCats.filter(c => c.txnType === 'expense').map(c => ({ ...c, isCustom: true })),
  ], [customCats]);

  const incomeCats = useMemo(() => [
    ...INCOME_CATS.map(c => ({ ...c, isCustom: false })),
    ...customCats.filter(c => c.txnType === 'income').map(c => ({ ...c, isCustom: true })),
  ], [customCats]);

  const pickedCatLabel = allCats.find(c => c.id === pickedCat)?.label
    ?? incomeCats.find(c => c.id === pickedCat)?.label;

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Planning</Text>
      <Text style={styles.sub}>Organise categories into spend types and track where your money goes.</Text>

      {/* Expense spend type buckets */}
      {SPEND_TYPES.map(st => {
        const cats = allCats.filter(c => effectiveMap[c.id] === st.id);
        const total = spendTotals[st.id];
        const pct = totalExpenses > 0 ? Math.round((total / totalExpenses) * 100) : 0;
        return (
          <View key={st.id} style={[styles.bucket, { borderColor: st.color + '55' }]}>
            <View style={styles.bucketHeader}>
              <View style={[styles.bucketDot, { backgroundColor: st.color }]} />
              <Text style={styles.bucketLabel}>{st.label}</Text>
              <View style={{ flex: 1 }} />
              <Text style={[styles.bucketAmt, { color: st.color }]}>{fmt(total)}</Text>
              <Text style={styles.bucketPct}>{pct}%</Text>
            </View>

            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${pct}%` as any, backgroundColor: st.color }]} />
            </View>

            <View style={styles.chipRow}>
              {cats.map(c => (
                <Pressable key={c.id} onPress={() => setPickedCat(c.id)}
                  style={[styles.chip, { borderColor: c.color + '88', backgroundColor: c.color + '18' }]}>
                  <Text style={[styles.chipText, { color: c.color }]}>{c.label}</Text>
                  {c.isCustom && (
                    <Pressable onPress={() => deleteCustomCat(c.id)} style={styles.chipDel} hitSlop={8}>
                      <Text style={[styles.chipDelText, { color: c.color }]}>×</Text>
                    </Pressable>
                  )}
                </Pressable>
              ))}
              <Pressable onPress={() => { setAddForBucket(st.id); setNewCatName(''); }}
                style={styles.addChip}>
                <Text style={styles.addChipText}>+ Add</Text>
              </Pressable>
            </View>
          </View>
        );
      })}

      {/* Income categories */}
      <View style={[styles.bucket, { borderColor: colors.green + '55' }]}>
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

      <Text style={styles.hint}>Tap an expense category to move it · × to delete custom categories</Text>

      {/* Reassign modal */}
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
              style={styles.input}
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

const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: colors.bg },
  content:       { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl * 2 },
  heading:       { fontSize: 22, fontFamily: 'PlusJakartaSans_800ExtraBold', color: colors.text },
  sub:           { fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', color: colors.muted, marginTop: -spacing.sm },
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
  chipRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm,
                   paddingVertical: 5, borderRadius: radius.sm, borderWidth: 1, gap: 4 },
  chipText:      { fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular' },
  chipDel:       { marginLeft: 2 },
  chipDelText:   { fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', lineHeight: 16 },
  addChip:       { paddingHorizontal: spacing.sm, paddingVertical: 5, borderRadius: radius.sm,
                   borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed' },
  addChipText:   { fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', color: colors.muted },
  hint:          { fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', color: colors.muted,
                   textAlign: 'center' },
  overlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center',
                   alignItems: 'center', padding: spacing.lg },
  modalCard:     { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg,
                   width: '100%', maxWidth: 360, gap: spacing.sm,
                   borderWidth: 1, borderColor: colors.border },
  modalTitle:    { fontSize: 15, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.text,
                   marginBottom: spacing.xs },
  modalRow:      { flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
                   padding: spacing.sm, borderRadius: radius.md },
  modalRowText:  { flex: 1, fontSize: 14, fontFamily: 'PlusJakartaSans_400Regular', color: colors.text },
  modalCheck:    { fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold' },
  input:         { backgroundColor: colors.surface2, borderRadius: radius.md, borderWidth: 1,
                   borderColor: colors.border, color: colors.text, padding: spacing.sm,
                   fontSize: 14, fontFamily: 'PlusJakartaSans_400Regular' },
  modalActions:  { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm },
  cancelBtn:     { paddingHorizontal: spacing.md, paddingVertical: 10 },
  cancelBtnText: { fontSize: 14, fontFamily: 'PlusJakartaSans_400Regular', color: colors.muted },
  saveBtn:       { paddingHorizontal: spacing.lg, paddingVertical: 10, borderRadius: radius.md, backgroundColor: colors.accent },
  saveBtnText:   { fontSize: 14, fontFamily: 'PlusJakartaSans_600SemiBold', color: '#fff' },
});

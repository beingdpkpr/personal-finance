import React, { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, Modal,
} from 'react-native';
import { useFinance } from '../../hooks/FinanceContext';
import { colors, spacing, radius } from '../../constants/theme';
import { EXPENSE_CATS } from '../../constants/categories';
import { SPEND_TYPES, DEFAULT_SPEND_MAP, SpendType, SpendTypeMap } from '../../lib/data';
import { fmt } from '../../lib/format';

export default function PlanningScreen() {
  const { txns, spendTypeMap, setSpendTypeMap, currency } = useFinance();

  // Merge default map with user overrides
  const effectiveMap: SpendTypeMap = useMemo(() => ({
    ...DEFAULT_SPEND_MAP,
    ...spendTypeMap,
  }), [spendTypeMap]);

  // Current month spending per spend type
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

  // Category reassignment modal
  const [pickedCat, setPickedCat] = useState<string | null>(null);

  function reassign(catId: string, type: SpendType) {
    setSpendTypeMap({ ...effectiveMap, [catId]: type });
    setPickedCat(null);
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Planning</Text>
      <Text style={styles.sub}>Map categories to spend types and see where your money goes.</Text>

      {/* Spend type buckets */}
      {SPEND_TYPES.map(st => {
        const cats = EXPENSE_CATS.filter(c => effectiveMap[c.id] === st.id);
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

            {/* Progress bar */}
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${pct}%` as any, backgroundColor: st.color }]} />
            </View>

            {/* Category chips */}
            <View style={styles.chipRow}>
              {cats.map(c => (
                <Pressable key={c.id} onPress={() => setPickedCat(c.id)}
                  style={[styles.chip, { borderColor: c.color + '88', backgroundColor: c.color + '18' }]}>
                  <Text style={[styles.chipText, { color: c.color }]}>{c.label}</Text>
                </Pressable>
              ))}
              {cats.length === 0 && (
                <Text style={styles.noCats}>No categories assigned</Text>
              )}
            </View>
          </View>
        );
      })}

      <Text style={styles.hint}>Tap a category chip to move it to a different spend type.</Text>

      {/* Reassign modal */}
      <Modal visible={!!pickedCat} transparent animationType="fade" onRequestClose={() => setPickedCat(null)}>
        <Pressable style={styles.overlay} onPress={() => setPickedCat(null)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              Move "{EXPENSE_CATS.find(c => c.id === pickedCat)?.label}" to…
            </Text>
            {SPEND_TYPES.map(st => (
              <Pressable key={st.id} onPress={() => reassign(pickedCat!, st.id)}
                style={[styles.modalRow, effectiveMap[pickedCat!] === st.id && { backgroundColor: st.color + '22' }]}>
                <View style={[styles.bucketDot, { backgroundColor: st.color }]} />
                <Text style={[styles.modalRowText,
                  effectiveMap[pickedCat!] === st.id && { color: st.color }]}>
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
  chip:          { paddingHorizontal: spacing.sm, paddingVertical: 5, borderRadius: radius.sm, borderWidth: 1 },
  chipText:      { fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular' },
  noCats:        { fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', color: colors.muted },
  hint:          { fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', color: colors.muted,
                   textAlign: 'center' },
  overlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center',
                   alignItems: 'center', padding: spacing.lg },
  modalCard:     { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg,
                   width: '100%', maxWidth: 360, gap: spacing.xs,
                   borderWidth: 1, borderColor: colors.border },
  modalTitle:    { fontSize: 15, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.text,
                   marginBottom: spacing.sm },
  modalRow:      { flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
                   padding: spacing.sm, borderRadius: radius.md },
  modalRowText:  { flex: 1, fontSize: 14, fontFamily: 'PlusJakartaSans_400Regular', color: colors.text },
  modalCheck:    { fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold' },
});

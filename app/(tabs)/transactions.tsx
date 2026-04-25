import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, FlatList, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { useFinance } from '../../hooks/FinanceContext';
import { colors, spacing, radius, WIDE_BREAKPOINT } from '../../constants/theme';
import { fmt } from '../../lib/format';
import { TrashIcon, EditIcon } from '../../components/icons';

export default function TransactionsScreen() {
  const { txns, currency, openEdit, deleteTxn } = useFinance();
  const { width } = useWindowDimensions();
  const wide = width >= WIDE_BREAKPOINT;

  const [search, setSearch]   = useState('');
  const [typeFilter, setType] = useState<'all' | 'income' | 'expense'>('all');

  const filtered = useMemo(() => {
    return txns
      .filter(t => typeFilter === 'all' || t.type === typeFilter)
      .filter(t => !search || t.description.toLowerCase().includes(search.toLowerCase()) ||
                   t.category.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [txns, typeFilter, search]);

  return (
    <View style={styles.root}>
      <Text style={styles.heading}>All Transactions</Text>

      <TextInput
        style={styles.search}
        placeholder="Search transactions…"
        placeholderTextColor={colors.muted}
        value={search}
        onChangeText={setSearch}
      />

      <View style={styles.chips}>
        {(['all', 'income', 'expense'] as const).map(v => (
          <Pressable key={v} onPress={() => setType(v)}
            style={[styles.chip, typeFilter === v && styles.chipActive]}>
            <Text style={[styles.chipText, typeFilter === v && styles.chipTextActive]}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={t => t.id}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xl * 2 }}
        ListEmptyComponent={<Text style={styles.empty}>No transactions found.</Text>}
        renderItem={({ item: t }) => (
          <View style={[styles.row, wide && styles.rowWide]}>
            <View style={styles.rowLeft}>
              <Text style={styles.desc}>{t.description}</Text>
              <Text style={styles.meta}>{t.category} · {t.date}</Text>
              {t.tags && t.tags.length > 0 && (
                <View style={styles.tags}>
                  {t.tags.map(tag => (
                    <View key={tag} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
            <Text style={[styles.amt, { color: t.type === 'income' ? colors.green : colors.red }]}>
              {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
            </Text>
            <Pressable onPress={() => openEdit(t)} style={styles.iconBtn}><EditIcon size={16} color={colors.muted} /></Pressable>
            <Pressable onPress={() => deleteTxn(t.id)} style={styles.iconBtn}><TrashIcon size={16} color={colors.muted} /></Pressable>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root:           { flex: 1, backgroundColor: colors.bg },
  heading:        { fontSize: 22, fontFamily: 'PlusJakartaSans_800ExtraBold', color: colors.text,
                    padding: spacing.md, paddingBottom: spacing.xs },
  search:         { margin: spacing.md, marginTop: 0, backgroundColor: colors.surface,
                    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
                    color: colors.text, padding: spacing.sm, fontSize: 14,
                    fontFamily: 'PlusJakartaSans_400Regular' },
  chips:          { flexDirection: 'row', gap: spacing.xs, paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  chip:           { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.xl,
                    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  chipActive:     { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText:       { fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.muted },
  chipTextActive: { color: '#fff' },
  row:            { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
                    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
                    padding: spacing.sm, marginBottom: spacing.xs, gap: spacing.xs },
  rowWide:        { paddingHorizontal: spacing.md },
  rowLeft:        { flex: 1 },
  desc:           { fontSize: 14, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.text },
  meta:           { fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', color: colors.muted, marginTop: 2 },
  tags:           { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  tag:            { backgroundColor: colors.accentDim, borderRadius: radius.sm, paddingHorizontal: 6, paddingVertical: 2 },
  tagText:        { fontSize: 11, fontFamily: 'PlusJakartaSans_400Regular', color: colors.accent },
  amt:            { fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', marginHorizontal: spacing.xs },
  iconBtn:        { padding: 6 },
  empty:          { textAlign: 'center', color: colors.muted, marginTop: spacing.xl,
                    fontFamily: 'PlusJakartaSans_400Regular' },
});

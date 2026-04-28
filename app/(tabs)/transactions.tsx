import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, FlatList, Pressable, StyleSheet, useWindowDimensions, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useFinance } from '../../hooks/FinanceContext';
import { spacing, radius, WIDE_BREAKPOINT, Colors } from '../../constants/theme';
import { useColors } from '../../hooks/ThemeContext';
import { fmt } from '../../lib/format';
import { TrashIcon, EditIcon } from '../../components/icons';
import { Transaction, uid } from '../../lib/data';

/** Parse a simple CSV string into transactions.
 * Expected columns (order matters): date,type,amount,category,description[,notes]
 * First row may be a header.
 */
function parseCSV(raw: string): { txns: Transaction[]; errors: string[] } {
  const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const result: Transaction[] = [];
  const errors: string[] = [];
  const start = lines[0]?.toLowerCase().startsWith('date') ? 1 : 0;
  for (let i = start; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
    const [date, type, amountRaw, category, description, notes] = cols;
    const amount = parseFloat(amountRaw);
    if (!date || !type || isNaN(amount) || !category || !description) {
      errors.push(`Row ${i + 1}: missing fields`);
      continue;
    }
    if (type !== 'expense' && type !== 'income') {
      errors.push(`Row ${i + 1}: type must be 'expense' or 'income'`);
      continue;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      errors.push(`Row ${i + 1}: date must be YYYY-MM-DD`);
      continue;
    }
    result.push({ id: uid(), type: type as 'expense' | 'income', amount, category, description, date, notes: notes ?? '' });
  }
  return { txns: result, errors };
}

export default function TransactionsScreen() {
  const colors = useColors();
  const { txns, currency, openEdit, deleteTxn, addTxn } = useFinance();
  const { width } = useWindowDimensions();
  const wide = width >= WIDE_BREAKPOINT;

  const [search, setSearch]   = useState('');
  const [typeFilter, setType] = useState<'all' | 'income' | 'expense'>('all');
  const [importing, setImporting] = useState(false);

  const styles = useMemo(() => makeStyles(colors), [colors]);

  async function handleImport() {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ['text/csv', 'text/comma-separated-values', 'text/plain', '*/*'], copyToCacheDirectory: true });
      if (result.canceled || !result.assets?.[0]) return;
      const uri = result.assets[0].uri;
      let text: string;
      if (uri.startsWith('data:')) {
        // web: data URI
        const base64 = uri.split(',')[1];
        text = atob(base64);
      } else {
        text = await FileSystem.readAsStringAsync(uri);
      }
      const { txns: parsed, errors } = parseCSV(text);
      if (parsed.length === 0) {
        Alert.alert('Import failed', errors.length ? errors.join('\n') : 'No valid rows found.');
        return;
      }
      parsed.forEach(t => addTxn(t));
      Alert.alert('Import complete', `${parsed.length} transactions imported.${ errors.length ? `\n\n${errors.length} rows skipped.` : ''}`);
    } catch (e) {
      Alert.alert('Error', 'Could not read file.');
    }
  }

  const filtered = useMemo(() => {
    return txns
      .filter(t => typeFilter === 'all' || t.type === typeFilter)
      .filter(t => !search || t.description.toLowerCase().includes(search.toLowerCase()) ||
                   t.category.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [txns, typeFilter, search]);

  return (
    <View style={styles.root}>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>All Transactions</Text>
        <Pressable onPress={handleImport} style={styles.importBtn}>
          <Text style={styles.importBtnText}>⬆ Import CSV</Text>
        </Pressable>
      </View>

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

function makeStyles(colors: Colors) { return StyleSheet.create({
  root:           { flex: 1, backgroundColor: colors.bg },
  headerRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                    paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.xs },
  heading:        { fontSize: 22, fontFamily: 'PlusJakartaSans_800ExtraBold', color: colors.text },
  importBtn:      { paddingHorizontal: spacing.md, paddingVertical: 7, borderRadius: radius.md,
                    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  importBtnText:  { fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.accent },
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
}); }

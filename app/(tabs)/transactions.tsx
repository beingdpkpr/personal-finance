import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, TextInput, FlatList, Pressable, StyleSheet, useWindowDimensions, Alert, Animated } from 'react-native';
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
  const { txns, openEdit, deleteTxn, addTxn } = useFinance();
  const { width } = useWindowDimensions();
  const wide = width >= WIDE_BREAKPOINT;

  const [search, setSearch]   = useState('');
  const [typeFilter, setType] = useState<'all' | 'income' | 'expense'>('all');
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
      <Animated.View style={animStyle}>
        <View style={styles.headerRow}>
          <Text style={styles.heading}>All Transactions</Text>
          <Pressable onPress={handleImport} style={styles.importBtn}>
            <Text style={styles.importBtnText}>⬆ Import CSV</Text>
          </Pressable>
        </View>

        {/* Glass pill search bar */}
        <View style={styles.searchWrap}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search transactions…"
            placeholderTextColor={colors.muted}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Filter chips — pill style */}
        <View style={styles.chips}>
          {(['all', 'income', 'expense'] as const).map(v => (
            <Pressable key={v} onPress={() => setType(v)}
              style={typeFilter === v ? styles.chipActive : styles.chip}>
              <Text style={typeFilter === v ? styles.chipActiveText : styles.chipText}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>
      </Animated.View>

      <FlatList
        data={filtered}
        keyExtractor={t => t.id}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.md }}
        ListEmptyComponent={<Text style={styles.empty}>No transactions found.</Text>}
        renderItem={({ item: t }) => (
          <View style={[styles.txnRow, wide && styles.rowWide]}>
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
                    backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.glassBorder },
  importBtnText:  { fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.accent },
  // Glass pill search bar
  searchWrap:     { flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
                    backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.glassBorder,
                    borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 10,
                    marginBottom: spacing.sm, marginHorizontal: spacing.md, marginTop: spacing.xs },
  searchInput:    { flex: 1, color: colors.text, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14 },
  // Filter chips
  chips:          { flexDirection: 'row', gap: spacing.xs, paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  chip:           { backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.glassBorder,
                    borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 6 },
  chipText:       { color: colors.muted, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12 },
  chipActive:     { backgroundColor: colors.accentDim, borderWidth: 1, borderColor: colors.accent,
                    borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 6 },
  chipActiveText: { color: colors.accent, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 12 },
  // Transaction rows — glass cards
  txnRow:         { backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.glassBorder,
                    borderRadius: radius.lg, padding: spacing.md, marginBottom: 6,
                    flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
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

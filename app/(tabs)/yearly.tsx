import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useFinance } from '../../hooks/FinanceContext';
import StatCard from '../../components/StatCard';
import { spacing, radius, Colors } from '../../constants/theme';
import { useColors } from '../../hooks/ThemeContext';
import { fmt, fmtFull } from '../../lib/format';
import { MONTHS } from '../../constants/categories';
import { ChevronLeftIcon, ChevronRightIcon } from '../../components/icons';

export default function YearlyScreen() {
  const colors = useColors();
  const { txns } = useFinance();
  const [year, setYear] = useState(new Date().getFullYear());

  const styles = useMemo(() => makeStyles(colors), [colors]);

  const monthlyData = useMemo(() => {
    return MONTHS.map((label, idx) => {
      const key = `${year}-${String(idx + 1).padStart(2, '0')}`;
      const inc = txns.filter(t => t.type === 'income'  && t.date.startsWith(key)).reduce((s, t) => s + t.amount, 0);
      const exp = txns.filter(t => t.type === 'expense' && t.date.startsWith(key)).reduce((s, t) => s + t.amount, 0);
      return { label, inc, exp, net: inc - exp };
    });
  }, [txns, year]);

  const totalIncome   = monthlyData.reduce((s, m) => s + m.inc, 0);
  const totalExpenses = monthlyData.reduce((s, m) => s + m.exp, 0);
  const totalNet      = totalIncome - totalExpenses;
  const savingsRate   = totalIncome > 0 ? ((totalNet / totalIncome) * 100).toFixed(1) : '0.0';

  async function exportCSV() {
    const header = 'Month,Income,Expenses,Net\n';
    const rows   = monthlyData.map(m => `${m.label} ${year},${m.inc},${m.exp},${m.net}`).join('\n');
    const csv    = header + rows;

    if (Platform.OS === 'web') {
      const blob = new Blob([csv], { type: 'text/csv' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = `yearly-${year}.csv`; a.click();
      URL.revokeObjectURL(url);
    } else {
      const path = `${FileSystem.cacheDirectory}yearly-${year}.csv`;
      await FileSystem.writeAsStringAsync(path, csv, { encoding: FileSystem.EncodingType.UTF8 });
      await Sharing.shareAsync(path, { mimeType: 'text/csv', dialogTitle: `Yearly Report ${year}` });
    }
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>Yearly Report</Text>
        <Pressable onPress={exportCSV} style={styles.exportBtn}>
          <Text style={styles.exportBtnText}>Export CSV</Text>
        </Pressable>
      </View>

      <View style={styles.picker}>
        <Pressable onPress={() => setYear(y => y - 1)} style={styles.arrow}><ChevronLeftIcon size={20} color={colors.text} /></Pressable>
        <Text style={styles.pickerLabel}>{year}</Text>
        <Pressable onPress={() => setYear(y => y + 1)} style={styles.arrow}><ChevronRightIcon size={20} color={colors.text} /></Pressable>
      </View>

      <View style={styles.grid}>
        <StatCard label="Total Income"   value={fmtFull(totalIncome)}   color={colors.green} />
        <StatCard label="Total Expenses" value={fmtFull(totalExpenses)} color={colors.red}   />
        <StatCard label="Net Savings"    value={fmtFull(totalNet)}      color={totalNet >= 0 ? colors.green : colors.red} />
        <StatCard label="Savings Rate"   value={`${savingsRate}%`}      color={colors.blue}  />
      </View>

      <View style={styles.tableWrap}>
        <Text style={styles.sectionTitle}>Monthly Breakdown</Text>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={[styles.tableCell, styles.tableHeaderText, { flex: 1.2 }]}>Month</Text>
          <Text style={[styles.tableCell, styles.tableHeaderText]}>Income</Text>
          <Text style={[styles.tableCell, styles.tableHeaderText]}>Expenses</Text>
          <Text style={[styles.tableCell, styles.tableHeaderText]}>Net</Text>
        </View>
        {monthlyData.map(m => (
          <View key={m.label} style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.tableMonthCell, { flex: 1.2 }]}>{m.label}</Text>
            <Text style={[styles.tableCell, { color: m.inc > 0 ? colors.green : colors.muted }]}>{fmt(m.inc)}</Text>
            <Text style={[styles.tableCell, { color: m.exp > 0 ? colors.red   : colors.muted }]}>{fmt(m.exp)}</Text>
            <Text style={[styles.tableCell, { color: m.net >= 0 ? colors.green : colors.red  }]}>{fmt(Math.abs(m.net))}</Text>
          </View>
        ))}
        <View style={[styles.tableRow, styles.tableTotal]}>
          <Text style={[styles.tableCell, styles.tableTotalText, { flex: 1.2 }]}>Total</Text>
          <Text style={[styles.tableCell, styles.tableTotalText, { color: colors.green }]}>{fmt(totalIncome)}</Text>
          <Text style={[styles.tableCell, styles.tableTotalText, { color: colors.red }]}>{fmt(totalExpenses)}</Text>
          <Text style={[styles.tableCell, styles.tableTotalText, { color: totalNet >= 0 ? colors.green : colors.red }]}>{fmt(Math.abs(totalNet))}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

function makeStyles(colors: Colors) { return StyleSheet.create({
  root:           { flex: 1, backgroundColor: colors.bg },
  content:        { padding: spacing.md, paddingBottom: spacing.xl * 2 },
  headerRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  heading:        { fontSize: 22, fontFamily: 'PlusJakartaSans_800ExtraBold', color: colors.text },
  exportBtn:      { paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.md, backgroundColor: colors.accentDim, borderWidth: 1, borderColor: colors.accent },
  exportBtnText:  { fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.accent },
  picker:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.lg, marginBottom: spacing.md },
  arrow:          { padding: spacing.sm },
  pickerLabel:    { fontSize: 18, fontFamily: 'PlusJakartaSans_700Bold', color: colors.text, minWidth: 60, textAlign: 'center' },
  grid:           { gap: spacing.sm, marginBottom: spacing.md },
  tableWrap:      { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  sectionTitle:   { fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.8, padding: spacing.md, paddingBottom: spacing.sm },
  tableRow:       { flexDirection: 'row', paddingHorizontal: spacing.md, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border },
  tableHeader:    { backgroundColor: colors.surface2 },
  tableHeaderText:{ fontFamily: 'PlusJakartaSans_700Bold', color: colors.muted, fontSize: 12 },
  tableCell:      { flex: 1, fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', color: colors.text },
  tableMonthCell: { fontFamily: 'PlusJakartaSans_600SemiBold' },
  tableTotal:     { backgroundColor: colors.surface2 },
  tableTotalText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13 },
}); }

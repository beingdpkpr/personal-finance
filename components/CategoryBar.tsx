import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../constants/theme';

interface Props {
  label: string;
  color: string;
  spent: number;
  budget?: number;
  showBudget?: boolean;
}

export default function CategoryBar({ label, color, spent, budget, showBudget }: Props) {
  const pct    = budget && budget > 0 ? Math.min(spent / budget, 1) : 0;
  const barColor = budget
    ? (spent > budget ? colors.red : pct >= 0.8 ? colors.yellow : color)
    : color;

  return (
    <View style={styles.wrap}>
      {label ? (
        <View style={styles.labelRow}>
          <View style={[styles.dot, { backgroundColor: color }]} />
          <Text style={styles.label}>{label}</Text>
          {showBudget && budget != null && (
            <Text style={styles.amounts}>
              {spent.toFixed(0)} / {budget.toFixed(0)}
            </Text>
          )}
        </View>
      ) : null}
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct * 100}%` as any, backgroundColor: barColor }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap:      { marginBottom: spacing.sm },
  labelRow:  { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  dot:       { width: 8, height: 8, borderRadius: 4, marginRight: spacing.sm },
  label:     { flex: 1, fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', color: colors.text },
  amounts:   { fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', color: colors.muted },
  track:     { height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' },
  fill:      { height: 6, borderRadius: 3 },
});

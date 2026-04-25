import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../constants/theme';

interface Props {
  label: string;
  value: string;
  color?: string;
  sub?: string;
}

export default function StatCard({ label, value, color = colors.text, sub }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color }]}>{value}</Text>
      {sub ? <Text style={styles.sub}>{sub}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card:  { flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1,
           borderColor: colors.border, padding: spacing.md, minWidth: 140 },
  label: { fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', color: colors.muted, marginBottom: 4 },
  value: { fontSize: 20, fontFamily: 'PlusJakartaSans_700Bold' },
  sub:   { fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', color: colors.muted, marginTop: 2 },
});

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
      <View style={[styles.strip, { backgroundColor: color }]} />
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color }]}>{value}</Text>
      {sub ? <Text style={styles.sub}>{sub}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card:  { flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1,
           borderColor: colors.border, overflow: 'hidden', padding: spacing.md, minWidth: 140 },
  strip: { position: 'absolute', top: 0, left: 0, right: 0, height: 3 },
  label: { fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.muted,
           textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 6, marginTop: 4 },
  value: { fontSize: 24, fontFamily: 'PlusJakartaSans_800ExtraBold' },
  sub:   { fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', color: colors.muted, marginTop: 2 },
});

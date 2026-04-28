import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { spacing, radius, Colors } from '../constants/theme';
import { useColors } from '../hooks/ThemeContext';

interface Props {
  label: string;
  value: string;
  color?: string;
  sub?: string;
}

export default function StatCard({ label, value, color, sub }: Props) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const resolvedColor = color ?? colors.text;
  return (
    <View style={styles.card}>
      <View style={[styles.strip, { backgroundColor: resolvedColor }]} />
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color: resolvedColor }]}>{value}</Text>
      {sub ? <Text style={styles.sub}>{sub}</Text> : null}
    </View>
  );
}

function makeStyles(colors: Colors) { return StyleSheet.create({
  card:  { flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, overflow: 'hidden',
           padding: spacing.md, minWidth: 140,
           shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
           shadowOpacity: 0.07, shadowRadius: 10, elevation: 3 },
  strip: { position: 'absolute', top: 0, left: 0, right: 0, height: 3 },
  label: { fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.muted,
           textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 6, marginTop: 4 },
  value: { fontSize: 24, fontFamily: 'PlusJakartaSans_800ExtraBold' },
  sub:   { fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', color: colors.muted, marginTop: 2 },
}); }

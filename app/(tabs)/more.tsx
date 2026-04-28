import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ChartIcon, GoalIcon, NetWorthIcon, RecurIcon, UserIcon } from '../../components/icons';
import { colors, spacing, radius } from '../../constants/theme';

const MORE_ITEMS = [
  { href: '/(tabs)/profile',   label: 'Profile',        sub: 'Your account details',     Icon: UserIcon    },
  { href: '/(tabs)/yearly',    label: 'Yearly Report',  sub: 'Annual income & expenses', Icon: ChartIcon   },
  { href: '/(tabs)/goals',     label: 'Savings Goals',  sub: 'Track your targets',       Icon: GoalIcon    },
  { href: '/(tabs)/networth',  label: 'Net Worth',      sub: 'Assets & liabilities',     Icon: NetWorthIcon },
  { href: '/(tabs)/recurring', label: 'Recurring',      sub: 'Auto transactions',        Icon: RecurIcon   },
] as const;

export default function MoreScreen() {
  const router = useRouter();

  return (
    <View style={styles.root}>
      <Text style={styles.heading}>More</Text>
      {MORE_ITEMS.map(({ href, label, sub, Icon }) => (
        <Pressable key={href} onPress={() => router.push(href as any)} style={styles.row}>
          <View style={styles.iconWrap}>
            <Icon size={22} color={colors.accent} />
          </View>
          <View style={styles.rowText}>
            <Text style={styles.rowLabel}>{label}</Text>
            <Text style={styles.rowSub}>{sub}</Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root:     { flex: 1, backgroundColor: colors.bg, padding: spacing.md },
  heading:  { fontSize: 22, fontFamily: 'PlusJakartaSans_800ExtraBold', color: colors.text, marginBottom: spacing.lg },
  row:      { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.lg,
              borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.sm, gap: spacing.md },
  iconWrap: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.accentDim,
              alignItems: 'center', justifyContent: 'center' },
  rowText:  { flex: 1 },
  rowLabel: { fontSize: 15, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.text },
  rowSub:   { fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', color: colors.muted, marginTop: 2 },
});

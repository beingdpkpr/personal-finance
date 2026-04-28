import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { GridIcon, ListIcon, BudgetIcon, CalIcon, MoreIcon } from './icons';
import { colors, spacing } from '../constants/theme';

const TABS = [
  { href: '/(tabs)',              label: 'Dashboard',   Icon: GridIcon   },
  { href: '/(tabs)/monthly',      label: 'Monthly',     Icon: CalIcon    },
  { href: '/(tabs)/budgets',      label: 'Planner',     Icon: BudgetIcon },
  { href: '/(tabs)/transactions', label: 'Transactions',Icon: ListIcon   },
  { href: '/(tabs)/more',         label: 'More',        Icon: MoreIcon   },
] as const;

export default function BottomNav() {
  const router   = useRouter();
  const pathname = usePathname();

  return (
    <View style={styles.bar}>
      {TABS.map(({ href, label, Icon }) => {
        const active = pathname === href || (href === '/(tabs)' && pathname === '/');
        return (
          <Pressable key={href} onPress={() => router.push(href as any)} style={styles.tab}>
            <View style={[styles.pill, active && styles.pillActive]}>
              <Icon size={20} color={active ? colors.accent : colors.muted} />
            </View>
            <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar:         { flexDirection: 'row', backgroundColor: colors.surface, borderTopWidth: 1,
                 borderTopColor: colors.border, paddingBottom: spacing.sm, paddingTop: 6 },
  tab:         { flex: 1, alignItems: 'center', gap: 3 },
  pill:        { width: 48, height: 30, borderRadius: 100, alignItems: 'center', justifyContent: 'center' },
  pillActive:  { backgroundColor: colors.accentDim },
  label:       { fontSize: 10, fontFamily: 'PlusJakartaSans_400Regular', color: colors.muted },
  labelActive: { color: colors.accent, fontFamily: 'PlusJakartaSans_600SemiBold' },
});

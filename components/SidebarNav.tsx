import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useFinance } from '../hooks/FinanceContext';
import {
  GridIcon, ListIcon, CalIcon, ChartIcon, BudgetIcon,
  GoalIcon, NetWorthIcon, RecurIcon, PlusIcon, LogoutIcon, UserIcon,
} from './icons';
import { colors, spacing, radius, SIDEBAR_W } from '../constants/theme';
import { CURRENCIES } from '../constants/categories';

const NAV_ITEMS = [
  { href: '/(tabs)',             label: 'Dashboard',     Icon: GridIcon    },
  { href: '/(tabs)/transactions',label: 'Transactions',  Icon: ListIcon    },
  { href: '/(tabs)/budgets',     label: 'Budget Planner',Icon: BudgetIcon  },
  { href: '/(tabs)/planning',    label: 'Planning',      Icon: ChartIcon   },
  { href: '/(tabs)/monthly',     label: 'Monthly Report',Icon: CalIcon     },
  { href: '/(tabs)/yearly',      label: 'Yearly Report', Icon: ChartIcon   },
  { href: '/(tabs)/goals',       label: 'Savings Goals', Icon: GoalIcon    },
  { href: '/(tabs)/networth',    label: 'Net Worth',     Icon: NetWorthIcon },
  { href: '/(tabs)/recurring',   label: 'Recurring',     Icon: RecurIcon   },
] as const;

export default function SidebarNav() {
  const router   = useRouter();
  const pathname = usePathname();
  const { user, logout, currency, setCurrencyPref, openAdd } = useFinance();

  return (
    <View style={styles.sidebar}>
      {/* Brand */}
      <View style={styles.brand}>
        <View style={styles.brandDot} />
        <Text style={styles.brandText}>Finance</Text>
      </View>

      {/* Nav items */}
      <ScrollView style={styles.navList} showsVerticalScrollIndicator={false}>
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = pathname === href || (href === '/(tabs)' && pathname === '/');
          return (
            <Pressable key={href} onPress={() => router.push(href as any)}
              style={[styles.navItem, active && styles.navItemActive]}>
              <Icon size={18} color={active ? colors.accent : colors.muted} />
              <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Currency switcher */}
      <View style={styles.currencyRow}>
        {CURRENCIES.map(c => (
          <Pressable key={c.code} onPress={() => setCurrencyPref(c)}
            style={[styles.currencyBtn, currency.code === c.code && styles.currencyBtnActive]}>
            <Text style={[styles.currencyText, currency.code === c.code && styles.currencyTextActive]}>
              {c.code}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Add transaction button */}
      <Pressable onPress={openAdd} style={styles.addBtn}>
        <PlusIcon size={16} color="#fff" />
        <Text style={styles.addBtnText}>Add Transaction</Text>
      </Pressable>

      {/* User + logout */}
      <Pressable onPress={() => router.push('/(tabs)/profile' as any)} style={styles.userRow}>
        <View style={styles.userAvatar}>
          <UserIcon size={16} color={colors.accent} />
        </View>
        <Text style={styles.userName} numberOfLines={1}>{user}</Text>
        <Pressable onPress={logout} style={styles.logoutBtn}>
          <LogoutIcon size={18} color={colors.muted} />
        </Pressable>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar:          { width: SIDEBAR_W, backgroundColor: colors.surface, borderRightWidth: 1,
                      borderRightColor: colors.border, paddingVertical: spacing.lg, paddingHorizontal: spacing.md },
  brand:            { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg },
  brandDot:         { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent },
  brandText:        { fontSize: 18, fontFamily: 'PlusJakartaSans_800ExtraBold', color: colors.text },
  navList:          { flex: 1 },
  navItem:          { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 10,
                      paddingHorizontal: spacing.sm, borderRadius: radius.md, marginBottom: 2 },
  navItemActive:    { backgroundColor: colors.accentDim },
  navLabel:         { fontSize: 14, fontFamily: 'PlusJakartaSans_400Regular', color: colors.muted },
  navLabelActive:   { fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.text },
  currencyRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginVertical: spacing.md },
  currencyBtn:      { paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.sm,
                      backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border },
  currencyBtnActive:{ backgroundColor: colors.accentDim, borderColor: colors.accent },
  currencyText:     { fontSize: 11, fontFamily: 'PlusJakartaSans_400Regular', color: colors.muted },
  currencyTextActive:{ color: colors.accent, fontFamily: 'PlusJakartaSans_600SemiBold' },
  addBtn:           { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.accent,
                      borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.md, justifyContent: 'center' },
  addBtnText:       { fontSize: 14, fontFamily: 'PlusJakartaSans_600SemiBold', color: '#fff' },
  userRow:          { flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
                      backgroundColor: colors.surface2, borderRadius: radius.md, padding: spacing.sm },
  userAvatar:       { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.accentDim,
                      alignItems: 'center', justifyContent: 'center' },
  userName:         { flex: 1, fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.text },
  logoutBtn:        { padding: 4 },
});

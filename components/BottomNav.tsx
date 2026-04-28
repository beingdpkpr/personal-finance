import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { GridIcon, ListIcon, BudgetIcon, CalIcon, MoreIcon } from './icons';
import { Colors } from '../constants/theme';
import { useColors } from '../hooks/ThemeContext';

const TABS = [
  { href: '/(tabs)',              label: 'Dashboard',   Icon: GridIcon   },
  { href: '/(tabs)/monthly',      label: 'Monthly',     Icon: CalIcon    },
  { href: '/(tabs)/budgets',      label: 'Planner',     Icon: BudgetIcon },
  { href: '/(tabs)/transactions', label: 'Transactions',Icon: ListIcon   },
  { href: '/(tabs)/more',         label: 'More',        Icon: MoreIcon   },
] as const;

export default function BottomNav() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const router   = useRouter();
  const pathname = usePathname();

  return (
    <View style={styles.container}>
      <View style={styles.bar}>
        {TABS.map(({ href, label, Icon }) => {
          const active = pathname === href || (href === '/(tabs)' && pathname === '/');
          return (
            <Pressable key={href} onPress={() => router.push(href as any)} style={styles.tab}>
              <View style={[styles.pill, active && styles.pillActive]}>
                <Icon size={20} color={active ? '#ffffff' : 'rgba(255,255,255,0.4)'} />
              </View>
              <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function makeStyles(colors: Colors) { return StyleSheet.create({
  container:   { paddingHorizontal: 12, paddingBottom: 14 },
  bar:         { flexDirection: 'row', backgroundColor: colors.navBg, borderRadius: 28,
                 paddingVertical: 8, paddingHorizontal: 6,
                 shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
                 shadowOpacity: 0.22, shadowRadius: 16, elevation: 10 },
  tab:         { flex: 1, alignItems: 'center', gap: 3 },
  pill:        { width: 44, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  pillActive:  { backgroundColor: 'rgba(255,255,255,0.14)' },
  label:       { fontSize: 9, fontFamily: 'PlusJakartaSans_400Regular', color: 'rgba(255,255,255,0.4)' },
  labelActive: { color: '#ffffff', fontFamily: 'PlusJakartaSans_600SemiBold' },
}); }

import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { usePathname, router } from 'expo-router';
import type { Href } from 'expo-router';
import { colors, radius } from '../constants/theme';
import { GridIcon, ListIcon, BudgetIcon, ChartIcon, UserIcon } from './icons';

const ITEMS: Array<{ Icon: React.ComponentType<{ size?: number; color?: string }>; route: Href; label: string }> = [
  { Icon: GridIcon,   route: '/(tabs)',              label: 'Dashboard'    },
  { Icon: ListIcon,   route: '/(tabs)/transactions', label: 'Transactions' },
  { Icon: BudgetIcon, route: '/(tabs)/budgets',      label: 'Budgets'      },
  { Icon: ChartIcon,  route: '/(tabs)/monthly',      label: 'Monthly'      },
  { Icon: UserIcon,   route: '/(tabs)/profile',      label: 'Profile'      },
];

export function DockNav() {
  const pathname = usePathname();
  return (
    <View style={styles.outer}>
      <View style={styles.dock}>
        {ITEMS.map(({ Icon, route, label }, i) => {
          const active = pathname === route || (route === '/(tabs)' && pathname === '/');
          return (
            <React.Fragment key={label}>
              {i === ITEMS.length - 1 && <View style={styles.divider} />}
              <Pressable
                style={[styles.item, active && styles.itemActive]}
                onPress={() => router.replace(route)}
                accessibilityLabel={label}
              >
                <Icon size={20} color={active ? colors.accent : colors.muted} />
                {active && <View style={styles.dot} />}
              </Pressable>
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer:      { alignItems: 'center', paddingVertical: 10, backgroundColor: 'transparent' },
  dock:       { flexDirection: 'row', alignItems: 'center', gap: 4 },
  item:       { alignItems: 'center', gap: 3, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  itemActive: { backgroundColor: 'rgba(240,114,42,0.12)' },
  dot:        { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.accent },
  divider:    { width: 1, height: 20, backgroundColor: 'rgba(255,255,255,0.10)', marginHorizontal: 6 },
});

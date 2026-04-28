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
    <View style={styles.outer} pointerEvents="box-none">
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
  outer:      { position: 'absolute', bottom: 16, left: 0, right: 0, alignItems: 'center', zIndex: 100 },
  dock:       {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(25,26,40,0.88)', borderRadius: 28,
    paddingHorizontal: 10, paddingVertical: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5, shadowRadius: 20, elevation: 20,
  },
  item:       { alignItems: 'center', gap: 3, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  itemActive: { backgroundColor: 'rgba(240,114,42,0.15)' },
  dot:        { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.accent },
  divider:    { width: 1, height: 24, backgroundColor: 'rgba(255,255,255,0.10)', marginHorizontal: 4 },
});

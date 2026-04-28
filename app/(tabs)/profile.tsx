import React, { useMemo } from 'react';
import {
  View, Text, Image, Pressable, ScrollView, StyleSheet, Switch,
} from 'react-native';
import { useFinance } from '../../hooks/FinanceContext';
import { LogoutIcon } from '../../components/icons';
import { spacing, radius, Colors } from '../../constants/theme';
import { useTheme, useColors } from '../../hooks/ThemeContext';
import { CURRENCIES } from '../../constants/categories';

export default function ProfileScreen() {
  const colors = useColors();
  const { darkMode, toggleDarkMode } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { user, email, name, picture, logout, currency, setCurrencyPref } = useFinance();

  const initials = name
    ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : (email?.[0] ?? 'U').toUpperCase();

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Profile</Text>

      {/* Avatar */}
      <View style={styles.avatarWrap}>
        {picture ? (
          <Image source={{ uri: picture }} style={styles.avatarImg} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
        )}
      </View>

      {/* Name */}
      {name ? <Text style={styles.displayName}>{name}</Text> : null}
      {email ? <Text style={styles.emailText}>{email}</Text> : null}

      {/* Info cards */}
      <View style={styles.section}>
        <InfoRow label="Email" value={email ?? '—'} styles={styles} />
        <InfoRow label="User ID" value={user ?? '—'} mono styles={styles} />
      </View>

      {/* Preferences */}
      <View style={[styles.section, { marginTop: 0 }]}>
        <View style={styles.prefHeader}>
          <Text style={styles.prefTitle}>Preferences</Text>
        </View>

        {/* Dark Mode toggle */}
        <View style={[styles.row, styles.rowNoBottom]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowLabel}>Dark Mode</Text>
            <Text style={styles.rowSub}>Switch to dark theme</Text>
          </View>
          <Switch
            value={darkMode}
            onValueChange={toggleDarkMode}
            trackColor={{ false: colors.border, true: colors.accent }}
            thumbColor={darkMode ? '#fff' : colors.muted}
          />
        </View>

        {/* Currency */}
        <View style={styles.prefRow}>
          <Text style={styles.rowLabel}>Currency</Text>
        </View>
        <View style={styles.currencyGrid}>
          {CURRENCIES.map(c => {
            const active = currency.code === c.code;
            return (
              <Pressable
                key={c.code}
                onPress={() => setCurrencyPref(c)}
                style={[styles.currencyChip, active && styles.currencyChipActive]}
              >
                <Text style={[styles.currencySymbol, active && styles.currencySymbolActive]}>
                  {c.symbol}
                </Text>
                <Text style={[styles.currencyCode, active && styles.currencyCodeActive]}>
                  {c.code}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Sign out */}
      <Pressable onPress={logout} style={styles.logoutBtn}>
        <LogoutIcon size={18} color={colors.red} />
        <Text style={styles.logoutText}>Sign out</Text>
      </Pressable>
    </ScrollView>
  );
}

function InfoRow({ label, value, mono, styles }: { label: string; value: string; mono?: boolean; styles: ReturnType<typeof makeStyles> }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, mono && styles.rowValueMono]} numberOfLines={1} selectable>
        {value}
      </Text>
    </View>
  );
}

function makeStyles(colors: Colors) { return StyleSheet.create({
  root:            { flex: 1, backgroundColor: colors.bg },
  content:         { padding: spacing.md, alignItems: 'center', gap: spacing.md },
  heading:         { fontSize: 22, fontFamily: 'PlusJakartaSans_800ExtraBold', color: colors.text,
                     alignSelf: 'flex-start', marginBottom: spacing.sm },
  avatarWrap:      { marginTop: spacing.md },
  avatarImg:       { width: 96, height: 96, borderRadius: 48, borderWidth: 2, borderColor: colors.accent },
  avatarFallback:  { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.accentDim,
                     borderWidth: 2, borderColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  avatarInitials:  { fontSize: 32, fontFamily: 'PlusJakartaSans_800ExtraBold', color: colors.accent },
  displayName:     { fontSize: 20, fontFamily: 'PlusJakartaSans_700Bold', color: colors.text, marginTop: spacing.xs },
  emailText:       { fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', color: colors.muted },
  section:         { width: '100%', backgroundColor: colors.surface, borderRadius: radius.lg,
                     borderWidth: 1, borderColor: colors.border, overflow: 'hidden', marginTop: spacing.sm },
  row:             { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                     paddingHorizontal: spacing.md, paddingVertical: 14,
                     borderBottomWidth: 1, borderBottomColor: colors.border },
  rowNoBottom:     { flexDirection: 'row', alignItems: 'center',
                     paddingHorizontal: spacing.md, paddingVertical: 14,
                     borderBottomWidth: 1, borderBottomColor: colors.border },
  rowLabel:        { fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.text, flex: 1 },
  rowSub:          { fontSize: 11, fontFamily: 'PlusJakartaSans_400Regular', color: colors.muted, marginTop: 2 },
  rowValue:        { fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', color: colors.text,
                     flex: 2, textAlign: 'right' },
  rowValueMono:    { fontFamily: 'PlusJakartaSans_400Regular', color: colors.muted, fontSize: 11 },
  logoutBtn:       { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md,
                     backgroundColor: colors.redDim, borderRadius: radius.md, paddingHorizontal: spacing.lg,
                     paddingVertical: spacing.md, borderWidth: 1, borderColor: colors.red },
  logoutText:      { fontSize: 15, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.red },
  prefHeader:      { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.xs },
  prefTitle:       { fontSize: 11, fontFamily: 'PlusJakartaSans_700Bold', color: colors.muted,
                     textTransform: 'uppercase', letterSpacing: 0.8 },
  prefRow:         { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: 4 },
  currencyGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs,
                     paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  currencyChip:    { flexDirection: 'row', alignItems: 'center', gap: 4,
                     paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill,
                     backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border },
  currencyChipActive: { backgroundColor: colors.accentDim, borderColor: colors.accent },
  currencySymbol:  { fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: colors.muted },
  currencySymbolActive: { color: colors.accent },
  currencyCode:    { fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.muted },
  currencyCodeActive:  { color: colors.accent },
}); }

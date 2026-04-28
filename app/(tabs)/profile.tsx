import React from 'react';
import {
  View, Text, Image, Pressable, ScrollView, StyleSheet, Linking,
} from 'react-native';
import { useFinance } from '../../hooks/FinanceContext';
import { LogoutIcon } from '../../components/icons';
import { colors, spacing, radius } from '../../constants/theme';

export default function ProfileScreen() {
  const { user, email, name, picture, logout } = useFinance();

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
        <InfoRow label="Email" value={email ?? '—'} />
        <InfoRow label="User ID" value={user ?? '—'} mono />
      </View>

      {/* Sign out */}
      <Pressable onPress={logout} style={styles.logoutBtn}>
        <LogoutIcon size={18} color={colors.red} />
        <Text style={styles.logoutText}>Sign out</Text>
      </Pressable>
    </ScrollView>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, mono && styles.rowValueMono]} numberOfLines={1} selectable>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
  rowLabel:        { fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.muted, flex: 1 },
  rowValue:        { fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', color: colors.text,
                     flex: 2, textAlign: 'right' },
  rowValueMono:    { fontFamily: 'PlusJakartaSans_400Regular', color: colors.muted, fontSize: 11 },
  logoutBtn:       { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md,
                     backgroundColor: colors.redDim, borderRadius: radius.md, paddingHorizontal: spacing.lg,
                     paddingVertical: spacing.md, borderWidth: 1, borderColor: colors.red },
  logoutText:      { fontSize: 15, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.red },
});

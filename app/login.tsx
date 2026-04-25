import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useFinance } from '../hooks/FinanceContext';
import { colors, spacing, radius } from '../constants/theme';

export default function LoginScreen() {
  const { login, register } = useFinance();
  const [mode, setMode]         = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [busy, setBusy]         = useState(false);

  async function handleSubmit() {
    setError('');
    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    setBusy(true);
    const err = mode === 'login'
      ? await login(username, password)
      : await register(username, password);
    setBusy(false);
    if (err) { setError(err); return; }
    router.replace('/(tabs)');
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        {/* Logo / brand */}
        <View style={styles.logoRow}>
          <View style={styles.logoDot} />
          <Text style={styles.logoText}>Finance</Text>
        </View>

        <Text style={styles.title}>
          {mode === 'login' ? 'Welcome back' : 'Create account'}
        </Text>
        <Text style={styles.sub}>
          {mode === 'login' ? 'Sign in to continue' : 'Register to get started'}
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          value={username}
          onChangeText={setUsername}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={colors.muted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Pressable
          style={[styles.btn, busy && styles.btnDisabled]}
          onPress={handleSubmit}
          disabled={busy}
        >
          {busy
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnText}>{mode === 'login' ? 'Sign In' : 'Register'}</Text>
          }
        </Pressable>

        <Pressable onPress={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError(''); }}>
          <Text style={styles.toggle}>
            {mode === 'login' ? "Don't have an account? Register" : 'Already have an account? Sign in'}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:       { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: spacing.md },
  card:       { width: '100%', maxWidth: 400, backgroundColor: colors.surface, borderRadius: radius.xl,
                borderWidth: 1, borderColor: colors.border, padding: spacing.xl, gap: spacing.md },
  logoRow:    { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  logoDot:    { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent },
  logoText:   { fontSize: 18, fontFamily: 'PlusJakartaSans_800ExtraBold', color: colors.text },
  title:      { fontSize: 22, fontFamily: 'PlusJakartaSans_800ExtraBold', color: colors.text },
  sub:        { fontSize: 14, fontFamily: 'PlusJakartaSans_400Regular', color: colors.muted, marginTop: -spacing.sm },
  error:      { fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', color: colors.red,
                backgroundColor: colors.redDim, borderRadius: radius.sm, padding: spacing.sm },
  input:      { backgroundColor: colors.surface2, borderRadius: radius.md, borderWidth: 1,
                borderColor: colors.border, color: colors.text, padding: spacing.sm + 2, fontSize: 15,
                fontFamily: 'PlusJakartaSans_400Regular' },
  btn:        { backgroundColor: colors.accent, borderRadius: radius.md, padding: spacing.md,
                alignItems: 'center' },
  btnDisabled:{ opacity: 0.6 },
  btnText:    { fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', color: '#fff' },
  toggle:     { textAlign: 'center', fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', color: colors.muted },
});

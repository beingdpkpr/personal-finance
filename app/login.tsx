import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, Pressable, StyleSheet,
  ActivityIndicator,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import { router } from 'expo-router';
import { useFinance } from '../hooks/FinanceContext';
import { colors, spacing, radius } from '../constants/theme';

WebBrowser.maybeCompleteAuthSession();

const CLIENT_ID         = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID!;
const IOS_CLIENT_ID     = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;

export default function LoginScreen() {
  const { googleSignIn } = useFinance();
  const [error, setError] = useState('');
  const [busy, setBusy]   = useState(false);

  const redirectUri = makeRedirectUri({ native: 'finance://login' });

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId:         CLIENT_ID,
    iosClientId:      IOS_CLIENT_ID,
    androidClientId:  ANDROID_CLIENT_ID,
    redirectUri,
    scopes: [
      'openid',
      'email',
      'profile',
      'https://www.googleapis.com/auth/spreadsheets',
    ],
  });

  const handleSignIn = useCallback(async (accessToken: string, expiresIn: number) => {
    setBusy(true);
    setError('');
    const err = await googleSignIn(accessToken, expiresIn);
    setBusy(false);
    if (err) { setError(err); return; }
    router.replace('/(tabs)');
  }, [googleSignIn]);

  useEffect(() => {
    if (response?.type !== 'success') return;
    const token = response.authentication?.accessToken;
    const expiresIn = response.authentication?.expiresIn ?? 3600;
    if (!token) { setError('No access token received from Google.'); return; }
    handleSignIn(token, expiresIn);
  }, [response, handleSignIn]);

  return (
    <View style={styles.root}>
      <View style={styles.card}>
        <View style={styles.logoRow}>
          <View style={styles.logoDot} />
          <Text style={styles.logoText}>Finance</Text>
        </View>

        <Text style={styles.title}>Welcome</Text>
        <Text style={styles.sub}>Sign in with Google to sync your data across devices</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={[styles.btn, (!request || busy) && styles.btnDisabled]}
          onPress={() => { setError(''); promptAsync(); }}
          disabled={!request || busy}
        >
          {busy
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnText}>Sign in with Google</Text>
          }
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: spacing.md },
  card:        { width: '100%', maxWidth: 400, backgroundColor: colors.surface, borderRadius: radius.xl,
                 borderWidth: 1, borderColor: colors.border, padding: spacing.xl, gap: spacing.md },
  logoRow:     { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  logoDot:     { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent },
  logoText:    { fontSize: 18, fontFamily: 'PlusJakartaSans_800ExtraBold', color: colors.text },
  title:       { fontSize: 22, fontFamily: 'PlusJakartaSans_800ExtraBold', color: colors.text },
  sub:         { fontSize: 14, fontFamily: 'PlusJakartaSans_400Regular', color: colors.muted, marginTop: -spacing.sm },
  error:       { fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', color: colors.red,
                 backgroundColor: colors.redDim, borderRadius: radius.sm, padding: spacing.sm },
  btn:         { backgroundColor: colors.accent, borderRadius: radius.md, padding: spacing.md, alignItems: 'center' },
  btnDisabled: { opacity: 0.6 },
  btnText:     { fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', color: '#fff' },
});

import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
  View, Text, Pressable, StyleSheet,
  ActivityIndicator, Platform,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import { router } from 'expo-router';
import { useFinance } from '../hooks/FinanceContext';
import { spacing, radius, Colors } from '../constants/theme';
import { useColors } from '../hooks/ThemeContext';

WebBrowser.maybeCompleteAuthSession();

const CLIENT_ID         = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID!;
const IOS_CLIENT_ID     = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;

export default function LoginScreen() {
  const colors = useColors();
  const { googleSignIn } = useFinance();
  const [error, setError] = useState('');
  const [busy, setBusy]   = useState(false);

  const styles = useMemo(() => makeStyles(colors), [colors]);

  const redirectUri = Platform.OS === 'web' && process.env.EXPO_PUBLIC_REDIRECT_URI
    ? process.env.EXPO_PUBLIC_REDIRECT_URI
    : makeRedirectUri({ native: 'finance://login' });

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
      <View style={[styles.blob, styles.blobPurple]} />
      <View style={[styles.blob, styles.blobPink]} />

      <View style={styles.card}>
        <View style={styles.logoRow}>
          <View style={styles.logoDot} />
          <Text style={styles.logoText}>Finance</Text>
        </View>

        <View style={styles.heroText}>
          <Text style={styles.title}>Take control{`\n`}of your finances</Text>
          <Text style={styles.sub}>Track expenses, plan budgets, and stay on top of every transaction.</Text>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={[styles.btn, (!request || busy) && styles.btnDisabled]}
          onPress={() => { setError(''); promptAsync(); }}
          disabled={!request || busy}
        >
          {busy
            ? <ActivityIndicator color={colors.text} />
            : (
              <>
                <Text style={styles.btnG}>G</Text>
                <Text style={styles.btnText}>Sign in with Google</Text>
              </>
            )
          }
        </Pressable>
      </View>
    </View>
  );
}

function makeStyles(colors: Colors) { return StyleSheet.create({
  root:       { flex: 1, backgroundColor: '#d8ddf0', alignItems: 'center', justifyContent: 'center',
                padding: spacing.md, overflow: 'hidden' },
  blob:       { position: 'absolute', borderRadius: 999 },
  blobPurple: { width: 420, height: 420, backgroundColor: '#c4b5fd', top: -100, left: -80, opacity: 0.55 },
  blobPink:   { width: 340, height: 340, backgroundColor: '#fbcfe8', bottom: -80, right: -60, opacity: 0.55 },
  card:       { width: '100%', maxWidth: 400, backgroundColor: 'rgba(255,255,255,0.84)',
                borderRadius: radius.xl, padding: spacing.xl, gap: spacing.md,
                shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.12, shadowRadius: 24, elevation: 8 },
  logoRow:    { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  logoDot:    { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent },
  logoText:   { fontSize: 18, fontFamily: 'PlusJakartaSans_800ExtraBold', color: colors.text },
  heroText:   { gap: spacing.sm, marginVertical: spacing.sm },
  title:      { fontSize: 30, fontFamily: 'PlusJakartaSans_800ExtraBold', color: colors.text, lineHeight: 38 },
  sub:        { fontSize: 14, fontFamily: 'PlusJakartaSans_400Regular', color: colors.muted, lineHeight: 22 },
  error:      { fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', color: colors.red,
                backgroundColor: colors.redDim, borderRadius: radius.sm, padding: spacing.sm },
  btn:        { backgroundColor: colors.surface, borderRadius: radius.pill,
                paddingVertical: 14, paddingHorizontal: spacing.xl,
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
                borderWidth: 1, borderColor: colors.border,
                shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  btnDisabled: { opacity: 0.6 },
  btnG:       { fontSize: 16, fontFamily: 'PlusJakartaSans_800ExtraBold', color: '#4285f4' },
  btnText:    { fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', color: colors.text },
}); }

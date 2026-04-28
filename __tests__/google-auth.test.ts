import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  saveGoogleSession, getGoogleSession, isTokenExpired,
  saveSpreadsheetId, clearGoogleSession, hasMigrated, setMigrated,
} from '../lib/google-auth';

beforeEach(() => AsyncStorage.clear());

test('saveGoogleSession and getGoogleSession round-trip', async () => {
  await saveGoogleSession('tok123', 3600, 'user@example.com', 'uid42');
  const session = await getGoogleSession();
  expect(session).not.toBeNull();
  expect(session!.accessToken).toBe('tok123');
  expect(session!.email).toBe('user@example.com');
  expect(session!.userId).toBe('uid42');
  expect(session!.expiry).toBeGreaterThan(Date.now());
  expect(session!.spreadsheetId).toBeNull();
});

test('getGoogleSession returns null when no token stored', async () => {
  expect(await getGoogleSession()).toBeNull();
});

test('isTokenExpired returns false for fresh token', async () => {
  await saveGoogleSession('tok', 3600, 'a@b.com', 'u1');
  const session = await getGoogleSession();
  expect(isTokenExpired(session!)).toBe(false);
});

test('isTokenExpired returns true for expired token', () => {
  const session = {
    accessToken: 'tok', expiry: Date.now() - 1000,
    email: 'a@b.com', userId: 'u1', spreadsheetId: null,
  };
  expect(isTokenExpired(session)).toBe(true);
});

test('saveSpreadsheetId persists and getGoogleSession returns it', async () => {
  await saveGoogleSession('tok', 3600, 'a@b.com', 'u1');
  await saveSpreadsheetId('sheet123');
  const session = await getGoogleSession();
  expect(session!.spreadsheetId).toBe('sheet123');
});

test('clearGoogleSession removes session keys but preserves migration flag', async () => {
  await saveGoogleSession('tok', 3600, 'a@b.com', 'u1');
  await saveSpreadsheetId('sheet123');
  await setMigrated();
  await clearGoogleSession();
  expect(await getGoogleSession()).toBeNull();
  expect(await hasMigrated()).toBe(true); // migration flag preserved
});

test('hasMigrated returns false initially, true after setMigrated', async () => {
  expect(await hasMigrated()).toBe(false);
  await setMigrated();
  expect(await hasMigrated()).toBe(true);
});

import AsyncStorage from '@react-native-async-storage/async-storage';

const K = {
  ACCESS_TOKEN:   'pf_google_access_token',
  EXPIRY:         'pf_google_expiry',
  EMAIL:          'pf_google_email',
  USER_ID:        'pf_google_user_id',
  SPREADSHEET_ID: 'pf_google_spreadsheet_id',
  MIGRATED:       'pf_migrated',
} as const;

export interface GoogleSession {
  accessToken:   string;
  expiry:        number;   // ms timestamp
  email:         string;
  userId:        string;
  spreadsheetId: string | null;
}

export async function saveGoogleSession(
  accessToken: string,
  expiresIn: number,     // seconds
  email: string,
  userId: string,
): Promise<void> {
  const expiry = Date.now() + expiresIn * 1000;
  await Promise.all([
    AsyncStorage.setItem(K.ACCESS_TOKEN, accessToken),
    AsyncStorage.setItem(K.EXPIRY, String(expiry)),
    AsyncStorage.setItem(K.EMAIL, email),
    AsyncStorage.setItem(K.USER_ID, userId),
  ]);
}

export async function getGoogleSession(): Promise<GoogleSession | null> {
  const [token, expiry, email, userId, spreadsheetId] = await Promise.all([
    AsyncStorage.getItem(K.ACCESS_TOKEN),
    AsyncStorage.getItem(K.EXPIRY),
    AsyncStorage.getItem(K.EMAIL),
    AsyncStorage.getItem(K.USER_ID),
    AsyncStorage.getItem(K.SPREADSHEET_ID),
  ]);
  if (!token || !email || !userId) return null;
  return {
    accessToken:   token,
    expiry:        expiry ? parseInt(expiry, 10) || 0 : 0,
    email,
    userId,
    spreadsheetId,
  };
}

export function isTokenExpired(session: GoogleSession): boolean {
  return Date.now() >= session.expiry - 60_000; // 1-minute buffer
}

export async function saveSpreadsheetId(id: string): Promise<void> {
  await AsyncStorage.setItem(K.SPREADSHEET_ID, id);
}

export async function clearGoogleSession(): Promise<void> {
  const sessionKeys = [K.ACCESS_TOKEN, K.EXPIRY, K.EMAIL, K.USER_ID, K.SPREADSHEET_ID];
  await Promise.all(sessionKeys.map(k => AsyncStorage.removeItem(k)));
}

export async function hasMigrated(): Promise<boolean> {
  return (await AsyncStorage.getItem(K.MIGRATED)) === 'true';
}

export async function setMigrated(): Promise<void> {
  await AsyncStorage.setItem(K.MIGRATED, 'true');
}

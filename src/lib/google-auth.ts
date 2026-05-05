const K = {
  ACCESS_TOKEN:   'pf_google_access_token',
  EXPIRY:         'pf_google_expiry',
  EMAIL:          'pf_google_email',
  USER_ID:        'pf_google_user_id',
  SPREADSHEET_ID: 'pf_google_spreadsheet_id',
  NAME:           'pf_google_name',
  PICTURE:        'pf_google_picture',
  MIGRATED:       'pf_migrated',
} as const;

export interface GoogleSession {
  accessToken:   string;
  expiry:        number;
  email:         string;
  userId:        string;
  spreadsheetId: string | null;
  name:          string | null;
  picture:       string | null;
}

export async function saveGoogleSession(
  accessToken: string, expiresIn: number, email: string, userId: string,
  name?: string | null, picture?: string | null,
): Promise<void> {
  const expiry = Date.now() + expiresIn * 1000;
  localStorage.setItem(K.ACCESS_TOKEN, accessToken);
  localStorage.setItem(K.EXPIRY, String(expiry));
  localStorage.setItem(K.EMAIL, email);
  localStorage.setItem(K.USER_ID, userId);
  name    ? localStorage.setItem(K.NAME, name)       : localStorage.removeItem(K.NAME);
  picture ? localStorage.setItem(K.PICTURE, picture) : localStorage.removeItem(K.PICTURE);
}

export async function getGoogleSession(): Promise<GoogleSession | null> {
  const token = localStorage.getItem(K.ACCESS_TOKEN);
  const expiry = localStorage.getItem(K.EXPIRY);
  const email = localStorage.getItem(K.EMAIL);
  const userId = localStorage.getItem(K.USER_ID);
  const spreadsheetId = localStorage.getItem(K.SPREADSHEET_ID);
  const name = localStorage.getItem(K.NAME);
  const picture = localStorage.getItem(K.PICTURE);
  if (!token || !email || !userId) return null;
  return {
    accessToken: token,
    expiry: expiry ? parseInt(expiry, 10) || 0 : 0,
    email, userId, spreadsheetId, name, picture,
  };
}

export function isTokenExpired(session: GoogleSession): boolean {
  return Date.now() >= session.expiry - 60_000;
}

export async function saveSpreadsheetId(id: string): Promise<void> {
  localStorage.setItem(K.SPREADSHEET_ID, id);
}

export async function clearGoogleSession(): Promise<void> {
  [K.ACCESS_TOKEN, K.EXPIRY, K.EMAIL, K.USER_ID, K.SPREADSHEET_ID].forEach(k =>
    localStorage.removeItem(k)
  );
}

export async function hasMigrated(): Promise<boolean> {
  return localStorage.getItem(K.MIGRATED) === 'true';
}

export async function setMigrated(): Promise<void> {
  localStorage.setItem(K.MIGRATED, 'true');
}

const SCOPES = [
  'openid', 'email', 'profile',
  'https://www.googleapis.com/auth/spreadsheets',
].join(' ');

/* ── Google Identity Services types ── */
interface GisTokenResponse {
  access_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}
interface GisTokenClient {
  requestAccessToken: (overrides?: { prompt?: string }) => void;
}
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (cfg: {
            client_id: string;
            scope: string;
            callback: (r: GisTokenResponse) => void;
            error_callback?: (e: { type: string }) => void;
          }) => GisTokenClient;
        };
      };
    };
  }
}

export function openGoogleOAuthPopup(): Promise<{ accessToken: string; expiresIn: number }> {
  return new Promise((resolve, reject) => {
    if (!window.google?.accounts?.oauth2) {
      reject(new Error('Google Identity Services not loaded. Check your internet connection and try again.'));
      return;
    }
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;
    if (!clientId) {
      reject(new Error('VITE_GOOGLE_CLIENT_ID is not set.'));
      return;
    }
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback: (response) => {
        if (response.access_token) {
          resolve({ accessToken: response.access_token, expiresIn: response.expires_in ?? 3600 });
        } else {
          reject(new Error(response.error_description ?? response.error ?? 'Google sign-in failed'));
        }
      },
      error_callback: (err) => {
        if (err.type === 'popup_closed') reject(new Error('Sign-in popup was closed'));
        else reject(new Error(`Sign-in error: ${err.type}`));
      },
    });
    client.requestAccessToken({ prompt: 'consent' });
  });
}

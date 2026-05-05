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

export function openGoogleOAuthPopup(): Promise<{ accessToken: string; expiresIn: number }> {
  return new Promise((resolve, reject) => {
    const clientId   = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;
    const redirectUri = `${window.location.origin}/auth/callback`;
    const url = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(clientId)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=token&` +
      `scope=${encodeURIComponent(SCOPES)}&` +
      `include_granted_scopes=true`;

    const popup = window.open(url, 'google-auth', 'width=500,height=620,left=200,top=100');
    if (!popup) { reject(new Error('Popup blocked. Allow popups for this site.')); return; }

    function onMessage(e: MessageEvent) {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === 'google-oauth') {
        cleanup();
        resolve({ accessToken: e.data.accessToken, expiresIn: e.data.expiresIn });
      } else if (e.data?.type === 'google-oauth-error') {
        cleanup();
        reject(new Error(e.data.error ?? 'Google sign-in failed'));
      }
    }

    const closedTimer = setInterval(() => {
      if (popup.closed) { cleanup(); reject(new Error('Auth popup closed')); }
    }, 500);

    function cleanup() {
      clearInterval(closedTimer);
      window.removeEventListener('message', onMessage);
    }

    window.addEventListener('message', onMessage);
  });
}

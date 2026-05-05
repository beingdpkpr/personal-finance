const SHEETS_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';
const DRIVE_BASE  = 'https://www.googleapis.com/drive/v3/files';
const FOLDER_NAME = 'Artha';

export type TabName = 'Transactions' | 'Budgets' | 'Goals' | 'Recurring' | 'NetWorth' | 'Settings';

export const TAB_HEADERS: Record<TabName, string[]> = {
  Transactions: ['id', 'type', 'amount', 'category', 'description', 'date', 'notes', 'tags', 'recurringId', 'auto'],
  Budgets:      ['catId', 'mode', 'value'],
  Goals:        ['id', 'name', 'target', 'current', 'deadline'],
  Recurring:    ['id', 'type', 'amount', 'category', 'description', 'dayOfMonth'],
  NetWorth:     ['id', 'name', 'type', 'value'],
  Settings:     ['currency_code', 'currency_symbol', 'currency_locale', 'lastSyncedAt'],
};

async function sheetsRequest(
  method: string,
  url: string,
  accessToken: string,
  body?: unknown,
): Promise<unknown> {
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Sheets API ${method} ${res.status}: ${text}`);
  }
  return res.json();
}

/* ── Drive helpers ────────────────────────────────────────────────────────── */

async function driveGet<T>(accessToken: string, params: string): Promise<T | null> {
  try {
    const res = await fetch(`${DRIVE_BASE}?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

export async function findSpreadsheetByName(accessToken: string, name: string): Promise<string | null> {
  const q = `name = '${name.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`;
  const data = await driveGet<{ files: { id: string }[] }>(
    accessToken,
    `q=${encodeURIComponent(q)}&fields=files(id)&pageSize=5`,
  );
  return data?.files?.[0]?.id ?? null;
}

async function findOrCreateFolder(accessToken: string): Promise<string | null> {
  const q = `name = '${FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const data = await driveGet<{ files: { id: string }[] }>(
    accessToken,
    `q=${encodeURIComponent(q)}&fields=files(id)&pageSize=5`,
  );
  if (data?.files?.[0]?.id) return data.files[0].id;

  try {
    const res = await fetch(DRIVE_BASE, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: FOLDER_NAME, mimeType: 'application/vnd.google-apps.folder' }),
    });
    if (!res.ok) return null;
    const folder = await res.json() as { id: string };
    return folder.id;
  } catch {
    return null;
  }
}

async function moveToFolder(accessToken: string, fileId: string, folderId: string): Promise<void> {
  try {
    await fetch(
      `${DRIVE_BASE}/${fileId}?addParents=${folderId}&removeParents=root&fields=id`,
      { method: 'PATCH', headers: { Authorization: `Bearer ${accessToken}` } },
    );
  } catch { /* non-fatal */ }
}

/* ── Spreadsheet lifecycle ────────────────────────────────────────────────── */

export async function createSpreadsheet(accessToken: string, email: string): Promise<string> {
  const body = {
    properties: { title: `Artha - ${email}` },
    sheets: (Object.keys(TAB_HEADERS) as TabName[]).map(title => ({
      properties: { title },
    })),
  };
  const data = await sheetsRequest('POST', SHEETS_BASE, accessToken, body) as { spreadsheetId: string };

  // Best-effort: move into the Artha folder
  const folderId = await findOrCreateFolder(accessToken);
  if (folderId) await moveToFolder(accessToken, data.spreadsheetId, folderId);

  return data.spreadsheetId;
}

export async function verifySpreadsheet(accessToken: string, spreadsheetId: string): Promise<boolean> {
  try {
    const res = await fetch(
      `${SHEETS_BASE}/${spreadsheetId}?fields=spreadsheetId`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    return res.ok;
  } catch {
    return false;
  }
}

export async function writeTab(
  accessToken: string,
  spreadsheetId: string,
  tab: TabName,
  rows: string[][],
): Promise<void> {
  const allRows = [TAB_HEADERS[tab], ...rows];
  const range = `${tab}!A1`;
  await sheetsRequest(
    'POST',
    `${SHEETS_BASE}/${spreadsheetId}/values/${encodeURIComponent(tab)}:clear`,
    accessToken,
  );
  await sheetsRequest(
    'PUT',
    `${SHEETS_BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=RAW`,
    accessToken,
    { range, majorDimension: 'ROWS', values: allRows },
  );
}

export async function readTab(
  accessToken: string,
  spreadsheetId: string,
  tab: TabName,
): Promise<Record<string, string>[]> {
  const data = await sheetsRequest(
    'GET',
    `${SHEETS_BASE}/${spreadsheetId}/values/${encodeURIComponent(tab)}`,
    accessToken,
  ) as { values?: string[][] };
  const rows = data.values ?? [];
  if (rows.length < 2) return [];
  const headers = rows[0];
  return rows.slice(1).map(row =>
    Object.fromEntries(headers.map((h, i) => [h, row[i] ?? ''])),
  );
}

# Google Sheets Backend — Design Spec

**Date:** 2026-04-28

## Problem

All app data (transactions, budgets, goals, etc.) is stored in AsyncStorage on each device. Data does not follow the user across devices or browsers. There is no cloud backup.

## Goal

Replace the local-only storage model with a local-first hybrid: AsyncStorage remains the fast local cache, Google Sheets becomes the cloud source of truth. Data is accessible from any device the user signs into with Google.

## Decisions

| Decision | Choice | Reason |
|---|---|---|
| Cloud backend | Google Sheets | Data visible/editable in familiar spreadsheet UI, free, no server to manage |
| Auth | Sign in with Google (OAuth 2.0) | Required for Sheets API; replaces local username/password |
| Primary store | AsyncStorage (unchanged) | App works offline, fast reads/writes |
| Sync strategy | Write-through queue, flush on reconnect | Offline-first; eventual consistency is fine for personal finance |
| Multi-user | Single user now, extensible | Each Google account gets its own spreadsheet |

---

## Architecture

```
User action
  → AsyncStorage (immediate, local)
  → Sync queue (AsyncStorage: pf_sync_queue)
  → Sheets API (background, when online)
```

On app start / reconnect:
1. Pull latest from Sheets
2. Merge into AsyncStorage (Sheets wins on conflict)
3. Flush pending sync queue to Sheets

---

## Google Sheets Structure

One spreadsheet per user, auto-created on first login. Named: `Personal Finance - {email}`.

### Tabs

**Transactions**
| id | date | amount | type | category | note | createdAt |
|---|---|---|---|---|---|---|
| uuid | 2026-04-28 | 1500 | expense | Food | Lunch | timestamp |

**Budgets**
| category | amount |
|---|---|
| Food | 5000 |

**Goals**
| id | name | target | current | createdAt |
|---|---|---|---|---|

**Recurring**
| id | title | amount | type | category | frequency | nextDate |
|---|---|---|---|---|---|---|

**NetWorth**
| id | label | type | amount | updatedAt |
|---|---|---|---|---|

**Settings**
| currency | lastSyncedAt |
|---|---|
| INR | timestamp |

### Sync Queue (AsyncStorage: `pf_sync_queue`)

```json
[
  { "op": "upsert", "tab": "Transactions", "id": "uuid", "data": { ... } },
  { "op": "delete", "tab": "Transactions", "id": "uuid" }
]
```

Flushed in order on reconnect. Upserts match by `id` column; deletes remove the matching row.

---

## Auth Flow

1. App opens → check `pf_google_token` in AsyncStorage
2. Token valid → load local data, background sync
3. No token → show "Sign in with Google" screen
4. OAuth completes → store access + refresh tokens → create/open spreadsheet → pull Sheets data → merge into AsyncStorage

**Token management:**
- Access token: expires 1 hour, auto-refreshed before each API call using refresh token
- Both tokens stored in AsyncStorage (`pf_google_token`, `pf_google_refresh_token`)
- Sign-out: clear all AsyncStorage keys + revoke token via Google OAuth endpoint

---

## Migration (Existing Users)

On first Google sign-in, if `pf_txns_{username}` exists in AsyncStorage:
1. Push all existing local data to Sheets
2. Re-key local storage to `pf_txns_{googleUserId}`
3. Set `pf_migrated: true` to prevent re-migration

No data is lost during migration.

---

## New Files

| File | Responsibility |
|---|---|
| `lib/google-auth.ts` | Google OAuth flow, token storage, refresh, revoke |
| `lib/sheets.ts` | Sheets API wrapper: read tab, upsert row, delete row |
| `lib/sync.ts` | Sync queue: enqueue, flush, pull-and-merge on startup |

## Modified Files

| File | Change |
|---|---|
| `lib/storage.ts` | After each AsyncStorage write, call `sync.enqueue()` |
| `hooks/useFinance.ts` | Replace local auth with `google-auth`, call `sync.pullAndMerge()` on login |
| `app/(auth)/login.tsx` | Replace username/password form with "Sign in with Google" button |
| `app/(auth)/register.tsx` | Remove — Google handles account creation |

---

## Offline Behavior

- All reads/writes work normally offline (AsyncStorage)
- Sync queue accumulates while offline
- On reconnect (detected via `expo-network` / `@react-native-community/netinfo`), queue is flushed and latest Sheets data is pulled
- User sees a subtle sync status indicator (e.g., last synced timestamp in settings)

---

## Verification

1. Sign in with Google on device → spreadsheet auto-created in Google Drive
2. Add a transaction → appears in Transactions tab within seconds
3. Turn off internet → add more transactions → they save locally
4. Reconnect → new transactions appear in Sheets
5. Open app in browser (GitHub Pages) with same Google account → same data visible
6. Edit a transaction in Sheets directly → on next app start, change is reflected in app

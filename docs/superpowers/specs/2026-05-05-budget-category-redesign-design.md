# Budget Category Redesign — Design Spec

**Date:** 2026-05-05  
**Status:** Approved

---

## Goal

Restructure the budgeting system so that budgets are maintained at the **Group** level (Needs, Wants, Savings, Family) rather than the current flat category level. Detailed categories (Food & Dining, Transport, etc.) become sub-units used for transaction tagging and analytics — not for setting budgets.

---

## Naming Conventions

| Term | Definition |
|---|---|
| **Group** | One of 4 top-level budget units: Needs, Wants, Savings, Family |
| **Category** | A user-defined item under a Group (e.g., Food & Dining under Needs) |
| **Budget** | A single budget entry per Group (fixed amount or % of income) |

---

## Data Model

### Group

```ts
type Group = 'needs' | 'wants' | 'savings' | 'family';
```

Replaces the current `CatGroup` type. `'essentials'` is renamed to `'needs'`.

Display labels:
- `needs` → "Needs"
- `wants` → "Wants"
- `savings` → "Savings"
- `family` → "Family"

### Category (new entity)

```ts
interface Category {
  id: string;       // stable ID, UUID for custom, slug for seeded
  label: string;    // e.g., 'Food & Dining'
  group: Group;     // which budget group it belongs to
  color: string;    // hex color for charts and tags
  isCustom?: boolean;
}
```

Replaces `ExpenseCat`, `IncomeCat`, and `SubCategory`. Stored in `pf_cats_{user}` (localStorage) and synced to a `Categories` tab in Google Sheets (`id, label, group, color`).

### Transaction (field meaning changes)

```ts
interface Transaction {
  // ...existing fields...
  group: Group;          // was: category (CatGroup value)
  category?: string;     // was: subCategory — now stores Category.id
}
```

On sync (`sheets.ts`): transaction row headers updated from `['category', 'subCategory']` to `['group', 'category']`.

### BudgetMap (keyed by Group)

```ts
type BudgetMap = { [g in Group]?: BudgetEntry };
```

Same `BudgetEntry` shape (`mode: 'fixed' | 'pct'`, `value: number`). Max 4 entries.

---

## Seeded Default Categories

Applied on first load if no categories exist:

| Group | Default Categories |
|---|---|
| Needs | Food & Dining, Transport, Health, Essentials |
| Wants | Entertainment, Shopping, Other |
| Savings | Savings & Investments |
| Family | Family & Commitments |

---

## Category Setup Screen

A settings screen (accessible from Settings nav) for one-time category configuration.

- Four collapsible sections, one per Group
- Each section lists its categories (label + color dot) with edit and delete controls
- "Add category" button per group: inline form with label input + color picker
- Changes persist immediately to localStorage and sync to Sheets

---

## Budget Page

Replaces the current 9-card layout with **4 Group cards** (Needs, Wants, Savings, Family).

Each card displays:
- Group name and budget (fixed or % of income)
- Progress bar color-coded by utilization (green < 70%, amber 70–89%, red ≥ 90%)
- Spent this month vs. budget limit + remaining
- Expandable read-only breakdown of spending by Category within the group

Edit mode per card: fixed/% of income toggle, amount input, save/cancel/delete — same UX as today.

---

## Transaction Entry (Add/Edit Modal)

Two-step category selection for expense transactions:

1. **Group selector** — 4 option buttons (Needs, Wants, Savings, Family)
2. **Category selector** — appears after group selection; lists categories for that group; optional (can be skipped)

Income transactions: the group/category picker is hidden entirely. Income transactions are identified by `type: 'income'` and are not assigned a Group. Their category picker (Salary, Freelance, Other) remains a flat single-step select, unchanged from today.

On edit: both `group` and `category` fields pre-populate from the stored transaction.

---

## Analytics

### Group level
- Donut/bar chart of spending across Needs / Wants / Savings / Family
- Budget utilization per group (spent vs. limit)
- Shown on Dashboard summary and Analytics page

### Category level
- Drill-down within a selected group
- Bar chart or list of spending per Category, with % of group total
- Available on Analytics page

---

## Migration Strategy

Runs once on app load, gated by a version flag (`pf_data_version` in localStorage, value `'2'`).

### Transactions
- `category` field value is mapped to a Group:
  - `food`, `essentials`, `transport`, `health` → `needs`
  - `entertainment`, `shopping`, `other` → `wants`
  - `savings` → `savings`
  - `family` → `family`
- Mapped value stored in new `group` field
- Old `category` value moved to new `category` field (now meaning sub-category)
- Old `subCategory` value discarded (was free-text, now superseded)

### Budgets
- Existing per-category budgets are discarded (they were set at a level that no longer exists)
- User re-enters 4 group-level budgets after upgrade

### Categories
- Default categories are seeded (see above) if `pf_cats_{user}` is empty

---

## Google Sheets Sync Changes

| Tab | Change |
|---|---|
| `Transactions` | Headers: `category` → `group`, `subCategory` → `category` |
| `Budgets` | Headers: `catId` → `group` (values are now Group IDs) |
| `Categories` (new) | Headers: `id, label, group, color` |

`CustomCategories` tab is removed — superseded by `Categories`.

---

## Out of Scope

- Income categories are not restructured (Salary, Freelance, Other remain flat)
- Per-category budget limits (budgets are group-level only)
- Recurring transactions: `group` and `category` fields are added with the same schema change as regular transactions; migration applies the same category-to-group mapping on existing recurring records
- `CustomCategories` Sheets tab is not deleted on app load — it is left in place and ignored; removed from `pushAll` so it is no longer written going forward

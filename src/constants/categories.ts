import type { Category, Group, IncomeCat } from '../lib/data';

export const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
export const MONTHS_FULL = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

export const INCOME_CATS: IncomeCat[] = [
  { id: 'salary',    label: 'Salary / Wages', color: '#2ed18a' },
  { id: 'freelance', label: 'Freelance',       color: '#5a9fff' },
  { id: 'other',     label: 'Other Income',    color: '#a07aff' },
];

// Seeded defaults — used when a user has no categories yet.
// IDs match the old EXPENSE_CATS ids so migrated transactions link up correctly.
export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'essentials',    label: 'Essentials',           color: '#5a9fff', group: 'needs'   },
  { id: 'food',          label: 'Food & Dining',         color: '#f0b030', group: 'needs'   },
  { id: 'transport',     label: 'Transport',             color: '#a07aff', group: 'needs'   },
  { id: 'health',        label: 'Health',                color: '#2ed18a', group: 'needs'   },
  { id: 'family',        label: 'Family & Commitments',  color: '#60d0e0', group: 'family'  },
  { id: 'savings',       label: 'Savings & Investments', color: '#f0722a', group: 'savings' },
  { id: 'entertainment', label: 'Entertainment',         color: '#f05060', group: 'wants'   },
  { id: 'shopping',      label: 'Shopping',              color: '#ff7eb3', group: 'wants'   },
  { id: 'other',         label: 'Other',                 color: '#8888aa', group: 'wants'   },
];

// Maps old category IDs to the new Group they belong to.
// Used during the one-time migration in src/lib/migration.ts.
export const CAT_TO_GROUP: Record<string, Group> = {
  essentials:    'needs',
  food:          'needs',
  transport:     'needs',
  health:        'needs',
  family:        'family',
  savings:       'savings',
  entertainment: 'wants',
  shopping:      'wants',
  other:         'wants',
};

const CAT_COLORS = ['#f0722a','#5a9fff','#2ed18a','#a07aff','#f05060','#f0b030','#60d0e0','#ff7eb3','#8888aa'];
export function nextCatColor(existing: Category[]): string {
  return CAT_COLORS[existing.length % CAT_COLORS.length];
}

export const CURRENCIES = [
  { code: 'INR', symbol: '₹',    locale: 'en-IN' },
  { code: 'USD', symbol: '$',    locale: 'en-US' },
  { code: 'EUR', symbol: '€',    locale: 'de-DE' },
  { code: 'GBP', symbol: '£',    locale: 'en-GB' },
  { code: 'JPY', symbol: '¥',    locale: 'ja-JP' },
  { code: 'AED', symbol: 'د.إ', locale: 'ar-AE' },
  { code: 'SGD', symbol: 'S$',   locale: 'en-SG' },
] as const;

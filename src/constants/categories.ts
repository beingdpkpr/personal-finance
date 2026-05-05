export const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
export const MONTHS_FULL = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

export const EXPENSE_CATS = [
  { id: 'essentials',    label: 'Essentials',           color: '#5a9fff', group: 'essentials' as const },
  { id: 'food',          label: 'Food & Dining',         color: '#f0b030', group: 'essentials' as const },
  { id: 'transport',     label: 'Transport',             color: '#a07aff', group: 'essentials' as const },
  { id: 'health',        label: 'Health',                color: '#2ed18a', group: 'essentials' as const },
  { id: 'family',        label: 'Family & Commitments',  color: '#60d0e0', group: 'family'     as const },
  { id: 'savings',       label: 'Savings & Investments', color: '#f0722a', group: 'savings'    as const },
  { id: 'entertainment', label: 'Entertainment',         color: '#f05060', group: 'wants'      as const },
  { id: 'shopping',      label: 'Shopping',              color: '#ff7eb3', group: 'wants'      as const },
  { id: 'other',         label: 'Other',                 color: '#8888aa', group: 'wants'      as const },
];

export const INCOME_CATS = [
  { id: 'salary',    label: 'Salary / Wages', color: '#2ed18a' },
  { id: 'freelance', label: 'Freelance',      color: '#5a9fff' },
  { id: 'other',     label: 'Other Income',   color: '#a07aff' },
] as const;

export const CURRENCIES = [
  { code: 'INR', symbol: '₹',    locale: 'en-IN' },
  { code: 'USD', symbol: '$',    locale: 'en-US' },
  { code: 'EUR', symbol: '€',    locale: 'de-DE' },
  { code: 'GBP', symbol: '£',    locale: 'en-GB' },
  { code: 'JPY', symbol: '¥',    locale: 'ja-JP' },
  { code: 'AED', symbol: 'د.إ', locale: 'ar-AE' },
  { code: 'SGD', symbol: 'S$',   locale: 'en-SG' },
] as const;

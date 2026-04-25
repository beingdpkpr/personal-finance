import { Currency } from './data';

let __curr: Currency = { code: 'INR', symbol: '₹', locale: 'en-IN' };

export function setCurrency(c: Currency): void { __curr = c; }
export function getCurrency(): Currency { return __curr; }

export function fmt(n: number | null | undefined): string {
  if (n === undefined || n === null) return __curr.symbol + '0';
  const abs = Math.abs(n);
  const str =
    abs >= 1e5
      ? (abs / 1e5).toFixed(2).replace(/\.?0+$/, '') + 'L'
      : abs.toLocaleString(__curr.locale);
  return (n < 0 ? '-' : '') + __curr.symbol + str;
}

export function fmtFull(n: number | null | undefined): string {
  if (n === undefined || n === null) return __curr.symbol + '0';
  return (n < 0 ? '-' : '') + __curr.symbol + Math.abs(n).toLocaleString(__curr.locale);
}

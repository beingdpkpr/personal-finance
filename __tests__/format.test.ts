import { fmt, fmtFull, setCurrency, getCurrency } from '../lib/format';
import { Currency } from '../lib/data';

const INR: Currency = { code: 'INR', symbol: '₹', locale: 'en-IN' };
const USD: Currency = { code: 'USD', symbol: '$', locale: 'en-US' };

beforeEach(() => setCurrency(INR));

describe('fmt', () => {
  it('returns symbol+0 for null', () => expect(fmt(null as any)).toBe('₹0'));
  it('returns symbol+0 for undefined', () => expect(fmt(undefined as any)).toBe('₹0'));
  it('formats zero', () => expect(fmt(0)).toBe('₹0'));
  it('formats small positive', () => expect(fmt(500)).toBe('₹500'));
  it('formats negative', () => expect(fmt(-500)).toBe('-₹500'));
  it('abbreviates lakhs', () => expect(fmt(100000)).toBe('₹1L'));
  it('abbreviates 1.5L', () => expect(fmt(150000)).toBe('₹1.5L'));
  it('strips trailing zeros in lakh abbreviation', () => expect(fmt(200000)).toBe('₹2L'));
});

describe('fmtFull', () => {
  it('returns symbol+0 for null', () => expect(fmtFull(null as any)).toBe('₹0'));
  it('formats without abbreviation', () => {
    setCurrency(USD);
    expect(fmtFull(100000)).toBe('$100,000');
  });
  it('formats negative', () => expect(fmtFull(-1000)).toBe('-₹1,000'));
});

describe('getCurrency', () => {
  it('returns current currency', () => {
    setCurrency(USD);
    expect(getCurrency().code).toBe('USD');
  });
});

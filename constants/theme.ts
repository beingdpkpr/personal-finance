export const lightColors = {
  bg:        '#eaecf8',
  surface:   '#ffffff',
  surface2:  '#f2f4fc',
  border:    '#e0e4f2',
  text:      '#0d1030',
  muted:     '#8891b0',
  accent:    '#f0722a',
  accentDim: 'rgba(240,114,42,0.10)',
  green:     '#18c97a',
  greenDim:  'rgba(24,201,122,0.10)',
  red:       '#f03d50',
  redDim:    'rgba(240,61,80,0.10)',
  blue:      '#4f88ff',
  purple:    '#9b6fff',
  yellow:    '#f0a820',
  navBg:     '#1a1d2e',
  glass:       'rgba(255,255,255,0.06)',
  glassBorder: 'rgba(255,255,255,0.10)',
  glassStrong: 'rgba(255,255,255,0.09)',
  glowPurple:  'rgba(159,110,255,0.22)',
  glowBlue:    'rgba(79,136,255,0.18)',
  glowGreen:   'rgba(46,209,138,0.15)',
};

export const darkColors = {
  bg:        '#0b0c14',
  surface:   '#13141f',
  surface2:  '#1c1d2e',
  border:    '#252640',
  text:      '#e4e5f0',
  muted:     '#6b6c8a',
  accent:    '#f0722a',
  accentDim: 'rgba(240,114,42,0.13)',
  green:     '#2ed18a',
  greenDim:  'rgba(46,209,138,0.12)',
  red:       '#f05060',
  redDim:    'rgba(240,80,96,0.12)',
  blue:      '#5a9fff',
  purple:    '#a07aff',
  yellow:    '#f0b030',
  navBg:     '#252640',
  glass:       'rgba(255,255,255,0.06)',
  glassBorder: 'rgba(255,255,255,0.10)',
  glassStrong: 'rgba(255,255,255,0.09)',
  glowPurple:  'rgba(159,110,255,0.22)',
  glowBlue:    'rgba(79,136,255,0.18)',
  glowGreen:   'rgba(46,209,138,0.15)',
};

export type Colors = typeof lightColors;
// Static alias – only for legacy usages; prefer useColors() hook
export const colors = lightColors;

export const radius = { sm: 6, md: 10, lg: 14, xl: 20, pill: 100 };
export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
export const SIDEBAR_W = 230;
export const WIDE_BREAKPOINT = 768;

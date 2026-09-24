// src/theme.js
// Shared design tokens — matches the shield / flame / AI logo palette.

export const colors = {
  bg: '#0B1220',
  surface: '#141C2F',
  surfaceAlt: '#1B2540',
  border: '#26314D',

  flame: '#FF5A36',
  flameDeep: '#FF3D1A',
  glow: '#5EEAD4',

  safe: '#34D399',
  warn: '#FBBF24',
  danger: '#FF5A36',
  critical: '#FF3D1A',

  textPrimary: '#F4F6FB',
  textSecondary: '#8B93A7',
  textMuted: '#5B637A',
};

export const riskColors = {
  CRITICAL: { fg: colors.critical, bg: 'rgba(255,61,26,0.16)' },
  HIGH: { fg: colors.flame, bg: 'rgba(255,90,54,0.14)' },
  MEDIUM: { fg: colors.warn, bg: 'rgba(251,191,36,0.14)' },
  LOW: { fg: colors.safe, bg: 'rgba(52,211,153,0.14)' },
  default: { fg: colors.textSecondary, bg: colors.surfaceAlt },
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
export const radius = { sm: 8, md: 14, lg: 20, pill: 999 };

export const type = {
  hero: { fontSize: 44, fontWeight: '800', letterSpacing: -1 },
  h1: { fontSize: 24, fontWeight: '700', letterSpacing: -0.4 },
  h2: { fontSize: 18, fontWeight: '700', letterSpacing: -0.2 },
  body: { fontSize: 15, fontWeight: '400' },
  label: { fontSize: 13, fontWeight: '500' },
  small: { fontSize: 12, fontWeight: '400' },
};

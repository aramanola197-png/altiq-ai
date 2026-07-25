/**
 * ALTIQ AI Brand Colors — light glassmorphism aesthetic
 * Light Ash base page, dark text, white cards, ash accents.
 */
export const colors = {
  black: '#111111',
  charcoal: '#232323',
  ash: '#A7A7A7',
  lightAsh: '#D9D9D9',
  white: '#FFFFFF',
  // Page canvas (approved base)
  page: '#ECECEC',
} as const;

/** Glass surfaces: ash-tinted over light background */
export const glassTint = 'rgba(255, 255, 255, 0.72)';
export const glassBorder = 'rgba(167, 167, 167, 0.35)';
export const glassShadow = '0 8px 32px rgba(0, 0, 0, 0.08)';

export type BrandColor = keyof typeof colors;

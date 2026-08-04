import { glassTint, glassBorder, glassShadow } from './colors';
import { radius } from './radius';

export const glassStyle = {
  backgroundColor: glassTint,
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: `1px solid ${glassBorder}`,
  boxShadow: glassShadow,
} as const;

export const glassCardStyle = {
  ...glassStyle,
  borderRadius: radius.card,
} as const;

export const glassPanelStyle = {
  ...glassStyle,
  borderRadius: radius.panel,
} as const;

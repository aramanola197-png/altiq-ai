/**
 * ALTIQ AI Motion Language
 * Calm, intentional, smooth easing only. No playful bounce.
 */
export const transitions = {
  default: 'all 0.25s ease',
  hover: 'transform 0.3s ease, background-color 0.2s ease',
  drawer: 'transform 0.3s ease',
  faq: 'max-height 0.3s ease, opacity 0.3s ease',
} as const;

export const hoverLift = 'hover:-translate-y-1 transition-transform duration-300';

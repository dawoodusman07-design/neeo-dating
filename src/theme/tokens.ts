/**
 * Neeo design tokens — the ONLY place colour literals may appear in src/.
 * Enforced by eslint (no-restricted-syntax) and scripts/check-tokens.mjs.
 */
export const color = {
  light: {
    bg: '#FFFAFD',
    surface: '#FFFFFF',
    tint: '#F6EDF3',
    chip: '#FBE7EF',
    text: '#2D1D2B',
    textMuted: '#6E5A69',
    border: '#EBDDE6',
    action: '#BD2858',
    actionPressed: '#9E1F49',
    brandDeep: '#74315B',
    success: '#15803D',
    danger: '#B91C1C',
    onAction: '#FFFFFF',
    // Supporting tokens (not in the original brief, needed for a11y):
    scrim: 'rgba(20, 10, 18, 0.72)', // dark scrim behind text on photos
    onPhoto: '#FFFFFF',
    overlay: 'rgba(20, 10, 18, 0.45)', // sheet backdrop
    focus: '#74315B',
  },
  dark: {
    bg: '#1A1219',
    surface: '#24192A',
    tint: '#2E2233',
    chip: '#3A2433',
    text: '#F6EDF3',
    textMuted: '#BBA9B6',
    border: '#3A2D3A',
    action: '#E0577F',
    actionPressed: '#C94770',
    brandDeep: '#D99BC0',
    success: '#4ADE80',
    danger: '#F87171',
    onAction: '#1A1219',
    scrim: 'rgba(10, 5, 9, 0.75)',
    onPhoto: '#FFFFFF',
    overlay: 'rgba(0, 0, 0, 0.6)',
    focus: '#D99BC0',
  },
} as const;

export type ColorScheme = keyof typeof color;
export type Palette = { [K in keyof (typeof color)['light']]: string };

/** 8pt grid */
export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48 } as const;
export const radius = { sm: 8, md: 12, lg: 20, pill: 999 } as const;
export const type = { xs: 12, sm: 13, md: 15, lg: 17, xl: 20, '2xl': 26, '3xl': 30 } as const;

/** Inter weights loaded in src/app/_layout.tsx */
export const font = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
} as const;

export const motion = {
  likePass: 220, // ms ease-out
  matchScaleIn: 280,
} as const;

export const size = {
  hit: 44, // minimum touch target
  buttonPrimary: 52,
  passButton: 56,
  iconTab: 22,
  iconRow: 20,
  iconStroke: 1.75,
} as const;

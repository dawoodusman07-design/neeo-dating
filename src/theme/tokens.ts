/**
 * Neeo design tokens — the ONLY place colour literals may appear in src/.
 * Enforced by eslint (no-restricted-syntax) and scripts/check-tokens.mjs.
 */
/** Palette: "Terracotta and sand" (2026-11-17). */
export const color = {
  light: {
    bg: '#FBF7F2', // sand
    surface: '#FFFFFF',
    tint: '#F4ECE4',
    chip: '#F6E7DE',
    text: '#2A211C',
    textMuted: '#6A5A50',
    border: '#EADDD2',
    action: '#A8432A', // terracotta: primary buttons, like button, heart
    actionPressed: '#8E3622',
    brandDeep: '#7A2F1D',
    /** Sage green: verified badge, new/unread markers, match highlight. Text-safe (≥4.5:1). */
    accent: '#2F6B5E',
    success: '#147839', // brief: #15803D (4.16:1 on chip, 4.29:1 on tint); 6% darker to pass AA 4.5:1 on every surface
    danger: '#B91C1C', // always paired with an icon + text (warm red, close to terracotta)
    onAction: '#FFFFFF',
    // Supporting tokens (a11y):
    scrim: 'rgba(26, 18, 14, 0.72)', // warm dark scrim behind text on photos
    onPhoto: '#FFFFFF',
    overlay: 'rgba(26, 18, 14, 0.45)', // sheet backdrop
    focus: '#7A2F1D',
  },
  dark: {
    bg: '#1A1411',
    surface: '#241C18',
    tint: '#2C221D',
    chip: '#3A2A23',
    text: '#F5EDE7',
    textMuted: '#BFAEA3',
    border: '#3A2E28',
    action: '#E8896C',
    actionPressed: '#D9745A',
    brandDeep: '#F2B8A4',
    accent: '#6FBFAE',
    success: '#4ADE80',
    danger: '#F87171',
    onAction: '#1A1411',
    scrim: 'rgba(12, 8, 6, 0.75)',
    onPhoto: '#FFFFFF',
    overlay: 'rgba(0, 0, 0, 0.6)',
    focus: '#F2B8A4',
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
  /** Web: the app renders in a centred phone-width column; outside it is `bg`. */
  appMaxWidth: 480,
} as const;

import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { color, font, motion, radius, size, space, type, type ColorScheme, type Palette } from './tokens';
import { useSettings } from '@/stores/settings';

export type Theme = {
  scheme: ColorScheme;
  c: Palette;
  space: typeof space;
  radius: typeof radius;
  type: typeof type;
  font: typeof font;
  motion: typeof motion;
  size: typeof size;
};

const ThemeContext = createContext<Theme | null>(null);

export function makeTheme(scheme: ColorScheme): Theme {
  return { scheme, c: color[scheme], space, radius, type, font, motion, size };
}

/** Follows the system setting unless the user picked an in-app override. */
export function ThemeProvider({ children, forceScheme }: { children: React.ReactNode; forceScheme?: ColorScheme }) {
  const system = useColorScheme();
  const override = useSettings((s) => s.themeOverride);
  const scheme: ColorScheme =
    forceScheme ?? (override === 'system' ? (system === 'dark' ? 'dark' : 'light') : override);
  const value = useMemo(() => makeTheme(scheme), [scheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const t = useContext(ThemeContext);
  return t ?? makeTheme('light');
}

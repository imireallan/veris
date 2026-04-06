import type { ThemeConfig, ThemeContextValue } from "~/types";
import { createContext, useContext, useEffect, useState } from "react";

/* ─────────────── default fallback theme ─────────────── */
const DEFAULT_THEME: ThemeConfig = {
  primary: "16 185 129",
  primaryForeground: "255 255 255",
  secondary: "59 130 246",
  secondaryForeground: "255 255 255",
  accent: "245 158 11",
  accentForeground: "0 0 0",
  background: "250 250 250",
  foreground: "15 23 42",
  muted: "241 245 249",
  mutedForeground: "100 116 139",
  card: "255 255 255",
  cardForeground: "15 23 42",
  border: "226 232 240",
  destructive: "239 68 68",
  destructiveForeground: "255 255 255",
  success: "34 197 94",
};

/* ─────────────── apply CSS custom properties ─────────────── */
function applyThemeVars(theme: ThemeConfig) {
  const root = document.documentElement;
  const vars: Record<string, string> = {
    "--color-primary": theme.primary,
    "--color-primary-foreground": theme.primaryForeground,
    "--color-secondary": theme.secondary,
    "--color-secondary-foreground": theme.secondaryForeground,
    "--color-accent": theme.accent,
    "--color-accent-foreground": theme.accentForeground,
    "--color-background": theme.background,
    "--color-foreground": theme.foreground,
    "--color-muted": theme.muted,
    "--color-muted-foreground": theme.mutedForeground,
    "--color-card": theme.card,
    "--color-card-foreground": theme.cardForeground,
    "--color-border": theme.border,
    "--color-destructive": theme.destructive,
    "--color-destructive-foreground": theme.destructiveForeground,
    "--color-success": theme.success,
  };
  for (const [k, v] of Object.entries(vars)) {
    root.style.setProperty(k, v);
  }
}

/* ─────────────── context + provider ─────────────── */
const ThemeContext = createContext<ThemeContextValue>({
  theme: DEFAULT_THEME,
  setTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

interface ThemeProviderProps {
  initialTheme?: ThemeConfig;
  children: any;
}

export function ThemeProvider({ initialTheme, children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeConfig>(initialTheme ?? DEFAULT_THEME);

  useEffect(() => {
    applyThemeVars(theme);
  }, [theme]);

  const setTheme = (partial: Partial<ThemeConfig>) => {
    setThemeState((prev) => ({ ...prev, ...partial }));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}


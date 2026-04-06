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
    "--color-primary": `rgb(${theme.primary})`,
    "--color-primary-foreground": `rgb(${theme.primaryForeground})`,
    "--color-secondary": `rgb(${theme.secondary})`,
    "--color-secondary-foreground": `rgb(${theme.secondaryForeground})`,
    "--color-accent": `rgb(${theme.accent})`,
    "--color-accent-foreground": `rgb(${theme.accentForeground})`,
    "--color-background": `rgb(${theme.background})`,
    "--color-foreground": `rgb(${theme.foreground})`,
    "--color-muted": `rgb(${theme.muted})`,
    "--color-muted-foreground": `rgb(${theme.mutedForeground})`,
    "--color-card": `rgb(${theme.card})`,
    "--color-card-foreground": `rgb(${theme.cardForeground})`,
    "--color-border": `rgb(${theme.border})`,
    "--color-destructive": `rgb(${theme.destructive})`,
    "--color-destructive-foreground": `rgb(${theme.destructiveForeground})`,
    "--color-success": `rgb(${theme.success})`,
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


import type { ThemeConfig, ThemeContextValue } from "~/types";
import { createContext, useContext, useEffect, useState } from "react";

/* ─────────────── default fallback theme ─────────────── */
const DEFAULT_THEME: ThemeConfig = {
  primary: "160 84% 39%",        /* emerald-500 */
  primaryForeground: "0 0% 100%",
  secondary: "210 40% 96.1%",
  secondaryForeground: "222.2 47.4% 11.2%",
  accent: "38 92% 50%",          /* amber-500 */
  accentForeground: "0 0% 0%",
  background: "0 0% 100%",
  foreground: "222.2 84% 4.9%",
  muted: "210 40% 96.1%",
  mutedForeground: "215.4 16.3% 46.9%",
  card: "0 0% 100%",
  cardForeground: "222.2 84% 4.9%",
  border: "214.3 31.8% 91.4%",
  destructive: "0 84.2% 60.2%",
  destructiveForeground: "0 0% 100%",
  success: "142 76% 36%",        /* green-600 */
};

/* ─────────────── apply CSS custom properties (HSL values) ─────────────── */
function applyThemeVars(theme: ThemeConfig) {
  const root = document.documentElement;
  const vars: Record<string, string> = {
    "--primary-hsl": theme.primary,
    "--primary-foreground-hsl": theme.primaryForeground,
    "--secondary-hsl": theme.secondary,
    "--secondary-foreground-hsl": theme.secondaryForeground,
    "--accent-hsl": theme.accent,
    "--accent-foreground-hsl": theme.accentForeground,
    "--background-hsl": theme.background,
    "--foreground-hsl": theme.foreground,
    "--muted-hsl": theme.muted,
    "--muted-foreground-hsl": theme.mutedForeground,
    "--card-hsl": theme.card,
    "--card-foreground-hsl": theme.cardForeground,
    "--border-hsl": theme.border,
    "--input-hsl": theme.border, // input uses same as border
    "--ring-hsl": theme.primary, // ring uses primary
    "--destructive-hsl": theme.destructive,
    "--destructive-foreground-hsl": theme.destructiveForeground,
    "--success-hsl": theme.success,
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
  children: React.ReactNode;
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

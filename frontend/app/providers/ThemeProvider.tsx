     1|import type { ThemeConfig, ThemeContextValue } from "~/types";
     2|
     3|/* ─────────────── default fallback theme ─────────────── */
     4|const DEFAULT_THEME: ThemeConfig = {
     5|  primary: "16 185 129",
     6|  primaryForeground: "255 255 255",
     7|  secondary: "59 130 246",
     8|  secondaryForeground: "255 255 255",
     9|  accent: "245 158 11",
    10|  accentForeground: "0 0 0",
    11|  background: "250 250 250",
    12|  foreground: "15 23 42",
    13|  muted: "241 245 249",
    14|  mutedForeground: "100 116 139",
    15|  card: "255 255 255",
    16|  cardForeground: "15 23 42",
    17|  border: "226 232 240",
    18|  destructive: "239 68 68",
    19|  destructiveForeground: "255 255 255",
    20|  success: "34 197 94",
    21|};
    22|
    23|/* ─────────────── apply CSS custom properties ─────────────── */
    24|function applyThemeVars(theme: ThemeConfig) {
    25|  const root = document.documentElement;
    26|  const vars: Record<string, string> = {
    27|    "--color-primary": theme.primary,
    28|    "--color-primary-foreground": theme.primaryForeground,
    29|    "--color-secondary": theme.secondary,
    30|    "--color-secondary-foreground": theme.secondaryForeground,
    31|    "--color-accent": theme.accent,
    32|    "--color-accent-foreground": theme.accentForeground,
    33|    "--color-background": theme.background,
    34|    "--color-foreground": theme.foreground,
    35|    "--color-muted": theme.muted,
    36|    "--color-muted-foreground": theme.mutedForeground,
    37|    "--color-card": theme.card,
    38|    "--color-card-foreground": theme.cardForeground,
    39|    "--color-border": theme.border,
    40|    "--color-destructive": theme.destructive,
    41|    "--color-destructive-foreground": theme.destructiveForeground,
    42|    "--color-success": theme.success,
    43|  };
    44|  for (const [k, v] of Object.entries(vars)) {
    45|    root.style.setProperty(k, v);
    46|  }
    47|}
    48|
    49|/* ─────────────── context + provider ─────────────── */
    50|import { createContext, useContext, useEffect, useState } from "react";
    51|
    52|const ThemeContext = createContext<ThemeContextValue>({
    53|  theme: DEFAULT_THEME,
    54|  setTheme: () => {},
    55|});
    56|
    57|export function useTheme() {
    58|  return useContext(ThemeContext);
    59|}
    60|
    61|export function ThemeProvider({
    62|  initialTheme,
    63|  children,
    64|}: {
    65|  initialTheme?: ThemeConfig;
    66|  children: React.ReactNode;
    67|}) {
    68|  const [theme, setThemeState] = useState<ThemeConfig>(
    69|    initialTheme ?? DEFAULT_THEME
    70|  );
    71|
    72|  useEffect(() => {
    73|    applyThemeVars(theme);
    74|  }, [theme]);
    75|
    76|  const setTheme = (partial: Partial<ThemeConfig>) => {
    77|    setThemeState((prev) => ({ ...prev, ...partial }));
    78|  };
    79|
    80|  return (
    81|    <ThemeContext.Provider value={{ theme, setTheme }}>
    82|      {children}
    83|    </ThemeContext.Provider>
    84|  );
    85|}
    86|
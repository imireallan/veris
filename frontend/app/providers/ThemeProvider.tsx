import type { ThemeConfig, ThemeContextValue } from "~/types";
import { createContext, useContext, useEffect, useState, useRef } from "react";

import { getThemeCssVars } from "~/lib/theme-vars";

/* ─────────────── default fallback theme ─────────────── */
const DEFAULT_THEME: ThemeConfig = {
  // Primary colors
  primary: "160 84% 39%",        /* emerald-500 */
  primary_foreground: "0 0% 100%",
  secondary: "210 40% 96.1%",
  secondary_foreground: "222.2 47.4% 11.2%",
  accent: "38 92% 50%",          /* amber-500 */
  accent_foreground: "0 0% 0%",
  
  // Surface colors
  background: "0 0% 100%",
  foreground: "222.2 84% 4.9%",
  muted: "210 40% 96.1%",
  muted_foreground: "215.4 16.3% 46.9%",
  card: "0 0% 100%",
  card_foreground: "222.2 84% 4.9%",
  
  // State colors
  border: "214.3 31.8% 91.4%",
  destructive: "0 84.2% 60.2%",
  destructive_foreground: "0 0% 100%",
  success: "142 76% 36%",        /* green-600 */
  
  // Branding
  logo_url: undefined,
  favicon_url: undefined,
  font_family: undefined,
  button_radius: undefined,
  custom_css: undefined,
};

/* ─────────────── apply CSS custom properties (HSL values) ─────────────── */
function applyThemeVars(theme: ThemeConfig) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  const isDark = root.classList.contains("dark");
  const vars = getThemeCssVars(theme, isDark);

  for (const [k, v] of Object.entries(vars)) {
    root.style.setProperty(k, v);
  }

  if (theme.font_family) {
    root.style.setProperty("--font-sans", theme.font_family);
  }

  if (theme.button_radius !== undefined) {
    root.style.setProperty("--radius", `${theme.button_radius}px`);
  }
}

/* ─────────────── apply branding (favicon, custom CSS) ─────────────── */
function applyBranding(theme: ThemeConfig) {
  if (typeof document === "undefined") return;
  
  const root = document.documentElement;
  const isDark = root.classList.contains("dark");
  
  // Apply favicon
  if (theme.favicon_url) {
    let link = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = theme.favicon_url;
  }
  
  // Apply custom CSS
  const activeCustomCss = isDark
    ? (theme.custom_css_dark || theme.custom_css || "")
    : (theme.custom_css || "");

  let style = document.getElementById("custom-theme-css");
  if (!style) {
    style = document.createElement("style");
    style.id = "custom-theme-css";
    document.head.appendChild(style);
  }
  style.textContent = activeCustomCss;
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
  const hasAppliedInitialRef = useRef(false);

  // Apply initial theme synchronously before first render (SSR-safe)
  if (initialTheme && typeof document !== "undefined" && !hasAppliedInitialRef.current) {
    applyThemeVars(initialTheme);
    applyBranding(initialTheme);
    hasAppliedInitialRef.current = true;
  }

  // Apply theme changes after initial render
  useEffect(() => {
    if (hasAppliedInitialRef.current) {
      applyThemeVars(theme);
      applyBranding(theme);
    }
  }, [theme]);

  // Re-apply theme when dark mode changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      applyThemeVars(theme);
      applyBranding(theme);
    });
    
    if (typeof document !== "undefined") {
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      });
    }
    
    return () => observer.disconnect();
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

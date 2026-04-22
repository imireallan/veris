import type { ThemeConfig } from "~/types";

const DEFAULT_DARK_VARS = {
  background: "222.2 84% 4.9%",
  foreground: "210 40% 98%",
  card: "222.2 84% 4.9%",
  card_foreground: "210 40% 98%",
  popover: "222.2 84% 4.9%",
  popover_foreground: "210 40% 98%",
  primary: "160 84% 39%",
  primary_foreground: "0 0% 100%",
  secondary: "217.2 32.6% 17.5%",
  secondary_foreground: "210 40% 98%",
  muted: "217.2 32.6% 17.5%",
  muted_foreground: "215 20.2% 65.1%",
  accent: "160 84% 39%",
  accent_foreground: "0 0% 100%",
  destructive: "0 62.8% 30.6%",
  destructive_foreground: "210 40% 98%",
  success: "142 70% 45%",
  border: "217.2 32.6% 17.5%",
  input: "217.2 32.6% 17.5%",
  ring: "160 84% 39%",
} as const;

export function getThemeCssVars(theme: ThemeConfig, isDark: boolean): Record<string, string> {
  if (!isDark) {
    return {
      "--background": theme.background,
      "--foreground": theme.foreground,
      "--card": theme.card,
      "--card-foreground": theme.card_foreground,
      "--popover": theme.background,
      "--popover-foreground": theme.foreground,
      "--primary": theme.primary,
      "--primary-foreground": theme.primary_foreground,
      "--secondary": theme.secondary,
      "--secondary-foreground": theme.secondary_foreground,
      "--muted": theme.muted,
      "--muted-foreground": theme.muted_foreground,
      "--accent": theme.accent,
      "--accent-foreground": theme.accent_foreground,
      "--destructive": theme.destructive,
      "--destructive-foreground": theme.destructive_foreground,
      "--success": theme.success,
      "--border": theme.border,
      "--input": theme.border,
      "--ring": theme.primary,
    };
  }

  return {
    "--background": theme.background_dark || DEFAULT_DARK_VARS.background,
    "--foreground": theme.foreground_dark || DEFAULT_DARK_VARS.foreground,
    "--card": theme.card_dark || DEFAULT_DARK_VARS.card,
    "--card-foreground": theme.card_foreground_dark || DEFAULT_DARK_VARS.card_foreground,
    "--popover": theme.background_dark || DEFAULT_DARK_VARS.popover,
    "--popover-foreground": theme.foreground_dark || DEFAULT_DARK_VARS.popover_foreground,
    "--primary": theme.primary_dark || theme.primary || DEFAULT_DARK_VARS.primary,
    "--primary-foreground": theme.primary_foreground_dark || theme.primary_foreground || DEFAULT_DARK_VARS.primary_foreground,
    "--secondary": theme.secondary_dark || DEFAULT_DARK_VARS.secondary,
    "--secondary-foreground": theme.secondary_foreground_dark || DEFAULT_DARK_VARS.secondary_foreground,
    "--muted": theme.muted_dark || DEFAULT_DARK_VARS.muted,
    "--muted-foreground": theme.muted_foreground_dark || DEFAULT_DARK_VARS.muted_foreground,
    "--accent": theme.accent_dark || theme.accent || DEFAULT_DARK_VARS.accent,
    "--accent-foreground": theme.accent_foreground_dark || theme.accent_foreground || DEFAULT_DARK_VARS.accent_foreground,
    "--destructive": theme.destructive_dark || DEFAULT_DARK_VARS.destructive,
    "--destructive-foreground": theme.destructive_foreground_dark || DEFAULT_DARK_VARS.destructive_foreground,
    "--success": theme.success_dark || DEFAULT_DARK_VARS.success,
    "--border": theme.border_dark || DEFAULT_DARK_VARS.border,
    "--input": theme.border_dark || DEFAULT_DARK_VARS.input,
    "--ring": theme.primary_dark || theme.primary || DEFAULT_DARK_VARS.ring,
  };
}

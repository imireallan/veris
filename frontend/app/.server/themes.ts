/** Server-side theme utilities. Only runs on the server (loaders/actions). */

import type { ThemeConfig } from "~/types";
import { api } from "./api";

export async function fetchThemeConfig(orgId: string): Promise<ThemeConfig> {
  if (!orgId) return getDefaultTheme();

  try {
    const data = await api.get<Partial<ThemeConfig>>(`/api/themes/${orgId}`);
    return { ...getDefaultTheme(), ...data };
  } catch {
    return getDefaultTheme();
  }
}

export async function updateThemeConfig(
  orgId: string,
  theme: Partial<ThemeConfig>,
): Promise<ThemeConfig> {
  const existing = await fetchThemeConfig(orgId);
  const merged = { ...existing, ...theme };
  await api.put(`/api/themes/${orgId}`, merged);
  return merged;
}

export function getDefaultTheme(): ThemeConfig {
  return {
    primary: "160 84% 39%",
    primaryForeground: "0 0% 100%",
    secondary: "210 40% 96.1%",
    secondaryForeground: "222.2 47.4% 11.2%",
    accent: "38 92% 50%",
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
    success: "142 76% 36%",
  };
}

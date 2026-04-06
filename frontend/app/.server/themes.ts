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
}

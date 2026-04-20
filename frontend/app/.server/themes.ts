/** Server-side theme utilities. Only runs on the server (loaders/actions). */

import type { ThemeConfig } from "~/types";
import { api } from "./lib/api";
import { getSelectedOrganizationId } from "./sessions";

export async function fetchThemeConfig(
  request: Request,
  token?: string | null,
): Promise<ThemeConfig> {
  const orgId = await getSelectedOrganizationId(request);
  if (!orgId) return getDefaultTheme();

  try {
    const data = await api.get<ThemeConfig>(
      `/api/themes/${orgId}`,
      token ?? undefined,
      request,
    );
    return data;
  } catch {
    return getDefaultTheme();
  }
}

export async function updateThemeConfig(
  request: Request,
  theme: Partial<ThemeConfig>,
  token?: string | null,
): Promise<ThemeConfig> {
  const orgId = await getSelectedOrganizationId(request);
  if (!orgId) {
    return getDefaultTheme();
  }

  const existing = await fetchThemeConfig(request, token);
  const merged = { ...existing, ...theme };
  await api.put(`/api/themes/${orgId}`, merged, token, request);
  return merged;
}

export function getDefaultTheme(): ThemeConfig {
  return {
    // Primary colors
    primary: "160 84% 39%",
    primary_foreground: "0 0% 100%",
    secondary: "210 40% 96.1%",
    secondary_foreground: "222.2 47.4% 11.2%",
    accent: "38 92% 50%",
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
    success: "142 76% 36%",
    
    // Branding
    logo_url: undefined,
    favicon_url: undefined,
    font_family: undefined,
    button_radius: undefined,
    custom_css: undefined,
  };
}

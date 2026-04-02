/**
 * Theme configuration shape returned by the theme API.
 */
export interface ThemeConfig {
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  accent: string;
  accentForeground: string;
  background: string;
  foreground: string;
  muted: string;
  mutedForeground: string;
  card: string;
  cardForeground: string;
  border: string;
  destructive: string;
  destructiveForeground: string;
  success: string;
}

export type ThemeContextValue = {
  theme: ThemeConfig;
  setTheme: (theme: Partial<ThemeConfig>) => void;
};

/**
 * User shape returned by the auth session helpers.
 */
export interface User {
  id: string;
  email: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  orgId: string;
  role: "admin" | "manager" | "viewer";
  pictureUrl?: string;
}

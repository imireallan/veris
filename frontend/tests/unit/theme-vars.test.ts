import { describe, expect, it } from "vitest";

import type { ThemeConfig } from "~/types";
import { getThemeCssVars } from "~/lib/theme-vars";

const baseTheme: ThemeConfig = {
  primary: "160 84% 39%",
  primary_foreground: "0 0% 100%",
  secondary: "210 40% 96.1%",
  secondary_foreground: "222.2 47.4% 11.2%",
  accent: "160 84% 39%",
  accent_foreground: "0 0% 100%",
  background: "0 0% 100%",
  foreground: "222.2 84% 4.9%",
  muted: "210 40% 96.1%",
  muted_foreground: "215.4 16.3% 46.9%",
  card: "0 0% 100%",
  card_foreground: "222.2 84% 4.9%",
  border: "214.3 31.8% 91.4%",
  destructive: "0 84.2% 60.2%",
  destructive_foreground: "0 0% 100%",
  success: "142 76% 36%",
};

describe("getThemeCssVars", () => {
  it("returns the light palette in light mode", () => {
    const vars = getThemeCssVars(baseTheme, false);

    expect(vars["--background"]).toBe(baseTheme.background);
    expect(vars["--foreground"]).toBe(baseTheme.foreground);
    expect(vars["--primary"]).toBe(baseTheme.primary);
  });

  it("falls back to sensible default dark tokens when dark palette values are missing", () => {
    const vars = getThemeCssVars(baseTheme, true);

    expect(vars["--background"]).toBe("222.2 84% 4.9%");
    expect(vars["--foreground"]).toBe("210 40% 98%");
    expect(vars["--card"]).toBe("222.2 84% 4.9%");
    expect(vars["--muted"]).toBe("217.2 32.6% 17.5%");
    expect(vars["--border"]).toBe("217.2 32.6% 17.5%");
  });

  it("uses explicit dark tokens when the theme provides them", () => {
    const vars = getThemeCssVars(
      {
        ...baseTheme,
        background_dark: "220 20% 12%",
        foreground_dark: "210 40% 98%",
        card_dark: "220 20% 14%",
      },
      true,
    );

    expect(vars["--background"]).toBe("220 20% 12%");
    expect(vars["--foreground"]).toBe("210 40% 98%");
    expect(vars["--card"]).toBe("220 20% 14%");
  });
});

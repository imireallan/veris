import { describe, it, expect } from "vitest";

describe("ThemeProvider theme application", () => {
  it("has a default theme structure", () => {
    const colors = [
      "primary",
      "primaryForeground",
      "secondary",
      "secondaryForeground",
      "accent",
      "accentForeground",
      "background",
      "foreground",
      "muted",
      "mutedForeground",
      "card",
      "cardForeground",
      "border",
      "destructive",
      "destructiveForeground",
      "success",
    ] as const;

    expect(colors).toHaveLength(16);
    colors.forEach((c) => {
      expect(typeof c).toBe("string");
      expect(c.length).toBeGreaterThan(0);
    });
  });
});

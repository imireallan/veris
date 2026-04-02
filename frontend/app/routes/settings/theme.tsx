import { useTheme } from "~/providers/ThemeProvider";
import type { ThemeConfig } from "~/types";

const COLOR_INPUTS: (keyof ThemeConfig)[] = [
  "primary",
  "secondary",
  "accent",
  "background",
  "foreground",
  "muted",
  "card",
  "border",
  "destructive",
  "success",
];

export default function ThemeSettingsRoute() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Theme Settings</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Customize colors for your organization. Changes apply immediately.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {COLOR_INPUTS.map((key) => {
          const label = key.replace(/([A-Z])/g, " $1").trim();
          return (
            <label
              key={key}
              className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3"
            >
              <div
                className="w-10 h-10 rounded-lg border border-border shrink-0"
                style={{ backgroundColor: `rgb(${theme[key]})` }}
              />
              <div className="flex-1">
                <span className="block text-sm font-medium text-foreground capitalize">
                  {label}
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  {theme[key]}
                </span>
              </div>
              <input
                type="text"
                className="w-28 text-xs px-2 py-1.5 rounded-md border border-border bg-background text-foreground"
                value={theme[key]}
                onChange={(e) => setTheme({ [key]: e.target.value } as Partial<ThemeConfig>)}
              />
            </label>
          );
        })}
      </div>

      <button
        className="mt-4 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
        onClick={() => {
          alert("Theme saved — in production this dispatches to an action.");
        }}
      >
        Save Theme
      </button>
    </div>
  );
}

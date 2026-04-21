import React, { useState, useEffect } from "react";
import { useFetcher, useLoaderData } from "react-router";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { data, redirect } from "react-router";
import { useTheme } from "~/providers/ThemeProvider";
import type { ThemeConfig } from "~/types";
import { Button, Input, Label, Card, CardContent, CardHeader, Alert, AlertDescription } from "~/components/ui";
import { RBAC } from "~/types/rbac";
import { Paintbrush, Save, RotateCcw } from "lucide-react";
import { useToast } from "~/hooks/use-toast";
import { useFetcherToast } from "~/hooks/use-fetcher-toast";

export async function loader({ request }: LoaderFunctionArgs) {
  const { requireUser } = await import("~/.server/sessions");
  const { api } = await import("~/.server/lib/api");
  const user = await requireUser(request);
  const selectedOrg = user.activeOrganization ?? null;
  if (!selectedOrg) {
    throw redirect("/organizations");
  }
  
  // Only ADMIN and SUPERADMIN can manage theme settings
  if (!RBAC.canManageOrg(user)) {
    throw redirect("/app");
  }
  
  try {
    const theme = await api.get<ThemeConfig>(`/api/themes/${selectedOrg.id}`);
    return data({ theme, orgId: selectedOrg.id, orgName: selectedOrg.name });
  } catch {
    return data({ theme: null, orgId: selectedOrg.id, orgName: selectedOrg.name });
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const { requireUser, getUserToken } = await import("~/.server/sessions");
  const { api } = await import("~/.server/lib/api");
  
  const token = await getUserToken(request);
  const user = await requireUser(request);
  const selectedOrg = user.activeOrganization ?? null;
  if (!selectedOrg) {
    return data({ error: "Organization required" }, { status: 400 });
  }
  
  // Only ADMIN and SUPERADMIN can manage theme settings
  if (!RBAC.canManageOrg(user)) {
    return data({ error: "Insufficient permissions" }, { status: 403 });
  }
  
  const formData = await request.formData();
  const themeData: Record<string, any> = {};
  
  // Light mode color fields
  const colorFieldMap: Record<string, string> = {
    "primary": "primary_hsl",
    "primary_foreground": "primary_foreground_hsl",
    "secondary": "secondary_hsl",
    "secondary_foreground": "secondary_foreground_hsl",
    "accent": "accent_hsl",
    "accent_foreground": "accent_foreground_hsl",
    "background": "background_hsl",
    "foreground": "foreground_hsl",
    "muted": "muted_hsl",
    "muted_foreground": "muted_foreground_hsl",
    "card": "card_hsl",
    "card_foreground": "card_foreground_hsl",
    "border": "border_hsl",
    "destructive": "destructive_hsl",
    "destructive_foreground": "destructive_foreground_hsl",
    "success": "success_hsl",
  };
  
  // Dark mode color fields
  const colorFieldMapDark: Record<string, string> = {
    "primary_dark": "primary_hsl_dark",
    "primary_foreground_dark": "primary_foreground_hsl_dark",
    "secondary_dark": "secondary_hsl_dark",
    "secondary_foreground_dark": "secondary_foreground_hsl_dark",
    "accent_dark": "accent_hsl_dark",
    "accent_foreground_dark": "accent_foreground_hsl_dark",
    "background_dark": "background_hsl_dark",
    "foreground_dark": "foreground_hsl_dark",
    "muted_dark": "muted_hsl_dark",
    "muted_foreground_dark": "muted_foreground_hsl_dark",
    "card_dark": "card_hsl_dark",
    "card_foreground_dark": "card_foreground_hsl_dark",
    "border_dark": "border_hsl_dark",
    "destructive_dark": "destructive_hsl_dark",
    "destructive_foreground_dark": "destructive_foreground_hsl_dark",
    "success_dark": "success_hsl_dark",
  };
  
  Object.entries(colorFieldMap).forEach(([formField, apiField]) => {
    const value = formData.get(formField);
    if (typeof value === "string" && value.trim()) {
      themeData[apiField] = value;
    }
  });
  
  Object.entries(colorFieldMapDark).forEach(([formField, apiField]) => {
    const value = formData.get(formField);
    if (typeof value === "string" && value.trim()) {
      themeData[apiField] = value;
    }
  });
  
  // Branding fields - light mode
  const brandingFields = ["logo_url", "favicon_url", "font_family", "custom_css"] as const;
  brandingFields.forEach((field) => {
    const value = formData.get(field);
    if (typeof value === "string") {
      themeData[field] = value || undefined;
    }
  });
  
  // Branding fields - dark mode
  const brandingFieldsDark = ["logo_url_dark", "custom_css_dark"] as const;
  brandingFieldsDark.forEach((field) => {
    const value = formData.get(field);
    if (typeof value === "string") {
      themeData[field] = value || undefined;
    }
  });
  
  const buttonRadius = formData.get("button_radius");
  if (typeof buttonRadius === "string" && buttonRadius.trim()) {
    themeData.button_radius = parseFloat(buttonRadius);
  }
  
  try {
    await api.put(`/api/themes/${selectedOrg.id}`, themeData, token, request);
    // Return success data instead of redirect - fetcher will handle it
    return { success: true };
  } catch (error: any) {
    if (error instanceof Response && error.status === 302) {
      throw error; // Re-throw redirect
    }
    // Handle 401 - session expired, redirect to login (handled by api.put)
    if (error.status === 401) {
      throw error; // Re-throw the redirect from destroySessionCookie
    }
    return { success: false, error: error.message || "Failed to save theme" };
  }
}

interface ColorPickerProps {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function ColorPicker({ name, label, value, onChange }: ColorPickerProps) {
  // Convert HSL to HEX for color input
  const hslToHex = (hsl: string): string => {
    if (!hsl || !hsl.trim()) return "#000000";
    
    // Strip % symbols and parse - handle both space and comma separators
    const clean = hsl.replace(/%/g, "").replace(/,/g, " ").trim();
    const parts = clean.split(/\s+/).filter(Boolean);
    
    if (parts.length !== 3) {
      return "#000000";
    }
    
    const h = parseFloat(parts[0]);
    const s = parseFloat(parts[1]);
    const l = parseFloat(parts[2]);
    
    // Validate parsed values
    if (isNaN(h) || isNaN(s) || isNaN(l)) {
      return "#000000";
    }
    
    // Clamp values to valid ranges
    const hClamped = ((h % 360) + 360) % 360;
    const sClamped = Math.max(0, Math.min(100, s));
    const lClamped = Math.max(0, Math.min(100, l));
    
    const hNorm = hClamped / 360;
    const sNorm = sClamped / 100;
    const lNorm = lClamped / 100;
    
    if (sNorm === 0) {
      const v = Math.round(lNorm * 255);
      const hex = v.toString(16).padStart(2, "0");
      return `#${hex}${hex}${hex}`;
    }
    
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    
    const q = lNorm < 0.5 ? lNorm * (1 + sNorm) : lNorm + sNorm - lNorm * sNorm;
    const p = 2 * lNorm - q;
    const r = hue2rgb(p, q, hNorm + 1/3);
    const g = hue2rgb(p, q, hNorm);
    const b = hue2rgb(p, q, hNorm - 1/3);
    
    const toHex = (c: number) => {
      const hex = Math.round(c * 255).toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    };
    
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };
  
  // Convert HEX to HSL
  const hexToHsl = (hex: string): string => {
    if (!hex || !hex.trim()) return "0 0% 0%";
    
    const clean = hex.trim().replace("#", "");
    
    // Expand 3-digit hex to 6-digit
    const hexExpanded = clean.length === 3 
      ? clean.split("").map(c => c + c).join("")
      : clean;
    
    // Validate hex format
    if (!/^[0-9A-Fa-f]{6}$/.test(hexExpanded)) {
      return "0 0% 0%";
    }
    
    const r = parseInt(hexExpanded.substring(0, 2), 16) / 255;
    const g = parseInt(hexExpanded.substring(2, 4), 16) / 255;
    const b = parseInt(hexExpanded.substring(4, 6), 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  };
  
  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value;
    const hsl = hexToHsl(hex);
    onChange(hsl);
  };
  
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };
  
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <div className="flex items-center gap-2">
        <div className="relative">
          <input
            type="color"
            value={hslToHex(value)}
            onChange={handleColorChange}
            className="w-10 h-10 rounded-lg border border-border cursor-pointer"
          />
        </div>
        <Input
          id={name}
          name={name}
          type="text"
          value={value}
          onChange={handleTextChange}
          className="flex-1 font-mono text-xs"
          placeholder="h s l"
        />
      </div>
    </div>
  );
}

export default function ThemeSettingsRoute() {
  const loaderData = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const { setTheme } = useTheme();
  const { success: toastSuccess, error: toastError } = useToast();
  const { handleFetcherResult } = useFetcherToast();
  
  const theme = loaderData.theme;
  const isSaving = fetcher.state === "submitting";
  
  // Show success toast when fetcher completes
  useEffect(() => {
    handleFetcherResult(fetcher, {
      success: () => toastSuccess("Theme saved", "Your branding changes have been saved successfully."),
      error: (data) => toastError("Save failed", data.error),
    });
  }, [fetcher, toastSuccess, toastError]);
  
  // Local state for live preview
  const [localTheme, setLocalTheme] = useState<Partial<ThemeConfig>>({});
  
  const updateTheme = (updates: Partial<ThemeConfig>) => {
    setLocalTheme((prev) => ({ ...prev, ...updates }));
    setTheme(updates);
  };
  
  const handleReset = () => {
    if (theme) {
      setLocalTheme({});
      setTheme(theme);
    }
  };
  
  const currentTheme = theme ? { ...theme, ...localTheme } : localTheme;
  
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <Paintbrush className="w-6 h-6" />
            Branding & Theme
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Customize colors, logo, and styling for your organization
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={isSaving || !theme}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>
      
      {fetcher.data?.error && (
        <Alert variant="destructive">
          <AlertDescription>{fetcher.data.error}</AlertDescription>
        </Alert>
      )}
      
      <fetcher.Form method="post" className="space-y-8">
        {/* Primary Colors */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Primary Colors</h3>
            <p className="text-sm text-muted-foreground">
              Main brand colors used throughout the interface
            </p>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ColorPicker
              name="primary"
              label="Primary"
              value={currentTheme.primary || ""}
              onChange={(v) => updateTheme({ primary: v })}
            />
            <ColorPicker
              name="primary_foreground"
              label="Primary Text"
              value={currentTheme.primary_foreground || ""}
              onChange={(v) => updateTheme({ primary_foreground: v })}
            />
            <ColorPicker
              name="secondary"
              label="Secondary"
              value={currentTheme.secondary || ""}
              onChange={(v) => updateTheme({ secondary: v })}
            />
            <ColorPicker
              name="secondary_foreground"
              label="Secondary Text"
              value={currentTheme.secondary_foreground || ""}
              onChange={(v) => updateTheme({ secondary_foreground: v })}
            />
            <ColorPicker
              name="accent"
              label="Accent"
              value={currentTheme.accent || ""}
              onChange={(v) => updateTheme({ accent: v })}
            />
            <ColorPicker
              name="accent_foreground"
              label="Accent Text"
              value={currentTheme.accent_foreground || ""}
              onChange={(v) => updateTheme({ accent_foreground: v })}
            />
          </CardContent>
        </Card>
        
        {/* Surface Colors */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Surface Colors</h3>
            <p className="text-sm text-muted-foreground">
              Background and content area colors
            </p>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ColorPicker
              name="background"
              label="Background"
              value={currentTheme.background || ""}
              onChange={(v) => updateTheme({ background: v })}
            />
            <ColorPicker
              name="foreground"
              label="Text"
              value={currentTheme.foreground || ""}
              onChange={(v) => updateTheme({ foreground: v })}
            />
            <ColorPicker
              name="card"
              label="Card"
              value={currentTheme.card || ""}
              onChange={(v) => updateTheme({ card: v })}
            />
            <ColorPicker
              name="card_foreground"
              label="Card Text"
              value={currentTheme.card_foreground || ""}
              onChange={(v) => updateTheme({ card_foreground: v })}
            />
            <ColorPicker
              name="muted"
              label="Muted"
              value={currentTheme.muted || ""}
              onChange={(v) => updateTheme({ muted: v })}
            />
            <ColorPicker
              name="muted_foreground"
              label="Muted Text"
              value={currentTheme.muted_foreground || ""}
              onChange={(v) => updateTheme({ muted_foreground: v })}
            />
          </CardContent>
        </Card>
        
        {/* State Colors */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">State Colors</h3>
            <p className="text-sm text-muted-foreground">
              Colors for borders, errors, and success states
            </p>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ColorPicker
              name="border"
              label="Border"
              value={currentTheme.border || ""}
              onChange={(v) => updateTheme({ border: v })}
            />
            <ColorPicker
              name="destructive"
              label="Destructive/Error"
              value={currentTheme.destructive || ""}
              onChange={(v) => updateTheme({ destructive: v })}
            />
            <ColorPicker
              name="destructive_foreground"
              label="Error Text"
              value={currentTheme.destructive_foreground || ""}
              onChange={(v) => updateTheme({ destructive_foreground: v })}
            />
            <ColorPicker
              name="success"
              label="Success"
              value={currentTheme.success || ""}
              onChange={(v) => updateTheme({ success: v })}
            />
          </CardContent>
        </Card>
        
        {/* Branding */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Branding</h3>
            <p className="text-sm text-muted-foreground">
              Logo, favicon, fonts, and custom styling
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="logo_url">Logo URL</Label>
                <Input
                  id="logo_url"
                  name="logo_url"
                  type="url"
                  placeholder="https://example.com/logo.png"
                  defaultValue={theme?.logo_url || ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="favicon_url">Favicon URL</Label>
                <Input
                  id="favicon_url"
                  name="favicon_url"
                  type="url"
                  placeholder="https://example.com/favicon.ico"
                  defaultValue={theme?.favicon_url || ""}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="font_family">Font Family</Label>
              <Input
                id="font_family"
                name="font_family"
                type="text"
                placeholder="Inter, system-ui, sans-serif"
                defaultValue={theme?.font_family || ""}
              />
              <p className="text-xs text-muted-foreground">
                Comma-separated font stack (e.g., "Inter, system-ui, sans-serif")
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="button_radius">Button Border Radius (px)</Label>
              <Input
                id="button_radius"
                name="button_radius"
                type="number"
                step="0.5"
                min="0"
                max="20"
                defaultValue={theme?.button_radius?.toString() || ""}
              />
              <p className="text-xs text-muted-foreground">
                Controls roundedness of buttons and cards (0-20px)
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="custom_css">Custom CSS</Label>
              <textarea
                id="custom_css"
                name="custom_css"
                rows={6}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground font-mono text-xs resize-y"
                placeholder="/* Custom CSS styles */"
                defaultValue={theme?.custom_css || ""}
              />
              <p className="text-xs text-muted-foreground">
                Advanced: Add custom CSS that will be injected into the page head
              </p>
            </div>
          </CardContent>
        </Card>
        
        <div className="flex justify-end">
          <Button type="submit" disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Saving..." : "Save Theme"}
          </Button>
        </div>
      </fetcher.Form>
    </div>
  );
}


- [x] Install Tailwind CSS
- [x] Set up shadcn/ui
- [x] Configure TypeScript + ESLint + Prettier

---

### 🧭 Routing Architecture
- [ ] Define route layout structure:
  - [ ] PublicLayout (auth pages)
  - [ ] AppLayout (authenticated app)
- [ ] Implement nested routes
- [ ] Add protected routes (auth guard)
- [ ] Add tenant-aware routing (subdomain or context-based)

---

### 🎨 Design System Setup
- [x] Install core shadcn components:
  - [x] Button
  - [x] Input
  - [x] Card
  - [x] Dialog
  - [x] DropdownMenu
  - [x] Tabs
  - [x] Table
  - [x] Badge (bonus)
  - [x] Avatar (bonus)
  - [x] Alert (bonus)
  - [x] Separator (bonus)
  - [x] Skeleton (bonus)
  - [x] Toast (bonus)

- [x] Define design tokens (CSS variables):
  - [x] Colors (primary, secondary, muted, destructive, accent, card, background, foreground, border, ring, input, success)
  - [x] Radius
  - [x] Spacing scale (Tailwind default)
  - [x] Typography (Inter via @theme)

---

## 🌗 THEME SYSTEM (CRITICAL - WHITE LABEL + DARK MODE)

### 🎯 Goals
- Multi-tenant branding
- Dark/light mode support
- Runtime theme switching

---

### 🧩 Base Theme Setup
- [x] Implement CSS variables in `:root` (HSL format)

```css
:root {
  --background-hsl: 0 0% 100%;
  --foreground-hsl: 222.2 84% 4.9%;
  --primary-hsl: 160 84% 39%;
}
```

- [x] Dark mode via `@media (prefers-color-scheme: dark)`
- [x] ThemeProvider with runtime CSS variable injection
- [x] ThemeConfig with HSL string values

---

### 🏗 Architecture Notes
- Components use HSL-based CSS variables (`--primary-hsl` etc.) mapped via `@theme` in app.css
- No Radix UI dependencies needed -- zero-dep implementations for Dialog, DropdownMenu, Tabs, Toast
- `cn()` utility: `tailwind-merge` + `clsx` for className composition
- CVA for variant composition (Button, Badge, Alert)
- Barrel export: `~/components/ui/index.ts` for clean imports

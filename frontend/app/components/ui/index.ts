/** UI Components - shadcn/ui design system layer */

/* ─── Primitives ─── */
export { cn } from "~/lib/utils"

/* ─── Form ─── */
export { Button, buttonVariants } from "./button"
export type { ButtonProps } from "./button"
export { Input } from "./input"
export { Textarea } from "./textarea"

/* ─── Layout ─── */
export {
  Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent
} from "./card"
export { Separator } from "./separator"

/* ─── Navigation ─── */
export { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs"
export {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel
} from "./dropdown-menu"

/* ─── Overlay ─── */
export {
  Dialog, DialogOverlay, DialogContent, DialogHeader, DialogFooter,
  DialogTitle, DialogDescription, DialogClose
} from "./dialog"

/* ─── Data display ─── */
export { Badge, badgeVariants } from "./badge"
export type { BadgeProps } from "./badge"
export { Avatar, AvatarImage, AvatarFallback } from "./avatar"
export {
  Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption
} from "./table"
export { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "./accordion"

/* ─── Feedback ─── */
export { Alert, AlertTitle, AlertDescription, alertVariants } from "./alert"
export { Skeleton } from "./skeleton"
export { Toaster, ToastProvider, useToast, type ToastType } from "./toast"

/* ─── Patterns (reusable across routes) ─── */
export { PageHeader } from "./page-header"
export { EmptyState } from "./empty-state"
export { StatCard } from "./stat-card"
export { ProgressBar } from "./progress-bar"
export { DetailField } from "./detail-field"
export { SectionCard } from "./section-card"
export { SearchBar } from "./search-bar"
export { EditModeToolbar } from "./edit-mode-toolbar"
export { TaskCard } from "./task-card"
export { TimelineItem } from "./timeline-item"
export { QuickLinks } from "./quick-links"
export { EditableField } from "./editable-field"
export type { EditableFieldProps } from "./editable-field"
export { TabsSection } from "./tabs-section"

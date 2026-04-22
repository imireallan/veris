/** UI Components - shadcn/ui design system layer */

/* ─── Primitives ─── */
export { cn } from "~/lib/utils"

/* ─── Form ─── */
export { Button, buttonVariants } from "./button"
export type { ButtonProps } from "./button"
export { Input } from "./input"
export { Label } from "./label"
export { Textarea } from "./textarea"
export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "./select"

/* ─── Select with options array ─── */
export { Select as SelectWithOptions } from "./select-simple"

/* ─── Layout ─── */
export {
  Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent
} from "./card"
export { Separator } from "./separator"

/* ─── Navigation ─── */
export { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs"
export {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
} from "./navigation-menu"
export {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel,
  DropdownMenuGroup, DropdownMenuShortcut
} from "./dropdown-menu"

/* ─── Overlay ─── */
export {
  Dialog, DialogOverlay, DialogContent, DialogHeader, DialogFooter,
  DialogTitle, DialogDescription, DialogClose, DialogTrigger, DialogPortal
} from "./dialog"
export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "./sheet"

/* ─── Tooltip ─── */
export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "./tooltip"

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
export { Toaster } from "./sonner";
export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from "./breadcrumb";
export { useToast } from "~/hooks/use-toast"

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

/* ─── New reusable patterns ─── */
export { PrerequisiteChecklist } from "../PrerequisiteChecklist"
export type { Prerequisite, PrerequisiteStatus } from "../PrerequisiteChecklist"
export { MultiStepForm } from "../MultiStepForm"

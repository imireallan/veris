/** UI Components - shadcn/ui design system layer

All components use Tailwind v4 @theme-based CSS variables (HSL format),
CVA for variants, and the cn() utility for className merging.
They support the ThemeProvider for runtime white-label customization.
*/

export { Button, buttonVariants } from "./button"
export type { ButtonProps } from "./button"
export { Input } from "./input"
export {
  Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent
} from "./card"
export {
  Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption
} from "./table"
export { Badge, badgeVariants } from "./badge"
export type { BadgeProps } from "./badge"
export { Avatar, AvatarImage, AvatarFallback } from "./avatar"
export { Alert, AlertTitle, AlertDescription, alertVariants } from "./alert"
export { Separator } from "./separator"
export { Skeleton } from "./skeleton"
export { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs"
export {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel
} from "./dropdown-menu"
export {
  Dialog, DialogOverlay, DialogContent, DialogHeader, DialogFooter,
  DialogTitle, DialogDescription, DialogClose
} from "./dialog"
export { Toaster, ToastProvider, useToast, type ToastType } from "./toast"
export { cn } from "~/lib/utils"

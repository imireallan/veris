import * as React from "react"
import { cn } from "~/lib/utils"

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
  onValueChange?: (value: string) => void
  defaultValue?: string
}

const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  ({ value, onValueChange, defaultValue, className, ...props }, ref) => {
    const [activeTab, setActiveTab] = React.useState(value ?? defaultValue ?? "")

    React.useEffect(() => {
      if (value !== undefined) setActiveTab(value)
    }, [value])

    const contextValue = React.useMemo(
      () => ({
        activeTab,
        onTabSelect: (tab: string) => {
          setActiveTab(tab)
          onValueChange?.(tab)
        },
      }),
      [activeTab, onValueChange]
    )

    return (
      <div ref={ref} className={cn("", className)} data-tabs={JSON.stringify(contextValue)} {...props}>
        <TabsContext.Provider value={contextValue}>{props.children}</TabsContext.Provider>
      </div>
    )
  }
)
Tabs.displayName = "Tabs"

interface TabsContextValue {
  activeTab: string
  onTabSelect: (tab: string) => void
}
const TabsContext = React.createContext<TabsContextValue>({
  activeTab: "",
  onTabSelect: () => {},
})

const TabsList = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
        className
      )}
      {...props}
    />
  )
)
TabsList.displayName = "TabsList"

const TabsTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }>(
  ({ className, value, ...props }, ref) => {
    const { activeTab, onTabSelect } = React.useContext(TabsContext)
    return (
      <button
        ref={ref}
        role="tab"
        aria-selected={activeTab === value}
        data-state={activeTab === value ? "active" : "inactive"}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          activeTab === value
            ? "bg-background text-foreground shadow-sm"
            : "hover:bg-background/50",
          className
        )}
        onClick={() => onTabSelect(value)}
        {...props}
      />
    )
  }
)
TabsTrigger.displayName = "TabsTrigger"

const TabsContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { value: string }>(
  ({ className, value, ...props }, ref) => {
    const { activeTab } = React.useContext(TabsContext)
    if (activeTab !== value) return null
    return (
      <div
        ref={ref}
        role="tabpanel"
        data-state={activeTab === value ? "active" : "inactive"}
        className={cn(
          "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          className
        )}
        {...props}
      />
    )
  }
)
TabsContent.displayName = "TabsContent"

export { Tabs, TabsList, TabsTrigger, TabsContent }

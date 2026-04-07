import { useState, useEffect } from "react"
import { Menu, X, Sun, Moon } from "lucide-react"
import Sidebar from "~/components/Sidebar"
import type { User } from "~/types"

interface AppLayoutProps {
  children: React.ReactNode
  user: User
  navLinks: { to: string; label: string; icon: string }[]
}

export function AppLayout({ children, user, navLinks }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [dark, setDark] = useState(false)

  // Check dark mode only on client after hydration
  useEffect(() => {
    const stored = localStorage.getItem("theme")
    if (stored === "dark") setDark(true)
    else if (stored === "light") setDark(false)
    else if (window.matchMedia("(prefers-color-scheme: dark)").matches) setDark(true)
  }, [])

  const closeSidebar = () => setSidebarOpen(false)

  const toggleTheme = () => {
    setDark((prev) => {
      const next = !prev
      const html = document.documentElement
      if (next) {
        html.classList.add("dark")
        localStorage.setItem("theme", "dark")
      } else {
        html.classList.remove("dark")
        localStorage.setItem("theme", "light")
      }
      return next
    })
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transition-transform duration-200 ease-in-out
          lg:relative lg:z-auto lg:w-64 lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Sidebar */}
        <Sidebar navLinks={navLinks} user={user} />
        {/* Close button on mobile - placed over sidebar without affecting flex layout */}
        <button
          className="absolute top-3 right-3 p-1.5 rounded-md hover:bg-muted lg:hidden"
          onClick={closeSidebar}
          aria-label="Close sidebar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar - visible on all screens */}
        <header className="sticky top-0 z-30 flex items-center justify-end px-4 py-2.5 border-b bg-card shrink-0">
          {/* Mobile hamburger - left side */}
          <button
            className="p-1.5 rounded-md hover:bg-muted -ml-2 lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md hover:bg-muted transition-colors"
            aria-label="Toggle theme"
          >
            {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

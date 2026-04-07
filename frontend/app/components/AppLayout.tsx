import { useState, useEffect } from "react"
import { Menu, X, Sun, Moon } from "lucide-react"
import Sidebar from "~/components/Sidebar"
import type { User } from "~/types"

interface AppLayoutProps {
  children: React.ReactNode
  user: User
  navLinks: { to: string; label: string; icon: string }[]
}

/** Dark mode toggle state — reads from DOM (.dark class is set by blocking script in root.tsx) */
function useDarkMode(): [boolean, () => void] {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    // Read actual DOM state (set by blocking script before hydration)
    const update = () => setDark(document.documentElement.classList.contains("dark"))
    update()
    // Listen for system preference changes
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])

  const toggle = () => {
    const html = document.documentElement
    const next = !html.classList.contains("dark")
    if (next) {
      html.classList.add("dark")
      localStorage.setItem("theme", "dark")
    } else {
      html.classList.remove("dark")
      localStorage.setItem("theme", "light")
    }
    setDark(next)
  }

  return [dark, toggle]
}

export function AppLayout({ children, user, navLinks }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [dark, toggleTheme] = useDarkMode()

  const closeSidebar = () => setSidebarOpen(false)

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar wrapper: fixed on mobile, inline on desktop */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transition-transform duration-200 ease-in-out
          lg:relative lg:z-auto lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <Sidebar navLinks={navLinks} user={user} />
        {/* Close button on mobile */}
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
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-end px-4 py-2.5 border-b bg-card shrink-0">
          {/* Mobile hamburger */}
          <button
            className="p-1.5 rounded-md hover:bg-muted -ml-2 lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

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

        {/* Page content — responsive padding */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

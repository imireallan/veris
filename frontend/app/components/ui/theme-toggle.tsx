import { Moon, Sun } from "lucide-react"
import { Button } from "./button"

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const toggle = () => {
    const html = document.documentElement
    const current = html.classList.contains("dark")
    if (current) {
      html.classList.remove("dark")
      html.classList.add("light")
      localStorage.setItem("theme", "light")
    } else {
      html.classList.add("dark")
      html.classList.remove("light")
      localStorage.setItem("theme", "dark")
    }
  }

  return (
    <Button variant="ghost" size="icon" className={className} onClick={toggle} aria-label="Toggle theme">
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}

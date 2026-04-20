import { useEffect, useState } from "react";
import { Menu, Moon, Sun, X } from "lucide-react";

import Sidebar from "~/components/Sidebar";
import { OrganizationSwitcher } from "~/components/OrganizationSwitcher";
import { UserDropdown } from "~/components/UserDropdown";
import type { OrganizationListItem, User } from "~/types";

interface AppLayoutProps {
  children: React.ReactNode;
  user: User;
  organizations: OrganizationListItem[];
  navLinks: { to: string; label: string; icon: string }[];
}

function useDarkMode(): [boolean, () => void] {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const update = () =>
      setDark(document.documentElement.classList.contains("dark"));
    update();
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const toggle = () => {
    const html = document.documentElement;
    const next = !html.classList.contains("dark");
    if (next) {
      html.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      html.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
    setDark(next);
  };

  return [dark, toggle];
}

export function AppLayout({ children, user, organizations, navLinks }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dark, toggleTheme] = useDarkMode();

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex h-screen bg-background">
      {sidebarOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={closeSidebar}
        />
      ) : null}

      <div
        className={`fixed inset-y-0 left-0 z-50 transition-transform duration-200 ease-in-out lg:relative lg:z-auto lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar navLinks={navLinks} user={user} />
        <button
          className="absolute right-3 top-3 rounded-md p-1.5 hover:bg-muted lg:hidden"
          onClick={closeSidebar}
          aria-label="Close sidebar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex shrink-0 items-center justify-end border-b border-t bg-card px-5 py-4">
          <button
            className="-ml-2 rounded-md p-1.5 hover:bg-muted lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex-1" />

          {organizations.length > 1 ? (
            <OrganizationSwitcher
              organizations={organizations}
              activeOrganizationId={user.orgId}
              className="mr-4"
            />
          ) : null}

          <button
            onClick={toggleTheme}
            className="mr-2 rounded-md p-2 transition-colors hover:bg-muted"
            aria-label="Toggle theme"
          >
            {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          <UserDropdown user={user} organizations={organizations} />
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

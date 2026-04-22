import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  type LinksFunction,
  type MetaFunction,
  type LoaderFunctionArgs,
  data,
  useLoaderData,
} from "react-router";
import { useRouteError } from "react-router";
import { getUserToken, requireUser } from "~/.server/sessions";
import type { User } from "~/types";

import { ThemeProvider } from "~/providers/ThemeProvider";
import { Toaster } from "~/components/ui/sonner";
import { TooltipProvider } from "~/components/ui/tooltip";
import { fetchThemeConfig } from "~/.server/themes";

import "./app.css";

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export const meta: MetaFunction = () => [
  { title: "Veris" },
  {
    name: "description",
    content:
      "AI-powered multi-tenant sustainability platform for managing ESG assessments, knowledge, and intelligence.",
  },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const token = await getUserToken(request);
  let user: User | null = null;
  let theme = null;

  if (token) {
    try {
      user = await requireUser(request);
      theme = await fetchThemeConfig(request, token);
    } catch {
      user = null;
    }
  }

  if (!theme) {
    theme = await fetchThemeConfig(request, token);
  }

  return data({ user, theme });
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');var prefersDark=window.matchMedia('(prefers-color-scheme:dark)').matches;var isDark=t==='dark'||(t!=='light'&&prefersDark);var root=document.documentElement;if(isDark){root.classList.add('dark');root.classList.remove('light')}else{root.classList.add('light');root.classList.remove('dark')}}catch(e){}})();`,
          }}
        />
        <Meta />
        <Links />
      </head>
      <body className="min-h-screen flex flex-col bg-background text-foreground">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export function HydrateFallback() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const data = useLoaderData<typeof loader>();
  const user = data?.user || null;
  const theme = data?.theme;

  return (
    <ThemeProvider initialTheme={theme}>
      <TooltipProvider delay={0}>
        {theme?.favicon_url && (
          <link rel="icon" href={theme.favicon_url} key="theme-favicon" />
        )}

        {theme?.custom_css && (
          <style
            id="custom-theme-css"
            dangerouslySetInnerHTML={{ __html: theme.custom_css }}
          />
        )}

        <Outlet context={{ user }} />
        <Toaster position="top-right" richColors closeButton />
      </TooltipProvider>
    </ThemeProvider>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (error instanceof Response) {
    if (error.status === 403) {
      message = "Access Denied";
      details = "You don't have permission to access this resource.";
    } else if (error.status === 404) {
      message = "Not Found";
      details = "The requested resource could not be found.";
    } else if (error.status === 401) {
      message = "Unauthorized";
      details = "Please log in to continue.";
    } else {
      message = String(error.status);
      details = error.statusText || details;
    }
  } else if (error instanceof Error) {
    const apiError = error as any;
    if (apiError.status === 403) {
      message = "Access Denied";
      details = "You don't have permission to access this resource.";
    } else if (apiError.status === 404) {
      message = "Not Found";
      details = "The requested resource could not be found.";
    } else {
      details = error.message;
    }
    stack = error.stack;
  }

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{message}</title>
      </head>
      <body className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <main className="p-8 max-w-lg text-center">
          <h1 className="text-3xl font-bold mb-4">{message}</h1>
          <p className="text-muted-foreground mb-4">{details}</p>
          {stack && (
            <pre className="w-full p-4 overflow-x-auto bg-card rounded-lg text-sm">
              <code>{stack}</code>
            </pre>
          )}
          <a href="/" className="text-primary underline mt-4 inline-block">
            Go home
          </a>
        </main>
      </body>
    </html>
  );
}

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
  redirect,
  useLoaderData,
} from "react-router";
import { useRouteError } from "react-router";
import { getUserToken, requireUser } from "~/.server/sessions";
import type { User } from "~/types";

import { ThemeProvider } from "~/providers/ThemeProvider";
import { Toaster } from "~/components/ui/sonner";
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

  if (token) {
    try {
      user = await requireUser(request);
    } catch {
      // Not authenticated or token expired — continue without user
      // (requireUser already throws redirect to /login for non-dashboard routes,
      //  but the root layout should render even for anonymous users on /login etc.)
    }
  }

  const theme = await fetchThemeConfig(user?.orgId ?? "", token);

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
            __html: `(function(){try{var t=localStorage.getItem('theme'),d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme:dark)').matches);if(d){document.documentElement.classList.add('dark')}else{document.documentElement.classList.remove('dark')}}catch(e){}})();`,
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
      {/* Inject favicon from theme */}
      {theme?.favicon_url && (
        <link rel="icon" href={theme.favicon_url} key="theme-favicon" />
      )}
      {/* Inject custom CSS from theme */}
      {theme?.custom_css && (
        <style id="custom-theme-css" dangerouslySetInnerHTML={{ __html: theme.custom_css }} />
      )}
      <Outlet context={{ user }} />
      <Toaster position="top-right" richColors closeButton />
    </ThemeProvider>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (error instanceof Response) {
    message = String(error.status);
    details = error.statusText || details;
  } else if (error instanceof Error) {
    details = error.message;
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

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
} from "react-router";
import { useRouteError } from "react-router";
import { getUserToken, getSession } from "~/.server/sessions"; // Import getSession and json here

import { ThemeProvider } from "~/providers/ThemeProvider";
import { fetchThemeConfig } from "~/.server/themes";
import { api } from "~/.server/lib/api"; // Assuming api is correctly configured here

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
  let user = null;

  if (token) {
    try {
      // Fetch user details from the backend using the token
      const userData = await api.get<{
        id: string;
        email: string;
        full_name: string | null;
        first_name: string | null;
        last_name: string | null;
        org_id: string | null;
        role: string;
        picture_url: string | null;
      }>(`/api/auth/me/`, token); // Assuming /api/auth/me/ provides user details

      console.log("Fetched user details:", userData);

      if (userData) {
        user = {
          id: userData.id,
          email: userData.email,
          // Map backend's 'full_name' and 'name' to frontend's expected 'fullName'
          // Provide first/last names if available, otherwise fallback to email parts
          firstName:
            userData.first_name ??
            userData.full_name?.split(" ")[0] ??
            userData.email.split("@")[0],
          fullName: userData.full_name ?? userData.email,
          organization_id: userData.org_id,
          role: userData.role,
          picture_url: userData.picture_url,
        };
        console.log("Constructed user object for sidebar:", user);
      }
    } catch (error) {
      console.error("Failed to fetch user details:", error);
      // If fetching user fails, it implies an issue with the token or session.
      // Destroy the session and redirect to login.
      console.log("User fetch failed, redirecting to login...");
      const session = await getSession(request); // Need to get the session to destroy it
      // Ensure session is valid before destroying
      if (session) {
        throw redirect("/login", {
          headers: {
            "Set-Cookie": await sessionStorage.destroySession(session),
          },
        });
      } else {
        // If session is somehow invalid, just redirect without destroying
        throw redirect("/login");
      }
    }
  }

  const theme = await fetchThemeConfig(user?.organization_id ?? ""); // Fetch theme based on user's org or default

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

export default function App() {
  // The user object from useLoaderData will be used by children components
  // e.g., Sidebar, which expects user properties like firstName, fullName, email.
  // If user is null (not logged in or failed to fetch), navigation guards handle redirects.
  return (
    <ThemeProvider>
      <Outlet />
    </ThemeProvider>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (error instanceof Response) {
    message = `${error.status}`;
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

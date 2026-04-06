import {
    isRouteErrorResponse,
    Links,
    Meta,
    Outlet,
    Scripts,
    ScrollRestoration,
} from "react-router";
import type { MetaFunction, LinksFunction } from "react-router";
import { ThemeProvider } from "~/providers/ThemeProvider";
import { fetchThemeConfig } from "~/.server/themes";
import { getUserFromRequest } from "~/.server/sessions";
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
        content: "AI-powered multi-tenant sustainability platform for managing ESG assessments, knowledge, and intelligence.",
    },
];

export async function loader({ request }: { request: Request }) {
    const user = await getUserFromRequest(request);
    const orgId = user?.orgId;
    const theme = await fetchThemeConfig(orgId ?? "");
    return { user, theme };
}

export function Layout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                <meta charSet="utf-8" />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1"
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

export default function App({ loaderData }: { loaderData: { user: any; theme: any } }) {
    const { theme } = loaderData;
    return (
        <ThemeProvider initialTheme={theme}>
            <Outlet />
        </ThemeProvider>
    );
}

export function ErrorBoundary({ error }: { error: unknown }) {
    let message = "Oops!";
    let details = "An unexpected error occurred.";
    let stack: string | undefined;

    if (isRouteErrorResponse(error)) {
        message = error.status === 404 ? "404" : "Error";
        details =
            error.status === 404
                ? "The requested page could not be found."
                : error.statusText || details;
    } else if (error instanceof Error) {
        details = error.message;
        stack = error.stack;
    }

    return (
        <html lang="en">
            <head>
                <meta charSet="utf-8" />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1"
                />
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
                    <a
                        href="/"
                        className="text-primary underline mt-4 inline-block"
                    >
                        Go home
                    </a>
                </main>
            </body>
        </html>
    );
}

     1|import {
     2|    Links,
     3|    Meta,
     4|    Outlet,
     5|    Scripts,
     6|    ScrollRestoration,
     7|    json,
     8|    redirect,
     9|    type LoaderFunctionArgs,
    10|    type LinksFunction,
    11|    type MetaFunction,
    12|} from "react-router";
    13|import { useRouteError } from "react-router";
    14|
    15|import { ThemeProvider } from "~/providers/ThemeProvider";
    16|import { fetchThemeConfig } from "~/.server/themes";
    17|import { getUserSession } from "~/.server/sessions";
    18|import "./app.css";
    19|
    20|export const links: LinksFunction = () => [
    21|    { rel: "preconnect", href: "https://fonts.googleapis.com" },
    22|    {
    23|        rel: "preconnect",
    24|        href: "https://fonts.gstatic.com",
    25|        crossOrigin: "anonymous" as const,
    26|    },
    27|    {
    28|        rel: "stylesheet",
    29|        href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
    30|    },
    31|];
    32|
    33|export const meta: MetaFunction = () => [
    34|    { title: "Veris" },
    35|    {
    36|        name: "description",
    37|        content: "AI-powered multi-tenant sustainability platform for managing ESG assessments, knowledge, and intelligence.",
    38|    },
    39|];
    40|
    41|export async function loader({ request }: LoaderFunctionArgs) {
    42|    const { user, session } = await getUserSession(request);
    43|    const orgId = user?.orgId;
    44|    const theme = await fetchThemeConfig(orgId ?? "", session);
    45|    return json({ user, theme });
    46|}
    47|
    48|export function Layout({ children }: { children: React.ReactNode }) {
    49|    return (
    50|        <html lang="en">
    51|            <head>
    52|                <meta charSet="utf-8" />
    53|                <meta name="viewport" content="width=device-width, initial-scale=1" />
    54|                <script
    55|                    dangerouslySetInnerHTML={{
    56|                        __html: `(function(){try{var t=localStorage.getItem('theme'),d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme:dark)').matches);if(d){document.documentElement.classList.add('dark')}else{document.documentElement.classList.remove('dark')}}catch(e){}})();`,
    57|                    }}
    59|                />
    60|                <Meta />
    61|                <Links />
    62|            </head>
    63|            <body className="min-h-screen flex flex-col bg-background text-foreground">
    64|                {children}
    65|                <ScrollRestoration />
    66|                <Scripts />
    67|            </body>
    68|        </html>
    69|    );
    70|}
    71|
    72|export default function App({ loaderData }: { loaderData: { user: any; theme: any } }) {
    73|    const { theme } = loaderData;
    74|    // Simplified App component - just ThemeProvider and Outlet
    75|    return (
    76|        <ThemeProvider initialTheme={theme}>
    77|            {/* Temporarily replacing Outlet with static content */}
    78|            <div>Hello World - Rendering Test</div>
    79|        </ThemeProvider>
    80|    );
    81|}
    82|
    83|export function ErrorBoundary() {
    84|    const error = useRouteError();
    85|    let message = "Oops!";
    86|    let details = "An unexpected error occurred.";
    87|    let stack: string | undefined;
    88|
    89|    if (error instanceof Response) {
    90|        message = `${error.status}`;
    91|        details = error.statusText || details;
    92|    } else if (error instanceof Error) {
    93|        details = error.message;
    94|        stack = error.stack;
    95|    }
    96|
    97|    return (
    98|        <html lang="en">
    99|            <head>
   100|                <meta charSet="utf-9" /> {/* Corrected charSet */}
   101|                <meta name="viewport" content="width=device-width, initial-scale=1" />
   102|                <title>{message}</title>
   103|            </head>
   104|            <body className="min-h-screen flex items-center justify-center bg-background text-foreground">
   105|                <main className="p-8 max-w-lg text-center">
   106|                    <h1 className="text-3xl font-bold mb-4">{message}</h1>
   107|                    <p className="text-muted-foreground mb-4">{details}</p>
   108|                    {stack && (
   109|                        <pre className="w-full p-4 overflow-x-auto bg-card rounded-lg text-sm">
   110|                            <code>{stack}</code>
   111|                        </pre>
   112|                    )}
   113|                    <a href="/" className="text-primary underline mt-4 inline-block">Go home</a>
   114|                </main>
   115|            </body>
   116|        </html>
   117|    );
   118|}
   119|
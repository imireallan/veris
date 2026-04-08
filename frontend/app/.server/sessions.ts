     1|import { createCookieSessionStorage, redirect, json, Response } from '@remix-run/node'; // Adapt imports for React Router v7 if needed
     2|
     3|import { API_URL } from './config';
     4|
     5|// Adapt session storage for React Router v7 if createCookieSessionStorage is not directly compatible
     6|// For now, assuming it might work or we adapt it. If not, a custom cookie handler is needed.
     7|const sessionStorage = createCookieSessionStorage({
     8|  cookie: {
     9|    name: "__session",
    10|    httpOnly: true,
    11|    secure: process.env.NODE_ENV === "production",
    12|    sameSite: "lax",
    13|    path: "/",
    14|    secrets: [process.env.SESSION_SECRET || "default-session-secret"], // Ensure SESSION_SECRET is set in .env
    15|  },
    16|});
    17|
    18|export async function getSession(request: Request) {
    19|  // Ensure request has headers property, common in Remix/React Router server contexts
    20|  if (!request.headers) {
    21|      throw new Error("Invalid request object: missing headers");
    22|  }
    23|  return sessionStorage.getSession(request.headers.get("Cookie"));
    24|}
    25|
    26|// Login user endpoint call
    27|export async function loginUser(email: string, password: string): Promise<{ accessToken: string } | { error: string }> {
    28|  try {
    29|    const response = await fetch(`${API_URL}/api/auth/login/`, {
    30|      method: "POST",
    31|      headers: {
    32|        "Content-Type": "application/json",
    33|      },
    34|      body: JSON.stringify({ email, password }),
    35|    });
    36|
    37|    if (!response.ok) {
    38|      const errorData = await response.json().catch(() => ({ detail: "Unknown error response" }));
    39|      console.error("Login API error response:", errorData);
    40|      return { error: errorData.detail || "Invalid credentials or server error" };
    41|    }
    42|
    43|    // Assuming backend returns { access_token: "..." }
    44|    const { access_token } = await response.json();
    45|    if (!access_token || typeof access_token !== "string") {
    46|        return { error: "Login successful but no token received." };
    47|    }
    48|    return { accessToken: access_token };
    49|  } catch (error: any) {
    50|    console.error("Login API call error:", error.message || error);
    51|    return { error: "An unexpected network error occurred during login." };
    52|  }
    53|}
    54|
    55|// Store token in session and redirect
    56|export async function createTokenSession({ accessToken, redirectTo }: { accessToken: string; redirectTo: string }) {
    57|  const session = await sessionStorage.getSession();
    58|  session.set("accessToken", accessToken);
    59|
    60|  // Set the session cookie
    61|  const cookieHeader = await sessionStorage.commitSession(session);
    62|
    63|  // Use React Router's redirect function which handles headers
    64|  // The return value of loader functions often needs to be Response objects or use redirect.
    65|  // Returning a JSON response with headers might not be the standard way for redirects in loaders.
    66|  // Let's return a redirect response directly.
    67|  const headers = new Headers();
    68|  headers.append("Set-Cookie", cookieHeader);
    69|
    70|  // Returning a Response object with Location header for redirect
    71|  return redirect(redirectTo, { headers });
    72|}
    73|
    74|// Logout user
    75|export async function destroySession(request: Request) {
    76|  const session = await sessionStorage.getSession(request.headers.get("Cookie"));
    77|  const headers = new Headers();
    78|  headers.append("Set-Cookie", await sessionStorage.destroySession(session));
    79|  // Redirect to login after logout
    80|  return redirect("/login", { headers });
    81|}
    82|
    83|// Check if authenticated (used in loaders)
    84|export async function isAuthenticated(request: Request): Promise<boolean> {
    85|  const session = await getSession(request.headers.get("Cookie"));
    86|  const accessToken = session.get("accessToken");
    87|  // Basic check: if token exists, assume authenticated.
    88|  // For robust security, verify token validity with a backend call.
    89|  return !!accessToken;
    90|}
    91|
    92|// Mock authenticator if needed for testing or simpler setups, remove if an actual strategy is used
    93|// export const authenticator = { // Mock authenticator for getSession/loginUser compatibility
    94|//   async isAuthenticated(request: Request) {
    95|//     return await isAuthenticated(request);
    96|//   },
    97|//   async getSession(request: Request) {
    98|//     return sessionStorage.getSession(request.headers.get("Cookie"));
    99|//   },
   100|//   // ... other methods if needed
  101|// };
  102|
  103|// Ensure all functions return promises and handle potential async operations
   104|
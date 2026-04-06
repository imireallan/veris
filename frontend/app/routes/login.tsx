import { Form, redirect, useActionData, useSearchParams, useNavigation } from "react-router";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { createTokenSession, loginUser } from "~/.server/sessions";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get("_action");

  if (intent === "login") {
    const email = formData.get("email");
    const password = formData.get("password");

    if (!email || !password) {
      return { error: "Email and password are required" };
    }

    const result = await loginUser(email, password);
    if ("error" in result) return result;

    const redirectTo = (formData.get("redirectTo") as string) || "/";
    return createTokenSession({ accessToken: result.accessToken, redirectTo });
  }

  return { error: "Unknown action" };
}

export function meta() {
  return [{ title: "Sign In — Veris" }];
}

export default function LoginRoute() {
  const actionData = useActionData<typeof action>();
  const [searchParams] = useSearchParams();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-foreground">
              Veris
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Sign in to your account
            </p>
          </div>

          <Form method="post" className="space-y-5">
            <input type="hidden" name="_action" value="login" />

            {actionData?.error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
                {actionData.error}
              </div>
            )}

            <input type="hidden" name="redirectTo" value={searchParams.get("redirectTo") ?? "/"} />

            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="you@company.com"
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isSubmitting ? "Signing in..." : "Sign In"}
            </button>
          </Form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            By signing in you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}

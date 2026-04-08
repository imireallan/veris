import { Form, redirect, useActionData, useSearchParams, useNavigation } from "react-router";
import type { ActionFunctionArgs } from "react-router";
import { createTokenSession, loginUser } from "~/.server/sessions";
import { Button, Input, Card, CardContent, CardHeader, Alert, AlertDescription } from "~/components/ui";
import { Leaf, Loader2 } from "lucide-react";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get("_action");

  if (intent === "login") {
    const email = formData.get("email");
    const password = formData.get("password");

    if (!email || typeof email !== "string" || !password || typeof password !== "string") {
      return { error: "Email and password are required" };
    }

    const result = await loginUser(email, password);
    if ("error" in result) return { error: result.error, field: "password" };

    const redirectTo = (formData.get("redirectTo") as string) || "/";
    return createTokenSession({ accessToken: result.accessToken, redirectTo });
  }

  return { error: "Unknown action" };
}

export function meta() {
  return [{ title: "Sign In — Veris" }];
}

export default function LoginRoute() {
  const actionData = useActionData<{ error: string; field?: string }>();
  const [searchParams] = useSearchParams();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Card className="rounded-2xl shadow-lg">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <Leaf className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Veris</h1>
            <p className="text-sm text-muted-foreground">
              Sign in to your account
            </p>
          </CardHeader>
          <CardContent>
            <Form method="post" className="space-y-4">
              <input type="hidden" name="_action" value="login" />

              {actionData?.error && (
                <Alert variant="destructive">
                  <AlertDescription>{actionData.error}</AlertDescription>
                </Alert>
              )}

              <input type="hidden" name="redirectTo" value={searchParams.get("redirectTo") ?? "/"} />

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="you@company.com"
                  autoComplete="email"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                />
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </Form>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              By signing in you agree to our Terms of Service and Privacy Policy.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

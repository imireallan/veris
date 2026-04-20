import { Form, redirect, useActionData, useSearchParams, useNavigation } from "react-router";
import type { ActionFunctionArgs } from "react-router";
import { createTokenSession, loginUser } from "~/.server/sessions";
import { Button, Input, Card, CardContent, CardHeader, Alert, AlertDescription, Badge } from "~/components/ui";
import { ArrowRight, Leaf, Loader2 } from "lucide-react";
import { ProductDemoPanel } from "~/components/ProductDemoPanel";

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
    return createTokenSession({
      accessToken: result.accessToken,
      redirectTo,
      selectedOrganizationId: result.activeOrganization?.id ?? null,
    });
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
    <div className="min-h-screen bg-[linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted))/0.45)] px-4 py-6 lg:px-6 lg:py-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-7xl gap-6 lg:grid-cols-[0.92fr_1.08fr]">
        <div className="flex items-center justify-center">
          <div className="w-full max-w-lg space-y-6">
            <div className="space-y-3">
              <Badge className="border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-medium text-primary hover:bg-primary/10">
                Trusted workflow for consultancy-led assessments
              </Badge>
              <div className="space-y-2">
                <h1 className="text-4xl font-semibold tracking-tight text-foreground text-balance">
                  Sign in and pick up exactly where your assessment work left off.
                </h1>
                <p className="max-w-xl text-sm leading-6 text-muted-foreground lg:text-base">
                  Access evidence mapping, client workspaces, and organization workflows from one shared Veris workspace.
                </p>
              </div>
            </div>

            <Card className="rounded-[28px] border border-border/70 bg-card/95 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
              <CardHeader className="space-y-3 text-left">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                    <Leaf className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Veris</p>
                    <p className="text-sm text-muted-foreground">Sign in to your account</p>
                  </div>
                </div>
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
                    <label htmlFor="email" className="text-sm font-medium text-foreground">
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
                      className="h-11 rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium text-foreground">
                      Password
                    </label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      required
                      autoComplete="current-password"
                      className="h-11 rounded-xl"
                    />
                    <div className="flex justify-end">
                      <a href="/reset-password" className="text-xs font-medium text-primary hover:underline">
                        Forgot password?
                      </a>
                    </div>
                  </div>

                  <Button type="submit" className="h-11 w-full rounded-xl text-sm font-medium" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign In
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </Form>

                <div className="mt-6 grid gap-3 rounded-2xl border border-border/70 bg-muted/35 p-4 sm:grid-cols-3">
                  <LoginValue stat="Multi-org" label="Consultancy and client workspaces" />
                  <LoginValue stat="AI mapping" label="Evidence mapped to requirements" />
                  <LoginValue stat="One workflow" label="Assessments, invites, and tracking" />
                </div>

                <p className="mt-6 text-center text-xs leading-5 text-muted-foreground">
                  By signing in you agree to our Terms of Service and Privacy Policy.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="hidden lg:flex lg:items-center">
          <ProductDemoPanel />
        </div>
      </div>
    </div>
  );
}

function LoginValue({ stat, label }: { stat: string; label: string }) {
  return (
    <div className="space-y-1 rounded-xl border border-border/60 bg-background/80 px-3 py-3">
      <div className="text-sm font-semibold text-foreground">{stat}</div>
      <div className="text-xs leading-5 text-muted-foreground">{label}</div>
    </div>
  );
}

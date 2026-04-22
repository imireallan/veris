import { Form, Link, useActionData, useNavigation, useSearchParams } from "react-router";
import type { ActionFunctionArgs } from "react-router";
import { ArrowRight, Building2, Leaf, ShieldCheck } from "lucide-react";

import { createTokenSession, loginUser } from "~/.server/sessions";
import { AuthField } from "~/components/auth/auth-field";
import { AuthCard, AuthLayout } from "~/components/auth/auth-layout";
import { AuthPanelHeader } from "~/components/auth/auth-panel-header";
import { PasswordField } from "~/components/auth/password-field";
import { Alert, AlertDescription, Badge, Button, Card, CardContent } from "~/components/ui";
import { getLoginViewModel } from "~/lib/public-route-viewmodels";

const loginProofPoints = [
  {
    title: "Organization-aware access",
    description: "Invitation context and workspace destination stay intact after sign-in.",
  },
  {
    title: "Consistent theme",
    description: "Public auth uses the same visual system as the rest of Veris.",
  },
] as const;

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

    const redirectTo = (formData.get("redirectTo") as string) || "/app";
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
  const redirectTo = searchParams.get("redirectTo") ?? "/app";
  const viewModel = getLoginViewModel(redirectTo);

  return (
    <AuthLayout icon={<Leaf className="h-7 w-7 text-primary" />} title={viewModel.heading} description={viewModel.description}>
      <div className="space-y-4">
        <AuthCard>
          <AuthPanelHeader
            icon={<ShieldCheck className="h-4.5 w-4.5 text-primary" />}
            title={viewModel.helperTitle}
            description={viewModel.helperText}
          />

          <CardContent className="space-y-5 pt-6">
            <Form method="post" className="space-y-4">
              <input type="hidden" name="_action" value="login" />
              <input type="hidden" name="redirectTo" value={redirectTo} />

              {actionData?.error && (
                <Alert variant="destructive">
                  <AlertDescription>{actionData.error}</AlertDescription>
                </Alert>
              )}

              <AuthField
                id="email"
                name="email"
                type="email"
                label="Work email"
                required
                placeholder="you@company.com"
                autoComplete="email"
                autoFocus
              />

              <PasswordField
                id="password"
                name="password"
                label="Password"
                required
                autoComplete="current-password"
                helper={
                  <Link to="/reset-password" className="text-xs font-medium text-primary hover:underline">
                    Forgot password?
                  </Link>
                }
              />

              <Button type="submit" className="h-11 w-full rounded-xl text-sm font-medium" disabled={isSubmitting}>
                {isSubmitting ? (
                  "Signing in..."
                ) : (
                  <>
                    {viewModel.submitLabel}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </Form>

            <div className="grid gap-3 sm:grid-cols-2">
              {loginProofPoints.map((item) => (
                <Card key={item.title} className="border-border/70 bg-muted/20 shadow-none">
                  <CardContent className="space-y-2 p-4">
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    <p className="text-xs leading-5 text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {viewModel.isInvitationLogin ? (
              <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-primary/20 bg-primary/8 px-4 py-3 text-sm text-foreground">
                <Badge className="bg-primary text-primary-foreground hover:bg-primary">Invitation flow</Badge>
                <span>Your redirect context is preserved so you can continue directly into the organization join flow.</span>
              </div>
            ) : (
              <p className="text-center text-xs leading-5 text-muted-foreground">
                By signing in you agree to our Terms of Service and Privacy Policy.
              </p>
            )}
          </CardContent>
        </AuthCard>

        <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            Built for consultancies, compliance teams, and client operators.
          </span>
          <a href="/" className="font-medium text-primary hover:underline">
            View product overview
          </a>
        </div>
      </div>
    </AuthLayout>
  );
}

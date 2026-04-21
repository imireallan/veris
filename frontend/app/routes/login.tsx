import { Form, Link, useActionData, useNavigation, useSearchParams } from "react-router";
import type { ActionFunctionArgs } from "react-router";
import { ArrowRight, Leaf, ShieldCheck } from "lucide-react";

import { createTokenSession, loginUser } from "~/.server/sessions";
import { AuthField } from "~/components/auth/auth-field";
import { AuthCard, AuthLayout } from "~/components/auth/auth-layout";
import { AuthPanelHeader } from "~/components/auth/auth-panel-header";
import { PasswordField } from "~/components/auth/password-field";
import { Alert, AlertDescription, Button, CardContent } from "~/components/ui";

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
  const redirectTo = searchParams.get("redirectTo") ?? "/";
  const isInvitationLogin = redirectTo.startsWith("/invitations/") || redirectTo.startsWith("/onboarding/set-password/");
  const heading = isInvitationLogin ? "Sign in to accept your invitation" : "Sign in to your workspace";
  const description = isInvitationLogin
    ? "Use your existing Veris account to continue into your organization workspace."
    : "Use your Veris account credentials to access your organization workspace.";
  const helperTitle = isInvitationLogin ? "Invitation detected" : "Secure access";
  const helperText = isInvitationLogin
    ? "You already have an account. Sign in to finish joining the organization."
    : "Enter your work email and password to continue.";

  return (
    <AuthLayout
      icon={<Leaf className="h-6 w-6 text-primary" />}
      title={heading}
      description={description}
    >
      <AuthCard>
        <AuthPanelHeader
          icon={<ShieldCheck className="h-4.5 w-4.5 text-primary" />}
          title={helperTitle}
          description={helperText}
        />

        <CardContent className="pt-6">
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
                  {isInvitationLogin ? "Sign In to Continue" : "Sign In"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </Form>

          <p className="mt-5 text-center text-xs leading-5 text-muted-foreground">
            By signing in you agree to our Terms of Service and Privacy Policy.
          </p>
        </CardContent>
      </AuthCard>
    </AuthLayout>
  );
}

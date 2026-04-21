import { useEffect } from "react";
import { data, useFetcher, useLoaderData, useNavigate } from "react-router";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { ArrowRight, Leaf, Mail, ShieldCheck, TriangleAlert, UserPlus } from "lucide-react";

import { api } from "~/.server/lib/api";
import { AuthCard, AuthLayout } from "~/components/auth/auth-layout";
import { AuthPanelHeader } from "~/components/auth/auth-panel-header";
import { AuthStateCard } from "~/components/auth/auth-state-card";
import { PasswordField } from "~/components/auth/password-field";
import { useFetcherToast } from "~/hooks/use-fetcher-toast";
import { useToast } from "~/hooks/use-toast";
import { Alert, AlertDescription, Button, CardContent } from "~/components/ui";

export async function loader({ params, request }: LoaderFunctionArgs) {
  const token = params.token!;

  try {
    const invitation = await api.get<any>(`/api/invitations/${token}/`, null, request);
    return {
      invitation,
      token,
      needsPassword: true,
    };
  } catch (error: any) {
    return {
      invitation: null,
      token,
      error: error.body?.detail || error.message || "Invalid or expired invitation",
    };
  }
}

export async function action({ request, params }: ActionFunctionArgs) {
  const formData = await request.formData();
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;
  const token = params.token!;

  if (!password || !confirmPassword) {
    return data({ error: "Password and confirmation are required" }, { status: 400 });
  }

  if (password.length < 8) {
    return data({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  if (password !== confirmPassword) {
    return data({ error: "Passwords do not match" }, { status: 400 });
  }

  try {
    const result = await api.post<any>(`/api/auth/set-password/`, { token, password });

    return {
      success: true,
      message: result.detail || "Password set successfully! Redirecting to login...",
    };
  } catch (error: any) {
    return data(
      {
        error: error.body?.detail || "Failed to set password",
      },
      { status: error.status || 500 }
    );
  }
}

export function meta() {
  return [{ title: "Set Password — Veris" }];
}

export default function OnboardingSetPasswordRoute() {
  const { invitation, error, token } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const navigate = useNavigate();
  const { success: toastSuccess, error: toastError } = useToast();
  const { handleFetcherResult } = useFetcherToast();
  const isProcessing = fetcher.state === "submitting";
  const response = fetcher.data;

  useEffect(() => {
    handleFetcherResult(fetcher, {
      success: (data: any) => {
        toastSuccess("Password set", data.message as string);
        setTimeout(() => {
          navigate(`/login?redirectTo=${encodeURIComponent(`/invitations/${token}`)}`);
        }, 2000);
      },
      error: (data: any) => toastError("Password setup failed", data.error),
    });
  }, [fetcher, handleFetcherResult, navigate, toastError, toastSuccess, token]);

  if (error || !invitation) {
    return (
      <AuthLayout
        icon={<TriangleAlert className="h-6 w-6 text-destructive" />}
        title="Invalid invitation"
        description={error || "This invitation is invalid or has expired."}
      >
        <AuthStateCard
          tone="destructive"
          message={error || "This invitation is invalid or has expired."}
          actions={[{ label: "Go to Login", onClick: () => navigate("/login") }]}
        />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon={<Leaf className="h-6 w-6 text-primary" />}
      title="Create your Veris password"
      description={
        <>
          Finish joining <span className="font-medium text-foreground">{invitation.organization.name}</span> by creating a password for your account.
        </>
      }
    >
      <AuthCard>
        <AuthPanelHeader
          icon={<UserPlus className="h-4.5 w-4.5 text-primary" />}
          title="Invitation onboarding"
          description={`Set your password once to activate access for ${invitation.email}.`}
        />

        <CardContent className="pt-6">
          <Alert className="mb-4">
            <Mail className="h-4 w-4" />
            <AlertDescription>
              You’re setting up access for <span className="font-medium text-foreground">{invitation.email}</span>.
            </AlertDescription>
          </Alert>

          <fetcher.Form method="post" className="space-y-4">
            {response && "error" in response && (
              <Alert variant="destructive">
                <AlertDescription>{response.error}</AlertDescription>
              </Alert>
            )}

            {response && "success" in response && response.success && (
              <Alert>
                <ShieldCheck className="h-4 w-4" />
                <AlertDescription>{response.message}</AlertDescription>
              </Alert>
            )}

            <PasswordField
              id="password"
              name="password"
              label="Password"
              placeholder="Create your password"
              required
              minLength={8}
              autoComplete="new-password"
            />

            <PasswordField
              id="confirmPassword"
              name="confirmPassword"
              label="Confirm password"
              placeholder="Confirm your password"
              required
              minLength={8}
              autoComplete="new-password"
            />

            <Button type="submit" className="h-11 w-full rounded-xl text-sm font-medium" disabled={isProcessing}>
              {isProcessing ? (
                "Setting password..."
              ) : (
                <>
                  Set Password and Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </fetcher.Form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            Already have a password?{" "}
            <button
              type="button"
              onClick={() => navigate(`/login?redirectTo=${encodeURIComponent(`/invitations/${token}`)}`)}
              className="font-medium text-primary hover:underline"
            >
              Login instead
            </button>
          </p>
        </CardContent>
      </AuthCard>
    </AuthLayout>
  );
}

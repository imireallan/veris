import { useEffect } from "react";
import { data, Link, useFetcher, useNavigate, useParams } from "react-router";
import type { ActionFunctionArgs } from "react-router";
import { ArrowLeft, ArrowRight, KeyRound, Leaf, ShieldCheck, TriangleAlert } from "lucide-react";

import { api } from "~/.server/lib/api";
import { AuthCard, AuthLayout } from "~/components/auth/auth-layout";
import { AuthPanelHeader } from "~/components/auth/auth-panel-header";
import { AuthStateCard } from "~/components/auth/auth-state-card";
import { PasswordField } from "~/components/auth/password-field";
import { useFetcherToast } from "~/hooks/use-fetcher-toast";
import { useToast } from "~/hooks/use-toast";
import { Alert, AlertDescription, Button, CardContent } from "~/components/ui";

export async function action({ request, params }: ActionFunctionArgs) {
  const formData = await request.formData();
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;
  const { uid, token } = params;

  if (!uid || !token) {
    return data({ error: "Invalid reset link" }, { status: 400 });
  }

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
    const result = await api.post<any>(`/api/auth/reset-password/confirm/`, { uid, token, password });

    return {
      success: true,
      message: result.detail || "Password reset successfully!",
    };
  } catch (error: any) {
    return data(
      {
        error: error.body?.detail || "Failed to reset password",
      },
      { status: error.status || 500 }
    );
  }
}

export function meta() {
  return [{ title: "Set New Password — Veris" }];
}

export default function ResetPasswordConfirmRoute() {
  const { uid, token } = useParams<{ uid: string; token: string }>();
  const fetcher = useFetcher<typeof action>();
  const navigate = useNavigate();
  const { success: toastSuccess, error: toastError } = useToast();
  const { handleFetcherResult } = useFetcherToast();
  const isProcessing = fetcher.state === "submitting";
  const response = fetcher.data;

  useEffect(() => {
    handleFetcherResult(fetcher, {
      success: (data: any) => {
        toastSuccess("Password updated", data.message as string);
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      },
      error: (data: any) => toastError("Password update failed", data.error),
    });
  }, [fetcher, handleFetcherResult, navigate, toastError, toastSuccess]);

  if (!uid || !token) {
    return (
      <AuthLayout
        icon={<TriangleAlert className="h-6 w-6 text-destructive" />}
        title="Invalid reset link"
        description="This password reset link is malformed or incomplete. Request a new one to continue."
      >
        <AuthStateCard
          tone="destructive"
          message="This password reset link is invalid."
          actions={[{ label: "Request New Link", onClick: () => navigate("/reset-password") }]}
        />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon={<Leaf className="h-6 w-6 text-primary" />}
      title="Set a new password"
      description="Choose a new password for your Veris account. You’ll be redirected to sign in once the reset is complete."
    >
      <AuthCard>
        <AuthPanelHeader
          icon={<ShieldCheck className="h-4.5 w-4.5 text-primary" />}
          title="Secure password update"
          description="Use at least 8 characters and confirm it once before continuing."
        />

        <CardContent className="pt-6">
          <fetcher.Form method="post" className="space-y-4">
            {response && "error" in response && (
              <Alert variant="destructive">
                <AlertDescription>{response.error}</AlertDescription>
              </Alert>
            )}

            {response && "success" in response && response.success && (
              <Alert>
                <KeyRound className="h-4 w-4" />
                <AlertDescription>{response.message} Redirecting to login…</AlertDescription>
              </Alert>
            )}

            <PasswordField
              id="password"
              name="password"
              label="New password"
              placeholder="Enter your new password"
              required
              minLength={8}
              autoComplete="new-password"
            />

            <PasswordField
              id="confirmPassword"
              name="confirmPassword"
              label="Confirm new password"
              placeholder="Confirm your new password"
              required
              minLength={8}
              autoComplete="new-password"
            />

            <Button type="submit" className="h-11 w-full rounded-xl text-sm font-medium" disabled={isProcessing}>
              {isProcessing ? (
                "Resetting password..."
              ) : (
                <>
                  Reset Password
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </fetcher.Form>

          <div className="mt-5 text-center">
            <Link to="/login" className="inline-flex items-center text-sm font-medium text-primary hover:underline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to login
            </Link>
          </div>
        </CardContent>
      </AuthCard>
    </AuthLayout>
  );
}

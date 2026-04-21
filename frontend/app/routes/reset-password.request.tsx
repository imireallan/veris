import { useEffect } from "react";
import { data, Link, useFetcher } from "react-router";
import type { ActionFunctionArgs } from "react-router";
import { ArrowLeft, ArrowRight, Leaf, Mail, ShieldCheck } from "lucide-react";

import { api } from "~/.server/lib/api";
import { AuthField } from "~/components/auth/auth-field";
import { AuthCard, AuthLayout } from "~/components/auth/auth-layout";
import { AuthPanelHeader } from "~/components/auth/auth-panel-header";
import { useFetcherToast } from "~/hooks/use-fetcher-toast";
import { useToast } from "~/hooks/use-toast";
import { Alert, AlertDescription, Button, CardContent } from "~/components/ui";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get("email") as string;

  if (!email) {
    return data({ error: "Email is required" }, { status: 400 });
  }

  if (!email.includes("@")) {
    return data({ error: "Please enter a valid email address" }, { status: 400 });
  }

  try {
    await api.post<any>(`/api/auth/reset-password/request/`, { email });

    return {
      success: true,
      message: "If this email exists, a password reset link has been sent.",
    };
  } catch (error: any) {
    return data(
      {
        error: error.body?.detail || "Failed to send reset link",
      },
      { status: error.status || 500 }
    );
  }
}

export function meta() {
  return [{ title: "Reset Password — Veris" }];
}

export default function ResetPasswordRequestRoute() {
  const fetcher = useFetcher<typeof action>();
  const { success: toastSuccess, error: toastError } = useToast();
  const { handleFetcherResult } = useFetcherToast();
  const isProcessing = fetcher.state === "submitting";
  const response = fetcher.data;

  useEffect(() => {
    handleFetcherResult(fetcher, {
      success: (data: any) => toastSuccess("Password reset email sent", data.message as string),
      error: (data: any) => toastError("Password reset failed", data.error),
    });
  }, [fetcher, handleFetcherResult, toastError, toastSuccess]);

  return (
    <AuthLayout
      icon={<Leaf className="h-6 w-6 text-primary" />}
      title="Reset your password"
      description="Enter your work email and we’ll send a secure link to reset your password."
    >
      <AuthCard>
        <AuthPanelHeader
          icon={<ShieldCheck className="h-4.5 w-4.5 text-primary" />}
          title="Secure password recovery"
          description="We’ll email a time-sensitive reset link if the account exists."
        />

        <CardContent className="pt-6">
          <fetcher.Form method="post" className="space-y-4">
            {response && "error" in response && (
              <Alert variant="destructive">
                <Mail className="h-4 w-4" />
                <AlertDescription>{response.error}</AlertDescription>
              </Alert>
            )}

            {response && "success" in response && response.success && (
              <Alert>
                <Mail className="h-4 w-4" />
                <AlertDescription>{response.message}</AlertDescription>
              </Alert>
            )}

            <AuthField
              id="email"
              name="email"
              type="email"
              label="Work email"
              placeholder="you@company.com"
              required
              autoComplete="email"
              autoFocus
            />

            <Button type="submit" className="h-11 w-full rounded-xl text-sm font-medium" disabled={isProcessing}>
              {isProcessing ? (
                "Sending reset link..."
              ) : (
                <>
                  Send Reset Link
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

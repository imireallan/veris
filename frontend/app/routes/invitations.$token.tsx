import { useEffect } from "react";
import { data, redirect, useFetcher, useLoaderData, useNavigate } from "react-router";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  Leaf,
  LogIn,
  Mail,
  ShieldCheck,
  TriangleAlert,
  User,
  UserPlus,
} from "lucide-react";

import { api } from "~/.server/lib/api";
import { getUserToken } from "~/.server/sessions";
import { AuthCard, AuthLayout } from "~/components/auth/auth-layout";
import { AuthPanelHeader } from "~/components/auth/auth-panel-header";
import { AuthStateCard } from "~/components/auth/auth-state-card";
import { useFetcherToast } from "~/hooks/use-fetcher-toast";
import { useToast } from "~/hooks/use-toast";
import { Alert, AlertDescription, Badge, Button, CardContent } from "~/components/ui";

export async function loader({ params, request }: LoaderFunctionArgs) {
  const token = params.token!;
  const sessionToken = await getUserToken(request);

  try {
    const invitation = await api.get<any>(`/api/invitations/${token}/`, null, request);

    if (sessionToken && invitation.status === "ACCEPTED" && !invitation.needs_onboarding) {
      throw redirect("/app");
    }

    return { invitation, token, hasSession: Boolean(sessionToken) };
  } catch (error: any) {
    if (error instanceof Response) {
      throw error;
    }

    return {
      invitation: null,
      token,
      hasSession: Boolean(sessionToken),
      error: error.body?.detail || error.message || "Invalid or expired invitation",
    };
  }
}

export async function action({ request, params }: ActionFunctionArgs) {
  const token = params.token!;
  const sessionToken = await getUserToken(request);

  try {
    const invitation = await api.get<any>(`/api/invitations/${token}/`, null, request);

    if (invitation.needs_onboarding) {
      return { success: true, redirectTo: `/onboarding/set-password/${token}` };
    }

    if (!sessionToken) {
      return {
        success: true,
        redirectTo: `/login?redirectTo=${encodeURIComponent(`/invitations/${token}`)}`,
      };
    }

    const result = await api.post<any>(`/api/invitations/${token}/accept/`, null, sessionToken, request);

    if (result.needs_onboarding) {
      return { success: true, redirectTo: `/onboarding/set-password/${token}` };
    }

    return { success: true, redirectTo: "/app" };
  } catch (error: any) {
    return data(
      { error: error.body?.detail || "Failed to accept invitation" },
      { status: error.status || 500 }
    );
  }
}

export function meta() {
  return [{ title: "Invitation — Veris" }];
}

export default function InvitationAcceptRoute() {
  const { invitation, error, hasSession, token } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const navigate = useNavigate();
  const { error: toastError, success: toastSuccess } = useToast();
  const { handleFetcherResult } = useFetcherToast();
  const isProcessing = fetcher.state === "submitting";
  const response = fetcher.data;

  useEffect(() => {
    handleFetcherResult(fetcher, {
      success: (data: any) => {
        toastSuccess("Invitation accepted", "Redirecting you to the next step.");
        if ("redirectTo" in data) {
          navigate(data.redirectTo as string);
        }
      },
      error: (data: any) => toastError("Invitation action failed", data.error),
    });
  }, [fetcher, handleFetcherResult, navigate, toastError, toastSuccess]);

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

  if (invitation.status === "EXPIRED") {
    return (
      <AuthLayout
        icon={<Clock className="h-6 w-6 text-primary" />}
        title="Invitation expired"
        description={
          <>
            This invite expired on <span className="font-medium text-foreground">{new Date(invitation.expires_at).toLocaleDateString()}</span>. Contact your organization admin to request a new one.
          </>
        }
      >
        <AuthStateCard
          message="This invitation can no longer be used."
          actions={[{ label: "Go to Login", onClick: () => navigate("/login"), variant: "outline" }]}
        />
      </AuthLayout>
    );
  }

  if (invitation.status === "ACCEPTED") {
    return (
      <AuthLayout
        icon={<CheckCircle2 className="h-6 w-6 text-primary" />}
        title="Invitation already accepted"
        description={
          <>
            You’ve already joined <span className="font-medium text-foreground">{invitation.organization.name}</span>. Sign in to continue.
          </>
        }
      >
        <AuthStateCard
          message="Your membership is already active."
          actions={[
            {
              label: "Login to Continue",
              onClick: () => navigate("/login"),
              icon: <LogIn className="mr-2 h-4 w-4" />,
            },
          ]}
        />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon={<Leaf className="h-6 w-6 text-primary" />}
      title="Review your invitation"
      description={
        <>
          Join <span className="font-medium text-foreground">{invitation.organization.name}</span> on Veris and continue with the access flow configured for your account.
        </>
      }
      widthClassName="max-w-2xl"
    >
      <AuthCard>
        <AuthPanelHeader
          icon={<UserPlus className="h-4.5 w-4.5 text-primary" />}
          title="Organization invite"
          description="Confirm the invite details below before continuing into onboarding or sign-in."
        />

        <CardContent className="space-y-6 pt-6">
          {response && "error" in response && (
            <Alert variant="destructive">
              <AlertDescription>{response.error}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Organization</p>
              <div className="mt-2 flex items-center gap-2 text-sm font-medium text-foreground">
                <Building2 className="h-4 w-4 text-primary" />
                <span>{invitation.organization.name}</span>
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Work email</p>
              <div className="mt-2 flex items-center gap-2 text-sm font-medium text-foreground">
                <Mail className="h-4 w-4 text-primary" />
                <span>{invitation.email}</span>
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Assigned role</p>
              <div className="mt-2 flex items-center gap-2 text-sm font-medium text-foreground">
                <User className="h-4 w-4 text-primary" />
                <Badge variant="secondary" className="rounded-full px-2.5 py-1">
                  {invitation.role_name}
                </Badge>
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Invited by</p>
              <div className="mt-2 flex items-center gap-2 text-sm font-medium text-foreground">
                <User className="h-4 w-4 text-primary" />
                <span>{invitation.invited_by}</span>
              </div>
            </div>
          </div>

          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              This invitation expires on {new Date(invitation.expires_at).toLocaleDateString()}.
            </AlertDescription>
          </Alert>

          <fetcher.Form method="post" className="space-y-3">
            <input type="hidden" name="action" value="accept" />

            <Button type="submit" className="h-11 w-full rounded-xl text-sm font-medium" disabled={isProcessing}>
              {isProcessing ? (
                "Processing invitation..."
              ) : (
                <>
                  {invitation.needs_onboarding
                    ? "Continue to Set Password"
                    : hasSession
                      ? "Accept Invitation"
                      : "Login to Accept Invitation"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </fetcher.Form>

          <p className="text-center text-sm text-muted-foreground">
            Already have a Veris account?{" "}
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

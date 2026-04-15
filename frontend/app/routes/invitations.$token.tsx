import { useFetcher, useLoaderData, useNavigate } from "react-router";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { data } from "react-router";
import { api } from "~/.server/lib/api";
import { useToast } from "~/hooks/use-toast";
import { useFetcherToast } from "~/hooks/use-fetcher-toast";
import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription, Alert, AlertDescription, Badge } from "~/components/ui";
import { CheckCircle2, XCircle, Mail, Building2, User, Clock, LogIn } from "lucide-react";
import { useEffect } from "react";

// This route does NOT require authentication
// Users can accept invitation and set password in one flow
export async function loader({ params, request }: LoaderFunctionArgs) {
  const token = params.token!;

  try {
    // Pass request but NO token - this is a public endpoint
    const invitation = await api.get<any>(`/api/invitations/${token}/`, null, request);
    return { invitation, token };
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
  const actionType = formData.get("action") as string;
  const token = params.token!;

  if (actionType !== "accept") {
    return data({ error: "Invalid action" }, { status: 400 });
  }

  // For accept, we just redirect to onboarding
  // The actual acceptance happens when they set their password
  return { 
    success: true, 
    redirectTo: `/onboarding/set-password/${token}`
  };
}

export default function InvitationAcceptRoute() {
  const { invitation, error, token } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const navigate = useNavigate();
  const { success: toastSuccess, error: toastError } = useToast();
  const { handleFetcherResult } = useFetcherToast();

  useEffect(() => {
    handleFetcherResult(fetcher, {
      success: (data: any) => {
        if ("redirectTo" in data) {
          navigate(data.redirectTo as string);
        }
      },
      error: (data: any) => toastError("Action failed", data.error),
    });
  }, [fetcher, toastSuccess, toastError, navigate]);

  const isProcessing = fetcher.state === "submitting";

  // Error state - invalid/expired invitation
  if (error || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <XCircle className="w-16 h-16 mx-auto text-destructive mb-4" />
            <CardTitle className="text-2xl">Invalid Invitation</CardTitle>
            <CardDescription>
              {error || "This invitation is invalid or has expired."}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate("/login")}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Expired invitation
  if (invitation.status === "EXPIRED") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <Clock className="w-16 h-16 mx-auto text-orange-500 mb-4" />
            <CardTitle className="text-2xl">Invitation Expired</CardTitle>
            <CardDescription>
              This invitation expired on {new Date(invitation.expires_at).toLocaleDateString()}.
              Please contact the organization admin to send a new invitation.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button variant="outline" onClick={() => navigate("/login")}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Already accepted
  if (invitation.status === "ACCEPTED") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CheckCircle2 className="w-16 h-16 mx-auto text-green-600 mb-4" />
            <CardTitle className="text-2xl">Already Accepted</CardTitle>
            <CardDescription>
              You've already joined {invitation.organization.name}.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate("/login")}>
              <LogIn className="w-4 h-4 mr-2" />
              Login to Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Pending invitation - show acceptance page
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <Building2 className="w-16 h-16 mx-auto text-primary mb-4" />
          <CardTitle className="text-2xl">You're Invited!</CardTitle>
          <CardDescription>
            Join {invitation.organization.name} on Veris
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 mb-6">
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">Organization</div>
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                <span className="font-medium">{invitation.organization.name}</span>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">Your Email</div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span className="font-medium">{invitation.email}</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">Your Role</div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <Badge variant="secondary">{invitation.role_name}</Badge>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">Invited By</div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span className="font-medium">{invitation.invited_by}</span>
              </div>
            </div>
          </div>

          <Alert className="mb-6">
            <Clock className="h-4 w-4" />
            <AlertDescription>
              This invitation expires on {new Date(invitation.expires_at).toLocaleDateString()}
            </AlertDescription>
          </Alert>

          <fetcher.Form method="post" className="space-y-3">
            <input type="hidden" name="action" value="accept" />
            
            <Button type="submit" className="w-full" size="lg" disabled={isProcessing}>
              {isProcessing ? "Processing..." : "Accept Invitation & Set Password"}
            </Button>
          </fetcher.Form>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Button variant="link" className="p-0" onClick={() => navigate("/login")}>
              Login instead
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

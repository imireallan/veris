import { useFetcher, useLoaderData, useNavigate, useParams } from "react-router";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { data, redirect } from "react-router";
import { api } from "~/.server/lib/api";
import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription, Alert, AlertDescription, Input, Label } from "~/components/ui";
import { CheckCircle2, XCircle, Lock, Mail } from "lucide-react";
import { useToast } from "~/hooks/use-toast";
import { useEffect, useRef } from "react";

// Public route - no auth required
export async function loader({ params, request }: LoaderFunctionArgs) {
  const token = params.token!;

  try {
    // Pass request but NO token - this is a public endpoint
    const invitation = await api.get<any>(`/api/invitations/${token}/`, null, request);
    return { 
      invitation, 
      token,
      needsPassword: true 
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
    return data(
      { error: "Password and confirmation are required" },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return data(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }

  if (password !== confirmPassword) {
    return data(
      { error: "Passwords do not match" },
      { status: 400 }
    );
  }

  try {
    const result = await api.post<any>(
      `/api/auth/set-password/`,
      { token, password }
    );

    return { 
      success: true, 
      message: result.detail || "Password set successfully! Redirecting to login..." 
    };
  } catch (error: any) {
    return data(
      { 
        error: error.body?.detail || "Failed to set password" 
      },
      { status: error.status || 500 }
    );
  }
}

export default function OnboardingSetPasswordRoute() {
  const { invitation, error, token } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const navigate = useNavigate();
  const { success: toastSuccess, error: toastError } = useToast();
  const hasShownToast = useRef(false);

  useEffect(() => {
    if (fetcher.data && !hasShownToast.current) {
      if ("success" in fetcher.data && fetcher.data.success) {
        toastSuccess("Success", fetcher.data.message as string);
        hasShownToast.current = true;
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else if ("error" in fetcher.data && fetcher.data.error) {
        toastError("Error", fetcher.data.error);
        hasShownToast.current = true;
      }
    }
    if (fetcher.state === "idle" && fetcher.data === null) {
      hasShownToast.current = false;
    }
  }, [fetcher.data, fetcher.state, toastSuccess, toastError, navigate]);

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <CheckCircle2 className="w-16 h-16 mx-auto text-green-600 mb-4" />
          <CardTitle className="text-2xl">Set Your Password</CardTitle>
          <CardDescription>
            Welcome to {invitation.organization.name}! Create a password to access your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <Mail className="h-4 w-4" />
            <AlertDescription>
              <strong>Email:</strong> {invitation.email}
            </AlertDescription>
          </Alert>

          <fetcher.Form method="post" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isProcessing}>
              {isProcessing ? "Setting Password..." : "Set Password & Continue"}
            </Button>
          </fetcher.Form>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            Already have a password?{" "}
            <Button variant="link" className="p-0" onClick={() => navigate("/login")}>
              Login instead
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

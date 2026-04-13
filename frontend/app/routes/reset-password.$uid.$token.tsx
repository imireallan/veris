import { useFetcher, useNavigate, useParams } from "react-router";
import type { ActionFunctionArgs } from "react-router";
import { data } from "react-router";
import { api } from "~/.server/lib/api";
import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription, Input, Label } from "~/components/ui";
import { CheckCircle2, Lock } from "lucide-react";
import { useToast } from "~/hooks/use-toast";
import { useEffect, useRef } from "react";

export async function action({ request, params }: ActionFunctionArgs) {
  const formData = await request.formData();
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;
  const { uid, token } = params;

  if (!uid || !token) {
    return data(
      { error: "Invalid reset link" },
      { status: 400 }
    );
  }

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
      `/api/auth/reset-password/confirm/`,
      { uid, token, password }
    );

    return { 
      success: true, 
      message: result.detail || "Password reset successfully!" 
    };
  } catch (error: any) {
    return data(
      { 
        error: error.body?.detail || "Failed to reset password" 
      },
      { status: error.status || 500 }
    );
  }
}

export default function ResetPasswordConfirmRoute() {
  const { uid, token } = useParams<{ uid: string; token: string }>();
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

  if (!uid || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Invalid Link</CardTitle>
            <CardDescription>
              This password reset link is invalid.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate("/reset-password")}>
              Request New Link
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
          <CardTitle className="text-2xl">Set New Password</CardTitle>
          <CardDescription>
            Enter your new password below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <fetcher.Form method="post" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter new password"
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isProcessing}>
              {isProcessing ? "Resetting..." : "Reset Password"}
            </Button>
          </fetcher.Form>
        </CardContent>
      </Card>
    </div>
  );
}

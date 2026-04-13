import { useFetcher, useNavigate } from "react-router";
import type { ActionFunctionArgs } from "react-router";
import { data } from "react-router";
import { api } from "~/.server/lib/api";
import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription, Input, Label } from "~/components/ui";
import { Mail, ArrowLeft } from "lucide-react";
import { useToast } from "~/hooks/use-toast";
import { useEffect, useRef } from "react";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get("email") as string;

  if (!email) {
    return data(
      { error: "Email is required" },
      { status: 400 }
    );
  }

  if (!email.includes("@")) {
    return data(
      { error: "Please enter a valid email address" },
      { status: 400 }
    );
  }

  try {
    await api.post<any>(
      `/api/auth/reset-password/request/`,
      { email }
    );

    return { 
      success: true, 
      message: "If this email exists, a password reset link has been sent." 
    };
  } catch (error: any) {
    return data(
      { 
        error: error.body?.detail || "Failed to send reset link" 
      },
      { status: error.status || 500 }
    );
  }
}

export default function ResetPasswordRequestRoute() {
  const fetcher = useFetcher<typeof action>();
  const navigate = useNavigate();
  const { success: toastSuccess, error: toastError } = useToast();
  const hasShownToast = useRef(false);

  useEffect(() => {
    if (fetcher.data && !hasShownToast.current) {
      if ("success" in fetcher.data && fetcher.data.success) {
        toastSuccess("Success", fetcher.data.message as string);
        hasShownToast.current = true;
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <Mail className="w-16 h-16 mx-auto text-primary mb-4" />
          <CardTitle className="text-2xl">Reset Password</CardTitle>
          <CardDescription>
            Enter your email address and we'll send you a link to reset your password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <fetcher.Form method="post" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isProcessing}>
              {isProcessing ? "Sending..." : "Send Reset Link"}
            </Button>
          </fetcher.Form>

          <div className="mt-4 text-center">
            <Button variant="link" onClick={() => navigate("/login")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

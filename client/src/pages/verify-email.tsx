import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, Mail, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function VerifyEmail() {
  const [, setLocation] = useLocation();
  const [verificationState, setVerificationState] = useState<{
    status: "loading" | "success" | "error";
    message: string;
    userType?: "employee" | "company";
  }>({
    status: "loading",
    message: "Verifying your email..."
  });
  const [resendEmail, setResendEmail] = useState("");
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");

    if (!token) {
      setVerificationState({
        status: "error",
        message: "Invalid verification link. No token found."
      });
      return;
    }

    // Verify the signup token
    verifySignupToken(token);
  }, []);

  const verifySignupToken = async (token: string) => {
    try {
      const response = await apiRequest(`/api/auth/verify-signup?token=${token}`);
      
      setVerificationState({
        status: "success",
        message: response.message || "Email verified successfully! Your account has been created.",
        userType: response.userType
      });

    } catch (error: any) {
      setVerificationState({
        status: "error",
        message: error.message || "Failed to verify email. The link may be expired or invalid."
      });
    }
  };

  const handleResendVerification = async () => {
    if (!resendEmail) return;

    setIsResending(true);
    try {
      await apiRequest("/api/auth/resend-signup-verification", {
        method: "POST",
        body: { email: resendEmail }
      });

      alert("Verification email sent! Please check your inbox.");
      setResendEmail("");
    } catch (error: any) {
      alert(error.message || "Failed to resend verification email");
    } finally {
      setIsResending(false);
    }
  };

  const handleLoginRedirect = () => {
    setLocation("/auth");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {verificationState.status === "loading" && (
              <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
            )}
            {verificationState.status === "success" && (
              <CheckCircle className="h-12 w-12 text-green-600" />
            )}
            {verificationState.status === "error" && (
              <XCircle className="h-12 w-12 text-red-600" />
            )}
          </div>
          <CardTitle className="text-xl">
            {verificationState.status === "loading" && "Verifying Email"}
            {verificationState.status === "success" && "Email Verified!"}
            {verificationState.status === "error" && "Verification Failed"}
          </CardTitle>
          <CardDescription className="text-sm text-gray-600">
            {verificationState.message}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {verificationState.status === "success" && (
            <div className="space-y-4">
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Your account has been successfully created and verified. You can now log in to access your {verificationState.userType === "employee" ? "employee" : "company"} dashboard.
                </AlertDescription>
              </Alert>
              
              <Button 
                onClick={handleLoginRedirect}
                className="w-full"
                data-testid="button-login-redirect"
              >
                Continue to Login
              </Button>
            </div>
          )}

          {verificationState.status === "error" && (
            <div className="space-y-4">
              <Alert className="border-red-200 bg-red-50">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {verificationState.message}
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Didn't receive the verification email or need a new one?
                </p>
                
                <div className="space-y-2">
                  <input
                    type="email"
                    placeholder="Enter your email address"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    data-testid="input-resend-email"
                  />
                  
                  <Button
                    onClick={handleResendVerification}
                    disabled={!resendEmail || isResending}
                    variant="outline"
                    className="w-full"
                    data-testid="button-resend-verification"
                  >
                    {isResending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4 mr-2" />
                        Resend Verification Email
                      </>
                    )}
                  </Button>
                </div>
              </div>
              
              <Button 
                onClick={() => setLocation("/auth")}
                variant="outline"
                className="w-full"
                data-testid="button-back-to-signup"
              >
                Back to Sign Up
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
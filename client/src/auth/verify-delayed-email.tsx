import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, Loader2, Mail, ArrowLeft, Shield } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function VerifyDelayedEmail() {
  const [, setLocation] = useLocation();
  const [searchParams] = useState(() => new URLSearchParams(window.location.search));
  const { toast } = useToast();
  
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  
  const [verificationStatus, setVerificationStatus] = useState<"pending" | "success" | "error">("pending");
  const [errorMessage, setErrorMessage] = useState("");

  // Verify email mutation
  const verifyEmailMutation = useMutation({
    mutationFn: async () => {
      if (!token || !email) {
        throw new Error("Missing verification token or email");
      }
      
      const response = await fetch("/api/secure-email/verify-delayed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          verificationToken: token, 
          email: decodeURIComponent(email) 
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Verification failed");
      }
      return response.json();
    },
    onSuccess: () => {
      setVerificationStatus("success");
      toast({
        title: "Email Verified!",
        description: "Your email has been successfully verified and is now your locked primary email.",
      });
      
      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        setLocation("/");
      }, 3000);
    },
    onError: (error: Error) => {
      setVerificationStatus("error");
      setErrorMessage(error.message || "Verification failed");
      toast({
        title: "Verification Failed",
        description: error.message || "Failed to verify email",
        variant: "destructive",
      });
    },
  });

  // Auto-trigger verification on component mount
  useEffect(() => {
    if (token && email && verificationStatus === "pending") {
      verifyEmailMutation.mutate();
    }
  }, [token, email, verificationStatus]);

  // Handle missing parameters
  if (!token || !email) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Invalid Verification Link
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>
                This verification link is invalid or malformed. Please check your email for the correct link or request a new verification email.
              </AlertDescription>
            </Alert>
            <Button 
              onClick={() => setLocation("/")} 
              className="w-full"
              data-testid="button-return-home"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Verification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Pending State */}
          {verificationStatus === "pending" && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold">Verifying Your Email</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Please wait while we verify your email address...
                </p>
                <p className="text-xs text-gray-500 mt-2 font-mono">
                  {decodeURIComponent(email)}
                </p>
              </div>
            </div>
          )}

          {/* Success State */}
          {verificationStatus === "success" && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-green-800">Email Verified Successfully!</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Your email has been verified and is now your locked primary email.
                </p>
                <p className="text-xs text-gray-500 mt-2 font-mono">
                  {decodeURIComponent(email)}
                </p>
              </div>
              
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <strong>Important:</strong> Your email is now locked for security. Future changes will require password confirmation and 2FA verification.
                </AlertDescription>
              </Alert>

              <div className="text-xs text-gray-500">
                Redirecting to dashboard in 3 seconds...
              </div>
            </div>
          )}

          {/* Error State */}
          {verificationStatus === "error" && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <XCircle className="h-12 w-12 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-red-800">Verification Failed</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {errorMessage || "We couldn't verify your email address."}
                </p>
                <p className="text-xs text-gray-500 mt-2 font-mono">
                  {decodeURIComponent(email)}
                </p>
              </div>
              
              <Alert variant="destructive">
                <AlertDescription>
                  This verification link may have expired or already been used. Please request a new verification email from your account settings.
                </AlertDescription>
              </Alert>

              <Button 
                onClick={() => setLocation("/")} 
                className="w-full"
                data-testid="button-return-dashboard"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Return to Dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
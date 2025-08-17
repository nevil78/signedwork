import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import {
  CheckCircle,
  AlertTriangle,
  Shield,
  Mail,
  ArrowRight,
  Loader2
} from "lucide-react";

export default function VerifyEmailChange() {
  const [, setLocation] = useLocation();
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean;
    message: string;
    user?: any;
  } | null>(null);

  // Get token and email from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const email = urlParams.get('email');

  const verifyMutation = useMutation({
    mutationFn: async ({ token, email }: { token: string; email: string }) => {
      const response = await fetch("/api/secure-email/verify-change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationToken: token,
          email: email,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to verify email change");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setVerificationResult({
        success: true,
        message: "Email successfully changed! You can now use your new email to log in.",
        user: data.user
      });
    },
    onError: (error: any) => {
      setVerificationResult({
        success: false,
        message: error.message || "Failed to verify email change. The link may be expired or invalid."
      });
    },
  });

  useEffect(() => {
    if (token && email) {
      verifyMutation.mutate({ token, email });
    } else {
      setVerificationResult({
        success: false,
        message: "Invalid verification link. Missing token or email parameter."
      });
    }
  }, [token, email]);

  const goToLogin = () => {
    setLocation("/auth");
  };

  const goToDashboard = () => {
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <CardTitle className="text-xl">Email Verification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Loading State */}
            {verifyMutation.isPending && (
              <div className="text-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
                <div>
                  <h3 className="font-semibold">Verifying Email Change</h3>
                  <p className="text-sm text-gray-600">
                    Please wait while we verify your new email address...
                  </p>
                </div>
              </div>
            )}

            {/* Verification Result */}
            {verificationResult && (
              <div className="space-y-4">
                <Alert className={verificationResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                  <div className="flex items-center space-x-2">
                    {verificationResult.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    )}
                    <AlertDescription className={verificationResult.success ? "text-green-800" : "text-red-800"}>
                      {verificationResult.message}
                    </AlertDescription>
                  </div>
                </Alert>

                {verificationResult.success && email && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center space-x-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <Mail className="h-5 w-5 text-green-600" />
                      <div className="text-center">
                        <p className="font-semibold text-green-800">Primary Email Updated</p>
                        <p className="text-sm text-green-700">{email}</p>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-800 mb-2">What happens next:</h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Use your new email for future logins</li>
                        <li>• Your old email has been detached (30-day grace period)</li>
                        <li>• All notifications will be sent to your new email</li>
                        <li>• Your account security remains protected</li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col space-y-2">
                  {verificationResult.success ? (
                    <>
                      <Button 
                        onClick={goToDashboard} 
                        className="w-full"
                        data-testid="button-go-dashboard"
                      >
                        <ArrowRight className="h-4 w-4 mr-2" />
                        Go to Dashboard
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={goToLogin}
                        className="w-full"
                        data-testid="button-go-login"
                      >
                        Go to Login
                      </Button>
                    </>
                  ) : (
                    <Button 
                      variant="outline" 
                      onClick={goToLogin}
                      className="w-full"
                      data-testid="button-back-login"
                    >
                      Back to Login
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Security Information */}
            <div className="pt-4 border-t">
              <div className="flex items-start space-x-2">
                <Shield className="h-4 w-4 text-gray-400 mt-0.5" />
                <div className="text-xs text-gray-600">
                  <p className="font-medium">Security Notice</p>
                  <p>
                    Email changes are logged for security. If you didn't request this change, 
                    please contact support immediately.
                  </p>
                </div>
              </div>
            </div>

            {/* Email Information */}
            {email && (
              <div className="pt-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Verifying email:</span>
                  <Badge variant="outline" className="font-mono text-xs">
                    {email}
                  </Badge>
                </div>
              </div>
            )}

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
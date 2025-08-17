import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Mail, Clock, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PostLoginVerificationProps {
  email: string;
  onVerificationComplete: () => void;
}

export default function PostLoginVerification({ email, onVerificationComplete }: PostLoginVerificationProps) {
  const [verificationCode, setVerificationCode] = useState("");
  const [step, setStep] = useState<"prompt" | "verify">("prompt");
  const [countdown, setCountdown] = useState(0);

  // Get verification status
  const { data: verificationStatus, refetch: refetchStatus } = useQuery({
    queryKey: ["/api/post-login-verification/status", email],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/post-login-verification/status?email=${encodeURIComponent(email)}`);
      return response.json();
    },
    refetchInterval: step === "verify" ? 5000 : false,
  });

  // Send OTP mutation
  const sendOTPMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/post-login-verification/send-otp", {
        email,
      });
      return response.json();
    },
    onSuccess: () => {
      setStep("verify");
      setCountdown(60);
      refetchStatus();
    },
    onError: (error: any) => {
      console.error("Send OTP error:", error);
    },
  });

  // Verify OTP mutation
  const verifyOTPMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiRequest("POST", "/api/post-login-verification/verify-otp", {
        email,
        code,
      });
      return response.json();
    },
    onSuccess: () => {
      onVerificationComplete();
    },
    onError: (error: any) => {
      console.error("Verify OTP error:", error);
    },
  });

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Auto-submit when 6 digits entered
  useEffect(() => {
    if (verificationCode.length === 6 && step === "verify") {
      verifyOTPMutation.mutate(verificationCode);
    }
  }, [verificationCode, step]);

  const handleSendOTP = () => {
    sendOTPMutation.mutate();
  };

  const handleResendOTP = () => {
    sendOTPMutation.mutate();
    setCountdown(60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (verificationStatus?.isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle className="text-xl">Email Verified!</CardTitle>
            <CardDescription>Your email has been successfully verified</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle className="text-xl">Verify Your Email</CardTitle>
          <CardDescription>
            Please verify your email address to continue using Signedwork
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Email Address:</p>
            <Badge variant="secondary" className="text-sm">{email}</Badge>
          </div>

          {step === "prompt" && (
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Your email address needs to be verified for security purposes. Click the button below to receive a verification code.
                </AlertDescription>
              </Alert>
              
              <Button 
                onClick={handleSendOTP}
                disabled={sendOTPMutation.isPending}
                className="w-full"
                data-testid="button-send-verification"
              >
                {sendOTPMutation.isPending ? "Sending..." : "Verify Email"}
              </Button>
            </div>
          )}

          {step === "verify" && (
            <div className="space-y-4">
              <Alert>
                <Mail className="h-4 w-4" />
                <AlertDescription>
                  A 6-digit verification code has been sent to your email. Please check your inbox and spam folder.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="verification-code">Verification Code</Label>
                <Input
                  id="verification-code"
                  type="text"
                  value={verificationCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').substring(0, 6);
                    setVerificationCode(value);
                  }}
                  placeholder="Enter 6-digit code"
                  className="text-center text-lg tracking-widest"
                  maxLength={6}
                  disabled={verifyOTPMutation.isPending}
                  data-testid="input-verification-code"
                />
              </div>

              {verifyOTPMutation.error && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {(verifyOTPMutation.error as any)?.message || "Invalid verification code. Please try again."}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>Code expires in 10 minutes</span>
                </div>
                
                {verificationStatus?.hasPendingVerification && !verificationStatus?.canResend && (
                  <span>Resend in {verificationStatus.timeUntilResend}s</span>
                )}
              </div>

              {verificationStatus?.canResend && (
                <Button
                  variant="outline"
                  onClick={handleResendOTP}
                  disabled={sendOTPMutation.isPending}
                  className="w-full"
                  data-testid="button-resend-code"
                >
                  {sendOTPMutation.isPending ? "Sending..." : "Resend Code"}
                </Button>
              )}

              {sendOTPMutation.error && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {(sendOTPMutation.error as any)?.message || "Failed to send verification code. Please try again."}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
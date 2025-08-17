import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, Shield, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import logoPath from "@assets/ChatGPT Image Aug 13, 2025, 05_14_28 PM_1755085480087.png";

interface PostLoginVerificationProps {
  email: string;
  onVerificationComplete: () => void;
}

export default function PostLoginVerification({ email, onVerificationComplete }: PostLoginVerificationProps) {
  const [otpCode, setOtpCode] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [showOTPInput, setShowOTPInput] = useState(false);
  const { toast } = useToast();

  // Check verification status
  const { data: status, refetch: refetchStatus } = useQuery({
    queryKey: ["/api/post-login-verification/status", email],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/post-login-verification/status?email=${encodeURIComponent(email)}`);
      return response.json();
    },
    refetchInterval: 3000,
  });

  // Send OTP mutation
  const sendOTPMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/post-login-verification/send-otp", { email });
    },
    onSuccess: () => {
      setShowOTPInput(true);
      setCountdown(60);
      toast({
        title: "Verification code sent",
        description: "Check your email for the 6-digit verification code.",
      });
      refetchStatus();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send verification code",
        variant: "destructive",
      });
    },
  });

  // Verify OTP mutation
  const verifyOTPMutation = useMutation({
    mutationFn: async (code: string) => {
      return await apiRequest("POST", "/api/post-login-verification/verify-otp", {
        email,
        code,
      });
    },
    onSuccess: () => {
      toast({
        title: "Email verified successfully!",
        description: "Your email has been verified and locked for security.",
      });
      onVerificationComplete();
    },
    onError: (error: any) => {
      toast({
        title: "Verification failed",
        description: error.message || "Invalid or expired verification code",
        variant: "destructive",
      });
      setOtpCode("");
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
    if (otpCode.length === 6 && /^\d{6}$/.test(otpCode)) {
      verifyOTPMutation.mutate(otpCode);
    }
  }, [otpCode]);

  const handleSendOTP = () => {
    sendOTPMutation.mutate();
  };

  const handleVerifyOTP = () => {
    if (otpCode.length === 6) {
      verifyOTPMutation.mutate(otpCode);
    }
  };

  // If already verified, don't show this component
  if (status?.isVerified) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <img 
              src={logoPath} 
              alt="Signedwork Logo" 
              className="h-16 w-16 object-contain"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Verify Your Email
          </CardTitle>
          <CardDescription className="text-gray-600">
            To secure your account, please verify your email address: <strong>{email}</strong>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {!showOTPInput ? (
            // Initial verification prompt
            <div className="space-y-4">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  For security, your email address needs to be verified before you can access all features.
                </AlertDescription>
              </Alert>

              <Button
                onClick={handleSendOTP}
                disabled={sendOTPMutation.isPending || countdown > 0}
                className="w-full"
                data-testid="button-verify-email"
              >
                {sendOTPMutation.isPending ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Sending Code...
                  </>
                ) : countdown > 0 ? (
                  <>
                    <Clock className="h-4 w-4 mr-2" />
                    Wait {countdown}s
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Verify Email
                  </>
                )}
              </Button>

              <p className="text-sm text-gray-500 text-center">
                A 6-digit verification code will be sent to your email address.
              </p>
            </div>
          ) : (
            // OTP input form
            <div className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Verification code sent to your email. Check your inbox and enter the 6-digit code below.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                  Verification Code
                </label>
                <Input
                  id="otp"
                  type="text"
                  value={otpCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setOtpCode(value);
                  }}
                  placeholder="Enter 6-digit code"
                  className="text-center text-lg tracking-widest"
                  maxLength={6}
                  autoComplete="one-time-code"
                  data-testid="input-otp-code"
                />
              </div>

              {status?.hasPendingVerification && (
                <Alert variant="default">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Code expires in: {Math.max(0, Math.ceil((status.expiresAt - Date.now()) / 1000 / 60))} minutes
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={handleVerifyOTP}
                  disabled={verifyOTPMutation.isPending || otpCode.length !== 6}
                  className="flex-1"
                  data-testid="button-verify-otp"
                >
                  {verifyOTPMutation.isPending ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Verify Code
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={handleSendOTP}
                  disabled={sendOTPMutation.isPending || countdown > 0}
                  data-testid="button-resend-otp"
                >
                  {sendOTPMutation.isPending ? (
                    "Sending..."
                  ) : countdown > 0 ? (
                    `${countdown}s`
                  ) : (
                    "Resend"
                  )}
                </Button>
              </div>

              <p className="text-sm text-gray-500 text-center">
                The code will auto-submit when you enter all 6 digits.
              </p>
            </div>
          )}

          <div className="pt-4 border-t">
            <p className="text-xs text-gray-500 text-center">
              Once verified, your email will be locked for security and cannot be changed without additional verification.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
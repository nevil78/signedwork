import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { 
  Mail, 
  Send, 
  Check, 
  Clock, 
  Shield, 
  AlertTriangle, 
  CheckCircle2,
  RotateCcw 
} from "lucide-react";

interface OTPVerificationProps {
  email: string;
  onVerificationSuccess?: () => void;
  title?: string;
  description?: string;
}

interface VerificationStatus {
  isVerified: boolean;
  hasPendingVerification: boolean;
  canResend: boolean;
  timeUntilResend?: number;
}

export function OTPEmailVerification({ 
  email, 
  onVerificationSuccess, 
  title = "Email Verification",
  description = "Enter the 6-digit code sent to your email"
}: OTPVerificationProps) {
  const [otp, setOtp] = useState("");
  const [countdown, setCountdown] = useState(0);
  const { toast } = useToast();

  // Get verification status
  const { data: status, refetch: refetchStatus } = useQuery<VerificationStatus>({
    queryKey: ["/api/email-verification/status", email],
    queryFn: async () => {
      const response = await fetch(`/api/email-verification/status?email=${encodeURIComponent(email)}`);
      if (!response.ok) {
        throw new Error("Failed to get verification status");
      }
      return response.json();
    },
    enabled: !!email,
    refetchInterval: 5000,
  });

  // Send OTP mutation
  const sendOTPMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/email-verification/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to send verification code");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Code Sent",
        description: "Verification code sent to your email. Please check your inbox.",
      });
      setCountdown(60); // 1 minute countdown
      refetchStatus();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Send",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Verify OTP mutation
  const verifyOTPMutation = useMutation({
    mutationFn: async (otpCode: string) => {
      const response = await fetch("/api/email-verification/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpCode }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Verification failed");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Email Verified!",
        description: "Your email has been successfully verified.",
      });
      setOtp("");
      refetchStatus();
      onVerificationSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Verification Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Resend OTP mutation
  const resendOTPMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/email-verification/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to resend verification code");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Code Resent",
        description: "New verification code sent to your email.",
      });
      setCountdown(60);
      refetchStatus();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Resend",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Countdown timer effect
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Auto-send OTP on first load if not verified and no pending verification
  useEffect(() => {
    if (status && !status.isVerified && !status.hasPendingVerification && status.canResend) {
      sendOTPMutation.mutate();
    }
  }, [status?.isVerified, status?.hasPendingVerification, status?.canResend]);

  const handleSendOTP = () => {
    sendOTPMutation.mutate();
  };

  const handleVerifyOTP = () => {
    if (otp.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a valid 6-digit code",
        variant: "destructive",
      });
      return;
    }
    verifyOTPMutation.mutate(otp);
  };

  const handleResendOTP = () => {
    resendOTPMutation.mutate();
  };

  const handleOTPChange = (value: string) => {
    // Only allow digits and limit to 6 characters
    const cleanValue = value.replace(/\D/g, '').slice(0, 6);
    setOtp(cleanValue);
    
    // Auto-submit when 6 digits are entered
    if (cleanValue.length === 6 && !verifyOTPMutation.isPending) {
      verifyOTPMutation.mutate(cleanValue);
    }
  };

  if (status?.isVerified) {
    return (
      <Card data-testid="otp-verification-success">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="h-5 w-5" />
            Email Verified
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Your email <strong>{email}</strong> has been successfully verified.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="otp-email-verification">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          {title}
        </CardTitle>
        {description && (
          <p className="text-sm text-gray-600">{description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Email Display */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="font-mono text-sm" data-testid="verification-email">
            {email}
          </span>
          <Badge variant={status?.hasPendingVerification ? "default" : "secondary"}>
            {status?.hasPendingVerification ? "Code Sent" : "Not Verified"}
          </Badge>
        </div>

        {/* OTP Input */}
        <div className="space-y-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">Verification Code</label>
            <Input
              type="text"
              value={otp}
              onChange={(e) => handleOTPChange(e.target.value)}
              placeholder="Enter 6-digit code"
              className="text-center text-2xl tracking-widest font-mono"
              maxLength={6}
              data-testid="input-otp"
            />
          </div>

          <Button
            onClick={handleVerifyOTP}
            disabled={otp.length !== 6 || verifyOTPMutation.isPending}
            className="w-full"
            data-testid="button-verify-otp"
          >
            <Check className="h-4 w-4 mr-2" />
            {verifyOTPMutation.isPending ? "Verifying..." : "Verify Code"}
          </Button>
        </div>

        {/* Send/Resend Actions */}
        <div className="space-y-3">
          {!status?.hasPendingVerification ? (
            <Button
              variant="outline"
              onClick={handleSendOTP}
              disabled={sendOTPMutation.isPending || !status?.canResend}
              className="w-full"
              data-testid="button-send-otp"
            >
              <Send className="h-4 w-4 mr-2" />
              {sendOTPMutation.isPending ? "Sending..." : "Send Verification Code"}
            </Button>
          ) : (
            <div className="space-y-2">
              <Button
                variant="outline"
                onClick={handleResendOTP}
                disabled={
                  resendOTPMutation.isPending || 
                  countdown > 0 || 
                  !status?.canResend
                }
                className="w-full"
                data-testid="button-resend-otp"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                {resendOTPMutation.isPending ? "Resending..." : 
                 countdown > 0 ? `Resend in ${countdown}s` : "Resend Code"}
              </Button>
              
              {status.timeUntilResend && status.timeUntilResend > 0 && (
                <div className="text-xs text-gray-500 text-center flex items-center justify-center gap-1">
                  <Clock className="h-3 w-3" />
                  Wait {status.timeUntilResend} seconds before requesting new code
                </div>
              )}
            </div>
          )}
        </div>

        {/* Instructions */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <ul className="text-sm list-disc list-inside space-y-1">
              <li>Check your email inbox and spam folder</li>
              <li>Code expires in 10 minutes</li>
              <li>Enter the 6-digit code to verify your email</li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AlertCircle, Mail, CheckCircle, Clock, Send } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import type { Company } from "@shared/schema";

export default function CompanyEmailVerification() {
  const [otpCode, setOtpCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const queryClient = useQueryClient();

  // Get current company data
  const { data: user } = useQuery<Company>({
    queryKey: ['/api/auth/user'],
  });

  // Send verification email mutation
  const sendVerification = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/company/send-verification", {});
    },
    onSuccess: (data) => {
      toast({
        title: "Verification Email Sent",
        description: `Verification code sent to ${data.email}. Please check your email and enter the code below.`,
      });
      setIsVerifying(true);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send Email",
        description: error.message || "Unable to send verification email. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Verify OTP mutation
  const verifyOTP = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/auth/verify-otp", {
        email: user?.email,
        otpCode: otpCode.trim(),
        purpose: "email_verification",
        userType: "company"
      });
    },
    onSuccess: () => {
      toast({
        title: "Email Verified Successfully!",
        description: "Your company email has been verified. You can now use forgot password feature.",
      });
      setIsVerifying(false);
      setOtpCode("");
      // Refresh user data to update verification status
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
    onError: (error: any) => {
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid or expired verification code. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSendVerification = () => {
    sendVerification.mutate();
  };

  const handleVerifyOTP = () => {
    if (!otpCode.trim()) {
      toast({
        title: "Missing Code",
        description: "Please enter the verification code sent to your email.",
        variant: "destructive",
      });
      return;
    }
    verifyOTP.mutate();
  };

  if (!user) {
    return null;
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Email Verification
        </CardTitle>
        <CardDescription>
          Verify your email to enable password recovery features
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current status */}
        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Status:</span>
            {user.emailVerified ? (
              <Badge variant="default" className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Verified
              </Badge>
            ) : (
              <Badge variant="secondary" className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Not Verified
              </Badge>
            )}
          </div>
        </div>

        {/* Email display */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Company Email
          </label>
          <div className="text-sm font-mono bg-slate-100 dark:bg-slate-800 p-2 rounded border">
            {user.email}
          </div>
        </div>

        {user.emailVerified ? (
          /* Already verified */
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm text-green-700 dark:text-green-300">
              Your email is verified! You can now use the forgot password feature.
            </p>
          </div>
        ) : isVerifying ? (
          /* OTP verification step */
          <div className="space-y-4">
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Clock className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Verification code sent! Check your email and enter the code below.
              </p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Verification Code</label>
              <Input
                type="text"
                placeholder="Enter 6-digit code"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                maxLength={6}
                className="text-center text-lg tracking-wider"
                data-testid="input-otp-code"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={handleVerifyOTP}
                disabled={verifyOTP.isPending || !otpCode.trim()}
                className="flex-1"
                data-testid="button-verify-otp"
              >
                {verifyOTP.isPending ? "Verifying..." : "Verify Code"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsVerifying(false);
                  setOtpCode("");
                }}
                data-testid="button-cancel-verification"
              >
                Cancel
              </Button>
            </div>

            <Button
              variant="ghost"
              onClick={handleSendVerification}
              disabled={sendVerification.isPending}
              className="w-full text-sm"
              data-testid="button-resend-code"
            >
              Didn't receive the code? Send again
            </Button>
          </div>
        ) : (
          /* Initial send verification step */
          <div className="space-y-4">
            <div className="text-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <AlertCircle className="w-6 h-6 text-amber-600 mx-auto mb-2" />
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Email verification is required to use the forgot password feature.
              </p>
            </div>
            
            <Button
              onClick={handleSendVerification}
              disabled={sendVerification.isPending}
              className="w-full flex items-center gap-2"
              data-testid="button-send-verification"
            >
              {sendVerification.isPending ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Verification Email
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
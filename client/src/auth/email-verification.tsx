import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Link, useLocation } from "wouter";
import { Mail, Shield, ArrowLeft, RefreshCw } from "lucide-react";
import { verifyOTPSchema } from "@shared/schema";

type VerifyOTPData = z.infer<typeof verifyOTPSchema>;

export default function EmailVerificationPage() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Get user data from URL params or localStorage
  const urlParams = new URLSearchParams(window.location.search);
  const email = urlParams.get('email') || localStorage.getItem('verificationEmail') || '';
  const userType = (urlParams.get('userType') || localStorage.getItem('verificationType') || 'employee') as 'employee' | 'company';

  const [isVerified, setIsVerified] = useState(false);

  const form = useForm<VerifyOTPData>({
    resolver: zodResolver(verifyOTPSchema),
    defaultValues: {
      email,
      otpCode: '',
      purpose: 'email_verification',
      userType,
    },
  });

  const verifyOTP = useMutation({
    mutationFn: async (data: VerifyOTPData) => {
      return await apiRequest("POST", "/api/auth/verify-otp", data);
    },
    onSuccess: () => {
      setIsVerified(true);
      toast({
        title: "Email Verified!",
        description: "Your email has been successfully verified. You can now log in.",
      });
      
      // Clear stored verification data
      localStorage.removeItem('verificationEmail');
      localStorage.removeItem('verificationType');
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        setLocation('/');
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid or expired verification code",
        variant: "destructive",
      });
    },
  });

  const resendOTP = useMutation({
    mutationFn: async () => {
      // For email verification resend, we need to call the registration endpoint again
      // This will generate a new OTP for email verification
      if (userType === 'employee') {
        // We can't re-register, so we'll create a specific resend endpoint
        return await apiRequest("POST", "/api/auth/resend-verification", {
          email,
          userType,
        });
      } else {
        return await apiRequest("POST", "/api/auth/resend-verification", {
          email,
          userType,
        });
      }
    },
    onSuccess: () => {
      toast({
        title: "Verification Code Sent",
        description: "A new verification code has been sent to your email.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to resend verification code",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: VerifyOTPData) => {
    verifyOTP.mutate({
      ...data,
      email,
      userType,
    });
  };

  const handleResend = () => {
    resendOTP.mutate();
  };

  if (!email) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Mail className="h-16 w-16 mx-auto text-red-600 mb-4" />
            <CardTitle className="text-2xl font-bold text-red-600">Invalid Access</CardTitle>
            <CardDescription>
              No email verification data found. Please register again or contact support.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/">
              <Button className="w-full" data-testid="button-go-to-registration">
                Go to Registration
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="h-16 w-16 mx-auto text-green-600 mb-4" />
            <CardTitle className="text-2xl font-bold text-green-600">Email Verified!</CardTitle>
            <CardDescription>
              Your email has been successfully verified. Redirecting to login...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/">
              <Button className="w-full" data-testid="button-go-to-login">
                Continue to Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Link to="/">
              <Button
                variant="ghost"
                size="sm"
                data-testid="button-back-to-registration"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <Mail className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Verify Your Email</CardTitle>
          <CardDescription>
            We've sent a 6-digit verification code to <strong>{email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="text-center space-y-2">
              <Shield className="h-12 w-12 mx-auto text-blue-600" />
              <p className="text-sm text-gray-600">
                Check your email inbox (and spam folder) for the verification code.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="otpCode">Verification Code</Label>
              <Input
                id="otpCode"
                type="text"
                placeholder="Enter 6-digit code"
                maxLength={6}
                className="text-center text-lg tracking-widest"
                data-testid="input-verification-code"
                {...form.register('otpCode')}
              />
              {form.formState.errors.otpCode && (
                <p className="text-sm text-red-600">{form.formState.errors.otpCode.message}</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={verifyOTP.isPending}
              data-testid="button-verify-email"
            >
              {verifyOTP.isPending ? "Verifying..." : "Verify Email"}
            </Button>

            <div className="text-center text-sm text-gray-600">
              Didn't receive the code?{" "}
              <Button 
                variant="link" 
                className="p-0 h-auto font-normal"
                onClick={handleResend}
                disabled={resendOTP.isPending}
                data-testid="button-resend-code"
              >
                {resendOTP.isPending ? (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    Resending...
                  </>
                ) : (
                  "Resend Code"
                )}
              </Button>
            </div>

            <div className="text-center text-xs text-gray-500">
              The verification code expires in 15 minutes for security.
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
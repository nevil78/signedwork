import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Mail, Shield, CheckCircle, AlertCircle } from "lucide-react";

const verifyEmailSchema = z.object({
  otpCode: z.string().min(6, "Code must be 6 digits").max(6, "Code must be 6 digits"),
});

type VerifyEmailData = z.infer<typeof verifyEmailSchema>;

interface EmailVerificationCardProps {
  user: any;
  userType: 'employee' | 'company';
}

export default function EmailVerificationCard({ user, userType }: EmailVerificationCardProps) {
  const [step, setStep] = useState<'send' | 'verify' | 'verified'>('send');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<VerifyEmailData>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: {
      otpCode: '',
    },
  });

  const sendVerification = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/auth/send-email-verification");
    },
    onSuccess: () => {
      setStep('verify');
      toast({
        title: "Verification Email Sent",
        description: "Please check your email for the 6-digit verification code.",
      });
    },
    onError: (error: any) => {
      if (error.message?.includes("already verified")) {
        setStep('verified');
        toast({
          title: "Already Verified",
          description: "Your email address is already verified.",
        });
      } else {
        toast({
          title: "Failed to Send Email",
          description: error.message || "Could not send verification email",
          variant: "destructive",
        });
      }
    },
  });

  const verifyCode = useMutation({
    mutationFn: async (data: VerifyEmailData) => {
      return await apiRequest("POST", "/api/auth/verify-otp", {
        email: user.email,
        otpCode: data.otpCode,
        purpose: 'email_verification',
        userType,
      });
    },
    onSuccess: () => {
      setStep('verified');
      toast({
        title: "Email Verified Successfully!",
        description: "Your email address has been verified.",
      });
      // Invalidate user query to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
    onError: (error: any) => {
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid or expired verification code",
        variant: "destructive",
      });
    },
  });

  const handleSendVerification = () => {
    sendVerification.mutate();
  };

  const handleVerifyCode = (data: VerifyEmailData) => {
    verifyCode.mutate(data);
  };

  // Show verified state if user is already verified
  if (user.emailVerified || step === 'verified') {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <CardTitle className="text-green-800">Email Verified</CardTitle>
          </div>
          <CardDescription className="text-green-700">
            Your email address <strong>{user.email}</strong> has been verified.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Show send verification step
  if (step === 'send') {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            <CardTitle className="text-orange-800">Email Not Verified</CardTitle>
          </div>
          <CardDescription className="text-orange-700">
            Verify your email address to secure your account and enable all features.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Mail className="h-4 w-4" />
            <AlertDescription>
              We'll send a 6-digit verification code to <strong>{user.email}</strong>
            </AlertDescription>
          </Alert>
          
          <Button 
            onClick={handleSendVerification}
            disabled={sendVerification.isPending}
            className="w-full mt-4"
            data-testid="button-send-verification-email"
          >
            {sendVerification.isPending ? "Sending..." : "Send Verification Email"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show verification code entry step
  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-blue-800">Enter Verification Code</CardTitle>
        </div>
        <CardDescription className="text-blue-700">
          We've sent a 6-digit code to <strong>{user.email}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(handleVerifyCode)} className="space-y-4">
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

          <div className="flex space-x-2">
            <Button 
              type="submit" 
              className="flex-1" 
              disabled={verifyCode.isPending}
              data-testid="button-verify-code"
            >
              {verifyCode.isPending ? "Verifying..." : "Verify Email"}
            </Button>
            
            <Button 
              type="button"
              variant="outline"
              onClick={handleSendVerification}
              disabled={sendVerification.isPending}
              data-testid="button-resend-verification"
            >
              {sendVerification.isPending ? "Sending..." : "Resend"}
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            The verification code expires in 15 minutes.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
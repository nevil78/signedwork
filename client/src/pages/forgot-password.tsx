import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { ArrowLeft, Mail, Shield } from "lucide-react";
import { requestPasswordResetSchema, verifyOTPSchema, resetPasswordSchema } from "@shared/schema";

type FormData = z.infer<typeof requestPasswordResetSchema>;
type VerifyOTPData = z.infer<typeof verifyOTPSchema>;
type ResetPasswordData = z.infer<typeof resetPasswordSchema>;

type Step = 'email' | 'otp' | 'password' | 'success';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [userType, setUserType] = useState<'employee' | 'company'>('employee');
  const { toast } = useToast();

  const emailForm = useForm<FormData>({
    resolver: zodResolver(requestPasswordResetSchema),
    defaultValues: {
      email: '',
      userType: 'employee',
    },
  });

  const otpForm = useForm<VerifyOTPData>({
    resolver: zodResolver(verifyOTPSchema),
    defaultValues: {
      email: '',
      otpCode: '',
      purpose: 'password_reset',
      userType: 'employee',
    },
  });

  const passwordForm = useForm<ResetPasswordData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: '',
      otpCode: '',
      newPassword: '',
    },
  });

  const requestReset = useMutation({
    mutationFn: async (data: FormData) => {
      return await apiRequest("POST", "/api/auth/request-password-reset", data);
    },
    onSuccess: (data) => {
      setEmail(emailForm.getValues('email'));
      setUserType(emailForm.getValues('userType'));
      toast({
        title: "Reset Code Sent",
        description: data.message,
      });
      setStep('otp');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset code",
        variant: "destructive",
      });
    },
  });

  const verifyOTP = useMutation({
    mutationFn: async (data: VerifyOTPData) => {
      return await apiRequest("POST", "/api/auth/verify-otp", data);
    },
    onSuccess: () => {
      toast({
        title: "Code Verified",
        description: "Please enter your new password",
      });
      setStep('password');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Invalid verification code",
        variant: "destructive",
      });
    },
  });

  const resetPassword = useMutation({
    mutationFn: async (data: ResetPasswordData) => {
      return await apiRequest("POST", "/api/auth/reset-password", data);
    },
    onSuccess: () => {
      toast({
        title: "Password Reset Successfully",
        description: "You can now login with your new password",
      });
      setStep('success');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reset password",
        variant: "destructive",
      });
    },
  });

  const handleEmailSubmit = (data: FormData) => {
    requestReset.mutate(data);
  };

  const handleOTPSubmit = (data: VerifyOTPData) => {
    verifyOTP.mutate({
      ...data,
      email,
      userType,
    });
  };

  const handlePasswordSubmit = (data: ResetPasswordData) => {
    const otpCode = otpForm.getValues('otpCode');
    resetPassword.mutate({
      ...data,
      email,
      otpCode,
    });
  };

  const renderEmailStep = () => (
    <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="userType">Account Type</Label>
        <Select 
          value={emailForm.watch('userType')} 
          onValueChange={(value: 'employee' | 'company') => emailForm.setValue('userType', value)}
        >
          <SelectTrigger data-testid="select-account-type">
            <SelectValue placeholder="Select account type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="employee" data-testid="option-employee">Employee</SelectItem>
            <SelectItem value="company" data-testid="option-company">Company</SelectItem>
          </SelectContent>
        </Select>
        {emailForm.formState.errors.userType && (
          <p className="text-sm text-red-600">{emailForm.formState.errors.userType.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter your email address"
          data-testid="input-email"
          {...emailForm.register('email')}
        />
        {emailForm.formState.errors.email && (
          <p className="text-sm text-red-600">{emailForm.formState.errors.email.message}</p>
        )}
      </div>

      <Button 
        type="submit" 
        className="w-full" 
        disabled={requestReset.isPending}
        data-testid="button-send-reset-code"
      >
        {requestReset.isPending ? "Sending..." : "Send Reset Code"}
      </Button>
    </form>
  );

  const renderOTPStep = () => (
    <form onSubmit={otpForm.handleSubmit(handleOTPSubmit)} className="space-y-4">
      <div className="text-center space-y-2">
        <Shield className="h-16 w-16 mx-auto text-blue-600" />
        <p className="text-sm text-gray-600">
          We've sent a 6-digit verification code to your email address.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="otpCode">Verification Code</Label>
        <Input
          id="otpCode"
          type="text"
          placeholder="Enter 6-digit code"
          maxLength={6}
          className="text-center text-lg letter-spacing tracking-widest"
          data-testid="input-otp-code"
          {...otpForm.register('otpCode')}
        />
        {otpForm.formState.errors.otpCode && (
          <p className="text-sm text-red-600">{otpForm.formState.errors.otpCode.message}</p>
        )}
      </div>

      <Button 
        type="submit" 
        className="w-full" 
        disabled={verifyOTP.isPending}
        data-testid="button-verify-code"
      >
        {verifyOTP.isPending ? "Verifying..." : "Verify Code"}
      </Button>

      <Button 
        type="button" 
        variant="ghost" 
        className="w-full" 
        onClick={() => setStep('email')}
        data-testid="button-back-to-email"
      >
        Back to Email
      </Button>
    </form>
  );

  const renderPasswordStep = () => (
    <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4">
      <div className="text-center space-y-2">
        <Shield className="h-16 w-16 mx-auto text-green-600" />
        <p className="text-sm text-gray-600">
          Code verified! Please enter your new password.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="newPassword">New Password</Label>
        <Input
          id="newPassword"
          type="password"
          placeholder="Enter your new password"
          data-testid="input-new-password"
          {...passwordForm.register('newPassword')}
        />
        {passwordForm.formState.errors.newPassword && (
          <p className="text-sm text-red-600">{passwordForm.formState.errors.newPassword.message}</p>
        )}
        <p className="text-xs text-gray-500">
          Password must be at least 8 characters with uppercase letter and number
        </p>
      </div>

      <Button 
        type="submit" 
        className="w-full" 
        disabled={resetPassword.isPending}
        data-testid="button-reset-password"
      >
        {resetPassword.isPending ? "Resetting..." : "Reset Password"}
      </Button>

      <Button 
        type="button" 
        variant="ghost" 
        className="w-full" 
        onClick={() => setStep('otp')}
        data-testid="button-back-to-otp"
      >
        Back to Verification
      </Button>
    </form>
  );

  const renderSuccessStep = () => (
    <div className="text-center space-y-6">
      <div className="space-y-2">
        <Shield className="h-16 w-16 mx-auto text-green-600" />
        <h3 className="text-xl font-semibold text-green-600">Password Reset Successful!</h3>
        <p className="text-sm text-gray-600">
          Your password has been reset successfully. You can now login with your new password.
        </p>
      </div>

      <Link to="/auth">
        <Button className="w-full" data-testid="button-go-to-login">
          Go to Login
        </Button>
      </Link>
    </div>
  );

  const getStepTitle = () => {
    switch (step) {
      case 'email': return 'Reset Password';
      case 'otp': return 'Verify Your Email';
      case 'password': return 'Set New Password';
      case 'success': return 'Password Reset';
      default: return 'Reset Password';
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 'email': return 'Enter your email address to receive a reset code';
      case 'otp': return 'Enter the verification code sent to your email';
      case 'password': return 'Create a strong new password for your account';
      case 'success': return 'Your password has been successfully reset';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2">
            {step !== 'email' && step !== 'success' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (step === 'otp') setStep('email');
                  else if (step === 'password') setStep('otp');
                }}
                data-testid="button-back"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <Mail className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">{getStepTitle()}</CardTitle>
          <CardDescription>{getStepDescription()}</CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'email' && renderEmailStep()}
          {step === 'otp' && renderOTPStep()}
          {step === 'password' && renderPasswordStep()}
          {step === 'success' && renderSuccessStep()}
        </CardContent>
        
        {step === 'email' && (
          <div className="p-6 pt-0">
            <div className="text-center text-sm text-gray-600">
              Remember your password?{' '}
              <Link to="/auth">
                <Button variant="link" className="p-0 h-auto font-normal" data-testid="link-back-to-login">
                  Back to Login
                </Button>
              </Link>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
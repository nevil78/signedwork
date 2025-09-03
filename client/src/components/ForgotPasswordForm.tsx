import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { requestPasswordResetSchema, resetPasswordSchema, type RequestPasswordResetData, type ResetPasswordData } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Eye, EyeOff, Mail, KeyRound, CheckCircle, AlertTriangle, ArrowLeft } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

type Step = "request" | "reset";

export function ForgotPasswordForm({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [accountType, setAccountType] = useState<"employee" | "company">("employee");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const requestForm = useForm<RequestPasswordResetData>({
    resolver: zodResolver(requestPasswordResetSchema),
    defaultValues: {
      email: "",
      userType: "employee",
    },
  });

  const resetForm = useForm<ResetPasswordData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: "",
      otpCode: "",
      newPassword: "",
      confirmPassword: "",
      userType: "employee",
    },
  });

  const requestResetMutation = useMutation({
    mutationFn: async (data: RequestPasswordResetData) => {
      return apiRequest("POST", "/api/auth/request-password-reset", data);
    },
    onSuccess: (_, variables) => {
      setEmail(variables.email);
      setAccountType(variables.userType);
      setStep("reset");
      resetForm.setValue("email", variables.email);
      resetForm.setValue("userType", variables.userType);
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: ResetPasswordData) => {
      return apiRequest("POST", "/api/auth/reset-password", data);
    },
    onSuccess: () => {
      // Reset forms and go back to login
      requestForm.reset();
      resetForm.reset();
      setTimeout(() => onBack(), 2000); // Go back after 2 seconds to show success message
    },
  });

  const onRequestSubmit = (data: RequestPasswordResetData) => {
    requestResetMutation.mutate(data);
  };

  const onResetSubmit = (data: ResetPasswordData) => {
    resetPasswordMutation.mutate(data);
  };

  if (step === "request") {
    return (
      <Card className="w-full max-w-md mx-auto" data-testid="card-forgot-password">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Forgot Password
          </CardTitle>
          <CardDescription>
            Enter your email address and we'll send you a verification code to reset your password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={requestForm.handleSubmit(onRequestSubmit)} className="space-y-4">
            {/* Account Type Selection */}
            <div className="space-y-3">
              <Label>Account Type</Label>
              <RadioGroup
                value={requestForm.watch("userType")}
                onValueChange={(value: "employee" | "company" | "client") => requestForm.setValue("userType", value)}
                className="flex space-x-6"
                data-testid="radio-group-account-type"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="employee" id="employee" />
                  <Label htmlFor="employee" className="cursor-pointer">Employee</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="company" id="company" />
                  <Label htmlFor="company" className="cursor-pointer">Company</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="client" id="client" />
                  <Label htmlFor="client" className="cursor-pointer">Client</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email address"
                {...requestForm.register("email")}
                className={requestForm.formState.errors.email ? "border-red-500" : ""}
                data-testid="input-email"
              />
              {requestForm.formState.errors.email && (
                <p className="text-sm text-red-500" data-testid="error-email">
                  {requestForm.formState.errors.email.message}
                </p>
              )}
            </div>

            {/* Error Message */}
            {requestResetMutation.error && (
              <Alert variant="destructive" data-testid="alert-request-error">
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription>
                  {requestResetMutation.error.message || "Failed to send reset code"}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={onBack}
                data-testid="button-back-to-login"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={requestResetMutation.isPending}
                data-testid="button-send-code"
              >
                {requestResetMutation.isPending ? "Sending..." : "Send Code"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto" data-testid="card-reset-password">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="w-5 h-5" />
          Reset Password
        </CardTitle>
        <CardDescription>
          Enter the verification code sent to your email and your new password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-4">
          {/* Email Display with Edit Option */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700">Verification code sent to:</p>
                <p className="font-medium text-blue-800" data-testid="text-reset-email">{email}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  const newEmail = prompt("Enter new email address:", email);
                  if (newEmail && newEmail !== email) {
                    setEmail(newEmail);
                    resetForm.setValue("email", newEmail);
                    // Reset the step to allow requesting new code
                    setStep("request");
                    requestForm.setValue("email", newEmail);
                  }
                }}
                className="text-blue-600 hover:text-blue-700 p-1"
                data-testid="edit-reset-email-btn"
              >
                Edit
              </Button>
            </div>
          </div>

          {/* Resend Option */}
          <div className="text-center">
            <p className="text-sm text-slate-600 mb-2">Didn't receive the code?</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                requestResetMutation.mutate({ email, userType: accountType });
              }}
              disabled={requestResetMutation.isPending}
              className="text-sm"
              data-testid="resend-reset-code-btn"
            >
              {requestResetMutation.isPending ? "Sending..." : "Resend Code"}
            </Button>
          </div>

          {/* OTP Input */}
          <div className="space-y-2">
            <Label htmlFor="otp">Verification Code</Label>
            <Input
              id="otp"
              type="text"
              placeholder="Enter 6-digit code"
              maxLength={6}
              {...resetForm.register("otpCode")}
              className={resetForm.formState.errors.otpCode ? "border-red-500" : ""}
              data-testid="input-otp"
            />
            {resetForm.formState.errors.otpCode && (
              <p className="text-sm text-red-500" data-testid="error-otp">
                {resetForm.formState.errors.otpCode.message}
              </p>
            )}
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                placeholder="Enter your new password"
                {...resetForm.register("newPassword")}
                className={resetForm.formState.errors.newPassword ? "border-red-500" : ""}
                maxLength={12}
                data-testid="input-new-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setShowNewPassword(!showNewPassword)}
                data-testid="button-toggle-new-password"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            {resetForm.formState.errors.newPassword && (
              <p className="text-sm text-red-500" data-testid="error-new-password">
                {resetForm.formState.errors.newPassword.message}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your new password"
                {...resetForm.register("confirmPassword")}
                className={resetForm.formState.errors.confirmPassword ? "border-red-500" : ""}
                maxLength={12}
                data-testid="input-confirm-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                data-testid="button-toggle-confirm-password"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            {resetForm.formState.errors.confirmPassword && (
              <p className="text-sm text-red-500" data-testid="error-confirm-password">
                {resetForm.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Success Message */}
          {resetPasswordMutation.isSuccess && (
            <Alert className="border-green-200 bg-green-50" data-testid="alert-reset-success">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <AlertDescription className="text-green-700">
                Password reset successfully! Redirecting to login...
              </AlertDescription>
            </Alert>
          )}

          {/* Error Message */}
          {resetPasswordMutation.error && (
            <Alert variant="destructive" data-testid="alert-reset-error">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                {resetPasswordMutation.error.message || "Failed to reset password"}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setStep("request")}
              data-testid="button-back-to-request"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={resetPasswordMutation.isPending}
              data-testid="button-reset-password"
            >
              {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
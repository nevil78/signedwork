import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { changePasswordSchema, type ChangePasswordData } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Lock, CheckCircle, AlertTriangle, ArrowLeft } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export function ChangePasswordForm() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Check what type of user is logged in to redirect appropriately
  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
  });

  const form = useForm<ChangePasswordData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: ChangePasswordData) => {
      return apiRequest("POST", "/api/auth/change-password", data);
    },
    onSuccess: () => {
      form.reset();
      toast({
        title: "Success",
        description: "Password changed successfully! Redirecting to dashboard...",
      });
      
      // Redirect based on user type after a short delay
      setTimeout(() => {
        if (user?.companyId) {
          navigate("/company-dashboard");
        } else {
          navigate("/profile");
        }
      }, 1500);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to change password",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ChangePasswordData) => {
    changePasswordMutation.mutate(data);
  };

  const handleBackToDashboard = () => {
    if (user?.companyId) {
      navigate("/company-dashboard");
    } else {
      navigate("/profile");
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto" data-testid="card-change-password">
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleBackToDashboard}
            className="text-gray-500 hover:text-gray-700 p-2"
            data-testid="button-back-to-dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Change Password
          </CardTitle>
        </div>
        <CardDescription>
          Update your account password. You'll need to enter your current password to confirm the change.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Current Password */}
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? "text" : "password"}
                placeholder="Enter your current password"
                {...form.register("currentPassword")}
                className={form.formState.errors.currentPassword ? "border-red-500" : ""}
                maxLength={12}
                data-testid="input-current-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                data-testid="button-toggle-current-password"
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            {form.formState.errors.currentPassword && (
              <p className="text-sm text-red-500" data-testid="error-current-password">
                {form.formState.errors.currentPassword.message}
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
                {...form.register("newPassword")}
                className={form.formState.errors.newPassword ? "border-red-500" : ""}
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
            {form.formState.errors.newPassword && (
              <p className="text-sm text-red-500" data-testid="error-new-password">
                {form.formState.errors.newPassword.message}
              </p>
            )}
            <p className="text-sm text-gray-500">
              Password must be at least 8 characters with one uppercase letter and one number.
            </p>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your new password"
                {...form.register("confirmPassword")}
                className={form.formState.errors.confirmPassword ? "border-red-500" : ""}
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
            {form.formState.errors.confirmPassword && (
              <p className="text-sm text-red-500" data-testid="error-confirm-password">
                {form.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Success Message */}
          {changePasswordMutation.isSuccess && (
            <Alert className="border-green-200 bg-green-50" data-testid="alert-success">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <AlertDescription className="text-green-700">
                Password changed successfully! Your new password is now active.
              </AlertDescription>
            </Alert>
          )}

          {/* Error Message */}
          {changePasswordMutation.error && (
            <Alert variant="destructive" data-testid="alert-error">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                {changePasswordMutation.error.message || "Failed to change password"}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleBackToDashboard}
              className="flex-1"
              data-testid="button-cancel-change-password"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1" 
              disabled={changePasswordMutation.isPending}
              data-testid="button-change-password"
            >
              {changePasswordMutation.isPending ? "Changing Password..." : "Change Password"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
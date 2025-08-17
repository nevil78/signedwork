import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OTPEmailVerification } from "@/components/OTPEmailVerification";
import { ArrowLeft, User, Building } from "lucide-react";

interface UserData {
  id: string;
  email: string;
  type: 'employee' | 'company';
  firstName?: string;
  lastName?: string;
  name?: string;
}

export default function EmailOTPVerificationPage() {
  const [, setLocation] = useLocation();

  // Get current user data
  const { data: user, isLoading } = useQuery<UserData>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const handleVerificationSuccess = () => {
    // Redirect to appropriate dashboard after successful verification
    setTimeout(() => {
      if (user?.type === 'employee') {
        setLocation("/dashboard");
      } else {
        setLocation("/company-dashboard");
      }
    }, 2000);
  };

  const handleGoBack = () => {
    if (user?.type === 'employee') {
      setLocation("/dashboard");
    } else {
      setLocation("/company-dashboard");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              You need to be logged in to verify your email address.
            </p>
            <Button onClick={() => setLocation("/auth")} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayName = user.type === 'employee' 
    ? `${user.firstName} ${user.lastName}`.trim() 
    : user.name;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {user.type === 'employee' ? (
                  <User className="h-6 w-6 text-blue-600" />
                ) : (
                  <Building className="h-6 w-6 text-purple-600" />
                )}
                <div>
                  <CardTitle>Email Verification Required</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Welcome, {displayName}! Please verify your email to continue.
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleGoBack}
                data-testid="button-go-back"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* OTP Verification Component */}
        <OTPEmailVerification
          email={user.email}
          onVerificationSuccess={handleVerificationSuccess}
          title="Verify Your Email Address"
          description="We've sent a 6-digit verification code to your email address. Please enter it below to complete your account setup."
        />

        {/* Information Card */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium mb-2">Why do I need to verify my email?</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Ensures secure communication and notifications</li>
              <li>• Required for critical actions like job applications and payments</li>
              <li>• Helps protect your account from unauthorized access</li>
              <li>• Enables password recovery if needed</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
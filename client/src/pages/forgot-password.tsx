import { useState } from "react";
import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export function ForgotPasswordPage() {
  const [, navigate] = useLocation();

  const handleBackToLogin = () => {
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4" data-testid="page-forgot-password">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900" data-testid="heading-forgot-password">
            Password Recovery
          </h1>
          <p className="text-gray-600 mt-2" data-testid="text-description">
            We'll help you reset your password and regain access to your account
          </p>
        </div>
        
        <ForgotPasswordForm onBack={handleBackToLogin} />
      </div>
    </div>
  );
}
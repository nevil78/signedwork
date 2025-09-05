import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useLocation } from "wouter";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireUserType?: "employee" | "company" | "admin" | "manager" | "client";
  fallbackPath?: string;
}

export function ProtectedRoute({ 
  children, 
  requireUserType,
  fallbackPath = "/" 
}: ProtectedRouteProps) {
  const { user, userType, isLoading, isAuthenticated, error } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // If there's an authentication error or user is not authenticated, redirect
    if (!isLoading && (!isAuthenticated || error)) {
      setLocation(fallbackPath);
      return;
    }

    // If a specific user type is required and user doesn't match, redirect
    if (!isLoading && isAuthenticated && requireUserType && userType !== requireUserType) {
      setLocation(fallbackPath);
      return;
    }
  }, [isLoading, isAuthenticated, userType, requireUserType, error, fallbackPath, setLocation]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600">Authenticating...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show nothing (redirect will happen in useEffect)
  if (!isAuthenticated || error) {
    return null;
  }

  // If wrong user type, show nothing (redirect will happen in useEffect)
  if (requireUserType && userType !== requireUserType) {
    return null;
  }

  // Render protected content
  return <>{children}</>;
}
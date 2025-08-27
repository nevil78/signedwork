import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

interface AuthenticatedRedirectProps {
  to: string;
  requireUserType?: "employee" | "company" | "admin" | "manager";
}

export function AuthenticatedRedirect({ to, requireUserType }: AuthenticatedRedirectProps) {
  const { user, userType, isLoading, isAuthenticated, error } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || error) {
        setLocation("/");
        return;
      }
      
      if (requireUserType && userType !== requireUserType) {
        setLocation("/");
        return;
      }
      
      // Only redirect if fully authenticated and authorized
      setLocation(to);
    }
  }, [isLoading, isAuthenticated, userType, requireUserType, error, to, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return null;
}
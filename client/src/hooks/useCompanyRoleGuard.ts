import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useCompanyAuth } from "@/hooks/useCompanyAuth";

interface RoleGuardConfig {
  allowedRoles: string[];
  redirectTo?: string;
  showError?: boolean;
}

export function useCompanyRoleGuard(config: RoleGuardConfig) {
  const { companySubRole, isLoading, isAuthenticated } = useCompanyAuth();
  const [, navigate] = useLocation();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [error, setError] = useState<{
    code: string;
    message: string;
    required: string[];
    current?: string;
  } | null>(null);

  useEffect(() => {
    if (isLoading) {
      setIsAuthorized(null);
      return;
    }

    // Not authenticated
    if (!isAuthenticated) {
      setIsAuthorized(false);
      setError({
        code: "NOT_AUTHENTICATED",
        message: "Authentication required",
        required: config.allowedRoles
      });
      if (config.redirectTo) {
        navigate(config.redirectTo);
      }
      return;
    }

    // No company role
    if (!companySubRole) {
      setIsAuthorized(false);
      setError({
        code: "COMPANY_ROLE_MISSING",
        message: "Company role not found",
        required: config.allowedRoles
      });
      if (config.showError !== false) {
        navigate("/company/403");
      }
      return;
    }

    // Check role authorization
    const hasAccess = config.allowedRoles.includes(companySubRole);
    setIsAuthorized(hasAccess);

    if (!hasAccess) {
      setError({
        code: "INSUFFICIENT_PERMISSIONS",
        message: "Insufficient permissions for this route",
        required: config.allowedRoles,
        current: companySubRole
      });
      if (config.showError !== false) {
        navigate("/company/403");
      }
    } else {
      setError(null);
    }
  }, [isLoading, isAuthenticated, companySubRole, config.allowedRoles, navigate, config.redirectTo, config.showError]);

  return {
    isAuthorized,
    isLoading,
    error,
    companySubRole,
    isAuthenticated
  };
}

// Route guard component wrapper
export function CompanyRoleGuard({ 
  children, 
  allowedRoles, 
  fallback 
}: { 
  children: React.ReactNode; 
  allowedRoles: string[];
  fallback?: React.ReactNode;
}) {
  const { isAuthorized, isLoading } = useCompanyRoleGuard({ 
    allowedRoles,
    showError: true 
  });

  if (isLoading) {
    return React.createElement("div", { className: "min-h-screen bg-gray-50 flex items-center justify-center" },
      React.createElement("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" })
    );
  }

  if (!isAuthorized) {
    return fallback || null;
  }

  return React.createElement(React.Fragment, null, children);
}
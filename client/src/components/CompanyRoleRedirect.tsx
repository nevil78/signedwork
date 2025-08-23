import { useEffect } from "react";
import { useLocation } from "wouter";
import { useCompanyAuth } from "@/hooks/useCompanyAuth";
import { Skeleton } from "@/components/ui/skeleton";

function CompanyRoleRedirect() {
  const [, setLocation] = useLocation();
  const { user, isLoading, isCompany, companySubRole } = useCompanyAuth();

  useEffect(() => {
    if (!isLoading && user) {
      if (!isCompany) {
        // Non-company users shouldn't be here, redirect to employee dashboard
        setLocation("/dashboard");
        return;
      }

      // Redirect based on company sub-role
      if (companySubRole === "COMPANY_ADMIN") {
        setLocation("/company/admin/dashboard");
      } else if (companySubRole === "MANAGER") {
        setLocation("/company/manager/dashboard");
      } else {
        // Default to existing company dashboard for unknown roles
        setLocation("/company-dashboard");
      }
    } else if (!isLoading && !user) {
      // Not authenticated, redirect to login
      setLocation("/auth");
    }
  }, [isLoading, user, isCompany, companySubRole, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full space-y-4">
          <Skeleton className="h-4 w-32 mx-auto" />
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-40 mx-auto" />
        </div>
      </div>
    );
  }

  return null;
}

export default CompanyRoleRedirect;
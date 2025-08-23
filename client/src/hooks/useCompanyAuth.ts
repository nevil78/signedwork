import { useQuery } from "@tanstack/react-query";

interface CompanyUser {
  userId: string;
  email: string;
  userType: string;
  companyId?: string;
  companySubRole?: string;
  displayName?: string;
}

export function useCompanyAuth() {
  const { data: user, isLoading, error } = useQuery<CompanyUser>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    isCompany: user?.userType === "company",
    companySubRole: user?.companySubRole,
    companyId: user?.companyId,
    displayName: user?.displayName,
    isAdmin: user?.companySubRole === "COMPANY_ADMIN",
    isManager: user?.companySubRole === "MANAGER",
    canAccessAdminRoutes: user?.companySubRole === "COMPANY_ADMIN",
    canAccessManagerRoutes: user?.companySubRole === "MANAGER" || user?.companySubRole === "COMPANY_ADMIN",
  };
}
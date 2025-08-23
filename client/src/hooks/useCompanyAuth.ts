import { useQuery } from "@tanstack/react-query";

export function useCompanyAuth() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    companySubRole: user?.companySubRole,
    companyId: user?.companyId,
  };
}
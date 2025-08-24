import { useQuery } from "@tanstack/react-query";

export function useManagerAuth() {
  const { data: manager, isLoading, error } = useQuery({
    queryKey: ["/api/manager/profile"],
    retry: false,
  });

  return {
    manager,
    isLoading,
    isAuthenticated: !!manager,
    error,
    permissions: (manager as any)?.permissions || {},
  };
}
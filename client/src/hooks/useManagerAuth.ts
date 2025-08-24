import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export function useManagerAuth() {
  const { data: manager, isLoading, error } = useQuery({
    queryKey: ["/api/manager/profile"],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  return useMemo(() => ({
    manager,
    isLoading,
    isAuthenticated: !!manager,
    error,
    permissions: (manager as any)?.permissions || {},
  }), [manager, isLoading, error]);
}
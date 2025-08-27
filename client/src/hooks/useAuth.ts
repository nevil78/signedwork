import { useQuery } from "@tanstack/react-query";

interface AuthResponse {
  user: any;
  userType: string;
}

export function useAuth() {
  const { data: response, isLoading, error } = useQuery<AuthResponse>({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 30000, // Consider data fresh for 30 seconds
    gcTime: 300000, // Keep in cache for 5 minutes
  });

  const user = response?.user;
  const userType = response?.userType;

  return {
    user,
    userType,
    isLoading,
    isAuthenticated: !!user && !error,
    error,
  };
}
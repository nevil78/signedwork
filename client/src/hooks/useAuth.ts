import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: response, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const user = response?.user;
  const userType = response?.userType;

  return {
    user,
    userType,
    isLoading,
    isAuthenticated: !!user,
    error,
  };
}
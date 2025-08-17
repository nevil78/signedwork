import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import PostLoginVerification from "@/pages/post-login-verification";

interface PostLoginVerificationWrapperProps {
  children: React.ReactNode;
}

export default function PostLoginVerificationWrapper({ children }: PostLoginVerificationWrapperProps) {
  // Check if user is authenticated and get their email verification status
  const { data: authUser, isLoading: authLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  // Get verification status if user is authenticated
  const { data: verificationStatus, isLoading: verificationLoading, refetch: refetchVerification } = useQuery({
    queryKey: ["/api/post-login-verification/check", (authUser as any)?.user?.id],
    queryFn: async () => {
      if (!(authUser as any)?.user?.email) return null;
      const response = await apiRequest("GET", `/api/post-login-verification/status?email=${encodeURIComponent((authUser as any).user.email)}`);
      return response.json();
    },
    enabled: !!(authUser as any)?.user?.email,
  });

  // Show loading while checking authentication and verification status
  if (authLoading || verificationLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show normal content (login page)
  if (!(authUser as any)?.user) {
    return <>{children}</>;
  }

  // If user is authenticated but email not verified, show verification flow
  const userEmailVerified = (authUser as any)?.user?.emailVerified;
  
  // Check if email verification is required (user not verified and has email)
  if ((authUser as any)?.user?.email && userEmailVerified === false) {
    return (
      <PostLoginVerification
        email={(authUser as any).user.email}
        onVerificationComplete={() => {
          refetchVerification();
          // Also refetch user data to get updated emailVerified status
          window.location.reload(); // Force a page reload to clear all caches
        }}
      />
    );
  }

  // If verified or verification not required, show normal content
  return <>{children}</>;
}
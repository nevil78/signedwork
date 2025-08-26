import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { CompanyVerificationEdit } from '@/components/CompanyVerificationEdit';
import CompanyNavHeader from '@/components/company-nav-header';
import type { Company } from '@shared/schema';

export default function CompanySettings() {
  const [, navigate] = useLocation();

  // Get current user
  const { data: authResponse, isLoading: isUserLoading } = useQuery<{user: Company}>({
    queryKey: ['/api/auth/user'],
  });
  
  const user = authResponse?.user;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation Header */}
      <CompanyNavHeader 
        companyId={user?.companyId} 
        companyName={user?.name} 
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/company-dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Company Settings</h1>
          <p className="text-muted-foreground">
            Manage your company verification details and account settings
          </p>
        </div>

        {/* Verification Details Section */}
        {!isUserLoading && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                Verification Details
              </CardTitle>
              <CardDescription>
                {user?.isBasicDetailsLocked 
                  ? "Your verification details have been approved and locked. Contact support for changes."
                  : "Verify your email and add PAN/CIN numbers for complete company verification. Details can be edited until approved by admin."
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CompanyVerificationEdit company={user} />
            </CardContent>
          </Card>
        )}
        
        {/* Loading state */}
        {isUserLoading && (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-gray-500">Loading verification details...</div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
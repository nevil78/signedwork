import { useEffect } from "react";
import { useLocation } from "wouter";
import { Shield, ArrowRight, Settings, Users, BarChart3, UserCog } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCompanyAuth } from "@/hooks/useCompanyAuth";

export default function AdminAccess() {
  const [, navigate] = useLocation();
  const { companySubRole, isLoading } = useCompanyAuth();

  useEffect(() => {
    if (!isLoading && companySubRole !== 'COMPANY_ADMIN') {
      navigate('/company/403');
    }
  }, [companySubRole, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (companySubRole !== 'COMPANY_ADMIN') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="h-12 w-12 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">Company Admin Access</h1>
          </div>
          <p className="text-lg text-gray-600">
            Access your enterprise administration tools and company management features
          </p>
        </div>

        {/* Admin Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/company/admin/dashboard')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Shield className="h-6 w-6 text-blue-600" />
                Admin Dashboard
              </CardTitle>
              <CardDescription>
                Main administration dashboard with company overview and statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                Access Dashboard <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/company/admin/managers')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <UserCog className="h-6 w-6 text-green-600" />
                Manager Administration
              </CardTitle>
              <CardDescription>
                Assign and manage employee manager roles and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Manage Managers <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/company/admin/settings')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Settings className="h-6 w-6 text-purple-600" />
                Company Settings
              </CardTitle>
              <CardDescription>
                Configure company information, verification, and platform settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Open Settings <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/company/admin/employees')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Users className="h-6 w-6 text-orange-600" />
                Employee Management
              </CardTitle>
              <CardDescription>
                View and manage company employees, access controls, and directory
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Manage Employees <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/company/admin/reports')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <BarChart3 className="h-6 w-6 text-red-600" />
                Reports & Analytics
              </CardTitle>
              <CardDescription>
                Access comprehensive analytics and reports on company performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                View Reports <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Access Instructions */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900">Quick Access Guide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-blue-800">
              <p className="font-medium mb-2">Direct URL Access:</p>
              <ul className="space-y-1 text-sm">
                <li>• Admin Dashboard: <code className="bg-blue-100 px-2 py-1 rounded">/company/admin/dashboard</code></li>
                <li>• Manager Admin: <code className="bg-blue-100 px-2 py-1 rounded">/company/admin/managers</code></li>
                <li>• Company Settings: <code className="bg-blue-100 px-2 py-1 rounded">/company/admin/settings</code></li>
                <li>• Employee Management: <code className="bg-blue-100 px-2 py-1 rounded">/company/admin/employees</code></li>
                <li>• Reports: <code className="bg-blue-100 px-2 py-1 rounded">/company/admin/reports</code></li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
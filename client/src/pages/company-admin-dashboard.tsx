import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { 
  Settings, 
  Users, 
  UserCheck, 
  TrendingUp, 
  Clock, 
  FileText,
  BarChart3,
  Shield,
  Building2,
  UserCog
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import CompanyNavHeader from "@/components/company-nav-header";
import { CompanyRoleGuard } from "@/hooks/useCompanyRoleGuard";

function CompanyAdminDashboard() {
  return (
    <CompanyRoleGuard allowedRoles={["COMPANY_ADMIN"]}>
      <CompanyAdminDashboardContent />
    </CompanyRoleGuard>
  );
}

function CompanyAdminDashboardContent() {
  const [, setLocation] = useLocation();

  // Fetch admin dashboard data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["/api/company/admin/dashboard"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header Skeleton */}
          <div className="mb-8">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>
          
          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-5 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-4 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" data-testid="company-admin-dashboard">
      <CompanyNavHeader />
      
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Shield className="h-8 w-8 text-blue-600" />
                Company Admin Dashboard
              </h1>
              <p className="text-gray-600 mt-2">
                Manage your company settings, employees, and platform operations
              </p>
            </div>
            <Badge variant="secondary" className="px-3 py-1">
              Admin Access
            </Badge>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Employees
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {(dashboardData as any)?.stats?.totalEmployees || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">Active users</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Pending Approvals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {(dashboardData as any)?.pendingApprovals?.length || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">Require review</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Work Entries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {(dashboardData as any)?.stats?.totalWorkEntries || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">This month</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Approval Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {(dashboardData as any)?.stats?.approvalRate || "0"}%
              </div>
              <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-200"
            onClick={() => setLocation("/company/admin/settings")}
            data-testid="nav-company-settings"
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-gray-900">
                <Settings className="h-6 w-6 text-blue-600" />
                Company Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Manage company information, verification status, and platform configuration
              </p>
              <Button variant="outline" className="w-full">
                Open Settings
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-green-200"
            onClick={() => setLocation("/company/admin/managers")}
            data-testid="nav-managers"
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-gray-900">
                <UserCog className="h-6 w-6 text-green-600" />
                Managers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                View and manage team managers, assign permissions and responsibilities
              </p>
              <Button variant="outline" className="w-full">
                Manage Managers
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-purple-200"
            onClick={() => setLocation("/company/admin/employees")}
            data-testid="nav-employees"
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-gray-900">
                <Users className="h-6 w-6 text-purple-600" />
                Employees
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                View all company employees, manage access and monitor work activity
              </p>
              <Button variant="outline" className="w-full">
                View Employees
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-orange-200"
            onClick={() => setLocation("/company/admin/teams")}
            data-testid="nav-teams"
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-gray-900">
                <Building2 className="h-6 w-6 text-orange-600" />
                Teams & Branches
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Organize employees into teams and manage branch operations
              </p>
              <Button variant="outline" className="w-full">
                Manage Teams
                <Badge variant="secondary" className="ml-2">Soon</Badge>
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-indigo-200"
            onClick={() => setLocation("/company/admin/reports")}
            data-testid="nav-reports"
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-gray-900">
                <BarChart3 className="h-6 w-6 text-indigo-600" />
                Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Access comprehensive analytics and reports on company performance
              </p>
              <Button variant="outline" className="w-full">
                View Reports
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-red-200"
            onClick={() => setLocation("/company/admin/billing")}
            data-testid="nav-billing"
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-gray-900">
                <UserCheck className="h-6 w-6 text-red-600" />
                Billing & Plans
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Manage subscription, billing information and upgrade plans
              </p>
              <Button variant="outline" className="w-full">
                Billing Settings
                <Badge variant="secondary" className="ml-2">Soon</Badge>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Preview */}
        {(dashboardData as any)?.recentActivity && (dashboardData as any).recentActivity.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-gray-600" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(dashboardData as any).recentActivity.slice(0, 5).map((activity: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{activity.description}</p>
                      <p className="text-sm text-gray-500">{activity.timestamp}</p>
                    </div>
                    <Badge variant="outline">{activity.type}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default CompanyAdminDashboard;
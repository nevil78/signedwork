import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useManagerAuth } from "@/hooks/useManagerAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Users, 
  FileText, 
  CheckCircle, 
  Clock, 
  BarChart3, 
  LogOut, 
  Shield,
  Building2,
  UserCheck,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

export default function ManagerDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { manager, isLoading, isAuthenticated, permissions } = useManagerAuth();

  // Redirect to manager login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "Please log in to access the manager dashboard.",
        variant: "destructive",
      });
      setLocation("/manager/login");
      return;
    }
  }, [isAuthenticated, isLoading, toast, setLocation]);

  // Fetch manager analytics
  const { data: analytics } = useQuery({
    queryKey: ["/api/manager/analytics"],
    enabled: isAuthenticated && permissions.canViewAnalytics,
  });

  // Fetch assigned employees
  const { data: employees } = useQuery({
    queryKey: ["/api/manager/employees"],
    enabled: isAuthenticated,
  });

  // Fetch work entries
  const { data: workEntries } = useQuery({
    queryKey: ["/api/manager/work-entries"],
    enabled: isAuthenticated,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/manager/auth/logout");
    },
    onSuccess: () => {
      queryClient.clear();
      setLocation("/manager/login");
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  const pendingApprovals = workEntries?.filter((entry: any) => entry.approvalStatus === 'pending') || [];
  const recentApprovals = workEntries?.filter((entry: any) => entry.approvalStatus === 'manager_approved').slice(0, 5) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Manager Dashboard</h1>
                <p className="text-sm text-gray-600">Team Management Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-medium text-gray-900">{(manager as any)?.managerName}</p>
                <p className="text-sm text-gray-600">{(manager as any)?.uniqueId}</p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Manager Info Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Manager Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Manager ID</p>
                <p className="text-lg font-semibold">{(manager as any)?.uniqueId}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Permission Level</p>
                <Badge variant="secondary">{(manager as any)?.permissionLevel}</Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Contact</p>
                <p className="text-sm">{(manager as any)?.managerEmail}</p>
              </div>
            </div>
            
            <Separator className="my-4" />
            
            <div>
              <p className="text-sm font-medium text-gray-500 mb-2">Permissions</p>
              <div className="flex flex-wrap gap-2">
                {permissions.canApproveWork && <Badge variant="outline">Approve Work</Badge>}
                {permissions.canViewAnalytics && <Badge variant="outline">View Analytics</Badge>}
                {permissions.canEditEmployees && <Badge variant="outline">Edit Employees</Badge>}
                {permissions.canCreateReports && <Badge variant="outline">Create Reports</Badge>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{(employees as any)?.length || 0}</p>
                  <p className="text-sm text-gray-600">Assigned Employees</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold">{pendingApprovals.length}</p>
                  <p className="text-sm text-gray-600">Pending Approvals</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{recentApprovals.length}</p>
                  <p className="text-sm text-gray-600">Recent Approvals</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">{(workEntries as any)?.length || 0}</p>
                  <p className="text-sm text-gray-600">Total Entries</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Button 
            onClick={() => setLocation("/manager/employees")}
            className="h-20 flex-col gap-2"
            variant="outline"
            data-testid="button-manage-employees"
          >
            <Users className="h-6 w-6" />
            Manage Team
          </Button>

          <Button 
            onClick={() => setLocation("/manager/work-entries")}
            className="h-20 flex-col gap-2"
            variant="outline"
            data-testid="button-approve-work"
          >
            <FileText className="h-6 w-6" />
            Approve Work
          </Button>

          {permissions.canViewAnalytics && (
            <Button 
              onClick={() => setLocation("/manager/analytics")}
              className="h-20 flex-col gap-2"
              variant="outline"
              data-testid="button-view-analytics"
            >
              <BarChart3 className="h-6 w-6" />
              Analytics
            </Button>
          )}

          <Button 
            onClick={() => setLocation("/manager/profile")}
            className="h-20 flex-col gap-2"
            variant="outline"
            data-testid="button-profile-settings"
          >
            <Shield className="h-6 w-6" />
            Profile Settings
          </Button>
        </div>

        {/* Pending Approvals Section */}
        {pendingApprovals.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                Pending Work Approvals
              </CardTitle>
              <CardDescription>
                Work entries requiring your immediate attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingApprovals.slice(0, 5).map((entry: any) => (
                  <div key={entry.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div>
                      <p className="font-medium">{entry.title}</p>
                      <p className="text-sm text-gray-600">{entry.employeeName} • {new Date(entry.createdAt).toLocaleDateString()}</p>
                    </div>
                    <Button 
                      size="sm"
                      onClick={() => setLocation(`/manager/work-entries?entry=${entry.id}`)}
                    >
                      Review
                    </Button>
                  </div>
                ))}
              </div>
              
              {pendingApprovals.length > 5 && (
                <div className="mt-4 text-center">
                  <Button 
                    variant="outline" 
                    onClick={() => setLocation("/manager/work-entries")}
                  >
                    View All {pendingApprovals.length} Pending
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        {recentApprovals.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Recent Approvals
              </CardTitle>
              <CardDescription>
                Work entries you've recently approved
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentApprovals.map((entry: any) => (
                  <div key={entry.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                    <div>
                      <p className="font-medium">{entry.title}</p>
                      <p className="text-sm text-gray-600">{entry.employeeName} • Approved {new Date(entry.managerApprovalDate).toLocaleDateString()}</p>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Approved
                    </Badge>
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
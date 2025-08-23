import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { 
  Users, 
  Clock, 
  CheckCircle, 
  TrendingUp, 
  FileText,
  BarChart3,
  UserCog,
  Calendar,
  Target
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import CompanyNavHeader from "@/components/company-nav-header";

function CompanyManagerDashboard() {
  const [, setLocation] = useLocation();

  // Fetch manager dashboard data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["/api/company/manager/dashboard"],
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
    <div className="min-h-screen bg-gray-50" data-testid="company-manager-dashboard">
      <CompanyNavHeader />
      
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <UserCog className="h-8 w-8 text-green-600" />
                Manager Dashboard
              </h1>
              <p className="text-gray-600 mt-2">
                Manage your team, review work entries, and track performance
              </p>
            </div>
            <Badge variant="secondary" className="px-3 py-1">
              Manager Access
            </Badge>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Team Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {(dashboardData as any)?.teamStats?.totalMembers || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">Direct reports</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Pending Reviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {(dashboardData as any)?.pendingApprovals?.length || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">Need approval</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Completed This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {(dashboardData as any)?.teamStats?.completedThisWeek || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">Work entries</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Team Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {(dashboardData as any)?.teamStats?.performanceScore || "0"}%
              </div>
              <p className="text-xs text-gray-500 mt-1">Average score</p>
            </CardContent>
          </Card>
        </div>

        {/* Manager Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-200"
            onClick={() => setLocation("/company/manager/team")}
            data-testid="nav-my-team"
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-gray-900">
                <Users className="h-6 w-6 text-blue-600" />
                My Team
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                View team members, their work progress, and performance metrics
              </p>
              <Button variant="outline" className="w-full">
                Manage Team
                <Badge variant="secondary" className="ml-2">
                  {(dashboardData as any)?.teamStats?.totalMembers || 0}
                </Badge>
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-orange-200"
            onClick={() => setLocation("/company/manager/pending-approvals")}
            data-testid="nav-pending-approvals"
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-gray-900">
                <Clock className="h-6 w-6 text-orange-600" />
                Pending Approvals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Review and approve work entries submitted by your team members
              </p>
              <Button variant="outline" className="w-full">
                Review Work
                {(dashboardData as any)?.pendingApprovals?.length > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {(dashboardData as any).pendingApprovals.length}
                  </Badge>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-green-200"
            onClick={() => setLocation("/company/manager/team-reports")}
            data-testid="nav-team-reports"
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-gray-900">
                <BarChart3 className="h-6 w-6 text-green-600" />
                Team Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Access analytics and performance reports for your team
              </p>
              <Button variant="outline" className="w-full">
                View Analytics
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-purple-200"
            onClick={() => setLocation("/company/manager/schedule")}
            data-testid="nav-schedule"
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-gray-900">
                <Calendar className="h-6 w-6 text-purple-600" />
                Team Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Manage team schedules, deadlines, and project timelines
              </p>
              <Button variant="outline" className="w-full">
                View Schedule
                <Badge variant="secondary" className="ml-2">Soon</Badge>
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-indigo-200"
            onClick={() => setLocation("/company/manager/goals")}
            data-testid="nav-goals"
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-gray-900">
                <Target className="h-6 w-6 text-indigo-600" />
                Team Goals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Set and track team objectives and key performance indicators
              </p>
              <Button variant="outline" className="w-full">
                Manage Goals
                <Badge variant="secondary" className="ml-2">Soon</Badge>
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-red-200"
            onClick={() => setLocation("/company/manager/feedback")}
            data-testid="nav-feedback"
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-gray-900">
                <FileText className="h-6 w-6 text-red-600" />
                Team Feedback
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Provide feedback and conduct performance reviews for team members
              </p>
              <Button variant="outline" className="w-full">
                Give Feedback
                <Badge variant="secondary" className="ml-2">Soon</Badge>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Pending Approvals Preview */}
        {(dashboardData as any)?.pendingApprovals && (dashboardData as any).pendingApprovals.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-orange-600" />
                Recent Work Entries Awaiting Approval
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(dashboardData as any).pendingApprovals.slice(0, 3).map((entry: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <div>
                      <p className="font-medium text-gray-900">{entry.title}</p>
                      <p className="text-sm text-gray-600">{entry.employeeName} • {entry.createdAt}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-orange-600 border-orange-300">
                        Pending Review
                      </Badge>
                      <Button size="sm" onClick={() => setLocation("/company/manager/pending-approvals")}>
                        Review
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              {(dashboardData as any).pendingApprovals.length > 3 && (
                <div className="mt-4 text-center">
                  <Button variant="outline" onClick={() => setLocation("/company/manager/pending-approvals")}>
                    View All {(dashboardData as any).pendingApprovals.length} Pending Approvals
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* No Admin Access Notice */}
        <Card className="mt-8 border-yellow-200 bg-yellow-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
              <p className="text-sm text-yellow-800">
                <strong>Manager Access:</strong> You have access to team management features. 
                Company-wide settings and employee management require Admin access.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default CompanyManagerDashboard;
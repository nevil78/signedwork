import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import EmployeeNavHeader from "@/components/employee-nav-header";
import { 
  Building2, 
  FileText, 
  Send, 
  LogIn, 
  TrendingUp, 
  Calendar,
  MapPin,
  Clock,
  User,
  Activity,
  BarChart3,
  Eye,
  ExternalLink
} from "lucide-react";

type DashboardData = {
  quickStats: {
    totalCompaniesWorked: number;
    totalApplicationsMade: number;
    totalWorkSummaries: number;
    totalLogins: number;
  };
  careerSummary: {
    currentCompany: { name: string; joinedAt: Date; position?: string } | null;
    pastCompanies: { name: string; joinedAt: Date; leftAt: Date; position?: string }[];
    totalCompanies: number;
  };
  applicationsSummary: {
    total: number;
    pending: number;
    shortlisted: number;
    interviewed: number;
    offered: number;
    rejected: number;
    recent: { jobTitle: string; companyName: string; status: string; appliedAt: Date }[];
  };
  workActivitySummary: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    recent: { title: string; companyName: string; status: string; createdAt: Date }[];
  };
  loginHistory: {
    total: number;
    recent: { loginAt: Date; deviceType?: string; location?: string }[];
  };
};

function getStatusBadgeVariant(status: string) {
  switch (status.toLowerCase()) {
    case 'approved':
    case 'offered':
    case 'verified':
      return 'default'; // Green
    case 'pending':
    case 'shortlisted':
      return 'secondary'; // Yellow
    case 'rejected':
    case 'declined':
      return 'destructive'; // Red
    case 'interviewed':
      return 'outline'; // Blue
    default:
      return 'secondary';
  }
}

function QuickStatsCard({ title, value, icon: Icon, description }: {
  title: string;
  value: number;
  icon: any;
  description: string;
}) {
  return (
    <Card data-testid={`card-quick-stat-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold" data-testid={`text-stat-value-${title.toLowerCase().replace(/\s+/g, '-')}`}>
          {value.toLocaleString()}
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

export function EmployeeSummaryDashboard() {
  const { data: dashboardData, isLoading, error } = useQuery<DashboardData>({
    queryKey: ["/api/employee/summary-dashboard"],
  });

  if (isLoading) {
    return (
      <div data-testid="page-employee-summary-dashboard">
        <EmployeeNavHeader />
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Employee Summary</h1>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="h-20 bg-gray-200 animate-pulse rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div data-testid="page-employee-summary-dashboard">
        <EmployeeNavHeader />
        <div className="container mx-auto p-6">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-red-500">Failed to load dashboard data. Please try again.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const { quickStats, careerSummary, applicationsSummary, workActivitySummary, loginHistory } = dashboardData;

  return (
    <div data-testid="page-employee-summary-dashboard">
      <EmployeeNavHeader />
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Employee Summary</h1>
          <p className="text-muted-foreground">Your personal analytics and career statistics</p>
        </div>
        <div className="text-sm text-muted-foreground">
          Last updated: {format(new Date(), "MMM dd, yyyy 'at' HH:mm")}
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <QuickStatsCard
          title="Companies Worked"
          value={quickStats.totalCompaniesWorked}
          icon={Building2}
          description="Total companies in career"
        />
        <QuickStatsCard
          title="Applications Made"
          value={quickStats.totalApplicationsMade}
          icon={Send}
          description="Job applications submitted"
        />
        <QuickStatsCard
          title="Work Summaries"
          value={quickStats.totalWorkSummaries}
          icon={FileText}
          description="Work entries created"
        />
        <QuickStatsCard
          title="Total Logins"
          value={quickStats.totalLogins}
          icon={LogIn}
          description="Platform access sessions"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Career Summary */}
        <Card data-testid="card-career-summary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Career Summary
              </CardTitle>
              <CardDescription>
                Your employment history and current position
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" data-testid="button-view-all-career">
              <Eye className="h-4 w-4 mr-1" />
              View All
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Company */}
            {careerSummary.currentCompany ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm text-muted-foreground">CURRENT COMPANY</span>
                  <Badge variant="default" data-testid="badge-current-status">Active</Badge>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold" data-testid="text-current-company-name">
                      {careerSummary.currentCompany.name}
                    </h3>
                  </div>
                  {careerSummary.currentCompany.position && (
                    <p className="text-sm text-muted-foreground mb-1" data-testid="text-current-position">
                      {careerSummary.currentCompany.position}
                    </p>
                  )}
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3 mr-1" />
                    Joined {format(new Date(careerSummary.currentCompany.joinedAt), "MMM yyyy")}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No current company association</p>
              </div>
            )}

            {/* Past Companies */}
            {careerSummary.pastCompanies.length > 0 && (
              <div className="space-y-2">
                <Separator />
                <span className="font-medium text-sm text-muted-foreground">PAST COMPANIES</span>
                <div className="space-y-2">
                  {careerSummary.pastCompanies.slice(0, 3).map((company, index) => (
                    <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm" data-testid={`text-past-company-${index}`}>
                          {company.name}
                        </p>
                        {company.position && (
                          <p className="text-xs text-muted-foreground">{company.position}</p>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground text-right">
                        <div>{format(new Date(company.joinedAt), "MMM yyyy")} - {format(new Date(company.leftAt), "MMM yyyy")}</div>
                      </div>
                    </div>
                  ))}
                  {careerSummary.pastCompanies.length > 3 && (
                    <p className="text-xs text-muted-foreground text-center">
                      +{careerSummary.pastCompanies.length - 3} more companies
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Applications Summary */}
        <Card data-testid="card-applications-summary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Applications Summary
              </CardTitle>
              <CardDescription>
                Job application status and history
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" data-testid="button-view-all-applications">
              <Eye className="h-4 w-4 mr-1" />
              View All
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status Breakdown */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-yellow-50 dark:bg-yellow-950/20 p-2 rounded">
                <div className="text-lg font-semibold" data-testid="text-applications-pending">{applicationsSummary.pending}</div>
                <div className="text-xs text-muted-foreground">Pending</div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950/20 p-2 rounded">
                <div className="text-lg font-semibold" data-testid="text-applications-interviewed">{applicationsSummary.interviewed}</div>
                <div className="text-xs text-muted-foreground">Interviewed</div>
              </div>
              <div className="bg-green-50 dark:bg-green-950/20 p-2 rounded">
                <div className="text-lg font-semibold" data-testid="text-applications-offered">{applicationsSummary.offered}</div>
                <div className="text-xs text-muted-foreground">Offered</div>
              </div>
            </div>

            {/* Recent Applications */}
            {applicationsSummary.recent.length > 0 ? (
              <div className="space-y-2">
                <Separator />
                <span className="font-medium text-sm text-muted-foreground">RECENT APPLICATIONS</span>
                <div className="space-y-2">
                  {applicationsSummary.recent.slice(0, 3).map((application, index) => (
                    <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate" data-testid={`text-recent-job-${index}`}>
                          {application.jobTitle}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{application.companyName}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <Badge variant={getStatusBadgeVariant(application.status)} className="text-xs">
                          {application.status}
                        </Badge>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(application.appliedAt), "MMM dd")}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <Send className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No job applications yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Work Activity Summary */}
        <Card data-testid="card-work-activity-summary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Work Activity Summary
              </CardTitle>
              <CardDescription>
                Work entries and approval status
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" data-testid="button-view-all-work">
              <Eye className="h-4 w-4 mr-1" />
              View All
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status Breakdown */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-yellow-50 dark:bg-yellow-950/20 p-2 rounded">
                <div className="text-lg font-semibold" data-testid="text-work-pending">{workActivitySummary.pending}</div>
                <div className="text-xs text-muted-foreground">Pending</div>
              </div>
              <div className="bg-green-50 dark:bg-green-950/20 p-2 rounded">
                <div className="text-lg font-semibold" data-testid="text-work-approved">{workActivitySummary.approved}</div>
                <div className="text-xs text-muted-foreground">Approved</div>
              </div>
              <div className="bg-red-50 dark:bg-red-950/20 p-2 rounded">
                <div className="text-lg font-semibold" data-testid="text-work-rejected">{workActivitySummary.rejected}</div>
                <div className="text-xs text-muted-foreground">Rejected</div>
              </div>
            </div>

            {/* Recent Work Entries */}
            {workActivitySummary.recent.length > 0 ? (
              <div className="space-y-2">
                <Separator />
                <span className="font-medium text-sm text-muted-foreground">RECENT WORK ENTRIES</span>
                <div className="space-y-2">
                  {workActivitySummary.recent.slice(0, 3).map((work, index) => (
                    <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate" data-testid={`text-recent-work-${index}`}>
                          {work.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{work.companyName}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <Badge variant={getStatusBadgeVariant(work.status)} className="text-xs">
                          {work.status}
                        </Badge>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(work.createdAt), "MMM dd")}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No work entries yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Login History */}
        <Card data-testid="card-login-history">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Login History
              </CardTitle>
              <CardDescription>
                Your recent platform access sessions
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" data-testid="button-view-all-logins">
              <Eye className="h-4 w-4 mr-1" />
              View All
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {loginHistory.recent.length > 0 ? (
              <div className="space-y-2">
                {loginHistory.recent.slice(0, 5).map((login, index) => (
                  <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <LogIn className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm" data-testid={`text-login-time-${index}`}>
                          {format(new Date(login.loginAt), "MMM dd, yyyy")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(login.loginAt), "HH:mm")}
                          {login.deviceType && ` • ${login.deviceType}`}
                          {login.location && ` • ${login.location}`}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <LogIn className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No login history available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
}
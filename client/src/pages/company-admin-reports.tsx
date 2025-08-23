import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  Download, 
  FileText, 
  TrendingUp, 
  Calendar,
  Filter,
  Eye,
  RefreshCw
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import CompanyNavHeader from "@/components/company-nav-header";
import { useCompanyAuth } from "@/hooks/useCompanyAuth";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function CompanyAdminReports() {
  const [, navigate] = useLocation();
  const { companySubRole, isLoading: isAuthLoading } = useCompanyAuth();
  const [timeRange, setTimeRange] = useState<string>("30d");
  const [reportType, setReportType] = useState<string>("all");

  // Role-based access control
  useEffect(() => {
    if (!isAuthLoading && companySubRole !== 'COMPANY_ADMIN') {
      navigate('/company/403');
    }
  }, [companySubRole, isAuthLoading, navigate]);

  // Fetch reports data
  const { data: reportsData, isLoading } = useQuery({
    queryKey: ['/api/company/admin/reports', timeRange, reportType],
    enabled: companySubRole === 'COMPANY_ADMIN',
  });

  // Mock reports data for demo
  const mockReports = [
    {
      id: "report_001",
      name: "Employee Performance Analysis",
      type: "performance",
      description: "Comprehensive analysis of employee work entries, approval rates, and productivity metrics",
      generatedAt: new Date(Date.now() - 86400000), // 1 day ago
      dataPoints: 247,
      status: "ready",
      fileSize: "1.2 MB",
      format: "PDF"
    },
    {
      id: "report_002", 
      name: "Work Entry Analytics",
      type: "analytics",
      description: "Detailed breakdown of work entries by department, status, and time periods",
      generatedAt: new Date(Date.now() - 86400000 * 2), // 2 days ago
      dataPoints: 156,
      status: "ready",
      fileSize: "890 KB",
      format: "Excel"
    },
    {
      id: "report_003",
      name: "Approval Workflow Report",
      type: "workflow",
      description: "Analysis of approval times, bottlenecks, and workflow efficiency",
      generatedAt: new Date(Date.now() - 86400000 * 3), // 3 days ago
      dataPoints: 89,
      status: "ready",
      fileSize: "745 KB",
      format: "PDF"
    },
    {
      id: "report_004",
      name: "Employee Engagement Metrics",
      type: "engagement",
      description: "Employee activity levels, feedback scores, and engagement analytics",
      generatedAt: new Date(Date.now() - 86400000 * 5), // 5 days ago
      dataPoints: 198,
      status: "processing",
      fileSize: null,
      format: "PDF"
    }
  ];

  const filteredReports = mockReports.filter(report => {
    return reportType === "all" || report.type === reportType;
  });

  if (!companySubRole || companySubRole !== 'COMPANY_ADMIN') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CompanyNavHeader />
      
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900" data-testid="title-admin-reports">
              Reports & Analytics
            </h1>
          </div>
          <p className="text-gray-600">
            Access comprehensive analytics and reports on company performance and employee data.
          </p>
        </div>

        {/* Analytics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900" data-testid="stat-total-reports">
                    {mockReports.length}
                  </p>
                  <p className="text-sm text-gray-600">Total Reports</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900" data-testid="stat-ready-reports">
                    {mockReports.filter(r => r.status === 'ready').length}
                  </p>
                  <p className="text-sm text-gray-600">Ready Reports</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <RefreshCw className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900" data-testid="stat-processing-reports">
                    {mockReports.filter(r => r.status === 'processing').length}
                  </p>
                  <p className="text-sm text-gray-600">Processing</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900" data-testid="stat-data-points">
                    {mockReports.reduce((total, report) => total + report.dataPoints, 0)}
                  </p>
                  <p className="text-sm text-gray-600">Data Points</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle>Report Management</CardTitle>
                <CardDescription>
                  Filter, generate, and download company reports and analytics.
                </CardDescription>
              </div>
              <Button className="flex items-center gap-2" data-testid="button-generate-report">
                <FileText className="h-4 w-4" />
                Generate New Report
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="sm:w-48">
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger data-testid="select-time-range">
                    <Calendar className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 3 months</SelectItem>
                    <SelectItem value="1y">Last year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:w-48">
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger data-testid="select-report-type">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="performance">Performance</SelectItem>
                    <SelectItem value="analytics">Analytics</SelectItem>
                    <SelectItem value="workflow">Workflow</SelectItem>
                    <SelectItem value="engagement">Engagement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reports List */}
        <Card>
          <CardHeader>
            <CardTitle>Available Reports ({filteredReports.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading reports...</p>
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Reports Found</h3>
                <p className="text-gray-600 mb-4">
                  No reports match your current filters.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredReports.map((report) => (
                  <div
                    key={report.id}
                    className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors"
                    data-testid={`report-card-${report.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <FileText className="h-5 w-5 text-blue-600" />
                          <h4 className="font-medium text-gray-900" data-testid={`report-name-${report.id}`}>
                            {report.name}
                          </h4>
                          <Badge
                            variant={report.status === 'ready' ? 'default' : 'secondary'}
                            data-testid={`report-status-${report.id}`}
                          >
                            {report.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-3" data-testid={`report-description-${report.id}`}>
                          {report.description}
                        </p>
                        <div className="flex items-center gap-6 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Generated {format(report.generatedAt, 'MMM d, yyyy')}
                          </span>
                          <span data-testid={`report-data-points-${report.id}`}>
                            {report.dataPoints} data points
                          </span>
                          {report.fileSize && (
                            <span data-testid={`report-file-size-${report.id}`}>
                              {report.fileSize} ({report.format})
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={report.status !== 'ready'}
                          data-testid={`button-view-report-${report.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={report.status !== 'ready'}
                          data-testid={`button-download-report-${report.id}`}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
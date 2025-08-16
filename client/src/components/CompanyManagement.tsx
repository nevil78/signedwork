import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, Building2, Users, Calendar, Mail, Phone, 
  Eye, BarChart3, TrendingUp, ArrowUpDown, MapPin
} from "lucide-react";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface Company {
  id: string;
  name: string;
  companyId: string;
  email: string;
  phone?: string;
  industry: string;
  size: string;
  establishmentYear: number;
  isActive: boolean;
  createdAt: string;
  currentEmployeesCount: number;
  totalEmployeesCount: number;
  verificationStatus?: string;
  emailVerified?: boolean;
  cinVerificationStatus?: string;
  panVerificationStatus?: string;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  employeeId: string;
  isActive: boolean;
}

interface CompanyEmployee {
  id: string;
  companyId: string;
  employeeId: string;
  position?: string;
  department?: string;
  joinedAt: string;
  leftAt?: string;
  status: string;
  isActive: boolean;
  employee: Employee;
}

interface CompanyEmployeeHistory {
  company: Company;
  currentEmployees: CompanyEmployee[];
  pastEmployees: CompanyEmployee[];
  totalEmployeesCount: number;
}

interface CompanyEmployeeReport {
  company: Company;
  currentEmployees: CompanyEmployee[];
  exEmployees: CompanyEmployee[];
  averageTenure: number;
  longestTenuredEmployee: { employee: Employee; days: number } | null;
  departmentCounts: Record<string, number>;
}

export default function CompanyManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [showEmployeeHistoryDialog, setShowEmployeeHistoryDialog] = useState(false);
  const [showEmployeeReportDialog, setShowEmployeeReportDialog] = useState(false);

  // Fetch companies with employee counts
  const { data: companies, isLoading: companiesLoading } = useQuery<Company[]>({
    queryKey: ["/api/admin/companies-with-counts", searchTerm, sortBy, sortOrder],
    queryFn: () => {
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.append('search', searchTerm.trim());
      if (sortBy) params.append('sortBy', sortBy);
      if (sortOrder) params.append('sortOrder', sortOrder);
      
      const url = `/api/admin/companies-with-counts${params.toString() ? `?${params.toString()}` : ''}`;
      return fetch(url).then(res => res.json());
    }
  });

  // Fetch company employee history
  const { data: companyEmployeeHistory } = useQuery<CompanyEmployeeHistory>({
    queryKey: ["/api/admin/companies", selectedCompany, "employee-history"],
    queryFn: () => fetch(`/api/admin/companies/${selectedCompany}/employee-history`).then(res => res.json()),
    enabled: !!selectedCompany && showEmployeeHistoryDialog
  });

  // Fetch company employee report
  const { data: employeeReport } = useQuery<CompanyEmployeeReport>({
    queryKey: ["/api/admin/companies", selectedCompany, "employee-report"],
    queryFn: () => fetch(`/api/admin/companies/${selectedCompany}/employee-report`).then(res => res.json()),
    enabled: !!selectedCompany && showEmployeeReportDialog
  });

  // Toggle company status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiRequest("PATCH", `/api/admin/companies/${id}/toggle-status`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/companies-with-counts"] });
    }
  });

  const handleViewEmployeeHistory = (companyId: string) => {
    setSelectedCompany(companyId);
    setShowEmployeeHistoryDialog(true);
  };

  const handleViewEmployeeReport = (companyId: string) => {
    setSelectedCompany(companyId);
    setShowEmployeeReportDialog(true);
  };

  const formatTenure = (days: number) => {
    if (days < 30) return `${days} days`;
    if (days < 365) return `${Math.floor(days / 30)} months`;
    return `${Math.floor(days / 365)} years`;
  };

  const getVerificationStatusBadge = (status?: string) => {
    switch (status) {
      case 'verified':
        return <Badge variant="default" className="bg-green-100 text-green-800">✓ Verified</Badge>;
      case 'pending':
        return <Badge variant="secondary">⏳ Pending</Badge>;
      case 'rejected':
        return <Badge variant="destructive">✗ Rejected</Badge>;
      default:
        return <Badge variant="outline">Not Verified</Badge>;
    }
  };

  if (companiesLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading companies...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Company Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search companies by name, email, industry, ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-company-search"
              />
            </div>
            
            {/* Sort controls */}
            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40" data-testid="select-sort-by">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Registration Date</SelectItem>
                  <SelectItem value="name">Company Name</SelectItem>
                  <SelectItem value="employees">Current Employees</SelectItem>
                  <SelectItem value="totalEmployees">Total Employees</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                data-testid="button-sort-order"
              >
                <ArrowUpDown className="w-4 h-4" />
                {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
              </Button>
            </div>
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            Showing {companies?.length || 0} companies
          </div>
        </CardContent>
      </Card>

      {/* Company Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Industry & Size</TableHead>
                <TableHead>Employees</TableHead>
                <TableHead>Verification Status</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies?.map((company) => (
                <TableRow key={company.id} data-testid={`row-company-${company.id}`}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium">{company.name}</div>
                        <div className="text-sm text-gray-500">
                          ID: {company.companyId}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-3 h-3" />
                        {company.email}
                        {company.emailVerified && (
                          <Badge variant="default" className="text-xs bg-green-100 text-green-800">✓</Badge>
                        )}
                      </div>
                      {company.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-3 h-3" />
                          {company.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{company.industry}</div>
                      <div className="text-sm text-gray-500">
                        Size: {company.size} • Est. {company.establishmentYear}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-green-600">
                          {company.currentEmployeesCount}
                        </span>
                        <span className="text-sm text-gray-500">active</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {company.totalEmployeesCount} total employees
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex flex-wrap gap-1">
                        {getVerificationStatusBadge(company.verificationStatus)}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {company.cinVerificationStatus && (
                          <div className="text-xs">
                            CIN: {getVerificationStatusBadge(company.cinVerificationStatus)}
                          </div>
                        )}
                        {company.panVerificationStatus && (
                          <div className="text-xs">
                            PAN: {getVerificationStatusBadge(company.panVerificationStatus)}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge variant={company.isActive ? "default" : "secondary"}>
                      {company.isActive ? "🟢 Active" : "🔴 Inactive"}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {format(new Date(company.createdAt), 'MMM dd, yyyy')}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewEmployeeHistory(company.id)}
                        data-testid={`button-employee-history-${company.id}`}
                      >
                        <Users className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewEmployeeReport(company.id)}
                        data-testid={`button-employee-report-${company.id}`}
                      >
                        <BarChart3 className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleStatusMutation.mutate({ 
                          id: company.id, 
                          isActive: !company.isActive 
                        })}
                        disabled={toggleStatusMutation.isPending}
                        data-testid={`button-toggle-status-${company.id}`}
                      >
                        {company.isActive ? "Deactivate" : "Activate"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Company Employee History Dialog */}
      <Dialog open={showEmployeeHistoryDialog} onOpenChange={setShowEmployeeHistoryDialog}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>Employee History</DialogTitle>
          </DialogHeader>
          
          {companyEmployeeHistory && (
            <div className="space-y-6">
              {/* Company Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{companyEmployeeHistory.company.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <span className="text-sm text-gray-500">Company ID:</span>
                      <div>{companyEmployeeHistory.company.companyId}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Industry:</span>
                      <div>{companyEmployeeHistory.company.industry}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Current Employees:</span>
                      <div className="text-green-600 font-medium">
                        {companyEmployeeHistory.currentEmployees.length}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Total Employees:</span>
                      <div className="font-medium">{companyEmployeeHistory.totalEmployeesCount}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Tabs defaultValue="current" className="w-full">
                <TabsList>
                  <TabsTrigger value="current">
                    Current Employees ({companyEmployeeHistory.currentEmployees.length})
                  </TabsTrigger>
                  <TabsTrigger value="past">
                    Past Employees ({companyEmployeeHistory.pastEmployees.length})
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="current" className="space-y-4">
                  <div className="space-y-3">
                    {companyEmployeeHistory.currentEmployees.map((relation) => (
                      <div key={relation.id} className="flex items-center justify-between p-4 border rounded-lg bg-green-50">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-green-600 font-medium">
                              {relation.employee.firstName[0]}{relation.employee.lastName[0]}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium">
                              {relation.employee.firstName} {relation.employee.lastName}
                            </div>
                            <div className="text-sm text-gray-600">{relation.employee.email}</div>
                            <div className="text-sm text-gray-500">
                              ID: {relation.employee.employeeId}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          {relation.position && (
                            <Badge variant="outline" className="mb-2">{relation.position}</Badge>
                          )}
                          {relation.department && (
                            <div className="text-sm text-gray-500 mb-1">
                              Dept: {relation.department}
                            </div>
                          )}
                          <div className="text-sm text-gray-500">
                            Joined: {format(new Date(relation.joinedAt), 'MMM dd, yyyy')}
                          </div>
                          <div className="text-xs text-gray-400">
                            Tenure: {formatTenure(
                              Math.floor((new Date().getTime() - new Date(relation.joinedAt).getTime()) / (1000 * 60 * 60 * 24))
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {companyEmployeeHistory.currentEmployees.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No current employees
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="past" className="space-y-4">
                  <div className="space-y-3">
                    {companyEmployeeHistory.pastEmployees.map((relation) => (
                      <div key={relation.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="text-gray-600 font-medium">
                              {relation.employee.firstName[0]}{relation.employee.lastName[0]}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium">
                              {relation.employee.firstName} {relation.employee.lastName}
                            </div>
                            <div className="text-sm text-gray-600">{relation.employee.email}</div>
                            <div className="text-sm text-gray-500">
                              ID: {relation.employee.employeeId}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          {relation.position && (
                            <Badge variant="secondary" className="mb-2">{relation.position}</Badge>
                          )}
                          {relation.department && (
                            <div className="text-sm text-gray-500 mb-1">
                              Dept: {relation.department}
                            </div>
                          )}
                          <div className="text-sm text-gray-500">
                            {format(new Date(relation.joinedAt), 'MMM dd, yyyy')} - {' '}
                            {relation.leftAt && format(new Date(relation.leftAt), 'MMM dd, yyyy')}
                          </div>
                          <div className="text-xs text-gray-400">
                            Tenure: {relation.leftAt && formatTenure(
                              Math.floor((new Date(relation.leftAt).getTime() - new Date(relation.joinedAt).getTime()) / (1000 * 60 * 60 * 24))
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {companyEmployeeHistory.pastEmployees.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No past employees
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Employee Report Dialog */}
      <Dialog open={showEmployeeReportDialog} onOpenChange={setShowEmployeeReportDialog}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Employee Report & Analytics</DialogTitle>
          </DialogHeader>
          
          {employeeReport && (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {employeeReport.currentEmployees.length}
                    </div>
                    <div className="text-sm text-gray-500">Current Employees</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-gray-600">
                      {employeeReport.exEmployees.length}
                    </div>
                    <div className="text-sm text-gray-500">Ex-Employees</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {formatTenure(employeeReport.averageTenure)}
                    </div>
                    <div className="text-sm text-gray-500">Average Tenure</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {employeeReport.longestTenuredEmployee 
                        ? formatTenure(employeeReport.longestTenuredEmployee.days)
                        : 'N/A'
                      }
                    </div>
                    <div className="text-sm text-gray-500">Longest Tenure</div>
                    {employeeReport.longestTenuredEmployee && (
                      <div className="text-xs text-gray-400 mt-1">
                        {employeeReport.longestTenuredEmployee.employee.firstName}{' '}
                        {employeeReport.longestTenuredEmployee.employee.lastName}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              {/* Department Breakdown */}
              {Object.keys(employeeReport.departmentCounts).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Department Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {Object.entries(employeeReport.departmentCounts).map(([dept, count]) => (
                        <div key={dept} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="font-medium">{dept}</span>
                          <Badge variant="outline">{count} employees</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
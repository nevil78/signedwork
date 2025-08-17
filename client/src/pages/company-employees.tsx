import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, Search, Filter, Building2, ChevronLeft, ChevronRight, 
  MoreVertical, Eye, UserCheck, UserX, Calendar, Mail, Phone,
  MapPin, Briefcase, Star, User, Settings
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import CompanyNavHeader from '@/components/company-nav-header';

interface CompanyEmployee {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  employeePhone?: string;
  employeeIdNumber: string;
  position?: string;
  department?: string;
  status: string;
  joinedAt: string;
  leftAt?: string;
  isActive: boolean;
  emailVerified?: boolean;
  profilePhoto?: string;
}

interface PaginatedResponse {
  employees: CompanyEmployee[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function CompanyEmployees() {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTab, setSelectedTab] = useState("all");
  const queryClient = useQueryClient();

  // Fetch paginated employees
  const { data: employeeData, isLoading } = useQuery<PaginatedResponse>({
    queryKey: ['/api/company/employees/paginated', currentPage, searchTerm, statusFilter, selectedTab],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        search: searchTerm,
        status: statusFilter,
        tab: selectedTab,
      });
      const response = await fetch(`/api/company/employees/paginated?${params}`);
      if (!response.ok) throw new Error('Failed to fetch employees');
      return response.json();
    },
  });

  // Fetch total stats (all employees without tab filtering)
  const { data: statsData } = useQuery<PaginatedResponse>({
    queryKey: ['/api/company/employees/stats'],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: '1',
        limit: '1000', // Get all employees for stats
        search: '',
        status: 'all',
        tab: 'all',
      });
      const response = await fetch(`/api/company/employees/paginated?${params}`);
      if (!response.ok) throw new Error('Failed to fetch employee stats');
      return response.json();
    },
  });

  // Update employee status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ employeeId, isCurrent }: { employeeId: string; isCurrent: boolean }) => {
      const response = await fetch(`/api/company/employees/${employeeId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCurrent }),
      });
      if (!response.ok) throw new Error('Failed to update employee status');
      return response.json();
    },
    onSuccess: (_, { isCurrent }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/company/employees/paginated'] });
      queryClient.invalidateQueries({ queryKey: ['/api/company/employees/stats'] });
      toast({
        title: "Success",
        description: `Employee status updated to ${isCurrent ? 'Active' : 'Ex-Employee'}`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update employee status",
        variant: "destructive",
      });
    },
  });

  const employees = employeeData?.employees || [];
  const pagination = employeeData?.pagination;
  const allEmployees = statsData?.employees || [];

  const handleStatusChange = (employee: CompanyEmployee, newStatus: boolean) => {
    const statusText = newStatus ? 'Active' : 'Ex-Employee';
    if (confirm(`Are you sure you want to change ${employee.employeeName}'s status to ${statusText}?`)) {
      updateStatusMutation.mutate({ employeeId: employee.employeeId, isCurrent: newStatus });
    }
  };

  const getStatusBadge = (employee: CompanyEmployee) => {
    if (employee.isActive) {
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Active</Badge>;
    } else {
      return <Badge variant="secondary">Ex-Employee</Badge>;
    }
  };

  // Use all employees for stats, not just current filtered employees
  const totalCount = allEmployees.length;
  const activeCount = allEmployees.filter(emp => emp.isActive).length;
  const inactiveCount = allEmployees.filter(emp => !emp.isActive).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Navigation Header */}
      <CompanyNavHeader />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Employees</p>
                  <p className="text-2xl font-bold">{totalCount}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Employees</p>
                  <p className="text-2xl font-bold text-green-600">{activeCount}</p>
                </div>
                <UserCheck className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ex-Employees</p>
                  <p className="text-2xl font-bold text-gray-600">{inactiveCount}</p>
                </div>
                <UserX className="h-8 w-8 text-gray-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Employee Management</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
              <TabsList>
                <TabsTrigger value="all">All Employees</TabsTrigger>
                <TabsTrigger value="active">Active ({activeCount})</TabsTrigger>
                <TabsTrigger value="inactive">Ex-Employees ({inactiveCount})</TabsTrigger>
              </TabsList>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search employees by name, email, or position..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                    data-testid="employee-search-input"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active Only</SelectItem>
                    <SelectItem value="inactive">Ex-Employees Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <TabsContent value="all" className="space-y-4">
                <EmployeeList 
                  employees={employees}
                  isLoading={isLoading}
                  onStatusChange={handleStatusChange}
                  getStatusBadge={getStatusBadge}
                />
              </TabsContent>
              
              <TabsContent value="active" className="space-y-4">
                <EmployeeList 
                  employees={employees.filter(emp => emp.isActive)}
                  isLoading={isLoading}
                  onStatusChange={handleStatusChange}
                  getStatusBadge={getStatusBadge}
                />
              </TabsContent>
              
              <TabsContent value="inactive" className="space-y-4">
                <EmployeeList 
                  employees={employees.filter(emp => !emp.isActive)}
                  isLoading={isLoading}
                  onStatusChange={handleStatusChange}
                  getStatusBadge={getStatusBadge}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, pagination.total)} of {pagination.total} employees
            </p>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm">
                Page {currentPage} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === pagination.totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EmployeeList({ 
  employees, 
  isLoading, 
  onStatusChange, 
  getStatusBadge 
}: {
  employees: CompanyEmployee[];
  isLoading: boolean;
  onStatusChange: (employee: CompanyEmployee, newStatus: boolean) => void;
  getStatusBadge: (employee: CompanyEmployee) => React.ReactNode;
}) {
  const [, navigate] = useLocation();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No employees found</h3>
          <p className="text-muted-foreground">
            No employees match the current filters
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {employees.map((employee) => (
        <Card key={employee.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-slate-600 dark:text-slate-300" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-lg">{employee.employeeName}</h3>
                    {getStatusBadge(employee)}
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{employee.employeeEmail}</p>
                  {employee.position && (
                    <p className="text-sm text-muted-foreground">
                      <Briefcase className="inline w-3 h-3 mr-1" />
                      {employee.position}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    <Calendar className="inline w-3 h-3 mr-1" />
                    Joined {format(new Date(employee.joinedAt), 'MMM dd, yyyy')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/company-employee/${employee.employeeId}`)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View Profile
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {employee.isActive ? (
                      <DropdownMenuItem
                        onClick={() => onStatusChange(employee, false)}
                        className="text-red-600"
                      >
                        <UserX className="h-4 w-4 mr-2" />
                        Mark as Ex-Employee
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        onClick={() => onStatusChange(employee, true)}
                        className="text-green-600"
                      >
                        <UserCheck className="h-4 w-4 mr-2" />
                        Mark as Active
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
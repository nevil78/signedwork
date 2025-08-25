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
  MapPin, Briefcase, Star, User, Settings, Crown, Shield
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { apiRequest } from '@/lib/queryClient';
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
  const [isManageEmployeeOpen, setIsManageEmployeeOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [employeeUpdate, setEmployeeUpdate] = useState({
    hierarchyRole: "employee",
    branchId: "",
    teamId: "",
    canVerifyWork: false,
    canManageEmployees: false,
    canCreateTeams: false,
    verificationScope: "none"
  });
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

  // Fetch branches for management
  const { data: branches } = useQuery({
    queryKey: ['/api/company/branches'],
  });

  // Fetch teams for management
  const { data: teams } = useQuery({
    queryKey: ['/api/company/teams'],
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

  // Update employee hierarchy mutation
  const updateEmployeeMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PATCH", `/api/company/employees/${selectedEmployee.employeeId}/hierarchy`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/company/employees/paginated'] });
      queryClient.invalidateQueries({ queryKey: ['/api/company/employees/stats'] });
      setIsManageEmployeeOpen(false);
      setSelectedEmployee(null);
      toast({ title: "Success", description: "Employee updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update employee", variant: "destructive" });
    },
  });

  const employees = employeeData?.employees || [];
  const pagination = employeeData?.pagination;
  const allEmployees = statsData?.employees || [];

  // Handle employee management
  const handleManageEmployee = (employee: CompanyEmployee) => {
    setSelectedEmployee(employee);
    setEmployeeUpdate({
      hierarchyRole: (employee as any).hierarchyRole || "employee",
      branchId: (employee as any).branchId || "",
      teamId: (employee as any).teamId || "",
      canVerifyWork: (employee as any).canVerifyWork || false,
      canManageEmployees: (employee as any).canManageEmployees || false,
      canCreateTeams: (employee as any).canCreateTeams || false,
      verificationScope: (employee as any).verificationScope || "none"
    });
    setIsManageEmployeeOpen(true);
  };

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
                  onManageEmployee={handleManageEmployee}
                />
              </TabsContent>
              
              <TabsContent value="active" className="space-y-4">
                <EmployeeList 
                  employees={employees.filter(emp => emp.isActive)}
                  isLoading={isLoading}
                  onStatusChange={handleStatusChange}
                  getStatusBadge={getStatusBadge}
                  onManageEmployee={handleManageEmployee}
                />
              </TabsContent>
              
              <TabsContent value="inactive" className="space-y-4">
                <EmployeeList 
                  employees={employees.filter(emp => !emp.isActive)}
                  isLoading={isLoading}
                  onStatusChange={handleStatusChange}
                  getStatusBadge={getStatusBadge}
                  onManageEmployee={handleManageEmployee}
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

      {/* Employee Management Dialog */}
      <Dialog open={isManageEmployeeOpen} onOpenChange={setIsManageEmployeeOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-600" />
              Manage Employee: {selectedEmployee?.employeeName}
            </DialogTitle>
            <DialogDescription>
              Configure hierarchy role, permissions, and organizational assignments for this employee.
            </DialogDescription>
          </DialogHeader>
          
          {selectedEmployee && (
            <div className="space-y-6 py-4">
              {/* Employee Info */}
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{selectedEmployee.employeeName}</h3>
                    <p className="text-sm text-muted-foreground">{selectedEmployee.employeeEmail}</p>
                  </div>
                </div>
              </div>

              {/* Hierarchy Role */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Hierarchy Role</Label>
                <Select
                  value={employeeUpdate.hierarchyRole}
                  onValueChange={(value) => setEmployeeUpdate(prev => ({ ...prev, hierarchyRole: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select hierarchy role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Employee
                      </div>
                    </SelectItem>
                    <SelectItem value="team_lead">
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4" />
                        Team Lead
                      </div>
                    </SelectItem>
                    <SelectItem value="branch_manager">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Branch Manager
                      </div>
                    </SelectItem>
                    <SelectItem value="company_admin">
                      <div className="flex items-center gap-2">
                        <Crown className="h-4 w-4" />
                        Company Admin
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Branch Assignment */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Branch Assignment</Label>
                <Select
                  value={employeeUpdate.branchId}
                  onValueChange={(value) => setEmployeeUpdate(prev => ({ ...prev, branchId: value, teamId: "" }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select branch (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No Branch Assignment</SelectItem>
                    {Array.isArray(branches) && branches.map((branch: any) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name} ({branch.location})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Team Assignment */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Team Assignment</Label>
                <Select
                  value={employeeUpdate.teamId}
                  onValueChange={(value) => setEmployeeUpdate(prev => ({ ...prev, teamId: value }))}
                  disabled={!employeeUpdate.branchId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={employeeUpdate.branchId ? "Select team (optional)" : "Select a branch first"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No Team Assignment</SelectItem>
                    {Array.isArray(teams) && teams
                      .filter((team: any) => team.branchId === employeeUpdate.branchId)
                      .map((team: any) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Permissions */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">Permissions & Capabilities</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-sm">Verify Work Entries</p>
                      <p className="text-xs text-muted-foreground">Allow employee to verify work entries</p>
                    </div>
                    <Switch
                      checked={employeeUpdate.canVerifyWork}
                      onCheckedChange={(checked) => setEmployeeUpdate(prev => ({ ...prev, canVerifyWork: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-sm">Manage Employees</p>
                      <p className="text-xs text-muted-foreground">Allow employee to manage other employees</p>
                    </div>
                    <Switch
                      checked={employeeUpdate.canManageEmployees}
                      onCheckedChange={(checked) => setEmployeeUpdate(prev => ({ ...prev, canManageEmployees: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-sm">Create Teams</p>
                      <p className="text-xs text-muted-foreground">Allow employee to create and manage teams</p>
                    </div>
                    <Switch
                      checked={employeeUpdate.canCreateTeams}
                      onCheckedChange={(checked) => setEmployeeUpdate(prev => ({ ...prev, canCreateTeams: checked }))}
                    />
                  </div>
                </div>
              </div>

              {/* Verification Scope */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Verification Scope</Label>
                <Select
                  value={employeeUpdate.verificationScope}
                  onValueChange={(value) => setEmployeeUpdate(prev => ({ ...prev, verificationScope: value }))}
                  disabled={!employeeUpdate.canVerifyWork}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select verification scope" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Verification Rights</SelectItem>
                    <SelectItem value="team">Team Level Verification</SelectItem>
                    <SelectItem value="branch">Branch Level Verification</SelectItem>
                    <SelectItem value="company">Company Level Verification</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => updateEmployeeMutation.mutate(employeeUpdate)}
                  disabled={updateEmployeeMutation.isPending}
                  className="flex-1"
                >
                  {updateEmployeeMutation.isPending ? "Updating..." : "Update Employee"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsManageEmployeeOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EmployeeList({ 
  employees, 
  isLoading, 
  onStatusChange, 
  getStatusBadge,
  onManageEmployee
}: {
  employees: CompanyEmployee[];
  isLoading: boolean;
  onStatusChange: (employee: CompanyEmployee, newStatus: boolean) => void;
  getStatusBadge: (employee: CompanyEmployee) => React.ReactNode;
  onManageEmployee: (employee: CompanyEmployee) => void;
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
                  onClick={() => onManageEmployee(employee)}
                >
                  <Settings className="h-4 w-4 mr-1" />
                  Manage
                </Button>
                
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
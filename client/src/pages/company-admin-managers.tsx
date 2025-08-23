import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Users, UserPlus, Shield, Settings, Trash2, Edit, Search, Filter } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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

interface Manager {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  managedEmployees: number;
  assignedAt: string;
  status: 'active' | 'inactive';
}

interface Employee {
  id: string;
  name: string;
  email: string;
  hasManager: boolean;
}

export default function CompanyAdminManagers() {
  const [, navigate] = useLocation();
  const { companySubRole, isLoading: isAuthLoading } = useCompanyAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");

  // Role-based access control
  useEffect(() => {
    if (!isAuthLoading && companySubRole !== 'COMPANY_ADMIN') {
      navigate('/company/403');
    }
  }, [companySubRole, isAuthLoading, navigate]);

  // Fetch managers
  const { data: managersData = [], isLoading: isLoadingManagers } = useQuery({
    queryKey: ['/api/company/admin/managers'],
    enabled: companySubRole === 'COMPANY_ADMIN',
  });
  const managers = managersData as Manager[];

  // Fetch available employees for manager assignment
  const { data: employeesData = [] } = useQuery({
    queryKey: ['/api/company/employees/available-for-manager'],
    enabled: companySubRole === 'COMPANY_ADMIN' && isAssignDialogOpen,
  });
  const availableEmployees = employeesData as Employee[];

  // Assign manager mutation
  const assignManager = useMutation({
    mutationFn: async (employeeId: string) => {
      return await apiRequest("POST", "/api/company/admin/assign-manager", {
        employeeId,
      });
    },
    onSuccess: () => {
      toast({
        title: "Manager Assigned",
        description: "Employee has been successfully assigned as a manager.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/company/admin/managers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/company/employees/available-for-manager'] });
      setIsAssignDialogOpen(false);
      setSelectedEmployee("");
    },
    onError: (error: any) => {
      toast({
        title: "Assignment Failed",
        description: error.message || "Failed to assign manager role.",
        variant: "destructive",
      });
    },
  });

  // Remove manager mutation
  const removeManager = useMutation({
    mutationFn: async (managerId: string) => {
      return await apiRequest("DELETE", `/api/company/admin/managers/${managerId}`);
    },
    onSuccess: () => {
      toast({
        title: "Manager Removed",
        description: "Manager role has been successfully removed.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/company/admin/managers'] });
    },
    onError: (error: any) => {
      toast({
        title: "Removal Failed",
        description: error.message || "Failed to remove manager role.",
        variant: "destructive",
      });
    },
  });

  // Filter managers based on search and status
  const filteredManagers = managers.filter((manager) => {
    const matchesSearch = manager.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         manager.employeeEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || manager.status === statusFilter;
    return matchesSearch && matchesStatus;
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
            <Shield className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900" data-testid="title-admin-managers">
              Manager Administration
            </h1>
          </div>
          <p className="text-gray-600">
            Assign and manage employee roles as managers within your organization.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900" data-testid="stat-total-managers">
                    {managers.length}
                  </p>
                  <p className="text-sm text-gray-600">Total Managers</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Shield className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900" data-testid="stat-active-managers">
                    {managers.filter((m) => m.status === 'active').length}
                  </p>
                  <p className="text-sm text-gray-600">Active Managers</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900" data-testid="stat-managed-employees">
                    {managers.reduce((total, manager) => total + manager.managedEmployees, 0)}
                  </p>
                  <p className="text-sm text-gray-600">Managed Employees</p>
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
                <CardTitle>Manager Management</CardTitle>
                <CardDescription>
                  Search, filter, and manage your organization's managers.
                </CardDescription>
              </div>
              
              <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2" data-testid="button-assign-manager">
                    <UserPlus className="h-4 w-4" />
                    Assign Manager
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Assign Manager Role</DialogTitle>
                    <DialogDescription>
                      Select an employee to assign as a manager.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="employee-select">Select Employee</Label>
                      <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose an employee..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availableEmployees.map((employee) => (
                            <SelectItem key={employee.id} value={employee.id}>
                              {employee.name} ({employee.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsAssignDialogOpen(false);
                          setSelectedEmployee("");
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => assignManager.mutate(selectedEmployee)}
                        disabled={!selectedEmployee || assignManager.isPending}
                        data-testid="button-confirm-assign"
                      >
                        {assignManager.isPending ? "Assigning..." : "Assign Manager"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search managers by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-managers"
                  />
                </div>
              </div>
              <div className="sm:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger data-testid="select-status-filter">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Managers List */}
        <Card>
          <CardHeader>
            <CardTitle>Current Managers ({filteredManagers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingManagers ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading managers...</p>
              </div>
            ) : filteredManagers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Managers Found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || statusFilter !== "all"
                    ? "No managers match your current filters."
                    : "You haven't assigned any managers yet."}
                </p>
                {!searchTerm && statusFilter === "all" && (
                  <Button
                    onClick={() => setIsAssignDialogOpen(true)}
                    data-testid="button-assign-first-manager"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Assign First Manager
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredManagers.map((manager) => (
                  <div
                    key={manager.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    data-testid={`manager-card-${manager.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Shield className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900" data-testid={`manager-name-${manager.id}`}>
                            {manager.employeeName}
                          </h4>
                          <p className="text-sm text-gray-600" data-testid={`manager-email-${manager.id}`}>
                            {manager.employeeEmail}
                          </p>
                          <div className="flex items-center gap-4 mt-2">
                            <Badge
                              variant={manager.status === 'active' ? 'default' : 'secondary'}
                              data-testid={`manager-status-${manager.id}`}
                            >
                              {manager.status}
                            </Badge>
                            <span className="text-xs text-gray-500" data-testid={`manager-managed-count-${manager.id}`}>
                              Managing {manager.managedEmployees} employees
                            </span>
                            <span className="text-xs text-gray-500" data-testid={`manager-assigned-date-${manager.id}`}>
                              Assigned {format(new Date(manager.assignedAt), 'MMM d, yyyy')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {/* TODO: Edit manager details */}}
                          data-testid={`button-edit-manager-${manager.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeManager.mutate(manager.id)}
                          disabled={removeManager.isPending}
                          data-testid={`button-remove-manager-${manager.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
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
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Search, Filter, UserPlus, Mail, Calendar, Building } from "lucide-react";
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

export default function CompanyAdminEmployees() {
  const [, navigate] = useLocation();
  const { companySubRole, isLoading: isAuthLoading } = useCompanyAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Role-based access control
  useEffect(() => {
    if (!isAuthLoading && companySubRole !== 'COMPANY_ADMIN') {
      navigate('/company/403');
    }
  }, [companySubRole, isAuthLoading, navigate]);

  // Fetch employees
  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['/api/company/admin/employees'],
    enabled: companySubRole === 'COMPANY_ADMIN',
  });

  // Filter employees based on search and status
  const filteredEmployees = (employees as any[]).filter((employee) => {
    const matchesSearch = employee.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.employeeEmail?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || employee.status === statusFilter;
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
            <Users className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900" data-testid="title-admin-employees">
              Employee Management
            </h1>
          </div>
          <p className="text-gray-600">
            View and manage all company employees, access controls, and employment status.
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
                  <p className="text-2xl font-bold text-gray-900" data-testid="stat-total-employees">
                    {employees.length}
                  </p>
                  <p className="text-sm text-gray-600">Total Employees</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900" data-testid="stat-active-employees">
                    {(employees as any[]).filter((emp) => emp.status === 'employed').length}
                  </p>
                  <p className="text-sm text-gray-600">Active Employees</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <UserPlus className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900" data-testid="stat-new-employees">
                    {(employees as any[]).filter((emp) => {
                      const joinedAt = new Date(emp.joinedAt);
                      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                      return joinedAt > thirtyDaysAgo;
                    }).length}
                  </p>
                  <p className="text-sm text-gray-600">New This Month</p>
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
                <CardTitle>Employee Directory</CardTitle>
                <CardDescription>
                  Search, filter, and manage your company employees.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search employees by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-employees"
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
                    <SelectItem value="employed">Employed</SelectItem>
                    <SelectItem value="terminated">Terminated</SelectItem>
                    <SelectItem value="on_leave">On Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employees List */}
        <Card>
          <CardHeader>
            <CardTitle>Employees ({filteredEmployees.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading employees...</p>
              </div>
            ) : filteredEmployees.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Employees Found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || statusFilter !== "all"
                    ? "No employees match your current filters."
                    : "No employees have joined your company yet."}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredEmployees.map((employee: any) => (
                  <div
                    key={employee.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    data-testid={`employee-card-${employee.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={employee.profilePicture} />
                          <AvatarFallback>
                            {employee.employeeName?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-medium text-gray-900" data-testid={`employee-name-${employee.id}`}>
                            {employee.employeeName}
                          </h4>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="h-3 w-3" />
                            <span data-testid={`employee-email-${employee.id}`}>
                              {employee.employeeEmail}
                            </span>
                          </div>
                          {employee.position && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                              <Building className="h-3 w-3" />
                              <span data-testid={`employee-position-${employee.id}`}>
                                {employee.position}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={employee.status === 'employed' ? 'default' : 'secondary'}
                          className="mb-2"
                          data-testid={`employee-status-${employee.id}`}
                        >
                          {employee.status}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar className="h-3 w-3" />
                          <span data-testid={`employee-joined-${employee.id}`}>
                            Joined {format(new Date(employee.joinedAt), 'MMM d, yyyy')}
                          </span>
                        </div>
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
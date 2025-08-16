import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, User, Building2, Calendar, MapPin, Phone, Mail, 
  Eye, History, TrendingUp, ArrowUpDown, Filter
} from "lucide-react";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  employeeId: string;
  isActive: boolean;
  createdAt: string;
  currentCompany?: {
    id: string;
    name: string;
    companyId: string;
  };
  currentPosition?: string;
  currentStatus?: string;
}

interface EmployeeHistory {
  employee: Employee;
  companyHistory: CompanyEmployee[];
  currentCompany: Company | null;
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
}

interface Company {
  id: string;
  name: string;
  companyId: string;
  email: string;
  industry: string;
}

interface CareerReport {
  employee: Employee;
  totalTenure: number;
  companiesWorked: number;
  longestTenure: { company: Company; days: number };
  currentPosition: string | null;
  careerHistory: (CompanyEmployee & { company: Company })[];
}

export default function EmployeeManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [showCareerReportDialog, setShowCareerReportDialog] = useState(false);

  // Fetch employees with company details
  const { data: employees, isLoading: employeesLoading } = useQuery<Employee[]>({
    queryKey: ["/api/admin/employees-with-companies", searchTerm, sortBy, sortOrder],
    queryFn: () => {
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.append('search', searchTerm.trim());
      if (sortBy) params.append('sortBy', sortBy);
      if (sortOrder) params.append('sortOrder', sortOrder);
      
      const url = `/api/admin/employees-with-companies${params.toString() ? `?${params.toString()}` : ''}`;
      return fetch(url).then(res => res.json());
    }
  });

  // Fetch employee history
  const { data: employeeHistory } = useQuery<EmployeeHistory>({
    queryKey: ["/api/admin/employees", selectedEmployee, "history"],
    queryFn: () => fetch(`/api/admin/employees/${selectedEmployee}/history`).then(res => res.json()),
    enabled: !!selectedEmployee && showHistoryDialog
  });

  // Fetch career report
  const { data: careerReport } = useQuery<CareerReport>({
    queryKey: ["/api/admin/employees", selectedEmployee, "career-report"],
    queryFn: () => fetch(`/api/admin/employees/${selectedEmployee}/career-report`).then(res => res.json()),
    enabled: !!selectedEmployee && showCareerReportDialog
  });

  // Toggle employee status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiRequest("PATCH", `/api/admin/employees/${id}/toggle-status`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/employees-with-companies"] });
    }
  });

  const handleViewHistory = (employeeId: string) => {
    setSelectedEmployee(employeeId);
    setShowHistoryDialog(true);
  };

  const handleViewCareerReport = (employeeId: string) => {
    setSelectedEmployee(employeeId);
    setShowCareerReportDialog(true);
  };

  const formatTenure = (days: number) => {
    if (days < 30) return `${days} days`;
    if (days < 365) return `${Math.floor(days / 30)} months`;
    return `${Math.floor(days / 365)} years`;
  };

  if (employeesLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading employees...</CardTitle>
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
            <User className="w-5 h-5" />
            Employee Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search employees by name, email, company, position..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-employee-search"
              />
            </div>
            
            {/* Sort controls */}
            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40" data-testid="select-sort-by">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Join Date</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="company">Company</SelectItem>
                  <SelectItem value="position">Position</SelectItem>
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
            Showing {employees?.length || 0} employees
          </div>
        </CardContent>
      </Card>

      {/* Employee Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Current Company</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees?.map((employee) => (
                <TableRow key={employee.id} data-testid={`row-employee-${employee.id}`}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium">
                          {employee.firstName[0]}{employee.lastName[0]}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium">
                          {employee.firstName} {employee.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {employee.employeeId}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-3 h-3" />
                        {employee.email}
                      </div>
                      {employee.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-3 h-3" />
                          {employee.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {employee.currentCompany ? (
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="font-medium">{employee.currentCompany.name}</div>
                          <div className="text-xs text-gray-500">
                            {employee.currentCompany.companyId}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400">No current company</span>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    {employee.currentPosition ? (
                      <Badge variant="outline">{employee.currentPosition}</Badge>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant={employee.isActive ? "default" : "secondary"}>
                        {employee.isActive ? "🟢 Active" : "🔴 Inactive"}
                      </Badge>
                      {employee.currentStatus === 'employed' && (
                        <Badge variant="default" className="bg-green-100 text-green-800">Currently Employed</Badge>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {format(new Date(employee.createdAt), 'MMM dd, yyyy')}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewHistory(employee.id)}
                        data-testid={`button-view-history-${employee.id}`}
                      >
                        <History className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewCareerReport(employee.id)}
                        data-testid={`button-career-report-${employee.id}`}
                      >
                        <TrendingUp className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleStatusMutation.mutate({ 
                          id: employee.id, 
                          isActive: !employee.isActive 
                        })}
                        disabled={toggleStatusMutation.isPending}
                        data-testid={`button-toggle-status-${employee.id}`}
                      >
                        {employee.isActive ? "Deactivate" : "Activate"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Employee History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Employee Work History</DialogTitle>
          </DialogHeader>
          
          {employeeHistory && (
            <div className="space-y-6">
              {/* Employee Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {employeeHistory.employee.firstName} {employeeHistory.employee.lastName}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-500">Email:</span>
                      <div>{employeeHistory.employee.email}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Employee ID:</span>
                      <div>{employeeHistory.employee.employeeId}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Company History */}
              <Card>
                <CardHeader>
                  <CardTitle>Company History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {employeeHistory.companyHistory.map((relation) => (
                      <div key={relation.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Building2 className="w-5 h-5 text-blue-500" />
                          <div>
                            <div className="font-medium">Company ID: {relation.companyId}</div>
                            {relation.position && (
                              <div className="text-sm text-gray-500">{relation.position}</div>
                            )}
                            {relation.department && (
                              <div className="text-xs text-gray-500">Dept: {relation.department}</div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={relation.status === 'employed' ? 'default' : 'secondary'}>
                            {relation.status === 'employed' ? '🟢 Active' : '🔴 Past Company'}
                          </Badge>
                          <div className="text-sm text-gray-500 mt-1">
                            {format(new Date(relation.joinedAt), 'MMM dd, yyyy')} - {' '}
                            {relation.leftAt 
                              ? format(new Date(relation.leftAt), 'MMM dd, yyyy')
                              : 'Present'
                            }
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Career Report Dialog */}
      <Dialog open={showCareerReportDialog} onOpenChange={setShowCareerReportDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Career Report</DialogTitle>
          </DialogHeader>
          
          {careerReport && (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatTenure(careerReport.totalTenure)}
                    </div>
                    <div className="text-sm text-gray-500">Total Tenure</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {careerReport.companiesWorked}
                    </div>
                    <div className="text-sm text-gray-500">Companies Worked</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {formatTenure(careerReport.longestTenure.days)}
                    </div>
                    <div className="text-sm text-gray-500">Longest Tenure</div>
                    <div className="text-xs text-gray-400 mt-1">
                      at {careerReport.longestTenure.company.name}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {careerReport.currentPosition || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500">Current Position</div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Career Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle>Career Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {careerReport.careerHistory.map((item, index) => (
                      <div key={item.id} className="flex items-start gap-4 p-4 border-l-4 border-blue-200 bg-gray-50 rounded-r-lg">
                        <div className="flex-1">
                          <div className="font-medium">{item.company.name}</div>
                          <div className="text-sm text-gray-600">{item.position || 'Position not specified'}</div>
                          {item.department && (
                            <div className="text-xs text-gray-500">Department: {item.department}</div>
                          )}
                        </div>
                        <div className="text-right">
                          <Badge variant={item.status === 'employed' ? 'default' : 'secondary'}>
                            {item.status === 'employed' ? 'Current' : 'Past'}
                          </Badge>
                          <div className="text-sm text-gray-500 mt-1">
                            {format(new Date(item.joinedAt), 'MMM yyyy')} - {' '}
                            {item.leftAt 
                              ? format(new Date(item.leftAt), 'MMM yyyy')
                              : 'Present'
                            }
                          </div>
                          <div className="text-xs text-gray-400">
                            Duration: {formatTenure(
                              Math.floor((
                                (item.leftAt ? new Date(item.leftAt) : new Date()).getTime() - 
                                new Date(item.joinedAt).getTime()
                              ) / (1000 * 60 * 60 * 24))
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
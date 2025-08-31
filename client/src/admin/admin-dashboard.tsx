import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EmployeeManagement from "@/components/EmployeeManagement";
import CompanyManagement from "@/components/CompanyManagement";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, Building, Briefcase, TrendingUp, LogOut, 
  ShieldCheck, UserCheck, UserX, Calendar, Mail, Search, Shield, MessageSquare, Menu, Trash2, Download
} from "lucide-react";
import signedworkLogo from "@assets/Signed-work-Logo (1)_1755168042120.png";
import { format } from "date-fns";
import type { Employee, Company, Admin } from "@shared/schema";

interface AdminStats {
  employees: number;
  companies: number;
  totalJobs: number;
  activeJobs: number;
}

interface UserData {
  user: Employee | Company | Admin;
  userType: "employee" | "company" | "admin";
}

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [companySearch, setCompanySearch] = useState("");
  const [cinVerificationNotes, setCinVerificationNotes] = useState<Record<string, string>>({});
  const [panVerificationNotes, setPanVerificationNotes] = useState<Record<string, string>>({});
  const [gstVerificationNotes, setGstVerificationNotes] = useState<Record<string, string>>({});

  // Fetch current admin user
  const { data: userData, isLoading: userLoading } = useQuery<UserData>({
    queryKey: ["/api/auth/user"],
  });

  // Redirect if not admin
  useEffect(() => {
    if (!userLoading && (!userData || userData.userType !== "admin")) {
      navigate("/admin/login");
    }
  }, [userData, userLoading, navigate]);

  // Fetch admin stats
  const { data: stats } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    enabled: userData?.userType === "admin",
  });

  // Fetch employees with search
  const { data: employees } = useQuery<Employee[]>({
    queryKey: ["/api/admin/employees", employeeSearch],
    queryFn: () => {
      const params = new URLSearchParams();
      if (employeeSearch.trim()) {
        params.append('search', employeeSearch.trim());
      }
      const url = `/api/admin/employees${params.toString() ? `?${params.toString()}` : ''}`;
      return fetch(url).then(res => res.json());
    },
    enabled: userData?.userType === "admin" && activeTab === "employees",
  });

  // Fetch companies with search
  const { data: companies } = useQuery<Company[]>({
    queryKey: ["/api/admin/companies", companySearch],
    queryFn: () => {
      const params = new URLSearchParams();
      if (companySearch.trim()) {
        params.append('search', companySearch.trim());
      }
      const url = `/api/admin/companies${params.toString() ? `?${params.toString()}` : ''}`;
      return fetch(url).then(res => res.json());
    },
    enabled: userData?.userType === "admin" && activeTab === "companies",
  });

  // Toggle employee status
  const toggleEmployeeMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiRequest("PATCH", `/api/admin/employees/${id}/toggle-status`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/employees"] });
      toast({
        title: "Status updated",
        description: "Employee status has been updated successfully",
      });
    },
  });

  // Toggle company status
  const toggleCompanyMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiRequest("PATCH", `/api/admin/companies/${id}/toggle-status`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/companies"] });
      toast({
        title: "Status updated",
        description: "Company status has been updated successfully",
      });
    },
  });

  // Delete employee
  const deleteEmployeeMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("DELETE", `/api/admin/employees/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/employees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Employee deleted",
        description: "Employee has been permanently deleted",
        variant: "destructive",
      });
    },
  });

  // Delete company
  const deleteCompanyMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("DELETE", `/api/admin/companies/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/companies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Company deleted",
        description: "Company has been permanently deleted",
        variant: "destructive",
      });
    },
  });

  // Download employee backup
  const downloadEmployeeBackup = async (employeeId: string, employeeName: string) => {
    try {
      const response = await fetch(`/api/admin/employees/${employeeId}/backup`);
      if (!response.ok) throw new Error('Failed to download backup');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `employee_backup_${employeeName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Backup downloaded",
        description: `Employee backup for ${employeeName} downloaded successfully`,
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download employee backup",
        variant: "destructive",
      });
    }
  };

  // Download company backup
  const downloadCompanyBackup = async (companyId: string, companyName: string) => {
    try {
      const response = await fetch(`/api/admin/companies/${companyId}/backup`);
      if (!response.ok) throw new Error('Failed to download backup');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `company_backup_${companyName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Backup downloaded",
        description: `Company backup for ${companyName} downloaded successfully`,
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download company backup",
        variant: "destructive",
      });
    }
  };

  // Fetch companies pending CIN verification
  const { data: pendingCinCompanies } = useQuery<Company[]>({
    queryKey: ["/api/admin/companies/pending-cin-verification"],
    enabled: userData?.userType === "admin" && activeTab === "cin-verification",
  });

  // Fetch companies pending PAN verification
  const { data: pendingPanCompanies } = useQuery<Company[]>({
    queryKey: ["/api/admin/companies/pending-pan-verification"],
    enabled: userData?.userType === "admin" && activeTab === "pan-verification",
  });

  // Fetch companies pending GST verification
  const { data: pendingGstCompanies } = useQuery<Company[]>({
    queryKey: ["/api/admin/companies/pending-gst-verification"],
    enabled: userData?.userType === "admin" && activeTab === "gst-verification",
  });

  // CIN verification mutation
  const cinVerificationMutation = useMutation({
    mutationFn: ({ companyId, status, notes }: { companyId: string; status: string; notes?: string }) =>
      apiRequest("PATCH", `/api/admin/companies/${companyId}/cin-verification`, { status, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/companies/pending-cin-verification"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/companies"] });
      toast({
        title: "CIN verification updated",
        description: "Company CIN verification status has been updated successfully",
      });
    },
  });

  // PAN verification mutation
  const panVerificationMutation = useMutation({
    mutationFn: ({ companyId, status, notes }: { companyId: string; status: string; notes?: string }) =>
      apiRequest("PATCH", `/api/admin/companies/${companyId}/pan-verification`, { status, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/companies/pending-pan-verification"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/companies"] });
      toast({
        title: "PAN verification updated",
        description: "Company PAN verification status has been updated successfully",
      });
    },
  });

  // GST verification mutation
  const gstVerificationMutation = useMutation({
    mutationFn: ({ companyId, status, notes }: { companyId: string; status: string; notes?: string }) =>
      apiRequest("PATCH", `/api/admin/companies/${companyId}/gst-verification`, { status, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/companies/pending-gst-verification"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/companies"] });
      toast({
        title: "GST verification updated",
        description: "Company GST verification status has been updated successfully",
      });
    },
  });

  // Logout
  const logoutMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/auth/logout"),
    onSuccess: () => {
      navigate("/admin/login");
    },
  });

  if (userLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const admin = userData?.user as Admin;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img src={signedworkLogo} alt="Signedwork" className="h-6 w-6 md:h-8 md:w-8 mr-2 md:mr-3" />
              <div>
                <div className="flex items-center">
                  <h1 className="text-base md:text-xl font-semibold">Signedwork Admin</h1>
                  {admin?.username && (
                    <span className="text-sm md:text-lg font-medium text-gray-600 ml-2 hidden sm:inline">
                      - {admin.username}
                    </span>
                  )}
                </div>
                <p className="text-xs md:text-sm text-gray-500 hidden md:block">Welcome back!</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              size="sm"
              className="flex items-center"
            >
              <LogOut className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">
                {logoutMutation.isPending ? "Logging out..." : "Logout"}
              </span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* Desktop Tabs */}
          <div className="hidden lg:block mb-8">
            <TabsList className="grid grid-cols-9 w-full">
              <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
              <TabsTrigger value="employees" className="text-xs">Employees</TabsTrigger>
              <TabsTrigger value="companies" className="text-xs">Companies</TabsTrigger>
              <TabsTrigger value="employee-management" className="text-xs">Employee Mgmt</TabsTrigger>
              <TabsTrigger value="company-management" className="text-xs">Company Mgmt</TabsTrigger>
              <TabsTrigger value="cin-verification" className="text-xs">CIN</TabsTrigger>
              <TabsTrigger value="pan-verification" className="text-xs">PAN</TabsTrigger>
              <TabsTrigger value="gst-verification" className="text-xs">GST</TabsTrigger>
              <TabsTrigger value="verifications" className="text-xs">Verifications</TabsTrigger>
              <TabsTrigger value="feedback" className="text-xs">Feedback</TabsTrigger>
            </TabsList>
          </div>
          
          {/* Mobile Tab Selector */}
          <div className="lg:hidden mb-8">
            <div className="relative">
              <select 
                value={activeTab} 
                onChange={(e) => setActiveTab(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md bg-white text-sm font-medium"
              >
                <option value="overview">Overview</option>
                <option value="employees">Employees</option>
                <option value="companies">Companies</option>
                <option value="employee-management">Employee Management</option>
                <option value="company-management">Company Management</option>
                <option value="cin-verification">CIN Verification</option>
                <option value="pan-verification">PAN Verification</option>
                <option value="gst-verification">GST Verification</option>
                <option value="verifications">Verifications</option>
                <option value="feedback">Feedback</option>
              </select>
            </div>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.employees || 0}</div>
                  <p className="text-xs text-muted-foreground">Registered employees</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
                  <Building className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.companies || 0}</div>
                  <p className="text-xs text-muted-foreground">Registered companies</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Job Listings</CardTitle>
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalJobs || 0}</div>
                  <p className="text-xs text-muted-foreground">All job listings</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.activeJobs || 0}</div>
                  <p className="text-xs text-muted-foreground">Currently active</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Admin Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Admin ID:</span>
                    <span className="text-sm text-muted-foreground">{admin?.adminId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Username:</span>
                    <span className="text-sm text-muted-foreground">{admin?.username}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Email:</span>
                    <span className="text-sm text-muted-foreground">{admin?.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Role:</span>
                    <Badge variant="outline">{admin?.role}</Badge>
                  </div>
                  {admin?.lastLogin && (
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Last Login:</span>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(admin.lastLogin), "PPp")}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Employees Tab */}
          <TabsContent value="employees">
            <Card>
              <CardHeader>
                <CardTitle>Manage Employees</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Employee Search */}
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      data-testid="input-employee-search"
                      placeholder="Search by name, email, phone, or employee ID..."
                      value={employeeSearch}
                      onChange={(e) => setEmployeeSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Search employees by name, email, phone number, or employee ID
                  </p>
                </div>
                {employees && employees.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employees.map((employee) => (
                        <TableRow key={employee.id}>
                          <TableCell className="font-medium">{employee.employeeId}</TableCell>
                          <TableCell>{`${employee.firstName} ${employee.lastName}`}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Mail className="h-3 w-3 mr-1 text-muted-foreground" />
                              {employee.email}
                            </div>
                          </TableCell>
                          <TableCell>{employee.phone}</TableCell>
                          <TableCell>
                            <Badge variant={employee.isActive ? "default" : "secondary"}>
                              {employee.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3 mr-1" />
                              {employee.createdAt ? format(new Date(employee.createdAt), "PP") : "N/A"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={employee.isActive ?? true}
                                onCheckedChange={(checked) =>
                                  toggleEmployeeMutation.mutate({
                                    id: employee.id,
                                    isActive: checked,
                                  })
                                }
                                disabled={toggleEmployeeMutation.isPending}
                              />
                              <span className="text-sm text-muted-foreground">
                                {employee.isActive ? "Deactivate" : "Activate"}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                data-testid={`button-download-employee-${employee.id}`}
                                onClick={() => downloadEmployeeBackup(employee.id, `${employee.firstName} ${employee.lastName}`)}
                                className="ml-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                title="Download Backup"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    data-testid={`button-delete-employee-${employee.id}`}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    title="Delete Employee"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Employee - Confirmation Required</AlertDialogTitle>
                                    <AlertDialogDescription className="space-y-3">
                                      <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                                        <p className="font-semibold text-red-800">⚠️ PERMANENT DELETION WARNING</p>
                                        <p className="text-red-700">You are about to permanently delete <strong>{employee.firstName} {employee.lastName}</strong> and ALL associated data.</p>
                                      </div>
                                      <div className="space-y-2">
                                        <p className="font-medium">This will remove:</p>
                                        <ul className="list-disc pl-5 space-y-1 text-sm">
                                          <li>Employee profile and personal information</li>
                                          <li>Work entries and employment history</li>
                                          <li>Job applications and saved jobs</li>
                                          <li>Education, certifications, and projects</li>
                                          <li>All feedback and skill preferences</li>
                                        </ul>
                                      </div>
                                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                                        <p className="font-medium text-blue-800">💡 Recommendation</p>
                                        <p className="text-blue-700">Download a backup first using the blue download button to preserve the data locally.</p>
                                      </div>
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteEmployeeMutation.mutate(employee.id)}
                                      className="bg-red-600 hover:bg-red-700 text-white"
                                      disabled={deleteEmployeeMutation.isPending}
                                    >
                                      {deleteEmployeeMutation.isPending ? "Deleting..." : "I Understand - Delete Permanently"}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <Alert>
                    <AlertDescription>No employees found</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Companies Tab */}
          <TabsContent value="companies">
            <Card>
              <CardHeader>
                <CardTitle>Manage Companies</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Company Search */}
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      data-testid="input-company-search"
                      placeholder="Search by company name, email, company ID, or industry..."
                      value={companySearch}
                      onChange={(e) => setCompanySearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Search companies by name, email, company ID, or industry
                  </p>
                </div>
                {companies && companies.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Company ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Industry</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {companies.map((company) => (
                        <TableRow key={company.id}>
                          <TableCell className="font-medium">{company.id}</TableCell>
                          <TableCell>{company.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Mail className="h-3 w-3 mr-1 text-muted-foreground" />
                              {company.email}
                            </div>
                          </TableCell>
                          <TableCell>{company.city || 'N/A'}</TableCell>
                          <TableCell>{company.industry}</TableCell>
                          <TableCell>
                            <Badge variant={company.isActive ? "default" : "secondary"}>
                              {company.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3 mr-1" />
                              {company.createdAt ? format(new Date(company.createdAt), "PP") : "N/A"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={company.isActive ?? true}
                                onCheckedChange={(checked) =>
                                  toggleCompanyMutation.mutate({
                                    id: company.id,
                                    isActive: checked,
                                  })
                                }
                                disabled={toggleCompanyMutation.isPending}
                              />
                              <span className="text-sm text-muted-foreground">
                                {company.isActive ? "Deactivate" : "Activate"}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                data-testid={`button-download-company-${company.id}`}
                                onClick={() => downloadCompanyBackup(company.id, company.name)}
                                className="ml-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                title="Download Backup"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    data-testid={`button-delete-company-${company.id}`}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    title="Delete Company"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Company - Confirmation Required</AlertDialogTitle>
                                    <AlertDialogDescription className="space-y-3">
                                      <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                                        <p className="font-semibold text-red-800">⚠️ PERMANENT DELETION WARNING</p>
                                        <p className="text-red-700">You are about to permanently delete <strong>{company.name}</strong> and ALL associated data.</p>
                                      </div>
                                      <div className="space-y-2">
                                        <p className="font-medium">This will remove:</p>
                                        <ul className="list-disc pl-5 space-y-1 text-sm">
                                          <li>Company profile and business information</li>
                                          <li>All employee relationships and work entries</li>
                                          <li>Job listings and applications</li>
                                          <li>Invitation codes and access permissions</li>
                                          <li>All company feedback and analytics</li>
                                        </ul>
                                      </div>
                                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                                        <p className="font-medium text-blue-800">💡 Recommendation</p>
                                        <p className="text-blue-700">Download a backup first using the blue download button to preserve the data locally.</p>
                                      </div>
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteCompanyMutation.mutate(company.id)}
                                      className="bg-red-600 hover:bg-red-700 text-white"
                                      disabled={deleteCompanyMutation.isPending}
                                    >
                                      {deleteCompanyMutation.isPending ? "Deleting..." : "I Understand - Delete Permanently"}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <Alert>
                    <AlertDescription>No companies found</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Employee Management Tab */}
          <TabsContent value="employee-management">
            <EmployeeManagement />
          </TabsContent>

          {/* Company Management Tab */}
          <TabsContent value="company-management">
            <CompanyManagement />
          </TabsContent>

          {/* CIN Verification Tab */}
          <TabsContent value="cin-verification">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  CIN Verification Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pendingCinCompanies && pendingCinCompanies.length > 0 ? (
                  <div className="space-y-6">
                    {pendingCinCompanies.map((company) => (
                      <div key={company.id} className="border rounded-lg p-6 bg-white">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h3 className="text-lg font-semibold mb-4">{company.name}</h3>
                            <div className="space-y-2 text-sm">
                              <div><strong>Company ID:</strong> {company.companyId}</div>
                              <div><strong>Email:</strong> {company.email}</div>
                              <div><strong>Industry:</strong> {company.industry}</div>
                              <div><strong>Establishment Year:</strong> {company.establishmentYear}</div>
                              <div><strong>Location:</strong> {company.city}, {company.state}, {company.country}</div>
                              <div><strong>CIN Number:</strong> 
                                <Badge variant="outline" className="ml-2 font-mono">
                                  {company.cin}
                                </Badge>
                              </div>
                              <div><strong>Registration Date:</strong> {format(new Date(company.createdAt), "PPP")}</div>
                            </div>
                          </div>
                          
                          <div>
                            <div className="mb-4">
                              <label className="block text-sm font-medium mb-2">
                                Verification Notes (Optional)
                              </label>
                              <textarea
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                rows={4}
                                placeholder="Add verification notes, MCA portal findings, or rejection reasons..."
                                value={cinVerificationNotes[company.id] || ""}
                                onChange={(e) => setCinVerificationNotes(prev => ({
                                  ...prev,
                                  [company.id]: e.target.value
                                }))}
                              />
                            </div>
                            
                            <div className="flex space-x-3">
                              <Button
                                onClick={() => cinVerificationMutation.mutate({
                                  companyId: company.id,
                                  status: "verified",
                                  notes: cinVerificationNotes[company.id]
                                })}
                                disabled={cinVerificationMutation.isPending}
                                className="bg-green-600 hover:bg-green-700"
                                data-testid={`button-verify-cin-${company.id}`}
                              >
                                <ShieldCheck className="h-4 w-4 mr-2" />
                                Verify CIN
                              </Button>
                              
                              <Button
                                variant="destructive"
                                onClick={() => cinVerificationMutation.mutate({
                                  companyId: company.id,
                                  status: "rejected",
                                  notes: cinVerificationNotes[company.id]
                                })}
                                disabled={cinVerificationMutation.isPending}
                                data-testid={`button-reject-cin-${company.id}`}
                              >
                                <UserX className="h-4 w-4 mr-2" />
                                Reject CIN
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Alert>
                    <ShieldCheck className="h-4 w-4" />
                    <AlertTitle>No Pending CIN Verifications</AlertTitle>
                    <AlertDescription>
                      All company CIN numbers have been processed. New registrations requiring CIN verification will appear here.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* PAN Verification Tab */}
          <TabsContent value="pan-verification">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  PAN Verification Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pendingPanCompanies && pendingPanCompanies.length > 0 ? (
                  <div className="space-y-6">
                    {pendingPanCompanies.map((company) => (
                      <div key={company.id} className="border rounded-lg p-6 bg-white">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h3 className="text-lg font-semibold mb-4">{company.name}</h3>
                            <div className="space-y-2 text-sm">
                              <div><strong>Company ID:</strong> {company.companyId}</div>
                              <div><strong>Email:</strong> {company.email}</div>
                              <div><strong>Industry:</strong> {company.industry}</div>
                              <div><strong>Establishment Year:</strong> {company.establishmentYear}</div>
                              <div><strong>Location:</strong> {company.city}, {company.state}, {company.country}</div>
                              <div><strong>PAN Number:</strong> 
                                <Badge variant="outline" className="ml-2 font-mono">
                                  {company.panNumber}
                                </Badge>
                              </div>
                              <div><strong>Registration Date:</strong> {format(new Date(company.createdAt), "PPP")}</div>
                            </div>
                          </div>
                          
                          <div>
                            <div className="mb-4">
                              <label className="block text-sm font-medium mb-2">
                                Verification Notes (Optional)
                              </label>
                              <textarea
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                rows={4}
                                placeholder="Add verification notes, tax portal findings, or rejection reasons..."
                                value={panVerificationNotes[company.id] || ""}
                                onChange={(e) => setPanVerificationNotes(prev => ({
                                  ...prev,
                                  [company.id]: e.target.value
                                }))}
                              />
                            </div>
                            
                            <div className="flex gap-3">
                              <Button
                                onClick={() => panVerificationMutation.mutate({
                                  companyId: company.id,
                                  status: "verified",
                                  notes: panVerificationNotes[company.id]
                                })}
                                disabled={panVerificationMutation.isPending}
                                className="flex-1 bg-green-600 hover:bg-green-700"
                                data-testid={`button-approve-pan-${company.id}`}
                              >
                                <UserCheck className="h-4 w-4 mr-2" />
                                {panVerificationMutation.isPending ? "Processing..." : "Approve PAN"}
                              </Button>
                              
                              <Button
                                onClick={() => panVerificationMutation.mutate({
                                  companyId: company.id,
                                  status: "rejected",
                                  notes: panVerificationNotes[company.id]
                                })}
                                disabled={panVerificationMutation.isPending}
                                variant="destructive"
                                className="flex-1"
                                data-testid={`button-reject-pan-${company.id}`}
                              >
                                <UserX className="h-4 w-4 mr-2" />
                                {panVerificationMutation.isPending ? "Processing..." : "Reject PAN"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Pending PAN Verifications</h3>
                    <p className="text-muted-foreground">
                      All PAN verification requests have been processed or no companies have submitted PAN numbers for verification.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* GST Verification Tab */}
          <TabsContent value="gst-verification">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  GST Verification Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pendingGstCompanies && pendingGstCompanies.length > 0 ? (
                  <div className="space-y-4">
                    {pendingGstCompanies.map((company) => (
                      <div key={company.id} className="p-6 border rounded-lg bg-white shadow-sm">
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <h3 className="font-semibold text-lg">{company.name}</h3>
                              <div className="space-y-1 text-sm text-gray-600">
                                <p><span className="font-medium">Company ID:</span> {company.companyId}</p>
                                <p><span className="font-medium">Email:</span> {company.email}</p>
                                <p><span className="font-medium">GST Number:</span> {company.registrationNumber || 'Not provided'}</p>
                                <p><span className="font-medium">Registration Type:</span> {company.registrationType}</p>
                                <p><span className="font-medium">Industry:</span> {company.industry}</p>
                                <p><span className="font-medium">Address:</span> {company.address}, {company.city}, {company.state} - {company.pincode}</p>
                                <p><span className="font-medium">Establishment Year:</span> {company.establishmentYear}</p>
                                <p><span className="font-medium">Company Size:</span> {company.size}</p>
                                <p><span className="font-medium">Submitted:</span> {format(new Date(company.createdAt), "PPp")}</p>
                              </div>
                            </div>
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                              Pending GST Verification
                            </Badge>
                          </div>
                          
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium mb-2">Admin Notes (Optional)</label>
                              <Input
                                placeholder="Add verification notes..."
                                value={gstVerificationNotes[company.id] || ""}
                                onChange={(e) => setGstVerificationNotes(prev => ({
                                  ...prev,
                                  [company.id]: e.target.value
                                }))}
                                data-testid={`input-gst-notes-${company.id}`}
                              />
                            </div>
                            
                            <div className="flex gap-3">
                              <Button
                                onClick={() => gstVerificationMutation.mutate({
                                  companyId: company.id,
                                  status: "verified",
                                  notes: gstVerificationNotes[company.id]
                                })}
                                disabled={gstVerificationMutation.isPending}
                                className="bg-green-600 hover:bg-green-700 flex-1"
                                data-testid={`button-approve-gst-${company.id}`}
                              >
                                <UserCheck className="h-4 w-4 mr-2" />
                                {gstVerificationMutation.isPending ? "Processing..." : "Approve GST"}
                              </Button>
                              
                              <Button
                                onClick={() => gstVerificationMutation.mutate({
                                  companyId: company.id,
                                  status: "rejected",
                                  notes: gstVerificationNotes[company.id]
                                })}
                                disabled={gstVerificationMutation.isPending}
                                variant="destructive"
                                className="flex-1"
                                data-testid={`button-reject-gst-${company.id}`}
                              >
                                <UserX className="h-4 w-4 mr-2" />
                                {gstVerificationMutation.isPending ? "Processing..." : "Reject GST"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Pending GST Verifications</h3>
                    <p className="text-muted-foreground">
                      All GST verification requests have been processed or no companies have submitted GST numbers for verification.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Verifications Tab */}
          <TabsContent value="verifications">
            <Card>
              <CardHeader>
                <CardTitle>Company Verification Management</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Review and manage company verification requests
                </p>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <ShieldCheck className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Company Verification System</h3>
                  <p className="text-muted-foreground mb-6">
                    Access the dedicated verification interface to review pending company verification requests
                  </p>
                  <Button 
                    onClick={() => navigate("/admin/verifications")}
                    className="bg-blue-600 hover:bg-blue-700"
                    data-testid="button-admin-verifications"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Open Verification Center
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Feedback Tab */}
          <TabsContent value="feedback">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>User Feedback</CardTitle>
                    <p className="text-sm text-muted-foreground">View and manage user feedback submissions</p>
                  </div>
                  <Button
                    onClick={() => navigate("/admin/feedback")}
                    data-testid="button-manage-feedback"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Manage Feedback
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Alert>
                  <MessageSquare className="h-4 w-4" />
                  <AlertTitle>Feedback Management</AlertTitle>
                  <AlertDescription>
                    Click "Manage Feedback" to access the full feedback management interface where you can 
                    view detailed feedback submissions, respond to users, and track feedback status.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
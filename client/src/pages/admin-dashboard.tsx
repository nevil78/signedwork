import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, Building, Briefcase, TrendingUp, LogOut, 
  ShieldCheck, UserCheck, UserX, Calendar, Mail, Search, Shield, MessageSquare
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
              <img src={signedworkLogo} alt="Signedwork" className="h-8 w-8 mr-3" />
              <div>
                <h1 className="text-xl font-semibold">Signedwork Admin</h1>
                <p className="text-sm text-gray-500">Welcome, {admin?.username}</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="employees">Employees</TabsTrigger>
            <TabsTrigger value="companies">Companies</TabsTrigger>
            <TabsTrigger value="verifications">Verifications</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
          </TabsList>

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
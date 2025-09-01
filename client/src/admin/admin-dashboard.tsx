import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import signedworkLogo from "@assets/Signed-work-Logo (1)_1755168042120.png";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Users,
  Building,
  Briefcase,
  TrendingUp,
  LogOut,
  Search,
  Mail,
  Calendar,
  Trash2,
  MapPin,
  Phone,
  Shield,
  ShieldCheck,
  UserCheck,
  UserX,
  CheckCircle,
  XCircle,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  FileText,
  Globe,
  CreditCard,
  Eye,
  Settings,
} from "lucide-react";

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [companySearch, setCompanySearch] = useState("");
  const [expandedCompany, setExpandedCompany] = useState<string | null>(null);

  // Fetch admin user
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  // Fetch stats for overview
  const { data: stats } = useQuery({
    queryKey: ["/api/admin/stats"],
    retry: false,
  });

  // Fetch employees
  const { data: employees } = useQuery({
    queryKey: ["/api/admin/employees"],
    retry: false,
  });

  // Fetch companies
  const { data: companies } = useQuery({
    queryKey: ["/api/admin/companies"],
    retry: false,
  });

  // Delete employee mutation
  const deleteEmployeeMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/employees/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/employees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Employee deleted",
        description: "Employee has been permanently deleted",
      });
    },
  });

  // Delete company mutation
  const deleteCompanyMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/companies/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/companies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Company deleted",
        description: "Company has been permanently deleted",
      });
    },
  });

  // Company verification mutations
  const verifyDocumentMutation = useMutation({
    mutationFn: ({ companyId, docType, status, notes }: { 
      companyId: string; 
      docType: 'pan' | 'cin' | 'gst'; 
      status: 'approved' | 'rejected';
      notes?: string;
    }) => apiRequest("POST", `/api/admin/companies/${companyId}/verify-document`, {
      docType,
      status,
      notes
    }),
    onSuccess: (data: any) => {
      console.log("Verification mutation success:", data);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/companies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/verifications"] });
      toast({
        title: "Document verification updated",
        description: `${data.docType?.toUpperCase() || 'Document'} ${data.status === 'approved' ? 'approved' : 'rejected'} successfully`,
      });
    },
    onError: (error: any) => {
      console.error("Verification mutation error:", error);
      toast({
        title: "Verification failed",
        description: error.message || "Failed to update document verification",
        variant: "destructive"
      });
    },
  });

  // Work diary access toggle mutation
  const toggleWorkDiaryMutation = useMutation({
    mutationFn: (companyId: string) => apiRequest("POST", `/api/admin/companies/${companyId}/toggle-work-diary`),
    onSuccess: (data) => {
      console.log("Toggle mutation success:", data);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/companies"] });
      toast({
        title: "Work diary access updated",
        description: "Company work diary access has been updated successfully",
      });
    },
    onError: (error) => {
      console.error("Toggle mutation error:", error);
      toast({
        title: "Failed to update work diary access",
        description: error.message || "An error occurred",
        variant: "destructive"
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/auth/logout"),
    onSuccess: () => {
      navigate("/admin/login");
    },
  });

  if (userLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const admin = (userData as any)?.user;

  // Filter functions
  const filteredEmployees = (employees as any[])?.filter((employee: any) =>
    employee.firstName?.toLowerCase().includes(employeeSearch.toLowerCase()) ||
    employee.lastName?.toLowerCase().includes(employeeSearch.toLowerCase()) ||
    employee.email?.toLowerCase().includes(employeeSearch.toLowerCase()) ||
    employee.phone?.includes(employeeSearch) ||
    employee.employeeId?.toLowerCase().includes(employeeSearch.toLowerCase())
  );

  const filteredCompanies = (companies as any[])?.filter((company: any) =>
    company.name?.toLowerCase().includes(companySearch.toLowerCase()) ||
    company.email?.toLowerCase().includes(companySearch.toLowerCase()) ||
    company.companyId?.toLowerCase().includes(companySearch.toLowerCase()) ||
    company.industry?.toLowerCase().includes(companySearch.toLowerCase())
  );

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
                <p className="text-xs md:text-sm text-gray-500 hidden md:block">Platform Management Center</p>
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
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="overview" className="text-sm">Overview</TabsTrigger>
              <TabsTrigger value="employees" className="text-sm">Employees</TabsTrigger>
              <TabsTrigger value="companies" className="text-sm">Companies</TabsTrigger>
              <TabsTrigger value="feedback" className="text-sm">Feedback</TabsTrigger>
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
                  <div className="text-2xl font-bold">{(stats as any)?.employees || 0}</div>
                  <p className="text-xs text-muted-foreground">Registered employees</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
                  <Building className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{(stats as any)?.companies || 0}</div>
                  <p className="text-xs text-muted-foreground">Registered companies</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Job Listings</CardTitle>
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{(stats as any)?.totalJobs || 0}</div>
                  <p className="text-xs text-muted-foreground">All job listings</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{(stats as any)?.activeJobs || 0}</div>
                  <p className="text-xs text-muted-foreground">Currently active</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Admin Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
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

          {/* Employees Tab - Simple tracking only */}
          <TabsContent value="employees">
            <Card>
              <CardHeader>
                <CardTitle>Employee Management</CardTitle>
                <p className="text-sm text-muted-foreground">Track registered employees on the platform</p>
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
                
                {filteredEmployees && filteredEmployees.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEmployees.map((employee: any) => (
                        <TableRow key={employee.id}>
                          <TableCell className="font-medium">{employee.employeeId}</TableCell>
                          <TableCell>{`${employee.firstName} ${employee.lastName}`}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Mail className="h-3 w-3 mr-1 text-muted-foreground" />
                              {employee.email}
                            </div>
                          </TableCell>
                          <TableCell>{employee.phone || "N/A"}</TableCell>
                          <TableCell>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3 mr-1" />
                              {employee.createdAt ? format(new Date(employee.createdAt), "PP") : "N/A"}
                            </div>
                          </TableCell>
                          <TableCell>
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
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteEmployeeMutation.mutate(employee.id)}
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                    disabled={deleteEmployeeMutation.isPending}
                                  >
                                    {deleteEmployeeMutation.isPending ? "Deleting..." : "Delete Permanently"}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
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

          {/* Companies Tab - Unified management with integrated verification */}
          <TabsContent value="companies">
            <Card>
              <CardHeader>
                <CardTitle>Company Management</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Manage companies, verify documents, and control work diary access
                </p>
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
                    Click on any company name to view all verification details and manage work diary access
                  </p>
                </div>

                {filteredCompanies && filteredCompanies.length > 0 ? (
                  <div className="space-y-4">
                    {filteredCompanies.map((company: any) => (
                      <Collapsible key={company.id} open={expandedCompany === company.id} onOpenChange={(open) => setExpandedCompany(open ? company.id : null)}>
                        <Card className="border-l-4 border-l-blue-500">
                          <CollapsibleTrigger asChild>
                            <div className="cursor-pointer hover:bg-gray-50 transition-colors">
                              <CardHeader className="pb-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <Building className="h-5 w-5 text-blue-600" />
                                    <div>
                                      <h3 className="text-lg font-semibold text-blue-700 hover:text-blue-800">
                                        {company.name}
                                      </h3>
                                      <p className="text-sm text-muted-foreground">{company.industry}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-4">
                                    {/* Verification Status Indicators */}
                                    <div className="flex items-center space-x-2">
                                      <Badge variant={company.panVerificationStatus === 'approved' ? 'default' : company.panVerificationStatus === 'rejected' ? 'destructive' : 'outline'}>
                                        PAN: {company.panVerificationStatus || 'pending'}
                                      </Badge>
                                      <Badge variant={company.cinVerificationStatus === 'approved' ? 'default' : company.cinVerificationStatus === 'rejected' ? 'destructive' : 'outline'}>
                                        CIN: {company.cinVerificationStatus || 'pending'}
                                      </Badge>
                                      <Badge variant={company.gstVerificationStatus === 'approved' ? 'default' : company.gstVerificationStatus === 'rejected' ? 'destructive' : 'outline'}>
                                        GST: {company.gstVerificationStatus || 'pending'}
                                      </Badge>
                                    </div>
                                    
                                    {/* Work Diary Access Status */}
                                    <div className="flex items-center space-x-2">
                                      <Badge variant={company.workDiaryAccess ? 'default' : 'secondary'}>
                                        Work Diary: {company.workDiaryAccess ? 'Enabled' : 'Disabled'}
                                      </Badge>
                                    </div>
                                    
                                    {expandedCompany === company.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                  </div>
                                </div>
                              </CardHeader>
                            </div>
                          </CollapsibleTrigger>
                          
                          <CollapsibleContent>
                            <CardContent className="pt-0">
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Company Information */}
                                <div>
                                  <h4 className="text-md font-semibold mb-4 flex items-center">
                                    <Building className="h-4 w-4 mr-2" />
                                    Company Information
                                  </h4>
                                  <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                      <span className="font-medium">Company ID:</span>
                                      <span className="text-muted-foreground font-mono">{company.companyId}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="font-medium">Email:</span>
                                      <span className="text-muted-foreground">{company.email}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="font-medium">Founded:</span>
                                      <span className="text-muted-foreground">{company.establishmentYear}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="font-medium">Location:</span>
                                      <span className="text-muted-foreground">{company.city}, {company.state}, {company.country}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="font-medium">Registered:</span>
                                      <span className="text-muted-foreground">{format(new Date(company.createdAt), "PP")}</span>
                                    </div>
                                  </div>

                                  {/* Work Diary Access Control */}
                                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                                    <h5 className="font-semibold mb-3 flex items-center">
                                      <Settings className="h-4 w-4 mr-2" />
                                      Work Diary Access Control
                                    </h5>
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className="text-sm font-medium">Work Diary Access</p>
                                        <p className="text-xs text-muted-foreground">
                                          Enable after verification is complete
                                        </p>
                                      </div>
                                      <Switch
                                        checked={company.workDiaryAccess || false}
                                        onCheckedChange={() => toggleWorkDiaryMutation.mutate(company.id)}
                                        disabled={toggleWorkDiaryMutation.isPending}
                                        data-testid={`toggle-work-diary-${company.id}`}
                                      />
                                    </div>
                                  </div>
                                </div>

                                {/* Document Verification Section */}
                                <div>
                                  <h4 className="text-md font-semibold mb-4 flex items-center">
                                    <Shield className="h-4 w-4 mr-2" />
                                    Document Verification
                                  </h4>
                                  
                                  {/* PAN Verification - Only show if company provided PAN number */}
                                  {company.panNumber && (
                                    <div className="mb-6 p-4 border border-gray-200 rounded-md">
                                      <div className="flex items-center justify-between mb-3">
                                        <h5 className="font-medium flex items-center">
                                          <FileText className="h-4 w-4 mr-2" />
                                          PAN Verification
                                        </h5>
                                        <Badge variant={company.panVerificationStatus === 'verified' ? 'default' : company.panVerificationStatus === 'rejected' ? 'destructive' : 'outline'}>
                                          {company.panVerificationStatus || 'pending'}
                                        </Badge>
                                      </div>
                                      
                                      <div className="mb-3">
                                        <p className="text-sm"><strong>PAN Number:</strong> 
                                          <span className="font-mono ml-2 bg-gray-100 px-2 py-1 rounded text-xs">
                                            {company.panNumber}
                                          </span>
                                        </p>
                                      </div>
                                      
                                      {company.panVerificationStatus !== 'verified' && (
                                        <div className="flex space-x-2">
                                          <Button
                                            onClick={() => verifyDocumentMutation.mutate({
                                              companyId: company.id,
                                              docType: 'pan',
                                              status: 'approved'
                                            })}
                                            disabled={verifyDocumentMutation.isPending}
                                            size="sm"
                                            className="flex-1"
                                            data-testid={`button-approve-pan-${company.id}`}
                                          >
                                            <UserCheck className="h-4 w-4 mr-2" />
                                            Approve PAN
                                          </Button>
                                          <Button
                                            onClick={() => verifyDocumentMutation.mutate({
                                              companyId: company.id,
                                              docType: 'pan',
                                              status: 'rejected'
                                            })}
                                            disabled={verifyDocumentMutation.isPending}
                                            variant="destructive"
                                            size="sm"
                                            className="flex-1"
                                            data-testid={`button-reject-pan-${company.id}`}
                                          >
                                            <UserX className="h-4 w-4 mr-2" />
                                            Reject PAN
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* CIN Verification - Only show if company provided CIN number */}
                                  {company.cin && (
                                    <div className="mb-6 p-4 border border-gray-200 rounded-md">
                                      <div className="flex items-center justify-between mb-3">
                                        <h5 className="font-medium flex items-center">
                                          <FileText className="h-4 w-4 mr-2" />
                                          CIN Verification
                                        </h5>
                                        <Badge variant={company.cinVerificationStatus === 'verified' ? 'default' : company.cinVerificationStatus === 'rejected' ? 'destructive' : 'outline'}>
                                          {company.cinVerificationStatus || 'pending'}
                                        </Badge>
                                      </div>
                                      
                                      <div className="mb-3">
                                        <p className="text-sm"><strong>CIN Number:</strong> 
                                          <span className="font-mono ml-2 bg-gray-100 px-2 py-1 rounded text-xs">
                                            {company.cin}
                                          </span>
                                        </p>
                                      </div>
                                      
                                      {company.cinVerificationStatus !== 'verified' && (
                                        <div className="flex space-x-2">
                                          <Button
                                            onClick={() => verifyDocumentMutation.mutate({
                                              companyId: company.id,
                                              docType: 'cin',
                                              status: 'approved'
                                            })}
                                            disabled={verifyDocumentMutation.isPending}
                                            size="sm"
                                            className="flex-1"
                                            data-testid={`button-approve-cin-${company.id}`}
                                          >
                                            <UserCheck className="h-4 w-4 mr-2" />
                                            Approve CIN
                                          </Button>
                                          <Button
                                            onClick={() => verifyDocumentMutation.mutate({
                                              companyId: company.id,
                                              docType: 'cin',
                                              status: 'rejected'
                                            })}
                                            disabled={verifyDocumentMutation.isPending}
                                            variant="destructive"
                                            size="sm"
                                            className="flex-1"
                                            data-testid={`button-reject-cin-${company.id}`}
                                          >
                                            <UserX className="h-4 w-4 mr-2" />
                                            Reject CIN
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* GST Verification - Only show if company provided GST number */}
                                  {company.gstNumber && (
                                    <div className="mb-6 p-4 border border-gray-200 rounded-md">
                                      <div className="flex items-center justify-between mb-3">
                                        <h5 className="font-medium flex items-center">
                                          <FileText className="h-4 w-4 mr-2" />
                                          GST Verification
                                        </h5>
                                        <Badge variant={company.gstVerificationStatus === 'verified' ? 'default' : company.gstVerificationStatus === 'rejected' ? 'destructive' : 'outline'}>
                                          {company.gstVerificationStatus || 'pending'}
                                        </Badge>
                                      </div>
                                      
                                      <div className="mb-3">
                                        <p className="text-sm"><strong>GST Number:</strong> 
                                          <span className="font-mono ml-2 bg-gray-100 px-2 py-1 rounded text-xs">
                                            {company.gstNumber}
                                          </span>
                                        </p>
                                      </div>
                                      
                                      {company.gstVerificationStatus !== 'verified' && (
                                        <div className="flex space-x-2">
                                          <Button
                                            onClick={() => verifyDocumentMutation.mutate({
                                              companyId: company.id,
                                              docType: 'gst',
                                              status: 'approved'
                                            })}
                                            disabled={verifyDocumentMutation.isPending}
                                            size="sm"
                                            className="flex-1"
                                            data-testid={`button-approve-gst-${company.id}`}
                                          >
                                            <UserCheck className="h-4 w-4 mr-2" />
                                            Approve GST
                                          </Button>
                                          <Button
                                            onClick={() => verifyDocumentMutation.mutate({
                                              companyId: company.id,
                                              docType: 'gst',
                                              status: 'rejected'
                                            })}
                                            disabled={verifyDocumentMutation.isPending}
                                            variant="destructive"
                                            size="sm"
                                            className="flex-1"
                                            data-testid={`button-reject-gst-${company.id}`}
                                          >
                                            <UserX className="h-4 w-4 mr-2" />
                                            Reject GST
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Company Actions */}
                                  <div className="flex justify-end pt-4 border-t border-gray-200">
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button 
                                          variant="outline" 
                                          size="sm" 
                                          data-testid={`button-delete-company-${company.id}`}
                                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Delete Company
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
                                                <li>All verification documents and status</li>
                                                <li>Employee work entries and company data</li>
                                                <li>Job postings and applications</li>
                                                <li>All company-related feedback</li>
                                              </ul>
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
                                            {deleteCompanyMutation.isPending ? "Deleting..." : "Delete Permanently"}
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </CollapsibleContent>
                        </Card>
                      </Collapsible>
                    ))}
                  </div>
                ) : (
                  <Alert>
                    <AlertDescription>No companies found</AlertDescription>
                  </Alert>
                )}
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
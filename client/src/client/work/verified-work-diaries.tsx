import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Shield,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  Calendar,
  Search,
  Filter,
  Download,
  Eye,
  Star,
  Award,
  TrendingUp,
  BarChart3,
  User
} from "lucide-react";
import ClientNavHeader from "@/components/client-nav-header";

interface WorkDiaryEntry {
  id: string;
  employeeId: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    profilePhoto?: string;
    employeeId: string;
  };
  title: string;
  description: string;
  hoursWorked: number;
  workDate: string;
  verificationStatus: 'pending' | 'team_lead_approved' | 'branch_manager_approved' | 'company_approved' | 'rejected';
  verificationChain: {
    teamLead?: { name: string; approvedAt: string; };
    branchManager?: { name: string; approvedAt: string; };
    companyAdmin?: { name: string; approvedAt: string; };
  };
  screenshots?: string[];
  achievements: string[];
  skillsUsed: string[];
  createdAt: string;
}

export default function VerifiedWorkDiaries() {
  const [searchTerm, setSearchTerm] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState("week");

  // Fetch verified work diary entries for client's hired freelancers
  const { data: workEntries = [], isLoading } = useQuery({
    queryKey: ["/api/client/work-diaries", { 
      search: searchTerm, 
      employee: employeeFilter, 
      status: statusFilter,
      dateRange 
    }],
  });

  // Fetch client's hired freelancers for filter
  const { data: hiredFreelancers = [] } = useQuery({
    queryKey: ["/api/client/hired-freelancers"],
  });

  const getVerificationColor = (status: string) => {
    switch (status) {
      case 'company_approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'branch_manager_approved': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'team_lead_approved': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'pending': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getVerificationIcon = (status: string) => {
    switch (status) {
      case 'company_approved': return <CheckCircle className="w-4 h-4" />;
      case 'branch_manager_approved': return <Shield className="w-4 h-4" />;
      case 'team_lead_approved': return <Clock className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'rejected': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getVerificationLevel = (status: string) => {
    switch (status) {
      case 'company_approved': return 'Fully Verified ⭐⭐⭐';
      case 'branch_manager_approved': return 'Manager Verified ⭐⭐';
      case 'team_lead_approved': return 'Lead Verified ⭐';
      case 'pending': return 'Pending Verification';
      case 'rejected': return 'Verification Failed';
      default: return 'Unknown Status';
    }
  };

  const filteredEntries = workEntries.filter((entry: WorkDiaryEntry) => {
    const matchesSearch = entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         `${entry.employee.firstName} ${entry.employee.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEmployee = employeeFilter === "all" || entry.employeeId === employeeFilter;
    const matchesStatus = statusFilter === "all" || entry.verificationStatus === statusFilter;
    
    return matchesSearch && matchesEmployee && matchesStatus;
  });

  const totalHours = filteredEntries.reduce((sum: number, entry: WorkDiaryEntry) => sum + entry.hoursWorked, 0);
  const verifiedEntries = filteredEntries.filter((entry: WorkDiaryEntry) => 
    ['company_approved', 'branch_manager_approved', 'team_lead_approved'].includes(entry.verificationStatus)
  );
  const verificationRate = filteredEntries.length > 0 ? (verifiedEntries.length / filteredEntries.length * 100).toFixed(1) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <ClientNavHeader />
      
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header with Verification Badge */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900" data-testid="page-title">
                Verified Work Diaries
              </h1>
              <Badge className="bg-green-600 text-white flex items-center gap-1">
                <Award className="w-4 h-4" />
                Fraud-Proof System
              </Badge>
            </div>
            <p className="text-gray-600">
              View authenticated, multi-level verified work from your hired freelancers
            </p>
            <p className="text-sm text-green-600 font-medium mt-1">
              ⭐ Signedwork's exclusive verification system - see exactly what work was done and approved
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export Report
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Hours Tracked</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-total-hours">{totalHours}</div>
              <p className="text-xs text-gray-600">Verified work time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Work Entries</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-total-entries">{filteredEntries.length}</div>
              <p className="text-xs text-gray-600">Total work records</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verification Rate</CardTitle>
              <Shield className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-verification-rate">{verificationRate}%</div>
              <p className="text-xs text-gray-600">Successfully verified</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Freelancers</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-active-freelancers">{hiredFreelancers.length}</div>
              <p className="text-xs text-gray-600">With verified work</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filter Verified Work</CardTitle>
            <CardDescription>Search and filter verified work diary entries</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search work entries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="search-work-entries"
                />
              </div>
              
              <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
                <SelectTrigger data-testid="filter-employee">
                  <SelectValue placeholder="All freelancers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All freelancers</SelectItem>
                  {hiredFreelancers.map((freelancer: any) => (
                    <SelectItem key={freelancer.id} value={freelancer.id}>
                      {freelancer.firstName} {freelancer.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger data-testid="filter-status">
                  <SelectValue placeholder="All verification levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All verification levels</SelectItem>
                  <SelectItem value="company_approved">Fully Verified ⭐⭐⭐</SelectItem>
                  <SelectItem value="branch_manager_approved">Manager Verified ⭐⭐</SelectItem>
                  <SelectItem value="team_lead_approved">Lead Verified ⭐</SelectItem>
                  <SelectItem value="pending">Pending Verification</SelectItem>
                </SelectContent>
              </Select>

              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger data-testid="filter-date">
                  <SelectValue placeholder="Time period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" className="flex items-center">
                <Filter className="w-4 h-4 mr-2" />
                Advanced
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Work Diary Entries */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <div className="h-6 bg-gray-200 rounded animate-pulse" />
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                      <div className="flex space-x-2">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-16" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredEntries.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No verified work entries</h3>
                <p className="text-gray-600">Work diary entries will appear here once your freelancers start logging verified work</p>
              </CardContent>
            </Card>
          ) : (
            filteredEntries.map((entry: WorkDiaryEntry) => (
              <Card key={entry.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={entry.employee.profilePhoto} />
                          <AvatarFallback>
                            {entry.employee.firstName[0]}{entry.employee.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-gray-900" data-testid={`entry-title-${entry.id}`}>
                            {entry.title}
                          </h3>
                          <p className="text-sm text-gray-600">
                            by {entry.employee.firstName} {entry.employee.lastName} ({entry.employee.employeeId})
                          </p>
                        </div>
                        <Badge 
                          className={`${getVerificationColor(entry.verificationStatus)} flex items-center gap-1`}
                          data-testid={`entry-verification-${entry.id}`}
                        >
                          {getVerificationIcon(entry.verificationStatus)}
                          {getVerificationLevel(entry.verificationStatus)}
                        </Badge>
                      </div>

                      <p className="text-gray-700 mb-4" data-testid={`entry-description-${entry.id}`}>
                        {entry.description}
                      </p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="text-sm" data-testid={`entry-hours-${entry.id}`}>
                            {entry.hoursWorked} hours
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-sm" data-testid={`entry-date-${entry.id}`}>
                            {new Date(entry.workDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-gray-500" />
                          <span className="text-sm" data-testid={`entry-achievements-${entry.id}`}>
                            {entry.achievements.length} achievements
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="text-sm" data-testid={`entry-skills-${entry.id}`}>
                            {entry.skillsUsed.length} skills used
                          </span>
                        </div>
                      </div>

                      {/* Verification Chain */}
                      {entry.verificationChain && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                          <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            Verification Chain (Fraud-Proof)
                          </h4>
                          <div className="space-y-2 text-sm">
                            {entry.verificationChain.teamLead && (
                              <div className="flex items-center gap-2 text-green-700">
                                <CheckCircle className="w-3 h-3" />
                                <span>Team Lead: {entry.verificationChain.teamLead.name}</span>
                                <span className="text-gray-600">
                                  ({new Date(entry.verificationChain.teamLead.approvedAt).toLocaleDateString()})
                                </span>
                              </div>
                            )}
                            {entry.verificationChain.branchManager && (
                              <div className="flex items-center gap-2 text-green-700">
                                <CheckCircle className="w-3 h-3" />
                                <span>Branch Manager: {entry.verificationChain.branchManager.name}</span>
                                <span className="text-gray-600">
                                  ({new Date(entry.verificationChain.branchManager.approvedAt).toLocaleDateString()})
                                </span>
                              </div>
                            )}
                            {entry.verificationChain.companyAdmin && (
                              <div className="flex items-center gap-2 text-green-700">
                                <CheckCircle className="w-3 h-3" />
                                <span>Company Admin: {entry.verificationChain.companyAdmin.name}</span>
                                <span className="text-gray-600">
                                  ({new Date(entry.verificationChain.companyAdmin.approvedAt).toLocaleDateString()})
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Skills and Achievements */}
                      <div className="space-y-3">
                        {entry.skillsUsed.length > 0 && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Skills Used:</h5>
                            <div className="flex flex-wrap gap-2">
                              {entry.skillsUsed.map((skill, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {entry.achievements.length > 0 && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Achievements:</h5>
                            <div className="flex flex-wrap gap-2">
                              {entry.achievements.map((achievement, index) => (
                                <Badge key={index} className="bg-yellow-100 text-yellow-800 text-xs">
                                  <Award className="w-3 h-3 mr-1" />
                                  {achievement}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button variant="outline" size="sm" data-testid={`button-view-entry-${entry.id}`}>
                        <Eye className="w-4 h-4 mr-1" />
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users,
  Search,
  Filter,
  Star,
  MapPin,
  Clock,
  DollarSign,
  Shield,
  MessageSquare,
  Eye,
  TrendingUp,
  Calendar,
  Award,
  CheckCircle,
  PlayCircle,
  PauseCircle,
  FileText,
  BarChart3
} from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ClientNavHeader from "@/components/client-nav-header";

interface HiredTalent {
  id: string;
  contractId: string;
  freelancerId: string;
  employeeId: string;
  freelancer: {
    id: string;
    firstName: string;
    lastName: string;
    profilePhoto?: string;
    title: string;
    hourlyRate: number;
    rating: number;
    totalReviews: number;
    location: string;
    verificationLevel: 'verified' | 'company_verified' | 'basic';
    responseTime: string;
    isOnline: boolean;
    lastActive: string;
  };
  project: {
    id: string;
    title: string;
    category: string;
    startDate: string;
    endDate?: string;
    budget: number;
    status: 'active' | 'completed' | 'paused' | 'cancelled';
  };
  contractType: 'hourly' | 'fixed_price';
  totalPaid: number;
  totalHours: number;
  verifiedHours: number;
  currentStatus: 'working' | 'idle' | 'on_break' | 'offline';
  performanceScore: number;
  completionRate: number;
  hiredDate: string;
  skills: string[];
  lastActivity: string;
  milestones?: {
    total: number;
    completed: number;
    inProgress: number;
  };
}

export default function HiredTalent() {
  const [activeTab, setActiveTab] = useState("active");
  const [searchTerm, setSearchTerm] = useState("");
  const [skillFilter, setSkillFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [contractTypeFilter, setContractTypeFilter] = useState("all");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch hired talent
  const { data: hiredTalent = [], isLoading } = useQuery({
    queryKey: ["/api/client/hired-talent", { 
      search: searchTerm, 
      skill: skillFilter, 
      status: statusFilter,
      contractType: contractTypeFilter
    }],
  });

  // End contract mutation
  const endContractMutation = useMutation({
    mutationFn: async (contractId: string) => {
      return apiRequest("PATCH", `/api/client/contracts/${contractId}/end`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client/hired-talent"] });
      toast({ title: "Contract ended successfully" });
    },
  });

  // Mock data for demonstration
  const mockHiredTalent: HiredTalent[] = [
    {
      id: "1",
      contractId: "contract1",
      freelancerId: "freelancer1",
      employeeId: "EMP-ABC123",
      freelancer: {
        id: "freelancer1",
        firstName: "Sarah",
        lastName: "Johnson",
        profilePhoto: "",
        title: "Senior React Developer",
        hourlyRate: 85,
        rating: 4.9,
        totalReviews: 47,
        location: "San Francisco, CA",
        verificationLevel: "verified",
        responseTime: "1 hour",
        isOnline: true,
        lastActive: "5 minutes ago"
      },
      project: {
        id: "project1",
        title: "React E-commerce Platform",
        category: "Web Development",
        startDate: "2024-01-01",
        budget: 15000,
        status: "active"
      },
      contractType: "hourly",
      totalPaid: 8500,
      totalHours: 100,
      verifiedHours: 95,
      currentStatus: "working",
      performanceScore: 98,
      completionRate: 94,
      hiredDate: "2024-01-01T10:00:00Z",
      skills: ["React", "Node.js", "TypeScript", "AWS"],
      lastActivity: "Working on payment integration",
      milestones: {
        total: 5,
        completed: 3,
        inProgress: 1
      }
    },
    {
      id: "2",
      contractId: "contract2",
      freelancerId: "freelancer2", 
      employeeId: "EMP-DEF456",
      freelancer: {
        id: "freelancer2",
        firstName: "Michael",
        lastName: "Chen",
        profilePhoto: "",
        title: "UI/UX Designer",
        hourlyRate: 65,
        rating: 4.8,
        totalReviews: 32,
        location: "Toronto, ON",
        verificationLevel: "company_verified",
        responseTime: "30 minutes",
        isOnline: false,
        lastActive: "2 hours ago"
      },
      project: {
        id: "project2",
        title: "Mobile App Design",
        category: "Design",
        startDate: "2023-12-15",
        endDate: "2024-01-15",
        budget: 5000,
        status: "completed"
      },
      contractType: "fixed_price",
      totalPaid: 5000,
      totalHours: 77,
      verifiedHours: 77,
      currentStatus: "offline",
      performanceScore: 96,
      completionRate: 100,
      hiredDate: "2023-12-15T14:00:00Z",
      skills: ["UI/UX Design", "Figma", "Prototyping"],
      lastActivity: "Project completed successfully"
    }
  ];

  const getVerificationBadge = (level: string) => {
    switch (level) {
      case 'verified':
        return (
          <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
            <Shield className="w-3 h-3" />
            Verified ⭐⭐⭐
          </Badge>
        );
      case 'company_verified':
        return (
          <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1">
            <Award className="w-3 h-3" />
            Company Verified ⭐⭐
          </Badge>
        );
      case 'basic':
        return (
          <Badge className="bg-gray-100 text-gray-800 flex items-center gap-1">
            <Users className="w-3 h-3" />
            Basic ⭐
          </Badge>
        );
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'working': return 'text-green-600';
      case 'idle': return 'text-yellow-600';
      case 'on_break': return 'text-blue-600';
      case 'offline': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'working': return <PlayCircle className="w-4 h-4" />;
      case 'idle': return <PauseCircle className="w-4 h-4" />;
      case 'on_break': return <Clock className="w-4 h-4" />;
      case 'offline': return <Clock className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getProjectStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredTalent = mockHiredTalent.filter(talent => {
    const matchesSearch = talent.freelancer.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         talent.freelancer.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         talent.project.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTab = activeTab === "all" || 
                      (activeTab === "active" && talent.project.status === "active") ||
                      (activeTab === "completed" && talent.project.status === "completed") ||
                      (activeTab === "paused" && talent.project.status === "paused");
    
    const matchesStatus = statusFilter === "all" || talent.currentStatus === statusFilter;
    const matchesContract = contractTypeFilter === "all" || talent.contractType === contractTypeFilter;
    
    return matchesSearch && matchesTab && matchesStatus && matchesContract;
  });

  const activeTalent = filteredTalent.filter(t => t.project.status === 'active');
  const completedTalent = filteredTalent.filter(t => t.project.status === 'completed');
  const pausedTalent = filteredTalent.filter(t => t.project.status === 'paused');

  const totalSpent = filteredTalent.reduce((sum, t) => sum + t.totalPaid, 0);
  const totalHours = filteredTalent.reduce((sum, t) => sum + t.totalHours, 0);
  const avgPerformance = filteredTalent.length > 0 ? 
    filteredTalent.reduce((sum, t) => sum + t.performanceScore, 0) / filteredTalent.length : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <ClientNavHeader />
      
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900" data-testid="page-title">
              Talent You've Hired
            </h1>
            <p className="text-gray-600 mt-1">
              Manage and track your hired freelancers across all projects
            </p>
          </div>
          <Link href="/client/find-freelancers">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Users className="w-4 h-4 mr-2" />
              Hire More Talent
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Freelancers</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-active-freelancers">{activeTalent.length}</div>
              <p className="text-xs text-gray-600">Currently working</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-total-spent">${totalSpent.toLocaleString()}</div>
              <p className="text-xs text-gray-600">Across all contracts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
              <Clock className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-total-hours">{totalHours}</div>
              <p className="text-xs text-gray-600">Verified work hours</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Performance</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-avg-performance">{avgPerformance.toFixed(0)}%</div>
              <p className="text-xs text-gray-600">Quality score</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filter Hired Talent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search talent..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="search-talent"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger data-testid="filter-status">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="working">Working</SelectItem>
                  <SelectItem value="idle">Idle</SelectItem>
                  <SelectItem value="on_break">On Break</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                </SelectContent>
              </Select>

              <Select value={contractTypeFilter} onValueChange={setContractTypeFilter}>
                <SelectTrigger data-testid="filter-contract-type">
                  <SelectValue placeholder="All contract types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="fixed_price">Fixed Price</SelectItem>
                </SelectContent>
              </Select>

              <Select value={skillFilter} onValueChange={setSkillFilter}>
                <SelectTrigger data-testid="filter-skills">
                  <SelectValue placeholder="All skills" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Skills</SelectItem>
                  <SelectItem value="react">React</SelectItem>
                  <SelectItem value="design">Design</SelectItem>
                  <SelectItem value="nodejs">Node.js</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" className="flex items-center">
                <Filter className="w-4 h-4 mr-2" />
                Advanced
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all" data-testid="tab-all">
              All ({filteredTalent.length})
            </TabsTrigger>
            <TabsTrigger value="active" data-testid="tab-active">
              Active ({activeTalent.length})
            </TabsTrigger>
            <TabsTrigger value="completed" data-testid="tab-completed">
              Completed ({completedTalent.length})
            </TabsTrigger>
            <TabsTrigger value="paused" data-testid="tab-paused">
              Paused ({pausedTalent.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
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
            ) : filteredTalent.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No hired talent found</h3>
                  <p className="text-gray-600 mb-4">Start hiring freelancers to build your team</p>
                  <Link href="/client/find-freelancers">
                    <Button>
                      <Users className="w-4 h-4 mr-2" />
                      Find Freelancers
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              filteredTalent.map((talent) => (
                <Card key={talent.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-6">
                      {/* Profile Section */}
                      <div className="flex-shrink-0 relative">
                        <Avatar className="w-16 h-16">
                          <AvatarImage src={talent.freelancer.profilePhoto} />
                          <AvatarFallback className="text-lg">
                            {talent.freelancer.firstName[0]}{talent.freelancer.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        {talent.freelancer.isOnline && (
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                        )}
                      </div>

                      {/* Main Content */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900" data-testid={`talent-name-${talent.id}`}>
                              {talent.freelancer.firstName} {talent.freelancer.lastName}
                            </h3>
                            <p className="text-gray-700 font-medium">{talent.freelancer.title}</p>
                            <div className="flex items-center gap-3 mt-1">
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4 text-gray-500" />
                                <span className="text-gray-600">{talent.freelancer.location}</span>
                              </div>
                              <span className="text-gray-400">•</span>
                              <span className="text-gray-600">Hired {new Date(talent.hiredDate).toLocaleDateString()}</span>
                              <span className="text-gray-400">•</span>
                              <span className="text-gray-600">ID: {talent.employeeId}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-gray-900">${talent.freelancer.hourlyRate}/hr</div>
                            <div className="flex items-center gap-1 mt-1">
                              <Star className="w-4 h-4 text-yellow-500 fill-current" />
                              <span className="font-medium">{talent.freelancer.rating}</span>
                              <span className="text-gray-600">({talent.freelancer.totalReviews})</span>
                            </div>
                          </div>
                        </div>

                        {/* Project Info */}
                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <Link href={`/client/projects/${talent.project.id}`} className="text-lg font-medium text-blue-600 hover:underline">
                              {talent.project.title}
                            </Link>
                            <Badge className={getProjectStatusColor(talent.project.status)}>
                              {talent.project.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500">Contract Type</p>
                              <p className="font-medium capitalize">{talent.contractType.replace('_', ' ')}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Budget</p>
                              <p className="font-medium">${talent.project.budget.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Total Paid</p>
                              <p className="font-medium">${talent.totalPaid.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Hours Worked</p>
                              <p className="font-medium">{talent.totalHours} hrs</p>
                            </div>
                          </div>
                        </div>

                        {/* Status and Performance */}
                        <div className="flex items-center gap-6 mb-4">
                          <div className="flex items-center gap-4">
                            {getVerificationBadge(talent.freelancer.verificationLevel)}
                            <div className={`flex items-center gap-1 text-sm font-medium ${getStatusColor(talent.currentStatus)}`}>
                              {getStatusIcon(talent.currentStatus)}
                              <span className="capitalize">{talent.currentStatus.replace('_', ' ')}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-6 text-sm">
                            <div>
                              <p className="text-gray-500">Performance</p>
                              <p className="font-medium text-green-600">{talent.performanceScore}%</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Completion Rate</p>
                              <p className="font-medium">{talent.completionRate}%</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Verified Hours</p>
                              <p className="font-medium text-green-600">{talent.verifiedHours}/{talent.totalHours}</p>
                            </div>
                          </div>
                        </div>

                        {/* Skills */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {talent.skills.map((skill, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>

                        {/* Signedwork Verification */}
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                          <div className="flex items-center gap-2 text-green-800 text-sm font-medium">
                            <Shield className="w-4 h-4" />
                            Signedwork Verified Portfolio
                          </div>
                          <p className="text-green-700 text-sm mt-1">
                            {talent.verifiedHours} hours of fraud-proof verified work with multi-level authentication. 
                            {talent.performanceScore}% performance score with real project verification.
                          </p>
                        </div>

                        {/* Last Activity */}
                        <p className="text-sm text-gray-600">
                          <strong>Last Activity:</strong> {talent.lastActivity} • {talent.freelancer.lastActive}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <Button variant="outline" size="sm" data-testid={`button-message-${talent.id}`}>
                          <MessageSquare className="w-4 h-4 mr-1" />
                          Message
                        </Button>
                        <Link href={`/freelancers/${talent.freelancerId}`}>
                          <Button variant="outline" size="sm" className="w-full" data-testid={`button-view-${talent.id}`}>
                            <Eye className="w-4 h-4 mr-1" />
                            View Profile
                          </Button>
                        </Link>
                        <Link href={`/client/contracts/${talent.contractId}`}>
                          <Button variant="outline" size="sm" className="w-full" data-testid={`button-contract-${talent.id}`}>
                            <FileText className="w-4 h-4 mr-1" />
                            Contract
                          </Button>
                        </Link>
                        <Link href={`/client/work/timesheets?freelancer=${talent.freelancerId}`}>
                          <Button variant="outline" size="sm" className="w-full" data-testid={`button-timesheets-${talent.id}`}>
                            <BarChart3 className="w-4 h-4 mr-1" />
                            Timesheets
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
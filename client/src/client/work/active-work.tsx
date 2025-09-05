import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  PlayCircle,
  PauseCircle,
  Search,
  Filter,
  Calendar,
  Clock,
  DollarSign,
  Shield,
  MessageSquare,
  Eye,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  FileText,
  BarChart3,
  Target,
  Zap,
  Award
} from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ClientNavHeader from "@/components/client-nav-header";

interface ActiveWork {
  id: string;
  contractId: string;
  projectId: string;
  freelancerId: string;
  employeeId: string;
  project: {
    id: string;
    title: string;
    description: string;
    category: string;
    startDate: string;
    endDate?: string;
    budget: number;
    status: 'active' | 'completed' | 'paused' | 'cancelled';
    progress: number;
    priority: 'low' | 'medium' | 'high' | 'urgent';
  };
  freelancer: {
    id: string;
    firstName: string;
    lastName: string;
    profilePhoto?: string;
    title: string;
    hourlyRate: number;
    rating: number;
    totalReviews: number;
    verificationLevel: 'verified' | 'company_verified' | 'basic';
    isOnline: boolean;
    currentStatus: 'working' | 'idle' | 'on_break' | 'offline';
    lastActive: string;
  };
  contractType: 'hourly' | 'fixed_price';
  totalSpent: number;
  hoursWorked: number;
  verifiedHours: number;
  estimatedHours?: number;
  currentMilestone?: {
    id: string;
    title: string;
    dueDate: string;
    progress: number;
    amount: number;
  };
  milestones: {
    total: number;
    completed: number;
    inProgress: number;
    upcoming: number;
  };
  recentActivity: {
    date: string;
    description: string;
    hoursLogged: number;
    verified: boolean;
  }[];
  performanceMetrics: {
    qualityScore: number;
    timelyDelivery: number;
    communicationRating: number;
    overallScore: number;
  };
  lastUpdate: string;
  nextDeadline?: string;
  issues: {
    count: number;
    severity: 'low' | 'medium' | 'high';
    lastIssue?: string;
  };
}

export default function ActiveWork() {
  const [activeTab, setActiveTab] = useState("active");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [contractTypeFilter, setContractTypeFilter] = useState("all");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch active work
  const { data: activeWork = [], isLoading } = useQuery({
    queryKey: ["/api/client/work/active", { 
      search: searchTerm, 
      status: statusFilter,
      priority: priorityFilter,
      contractType: contractTypeFilter,
      tab: activeTab
    }],
  });

  // Pause project mutation
  const pauseProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      return apiRequest("PATCH", `/api/client/projects/${projectId}/pause`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client/work/active"] });
      toast({ title: "Project paused successfully" });
    },
  });

  // Mock data for demonstration
  const mockActiveWork: ActiveWork[] = [
    {
      id: "1",
      contractId: "contract1",
      projectId: "project1",
      freelancerId: "freelancer1",
      employeeId: "EMP-ABC123",
      project: {
        id: "project1",
        title: "React E-commerce Platform",
        description: "Building a comprehensive e-commerce solution with React, Node.js, and payment integration",
        category: "Web Development",
        startDate: "2024-01-01",
        endDate: "2024-03-01",
        budget: 15000,
        status: "active",
        progress: 65,
        priority: "high"
      },
      freelancer: {
        id: "freelancer1",
        firstName: "Sarah",
        lastName: "Johnson",
        profilePhoto: "",
        title: "Senior React Developer",
        hourlyRate: 85,
        rating: 4.9,
        totalReviews: 47,
        verificationLevel: "verified",
        isOnline: true,
        currentStatus: "working",
        lastActive: "5 minutes ago"
      },
      contractType: "hourly",
      totalSpent: 8500,
      hoursWorked: 100,
      verifiedHours: 95,
      estimatedHours: 150,
      currentMilestone: {
        id: "milestone1",
        title: "Payment Integration & Testing",
        dueDate: "2024-01-25",
        progress: 80,
        amount: 3000
      },
      milestones: {
        total: 5,
        completed: 3,
        inProgress: 1,
        upcoming: 1
      },
      recentActivity: [
        {
          date: "2024-01-20",
          description: "Implemented Stripe payment gateway and order processing",
          hoursLogged: 6.5,
          verified: true
        },
        {
          date: "2024-01-19",
          description: "Fixed responsive design issues and added cart functionality",
          hoursLogged: 8,
          verified: true
        }
      ],
      performanceMetrics: {
        qualityScore: 98,
        timelyDelivery: 95,
        communicationRating: 97,
        overallScore: 97
      },
      lastUpdate: "2024-01-20T17:30:00Z",
      nextDeadline: "2024-01-25T23:59:59Z",
      issues: {
        count: 0,
        severity: "low"
      }
    },
    {
      id: "2",
      contractId: "contract2",
      projectId: "project2",
      freelancerId: "freelancer2",
      employeeId: "EMP-DEF456",
      project: {
        id: "project2",
        title: "Mobile App UI/UX Design",
        description: "Complete UI/UX design for a fintech mobile application",
        category: "Design",
        startDate: "2023-12-15",
        endDate: "2024-01-30",
        budget: 5000,
        status: "completed",
        progress: 100,
        priority: "medium"
      },
      freelancer: {
        id: "freelancer2",
        firstName: "Michael",
        lastName: "Chen",
        profilePhoto: "",
        title: "Senior UI/UX Designer",
        hourlyRate: 65,
        rating: 4.8,
        totalReviews: 32,
        verificationLevel: "company_verified",
        isOnline: false,
        currentStatus: "offline",
        lastActive: "2 hours ago"
      },
      contractType: "fixed_price",
      totalSpent: 5000,
      hoursWorked: 77,
      verifiedHours: 77,
      milestones: {
        total: 4,
        completed: 4,
        inProgress: 0,
        upcoming: 0
      },
      recentActivity: [
        {
          date: "2024-01-15",
          description: "Final deliverables submitted - design system and prototypes",
          hoursLogged: 4,
          verified: true
        }
      ],
      performanceMetrics: {
        qualityScore: 96,
        timelyDelivery: 100,
        communicationRating: 94,
        overallScore: 97
      },
      lastUpdate: "2024-01-15T16:00:00Z",
      issues: {
        count: 0,
        severity: "low"
      }
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getFreelancerStatusColor = (status: string) => {
    switch (status) {
      case 'working': return 'text-green-600';
      case 'idle': return 'text-yellow-600';
      case 'on_break': return 'text-blue-600';
      case 'offline': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const getFreelancerStatusIcon = (status: string) => {
    switch (status) {
      case 'working': return <PlayCircle className="w-4 h-4" />;
      case 'idle': return <PauseCircle className="w-4 h-4" />;
      case 'on_break': return <Clock className="w-4 h-4" />;
      case 'offline': return <Clock className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const filteredWork = mockActiveWork.filter(work => {
    const matchesSearch = work.project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         `${work.freelancer.firstName} ${work.freelancer.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTab = activeTab === "all" || 
                      (activeTab === "active" && work.project.status === "active") ||
                      (activeTab === "completed" && work.project.status === "completed") ||
                      (activeTab === "paused" && work.project.status === "paused");
    
    const matchesStatus = statusFilter === "all" || work.freelancer.currentStatus === statusFilter;
    const matchesPriority = priorityFilter === "all" || work.project.priority === priorityFilter;
    const matchesContract = contractTypeFilter === "all" || work.contractType === contractTypeFilter;
    
    return matchesSearch && matchesTab && matchesStatus && matchesPriority && matchesContract;
  });

  const activeWork_filtered = filteredWork.filter(w => w.project.status === 'active');
  const completedWork = filteredWork.filter(w => w.project.status === 'completed');
  const pausedWork = filteredWork.filter(w => w.project.status === 'paused');

  const totalBudget = filteredWork.reduce((sum, w) => sum + w.project.budget, 0);
  const totalSpent = filteredWork.reduce((sum, w) => sum + w.totalSpent, 0);
  const totalHours = filteredWork.reduce((sum, w) => sum + w.hoursWorked, 0);
  const avgProgress = filteredWork.length > 0 ? 
    filteredWork.reduce((sum, w) => sum + w.project.progress, 0) / filteredWork.length : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <ClientNavHeader />
      
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900" data-testid="page-title">
              Active & Past Work
            </h1>
            <p className="text-gray-600 mt-1">
              Monitor all your projects and track freelancer performance
            </p>
          </div>
          <Link href="/client/projects/new">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Target className="w-4 h-4 mr-2" />
              Start New Project
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <PlayCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-active-projects">{activeWork_filtered.length}</div>
              <p className="text-xs text-gray-600">Currently in progress</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-total-budget">${totalBudget.toLocaleString()}</div>
              <p className="text-xs text-gray-600">${totalSpent.toLocaleString()} spent</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
              <Clock className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-total-hours">{totalHours}</div>
              <p className="text-xs text-gray-600">Verified work time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Progress</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-avg-progress">{avgProgress.toFixed(0)}%</div>
              <p className="text-xs text-gray-600">Across all projects</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filter Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="search-projects"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger data-testid="filter-status">
                  <SelectValue placeholder="Freelancer status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="working">Working</SelectItem>
                  <SelectItem value="idle">Idle</SelectItem>
                  <SelectItem value="on_break">On Break</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger data-testid="filter-priority">
                  <SelectValue placeholder="All priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select value={contractTypeFilter} onValueChange={setContractTypeFilter}>
                <SelectTrigger data-testid="filter-contract-type">
                  <SelectValue placeholder="Contract type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="fixed_price">Fixed Price</SelectItem>
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
              All ({filteredWork.length})
            </TabsTrigger>
            <TabsTrigger value="active" data-testid="tab-active">
              Active ({activeWork_filtered.length})
            </TabsTrigger>
            <TabsTrigger value="completed" data-testid="tab-completed">
              Completed ({completedWork.length})
            </TabsTrigger>
            <TabsTrigger value="paused" data-testid="tab-paused">
              Paused ({pausedWork.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-6">
            {isLoading ? (
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="space-y-4">
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
            ) : filteredWork.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
                  <p className="text-gray-600 mb-4">Start your first project to see work progress here</p>
                  <Link href="/client/projects/new">
                    <Button>
                      <Target className="w-4 h-4 mr-2" />
                      Start New Project
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              filteredWork.map((work) => (
                <Card key={work.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Link href={`/client/projects/${work.projectId}`}>
                              <h3 className="text-xl font-semibold text-blue-600 hover:underline" data-testid={`project-title-${work.id}`}>
                                {work.project.title}
                              </h3>
                            </Link>
                            <Badge className={getStatusColor(work.project.status)}>
                              {work.project.status}
                            </Badge>
                            <Badge className={getPriorityColor(work.project.priority)}>
                              {work.project.priority} priority
                            </Badge>
                          </div>
                          <p className="text-gray-700 mb-3">{work.project.description}</p>
                          
                          {/* Progress */}
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700">Project Progress</span>
                              <span className="text-sm font-bold text-gray-900">{work.project.progress}%</span>
                            </div>
                            <Progress value={work.project.progress} className="h-2" />
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">${work.project.budget.toLocaleString()}</div>
                          <div className="text-sm text-gray-600">Budget</div>
                          <div className="text-lg font-medium text-green-600 mt-1">${work.totalSpent.toLocaleString()}</div>
                          <div className="text-xs text-gray-500">Spent</div>
                        </div>
                      </div>

                      {/* Freelancer Info */}
                      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={work.freelancer.profilePhoto} />
                          <AvatarFallback>
                            {work.freelancer.firstName[0]}{work.freelancer.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <Link href={`/freelancers/${work.freelancerId}`} className="font-medium text-gray-900 hover:text-blue-600">
                              {work.freelancer.firstName} {work.freelancer.lastName}
                            </Link>
                            <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
                              <Shield className="w-3 h-3" />
                              Verified
                            </Badge>
                            <div className={`flex items-center gap-1 text-sm ${getFreelancerStatusColor(work.freelancer.currentStatus)}`}>
                              {getFreelancerStatusIcon(work.freelancer.currentStatus)}
                              <span className="capitalize">{work.freelancer.currentStatus.replace('_', ' ')}</span>
                            </div>
                            <span className="text-sm text-gray-600">ID: {work.employeeId}</span>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                            <span>{work.freelancer.title}</span>
                            <span>•</span>
                            <span>${work.freelancer.hourlyRate}/hr</span>
                            <span>•</span>
                            <span>Last active: {work.freelancer.lastActive}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900">{work.hoursWorked}h</div>
                          <div className="text-xs text-gray-500">Total Hours</div>
                          <div className="text-sm text-green-600">{work.verifiedHours}h verified</div>
                        </div>
                      </div>

                      {/* Milestones & Performance */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Current Milestone */}
                        {work.currentMilestone && (
                          <div className="space-y-3">
                            <h4 className="font-medium text-gray-900">Current Milestone</h4>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-blue-900">{work.currentMilestone.title}</span>
                                <span className="text-sm text-blue-700">{work.currentMilestone.progress}%</span>
                              </div>
                              <Progress value={work.currentMilestone.progress} className="h-2 mb-2" />
                              <div className="flex items-center justify-between text-sm text-blue-700">
                                <span>Due: {new Date(work.currentMilestone.dueDate).toLocaleDateString()}</span>
                                <span>${work.currentMilestone.amount.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Performance Metrics */}
                        <div className="space-y-3">
                          <h4 className="font-medium text-gray-900">Performance Metrics</h4>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span>Quality Score</span>
                              <span className="font-medium text-green-600">{work.performanceMetrics.qualityScore}%</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span>Timely Delivery</span>
                              <span className="font-medium text-green-600">{work.performanceMetrics.timelyDelivery}%</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span>Communication</span>
                              <span className="font-medium text-green-600">{work.performanceMetrics.communicationRating}%</span>
                            </div>
                            <div className="flex items-center justify-between text-sm font-medium border-t pt-2">
                              <span>Overall Score</span>
                              <span className="text-green-600 flex items-center gap-1">
                                <Award className="w-4 h-4" />
                                {work.performanceMetrics.overallScore}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Recent Activity */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900">Recent Activity</h4>
                        <div className="space-y-2">
                          {work.recentActivity.slice(0, 2).map((activity, index) => (
                            <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                              <div className="flex-shrink-0 mt-1">
                                {activity.verified ? (
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                ) : (
                                  <Clock className="w-4 h-4 text-yellow-600" />
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm text-gray-700">{activity.description}</p>
                                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                  <span>{new Date(activity.date).toLocaleDateString()}</span>
                                  <span>•</span>
                                  <span>{activity.hoursLogged}h logged</span>
                                  {activity.verified && (
                                    <>
                                      <span>•</span>
                                      <span className="text-green-600">Verified</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Signedwork Verification */}
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-green-800 font-medium mb-2">
                          <Shield className="w-5 h-5" />
                          Signedwork Verification System
                        </div>
                        <p className="text-green-700 text-sm">
                          {work.verifiedHours}/{work.hoursWorked} hours verified through multi-level authentication. 
                          All work entries are fraud-proof with hierarchical approval chains ensuring authentic progress tracking.
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" data-testid={`button-message-${work.id}`}>
                            <MessageSquare className="w-4 h-4 mr-1" />
                            Message
                          </Button>
                          <Link href={`/client/contracts/${work.contractId}`}>
                            <Button variant="outline" size="sm" data-testid={`button-contract-${work.id}`}>
                              <FileText className="w-4 h-4 mr-1" />
                              Contract
                            </Button>
                          </Link>
                          <Link href={`/client/work/timesheets?project=${work.projectId}`}>
                            <Button variant="outline" size="sm" data-testid={`button-timesheets-${work.id}`}>
                              <BarChart3 className="w-4 h-4 mr-1" />
                              Timesheets
                            </Button>
                          </Link>
                        </div>

                        <div className="text-sm text-gray-500">
                          Last updated: {new Date(work.lastUpdate).toLocaleDateString()}
                        </div>
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
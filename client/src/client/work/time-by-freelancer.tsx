import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  Clock,
  Search,
  Filter,
  Calendar as CalendarIcon,
  Download,
  TrendingUp,
  TrendingDown,
  Shield,
  Award,
  BarChart3,
  PieChart,
  Users,
  DollarSign,
  Target,
  CheckCircle,
  AlertTriangle,
  Eye,
  MessageSquare
} from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ClientNavHeader from "@/components/client-nav-header";

interface FreelancerTimeData {
  id: string;
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
    verificationLevel: 'verified' | 'company_verified' | 'basic';
    isOnline: boolean;
    lastActive: string;
  };
  projects: {
    id: string;
    title: string;
    status: 'active' | 'completed' | 'paused';
    totalHours: number;
    verifiedHours: number;
    billableAmount: number;
    startDate: string;
    endDate?: string;
    progress: number;
  }[];
  timeStats: {
    totalHours: number;
    verifiedHours: number;
    thisWeekHours: number;
    thisMonthHours: number;
    averageHoursPerDay: number;
    productivityScore: number;
    totalBillableAmount: number;
    pendingApproval: number;
  };
  performance: {
    qualityScore: number;
    timelyDelivery: number;
    communicationRating: number;
    clientSatisfaction: number;
    overallRating: number;
  };
  recentActivity: {
    date: string;
    project: string;
    hours: number;
    description: string;
    verified: boolean;
  }[];
  weeklyBreakdown: {
    monday: number;
    tuesday: number;
    wednesday: number;
    thursday: number;
    friday: number;
    saturday: number;
    sunday: number;
  };
  contract: {
    startDate: string;
    type: 'hourly' | 'fixed_price';
    totalEarnings: number;
    activeProjects: number;
  };
}

export default function TimeByFreelancer() {
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState("month");
  const [projectFilter, setProjectFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch freelancer time data
  const { data: freelancerTimeData = [], isLoading } = useQuery({
    queryKey: ["/api/client/work/time-by-freelancer", { 
      search: searchTerm, 
      project: projectFilter,
      status: statusFilter,
      dateRange: dateRange,
      date: selectedDate
    }],
  });

  // Mock data for demonstration
  const mockFreelancerTimeData: FreelancerTimeData[] = [
    {
      id: "1",
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
        verificationLevel: "verified",
        isOnline: true,
        lastActive: "5 minutes ago"
      },
      projects: [
        {
          id: "project1",
          title: "React E-commerce Platform",
          status: "active",
          totalHours: 120,
          verifiedHours: 115,
          billableAmount: 10200,
          startDate: "2024-01-01",
          progress: 75
        },
        {
          id: "project2",
          title: "Admin Dashboard",
          status: "completed",
          totalHours: 45,
          verifiedHours: 45,
          billableAmount: 3825,
          startDate: "2023-12-01",
          endDate: "2023-12-28",
          progress: 100
        }
      ],
      timeStats: {
        totalHours: 165,
        verifiedHours: 160,
        thisWeekHours: 32,
        thisMonthHours: 128,
        averageHoursPerDay: 6.4,
        productivityScore: 94,
        totalBillableAmount: 14025,
        pendingApproval: 5
      },
      performance: {
        qualityScore: 98,
        timelyDelivery: 96,
        communicationRating: 97,
        clientSatisfaction: 95,
        overallRating: 96
      },
      recentActivity: [
        {
          date: "2024-01-20",
          project: "React E-commerce Platform",
          hours: 8,
          description: "Implemented payment gateway integration",
          verified: true
        },
        {
          date: "2024-01-19",
          project: "React E-commerce Platform",
          hours: 7.5,
          description: "Fixed responsive design issues",
          verified: true
        }
      ],
      weeklyBreakdown: {
        monday: 8,
        tuesday: 7.5,
        wednesday: 6,
        thursday: 8.5,
        friday: 2,
        saturday: 0,
        sunday: 0
      },
      contract: {
        startDate: "2024-01-01",
        type: "hourly",
        totalEarnings: 14025,
        activeProjects: 1
      }
    },
    {
      id: "2",
      freelancerId: "freelancer2",
      employeeId: "EMP-DEF456",
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
        lastActive: "2 hours ago"
      },
      projects: [
        {
          id: "project3",
          title: "Mobile App Design",
          status: "completed",
          totalHours: 77,
          verifiedHours: 77,
          billableAmount: 5005,
          startDate: "2023-12-15",
          endDate: "2024-01-15",
          progress: 100
        }
      ],
      timeStats: {
        totalHours: 77,
        verifiedHours: 77,
        thisWeekHours: 0,
        thisMonthHours: 40,
        averageHoursPerDay: 5.5,
        productivityScore: 96,
        totalBillableAmount: 5005,
        pendingApproval: 0
      },
      performance: {
        qualityScore: 96,
        timelyDelivery: 100,
        communicationRating: 94,
        clientSatisfaction: 98,
        overallRating: 97
      },
      recentActivity: [
        {
          date: "2024-01-15",
          project: "Mobile App Design",
          hours: 4,
          description: "Final deliverables and design system",
          verified: true
        }
      ],
      weeklyBreakdown: {
        monday: 0,
        tuesday: 0,
        wednesday: 0,
        thursday: 0,
        friday: 0,
        saturday: 0,
        sunday: 0
      },
      contract: {
        startDate: "2023-12-15",
        type: "fixed_price",
        totalEarnings: 5005,
        activeProjects: 0
      }
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
      default:
        return null;
    }
  };

  const getProjectStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (current < previous) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <BarChart3 className="w-4 h-4 text-gray-600" />;
  };

  const filteredData = mockFreelancerTimeData.filter(data => {
    const matchesSearch = data.freelancer.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         data.freelancer.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         data.freelancer.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProject = projectFilter === "all" || data.projects.some(p => p.id === projectFilter);
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && data.contract.activeProjects > 0) ||
                         (statusFilter === "completed" && data.contract.activeProjects === 0);
    
    return matchesSearch && matchesProject && matchesStatus;
  });

  const totalHours = filteredData.reduce((sum, d) => sum + d.timeStats.totalHours, 0);
  const totalAmount = filteredData.reduce((sum, d) => sum + d.timeStats.totalBillableAmount, 0);
  const avgProductivity = filteredData.length > 0 ? 
    filteredData.reduce((sum, d) => sum + d.timeStats.productivityScore, 0) / filteredData.length : 0;
  const activeFreelancers = filteredData.filter(d => d.contract.activeProjects > 0).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <ClientNavHeader />
      
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900" data-testid="page-title">
              Time by Freelancer
            </h1>
            <p className="text-gray-600 mt-1">
              Detailed time tracking and performance analytics for each freelancer
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export Report
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  {dateRange === "week" ? "This Week" : "This Month"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Freelancers</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-active-freelancers">{activeFreelancers}</div>
              <p className="text-xs text-gray-600">Currently working</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
              <Clock className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-total-hours">{totalHours}</div>
              <p className="text-xs text-gray-600">Tracked time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-total-earned">${totalAmount.toLocaleString()}</div>
              <p className="text-xs text-gray-600">All freelancers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Productivity</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getPerformanceColor(avgProductivity)}`} data-testid="stat-avg-productivity">
                {avgProductivity.toFixed(0)}%
              </div>
              <p className="text-xs text-gray-600">Team average</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filter Freelancers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search freelancers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="search-freelancers"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger data-testid="filter-status">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger data-testid="filter-project">
                  <SelectValue placeholder="All projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  <SelectItem value="project1">React E-commerce Platform</SelectItem>
                  <SelectItem value="project2">Admin Dashboard</SelectItem>
                  <SelectItem value="project3">Mobile App Design</SelectItem>
                </SelectContent>
              </Select>

              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger data-testid="filter-date-range">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" className="flex items-center">
                <Filter className="w-4 h-4 mr-2" />
                Advanced
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Freelancer Time Data */}
        <div className="space-y-6">
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
          ) : filteredData.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No freelancer data found</h3>
                <p className="text-gray-600">Time tracking data will appear here once freelancers start working</p>
              </CardContent>
            </Card>
          ) : (
            filteredData.map((data) => (
              <Card key={data.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <Tabs defaultValue="overview" className="space-y-6">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-16 h-16">
                          <AvatarImage src={data.freelancer.profilePhoto} />
                          <AvatarFallback className="text-lg">
                            {data.freelancer.firstName[0]}{data.freelancer.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-semibold text-gray-900" data-testid={`freelancer-name-${data.id}`}>
                              {data.freelancer.firstName} {data.freelancer.lastName}
                            </h3>
                            {getVerificationBadge(data.freelancer.verificationLevel)}
                            {data.freelancer.isOnline && (
                              <Badge className="bg-green-100 text-green-800">
                                <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                                Online
                              </Badge>
                            )}
                          </div>
                          <p className="text-gray-700 font-medium">{data.freelancer.title}</p>
                          <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                            <span>${data.freelancer.hourlyRate}/hr</span>
                            <span>•</span>
                            <span>ID: {data.employeeId}</span>
                            <span>•</span>
                            <span>Last active: {data.freelancer.lastActive}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">${data.timeStats.totalBillableAmount.toLocaleString()}</div>
                        <div className="text-sm text-gray-600">Total Earned</div>
                        <div className="text-lg font-medium text-blue-600 mt-1">{data.timeStats.totalHours}h</div>
                        <div className="text-xs text-gray-500">Total Hours</div>
                      </div>
                    </div>

                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="projects">Projects</TabsTrigger>
                      <TabsTrigger value="performance">Performance</TabsTrigger>
                      <TabsTrigger value="activity">Activity</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                      {/* Time Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{data.timeStats.thisWeekHours}</div>
                          <div className="text-sm text-blue-800">This Week</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">{data.timeStats.thisMonthHours}</div>
                          <div className="text-sm text-green-800">This Month</div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">{data.timeStats.averageHoursPerDay.toFixed(1)}</div>
                          <div className="text-sm text-purple-800">Avg Daily</div>
                        </div>
                        <div className="text-center p-4 bg-orange-50 rounded-lg">
                          <div className={`text-2xl font-bold ${getPerformanceColor(data.timeStats.productivityScore)}`}>
                            {data.timeStats.productivityScore}%
                          </div>
                          <div className="text-sm text-orange-800">Productivity</div>
                        </div>
                      </div>

                      {/* Weekly Breakdown Chart */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">Weekly Time Breakdown</h4>
                        <div className="space-y-2">
                          {Object.entries(data.weeklyBreakdown).map(([day, hours]) => (
                            <div key={day} className="flex items-center gap-4">
                              <div className="w-20 text-sm font-medium text-gray-700 capitalize">{day}</div>
                              <div className="flex-1">
                                <Progress value={(hours / 10) * 100} className="h-3" />
                              </div>
                              <div className="w-12 text-sm font-medium text-gray-900">{hours}h</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Signedwork Verification */}
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-green-800 font-medium mb-2">
                          <Shield className="w-5 h-5" />
                          Signedwork Time Verification
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-green-700">Verified Hours: </span>
                            <span className="font-medium text-green-800">{data.timeStats.verifiedHours}/{data.timeStats.totalHours}</span>
                          </div>
                          <div>
                            <span className="text-green-700">Verification Rate: </span>
                            <span className="font-medium text-green-800">
                              {((data.timeStats.verifiedHours / data.timeStats.totalHours) * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <p className="text-green-700 text-sm mt-2">
                          All time entries are verified through hierarchical approval chains with fraud-proof authentication.
                        </p>
                      </div>
                    </TabsContent>

                    <TabsContent value="projects" className="space-y-4">
                      {data.projects.map((project) => (
                        <div key={project.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <Link href={`/client/projects/${project.id}`} className="text-lg font-medium text-blue-600 hover:underline">
                                  {project.title}
                                </Link>
                                <Badge className={getProjectStatusColor(project.status)}>
                                  {project.status}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-500">Total Hours</span>
                                  <div className="font-medium">{project.totalHours}h</div>
                                </div>
                                <div>
                                  <span className="text-gray-500">Verified Hours</span>
                                  <div className="font-medium text-green-600">{project.verifiedHours}h</div>
                                </div>
                                <div>
                                  <span className="text-gray-500">Earned</span>
                                  <div className="font-medium">${project.billableAmount.toLocaleString()}</div>
                                </div>
                                <div>
                                  <span className="text-gray-500">Progress</span>
                                  <div className="font-medium">{project.progress}%</div>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Project Progress</span>
                              <span className="font-medium">{project.progress}%</span>
                            </div>
                            <Progress value={project.progress} className="h-2" />
                          </div>
                        </div>
                      ))}
                    </TabsContent>

                    <TabsContent value="performance" className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <h4 className="font-medium text-gray-900">Performance Metrics</h4>
                          {Object.entries(data.performance).map(([metric, score]) => (
                            <div key={metric} className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="capitalize">{metric.replace(/([A-Z])/g, ' $1')}</span>
                                <span className={`font-medium ${getPerformanceColor(score)}`}>{score}%</span>
                              </div>
                              <Progress value={score} className="h-2" />
                            </div>
                          ))}
                        </div>

                        <div className="space-y-4">
                          <h4 className="font-medium text-gray-900">Performance Summary</h4>
                          <div className="text-center p-6 bg-gray-50 rounded-lg">
                            <div className={`text-4xl font-bold ${getPerformanceColor(data.performance.overallRating)} mb-2`}>
                              {data.performance.overallRating}%
                            </div>
                            <div className="text-gray-600">Overall Rating</div>
                            <div className="flex items-center justify-center gap-1 mt-2">
                              {[...Array(5)].map((_, i) => (
                                <div
                                  key={i}
                                  className={`w-2 h-2 rounded-full ${
                                    i < Math.floor(data.performance.overallRating / 20) ? 'bg-yellow-400' : 'bg-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="activity" className="space-y-4">
                      <h4 className="font-medium text-gray-900">Recent Activity</h4>
                      {data.recentActivity.map((activity, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex-shrink-0 mt-1">
                            {activity.verified ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-yellow-600" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-700">{activity.description}</p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                              <span>{new Date(activity.date).toLocaleDateString()}</span>
                              <span>•</span>
                              <span>{activity.project}</span>
                              <span>•</span>
                              <span>{activity.hours}h logged</span>
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
                    </TabsContent>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" data-testid={`button-message-${data.id}`}>
                          <MessageSquare className="w-4 h-4 mr-1" />
                          Message
                        </Button>
                        <Link href={`/freelancers/${data.freelancerId}`}>
                          <Button variant="outline" size="sm" data-testid={`button-view-${data.id}`}>
                            <Eye className="w-4 h-4 mr-1" />
                            View Profile
                          </Button>
                        </Link>
                        <Link href={`/client/work/timesheets?freelancer=${data.freelancerId}`}>
                          <Button variant="outline" size="sm" data-testid={`button-timesheets-${data.id}`}>
                            <BarChart3 className="w-4 h-4 mr-1" />
                            View Timesheets
                          </Button>
                        </Link>
                      </div>

                      <div className="text-sm text-gray-500">
                        Contract started: {new Date(data.contract.startDate).toLocaleDateString()}
                      </div>
                    </div>
                  </Tabs>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
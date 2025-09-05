import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
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
  Play,
  Pause,
  Monitor,
  MousePointer,
  Keyboard,
  Shield,
  CheckCircle,
  AlertCircle,
  Eye,
  MessageSquare,
  TrendingUp,
  Activity,
  BarChart3
} from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ClientNavHeader from "@/components/client-nav-header";

interface HourlyActivity {
  id: string;
  contractId: string;
  freelancerId: string;
  employeeId: string;
  freelancer: {
    id: string;
    firstName: string;
    lastName: string;
    profilePhoto?: string;
    hourlyRate: number;
    verificationLevel: 'verified' | 'company_verified' | 'basic';
  };
  project: {
    id: string;
    title: string;
    category: string;
  };
  date: string;
  timeEntries: {
    id: string;
    startTime: string;
    endTime: string;
    duration: number;
    description: string;
    status: 'working' | 'break' | 'idle';
    screenshots: number;
    keystrokes: number;
    mouseClicks: number;
    activeTime: number;
    idleTime: number;
    isVerified: boolean;
    verificationChain?: {
      teamLead?: { name: string; verifiedAt: string; };
      branchManager?: { name: string; verifiedAt: string; };
    };
  }[];
  dailyStats: {
    totalHours: number;
    activeHours: number;
    idleHours: number;
    breakHours: number;
    productivityScore: number;
    screenshotsTaken: number;
    totalKeystrokes: number;
    totalClicks: number;
    verifiedHours: number;
  };
  billableAmount: number;
  approved: boolean;
  approvedBy?: string;
  approvedAt?: string;
}

export default function HourlyActivity() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("week");
  const [freelancerFilter, setFreelancerFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch hourly activity data
  const { data: activityData = [], isLoading } = useQuery({
    queryKey: ["/api/client/work/hourly-activity", { 
      search: searchTerm, 
      freelancer: freelancerFilter, 
      project: projectFilter,
      status: statusFilter,
      dateRange: dateFilter,
      date: selectedDate
    }],
  });

  // Approve activity mutation
  const approveActivityMutation = useMutation({
    mutationFn: async (activityId: string) => {
      return apiRequest("PATCH", `/api/client/work/hourly-activity/${activityId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client/work/hourly-activity"] });
      toast({ title: "Activity approved successfully" });
    },
  });

  // Mock data for demonstration
  const mockActivityData: HourlyActivity[] = [
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
        hourlyRate: 85,
        verificationLevel: "verified"
      },
      project: {
        id: "project1",
        title: "React E-commerce Platform",
        category: "Web Development"
      },
      date: "2024-01-15",
      timeEntries: [
        {
          id: "entry1",
          startTime: "09:00",
          endTime: "10:30",
          duration: 90,
          description: "Implemented user authentication flow",
          status: "working",
          screenshots: 9,
          keystrokes: 2450,
          mouseClicks: 340,
          activeTime: 85,
          idleTime: 5,
          isVerified: true,
          verificationChain: {
            teamLead: { name: "John Smith", verifiedAt: "2024-01-15T10:35:00Z" }
          }
        },
        {
          id: "entry2",
          startTime: "10:45",
          endTime: "12:15",
          duration: 90,
          description: "Fixed payment integration bugs",
          status: "working",
          screenshots: 9,
          keystrokes: 1890,
          mouseClicks: 280,
          activeTime: 82,
          idleTime: 8,
          isVerified: true
        },
        {
          id: "entry3",
          startTime: "13:15",
          endTime: "17:00",
          duration: 225,
          description: "Added cart functionality and responsive design",
          status: "working",
          screenshots: 22,
          keystrokes: 4200,
          mouseClicks: 520,
          activeTime: 210,
          idleTime: 15,
          isVerified: true
        }
      ],
      dailyStats: {
        totalHours: 6.75,
        activeHours: 6.12,
        idleHours: 0.47,
        breakHours: 0.16,
        productivityScore: 91,
        screenshotsTaken: 40,
        totalKeystrokes: 8540,
        totalClicks: 1140,
        verifiedHours: 6.75
      },
      billableAmount: 573.75,
      approved: true,
      approvedBy: "Client Admin",
      approvedAt: "2024-01-15T18:00:00Z"
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
        hourlyRate: 65,
        verificationLevel: "company_verified"
      },
      project: {
        id: "project2",
        title: "Mobile App Design",
        category: "Design"
      },
      date: "2024-01-14",
      timeEntries: [
        {
          id: "entry4",
          startTime: "10:00",
          endTime: "12:00",
          duration: 120,
          description: "Created wireframes for main app screens",
          status: "working",
          screenshots: 12,
          keystrokes: 1200,
          mouseClicks: 890,
          activeTime: 115,
          idleTime: 5,
          isVerified: true
        },
        {
          id: "entry5",
          startTime: "14:00",
          endTime: "16:30",
          duration: 150,
          description: "Designed user flow and navigation",
          status: "working",
          screenshots: 15,
          keystrokes: 980,
          mouseClicks: 1240,
          activeTime: 142,
          idleTime: 8,
          isVerified: true
        }
      ],
      dailyStats: {
        totalHours: 4.5,
        activeHours: 4.28,
        idleHours: 0.22,
        breakHours: 0,
        productivityScore: 95,
        screenshotsTaken: 27,
        totalKeystrokes: 2180,
        totalClicks: 2130,
        verifiedHours: 4.5
      },
      billableAmount: 292.50,
      approved: false
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
            <CheckCircle className="w-3 h-3" />
            Company Verified ⭐⭐
          </Badge>
        );
      default:
        return null;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'working': return <Play className="w-4 h-4 text-green-600" />;
      case 'break': return <Pause className="w-4 h-4 text-blue-600" />;
      case 'idle': return <Clock className="w-4 h-4 text-yellow-600" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getProductivityColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const filteredData = mockActivityData.filter(activity => {
    const matchesSearch = activity.freelancer.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.freelancer.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.project.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFreelancer = freelancerFilter === "all" || activity.freelancerId === freelancerFilter;
    const matchesProject = projectFilter === "all" || activity.project.id === projectFilter;
    const matchesStatus = statusFilter === "all" || (statusFilter === "approved" && activity.approved) || (statusFilter === "pending" && !activity.approved);
    
    return matchesSearch && matchesFreelancer && matchesProject && matchesStatus;
  });

  const totalHours = filteredData.reduce((sum, a) => sum + a.dailyStats.totalHours, 0);
  const totalAmount = filteredData.reduce((sum, a) => sum + a.billableAmount, 0);
  const avgProductivity = filteredData.length > 0 ? 
    filteredData.reduce((sum, a) => sum + a.dailyStats.productivityScore, 0) / filteredData.length : 0;
  const pendingApproval = filteredData.filter(a => !a.approved).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <ClientNavHeader />
      
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900" data-testid="page-title">
              Hourly Contract Activity
            </h1>
            <p className="text-gray-600 mt-1">
              Monitor detailed hourly work patterns and productivity metrics
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
                  Select Date
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-total-hours">{totalHours.toFixed(1)}</div>
              <p className="text-xs text-gray-600">Tracked time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
              <Activity className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-total-amount">${totalAmount.toLocaleString()}</div>
              <p className="text-xs text-gray-600">Billable amount</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Productivity</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getProductivityColor(avgProductivity)}`} data-testid="stat-avg-productivity">
                {avgProductivity.toFixed(0)}%
              </div>
              <p className="text-xs text-gray-600">Efficiency score</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-pending-approval">{pendingApproval}</div>
              <p className="text-xs text-gray-600">Awaiting review</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filter Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search activity..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="search-activity"
                />
              </div>
              
              <Select value={freelancerFilter} onValueChange={setFreelancerFilter}>
                <SelectTrigger data-testid="filter-freelancer">
                  <SelectValue placeholder="All freelancers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Freelancers</SelectItem>
                  <SelectItem value="freelancer1">Sarah Johnson</SelectItem>
                  <SelectItem value="freelancer2">Michael Chen</SelectItem>
                </SelectContent>
              </Select>

              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger data-testid="filter-project">
                  <SelectValue placeholder="All projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  <SelectItem value="project1">React E-commerce Platform</SelectItem>
                  <SelectItem value="project2">Mobile App Design</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger data-testid="filter-status">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending Approval</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" className="flex items-center">
                <Filter className="w-4 h-4 mr-2" />
                Advanced
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Activity List */}
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
                <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hourly activity found</h3>
                <p className="text-gray-600">Activity data will appear here once freelancers start logging time</p>
              </CardContent>
            </Card>
          ) : (
            filteredData.map((activity) => (
              <Card key={activity.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={activity.freelancer.profilePhoto} />
                          <AvatarFallback>
                            {activity.freelancer.firstName[0]}{activity.freelancer.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-lg font-semibold text-gray-900" data-testid={`freelancer-name-${activity.id}`}>
                              {activity.freelancer.firstName} {activity.freelancer.lastName}
                            </h3>
                            {getVerificationBadge(activity.freelancer.verificationLevel)}
                            {activity.approved ? (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Approved
                              </Badge>
                            ) : (
                              <Badge className="bg-yellow-100 text-yellow-800">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                          </div>
                          <p className="text-gray-600">
                            <Link href={`/client/projects/${activity.project.id}`} className="text-blue-600 hover:underline">
                              {activity.project.title}
                            </Link> • {new Date(activity.date).toLocaleDateString()} • ID: {activity.employeeId}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">${activity.billableAmount.toLocaleString()}</div>
                        <div className="text-sm text-gray-600">{activity.dailyStats.totalHours}h @ ${activity.freelancer.hourlyRate}/hr</div>
                      </div>
                    </div>

                    {/* Daily Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-4 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{activity.dailyStats.productivityScore}%</div>
                        <div className="text-sm text-gray-600">Productivity</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{activity.dailyStats.activeHours.toFixed(1)}h</div>
                        <div className="text-sm text-gray-600">Active Time</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{activity.dailyStats.screenshotsTaken}</div>
                        <div className="text-sm text-gray-600">Screenshots</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">{activity.dailyStats.verifiedHours.toFixed(1)}h</div>
                        <div className="text-sm text-gray-600">Verified</div>
                      </div>
                    </div>

                    {/* Time Entries */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900">Time Entries</h4>
                      {activity.timeEntries.map((entry) => (
                        <div key={entry.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="font-medium text-gray-900">
                                  {entry.startTime} - {entry.endTime}
                                </span>
                                <span className="text-gray-600">({(entry.duration / 60).toFixed(1)}h)</span>
                                {getStatusIcon(entry.status)}
                                {entry.isVerified && (
                                  <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
                                    <Shield className="w-3 h-3" />
                                    Verified
                                  </Badge>
                                )}
                              </div>
                              <p className="text-gray-700 mb-3">{entry.description}</p>
                              
                              {/* Activity Metrics */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                  <Monitor className="w-4 h-4 text-blue-600" />
                                  <span>{entry.screenshots} screenshots</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Keyboard className="w-4 h-4 text-green-600" />
                                  <span>{entry.keystrokes.toLocaleString()} keystrokes</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <MousePointer className="w-4 h-4 text-purple-600" />
                                  <span>{entry.mouseClicks} clicks</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Activity className="w-4 h-4 text-orange-600" />
                                  <span>{entry.activeTime}min active</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Verification Chain */}
                          {entry.verificationChain && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
                              <h5 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                                <Shield className="w-4 h-4" />
                                Signedwork Verification Chain
                              </h5>
                              <div className="space-y-1 text-sm">
                                {entry.verificationChain.teamLead && (
                                  <div className="flex items-center gap-2 text-green-700">
                                    <CheckCircle className="w-3 h-3" />
                                    <span>Verified by Team Lead: {entry.verificationChain.teamLead.name}</span>
                                    <span className="text-xs">at {new Date(entry.verificationChain.teamLead.verifiedAt).toLocaleTimeString()}</span>
                                  </div>
                                )}
                                {entry.verificationChain.branchManager && (
                                  <div className="flex items-center gap-2 text-green-700">
                                    <CheckCircle className="w-3 h-3" />
                                    <span>Approved by Branch Manager: {entry.verificationChain.branchManager.name}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Signedwork Advantage */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-green-800 font-medium mb-2">
                        <Shield className="w-5 h-5" />
                        Signedwork Activity Monitoring
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-green-700">
                        <div>
                          <strong>Total Keystrokes:</strong> {activity.dailyStats.totalKeystrokes.toLocaleString()}
                        </div>
                        <div>
                          <strong>Mouse Clicks:</strong> {activity.dailyStats.totalClicks.toLocaleString()}
                        </div>
                        <div>
                          <strong>Screenshots:</strong> {activity.dailyStats.screenshotsTaken} captured
                        </div>
                        <div>
                          <strong>Verification:</strong> 100% authenticated work
                        </div>
                      </div>
                      <p className="text-green-700 text-sm mt-2">
                        All activity is tracked with fraud-proof verification through hierarchical approval chains. 
                        Screenshots, keystroke patterns, and mouse activity ensure authentic work verification.
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" data-testid={`button-message-${activity.id}`}>
                          <MessageSquare className="w-4 h-4 mr-1" />
                          Message
                        </Button>
                        <Link href={`/freelancers/${activity.freelancerId}`}>
                          <Button variant="outline" size="sm" data-testid={`button-view-${activity.id}`}>
                            <Eye className="w-4 h-4 mr-1" />
                            View Profile
                          </Button>
                        </Link>
                        <Link href={`/client/work/timesheets?freelancer=${activity.freelancerId}&date=${activity.date}`}>
                          <Button variant="outline" size="sm" data-testid={`button-timesheets-${activity.id}`}>
                            <BarChart3 className="w-4 h-4 mr-1" />
                            Full Timesheet
                          </Button>
                        </Link>
                      </div>

                      {!activity.approved && (
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => approveActivityMutation.mutate(activity.id)}
                          data-testid={`button-approve-${activity.id}`}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve Activity
                        </Button>
                      )}
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
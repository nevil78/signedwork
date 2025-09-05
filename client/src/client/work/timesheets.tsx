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
import { Calendar } from "@/components/ui/calendar";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Clock,
  Search,
  Filter,
  Calendar as CalendarIcon,
  Download,
  CheckCircle,
  X,
  AlertTriangle,
  Eye,
  Shield,
  Play,
  Pause,
  FileText,
  TrendingUp,
  Users,
  DollarSign
} from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ClientNavHeader from "@/components/client-nav-header";

interface TimesheetEntry {
  id: string;
  contractId: string;
  contractTitle: string;
  freelancerId: string;
  freelancer: {
    id: string;
    firstName: string;
    lastName: string;
    profilePhoto?: string;
    hourlyRate: number;
  };
  date: string;
  startTime: string;
  endTime: string;
  hoursWorked: number;
  description: string;
  status: 'pending' | 'approved' | 'rejected' | 'under_review';
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  screenshots: string[];
  isVerified: boolean;
  verificationChain?: {
    teamLead?: { name: string; approvedAt: string; };
    branchManager?: { name: string; approvedAt: string; };
    companyAdmin?: { name: string; approvedAt: string; };
  };
  billableAmount: number;
  notes?: string;
}

export default function Timesheets() {
  const [activeTab, setActiveTab] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState("week");
  const [freelancerFilter, setFreelancerFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch timesheet entries
  const { data: timesheets = [], isLoading } = useQuery({
    queryKey: ["/api/client/timesheets", { 
      search: searchTerm, 
      freelancer: freelancerFilter, 
      dateRange,
      status: activeTab 
    }],
  });

  // Approve timesheet mutation
  const approveTimesheetMutation = useMutation({
    mutationFn: async (timesheetId: string) => {
      return apiRequest("PATCH", `/api/client/timesheets/${timesheetId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client/timesheets"] });
      toast({ title: "Timesheet approved successfully" });
    },
  });

  // Reject timesheet mutation  
  const rejectTimesheetMutation = useMutation({
    mutationFn: async ({ timesheetId, reason }: { timesheetId: string; reason: string }) => {
      return apiRequest("PATCH", `/api/client/timesheets/${timesheetId}/reject`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client/timesheets"] });
      toast({ title: "Timesheet rejected" });
    },
  });

  // Mock data for demonstration
  const mockTimesheets: TimesheetEntry[] = [
    {
      id: "1",
      contractId: "contract1",
      contractTitle: "React E-commerce Platform",
      freelancerId: "freelancer1",
      freelancer: {
        id: "freelancer1",
        firstName: "Sarah",
        lastName: "Johnson",
        profilePhoto: "",
        hourlyRate: 85
      },
      date: "2024-01-15",
      startTime: "09:00",
      endTime: "17:00",
      hoursWorked: 7.5,
      description: "Implemented user authentication flow, payment integration, and cart functionality. Fixed responsive design issues on mobile devices.",
      status: "pending",
      submittedAt: "2024-01-15T17:30:00Z",
      screenshots: ["screenshot1.jpg", "screenshot2.jpg"],
      isVerified: true,
      verificationChain: {
        teamLead: { name: "John Smith", approvedAt: "2024-01-15T18:00:00Z" }
      },
      billableAmount: 637.50,
      notes: "Completed all planned tasks for the day"
    },
    {
      id: "2",
      contractId: "contract2", 
      contractTitle: "Mobile App Design",
      freelancerId: "freelancer2",
      freelancer: {
        id: "freelancer2",
        firstName: "Michael",
        lastName: "Chen",
        profilePhoto: "",
        hourlyRate: 65
      },
      date: "2024-01-14",
      startTime: "10:00",
      endTime: "16:00",
      hoursWorked: 5.5,
      description: "Created wireframes and mockups for the mobile app dashboard. Worked on user flow and navigation structure.",
      status: "approved",
      submittedAt: "2024-01-14T16:30:00Z",
      reviewedAt: "2024-01-14T18:00:00Z",
      reviewedBy: "Client Admin",
      screenshots: ["design1.jpg"],
      isVerified: true,
      billableAmount: 357.50
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'under_review': return 'bg-blue-100 text-blue-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'under_review': return <Eye className="w-4 h-4" />;
      case 'rejected': return <X className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const filteredTimesheets = mockTimesheets.filter(timesheet => {
    const matchesSearch = timesheet.contractTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         `${timesheet.freelancer.firstName} ${timesheet.freelancer.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFreelancer = freelancerFilter === "all" || timesheet.freelancerId === freelancerFilter;
    const matchesStatus = activeTab === "all" || timesheet.status === activeTab;
    
    return matchesSearch && matchesFreelancer && matchesStatus;
  });

  const pendingTimesheets = filteredTimesheets.filter(t => t.status === 'pending');
  const approvedTimesheets = filteredTimesheets.filter(t => t.status === 'approved');
  const rejectedTimesheets = filteredTimesheets.filter(t => t.status === 'rejected');
  const underReviewTimesheets = filteredTimesheets.filter(t => t.status === 'under_review');

  const totalHours = filteredTimesheets.reduce((sum, t) => sum + t.hoursWorked, 0);
  const totalAmount = filteredTimesheets.reduce((sum, t) => sum + t.billableAmount, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <ClientNavHeader />
      
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900" data-testid="page-title">
              Timesheets
            </h1>
            <p className="text-gray-600 mt-1">
              Review and approve time entries from your freelancers
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              This Week
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-pending">{pendingTimesheets.length}</div>
              <p className="text-xs text-gray-600">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-total-hours">{totalHours}</div>
              <p className="text-xs text-gray-600">This period</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-total-amount">${totalAmount.toLocaleString()}</div>
              <p className="text-xs text-gray-600">Billable amount</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verified Entries</CardTitle>
              <Shield className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-verified">
                {filteredTimesheets.filter(t => t.isVerified).length}
              </div>
              <p className="text-xs text-gray-600">With work diary proof</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filter Timesheets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search timesheets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="search-timesheets"
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

              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger data-testid="filter-date">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" className="flex items-center">
                <Filter className="w-4 h-4 mr-2" />
                Advanced
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Timesheet Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all" data-testid="tab-all">
              All ({filteredTimesheets.length})
            </TabsTrigger>
            <TabsTrigger value="pending" data-testid="tab-pending">
              Pending ({pendingTimesheets.length})
            </TabsTrigger>
            <TabsTrigger value="approved" data-testid="tab-approved">
              Approved ({approvedTimesheets.length})
            </TabsTrigger>
            <TabsTrigger value="under_review" data-testid="tab-review">
              Under Review ({underReviewTimesheets.length})
            </TabsTrigger>
            <TabsTrigger value="rejected" data-testid="tab-rejected">
              Rejected ({rejectedTimesheets.length})
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
            ) : filteredTimesheets.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No timesheets found</h3>
                  <p className="text-gray-600">Timesheet entries will appear here once freelancers start logging time</p>
                </CardContent>
              </Card>
            ) : (
              filteredTimesheets.map((timesheet) => (
                <Card key={timesheet.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={timesheet.freelancer.profilePhoto} />
                          <AvatarFallback>
                            {timesheet.freelancer.firstName[0]}{timesheet.freelancer.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900">
                              {timesheet.freelancer.firstName} {timesheet.freelancer.lastName}
                            </h3>
                            <Badge className={`${getStatusColor(timesheet.status)} flex items-center gap-1`}>
                              {getStatusIcon(timesheet.status)}
                              {timesheet.status}
                            </Badge>
                            {timesheet.isVerified && (
                              <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
                                <Shield className="w-3 h-3" />
                                Verified
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-2">
                            Project: <Link href={`/client/contracts/${timesheet.contractId}`} className="text-blue-600 hover:underline">
                              {timesheet.contractTitle}
                            </Link>
                          </p>
                          
                          <p className="text-gray-700 mb-3">{timesheet.description}</p>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                            <div>
                              <p className="text-gray-500">Date</p>
                              <p className="font-medium">{new Date(timesheet.date).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Time Period</p>
                              <p className="font-medium">{timesheet.startTime} - {timesheet.endTime}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Hours Worked</p>
                              <p className="font-medium">{timesheet.hoursWorked} hrs</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Amount</p>
                              <p className="font-medium">${timesheet.billableAmount.toLocaleString()}</p>
                            </div>
                          </div>

                          {/* Verification Chain */}
                          {timesheet.verificationChain && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                              <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                                <Shield className="w-4 h-4" />
                                Signedwork Verification Chain
                              </h4>
                              <div className="space-y-1 text-sm">
                                {timesheet.verificationChain.teamLead && (
                                  <div className="flex items-center gap-2 text-green-700">
                                    <CheckCircle className="w-3 h-3" />
                                    <span>Verified by Team Lead: {timesheet.verificationChain.teamLead.name}</span>
                                  </div>
                                )}
                                {timesheet.verificationChain.branchManager && (
                                  <div className="flex items-center gap-2 text-green-700">
                                    <CheckCircle className="w-3 h-3" />
                                    <span>Approved by Branch Manager: {timesheet.verificationChain.branchManager.name}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Screenshots */}
                          {timesheet.screenshots.length > 0 && (
                            <div className="mb-4">
                              <p className="text-sm font-medium text-gray-700 mb-2">
                                Screenshots ({timesheet.screenshots.length})
                              </p>
                              <div className="flex gap-2">
                                {timesheet.screenshots.slice(0, 3).map((screenshot, index) => (
                                  <div key={index} className="w-16 h-16 bg-gray-200 rounded border">
                                    <img 
                                      src={screenshot} 
                                      alt={`Screenshot ${index + 1}`}
                                      className="w-full h-full object-cover rounded"
                                    />
                                  </div>
                                ))}
                                {timesheet.screenshots.length > 3 && (
                                  <div className="w-16 h-16 bg-gray-100 rounded border flex items-center justify-center text-xs text-gray-600">
                                    +{timesheet.screenshots.length - 3}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" data-testid={`button-view-${timesheet.id}`}>
                              <Eye className="w-4 h-4 mr-1" />
                              Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Timesheet Details</DialogTitle>
                              <DialogDescription>
                                Review detailed timesheet entry and verification information
                              </DialogDescription>
                            </DialogHeader>
                            {/* Detailed timesheet view would go here */}
                            <div className="space-y-4">
                              <p><strong>Freelancer:</strong> {timesheet.freelancer.firstName} {timesheet.freelancer.lastName}</p>
                              <p><strong>Project:</strong> {timesheet.contractTitle}</p>
                              <p><strong>Description:</strong> {timesheet.description}</p>
                              <p><strong>Hours:</strong> {timesheet.hoursWorked}</p>
                              <p><strong>Amount:</strong> ${timesheet.billableAmount}</p>
                            </div>
                          </DialogContent>
                        </Dialog>

                        {timesheet.status === 'pending' && (
                          <>
                            <Button 
                              size="sm" 
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => approveTimesheetMutation.mutate(timesheet.id)}
                              data-testid={`button-approve-${timesheet.id}`}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-red-600 hover:text-red-700"
                              onClick={() => rejectTimesheetMutation.mutate({ timesheetId: timesheet.id, reason: "Need more details" })}
                              data-testid={`button-reject-${timesheet.id}`}
                            >
                              <X className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
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
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Plus, Building2, Calendar as CalendarIcon, Clock, Edit, LogOut, User, BookOpen,
  Filter, Search, TrendingUp, DollarSign, Timer, Target, BarChart3,
  FileText, Tag, Briefcase, AlertCircle, CheckCircle, XCircle, Pause,
  PlayCircle, Star, Award, Activity, PieChart, Clipboard, Shield, Loader2
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { z } from 'zod';
import EmployeeNavHeader from '@/components/employee-nav-header';
import { useSocket } from '@/hooks/useSocket';
import { insertWorkEntrySchema } from '@shared/schema';
import { CompanyVerificationBadge } from '@/components/CompanyVerificationBadge';

type WorkEntryFormData = z.infer<typeof insertWorkEntrySchema>;

interface WorkEntry {
  id: string;
  title: string;
  description?: string;
  workType: string;
  category?: string;
  project?: string;
  client?: string;
  priority: string;
  status: string;
  approvalStatus?: string;
  startDate: string;
  endDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  billable: boolean;
  billableRate?: number;
  tags: string[];
  achievements: string[];
  challenges?: string;
  learnings?: string;
  companyFeedback?: string;
  companyRating?: number;
  companyId: string; // Add missing companyId property
  createdAt: string;
  updatedAt: string;
}

interface Company {
  id: string;
  name?: string;
  companyName?: string;
  position?: string;
  department?: string;
  joinedAt?: string;
  status?: string;
  isActive?: boolean;
}

// Define the invitation code form schema
const invitationCodeSchema = z.object({
  code: z.string().min(8, "Invitation code must be 8 characters").max(8, "Invitation code must be 8 characters"),
});

type InvitationCodeFormData = z.infer<typeof invitationCodeSchema>;

export default function ProfessionalWorkDiary() {
  const [location, setLocation] = useLocation();
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<WorkEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [workTypeFilter, setWorkTypeFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const queryClient = useQueryClient();

  const isActive = (path: string) => {
    return location === path;
  };

  // Fetch user companies
  const { data: companies, isLoading: companiesLoading } = useQuery<Company[]>({
    queryKey: ["/api/employee-companies"],
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  // Get current user for WebSocket integration
  const { data: currentUser } = useQuery<{id: string}>({
    queryKey: ['/api/auth/user'],
    refetchInterval: 60000, // Auto-refresh every minute
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  // Initialize WebSocket for real-time updates
  const { socket } = useSocket(currentUser?.id);

  // Listen for status changes and reset selected company if needed
  useEffect(() => {
    if (socket && currentUser?.id) {
      const handleStatusUpdate = (data: any) => {
        if (data.employeeId === currentUser.id) {
          // Clear selected company to force refresh
          setSelectedCompany("");
        }
      };
      
      socket.on('employee-status-updated', handleStatusUpdate);
      
      return () => {
        socket.off('employee-status-updated', handleStatusUpdate);
      };
    }
  }, [socket, currentUser?.id]);

  // Fetch work entries for selected company - FIXED: Using query parameter format
  const { data: workEntries, isLoading: workEntriesLoading } = useQuery<WorkEntry[]>({
    queryKey: ["/api/work-entries", selectedCompany],
    queryFn: async () => {
      if (!selectedCompany) return [];
      const response = await fetch(`/api/work-entries?companyId=${selectedCompany}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch work entries');
      }
      return response.json();
    },
    enabled: !!selectedCompany,
    refetchInterval: 20000, // Auto-refresh every 20 seconds for work entries
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  // Analytics for the selected company - FIXED: Using query parameter format
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["/api/work-entries/analytics", selectedCompany],
    queryFn: async () => {
      if (!selectedCompany) return {};
      const response = await fetch(`/api/work-entries/analytics?companyId=${selectedCompany}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
      return response.json();
    },
    enabled: !!selectedCompany,
    refetchInterval: 45000, // Auto-refresh analytics every 45 seconds
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const invitationForm = useForm<InvitationCodeFormData>({
    resolver: zodResolver(invitationCodeSchema),
    defaultValues: {
      code: '',
    },
  });

  const workEntryForm = useForm<WorkEntryFormData>({
    resolver: zodResolver(insertWorkEntrySchema),
    defaultValues: {
      title: "",
      description: "",
      workType: "task",
      category: "",
      project: "",
      client: "",
      priority: "medium",
      status: "pending",
      startDate: "",
      endDate: "",
      estimatedHours: 0,
      actualHours: 0,
      billable: false,
      billableRate: 0,
      tags: [],
      achievements: [],
      challenges: "",
      learnings: "",
      companyId: "",
      teamId: "", // Add team selection
    },
  });

  // Fetch employee teams for team selection
  const { data: employeeTeams } = useQuery({
    queryKey: ["/api/employee/teams", selectedCompany],
    queryFn: () => apiRequest("GET", `/api/employee/teams?companyId=${selectedCompany}`),
    enabled: !!selectedCompany,
  });

  // Update form when selectedCompany changes
  useEffect(() => {
    if (selectedCompany) {
      workEntryForm.setValue('companyId', selectedCompany);
      workEntryForm.setValue('teamId', ''); // Reset team selection when company changes
    }
  }, [selectedCompany, workEntryForm]);

  // Join company mutation
  const joinCompanyMutation = useMutation({
    mutationFn: async (data: InvitationCodeFormData) => {
      return await apiRequest('POST', '/api/employee/join-company', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employee/companies'] });
      toast({ title: "Success", description: "Successfully joined the company" });
      setIsJoinDialogOpen(false);
      invitationForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to join company",
        variant: "destructive",
      });
    },
  });

  // Form submission handler with proper validation
  const onSubmit = (data: WorkEntryFormData) => {
    // Validate company ID first
    const finalCompanyId = data.companyId || selectedCompany;
    if (!finalCompanyId) {
      toast({
        title: "Error",
        description: "Company ID is missing. Please select a company.",
        variant: "destructive",
      });
      return;
    }
    
    // Validate required fields
    if (!data.title?.trim()) {
      toast({
        title: "Validation Error",
        description: "Work title is required",
        variant: "destructive",
      });
      return;
    }
    
    if (!data.startDate?.trim()) {
      toast({
        title: "Validation Error",
        description: "Start date is required",
        variant: "destructive",
      });
      return;
    }
    
    // Ensure all required data is properly set
    const submissionData = {
      ...data,
      companyId: finalCompanyId,
      // Convert empty string to null for backend
      teamId: data.teamId || null,
      // Ensure numbers are properly set
      estimatedHours: data.estimatedHours || 0,
      actualHours: data.actualHours || 0,
      billableRate: data.billableRate || 0,
      // Ensure arrays are properly set
      tags: data.tags || [],
      achievements: data.achievements || [],
    };
    
    workEntryMutation.mutate(submissionData);
  };

  // Create/Update work entry mutation
  const workEntryMutation = useMutation({
    mutationFn: async (data: WorkEntryFormData) => {
      // Final validation before API call
      if (!data.companyId) {
        throw new Error('Company ID is required');
      }

      if (!data.title?.trim()) {
        throw new Error('Work title is required');
      }

      if (!data.startDate?.trim()) {
        throw new Error('Start date is required');
      }
      
      if (editingEntry) {
        return await apiRequest("PUT", `/api/work-entries/${editingEntry.id}`, data);
      } else {
        return await apiRequest("POST", "/api/work-entries", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-entries/analytics"] });
      setIsAddDialogOpen(false);
      setEditingEntry(null);
      // Proper form reset after success
      workEntryForm.reset({
        title: "",
        description: "",
        workType: "task",
        category: "",
        project: "",
        client: "",
        priority: "medium",
        status: "pending",
        startDate: "",
        endDate: "",
        estimatedHours: 0,
        actualHours: 0,
        billable: false,
        billableRate: 0,
        tags: [],
        achievements: [],
        challenges: "",
        learnings: "",
        companyId: selectedCompany || "",
        teamId: "", // Reset team selection
      });
      toast({
        title: editingEntry ? "Work entry updated" : "Work entry created",
        description: "Your work diary has been updated successfully.",
      });
    },
    onError: (error: any) => {
      
      // Check if it's an immutable entry error (status 403)
      if (error.message?.includes("Cannot edit approved work entry") || error.message?.includes("immutable")) {
        toast({
          title: "Cannot Edit Approved Entry",
          description: "This work entry has been approved by the company and cannot be modified. Approved entries are immutable to maintain data integrity.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to save work entry. Please try again.",
          variant: "destructive",
        });
      }
    },
  });

  // Filter work entries with debugging
  const filteredEntries = workEntries?.filter(entry => {
    const matchesSearch = entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.project?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.client?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || entry.status === statusFilter;
    const matchesWorkType = workTypeFilter === "all" || entry.workType === workTypeFilter;
    
    return matchesSearch && matchesStatus && matchesWorkType;
  }) || [];

  // Debug logging - Keep for now to ensure entries show
  console.log('=== WORK ENTRIES DEBUG ===');
  console.log('Work entries from API:', workEntries);
  console.log('Filtered entries:', filteredEntries);
  console.log('Search term:', searchTerm);
  console.log('Status filter:', statusFilter);
  console.log('Work type filter:', workTypeFilter);
  console.log('Selected company:', selectedCompany);
  console.log('Entry statuses:', workEntries?.map(e => ({id: e.id, title: e.title, status: e.status, approvalStatus: e.approvalStatus})));

  // For demonstration: Show how verification badges will look once approved
  const displayEntries = filteredEntries;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "in_progress": return "bg-blue-100 text-blue-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "on_hold": return "bg-gray-100 text-gray-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return CheckCircle;
      case "in_progress": return PlayCircle;
      case "pending": return Clock;
      case "on_hold": return Pause;
      case "cancelled": return XCircle;
      default: return AlertCircle;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-100 text-red-800";
      case "high": return "bg-orange-100 text-orange-800";
      case "medium": return "bg-blue-100 text-blue-800";
      case "low": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getWorkTypeIcon = (type: string) => {
    switch (type) {
      case "meeting": return CalendarIcon;
      case "project": return Briefcase;
      case "research": return Search;
      case "documentation": return FileText;
      case "training": return BookOpen;
      default: return Activity;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <EmployeeNavHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Company Selection */}
        {!selectedCompany ? (
          <div className="max-w-6xl mx-auto">
            {/* Action Button Section - Outside the main content */}
            <div className="flex justify-end mb-6">
              {companies && companies.length > 0 && (
                <Button
                  onClick={() => setIsJoinDialogOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                  data-testid="button-join-another-company"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Join Another Company
                </Button>
              )}
            </div>

            {/* Main Content Section - Clean white container */}
            <div className="bg-white rounded-lg shadow-sm border p-8">
              {/* Page Title - Centered */}
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-3">Select Company</h2>
                <p className="text-gray-600 text-lg">Choose a company to manage your work diary</p>
              </div>

              {/* Content Area */}
              <div>
                {companiesLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <Card key={i} className="border-2">
                        <CardContent className="p-6 text-center">
                          <div className="animate-pulse">
                            <div className="flex justify-center items-center mb-4">
                              <div className="h-12 w-12 bg-gray-200 rounded"></div>
                              <div className="ml-2">
                                <div className="h-4 w-16 bg-gray-200 rounded"></div>
                              </div>
                            </div>
                            <div className="h-5 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto mb-1"></div>
                            <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto"></div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : companies && companies.length > 0 ? (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {companies.map((company) => (
                      <Card 
                        key={company.id} 
                        className="group hover:shadow-xl transition-all duration-300 cursor-pointer bg-gradient-to-br from-white to-gray-50 border-2 hover:border-blue-200"
                        onClick={() => setSelectedCompany(company.id)}
                        data-testid={`company-card-${company.id}`}
                      >
                        <CardContent className="p-0">
                          <div className="p-6">
                            {/* Company Header */}
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="rounded-full bg-gradient-to-br from-blue-500 to-blue-600 p-3 shadow-lg">
                                  <Building2 className="h-6 w-6 text-white" />
                                </div>
                                {company.isActive === false ? (
                                  <span className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full font-medium border border-gray-200">
                                    Ex-Employee
                                  </span>
                                ) : (
                                  <span className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full font-medium border border-green-200">
                                    Active
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* Company Name */}
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                {company.companyName || company.name}
                              </h3>
                              {/* Show verification badge if company has verification data */}
                              {((company as any)?.panVerificationStatus || (company as any)?.cinVerificationStatus) && (
                                <CompanyVerificationBadge 
                                  status={
                                    ((company as any).panVerificationStatus === "verified" || (company as any).cinVerificationStatus === "verified") 
                                      ? "verified" 
                                      : ((company as any).panVerificationStatus === "pending" || (company as any).cinVerificationStatus === "pending")
                                      ? "pending"
                                      : ((company as any).panVerificationStatus === "rejected" || (company as any).cinVerificationStatus === "rejected")
                                      ? "rejected"
                                      : "unverified"
                                  }
                                  size="sm"
                                  showText={false}
                                />
                              )}
                            </div>
                            
                            {/* Company Details */}
                            <div className="space-y-2 mb-4">
                              {company.position && (
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">Position:</span> {company.position}
                                </p>
                              )}
                            </div>
                            
                            {/* Call to Action */}
                            <div className="flex items-center gap-2 text-sm font-medium text-blue-600 group-hover:text-blue-700">
                              <BookOpen className="h-4 w-4" />
                              <span>View Work Diary</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Companies Found</h3>
                    <p className="text-gray-600 mb-4">You need to join a company to use the work diary</p>
                    <Button onClick={() => setIsJoinDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Join Company
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div>
            {/* Company Header with Analytics */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedCompany("")}
                    data-testid="button-back-to-companies"
                  >
                    ← Back to Companies
                  </Button>
                  <div>
                    <div className="flex items-center gap-3">
                      <h1 className="text-2xl font-bold text-gray-900">
                        {companies?.find(c => c.id === selectedCompany)?.companyName} - Work Diary
                      </h1>
                      {(() => {
                        const currentCompany = companies?.find(c => c.id === selectedCompany);
                        return currentCompany?.isActive === false ? (
                          <Badge variant="secondary">Ex-Employee</Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Active</Badge>
                        );
                      })()}
                    </div>
                    {(() => {
                      const currentCompany = companies?.find(c => c.id === selectedCompany);
                      return currentCompany?.position && (
                        <p className="text-sm text-gray-600 mt-1">{currentCompany.position}</p>
                      );
                    })()}
                  </div>
                </div>
                {(() => {
                  const currentCompany = companies?.find(c => c.id === selectedCompany);
                  const isActiveEmployee = currentCompany?.isActive !== false;
                  
                  if (!isActiveEmployee) {
                    return (
                      <div className="flex items-center gap-2">
                        <Button disabled className="opacity-50">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Work Entry
                        </Button>
                        <p className="text-sm text-red-600">Ex-employees cannot add work entries</p>
                      </div>
                    );
                  }
                  
                  return (
                    <Button 
                      onClick={() => {
                        // Proper handleAddEntry function with form reset
                        setEditingEntry(null);
                        workEntryForm.reset({
                          title: "",
                          description: "",
                          workType: "task",
                          category: "",
                          project: "",
                          client: "",
                          priority: "medium",
                          status: "pending",
                          startDate: "",
                          endDate: "",
                          estimatedHours: 0,
                          actualHours: 0,
                          billable: false,
                          billableRate: 0,
                          tags: [],
                          achievements: [],
                          challenges: "",
                          learnings: "",
                          companyId: selectedCompany, // Ensure company ID is set
                          teamId: "", // Reset team selection
                        });
                        setIsAddDialogOpen(true);
                      }}
                      data-testid="button-add-work-entry"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Work Entry
                    </Button>
                  );
                })()}
              </div>

              {/* Analytics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                {analyticsLoading ? (
                  // Loading skeleton for analytics
                  Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                            <div className="h-8 bg-gray-200 rounded w-16"></div>
                          </div>
                          <div className="h-8 w-8 bg-gray-200 rounded"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <>
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Total Entries</p>
                            <p className="text-2xl font-bold">{(analytics as any)?.totalEntries || workEntries?.length || 0}</p>
                          </div>
                          <FileText className="h-8 w-8 text-blue-500" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Hours Logged</p>
                            <p className="text-2xl font-bold">{(analytics as any)?.totalHours || 0}h</p>
                          </div>
                          <Timer className="h-8 w-8 text-green-500" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Billable Hours</p>
                            <p className="text-2xl font-bold">{(analytics as any)?.billableHours || 0}h</p>
                          </div>
                          <DollarSign className="h-8 w-8 text-yellow-500" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Completion Rate</p>
                            <p className="text-2xl font-bold">{(analytics as any)?.completionRate || 0}%</p>
                          </div>
                          <Target className="h-8 w-8 text-purple-500" />
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            </div>

            {/* Filters and Search */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search entries..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                      data-testid="input-search-entries"
                    />
                  </div>
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger data-testid="select-status-filter">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={workTypeFilter} onValueChange={setWorkTypeFilter}>
                    <SelectTrigger data-testid="select-worktype-filter">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="task">Task</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="project">Project</SelectItem>
                      <SelectItem value="research">Research</SelectItem>
                      <SelectItem value="documentation">Documentation</SelectItem>
                      <SelectItem value="training">Training</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span>Showing {filteredEntries.length} of {workEntries?.length || 0} entries</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Work Entries List */}
            <div className="space-y-4">
              {workEntriesLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="animate-pulse">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-3">
                                <div className="h-6 bg-gray-200 rounded w-48"></div>
                                <div className="h-5 bg-gray-200 rounded w-20"></div>
                                <div className="h-5 bg-gray-200 rounded w-16"></div>
                              </div>
                              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            </div>
                            <div className="flex space-x-2">
                              <div className="h-8 w-8 bg-gray-200 rounded"></div>
                              <div className="h-8 w-8 bg-gray-200 rounded"></div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            {Array.from({ length: 4 }).map((_, j) => (
                              <div key={j}>
                                <div className="h-3 bg-gray-200 rounded w-16 mb-1"></div>
                                <div className="h-4 bg-gray-200 rounded w-20"></div>
                              </div>
                            ))}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {Array.from({ length: 3 }).map((_, j) => (
                              <div key={j} className="h-6 bg-gray-200 rounded w-16"></div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : displayEntries.length > 0 ? (
                displayEntries.map((entry) => {
                  const StatusIcon = getStatusIcon(entry.status);
                  const WorkTypeIcon = getWorkTypeIcon(entry.workType);
                  
                  return (
                    <Card key={entry.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              <h3 className="text-lg font-semibold text-gray-900">{entry.title}</h3>
                              
                              {/* Essential badges only: Company Verified, Immutable, and Star Rating */}
                              {(entry.status === 'approved' || entry.approvalStatus === 'approved') && (
                                <>
                                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                    <Shield className="h-3 w-3 mr-1" />
                                    Company Verified
                                  </Badge>
                                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                    🔒 Immutable
                                  </Badge>
                                </>
                              )}
                              
                              {/* Company Rating Badge - Stars only */}
                              {(entry as any).companyRating && (entry as any).companyRating > 0 && (
                                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                  <Star className="h-3 w-3 mr-1" />
                                  {(entry as any).companyRating}/5
                                </Badge>
                              )}
                            </div>

                            {entry.description && (
                              <p className="text-gray-700 mb-3 line-clamp-2">{entry.description}</p>
                            )}

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                              {entry.project && (
                                <div>
                                  <span className="text-gray-500">Project:</span>
                                  <p className="font-medium">{entry.project}</p>
                                </div>
                              )}
                              {entry.client && (
                                <div>
                                  <span className="text-gray-500">Client:</span>
                                  <p className="font-medium">{entry.client}</p>
                                </div>
                              )}
                              <div>
                                <span className="text-gray-500">Start Date:</span>
                                <p className="font-medium">
                                  {entry.startDate ? (
                                    (() => {
                                      try {
                                        const date = new Date(entry.startDate);
                                        return isNaN(date.getTime()) ? entry.startDate : format(date, 'PP');
                                      } catch (e) {
                                        return entry.startDate;
                                      }
                                    })()
                                  ) : 'No date'}
                                </p>
                              </div>
                              {entry.actualHours && (
                                <div>
                                  <span className="text-gray-500">Hours:</span>
                                  <p className="font-medium">{entry.actualHours}h</p>
                                </div>
                              )}
                            </div>

                            {entry.tags.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-3">
                                {entry.tags.map((tag, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    <Tag className="h-3 w-3 mr-1" />
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}

                            {entry.achievements.length > 0 && (
                              <div className="mb-3">
                                <h5 className="text-sm font-medium text-gray-900 mb-2">Achievements:</h5>
                                <ul className="text-sm text-gray-700 space-y-1">
                                  {entry.achievements.map((achievement, index) => (
                                    <li key={index} className="flex items-start">
                                      <Star className="h-3 w-3 mr-2 mt-1 text-yellow-500 flex-shrink-0" />
                                      {achievement}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Company Rating Only - Removed review text */}
                            {entry.companyRating && (
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                                <div className="flex items-center space-x-2">
                                  <Shield className="h-4 w-4 text-blue-600" />
                                  <span className="text-blue-600 text-sm">Company Rating:</span>
                                  <div className="flex items-center space-x-1">
                                    {[...Array(5)].map((_, i) => (
                                      <Star 
                                        key={i} 
                                        className={`h-4 w-4 ${i < entry.companyRating! ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                                      />
                                    ))}
                                    <span className="font-medium text-blue-800">({entry.companyRating}/5)</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col space-y-2 ml-4">
                            {/* Edit Button - Disabled for approved entries or ex-employees */}
                            {(() => {
                              const currentCompany = companies?.find(c => c.id === selectedCompany);
                              const isActiveEmployee = currentCompany?.isActive !== false;
                              
                              if (entry.status === 'approved' || entry.approvalStatus === 'approved') {
                                return (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    disabled
                                    className="opacity-50 cursor-not-allowed"
                                    data-testid={`button-edit-${entry.id}-approved`}
                                    title="Cannot edit company-approved work entries"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                );
                              }
                              
                              if (!isActiveEmployee) {
                                return (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    disabled
                                    className="opacity-50 cursor-not-allowed"
                                    data-testid={`button-edit-${entry.id}-ex-employee`}
                                    title="Ex-employees cannot edit work entries"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                );
                              }
                              
                              return (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setEditingEntry(entry);
                                    // Proper form reset with entry's original data when editing
                                    workEntryForm.reset({
                                      title: entry.title,
                                      description: entry.description || "",
                                      workType: entry.workType as "task" | "meeting" | "project" | "research" | "documentation" | "training",
                                      category: entry.category || "",
                                      project: entry.project || "",
                                      client: entry.client || "",
                                      priority: entry.priority as "low" | "medium" | "high" | "urgent",
                                      status: entry.status as "pending" | "in_progress" | "completed" | "on_hold" | "cancelled",
                                      startDate: entry.startDate,
                                      endDate: entry.endDate || "",
                                      estimatedHours: entry.estimatedHours || 0,
                                      actualHours: entry.actualHours || 0,
                                      billable: entry.billable,
                                      billableRate: entry.billableRate || 0,
                                      tags: entry.tags || [],
                                      achievements: entry.achievements || [],
                                      challenges: entry.challenges || "",
                                      learnings: entry.learnings || "",
                                      companyId: entry.companyId // Use entry's original company ID
                                    });
                                    setIsAddDialogOpen(true);
                                  }}
                                  data-testid={`button-edit-${entry.id}`}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              );
                            })()}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {searchTerm || statusFilter !== "all" || workTypeFilter !== "all" 
                        ? "No matching entries found" 
                        : "No work entries yet"
                      }
                    </h3>
                    <p className="text-gray-600 mb-6">
                      {searchTerm || statusFilter !== "all" || workTypeFilter !== "all"
                        ? "Try adjusting your filters or search term"
                        : "Start documenting your professional work journey"
                      }
                    </p>
                    {(() => {
                      const currentCompany = companies?.find(c => c.id === selectedCompany);
                      const isActiveEmployee = currentCompany?.isActive !== false;
                      
                      if (!isActiveEmployee) {
                        return (
                          <Button 
                            disabled
                            className="opacity-50 cursor-not-allowed"
                            data-testid="button-add-entry-ex-employee"
                            title="Ex-employees cannot add work entries"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Your First Entry
                          </Button>
                        );
                      }
                      
                      return (
                        <Button onClick={() => {
                          // Proper handleAddEntry function with form reset
                          setEditingEntry(null);
                          workEntryForm.reset({
                            title: "",
                            description: "",
                            workType: "task",
                            category: "",
                            project: "",
                            client: "",
                            priority: "medium",
                            status: "pending",
                            startDate: "",
                            endDate: "",
                            estimatedHours: 0,
                            actualHours: 0,
                            billable: false,
                            billableRate: 0,
                            tags: [],
                            achievements: [],
                            challenges: "",
                            learnings: "",
                            companyId: selectedCompany, // Ensure company ID is set
                            teamId: "", // Reset team selection
                          });
                          setIsAddDialogOpen(true);
                        }}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Your First Entry
                        </Button>
                      );
                    })()}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Work Entry Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEntry ? "Edit Work Entry" : "Add New Work Entry"}
            </DialogTitle>
          </DialogHeader>
          
          <Form {...workEntryForm}>
            <form onSubmit={(e) => {
              console.log('=== FORM ONSUBMIT EVENT ===');
              console.log('Form submit event triggered:', e);
              console.log('Form state before handleSubmit:', workEntryForm.formState);
              console.log('Form values before handleSubmit:', workEntryForm.getValues());
              console.log('Calling workEntryForm.handleSubmit(onSubmit)...');
              workEntryForm.handleSubmit(onSubmit)(e);
            }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={workEntryForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Work Title *</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="e.g., Implemented user authentication system"
                          data-testid="input-work-title"
                          maxLength={150}
                          onChange={(e) => {
                            // Clean up the input value - remove consecutive spaces
                            const cleaned = e.target.value.replace(/\s{2,}/g, ' ');
                            field.onChange(cleaned);
                          }}
                        />
                      </FormControl>
                      <div className="flex justify-between items-center">
                        <FormMessage />
                        <span className="text-xs text-muted-foreground">
                          {field.value?.length || 0}/150 characters
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Describe your work clearly and professionally. Use letters, numbers, and basic punctuation only.
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={workEntryForm.control}
                  name="workType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Work Type *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="task">Task</SelectItem>
                          <SelectItem value="meeting">Meeting</SelectItem>
                          <SelectItem value="project">Project</SelectItem>
                          <SelectItem value="research">Research</SelectItem>
                          <SelectItem value="documentation">Documentation</SelectItem>
                          <SelectItem value="training">Training</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={workEntryForm.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={workEntryForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="on_hold">On Hold</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={workEntryForm.control}
                  name="teamId"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Submit to Team Manager</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select team (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {employeeTeams && employeeTeams.length > 0 ? (
                            employeeTeams.map((team: any) => (
                              <SelectItem key={team.id} value={team.id}>
                                {team.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-teams" disabled>No teams available</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                      <div className="text-xs text-muted-foreground">
                        Select a team manager to review this entry. Company administrators always receive all entries.
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={workEntryForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="e.g., Development, Design, Management" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={workEntryForm.control}
                  name="project"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="e.g., Mobile App v2.0" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={workEntryForm.control}
                  name="client"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="e.g., ABC Corporation" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={workEntryForm.control}
                  name="startDate"
                  render={({ field, fieldState }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Start Date *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground",
                                fieldState.error && "border-red-500"
                              )}
                              data-testid="button-start-date"
                            >
                              {field.value ? field.value : <span>dd/mm/yyyy</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value ? (() => {
                              try {
                                const [day, month, year] = field.value.split('/');
                                return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                              } catch {
                                return undefined;
                              }
                            })() : undefined}
                            onSelect={(date) => {
                              if (date) {
                                const day = date.getDate().toString().padStart(2, '0');
                                const month = (date.getMonth() + 1).toString().padStart(2, '0');
                                const year = date.getFullYear().toString();
                                field.onChange(`${day}/${month}/${year}`);
                              } else {
                                field.onChange("");
                              }
                            }}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={workEntryForm.control}
                  name="endDate"
                  render={({ field, fieldState }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>End Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground",
                                fieldState.error && "border-red-500"
                              )}
                              data-testid="button-end-date"
                            >
                              {field.value ? field.value : <span>dd/mm/yyyy</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value ? (() => {
                              try {
                                const [day, month, year] = field.value.split('/');
                                return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                              } catch {
                                return undefined;
                              }
                            })() : undefined}
                            onSelect={(date) => {
                              if (date) {
                                const day = date.getDate().toString().padStart(2, '0');
                                const month = (date.getMonth() + 1).toString().padStart(2, '0');
                                const year = date.getFullYear().toString();
                                field.onChange(`${day}/${month}/${year}`);
                              } else {
                                field.onChange("");
                              }
                            }}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={workEntryForm.control}
                  name="estimatedHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estimated Hours</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number" 
                          min="0" 
                          step="0.5"
                          value={field.value?.toString() || ""}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          placeholder="0" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={workEntryForm.control}
                  name="actualHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Actual Hours</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number" 
                          min="0" 
                          step="0.5"
                          value={field.value?.toString() || ""}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          placeholder="0" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={workEntryForm.control}
                  name="billable"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value || false}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Billable Work</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                {workEntryForm.watch("billable") && (
                  <FormField
                    control={workEntryForm.control}
                    name="billableRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hourly Rate</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number" 
                            min="0"
                            value={field.value?.toString() || ""}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            placeholder="0" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <FormField
                control={workEntryForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        value={field.value || ""}
                        rows={4}
                        placeholder="Detailed description of the work performed..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={workEntryForm.control}
                name="challenges"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Challenges Faced</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        value={field.value || ""}
                        rows={3}
                        placeholder="What challenges did you encounter and how did you address them?"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={workEntryForm.control}
                name="learnings"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Key Learnings</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        value={field.value || ""}
                        rows={3}
                        placeholder="What did you learn from this work? New skills, insights, etc."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    setEditingEntry(null);
                    workEntryForm.reset();
                  }}
                >
                  Cancel
                </Button>
                
                <Button 
                  type="button" 
                  disabled={workEntryMutation.isPending}
                  data-testid="button-create-entry"
                  onClick={(e) => {
                    e.preventDefault();
                    
                    // Get form data directly
                    const formData = workEntryForm.getValues();
                    
                    // Set companyId if missing
                    if (!formData.companyId && selectedCompany) {
                      formData.companyId = selectedCompany;
                      workEntryForm.setValue('companyId', selectedCompany);
                    }
                    
                    onSubmit(formData);
                  }}
                >
                  {workEntryMutation.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {workEntryMutation.isPending 
                    ? "Saving..." 
                    : editingEntry 
                      ? "Update Entry" 
                      : "Create Entry"
                  }
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Join Company Dialog */}
      <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join Company</DialogTitle>
            <DialogDescription>
              Enter the 8-character invitation code provided by your company
            </DialogDescription>
          </DialogHeader>
          <Form {...invitationForm}>
            <form onSubmit={invitationForm.handleSubmit((data) => joinCompanyMutation.mutate(data))} className="space-y-4">
              <FormField
                control={invitationForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invitation Code</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Enter 8-character code"
                        maxLength={8}
                        className="uppercase"
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsJoinDialogOpen(false);
                    invitationForm.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={joinCompanyMutation.isPending}>
                  {joinCompanyMutation.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {joinCompanyMutation.isPending ? "Joining..." : "Join Company"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
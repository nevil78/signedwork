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
  PlayCircle, Star, Award, Activity, PieChart, Clipboard, Shield
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { z } from 'zod';
import EmployeeNavHeader from '@/components/employee-nav-header';

// Enhanced work entry schema with professional fields
const workEntrySchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  workType: z.enum(["task", "meeting", "project", "research", "documentation", "training"]),
  category: z.string().optional(),
  project: z.string().optional(),
  client: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  status: z.enum(["pending", "in_progress", "completed", "on_hold", "cancelled"]),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  estimatedHours: z.number().min(0).optional(),
  actualHours: z.number().min(0).optional(),
  billable: z.boolean().default(false),
  billableRate: z.number().min(0).optional(),
  tags: z.array(z.string()).default([]),
  achievements: z.array(z.string()).default([]),
  challenges: z.string().optional(),
  learnings: z.string().optional(),
  companyId: z.string().min(1, "Company is required"),
});

type WorkEntryFormData = z.infer<typeof workEntrySchema>;

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
  const { data: companies } = useQuery<Company[]>({
    queryKey: ["/api/employee/companies"],
  });

  // Fetch work entries for selected company - FIXED: Using query parameter format
  const { data: workEntries, isLoading } = useQuery<WorkEntry[]>({
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
  });

  // Analytics for the selected company - FIXED: Using query parameter format
  const { data: analytics } = useQuery({
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
  });

  const invitationForm = useForm<InvitationCodeFormData>({
    resolver: zodResolver(invitationCodeSchema),
    defaultValues: {
      code: '',
    },
  });

  const workEntryForm = useForm<WorkEntryFormData>({
    resolver: zodResolver(workEntrySchema),
    defaultValues: {
      title: "",
      description: "",
      workType: "task",
      category: "",
      project: "",
      client: "",
      priority: "medium",
      status: "pending",
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: "",
      estimatedHours: 0,
      actualHours: 0,
      billable: false,
      billableRate: 0,
      tags: [],
      achievements: [],
      challenges: "",
      learnings: "",
      companyId: selectedCompany,
    },
  });

  // Fix 1: Update form when selectedCompany changes
  useEffect(() => {
    if (selectedCompany) {
      console.log('Updating companyId in form to:', selectedCompany);
      workEntryForm.setValue('companyId', selectedCompany);
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

  // Fix 2: Improved Create/Update work entry with better validation and error handling
  const workEntryMutation = useMutation({
    mutationFn: async (data: WorkEntryFormData) => {
      console.log('Submitting work entry:', data);

      // Validate required fields before submission
      if (!data.companyId) {
        throw new Error('Company ID is required');
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
      // Fix 4: Proper form reset with current company
      workEntryForm.reset({
        title: "",
        description: "",
        workType: "task",
        category: "",
        project: "",
        client: "",
        priority: "medium",
        status: "pending",
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: "",
        estimatedHours: 0,
        actualHours: 0,
        billable: false,
        billableRate: 0,
        tags: [],
        achievements: [],
        challenges: "",
        learnings: "",
        companyId: selectedCompany, // Reset with current company
      });
      toast({
        title: editingEntry ? "Work entry updated" : "Work entry created",
        description: "Your work diary has been updated successfully.",
      });
    },
    onError: (error: any) => {
      console.error('Work entry submission error:', error);
      
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
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Select Company</CardTitle>
                <p className="text-gray-600">Choose a company to manage your work diary</p>
              </CardHeader>
              <CardContent>
                {companies && companies.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {companies.map((company) => (
                      <Card 
                        key={company.id} 
                        className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary"
                        onClick={() => setSelectedCompany(company.id)}
                        data-testid={`company-card-${company.id}`}
                      >
                        <CardContent className="p-6 text-center">
                          <Building2 className="h-12 w-12 text-primary mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{company.companyName || company.name}</h3>
                          <p className="text-sm text-gray-600">Click to view work diary</p>
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
              </CardContent>
            </Card>
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
                  <h1 className="text-2xl font-bold text-gray-900">
                    {companies?.find(c => c.id === selectedCompany)?.companyName} - Work Diary
                  </h1>
                </div>
                <Button 
                  onClick={() => {
                    // Fix 3: Proper handleAddEntry function with form reset
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
                      startDate: format(new Date(), 'yyyy-MM-dd'),
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
                    });
                    setIsAddDialogOpen(true);
                  }}
                  data-testid="button-add-work-entry"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Work Entry
                </Button>
              </div>

              {/* Analytics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
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
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading work entries...</p>
                </div>
              ) : filteredEntries.length > 0 ? (
                filteredEntries.map((entry) => {
                  const StatusIcon = getStatusIcon(entry.status);
                  const WorkTypeIcon = getWorkTypeIcon(entry.workType);
                  
                  return (
                    <Card key={entry.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              <WorkTypeIcon className="h-5 w-5 text-gray-500" />
                              <h3 className="text-lg font-semibold text-gray-900">{entry.title}</h3>
                              <Badge className={getStatusColor(entry.status)}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {entry.status.replace('_', ' ')}
                              </Badge>
                              <Badge className={getPriorityColor(entry.priority)}>
                                {entry.priority}
                              </Badge>
                              {entry.billable && (
                                <Badge variant="outline" className="bg-green-50 text-green-700">
                                  <DollarSign className="h-3 w-3 mr-1" />
                                  Billable
                                </Badge>
                              )}
                              {/* Company Verification Badge - NEW FEATURE */}
                              {entry.status === 'approved' && (
                                <>
                                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                    <Shield className="h-3 w-3 mr-1" />
                                    Company Verified
                                  </Badge>
                                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 ml-2">
                                    🔒 Immutable
                                  </Badge>
                                </>
                              )}
                              {/* Company Rating Badge - Shows when company rates the work */}
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
                                <p className="font-medium">{format(new Date(entry.startDate), 'PP')}</p>
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

                            {/* Company Feedback Section - NEW FEATURE */}
                            {((entry as any).companyFeedback || entry.companyRating) && (
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                                <div className="flex items-center space-x-2 mb-2">
                                  <Shield className="h-4 w-4 text-blue-600" />
                                  <span className="text-sm font-medium text-blue-800">Company Review</span>
                                </div>
                                
                                {(entry as any).companyFeedback && (
                                  <p className="text-sm text-blue-700 mb-2">{(entry as any).companyFeedback}</p>
                                )}
                                
                                {entry.companyRating && (
                                  <div className="flex items-center space-x-2 text-sm">
                                    <span className="text-blue-600">Rating:</span>
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
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col space-y-2 ml-4">
                            {/* Edit Button - Disabled for approved entries */}
                            {entry.status === 'approved' ? (
                              <Button 
                                variant="outline" 
                                size="sm"
                                disabled
                                className="opacity-50 cursor-not-allowed"
                                data-testid={`button-edit-${entry.id}-disabled`}
                                title="Cannot edit company-approved work entries"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setEditingEntry(entry);
                                  // Fix 4: Proper form reset with company ID when editing
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
                                    companyId: selectedCompany
                                  });
                                  setIsAddDialogOpen(true);
                                }}
                                data-testid={`button-edit-${entry.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
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
                    <Button onClick={() => {
                      // Fix 3: Proper handleAddEntry function with form reset
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
                        startDate: format(new Date(), 'yyyy-MM-dd'),
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
                      });
                      setIsAddDialogOpen(true);
                    }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Entry
                    </Button>
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
            <form onSubmit={workEntryForm.handleSubmit((data) => {
              console.log('=== FORM SUBMISSION DEBUG ===');
              console.log('Form data:', data);
              console.log('Selected company:', selectedCompany);
              console.log('Form errors:', workEntryForm.formState.errors);
              console.log('Form is valid:', workEntryForm.formState.isValid);

              // Ensure companyId is set
              const finalData = {
                ...data,
                companyId: data.companyId || selectedCompany
              };

              console.log('Final submission data:', finalData);
              workEntryMutation.mutate(finalData);
            })} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={workEntryForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Work Title *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Implemented user authentication system" />
                      </FormControl>
                      <FormMessage />
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
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Development, Design, Management" />
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
                        <Input {...field} placeholder="e.g., Mobile App v2.0" />
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
                        <Input {...field} placeholder="e.g., ABC Corporation" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={workEntryForm.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date *</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={workEntryForm.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" />
                      </FormControl>
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
                          checked={field.value}
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
                <Button type="submit" disabled={workEntryMutation.isPending}>
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
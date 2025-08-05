import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Plus, Building2, Calendar as CalendarIcon, Clock, Edit, LogOut, User, BookOpen,
  Filter, Search, TrendingUp, DollarSign, Timer, Target, BarChart3,
  FileText, Tag, Briefcase, AlertCircle, CheckCircle, XCircle, Pause,
  PlayCircle, Star, Award, Activity, PieChart, Clipboard
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { z } from 'zod';

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

export default function ProfessionalWorkDiary() {
  const [location] = useLocation();
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
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

  // Fetch work entries for selected company
  const { data: workEntries, isLoading } = useQuery<WorkEntry[]>({
    queryKey: ["/api/work-entries", selectedCompany],
    enabled: !!selectedCompany,
  });

  // Analytics for the selected company
  const { data: analytics } = useQuery({
    queryKey: ["/api/work-entries/analytics", selectedCompany],
    enabled: !!selectedCompany,
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

  // Create/Update work entry
  const workEntryMutation = useMutation({
    mutationFn: async (data: WorkEntryFormData) => {
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
      workEntryForm.reset();
      toast({
        title: editingEntry ? "Work entry updated" : "Work entry created",
        description: "Your work diary has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save work entry. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Filter work entries
  const filteredEntries = workEntries?.filter(entry => {
    const matchesSearch = entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.project?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.client?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || entry.status === statusFilter;
    const matchesWorkType = workTypeFilter === "all" || entry.workType === workTypeFilter;
    
    return matchesSearch && matchesStatus && matchesWorkType;
  }) || [];

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
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-8 w-8 text-primary" />
                <span className="text-xl font-bold text-gray-900">Professional Work Diary</span>
              </div>

              {/* Navigation Links */}
              <nav className="hidden md:flex space-x-6">
                <Link href="/profile">
                  <a className={`transition-colors ${
                    isActive('/profile') 
                      ? 'text-primary font-medium' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}>
                    <div className="flex items-center space-x-1">
                      <User className="h-4 w-4" />
                      <span>Profile</span>
                    </div>
                  </a>
                </Link>
                <Link href="/work-diary">
                  <a className={`transition-colors ${
                    isActive('/work-diary') 
                      ? 'text-primary font-medium' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}>
                    <div className="flex items-center space-x-1">
                      <Clipboard className="h-4 w-4" />
                      <span>Work Diary</span>
                    </div>
                  </a>
                </Link>
                <Link href="/job-discovery">
                  <a className={`transition-colors ${
                    isActive('/job-discovery') 
                      ? 'text-primary font-medium' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}>
                    <div className="flex items-center space-x-1">
                      <Search className="h-4 w-4" />
                      <span>Job Discovery</span>
                    </div>
                  </a>
                </Link>
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.href = '/'}
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

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
                    <Button onClick={() => navigate('/work-diary')}>
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
                  onClick={() => setIsAddDialogOpen(true)}
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
                        <p className="text-2xl font-bold">{analytics?.totalEntries || 0}</p>
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
                        <p className="text-2xl font-bold">{analytics?.totalHours || 0}h</p>
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
                        <p className="text-2xl font-bold">{analytics?.billableHours || 0}h</p>
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
                        <p className="text-2xl font-bold">{analytics?.completionRate || 0}%</p>
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

                            {entry.companyRating && (
                              <div className="flex items-center space-x-2 text-sm">
                                <span className="text-gray-500">Company Rating:</span>
                                <div className="flex items-center space-x-1">
                                  {[...Array(5)].map((_, i) => (
                                    <Star 
                                      key={i} 
                                      className={`h-4 w-4 ${i < entry.companyRating! ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                                    />
                                  ))}
                                  <span className="font-medium">({entry.companyRating}/5)</span>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col space-y-2 ml-4">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setEditingEntry(entry);
                                workEntryForm.reset(entry);
                                setIsAddDialogOpen(true);
                              }}
                              data-testid={`button-edit-${entry.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
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
                    <Button onClick={() => setIsAddDialogOpen(true)}>
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
            <form onSubmit={workEntryForm.handleSubmit((data) => workEntryMutation.mutate(data))} className="space-y-6">
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
    </div>
  );
}
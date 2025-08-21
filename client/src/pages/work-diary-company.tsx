import { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, ArrowLeft, Calendar, Clock, Edit, Trash2, Search, CheckCircle, AlertCircle, MessageSquare, Lock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { insertWorkEntrySchema, type InsertWorkEntry, type WorkEntry, type EmployeeCompany } from '@shared/schema';
import { z } from 'zod';

type WorkEntryPriority = "low" | "medium" | "high";

// Helper function to convert date from dd/mm/yyyy to yyyy-mm-dd for backend
const formatDateForAPI = (dateStr: string) => {
  if (!dateStr) return '';
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return dateStr;
};

// Helper function to convert date from yyyy-mm-dd to dd/mm/yyyy for display
const formatDateForDisplay = (dateStr: string) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  return dateStr;
};

const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;

type WorkEntryFormData = z.infer<typeof insertWorkEntrySchema>;

type WorkEntryStatus = "pending" | "approved" | "needs_changes";

const getStatusBadge = (status: WorkEntryStatus) => {
  switch (status) {
    case 'pending':
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending Review</Badge>;
    case 'approved':
      return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Verified</Badge>;
    case 'needs_changes':
      return <Badge variant="secondary" className="bg-red-100 text-red-800"><AlertCircle className="w-3 h-3 mr-1" />Needs Changes</Badge>;
    default:
      return <Badge variant="secondary">Pending Review</Badge>;
  }
};

export default function WorkDiaryCompany() {
  const { companyId } = useParams();
  const [, navigate] = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<WorkEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  // Fetch company details - use the correct endpoint
  const { data: companies } = useQuery<EmployeeCompany[]>({
    queryKey: ['/api/employee/companies'],
  });

  const company = companies?.find(c => c.id === companyId);
  // For the new company employee system, we need to get the actual company ID
  // Use the companyId directly if companies haven't loaded yet
  const actualCompanyId = (company as any)?.companyId || companyId;

  // Fetch work entries for this company
  const { data: workEntries = [], isLoading } = useQuery<WorkEntry[]>({
    queryKey: ['/api/work-entries', actualCompanyId],
    queryFn: async () => {
      const response = await fetch(`/api/work-entries/${actualCompanyId}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch work entries');
      return response.json();
    },
    enabled: !!actualCompanyId,
  });

  const form = useForm<WorkEntryFormData>({
    resolver: zodResolver(insertWorkEntrySchema),
    defaultValues: {
      title: '',
      description: '',
      startDate: '', // Empty start date with dd/mm/yyyy placeholder
      endDate: '',
      priority: 'medium',
      status: 'pending',
      workType: 'task',
      estimatedHours: undefined,
      actualHours: undefined,
      companyId: companyId || '',
      billable: false,
    },
  });

  const createEntryMutation = useMutation({
    mutationFn: async (data: WorkEntryFormData) => {
      const finalCompanyId = actualCompanyId || companyId;
      
      // Convert dates from dd/mm/yyyy to yyyy-mm-dd for API
      const payload = { 
        ...data, 
        companyId: finalCompanyId,
        startDate: formatDateForAPI(data.startDate),
        endDate: data.endDate ? formatDateForAPI(data.endDate) : ''
      };
      console.log('Creating work entry with payload:', payload);
      console.log('finalCompanyId:', finalCompanyId);
      
      if (!finalCompanyId) {
        throw new Error('Company ID is required to create work entry');
      }
      
      // Use apiRequest helper which handles authentication properly
      const result = await apiRequest('POST', '/api/work-entries', payload);
      console.log('API response:', result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/work-entries', actualCompanyId] });
      toast({
        title: "Success",
        description: "Work entry created successfully",
      });
      setIsDialogOpen(false);
      form.reset({
        title: '',
        description: '',
        startDate: '', // Empty start date with dd/mm/yyyy placeholder
        endDate: '',
        priority: 'medium',
        status: 'pending',
        workType: 'task',
        estimatedHours: undefined,
        actualHours: undefined,
        companyId: actualCompanyId || '',
        billable: false,
      });
    },
    onError: (error: any) => {
      console.error('Work entry creation error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create work entry",
        variant: "destructive",
      });
    },
  });

  const updateEntryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<WorkEntryFormData> }) => {
      // Convert dates from dd/mm/yyyy to yyyy-mm-dd for API
      const payload = {
        ...data,
        startDate: data.startDate ? formatDateForAPI(data.startDate) : undefined,
        endDate: data.endDate ? formatDateForAPI(data.endDate) : undefined
      };
      return apiRequest('PATCH', `/api/work-entries/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/work-entries', actualCompanyId] });
      toast({
        title: "Success",
        description: "Work entry updated successfully",
      });
      setIsDialogOpen(false);
      setEditingEntry(null);
      form.reset({
        title: '',
        description: '',
        startDate: '', // Empty start date with dd/mm/yyyy placeholder
        endDate: '',
        priority: 'medium',
        status: 'pending',
        workType: 'task',
        estimatedHours: undefined,
        actualHours: undefined,
        companyId: actualCompanyId || '',
        billable: false,
      });
    },
    onError: (error: any) => {
      const errorMessage = error.message.includes("403") && error.message.includes("immutable") 
        ? "Cannot edit approved work entry. Approved entries are locked and immutable."
        : "Failed to update work entry";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const deleteEntryMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/work-entries/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/work-entries', actualCompanyId] });
      toast({
        title: "Success",
        description: "Work entry deleted successfully",
      });
    },
    onError: (error: any) => {
      const errorMessage = error.message.includes("403") && error.message.includes("immutable") 
        ? "Cannot delete approved work entry. Approved entries are locked and immutable."
        : "Failed to delete work entry";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: WorkEntryFormData) => {
    console.log('=== FORM SUBMISSION ===');
    console.log('onSubmit called with data:', data);
    console.log('Form state:', form.formState);
    console.log('Form errors:', form.formState.errors);
    console.log('actualCompanyId:', actualCompanyId);
    console.log('companyId (fallback):', companyId);
    
    const finalCompanyId = actualCompanyId || companyId;
    if (!finalCompanyId) {
      toast({
        title: "Error",
        description: "Company ID is missing. Please try refreshing the page.",
        variant: "destructive",
      });
      return;
    }
    
    // Ensure companyId is set in the data
    const dataWithCompanyId = { ...data, companyId: finalCompanyId };
    console.log('Final data to submit:', dataWithCompanyId);
    
    if (editingEntry) {
      updateEntryMutation.mutate({ id: editingEntry.id, data: dataWithCompanyId });
    } else {
      createEntryMutation.mutate(dataWithCompanyId);
    }
    console.log('=== END FORM SUBMISSION ===');
  };

  const handleEdit = (entry: WorkEntry) => {
    setEditingEntry(entry);
    form.reset({
      title: entry.title,
      description: entry.description || '',
      startDate: formatDateForDisplay(entry.startDate), // Convert from API format to display format
      endDate: entry.endDate ? formatDateForDisplay(entry.endDate) : '', // Convert from API format to display format
      priority: entry.priority as "low" | "medium" | "high",
      status: entry.status as "pending" | "approved" | "needs_changes" | "in_progress" | "completed",
      workType: (entry.workType || 'task') as "task" | "meeting" | "project" | "research" | "documentation" | "training",
      estimatedHours: entry.estimatedHours || undefined,
      actualHours: entry.actualHours || undefined,
      companyId: actualCompanyId || '',
      billable: entry.billable || false,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this work entry?')) {
      deleteEntryMutation.mutate(id);
    }
  };

  const filteredEntries = (workEntries as WorkEntry[]).filter((entry: WorkEntry) => {
    const matchesSearch = !searchQuery || 
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getPriorityBadgeClass = (priority: WorkEntryPriority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    }
  };

  if (!company) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="text-center">
          <p className="text-muted-foreground">Company not found</p>
          <Button onClick={() => navigate('/work-diary')} className="mt-4">
            Back to Work Diary
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/work-diary')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Companies
          </Button>
          
          <h1 className="text-3xl font-bold mb-2">{company.companyName}</h1>
          {company.position && (
            <p className="text-muted-foreground">Position: {company.position}</p>
          )}
          {company.startDate && (
            <p className="text-sm text-muted-foreground">
              {company.startDate} - {company.endDate || 'Present'}
            </p>
          )}
        </div>

        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search work entries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={async () => {
                try {
                  console.log('=== DIRECT API TEST ===');
                  const finalCompanyId = actualCompanyId || companyId;
                  const testData = {
                    title: "Direct API Test Entry",
                    description: "Testing direct API call bypassing form",
                    startDate: "2025-08-06",
                    priority: "medium",
                    status: "pending",
                    workType: "task",
                    billable: false,
                    companyId: finalCompanyId
                  };
                  console.log('Direct test data:', testData);
                  console.log('Company ID being used:', finalCompanyId);
                  const result = await apiRequest('POST', '/api/work-entries', testData);
                  console.log('Direct test result:', result);
                  toast({ title: "Direct API Test Successful!", description: "Work entry created via direct API call" });
                  queryClient.invalidateQueries({ queryKey: ['/api/work-entries', finalCompanyId] });
                } catch (error) {
                  console.error('Direct test error:', error);
                  toast({ title: "Direct API Test Failed", description: String(error), variant: "destructive" });
                }
              }}
              variant="outline"
              data-testid="button-test-direct-api"
            >
              Test Direct API
            </Button>
            <Button onClick={() => {
              setEditingEntry(null);
              form.reset({
                title: '',
                description: '',
                startDate: '', // Empty start date with dd/mm/yyyy placeholder
                endDate: '',
                priority: 'medium',
                status: 'pending',
                workType: 'task',
                estimatedHours: undefined,
                actualHours: undefined,
                companyId: actualCompanyId || '',
                billable: false,
              });
              setIsDialogOpen(true);
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Entry
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading work entries...</p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No work entries yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Start tracking your work activities for {company.companyName}
              </p>
              <Button onClick={() => {
                setEditingEntry(null);
                form.reset({
                  title: '',
                  description: '',
                  startDate: '', // Empty start date with dd/mm/yyyy placeholder
                  endDate: '',
                  priority: 'medium',
                  status: 'pending',
                  workType: 'task',
                  estimatedHours: undefined,
                  actualHours: undefined,
                  companyId: actualCompanyId || '',
                  billable: false,
                });
                setIsDialogOpen(true);
              }}>
                Add Your First Entry
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredEntries.map((entry) => (
              <Card key={entry.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-xl">{entry.title}</CardTitle>
                      <CardDescription className="mt-1 flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {entry.startDate}{entry.endDate && ` - ${entry.endDate}`}
                        </span>
                        {(entry.estimatedHours || entry.actualHours) && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {entry.actualHours ? `${entry.actualHours}h` : `${entry.estimatedHours}h (est)`}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge((entry as any).status || 'pending')}
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityBadgeClass(entry.priority as WorkEntryPriority)}`}>
                        {entry.priority}
                      </span>
                      {/* Only show edit/delete buttons if entry is not approved */}
                      {(entry as any).status !== 'approved' && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(entry)}
                            data-testid={`edit-button-${entry.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(entry.id)}
                            data-testid={`delete-button-${entry.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {/* Show immutable indicator for approved entries */}
                      {(entry as any).status === 'approved' && (
                        <div className="flex items-center gap-1 text-green-600 text-xs">
                          <Lock className="h-3 w-3" />
                          <span>Verified & Locked</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {entry.description && (
                    <div className="mb-3">
                      <p className="text-muted-foreground whitespace-pre-wrap">
                        {entry.description}
                      </p>
                    </div>
                  )}
                  
                  {(entry as any).status === 'needs_changes' && (entry as any).companyFeedback && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="w-4 h-4 text-red-600" />
                        <span className="font-medium text-red-800">Company Feedback:</span>
                      </div>
                      <p className="text-sm text-red-700">
                        {(entry as any).companyFeedback}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingEntry(null);
            form.reset({
              title: '',
              description: '',
              startDate: '', // Empty start date with dd/mm/yyyy placeholder
              endDate: '',
              priority: 'medium',
              status: 'pending',
              workType: 'task',
              estimatedHours: undefined,
              actualHours: undefined,
              companyId: actualCompanyId || '',
              billable: false,
            });
          }
        }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingEntry ? "Edit Work Entry" : "Add Work Entry"}</DialogTitle>
              <DialogDescription>
                {editingEntry ? "Update your work entry details" : "Create a new work diary entry"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit, (errors) => {
                console.log('=== FORM VALIDATION FAILED ===');
                console.log('Validation errors:', errors);
                console.log('Current form values:', form.getValues());
                console.log('Form state:', {
                  isDirty: form.formState.isDirty,
                  isValid: form.formState.isValid,
                  isSubmitting: form.formState.isSubmitting,
                  isLoading: form.formState.isLoading
                });
                console.log('=== END FORM ERROR DEBUG ===');
                toast({
                  title: "Form Validation Failed",
                  description: "Please check the form fields and try again",
                  variant: "destructive",
                });
              })} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter task title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel>Start Date *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="text"
                            placeholder="dd/mm/yyyy"
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value)}
                            className={fieldState.error ? "border-red-500 focus:border-red-500" : ""}
                            data-testid="input-start-date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="text"
                            placeholder="dd/mm/yyyy"
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value)}
                            className={fieldState.error ? "border-red-500 focus:border-red-500" : ""}
                            data-testid="input-end-date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe the work task or activity..."
                          className="min-h-[80px]"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="workType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Work Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select work type" />
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

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="estimatedHours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estimated Hours</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            step="0.5"
                            placeholder="0"
                            {...field}
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="actualHours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Actual Hours</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            step="0.5"
                            placeholder="0"
                            {...field}
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="billable"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <input
                            type="checkbox"
                            id="billable"
                            className="rounded border-gray-300"
                            checked={field.value || false}
                            onChange={(e) => field.onChange(e.target.checked)}
                          />
                        </FormControl>
                        <label htmlFor="billable" className="text-sm font-medium">
                          Billable Work
                        </label>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>



                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={async () => {
                      console.log('=== TESTING DIRECT API ===');
                      try {
                        const testData = {
                          title: "Direct API Test Entry",
                          description: "Testing API without form validation",
                          startDate: "2025-08-06",
                          priority: "medium",
                          status: "pending",
                          workType: "task",
                          estimatedHours: 2,
                          companyId: companyId,
                          billable: false
                        };
                        console.log('Test data:', testData);
                        
                        const response = await apiRequest('POST', '/api/work-entries', testData);
                        
                        console.log('API Response:', response);
                        toast({
                          title: "API Test Success",
                          description: "Work entry created via direct API call",
                        });
                      } catch (error) {
                        console.error('API Test failed:', error);
                        toast({
                          title: "API Test Failed", 
                          description: String(error),
                          variant: "destructive"
                        });
                      }
                    }}
                  >
                    Test Direct API
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createEntryMutation.isPending || updateEntryMutation.isPending}
                    data-testid="button-submit-work-entry"
                  >
                    {createEntryMutation.isPending || updateEntryMutation.isPending ? "Saving..." : (editingEntry ? "Update Entry" : "Create Entry")}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
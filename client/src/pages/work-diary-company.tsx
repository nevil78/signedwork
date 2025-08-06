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

// Use the proper backend schema
const workEntryFormSchema = insertWorkEntrySchema.omit({ employeeId: true });

type WorkEntryFormData = z.infer<typeof workEntryFormSchema>;

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
    resolver: zodResolver(workEntryFormSchema),
    defaultValues: {
      title: '',
      description: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      priority: 'medium',
      status: 'pending',
      workType: 'task',
      estimatedHours: undefined,
      actualHours: undefined,
      companyId: actualCompanyId || '',
      billable: false,
    },
  });

  const createEntryMutation = useMutation({
    mutationFn: async (data: WorkEntryFormData) => {
      const payload = { ...data, companyId: actualCompanyId };
      console.log('Creating work entry with payload:', payload);
      console.log('actualCompanyId:', actualCompanyId);
      
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
      form.reset();
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
      return apiRequest('PATCH', `/api/work-entries/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/work-entries', actualCompanyId] });
      toast({
        title: "Success",
        description: "Work entry updated successfully",
      });
      setIsDialogOpen(false);
      setEditingEntry(null);
      form.reset();
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
    console.log('onSubmit called with data:', data);
    console.log('Form state:', form.formState);
    console.log('Form errors:', form.formState.errors);
    console.log('actualCompanyId:', actualCompanyId);
    
    if (editingEntry) {
      updateEntryMutation.mutate({ id: editingEntry.id, data });
    } else {
      createEntryMutation.mutate(data);
    }
  };

  const handleEdit = (entry: WorkEntry) => {
    setEditingEntry(entry);
    form.reset({
      title: entry.title,
      description: entry.description || '',
      startDate: entry.startDate,
      endDate: entry.endDate || '',
      priority: entry.priority,
      status: entry.status,
      workType: entry.workType || 'task',
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
          <Button onClick={() => {
            setEditingEntry(null);
            form.reset();
            setIsDialogOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Entry
          </Button>
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
                form.reset();
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
            form.reset();
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
                console.log('Form submission failed with errors:', errors);
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
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value || ''} />
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                </div>

                <div className="grid grid-cols-2 gap-4">
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

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="billable"
                      className="rounded border-gray-300"
                    />
                    <label htmlFor="billable" className="text-sm font-medium">
                      Billable Work
                    </label>
                  </div>
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
                    type="submit" 
                    disabled={createEntryMutation.isPending || updateEntryMutation.isPending}
                    onClick={(e) => {
                      console.log('Submit button clicked');
                      console.log('Form values before submit:', form.getValues());
                      console.log('Form errors before submit:', form.formState.errors);
                      console.log('Form is valid:', form.formState.isValid);
                    }}
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
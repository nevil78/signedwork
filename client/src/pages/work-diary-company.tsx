import { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, ArrowLeft, Calendar, Clock, Tag, Edit, Trash2, Search } from 'lucide-react';
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

export default function WorkDiaryCompany() {
  const { companyId } = useParams();
  const [, navigate] = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<WorkEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  // Fetch company details
  const { data: companies } = useQuery<EmployeeCompany[]>({
    queryKey: ['/api/employee-companies'],
  });

  const company = companies?.find(c => c.id === companyId);

  // Fetch work entries for this company
  const { data: workEntries = [], isLoading } = useQuery<WorkEntry[]>({
    queryKey: ['/api/work-diary', companyId],
    queryFn: async () => {
      const response = await fetch(`/api/work-diary?companyId=${companyId}`);
      if (!response.ok) throw new Error('Failed to fetch work entries');
      return response.json();
    },
    enabled: !!companyId,
  });

  const form = useForm<InsertWorkEntry>({
    resolver: zodResolver(insertWorkEntrySchema.omit({ employeeId: true, companyId: true })),
    defaultValues: {
      title: '',
      description: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      priority: 'medium',
      hours: undefined,
      tags: '' as any, // Handle as string in form, convert to array on submit
    },
  });

  const createEntryMutation = useMutation({
    mutationFn: async (data: InsertWorkEntry) => {
      const response = await fetch('/api/work-diary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, companyId }),
      });
      if (!response.ok) throw new Error('Failed to create work entry');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/work-diary', companyId] });
      toast({
        title: "Success",
        description: "Work entry created successfully",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create work entry",
        variant: "destructive",
      });
    },
  });

  const updateEntryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertWorkEntry> }) => {
      const response = await fetch(`/api/work-diary/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update work entry');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/work-diary', companyId] });
      toast({
        title: "Success",
        description: "Work entry updated successfully",
      });
      setIsDialogOpen(false);
      setEditingEntry(null);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update work entry",
        variant: "destructive",
      });
    },
  });

  const deleteEntryMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/work-diary/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to delete work entry');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/work-diary', companyId] });
      toast({
        title: "Success",
        description: "Work entry deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete work entry",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertWorkEntry) => {
    console.log('Form data before processing:', data);
    
    const payload = {
      ...data,
      tags: Array.isArray(data.tags) ? data.tags : (data.tags as string | null | undefined)?.split(',').map(tag => tag.trim()).filter(Boolean) || [],
    };
    
    console.log('Payload after processing:', payload);
    
    if (editingEntry) {
      updateEntryMutation.mutate({ id: editingEntry.id, data: payload });
    } else {
      createEntryMutation.mutate(payload);
    }
  };

  const handleEdit = (entry: WorkEntry) => {
    setEditingEntry(entry);
    form.reset({
      ...entry,
      tags: entry.tags?.join(', ') as any || '',
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
                        {entry.hours && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {entry.hours} hours
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityBadgeClass(entry.priority as WorkEntryPriority)}`}>
                        {entry.priority}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(entry)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(entry.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {(entry.description || (entry.tags && entry.tags.length > 0)) && (
                  <CardContent>
                    {entry.description && (
                      <p className="text-muted-foreground mb-3 whitespace-pre-wrap">
                        {entry.description}
                      </p>
                    )}
                    {entry.tags && entry.tags.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <Tag className="h-3 w-3 text-muted-foreground" />
                        {entry.tags?.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded-md"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </CardContent>
                )}
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
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    name="hours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hours</FormLabel>
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

                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags (comma-separated)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g. development, meeting, research"
                          value={typeof field.value === 'string' ? field.value : field.value?.join(', ') || ''}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                  >
                    {editingEntry ? "Update Entry" : "Add Entry"}
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
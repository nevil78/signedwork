import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Building2, Calendar, Clock, ChevronRight, Edit, LogOut, User, BookOpen, Loader2 } from 'lucide-react';
import EmployeeNavHeader from '@/components/employee-nav-header';
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
import { insertEmployeeCompanySchema, type InsertEmployeeCompany, type EmployeeCompany } from '@shared/schema';
import { z } from 'zod';

// Define the invitation code form schema
const invitationCodeSchema = z.object({
  code: z.string().min(8, "Invitation code must be 8 characters").max(8, "Invitation code must be 8 characters"),
});

type InvitationCodeFormData = z.infer<typeof invitationCodeSchema>;

export default function WorkDiary() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<EmployeeCompany | null>(null);
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  // Logout mutation
  const logout = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to logout");
      return response.json();
    },
    onSuccess: () => {
      queryClient.clear();
      window.location.href = "/";
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive",
      });
    },
  });

  const { data: companies = [], isLoading } = useQuery<EmployeeCompany[]>({
    queryKey: ['/api/employee-companies'],
  });

  const invitationForm = useForm<InvitationCodeFormData>({
    resolver: zodResolver(invitationCodeSchema),
    defaultValues: {
      code: '',
    },
  });

  const form = useForm<InsertEmployeeCompany>({
    resolver: zodResolver(insertEmployeeCompanySchema.omit({ employeeId: true })),
    defaultValues: {
      companyName: '',
      position: '',
      startDate: '',
      endDate: '',
      isCurrent: false,
    },
  });

  const joinCompanyMutation = useMutation({
    mutationFn: async (data: InvitationCodeFormData) => {
      const response = await fetch('/api/employee/join-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to join company');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employee-companies'] });
      toast({
        title: "Success",
        description: "Successfully joined the company",
      });
      setIsDialogOpen(false);
      invitationForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createCompanyMutation = useMutation({
    mutationFn: async (data: InsertEmployeeCompany) => {
      const response = await fetch('/api/employee-companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create company');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employee-companies'] });
      toast({
        title: "Success",
        description: "Company added successfully",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add company",
        variant: "destructive",
      });
    },
  });

  const updateCompanyMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertEmployeeCompany> }) => {
      const response = await fetch(`/api/employee-companies/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update company');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employee-companies'] });
      toast({
        title: "Success",
        description: "Company updated successfully",
      });
      setIsDialogOpen(false);
      setEditingCompany(null);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update company",
        variant: "destructive",
      });
    },
  });

  const leaveCompanyMutation = useMutation({
    mutationFn: async (companyId: string) => {
      const response = await fetch(`/api/employee/leave-company/${companyId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to leave company');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employee-companies'] });
      toast({
        title: "Success",
        description: "You have successfully left the company",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to leave company",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertEmployeeCompany) => {
    if (editingCompany) {
      updateCompanyMutation.mutate({ id: editingCompany.id, data });
    } else {
      createCompanyMutation.mutate(data);
    }
  };

  const onInvitationSubmit = (data: InvitationCodeFormData) => {
    joinCompanyMutation.mutate(data);
  };

  const handleEdit = (company: EmployeeCompany) => {
    setEditingCompany(company);
    form.reset({
      companyName: company.companyName,
      position: company.position || '',
      startDate: company.startDate || '',
      endDate: company.endDate || '',
      isCurrent: company.isCurrent || false,
    });
    setIsDialogOpen(true);
  };

  const handleLeaveCompany = (companyId: string) => {
    if (confirm('Are you sure you want to leave this company? You will no longer have access to work entries for this company.')) {
      leaveCompanyMutation.mutate(companyId);
    }
  };

  // FIXED: Determine button text based on loading state and companies array
  const getButtonText = () => {
    if (isLoading) {
      return 'Loading...';
    }
    return companies.length === 0 ? 'Join Your First Company' : 'Join Another Company';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <EmployeeNavHeader />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-2">Work Diary</h1>
        <p className="text-muted-foreground mb-6">Manage work entries across all your companies - past and present</p>

        {/* FIXED: Always show the button, regardless of loading state */}
        <div className="mb-6 flex justify-end">
          <Button 
            onClick={() => {
              setEditingCompany(null);
              form.reset();
              invitationForm.reset();
              setIsDialogOpen(true);
            }}
            data-testid="button-join-company"
            disabled={isLoading}
          >
            <Plus className="mr-2 h-4 w-4" />
            {getButtonText()}
          </Button>
        </div>

        {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
          <p className="text-muted-foreground">Loading your companies...</p>
          <p className="text-sm text-muted-foreground/70 mt-2">Please wait while we fetch your work history</p>
        </div>
      ) : companies.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No companies yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Join a company using an invitation code from your employer
            </p>
            <Button onClick={() => {
              setEditingCompany(null);
              form.reset();
              setIsDialogOpen(true);
            }}>
              Join Your First Company
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {companies.map((company) => (
            <Card key={company.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div 
                    className="flex-1 cursor-pointer"
                    onClick={() => navigate(`/work-diary/${company.id}`)}
                  >
                    <CardTitle className="text-xl flex items-center gap-2">
                      {company.companyName}
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </CardTitle>
                    {company.position && (
                      <CardDescription className="mt-1">
                        {company.position}
                      </CardDescription>
                    )}
                    {company.startDate && (
                      <CardDescription className="mt-1 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {company.startDate} - {company.endDate || 'Present'}
                        {company.isCurrent && (
                          <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
                            Current
                          </span>
                        )}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(company);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLeaveCompany(company.id);
                      }}
                      title="Leave Company"
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) {
          setEditingCompany(null);
          form.reset();
          invitationForm.reset();
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCompany ? "Edit Company" : "Join Company"}</DialogTitle>
            <DialogDescription>
              {editingCompany ? "Update company details" : "Enter the invitation code provided by your company"}
            </DialogDescription>
          </DialogHeader>
          {editingCompany ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter company name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position</FormLabel>
                    <FormControl>
                      <Input placeholder="Your role at the company" {...field} value={field.value || ''} />
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
                      <FormLabel>Start Date</FormLabel>
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
                      <FormDescription>Leave empty if current</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="isCurrent"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Current Company
                      </FormLabel>
                      <FormDescription>
                        Are you currently working here?
                      </FormDescription>
                    </div>
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value || false}
                        onChange={field.onChange}
                        className="h-4 w-4"
                      />
                    </FormControl>
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
                  disabled={createCompanyMutation.isPending || updateCompanyMutation.isPending}
                >
                  {editingCompany ? "Update Company" : "Add Company"}
                </Button>
              </div>
            </form>
          </Form>
          ) : (
            <Form {...invitationForm}>
              <form onSubmit={invitationForm.handleSubmit(onInvitationSubmit)} className="space-y-4">
                <FormField
                  control={invitationForm.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Invitation Code</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter 8-character code" 
                          {...field} 
                          maxLength={8}
                          className="font-mono uppercase"
                          onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        />
                      </FormControl>
                      <FormDescription>
                        Ask your company administrator for the invitation code
                      </FormDescription>
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
                    disabled={joinCompanyMutation.isPending}
                  >
                    {joinCompanyMutation.isPending ? "Joining..." : "Join Company"}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
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

  const { data: companies = [], isLoading, refetch } = useQuery<EmployeeCompany[]>({
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
    onSuccess: async () => {
      // Force immediate refresh of companies
      await queryClient.refetchQueries({ queryKey: ['/api/employee-companies'] });
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
    onSuccess: async () => {
      // Force immediate refresh of companies
      await queryClient.refetchQueries({ queryKey: ['/api/employee-companies'] });
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
    onSuccess: async () => {
      // Force immediate refresh of companies
      await queryClient.refetchQueries({ queryKey: ['/api/employee-companies'] });
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
    onSuccess: async () => {
      // Force immediate refresh of companies
      await queryClient.refetchQueries({ queryKey: ['/api/employee-companies'] });
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

      {/* Header Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-3">Work Diary</h1>
          <p className="text-muted-foreground">Manage work entries across all your companies - past and present</p>
        </div>
      </div>

      {/* Action Button - Completely outside content area */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <div className="flex justify-end">
          <Button 
            onClick={() => {
              setEditingCompany(null);
              form.reset();
              invitationForm.reset();
              setIsDialogOpen(true);
            }}
            data-testid="button-join-company"
            disabled={isLoading}
            size="lg"
            className="px-6 py-3 shadow-lg"
          >
            <Plus className="mr-2 h-4 w-4" />
            {getButtonText()}
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">

        {/* Content Section */}
        {isLoading ? (
          <div className="bg-white rounded-lg shadow-sm border p-16">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
              <p className="text-muted-foreground">Loading your companies...</p>
              <p className="text-sm text-muted-foreground/70 mt-2">Please wait while we fetch your work history</p>
            </div>
          </div>
        ) : companies.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="flex flex-col items-center justify-center py-16 px-8">
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
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            {/* Page Title */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Company</h2>
              <p className="text-gray-600">Choose a company to manage your work diary</p>
            </div>
            
            {/* Companies Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {companies.map((company) => (
                <Card key={company.id} className="group hover:shadow-xl transition-all duration-300 cursor-pointer bg-gradient-to-br from-white to-gray-50 border-2 hover:border-blue-200">
                  <CardContent className="p-0">
                    <div 
                      className="p-6"
                      onClick={() => navigate(`/work-diary/${company.id}`)}
                    >
                      {/* Company Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="rounded-full bg-gradient-to-br from-blue-500 to-blue-600 p-3 shadow-lg">
                            <Building2 className="h-6 w-6 text-white" />
                          </div>
                          <span className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full font-medium border border-green-200">
                            Active
                          </span>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                      </div>
                      
                      {/* Company Name */}
                      <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                        {company.companyName}
                      </h3>
                      
                      {/* Company Details */}
                      <div className="space-y-2 mb-4">
                        {company.position && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Position:</span> {company.position}
                          </p>
                        )}
                        
                        {company.startDate && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {company.startDate} - {company.endDate || 'Present'}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Call to Action */}
                      <div className="flex items-center gap-2 text-sm font-medium text-blue-600 group-hover:text-blue-700">
                        <BookOpen className="h-4 w-4" />
                        <span>View Work Diary</span>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex border-t border-gray-100 bg-gray-50/50">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(company);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all"
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </button>
                      <div className="w-px bg-gray-200"></div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLeaveCompany(company.id);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all"
                      >
                        <LogOut className="h-4 w-4" />
                        Leave
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

      </div>

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
  );
}
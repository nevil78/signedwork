import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Edit2, Eye, Users, Calendar, MapPin, Building2, Trash2, ArrowLeft, Briefcase } from "lucide-react";
import { Link } from "wouter";
import CompanyNavHeader from '@/components/company-nav-header';

// Job posting form schema - aligned with actual database structure
const jobPostingSchema = z.object({
  title: z.string().min(1, "Job title is required"),
  description: z.string().min(50, "Description must be at least 50 characters"),
  requirements: z.string().min(30, "Requirements must be at least 30 characters"),
  location: z.string().min(1, "Location is required"),
  employmentType: z.enum(["full-time", "part-time", "contract", "internship"]),
  experienceLevel: z.enum(["entry", "mid", "senior", "executive"]),
  remoteType: z.enum(["office", "remote", "hybrid"]),
  salaryRange: z.string().optional(),
  skills: z.string().min(1, "At least one skill is required"),
  applicationDeadline: z.string().optional(),
});

type JobPostingFormData = z.infer<typeof jobPostingSchema>;

interface JobListing {
  id: string;
  title: string;
  description: string;
  requirements: string;
  location: string;
  employmentType: string;
  experienceLevel: string;
  remoteType: string;
  salaryRange?: string;
  skills: string[];
  applicationDeadline?: string;
  status: string;
  views: number;
  applicationsCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function CompanyJobsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingJob, setEditingJob] = useState<JobListing | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch company's job listings
  const { data: jobs = [], isLoading } = useQuery<JobListing[]>({
    queryKey: ["/api/company/jobs"],
  });

  // Create job mutation
  const createJobMutation = useMutation({
    mutationFn: async (data: JobPostingFormData) => {
      return apiRequest("POST", "/api/company/jobs", {
        ...data,
        skills: data.skills.split(',').map(skill => skill.trim()).filter(Boolean),
        applicationDeadline: data.applicationDeadline || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/company/jobs"] });
      toast({
        title: "Success",
        description: "Job posting created successfully!",
      });
      setShowCreateModal(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create job posting. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update job mutation
  const updateJobMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: JobPostingFormData }) => {
      return apiRequest("PUT", `/api/company/jobs/${id}`, {
        ...data,
        skills: data.skills.split(',').map(skill => skill.trim()).filter(Boolean),
        applicationDeadline: data.applicationDeadline || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/company/jobs"] });
      toast({
        title: "Success",
        description: "Job posting updated successfully!",
      });
      setEditingJob(null);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update job posting. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete job mutation
  const deleteJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      return apiRequest("DELETE", `/api/company/jobs/${jobId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/company/jobs"] });
      toast({
        title: "Success",
        description: "Job posting deleted successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete job posting. Please try again.",
        variant: "destructive",
      });
    },
  });

  const form = useForm<JobPostingFormData>({
    resolver: zodResolver(jobPostingSchema),
    defaultValues: {
      title: "",
      description: "",
      requirements: "",
      location: "",
      employmentType: "full-time",
      experienceLevel: "mid",
      remoteType: "office",
      salaryRange: "",
      skills: "",
      applicationDeadline: "",
    },
  });

  const handleCreateJob = (data: JobPostingFormData) => {
    createJobMutation.mutate(data);
  };

  const handleUpdateJob = (data: JobPostingFormData) => {
    if (editingJob) {
      updateJobMutation.mutate({ id: editingJob.id, data });
    }
  };

  const handleEditJob = (job: JobListing) => {
    setEditingJob(job);
    form.reset({
      title: job.title,
      description: job.description,
      requirements: job.requirements,
      location: job.location,
      employmentType: job.employmentType as any,
      experienceLevel: job.experienceLevel as any,
      remoteType: job.remoteType as any,
      salaryRange: job.salaryRange || "",
      skills: job.skills.join(", "),
      applicationDeadline: job.applicationDeadline ? new Date(job.applicationDeadline).toISOString().split('T')[0] : "",
    });
  };

  const handleDeleteJob = (jobId: string) => {
    if (confirm("Are you sure you want to delete this job posting? This action cannot be undone.")) {
      deleteJobMutation.mutate(jobId);
    }
  };

  const activeJobs = jobs.filter((job: JobListing) => job.status === 'active');
  const inactiveJobs = jobs.filter((job: JobListing) => job.status !== 'active');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation Header */}
      <CompanyNavHeader />

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header Section */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Job Postings</h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                Manage your company's job listings
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-semibold">Your Job Listings</h2>
            </div>
            <Dialog open={showCreateModal || !!editingJob} onOpenChange={(open) => {
              if (!open) {
                setShowCreateModal(false);
                setEditingJob(null);
                form.reset();
              }
            }}>
              <DialogTrigger asChild>
                <Button onClick={() => setShowCreateModal(true)} data-testid="button-create-job">
                  <Plus className="h-4 w-4 mr-2" />
                  Post New Job
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingJob ? "Edit Job Posting" : "Create New Job Posting"}
                  </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(editingJob ? handleUpdateJob : handleCreateJob)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem className="col-span-2">
                            <FormLabel>Job Title *</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Senior Software Engineer" {...field} data-testid="input-job-title" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location *</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. San Francisco, CA" {...field} data-testid="input-location" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="remoteType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Work Type *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-remote-type">
                                  <SelectValue placeholder="Select work type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="office">Office</SelectItem>
                                <SelectItem value="remote">Remote</SelectItem>
                                <SelectItem value="hybrid">Hybrid</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="employmentType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Employment Type *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-employment-type">
                                  <SelectValue placeholder="Select employment type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="full-time">Full-time</SelectItem>
                                <SelectItem value="part-time">Part-time</SelectItem>
                                <SelectItem value="contract">Contract</SelectItem>
                                <SelectItem value="internship">Internship</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="experienceLevel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Experience Level *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-experience-level">
                                  <SelectValue placeholder="Select experience level" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="entry">Entry Level</SelectItem>
                                <SelectItem value="mid">Mid Level</SelectItem>
                                <SelectItem value="senior">Senior Level</SelectItem>
                                <SelectItem value="executive">Executive</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="salaryRange"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Salary Range</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. $80,000 - $120,000" {...field} data-testid="input-salary-range" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="applicationDeadline"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Application Deadline</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} data-testid="input-deadline" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="skills"
                        render={({ field }) => (
                          <FormItem className="col-span-2">
                            <FormLabel>Required Skills * (comma-separated)</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. React, TypeScript, Node.js" {...field} data-testid="input-skills" />
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
                          <FormLabel>Job Description *</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe the role, responsibilities, and what makes this opportunity exciting..."
                              className="min-h-[120px]"
                              {...field}
                              data-testid="textarea-description"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="requirements"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Requirements & Qualifications *</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="List the required qualifications, experience, and skills..."
                              className="min-h-[120px]"
                              {...field}
                              data-testid="textarea-requirements"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end gap-3 pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                          setShowCreateModal(false);
                          setEditingJob(null);
                          form.reset();
                        }}
                        data-testid="button-cancel"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createJobMutation.isPending || updateJobMutation.isPending}
                        data-testid="button-submit-job"
                      >
                        {createJobMutation.isPending || updateJobMutation.isPending 
                          ? (editingJob ? 'Updating...' : 'Publishing...') 
                          : (editingJob ? 'Update Job' : 'Publish Job')
                        }
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <Tabs defaultValue="active" className="space-y-6">
            <TabsList>
              <TabsTrigger value="active" data-testid="tab-active-jobs">
                Active Jobs ({activeJobs.length})
              </TabsTrigger>
              <TabsTrigger value="inactive" data-testid="tab-inactive-jobs">
                Inactive Jobs ({inactiveJobs.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-4">
              {isLoading ? (
                <div className="text-center py-8">Loading job postings...</div>
              ) : activeJobs.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No active job postings</h3>
                    <p className="text-muted-foreground mb-4">
                      Start attracting top talent by posting your first job opening.
                    </p>
                    <Button onClick={() => setShowCreateModal(true)} data-testid="button-create-first-job">
                      <Plus className="h-4 w-4 mr-2" />
                      Post Your First Job
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                activeJobs.map((job: JobListing) => (
                  <JobCard 
                    key={job.id} 
                    job={job} 
                    onEdit={handleEditJob}
                    onDelete={handleDeleteJob}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="inactive" className="space-y-4">
              {inactiveJobs.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No inactive job postings</h3>
                    <p className="text-muted-foreground">
                      Closed or expired job postings will appear here.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                inactiveJobs.map((job: JobListing) => (
                  <JobCard 
                    key={job.id} 
                    job={job} 
                    onEdit={handleEditJob}
                    onDelete={handleDeleteJob}
                    isInactive
                  />
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

// Job Card Component
interface JobCardProps {
  job: JobListing;
  onEdit: (job: JobListing) => void;
  onDelete: (jobId: string) => void;
  isInactive?: boolean;
}

function JobCard({ 
  job, 
  onEdit, 
  onDelete,
  isInactive = false 
}: JobCardProps) {
  return (
    <Card className={`${isInactive ? 'opacity-75' : ''}`}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold" data-testid={`text-job-title-${job.id}`}>
                {job.title}
              </h3>
              <Badge variant={isInactive ? "secondary" : "default"}>
                {job.employmentType}
              </Badge>
              <Badge variant="outline">{job.experienceLevel}</Badge>
              {isInactive && <Badge variant="destructive">Inactive</Badge>}
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {job.location}
              </div>
              {job.remoteType && (
                <div className="flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  {job.remoteType}
                </div>
              )}
              {job.salaryRange && (
                <div className="flex items-center gap-1">
                  <span>💰</span>
                  {job.salaryRange}
                </div>
              )}
            </div>

            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {job.description}
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              {job.skills.slice(0, 5).map((skill, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {job.skills.length > 5 && (
                <Badge variant="outline" className="text-xs">
                  +{job.skills.length - 5} more
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {job.views} views
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {job.applicationsCount} applications
              </div>
              <div>
                Posted {new Date(job.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>

          <div className="flex gap-2 ml-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onEdit(job)}
              data-testid={`button-edit-job-${job.id}`}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => onDelete(job.id)}
              data-testid={`button-delete-job-${job.id}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
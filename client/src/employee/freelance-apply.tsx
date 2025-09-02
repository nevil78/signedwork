import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, DollarSign, Clock, Lightbulb } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import EmployeeNavHeader from "@/components/employee-nav-header";
import { Link } from "wouter";

const proposalSchema = z.object({
  coverLetter: z.string().min(100, "Cover letter must be at least 100 characters").max(2000, "Cover letter must be less than 2000 characters"),
  proposedRate: z.number().min(10, "Rate must be at least $10"),
  rateType: z.string().min(1, "Please select a rate type"),
  estimatedDuration: z.string().min(1, "Please provide an estimated duration"),
});

type ProposalFormData = z.infer<typeof proposalSchema>;

interface FreelanceProject {
  id: string;
  projectId: string;
  title: string;
  description: string;
  budgetMin: number;
  budgetMax: number;
  projectType: string;
  skills: string[];
}

export default function FreelanceApply() {
  const [match, params] = useRoute("/employee/freelance/projects/:projectId/apply");
  const [, setLocation] = useLocation();
  const projectId = params?.projectId;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch project details
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: [`/api/freelance/projects/${projectId}`],
    enabled: !!projectId,
  });

  // Check if user has already applied
  const { data: myProposals = [] } = useQuery({
    queryKey: ["/api/employee/proposals"],
  });

  const form = useForm<ProposalFormData>({
    resolver: zodResolver(proposalSchema),
    defaultValues: {
      coverLetter: "",
      proposedRate: project?.budgetMin || 50,
      rateType: project?.projectType === "hourly" ? "hour" : "fixed",
      estimatedDuration: "",
    },
  });

  const submitProposalMutation = useMutation({
    mutationFn: async (data: ProposalFormData) => {
      const response = await fetch(`/api/freelance/projects/${projectId}/proposals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to submit proposal");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employee/proposals"] });
      toast({
        title: "Proposal submitted successfully!",
        description: "Your proposal has been sent to the client. They will review it and get back to you.",
      });
      setLocation(`/employee/freelance/projects/${projectId}`);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit proposal",
        variant: "destructive",
      });
    },
  });

  if (!match || !projectId) {
    return <div>Project not found</div>;
  }

  if (projectLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <EmployeeNavHeader />
        <div className="max-w-4xl mx-auto p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-300 rounded w-1/3"></div>
            <div className="h-32 bg-gray-300 rounded"></div>
            <div className="h-64 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50">
        <EmployeeNavHeader />
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Project not found</h1>
            <p className="text-gray-600 mb-6">The project you're trying to apply to doesn't exist.</p>
            <Link href="/employee/freelance/projects">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Projects
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const hasApplied = myProposals.some((proposal: any) => proposal.projectId === projectId);

  if (hasApplied) {
    return (
      <div className="min-h-screen bg-gray-50">
        <EmployeeNavHeader />
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Already Applied</h1>
            <p className="text-gray-600 mb-6">You have already submitted a proposal for this project.</p>
            <div className="flex gap-4 justify-center">
              <Link href={`/employee/freelance/projects/${projectId}`}>
                <Button variant="outline">
                  View Project
                </Button>
              </Link>
              <Link href="/employee/freelance/projects">
                <Button>
                  Browse More Projects
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const onSubmit = (data: ProposalFormData) => {
    submitProposalMutation.mutate(data);
  };

  const suggestedRate = project.projectType === "hourly" 
    ? Math.round((project.budgetMin + project.budgetMax) / 2 / 40) // Assuming 40 hours for fixed projects
    : Math.round((project.budgetMin + project.budgetMax) / 2);

  return (
    <div className="min-h-screen bg-gray-50">
      <EmployeeNavHeader />
      
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href={`/employee/freelance/projects/${projectId}`}>
            <Button variant="outline" size="sm" data-testid="button-back">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Project
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900" data-testid="page-title">
              Apply for Project
            </h1>
            <p className="text-gray-600 mt-1">
              Submit your proposal for "{project.title}"
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Application Form */}
          <div className="lg:col-span-2">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Cover Letter */}
                <Card>
                  <CardHeader>
                    <CardTitle>Cover Letter</CardTitle>
                    <CardDescription>
                      Introduce yourself and explain why you're the perfect fit for this project
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="coverLetter"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea 
                              placeholder={`Hi there!\n\nI'm excited about your ${project.title} project. Here's why I'm the perfect fit:\n\n• I have [X years] of experience in [relevant skills]\n• I've successfully completed similar projects including [examples]\n• I understand your requirements and can deliver [specific outcomes]\n\nI'd love to discuss your project in more detail. When would be a good time for a quick call?\n\nBest regards,\n[Your name]`}
                              className="min-h-[200px]"
                              {...field}
                              data-testid="textarea-cover-letter"
                            />
                          </FormControl>
                          <FormDescription>
                            Write a personalized message that shows you understand the project requirements
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Pricing */}
                <Card>
                  <CardHeader>
                    <CardTitle>Your Proposal</CardTitle>
                    <CardDescription>Set your rate and timeline for this project</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="proposedRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Your Rate</FormLabel>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="10"
                                  placeholder={suggestedRate.toString()}
                                  className="pl-10"
                                  {...field}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                  data-testid="input-rate"
                                />
                              </FormControl>
                            </div>
                            <FormDescription>
                              Suggested: ${suggestedRate.toLocaleString()}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="rateType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Rate Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-rate-type">
                                  <SelectValue placeholder="Select rate type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="hour">Per Hour</SelectItem>
                                <SelectItem value="fixed">Fixed Price</SelectItem>
                                <SelectItem value="day">Per Day</SelectItem>
                                <SelectItem value="week">Per Week</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="estimatedDuration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estimated Duration</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., 2-3 weeks, 40 hours, 1 month"
                              {...field}
                              data-testid="input-duration"
                            />
                          </FormControl>
                          <FormDescription>
                            How long do you estimate this project will take?
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Submit */}
                <div className="flex justify-end gap-4">
                  <Link href={`/employee/freelance/projects/${projectId}`}>
                    <Button type="button" variant="outline" data-testid="button-cancel">
                      Cancel
                    </Button>
                  </Link>
                  <Button 
                    type="submit" 
                    disabled={submitProposalMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                    data-testid="button-submit-proposal"
                  >
                    {submitProposalMutation.isPending ? "Submitting..." : "Submit Proposal"}
                    <Send className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </form>
            </Form>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Project Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Project Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2" data-testid="project-title-sidebar">
                    {project.title}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-3" data-testid="project-description-sidebar">
                    {project.description}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Budget Range:</span>
                    <span className="font-medium" data-testid="project-budget-sidebar">
                      ${project.budgetMin.toLocaleString()} - ${project.budgetMax.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Project Type:</span>
                    <span className="font-medium" data-testid="project-type-sidebar">
                      {project.projectType}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">Skills Required:</p>
                  <div className="flex flex-wrap gap-1">
                    {project.skills?.slice(0, 6).map((skill: string, index: number) => (
                      <Badge key={index} variant="secondary" className="text-xs" data-testid={`skill-sidebar-${index}`}>
                        {skill}
                      </Badge>
                    ))}
                    {project.skills?.length > 6 && (
                      <Badge variant="secondary" className="text-xs">
                        +{project.skills.length - 6} more
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-500" />
                  Proposal Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <p className="font-medium text-gray-900">Make your proposal stand out:</p>
                  <ul className="space-y-1 text-gray-600">
                    <li>• Be specific about your relevant experience</li>
                    <li>• Ask clarifying questions about the project</li>
                    <li>• Provide examples of similar work</li>
                    <li>• Be realistic with timeline and pricing</li>
                    <li>• Show enthusiasm for the project</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Pricing Guidance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-500" />
                  Pricing Guidance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Client Budget:</span>
                    <span className="font-medium">
                      ${project.budgetMin.toLocaleString()} - ${project.budgetMax.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Suggested Rate:</span>
                    <span className="font-medium text-green-600">
                      ${suggestedRate.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Consider your experience level and the project complexity when setting your rate.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
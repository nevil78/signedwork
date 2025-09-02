import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import EmployeeNavHeader from "@/components/employee-nav-header";
import { 
  DollarSign, 
  Calendar, 
  Clock, 
  User,
  ArrowLeft,
  Send,
  Star,
  MapPin,
  Briefcase,
  Target,
  CheckCircle
} from "lucide-react";

interface FreelanceProject {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: string;
  budgetMin: number;
  budgetMax: number;
  posted_at: string;
  category: string;
  experience_level: string;
  projectType: string;
  skills: string[];
  timeline: string;
}

export default function FreelanceProjectDetails() {
  const [match, params] = useRoute("/employee/freelance/projects/:projectId");
  const projectId = params?.projectId;

  // Fetch project details
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: [`/api/freelance/projects/${projectId}`],
    enabled: !!projectId,
  });

  // Check if user has already applied
  const { data: myProposals = [] } = useQuery({
    queryKey: ["/api/employee/proposals"],
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
            <p className="text-gray-600 mb-6">The project you're looking for doesn't exist or has been removed.</p>
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
  
  const getExperienceBadgeColor = (level: string) => {
    switch (level) {
      case 'entry': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-blue-100 text-blue-800';
      case 'expert': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <EmployeeNavHeader />
      
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/employee/freelance/projects">
              <Button variant="outline" size="sm" data-testid="button-back">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Projects
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900" data-testid="project-title">
                {project.title}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <Badge className={getStatusColor(project.status)} data-testid="project-status">
                  {project.status}
                </Badge>
                <span className="text-gray-600" data-testid="project-id">
                  Project ID: {project.projectId}
                </span>
                <span className="text-gray-600" data-testid="project-posted">
                  Posted {new Date(project.posted_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          
          {project.status === 'active' && (
            <div className="flex gap-3">
              {hasApplied ? (
                <Button disabled className="bg-green-600" data-testid="button-applied">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Applied
                </Button>
              ) : (
                <Link href={`/employee/freelance/projects/${projectId}/apply`}>
                  <Button className="bg-blue-600 hover:bg-blue-700" data-testid="button-apply">
                    <Send className="w-4 h-4 mr-2" />
                    Apply for this Project
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Description */}
            <Card>
              <CardHeader>
                <CardTitle>Project Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed" data-testid="project-description">
                  {project.description}
                </p>
              </CardContent>
            </Card>

            {/* Skills Required */}
            <Card>
              <CardHeader>
                <CardTitle>Skills Required</CardTitle>
                <CardDescription>The client is looking for expertise in these areas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {project.skills?.map((skill: string, index: number) => (
                    <Badge key={index} variant="secondary" className="text-sm" data-testid={`skill-${index}`}>
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Activity & Proposals */}
            <Card>
              <CardHeader>
                <CardTitle>Project Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-900">Project Posted</p>
                      <p className="text-sm text-blue-700">
                        {new Date(project.posted_at).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                  
                  {hasApplied && (
                    <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg" data-testid="application-status">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-900">You Applied</p>
                        <p className="text-sm text-green-700">Your proposal has been submitted</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Project Details */}
            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-semibold text-lg" data-testid="project-budget">
                      ${project.budgetMin.toLocaleString()} - ${project.budgetMax.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">Project Budget</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium" data-testid="project-timeline">{project.timeline}</p>
                    <p className="text-sm text-gray-600">Expected Timeline</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-gray-400" />
                  <div>
                    <Badge className={getExperienceBadgeColor(project.experience_level)} data-testid="project-experience">
                      {project.experience_level}
                    </Badge>
                    <p className="text-sm text-gray-600 mt-1">Experience Level</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Briefcase className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium" data-testid="project-type">{project.projectType}</p>
                    <p className="text-sm text-gray-600">Project Type</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium" data-testid="project-category">{project.category}</p>
                    <p className="text-sm text-gray-600">Category</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Application Tips */}
            <Card>
              <CardHeader>
                <CardTitle>Application Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <p className="text-sm text-gray-700">Highlight relevant experience and skills</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <p className="text-sm text-gray-700">Provide a clear timeline and pricing</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <p className="text-sm text-gray-700">Ask thoughtful questions about the project</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <p className="text-sm text-gray-700">Share examples of similar work</p>
                </div>
              </CardContent>
            </Card>

            {/* Application Action */}
            {project.status === 'active' && !hasApplied && (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-6 text-center">
                  <h3 className="font-semibold text-blue-900 mb-2">Ready to Apply?</h3>
                  <p className="text-sm text-blue-700 mb-4">
                    Submit your proposal and showcase your expertise to win this project.
                  </p>
                  <Link href={`/employee/freelance/projects/${projectId}/apply`}>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700" data-testid="button-apply-cta">
                      <Send className="w-4 h-4 mr-2" />
                      Apply Now
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {hasApplied && (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-6 text-center" data-testid="applied-status">
                  <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-green-900 mb-2">Application Submitted</h3>
                  <p className="text-sm text-green-700">
                    Your proposal has been sent to the client. They will review it and get back to you soon.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
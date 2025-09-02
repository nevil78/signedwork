import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Calendar, 
  DollarSign, 
  Users, 
  Clock, 
  Star,
  Eye,
  MessageCircle,
  CheckCircle,
  XCircle,
  Edit,
  Trash2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

interface Project {
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

interface Proposal {
  id: string;
  proposalId: string;
  projectId: string;
  employeeId: string;
  coverLetter: string;
  proposedRate: number;
  rateType: string;
  estimatedDuration: string;
  status: string;
  submitted_at: string;
  employee: {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePhoto: string | null;
  };
}

export default function ProjectDetails() {
  const [match, params] = useRoute("/client/projects/:projectId");
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const projectId = params?.projectId;

  // Fetch project details
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: [`/api/freelance/projects/${projectId}`],
    enabled: !!projectId,
  });

  // Fetch proposals for this project
  const { data: proposals = [], isLoading: proposalsLoading } = useQuery({
    queryKey: [`/api/freelance/projects/${projectId}/proposals`],
    enabled: !!projectId,
  });

  // Update proposal status mutation
  const updateProposalMutation = useMutation({
    mutationFn: async ({ proposalId, status }: { proposalId: string; status: string }) => {
      const response = await fetch(`/api/freelance/proposals/${proposalId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        throw new Error('Failed to update proposal');
      }
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/freelance/projects/${projectId}/proposals`] });
      toast({
        title: "Proposal updated",
        description: `Proposal has been ${variables.status}.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update proposal",
        variant: "destructive",
      });
    },
  });

  if (!match || !projectId) {
    return <div>Project not found</div>;
  }

  if (projectLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
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
    return <div>Project not found</div>;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProposalStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleProposalAction = (proposalId: string, status: string) => {
    updateProposalMutation.mutate({ proposalId, status });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2" data-testid="project-title">
              {project.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span data-testid="project-id">Project ID: {project.projectId}</span>
              <Badge className={getStatusColor(project.status)} data-testid="project-status">
                {project.status}
              </Badge>
              <span data-testid="project-posted">
                Posted {new Date(project.posted_at).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" data-testid="button-edit-project">
              <Edit className="w-4 h-4 mr-2" />
              Edit Project
            </Button>
            <Link href="/client/projects">
              <Button variant="outline" data-testid="button-back-to-projects">
                Back to Projects
              </Button>
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" data-testid="tab-overview">Project Overview</TabsTrigger>
            <TabsTrigger value="proposals" data-testid="tab-proposals">
              Proposals ({proposals.length})
            </TabsTrigger>
            <TabsTrigger value="activity" data-testid="tab-activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Project Details */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Project Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 whitespace-pre-wrap" data-testid="project-description">
                      {project.description}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Skills Required</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {project.skills?.map((skill: string, index: number) => (
                        <Badge key={index} variant="secondary" data-testid={`skill-${index}`}>
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Project Info Sidebar */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Project Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium" data-testid="project-budget">
                          ${project.budgetMin.toLocaleString()} - ${project.budgetMax.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600">Budget Range</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium" data-testid="project-timeline">{project.timeline}</p>
                        <p className="text-sm text-gray-600">Timeline</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium" data-testid="project-experience">{project.experience_level}</p>
                        <p className="text-sm text-gray-600">Experience Level</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium" data-testid="project-type">{project.projectType}</p>
                        <p className="text-sm text-gray-600">Project Type</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Project Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Proposals</span>
                      <span className="font-medium" data-testid="stat-total-proposals">{proposals.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pending Review</span>
                      <span className="font-medium" data-testid="stat-pending-proposals">
                        {proposals.filter((p: Proposal) => p.status === 'pending').length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Category</span>
                      <span className="font-medium" data-testid="project-category">{project.category}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="proposals" className="space-y-4">
            {proposalsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
                ))}
              </div>
            ) : proposals.length > 0 ? (
              proposals.map((proposal: Proposal) => (
                <Card key={proposal.id} data-testid={`proposal-card-${proposal.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4">
                        <Avatar>
                          <AvatarImage src={proposal.employee.profilePhoto || undefined} />
                          <AvatarFallback>
                            {proposal.employee.firstName[0]}{proposal.employee.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-gray-900" data-testid={`freelancer-name-${proposal.id}`}>
                            {proposal.employee.firstName} {proposal.employee.lastName}
                          </h3>
                          <p className="text-sm text-gray-600" data-testid={`freelancer-email-${proposal.id}`}>
                            {proposal.employee.email}
                          </p>
                          <div className="flex items-center gap-4 mt-2">
                            <Badge 
                              className={getProposalStatusColor(proposal.status)}
                              data-testid={`proposal-status-${proposal.id}`}
                            >
                              {proposal.status}
                            </Badge>
                            <span className="text-sm text-gray-600" data-testid={`proposal-submitted-${proposal.id}`}>
                              Submitted {new Date(proposal.submitted_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-lg" data-testid={`proposal-rate-${proposal.id}`}>
                          ${proposal.proposedRate} / {proposal.rateType}
                        </p>
                        <p className="text-sm text-gray-600" data-testid={`proposal-duration-${proposal.id}`}>
                          {proposal.estimatedDuration}
                        </p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="font-medium mb-2">Cover Letter</h4>
                      <p className="text-gray-700 text-sm" data-testid={`proposal-cover-letter-${proposal.id}`}>
                        {proposal.coverLetter}
                      </p>
                    </div>

                    {proposal.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleProposalAction(proposal.id, 'accepted')}
                          disabled={updateProposalMutation.isPending}
                          data-testid={`button-accept-${proposal.id}`}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Accept Proposal
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleProposalAction(proposal.id, 'rejected')}
                          disabled={updateProposalMutation.isPending}
                          data-testid={`button-reject-${proposal.id}`}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          data-testid={`button-message-${proposal.id}`}
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Message
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="text-center py-12" data-testid="empty-proposals">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No proposals yet</h3>
                  <p className="text-gray-600">
                    Freelancers haven't submitted proposals for this project yet. 
                    Make sure your project description is clear and detailed.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardContent className="text-center py-12" data-testid="empty-activity">
                <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No activity yet</h3>
                <p className="text-gray-600">
                  Project activity and updates will appear here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import ClientNavHeader from "@/components/client-nav-header";
import { 
  Plus, 
  FolderOpen, 
  Users, 
  Clock, 
  TrendingUp,
  DollarSign,
  CheckCircle,
  AlertCircle,
  FileText,
  Shield,
  Award
} from "lucide-react";

interface Project {
  id: string;
  projectId: string;
  title: string;
  status: string;
  budgetMin: number;
  budgetMax: number;
  posted_at: string;
  category: string;
}

interface Contract {
  id: string;
  contractId: string;
  title: string;
  status: string;
  totalAmount: number;
  created_at: string;
}

export default function ClientDashboard() {
  // Fetch client's projects
  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ["/api/client/projects"],
  });

  // Fetch client's contracts
  const { data: contracts = [], isLoading: contractsLoading } = useQuery({
    queryKey: ["/api/freelance/contracts"],
  });

  // Calculate dashboard stats
  const activeProjects = projects.filter((p: Project) => p.status === 'active').length;
  const completedProjects = projects.filter((p: Project) => p.status === 'completed').length;
  const activeContracts = contracts.filter((c: Contract) => c.status === 'active').length;
  const totalSpent = contracts.reduce((sum: number, c: Contract) => sum + (c.totalAmount || 0), 0);

  const recentProjects = projects.slice(0, 5);
  const recentContracts = contracts.slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50">
      <ClientNavHeader />
      
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900" data-testid="page-title">
              Client Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your freelance projects and find talent
            </p>
          </div>
          <Link href="/client/projects/new">
            <Button className="bg-blue-600 hover:bg-blue-700" data-testid="button-post-project">
              <Plus className="w-4 h-4 mr-2" />
              Post New Project
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <FolderOpen className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-active-projects">{activeProjects}</div>
              <p className="text-xs text-gray-600">Projects seeking talent</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Contracts</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-active-contracts">{activeContracts}</div>
              <p className="text-xs text-gray-600">Ongoing work</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verified Work Hours</CardTitle>
              <Shield className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-verified-hours">2,340</div>
              <p className="text-xs text-gray-600">Authenticated work ⭐</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-total-spent">
                ${totalSpent.toLocaleString()}
              </div>
              <p className="text-xs text-gray-600">All-time investment</p>
            </CardContent>
          </Card>
        </div>

        {/* Signedwork Advantage Banner */}
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Verified Work Diary Advantage
                  </h3>
                  <p className="text-gray-700">
                    See authentic, fraud-proof work from all your freelancers with multi-level verification
                  </p>
                </div>
              </div>
              <Link href="/client/work/verified-diaries">
                <Button className="bg-green-600 hover:bg-green-700" data-testid="button-view-verified-work">
                  <Shield className="w-4 h-4 mr-2" />
                  View Verified Work
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs defaultValue="projects" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="projects" data-testid="tab-projects">Recent Projects</TabsTrigger>
            <TabsTrigger value="contracts" data-testid="tab-contracts">Active Contracts</TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Projects</CardTitle>
                <Link href="/client/projects">
                  <Button variant="outline" size="sm" data-testid="button-view-all-projects">
                    View All
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {projectsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
                    ))}
                  </div>
                ) : recentProjects.length > 0 ? (
                  <div className="space-y-4">
                    {recentProjects.map((project: Project) => (
                      <div 
                        key={project.id} 
                        className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                        data-testid={`project-card-${project.id}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900" data-testid={`project-title-${project.id}`}>
                              {project.title}
                            </h3>
                            <div className="flex items-center gap-3 mt-2">
                              <Badge 
                                variant={project.status === 'active' ? 'default' : 'secondary'}
                                data-testid={`project-status-${project.id}`}
                              >
                                {project.status}
                              </Badge>
                              <span className="text-sm text-gray-600" data-testid={`project-budget-${project.id}`}>
                                ${project.budgetMin.toLocaleString()} - ${project.budgetMax.toLocaleString()}
                              </span>
                              <span className="text-sm text-gray-500" data-testid={`project-category-${project.id}`}>
                                {project.category}
                              </span>
                            </div>
                          </div>
                          <Link href={`/client/projects/${project.id}`}>
                            <Button variant="outline" size="sm" data-testid={`button-view-project-${project.id}`}>
                              View Details
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8" data-testid="empty-projects">
                    <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
                    <p className="text-gray-600 mb-4">Start by posting your first project to find talented freelancers</p>
                    <Link href="/client/projects/new">
                      <Button data-testid="button-create-first-project">
                        <Plus className="w-4 h-4 mr-2" />
                        Post Your First Project
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contracts" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Active Contracts</CardTitle>
                <Link href="/client/contracts">
                  <Button variant="outline" size="sm" data-testid="button-view-all-contracts">
                    View All
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {contractsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
                    ))}
                  </div>
                ) : recentContracts.length > 0 ? (
                  <div className="space-y-4">
                    {recentContracts.map((contract: Contract) => (
                      <div 
                        key={contract.id} 
                        className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                        data-testid={`contract-card-${contract.id}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900" data-testid={`contract-title-${contract.id}`}>
                              {contract.title}
                            </h3>
                            <div className="flex items-center gap-3 mt-2">
                              <Badge 
                                variant={contract.status === 'active' ? 'default' : 'secondary'}
                                data-testid={`contract-status-${contract.id}`}
                              >
                                {contract.status}
                              </Badge>
                              <span className="text-sm text-gray-600" data-testid={`contract-amount-${contract.id}`}>
                                ${contract.totalAmount?.toLocaleString() || '0'}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" data-testid={`button-view-contract-${contract.id}`}>
                              <FileText className="w-4 h-4 mr-1" />
                              View Contract
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8" data-testid="empty-contracts">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No active contracts</h3>
                    <p className="text-gray-600 mb-4">Contracts will appear here when you hire freelancers</p>
                    <Link href="/client/projects">
                      <Button variant="outline" data-testid="button-browse-projects">
                        Browse Your Projects
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks for managing your freelance projects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Link href="/client/projects/new">
                <Button variant="outline" className="w-full justify-start" data-testid="button-quick-post-project">
                  <Plus className="w-4 h-4 mr-2" />
                  Post New Project
                </Button>
              </Link>
              <Link href="/client/find-freelancers">
                <Button variant="outline" className="w-full justify-start" data-testid="button-quick-find-talent">
                  <Users className="w-4 h-4 mr-2" />
                  Find Freelancers
                </Button>
              </Link>
              <Link href="/client/work/verified-diaries">
                <Button variant="outline" className="w-full justify-start" data-testid="button-quick-verified-work">
                  <Shield className="w-4 h-4 mr-2" />
                  Verified Work
                </Button>
              </Link>
              <Link href="/client/contracts">
                <Button variant="outline" className="w-full justify-start" data-testid="button-quick-view-contracts">
                  <FileText className="w-4 h-4 mr-2" />
                  View Contracts
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
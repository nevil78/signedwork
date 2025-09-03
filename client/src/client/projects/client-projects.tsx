import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link } from "wouter";
import { 
  Plus, 
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Users,
  Clock,
  DollarSign,
  Star,
  MessageSquare
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ClientNavHeader from "@/components/client-nav-header";

interface Project {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: string;
  budgetMin: number;
  budgetMax: number;
  category: string;
  skillsRequired: string[];
  posted_at: string;
  proposalCount?: number;
  viewCount?: number;
}

export default function ClientProjects() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch client's projects
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["/api/client/projects"],
  });

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      return apiRequest("DELETE", `/api/client/projects/${projectId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client/projects"] });
      toast({ title: "Project deleted successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to delete project", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Filter projects based on search and filters
  const filteredProjects = projects.filter((project: Project) => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || project.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const activeProjects = filteredProjects.filter((p: Project) => p.status === 'active');
  const completedProjects = filteredProjects.filter((p: Project) => p.status === 'completed');
  const draftProjects = filteredProjects.filter((p: Project) => p.status === 'draft');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ClientNavHeader />
      
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900" data-testid="page-title">
              Job Posts and Proposals
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your project postings and review freelancer proposals
            </p>
          </div>
          <Link href="/client/projects/new">
            <Button className="bg-blue-600 hover:bg-blue-700" data-testid="button-post-job">
              <Plus className="w-4 h-4 mr-2" />
              Post a Job
            </Button>
          </Link>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Search and Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="search-projects"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger data-testid="filter-status">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger data-testid="filter-category">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  <SelectItem value="Web Development">Web Development</SelectItem>
                  <SelectItem value="Mobile Development">Mobile Development</SelectItem>
                  <SelectItem value="Design & Creative">Design & Creative</SelectItem>
                  <SelectItem value="Writing & Translation">Writing & Translation</SelectItem>
                  <SelectItem value="Digital Marketing">Digital Marketing</SelectItem>
                  <SelectItem value="Video & Animation">Video & Animation</SelectItem>
                  <SelectItem value="Music & Audio">Music & Audio</SelectItem>
                  <SelectItem value="Business">Business</SelectItem>
                  <SelectItem value="Data">Data</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" className="flex items-center">
                <Filter className="w-4 h-4 mr-2" />
                More Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Projects Tabs */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all" data-testid="tab-all">
              All Projects ({filteredProjects.length})
            </TabsTrigger>
            <TabsTrigger value="active" data-testid="tab-active">
              Active ({activeProjects.length})
            </TabsTrigger>
            <TabsTrigger value="completed" data-testid="tab-completed">
              Completed ({completedProjects.length})
            </TabsTrigger>
            <TabsTrigger value="draft" data-testid="tab-draft">
              Drafts ({draftProjects.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <ProjectsList 
              projects={filteredProjects} 
              isLoading={isLoading}
              onDelete={(id) => deleteProjectMutation.mutate(id)}
              getStatusColor={getStatusColor}
            />
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            <ProjectsList 
              projects={activeProjects} 
              isLoading={isLoading}
              onDelete={(id) => deleteProjectMutation.mutate(id)}
              getStatusColor={getStatusColor}
            />
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            <ProjectsList 
              projects={completedProjects} 
              isLoading={isLoading}
              onDelete={(id) => deleteProjectMutation.mutate(id)}
              getStatusColor={getStatusColor}
            />
          </TabsContent>

          <TabsContent value="draft" className="space-y-4">
            <ProjectsList 
              projects={draftProjects} 
              isLoading={isLoading}
              onDelete={(id) => deleteProjectMutation.mutate(id)}
              getStatusColor={getStatusColor}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

interface ProjectsListProps {
  projects: Project[];
  isLoading: boolean;
  onDelete: (id: string) => void;
  getStatusColor: (status: string) => string;
}

function ProjectsList({ projects, isLoading, onDelete, getStatusColor }: ProjectsListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="h-6 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                <div className="flex space-x-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
          <p className="text-gray-600 mb-4">Get started by posting your first job</p>
          <Link href="/client/projects/new">
            <Button data-testid="button-create-first-project">
              <Plus className="w-4 h-4 mr-2" />
              Post Your First Job
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {projects.map((project: Project) => (
        <Card key={project.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900" data-testid={`project-title-${project.id}`}>
                    {project.title}
                  </h3>
                  <Badge className={getStatusColor(project.status)} data-testid={`project-status-${project.id}`}>
                    {project.status}
                  </Badge>
                </div>
                
                <p className="text-gray-600 mb-3 line-clamp-2" data-testid={`project-description-${project.id}`}>
                  {project.description}
                </p>
                
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    <span data-testid={`project-budget-${project.id}`}>
                      ${project.budgetMin.toLocaleString()} - ${project.budgetMax.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span data-testid={`project-proposals-${project.id}`}>
                      {project.proposalCount || 0} proposals
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    <span data-testid={`project-views-${project.id}`}>
                      {project.viewCount || 0} views
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span data-testid={`project-posted-${project.id}`}>
                      Posted {new Date(project.posted_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {project.skillsRequired && project.skillsRequired.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {project.skillsRequired.slice(0, 3).map((skill, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {project.skillsRequired.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{project.skillsRequired.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 ml-4">
                <Link href={`/client/projects/${project.id}`}>
                  <Button variant="outline" size="sm" data-testid={`button-view-project-${project.id}`}>
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                </Link>
                <Link href={`/client/projects/${project.id}/edit`}>
                  <Button variant="outline" size="sm" data-testid={`button-edit-project-${project.id}`}>
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-red-600 hover:text-red-700"
                  onClick={() => onDelete(project.id)}
                  data-testid={`button-delete-project-${project.id}`}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
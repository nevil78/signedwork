import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import EmployeeNavHeader from "@/components/employee-nav-header";
import { 
  Search, 
  Filter,
  DollarSign,
  Calendar,
  Clock,
  Star,
  Eye,
  Send,
  Briefcase,
  MapPin,
  User
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

export default function FreelanceProjects() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [experienceFilter, setExperienceFilter] = useState("all");
  const [budgetFilter, setBudgetFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("browse");

  // Fetch available freelance projects for employees
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["/api/freelance/projects"],
  });

  // Fetch employee's proposals
  const { data: myProposals = [], isLoading: proposalsLoading } = useQuery({
    queryKey: ["/api/employee/proposals"],
  });

  // Filter projects
  const filteredProjects = projects.filter((project: FreelanceProject) => {
    const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.skills?.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === "all" || project.category === categoryFilter;
    const matchesExperience = experienceFilter === "all" || project.experience_level === experienceFilter;
    
    let matchesBudget = true;
    if (budgetFilter !== "all") {
      const budget = project.budgetMax;
      switch (budgetFilter) {
        case "under-500":
          matchesBudget = budget < 500;
          break;
        case "500-2000":
          matchesBudget = budget >= 500 && budget <= 2000;
          break;
        case "2000-5000":
          matchesBudget = budget >= 2000 && budget <= 5000;
          break;
        case "over-5000":
          matchesBudget = budget > 5000;
          break;
      }
    }
    
    return matchesSearch && matchesCategory && matchesExperience && matchesBudget;
  });

  const getExperienceBadgeColor = (level: string) => {
    switch (level) {
      case 'entry': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-blue-100 text-blue-800';
      case 'expert': return 'bg-purple-100 text-purple-800';
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

  return (
    <div className="min-h-screen bg-gray-50">
      <EmployeeNavHeader />
      
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900" data-testid="page-title">
              Freelance Projects
            </h1>
            <p className="text-gray-600 mt-1">
              Discover and apply to freelance opportunities
            </p>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="browse" data-testid="tab-browse">
              Browse Projects ({filteredProjects.length})
            </TabsTrigger>
            <TabsTrigger value="my-proposals" data-testid="tab-my-proposals">
              My Proposals ({myProposals.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Find Your Perfect Project</CardTitle>
                <CardDescription>Filter projects by your skills and preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search projects, skills..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                      data-testid="input-search"
                    />
                  </div>
                  
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger data-testid="select-category">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="web-development">Web Development</SelectItem>
                      <SelectItem value="mobile-development">Mobile Development</SelectItem>
                      <SelectItem value="design">Design</SelectItem>
                      <SelectItem value="writing">Writing</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="data-science">Data Science</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={experienceFilter} onValueChange={setExperienceFilter}>
                    <SelectTrigger data-testid="select-experience">
                      <SelectValue placeholder="Experience Level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="entry">Entry Level</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={budgetFilter} onValueChange={setBudgetFilter}>
                    <SelectTrigger data-testid="select-budget">
                      <SelectValue placeholder="Budget Range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Budgets</SelectItem>
                      <SelectItem value="under-500">Under $500</SelectItem>
                      <SelectItem value="500-2000">$500 - $2,000</SelectItem>
                      <SelectItem value="2000-5000">$2,000 - $5,000</SelectItem>
                      <SelectItem value="over-5000">Over $5,000</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Projects List */}
            <div className="space-y-4">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-40 bg-gray-200 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : filteredProjects.length > 0 ? (
                filteredProjects.map((project: FreelanceProject) => (
                  <Card key={project.id} className="hover:shadow-lg transition-shadow cursor-pointer" data-testid={`project-card-${project.id}`}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-gray-900 mb-2" data-testid={`project-title-${project.id}`}>
                            {project.title}
                          </h3>
                          <p className="text-gray-600 line-clamp-3 mb-4" data-testid={`project-description-${project.id}`}>
                            {project.description}
                          </p>
                          
                          <div className="flex flex-wrap gap-2 mb-4">
                            {project.skills?.slice(0, 5).map((skill, index) => (
                              <Badge key={index} variant="secondary" className="text-xs" data-testid={`skill-${project.id}-${index}`}>
                                {skill}
                              </Badge>
                            ))}
                            {project.skills?.length > 5 && (
                              <Badge variant="secondary" className="text-xs">
                                +{project.skills.length - 5} more
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-6 text-sm text-gray-600">
                            <div className="flex items-center gap-1" data-testid={`project-budget-${project.id}`}>
                              <DollarSign className="w-4 h-4" />
                              ${project.budgetMin.toLocaleString()} - ${project.budgetMax.toLocaleString()}
                            </div>
                            <div className="flex items-center gap-1" data-testid={`project-timeline-${project.id}`}>
                              <Clock className="w-4 h-4" />
                              {project.timeline}
                            </div>
                            <div className="flex items-center gap-1" data-testid={`project-posted-${project.id}`}>
                              <Calendar className="w-4 h-4" />
                              {new Date(project.posted_at).toLocaleDateString()}
                            </div>
                            <Badge 
                              className={getExperienceBadgeColor(project.experience_level)}
                              data-testid={`project-experience-${project.id}`}
                            >
                              {project.experience_level}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 ml-4">
                          <Link href={`/employee/freelance/projects/${project.id}`}>
                            <Button size="sm" data-testid={`button-view-details-${project.id}`}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </Button>
                          </Link>
                          <Link href={`/employee/freelance/projects/${project.id}/apply`}>
                            <Button variant="outline" size="sm" data-testid={`button-apply-${project.id}`}>
                              <Send className="w-4 h-4 mr-2" />
                              Apply Now
                            </Button>
                          </Link>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-4 h-4" />
                            {project.category}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {project.projectType}
                          </span>
                        </div>
                        <Badge variant="secondary" data-testid={`project-id-${project.id}`}>
                          {project.projectId}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="text-center py-12" data-testid="empty-projects">
                    <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {searchQuery || categoryFilter !== "all" || experienceFilter !== "all" || budgetFilter !== "all"
                        ? "No projects match your filters"
                        : "No freelance projects available"
                      }
                    </h3>
                    <p className="text-gray-600 mb-6">
                      {searchQuery || categoryFilter !== "all" || experienceFilter !== "all" || budgetFilter !== "all"
                        ? "Try adjusting your filters to see more projects"
                        : "Check back later for new freelance opportunities"
                      }
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="my-proposals" className="space-y-4">
            {proposalsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-gray-200 rounded animate-pulse" />
                ))}
              </div>
            ) : myProposals.length > 0 ? (
              myProposals.map((proposal: any) => (
                <Card key={proposal.id} data-testid={`proposal-card-${proposal.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-2" data-testid={`proposal-project-${proposal.id}`}>
                          Project: {proposal.projectId}
                        </h3>
                        <div className="flex items-center gap-4 mb-3">
                          <Badge 
                            className={getProposalStatusColor(proposal.status)}
                            data-testid={`proposal-status-${proposal.id}`}
                          >
                            {proposal.status}
                          </Badge>
                          <span className="text-sm text-gray-600" data-testid={`proposal-rate-${proposal.id}`}>
                            ${proposal.proposedRate} / {proposal.rateType}
                          </span>
                          <span className="text-sm text-gray-600" data-testid={`proposal-submitted-${proposal.id}`}>
                            Submitted {new Date(proposal.submitted_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm line-clamp-2" data-testid={`proposal-cover-letter-${proposal.id}`}>
                          {proposal.coverLetter}
                        </p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button variant="outline" size="sm" data-testid={`button-view-proposal-${proposal.id}`}>
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="text-center py-12" data-testid="empty-proposals">
                  <Send className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No proposals yet</h3>
                  <p className="text-gray-600 mb-6">
                    Start applying to projects to build your freelance portfolio
                  </p>
                  <Button onClick={() => setActiveTab("browse")} data-testid="button-browse-projects">
                    <Search className="w-4 h-4 mr-2" />
                    Browse Projects
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
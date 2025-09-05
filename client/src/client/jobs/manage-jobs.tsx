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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "wouter";
import { 
  Plus, 
  Search,
  Filter,
  Eye,
  Edit,
  Pause,
  Play,
  Trash2,
  Users,
  Clock,
  DollarSign,
  MessageSquare,
  Send,
  CheckCircle,
  AlertCircle,
  Calendar,
  TrendingUp,
  Award
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ClientNavHeader from "@/components/client-nav-header";

interface JobPosting {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  budgetMin: number;
  budgetMax: number;
  proposalCount: number;
  viewCount: number;
  postedAt: string;
  skillsRequired: string[];
  experienceLevel: string;
  projectType: 'fixed_price' | 'hourly';
}

interface JobOffer {
  id: string;
  jobId: string;
  jobTitle: string;
  freelancerId: string;
  freelancer: {
    id: string;
    firstName: string;
    lastName: string;
    profilePhoto?: string;
    hourlyRate: number;
    rating: number;
    verificationLevel: string;
  };
  offerAmount: number;
  message: string;
  status: 'pending' | 'accepted' | 'declined' | 'withdrawn';
  sentAt: string;
  responseAt?: string;
}

export default function ManageJobs() {
  const [activeTab, setActiveTab] = useState("jobs");
  const [jobSearchTerm, setJobSearchTerm] = useState("");
  const [offerSearchTerm, setOfferSearchTerm] = useState("");
  const [jobStatusFilter, setJobStatusFilter] = useState("all");
  const [offerStatusFilter, setOfferStatusFilter] = useState("all");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch job postings
  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ["/api/client/jobs"],
  });

  // Fetch job offers
  const { data: offers = [], isLoading: offersLoading } = useQuery({
    queryKey: ["/api/client/offers"],
  });

  // Job action mutations
  const pauseJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      return apiRequest("PATCH", `/api/client/jobs/${jobId}/pause`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client/jobs"] });
      toast({ title: "Job paused successfully" });
    },
  });

  const deleteJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      return apiRequest("DELETE", `/api/client/jobs/${jobId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client/jobs"] });
      toast({ title: "Job deleted successfully" });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-orange-100 text-orange-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'declined': return 'bg-red-100 text-red-800';
      case 'withdrawn': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'paused': return <Pause className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <AlertCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'accepted': return <CheckCircle className="w-4 h-4" />;
      case 'declined': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  // Mock data for demonstration
  const mockJobs: JobPosting[] = [
    {
      id: "1",
      title: "Build a React E-commerce Website",
      description: "Looking for an experienced React developer to build a modern e-commerce platform with payment integration.",
      category: "Web Development",
      status: "active",
      budgetMin: 2000,
      budgetMax: 5000,
      proposalCount: 12,
      viewCount: 89,
      postedAt: "2024-01-15T10:00:00Z",
      skillsRequired: ["React", "Node.js", "MongoDB", "Stripe"],
      experienceLevel: "intermediate",
      projectType: "fixed_price"
    }
  ];

  const mockOffers: JobOffer[] = [
    {
      id: "1",
      jobId: "1",
      jobTitle: "UI/UX Design for Mobile App",
      freelancerId: "freelancer1",
      freelancer: {
        id: "freelancer1",
        firstName: "Sarah",
        lastName: "Johnson",
        profilePhoto: "",
        hourlyRate: 45,
        rating: 4.9,
        verificationLevel: "verified"
      },
      offerAmount: 3500,
      message: "I'd love to work on your e-commerce project. I have 5+ years of experience building similar platforms.",
      status: "pending",
      sentAt: "2024-01-16T14:30:00Z"
    }
  ];

  const filteredJobs = mockJobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(jobSearchTerm.toLowerCase());
    const matchesStatus = jobStatusFilter === "all" || job.status === jobStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredOffers = mockOffers.filter(offer => {
    const matchesSearch = offer.jobTitle.toLowerCase().includes(offerSearchTerm.toLowerCase()) ||
                         `${offer.freelancer.firstName} ${offer.freelancer.lastName}`.toLowerCase().includes(offerSearchTerm.toLowerCase());
    const matchesStatus = offerStatusFilter === "all" || offer.status === offerStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeJobs = filteredJobs.filter(job => job.status === 'active');
  const pausedJobs = filteredJobs.filter(job => job.status === 'paused');
  const completedJobs = filteredJobs.filter(job => job.status === 'completed');

  const pendingOffers = filteredOffers.filter(offer => offer.status === 'pending');
  const acceptedOffers = filteredOffers.filter(offer => offer.status === 'accepted');
  const declinedOffers = filteredOffers.filter(offer => offer.status === 'declined');

  return (
    <div className="min-h-screen bg-gray-50">
      <ClientNavHeader />
      
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900" data-testid="page-title">
              Manage Jobs & Offers
            </h1>
            <p className="text-gray-600 mt-1">
              Oversee your job postings and track offers to freelancers
            </p>
          </div>
          <Link href="/client/projects/new">
            <Button className="bg-blue-600 hover:bg-blue-700" data-testid="button-post-new-job">
              <Plus className="w-4 h-4 mr-2" />
              Post New Job
            </Button>
          </Link>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-active-jobs">{activeJobs.length}</div>
              <p className="text-xs text-gray-600">Currently recruiting</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Proposals</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-total-proposals">
                {filteredJobs.reduce((sum, job) => sum + job.proposalCount, 0)}
              </div>
              <p className="text-xs text-gray-600">Across all jobs</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Offers</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-pending-offers">{pendingOffers.length}</div>
              <p className="text-xs text-gray-600">Awaiting response</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <Award className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-success-rate">94%</div>
              <p className="text-xs text-gray-600">Offer acceptance rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="jobs" data-testid="tab-jobs">
              Job Postings ({filteredJobs.length})
            </TabsTrigger>
            <TabsTrigger value="offers" data-testid="tab-offers">
              Your Offers ({filteredOffers.length})
            </TabsTrigger>
          </TabsList>

          {/* Job Postings Tab */}
          <TabsContent value="jobs" className="space-y-6">
            {/* Search and Filters for Jobs */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Search Job Postings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search jobs..."
                      value={jobSearchTerm}
                      onChange={(e) => setJobSearchTerm(e.target.value)}
                      className="pl-10"
                      data-testid="search-jobs"
                    />
                  </div>
                  
                  <Select value={jobStatusFilter} onValueChange={setJobStatusFilter}>
                    <SelectTrigger data-testid="filter-job-status">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button variant="outline" className="flex items-center">
                    <Filter className="w-4 h-4 mr-2" />
                    More Filters
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Job Listings */}
            <div className="space-y-4">
              {filteredJobs.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Plus className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No job postings yet</h3>
                    <p className="text-gray-600 mb-4">Start by posting your first job to find talented freelancers</p>
                    <Link href="/client/projects/new">
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Post Your First Job
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                filteredJobs.map((job) => (
                  <Card key={job.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900" data-testid={`job-title-${job.id}`}>
                              {job.title}
                            </h3>
                            <Badge className={`${getStatusColor(job.status)} flex items-center gap-1`}>
                              {getStatusIcon(job.status)}
                              {job.status}
                            </Badge>
                          </div>
                          
                          <p className="text-gray-600 mb-3 line-clamp-2">{job.description}</p>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div>
                              <p className="text-sm text-gray-500">Budget</p>
                              <p className="font-medium">${job.budgetMin.toLocaleString()} - ${job.budgetMax.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Proposals</p>
                              <p className="font-medium flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {job.proposalCount}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Views</p>
                              <p className="font-medium flex items-center gap-1">
                                <Eye className="w-4 h-4" />
                                {job.viewCount}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Posted</p>
                              <p className="font-medium flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(job.postedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {job.skillsRequired.slice(0, 3).map((skill, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                            {job.skillsRequired.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{job.skillsRequired.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          <Link href={`/client/jobs/${job.id}`}>
                            <Button variant="outline" size="sm" data-testid={`button-view-job-${job.id}`}>
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </Link>
                          <Link href={`/client/jobs/${job.id}/edit`}>
                            <Button variant="outline" size="sm" data-testid={`button-edit-job-${job.id}`}>
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                          </Link>
                          {job.status === 'active' ? (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => pauseJobMutation.mutate(job.id)}
                              data-testid={`button-pause-job-${job.id}`}
                            >
                              <Pause className="w-4 h-4 mr-1" />
                              Pause
                            </Button>
                          ) : job.status === 'paused' ? (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => pauseJobMutation.mutate(job.id)}
                              data-testid={`button-resume-job-${job.id}`}
                            >
                              <Play className="w-4 h-4 mr-1" />
                              Resume
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Job Offers Tab */}
          <TabsContent value="offers" className="space-y-6">
            {/* Search and Filters for Offers */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Search Your Offers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search offers..."
                      value={offerSearchTerm}
                      onChange={(e) => setOfferSearchTerm(e.target.value)}
                      className="pl-10"
                      data-testid="search-offers"
                    />
                  </div>
                  
                  <Select value={offerStatusFilter} onValueChange={setOfferStatusFilter}>
                    <SelectTrigger data-testid="filter-offer-status">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="declined">Declined</SelectItem>
                      <SelectItem value="withdrawn">Withdrawn</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button variant="outline" className="flex items-center">
                    <Filter className="w-4 h-4 mr-2" />
                    More Filters
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Offers Listing */}
            <div className="space-y-4">
              {filteredOffers.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Send className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No offers sent yet</h3>
                    <p className="text-gray-600 mb-4">Browse freelancers and send direct offers to top talent</p>
                    <Link href="/client/find-freelancers">
                      <Button>
                        <Users className="w-4 h-4 mr-2" />
                        Find Freelancers
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                filteredOffers.map((offer) => (
                  <Card key={offer.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={offer.freelancer.profilePhoto} />
                            <AvatarFallback>
                              {offer.freelancer.firstName[0]}{offer.freelancer.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-gray-900">
                                {offer.freelancer.firstName} {offer.freelancer.lastName}
                              </h3>
                              <Badge className={getStatusColor(offer.status)}>
                                {offer.status}
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-2">
                              Project: <span className="font-medium">{offer.jobTitle}</span>
                            </p>
                            
                            <p className="text-gray-700 mb-3">{offer.message}</p>
                            
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="text-gray-500">Offer Amount</p>
                                <p className="font-medium">${offer.offerAmount.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Hourly Rate</p>
                                <p className="font-medium">${offer.freelancer.hourlyRate}/hr</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Sent</p>
                                <p className="font-medium">{new Date(offer.sentAt).toLocaleDateString()}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" data-testid={`button-message-${offer.id}`}>
                            <MessageSquare className="w-4 h-4 mr-1" />
                            Message
                          </Button>
                          <Link href={`/freelancers/${offer.freelancerId}`}>
                            <Button variant="outline" size="sm" data-testid={`button-view-profile-${offer.id}`}>
                              <Eye className="w-4 h-4 mr-1" />
                              View Profile
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
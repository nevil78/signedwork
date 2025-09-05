import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Heart,
  Search,
  Filter,
  Star,
  MapPin,
  Clock,
  DollarSign,
  Shield,
  MessageSquare,
  Eye,
  TrendingUp,
  Users,
  Award,
  X,
  Send,
  Bookmark,
  Calendar,
  Globe
} from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ClientNavHeader from "@/components/client-nav-header";

interface SavedTalent {
  id: string;
  freelancerId: string;
  employeeId: string;
  freelancer: {
    id: string;
    firstName: string;
    lastName: string;
    profilePhoto?: string;
    title: string;
    description: string;
    hourlyRate: number;
    rating: number;
    totalReviews: number;
    completedJobs: number;
    totalEarnings: number;
    location: string;
    verificationLevel: 'verified' | 'company_verified' | 'basic';
    verifiedWorkHours: number;
    responseTime: string;
    successRate: number;
    availability: 'available' | 'busy' | 'unavailable';
    isOnline: boolean;
    lastActive: string;
    portfolioItems: number;
    languages: string[];
    experienceYears: number;
    specializations: string[];
  };
  skills: string[];
  savedAt: string;
  savedReason: string;
  notes?: string;
  tags: string[];
  priority: 'high' | 'medium' | 'low';
  hasMessagedBefore: boolean;
  lastContactedAt?: string;
}

export default function SavedTalent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [skillFilter, setSkillFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [verificationFilter, setVerificationFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch saved talent
  const { data: savedTalent = [], isLoading } = useQuery({
    queryKey: ["/api/client/saved-talent", { 
      search: searchTerm, 
      skill: skillFilter, 
      availability: availabilityFilter,
      verification: verificationFilter,
      priority: priorityFilter,
      sort: sortBy
    }],
  });

  // Remove from saved mutation
  const removeSavedMutation = useMutation({
    mutationFn: async (freelancerId: string) => {
      return apiRequest("DELETE", `/api/client/saved-talent/${freelancerId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client/saved-talent"] });
      toast({ title: "Removed from saved talent" });
    },
  });

  // Update priority mutation
  const updatePriorityMutation = useMutation({
    mutationFn: async ({ freelancerId, priority }: { freelancerId: string; priority: string }) => {
      return apiRequest("PATCH", `/api/client/saved-talent/${freelancerId}`, { priority });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client/saved-talent"] });
      toast({ title: "Priority updated" });
    },
  });

  // Mock data for demonstration
  const mockSavedTalent: SavedTalent[] = [
    {
      id: "1",
      freelancerId: "freelancer1",
      employeeId: "EMP-ABC123",
      freelancer: {
        id: "freelancer1",
        firstName: "Sarah",
        lastName: "Johnson",
        profilePhoto: "",
        title: "Senior React Developer & UI/UX Designer",
        description: "Full-stack developer with 6+ years of experience building scalable web applications. Specialized in React, Node.js, and cloud technologies.",
        hourlyRate: 85,
        rating: 4.9,
        totalReviews: 47,
        completedJobs: 152,
        totalEarnings: 125000,
        location: "San Francisco, CA",
        verificationLevel: "verified",
        verifiedWorkHours: 2340,
        responseTime: "1 hour",
        successRate: 98,
        availability: "available",
        isOnline: true,
        lastActive: "2 hours ago",
        portfolioItems: 12,
        languages: ["English", "Spanish"],
        experienceYears: 6,
        specializations: ["E-commerce", "SaaS", "Fintech"]
      },
      skills: ["React", "Node.js", "TypeScript", "AWS", "UI/UX Design", "PostgreSQL"],
      savedAt: "2024-01-15T10:30:00Z",
      savedReason: "Excellent portfolio and reviews",
      notes: "Great fit for upcoming e-commerce project",
      tags: ["React Expert", "UI/UX", "Available"],
      priority: "high",
      hasMessagedBefore: false
    },
    {
      id: "2",
      freelancerId: "freelancer2",
      employeeId: "EMP-DEF456",
      freelancer: {
        id: "freelancer2",
        firstName: "Michael",
        lastName: "Chen",
        profilePhoto: "",
        title: "Mobile App Developer (iOS & Android)",
        description: "Native and cross-platform mobile developer with expertise in React Native, Swift, and Kotlin. Built 20+ apps with 500K+ downloads.",
        hourlyRate: 95,
        rating: 4.8,
        totalReviews: 63,
        completedJobs: 89,
        totalEarnings: 180000,
        location: "Toronto, ON",
        verificationLevel: "company_verified",
        verifiedWorkHours: 1890,
        responseTime: "30 minutes",
        successRate: 97,
        availability: "busy",
        isOnline: false,
        lastActive: "1 hour ago",
        portfolioItems: 8,
        languages: ["English", "Mandarin"],
        experienceYears: 8,
        specializations: ["Fintech", "Healthcare", "Gaming"]
      },
      skills: ["React Native", "iOS", "Android", "Swift", "Kotlin", "Firebase"],
      savedAt: "2024-01-10T14:20:00Z",
      savedReason: "Top mobile developer",
      notes: "Consider for mobile app project next quarter",
      tags: ["Mobile Expert", "iOS", "Android"],
      priority: "medium",
      hasMessagedBefore: true,
      lastContactedAt: "2024-01-12T10:00:00Z"
    }
  ];

  const getVerificationBadge = (level: string) => {
    switch (level) {
      case 'verified':
        return (
          <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
            <Shield className="w-3 h-3" />
            Verified ⭐⭐⭐
          </Badge>
        );
      case 'company_verified':
        return (
          <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1">
            <Award className="w-3 h-3" />
            Company Verified ⭐⭐
          </Badge>
        );
      case 'basic':
        return (
          <Badge className="bg-gray-100 text-gray-800 flex items-center gap-1">
            <Users className="w-3 h-3" />
            Basic ⭐
          </Badge>
        );
      default:
        return null;
    }
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available': return 'text-green-600';
      case 'busy': return 'text-yellow-600';
      case 'unavailable': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredTalent = mockSavedTalent.filter(talent => {
    const matchesSearch = talent.freelancer.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         talent.freelancer.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         talent.freelancer.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         talent.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesSkill = skillFilter === "all" || talent.skills.some(skill => 
      skill.toLowerCase() === skillFilter.toLowerCase()
    );
    const matchesAvailability = availabilityFilter === "all" || talent.freelancer.availability === availabilityFilter;
    const matchesVerification = verificationFilter === "all" || talent.freelancer.verificationLevel === verificationFilter;
    const matchesPriority = priorityFilter === "all" || talent.priority === priorityFilter;
    
    return matchesSearch && matchesSkill && matchesAvailability && matchesVerification && matchesPriority;
  });

  const highPriorityTalent = filteredTalent.filter(t => t.priority === 'high');
  const availableTalent = filteredTalent.filter(t => t.freelancer.availability === 'available');
  const verifiedTalent = filteredTalent.filter(t => t.freelancer.verificationLevel === 'verified');

  return (
    <div className="min-h-screen bg-gray-50">
      <ClientNavHeader />
      
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900" data-testid="page-title">
              Saved Talent
            </h1>
            <p className="text-gray-600 mt-1">
              Your curated list of talented freelancers for future projects
            </p>
          </div>
          <Link href="/client/find-freelancers">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Search className="w-4 h-4 mr-2" />
              Find More Talent
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Saved</CardTitle>
              <Bookmark className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-total-saved">{filteredTalent.length}</div>
              <p className="text-xs text-gray-600">Freelancers saved</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Priority</CardTitle>
              <Heart className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-high-priority">{highPriorityTalent.length}</div>
              <p className="text-xs text-gray-600">Top candidates</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Now</CardTitle>
              <Clock className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-available">{availableTalent.length}</div>
              <p className="text-xs text-gray-600">Ready to work</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verified</CardTitle>
              <Shield className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-verified">{verifiedTalent.length}</div>
              <p className="text-xs text-gray-600">Fully verified</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filter Saved Talent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search saved talent..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="search-talent"
                />
              </div>
              
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger data-testid="filter-priority">
                  <SelectValue placeholder="All priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="high">High Priority</SelectItem>
                  <SelectItem value="medium">Medium Priority</SelectItem>
                  <SelectItem value="low">Low Priority</SelectItem>
                </SelectContent>
              </Select>

              <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                <SelectTrigger data-testid="filter-availability">
                  <SelectValue placeholder="All availability" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Availability</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="busy">Busy</SelectItem>
                  <SelectItem value="unavailable">Unavailable</SelectItem>
                </SelectContent>
              </Select>

              <Select value={verificationFilter} onValueChange={setVerificationFilter}>
                <SelectTrigger data-testid="filter-verification">
                  <SelectValue placeholder="All verification" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="verified">Fully Verified</SelectItem>
                  <SelectItem value="company_verified">Company Verified</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger data-testid="sort-by">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Recently Saved</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="availability">Available First</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" className="flex items-center">
                <Filter className="w-4 h-4 mr-2" />
                Advanced
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Talent List */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse" />
                        <div className="space-y-2 flex-1">
                          <div className="h-5 bg-gray-200 rounded animate-pulse w-1/3" />
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4" />
                        </div>
                      </div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-full" />
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredTalent.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Bookmark className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No saved talent yet</h3>
                <p className="text-gray-600 mb-4">Start saving talented freelancers to build your dream team</p>
                <Link href="/client/find-freelancers">
                  <Button>
                    <Search className="w-4 h-4 mr-2" />
                    Find Freelancers
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            filteredTalent.map((talent) => (
              <Card key={talent.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-6">
                    {/* Profile Section */}
                    <div className="flex-shrink-0 relative">
                      <Avatar className="w-20 h-20">
                        <AvatarImage src={talent.freelancer.profilePhoto} />
                        <AvatarFallback className="text-lg">
                          {talent.freelancer.firstName[0]}{talent.freelancer.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      {talent.freelancer.isOnline && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      )}
                      <div className={`text-center text-sm mt-2 font-medium ${getAvailabilityColor(talent.freelancer.availability)}`}>
                        {talent.freelancer.availability}
                      </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-semibold text-gray-900" data-testid={`talent-name-${talent.id}`}>
                              {talent.freelancer.firstName} {talent.freelancer.lastName}
                            </h3>
                            {getVerificationBadge(talent.freelancer.verificationLevel)}
                            <Badge className={getPriorityColor(talent.priority)}>
                              {talent.priority} priority
                            </Badge>
                          </div>
                          <p className="text-lg text-gray-700 font-medium">{talent.freelancer.title}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-600">{talent.freelancer.location}</span>
                            </div>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-600">ID: {talent.employeeId}</span>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-600">Saved {new Date(talent.savedAt).toLocaleDateString()}</span>
                            {talent.freelancer.isOnline && (
                              <>
                                <span className="text-gray-400">•</span>
                                <span className="text-green-600 flex items-center gap-1">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  Online
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">${talent.freelancer.hourlyRate}/hr</div>
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="font-medium">{talent.freelancer.rating}</span>
                            <span className="text-gray-600">({talent.freelancer.totalReviews} reviews)</span>
                          </div>
                        </div>
                      </div>

                      <p className="text-gray-700 mb-4" data-testid={`talent-description-${talent.id}`}>
                        {talent.freelancer.description}
                      </p>

                      {/* Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                        <div>
                          <p className="text-gray-500">Completed Jobs</p>
                          <p className="font-medium">{talent.freelancer.completedJobs}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Total Earned</p>
                          <p className="font-medium">${talent.freelancer.totalEarnings.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Success Rate</p>
                          <p className="font-medium">{talent.freelancer.successRate}%</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Response Time</p>
                          <p className="font-medium">{talent.freelancer.responseTime}</p>
                        </div>
                      </div>

                      {/* Skills */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {talent.skills.slice(0, 6).map((skill, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {talent.skills.length > 6 && (
                          <Badge variant="secondary" className="text-xs">
                            +{talent.skills.length - 6} more
                          </Badge>
                        )}
                      </div>

                      {/* Tags */}
                      {talent.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {talent.tags.map((tag, index) => (
                            <Badge key={index} className="bg-blue-100 text-blue-800 text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Notes and Reason */}
                      <div className="bg-gray-50 rounded-lg p-3 mb-4">
                        <p className="text-sm text-gray-700">
                          <strong>Saved for:</strong> {talent.savedReason}
                        </p>
                        {talent.notes && (
                          <p className="text-sm text-gray-600 mt-1">
                            <strong>Notes:</strong> {talent.notes}
                          </p>
                        )}
                      </div>

                      {/* Signedwork Verification */}
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                        <div className="flex items-center gap-2 text-green-800 text-sm font-medium">
                          <Shield className="w-4 h-4" />
                          Verified Portfolio Advantage
                        </div>
                        <p className="text-green-700 text-sm mt-1">
                          {talent.freelancer.verifiedWorkHours} hours of authenticated work with fraud-proof verification. 
                          {talent.freelancer.portfolioItems} verified portfolio items available for review.
                        </p>
                      </div>

                      {/* Last Contact */}
                      {talent.hasMessagedBefore && talent.lastContactedAt && (
                        <p className="text-sm text-gray-600">
                          Last contacted: {new Date(talent.lastContactedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <Select value={talent.priority} onValueChange={(value) => 
                        updatePriorityMutation.mutate({ freelancerId: talent.freelancerId, priority: value })
                      }>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">High Priority</SelectItem>
                          <SelectItem value="medium">Medium Priority</SelectItem>
                          <SelectItem value="low">Low Priority</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button variant="outline" size="sm" data-testid={`button-message-${talent.id}`}>
                        <MessageSquare className="w-4 h-4 mr-1" />
                        Message
                      </Button>

                      <Link href={`/freelancers/${talent.freelancerId}`}>
                        <Button variant="outline" size="sm" className="w-full" data-testid={`button-view-${talent.id}`}>
                          <Eye className="w-4 h-4 mr-1" />
                          View Profile
                        </Button>
                      </Link>

                      <Link href={`/client/projects/new?freelancer=${talent.freelancerId}`}>
                        <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700" data-testid={`button-hire-${talent.id}`}>
                          <Send className="w-4 h-4 mr-1" />
                          Send Offer
                        </Button>
                      </Link>

                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full text-red-600 hover:text-red-700"
                        onClick={() => removeSavedMutation.mutate(talent.freelancerId)}
                        data-testid={`button-remove-${talent.id}`}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
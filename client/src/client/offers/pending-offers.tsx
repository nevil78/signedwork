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
import { Link } from "wouter";
import { 
  Clock,
  Search,
  Filter,
  Eye,
  MessageSquare,
  CheckCircle,
  X,
  DollarSign,
  Calendar,
  User,
  Star,
  Shield,
  Award,
  AlertCircle,
  TrendingUp
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ClientNavHeader from "@/components/client-nav-header";

interface PendingOffer {
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
    totalReviews: number;
    verificationLevel: 'verified' | 'company_verified' | 'basic';
    responseTime: string;
    successRate: number;
    verifiedWorkHours: number;
  };
  offerAmount: number;
  proposedTimeline: string;
  message: string;
  sentAt: string;
  expiresAt: string;
  priority: 'normal' | 'urgent' | 'high';
  attachments?: string[];
}

export default function PendingOffers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch pending offers
  const { data: offers = [], isLoading } = useQuery({
    queryKey: ["/api/client/offers/pending"],
  });

  // Withdraw offer mutation
  const withdrawOfferMutation = useMutation({
    mutationFn: async (offerId: string) => {
      return apiRequest("PATCH", `/api/client/offers/${offerId}/withdraw`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client/offers/pending"] });
      toast({ title: "Offer withdrawn successfully" });
    },
  });

  // Mock data for demonstration
  const mockOffers: PendingOffer[] = [
    {
      id: "1",
      jobId: "job1",
      jobTitle: "Build React E-commerce Platform",
      freelancerId: "freelancer1",
      freelancer: {
        id: "freelancer1",
        firstName: "Sarah",
        lastName: "Johnson",
        profilePhoto: "",
        hourlyRate: 85,
        rating: 4.9,
        totalReviews: 47,
        verificationLevel: "verified",
        responseTime: "1 hour",
        successRate: 98,
        verifiedWorkHours: 2340
      },
      offerAmount: 4500,
      proposedTimeline: "4-6 weeks",
      message: "Hi! I'd love to work on your e-commerce platform. I have extensive experience with React and have built similar platforms for 5+ clients.",
      sentAt: "2024-01-15T10:30:00Z",
      expiresAt: "2024-01-22T10:30:00Z",
      priority: "high"
    },
    {
      id: "2",
      jobId: "job2",
      jobTitle: "Mobile App UI/UX Design",
      freelancerId: "freelancer2",
      freelancer: {
        id: "freelancer2",
        firstName: "Michael",
        lastName: "Chen",
        profilePhoto: "",
        hourlyRate: 65,
        rating: 4.8,
        totalReviews: 32,
        verificationLevel: "company_verified",
        responseTime: "2 hours",
        successRate: 95,
        verifiedWorkHours: 1240
      },
      offerAmount: 2800,
      proposedTimeline: "2-3 weeks",
      message: "I'm interested in your mobile app design project. My portfolio includes 15+ mobile apps with verified client satisfaction.",
      sentAt: "2024-01-14T14:20:00Z",
      expiresAt: "2024-01-21T14:20:00Z",
      priority: "normal"
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
            <User className="w-3 h-3" />
            Basic ⭐
          </Badge>
        );
      default:
        return null;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDaysUntilExpiry = (expiresAt: string) => {
    const days = Math.ceil((new Date(expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const filteredOffers = mockOffers.filter(offer => {
    const matchesSearch = offer.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         `${offer.freelancer.firstName} ${offer.freelancer.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = priorityFilter === "all" || offer.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <ClientNavHeader />
      
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900" data-testid="page-title">
              Pending Offers
            </h1>
            <p className="text-gray-600 mt-1">
              Track offers sent to freelancers and their responses
            </p>
          </div>
          <Link href="/client/find-freelancers">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <User className="w-4 h-4 mr-2" />
              Find More Talent
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pending</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-total-pending">{filteredOffers.length}</div>
              <p className="text-xs text-gray-600">Awaiting responses</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Priority</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-high-priority">
                {filteredOffers.filter(o => o.priority === 'high' || o.priority === 'urgent').length}
              </div>
              <p className="text-xs text-gray-600">Need attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
              <Calendar className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-expiring-soon">
                {filteredOffers.filter(o => getDaysUntilExpiry(o.expiresAt) <= 2).length}
              </div>
              <p className="text-xs text-gray-600">Within 2 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-avg-response">2.4 hrs</div>
              <p className="text-xs text-gray-600">From verified freelancers</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Search & Filter Offers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search offers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="search-offers"
                />
              </div>
              
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger data-testid="filter-priority">
                  <SelectValue placeholder="All priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger data-testid="sort-by">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="expiring">Expiring Soon</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" className="flex items-center">
                <Filter className="w-4 h-4 mr-2" />
                More Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Offers List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
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
          ) : filteredOffers.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No pending offers</h3>
                <p className="text-gray-600 mb-4">Send offers to freelancers to start building your team</p>
                <Link href="/client/find-freelancers">
                  <Button>
                    <User className="w-4 h-4 mr-2" />
                    Find Freelancers
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            filteredOffers.map((offer) => {
              const daysUntilExpiry = getDaysUntilExpiry(offer.expiresAt);
              const isExpiringSoon = daysUntilExpiry <= 2;
              
              return (
                <Card key={offer.id} className={`hover:shadow-md transition-shadow ${isExpiringSoon ? 'border-yellow-200 bg-yellow-50' : ''}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Badge className={getPriorityColor(offer.priority)}>
                          {offer.priority}
                        </Badge>
                        {isExpiringSoon && (
                          <Badge className="bg-yellow-100 text-yellow-800">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Expires in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        Sent {new Date(offer.sentAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex items-start gap-6">
                      <Avatar className="w-16 h-16">
                        <AvatarImage src={offer.freelancer.profilePhoto} />
                        <AvatarFallback className="text-lg">
                          {offer.freelancer.firstName[0]}{offer.freelancer.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-gray-900" data-testid={`freelancer-name-${offer.id}`}>
                            {offer.freelancer.firstName} {offer.freelancer.lastName}
                          </h3>
                          {getVerificationBadge(offer.freelancer.verificationLevel)}
                        </div>
                        
                        <p className="text-gray-700 font-medium mb-2">
                          Project: <Link href={`/client/projects/${offer.jobId}`} className="text-blue-600 hover:underline">
                            {offer.jobTitle}
                          </Link>
                        </p>

                        <p className="text-gray-600 mb-4">{offer.message}</p>

                        {/* Offer Details Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-gray-500">Offer Amount</p>
                            <p className="font-semibold text-lg flex items-center gap-1">
                              <DollarSign className="w-4 h-4" />
                              ${offer.offerAmount.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Proposed Timeline</p>
                            <p className="font-medium">{offer.proposedTimeline}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Hourly Rate</p>
                            <p className="font-medium">${offer.freelancer.hourlyRate}/hr</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Response Time</p>
                            <p className="font-medium">{offer.freelancer.responseTime}</p>
                          </div>
                        </div>

                        {/* Freelancer Stats */}
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-500" />
                              <span className="font-medium">{offer.freelancer.rating}</span>
                              <span className="text-gray-600">({offer.freelancer.totalReviews} reviews)</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <TrendingUp className="w-4 h-4 text-green-600" />
                              <span className="font-medium">{offer.freelancer.successRate}%</span>
                              <span className="text-gray-600">success rate</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Shield className="w-4 h-4 text-green-600" />
                              <span className="font-medium">{offer.freelancer.verifiedWorkHours}</span>
                              <span className="text-gray-600">verified hours</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4 text-blue-600" />
                              <span className="font-medium">Usually responds in {offer.freelancer.responseTime}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Link href={`/freelancers/${offer.freelancerId}`}>
                          <Button variant="outline" size="sm" className="w-full" data-testid={`button-view-profile-${offer.id}`}>
                            <Eye className="w-4 h-4 mr-1" />
                            View Profile
                          </Button>
                        </Link>
                        <Button variant="outline" size="sm" className="w-full" data-testid={`button-message-${offer.id}`}>
                          <MessageSquare className="w-4 h-4 mr-1" />
                          Message
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full text-red-600 hover:text-red-700"
                          onClick={() => withdrawOfferMutation.mutate(offer.id)}
                          data-testid={`button-withdraw-${offer.id}`}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Withdraw
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
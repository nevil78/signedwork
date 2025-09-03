import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  Search,
  Filter,
  Star,
  MapPin,
  Clock,
  DollarSign,
  Shield,
  Award,
  User,
  Heart,
  MessageSquare,
  Eye,
  TrendingUp
} from "lucide-react";
import { Link } from "wouter";
import ClientNavHeader from "@/components/client-nav-header";

interface Freelancer {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  profilePhoto?: string;
  title: string;
  description: string;
  hourlyRate: number;
  location: string;
  rating: number;
  totalReviews: number;
  completedJobs: number;
  totalEarnings: number;
  skills: string[];
  verificationLevel: 'verified' | 'company_verified' | 'basic';
  verifiedWorkHours: number;
  responseTime: string;
  successRate: number;
  availability: 'available' | 'busy' | 'unavailable';
  lastActive: string;
  portfolioItems: number;
}

export default function FindFreelancers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [experienceFilter, setExperienceFilter] = useState("all");
  const [rateFilter, setRateFilter] = useState("all");
  const [verificationFilter, setVerificationFilter] = useState("all");
  const [sortBy, setSortBy] = useState("relevance");

  // Fetch freelancers
  const { data: freelancers = [], isLoading } = useQuery({
    queryKey: ["/api/freelancers/search", {
      search: searchTerm,
      category: categoryFilter,
      experience: experienceFilter,
      rate: rateFilter,
      verification: verificationFilter,
      sort: sortBy
    }],
  });

  // Mock data for demonstration
  const mockFreelancers: Freelancer[] = [
    {
      id: "1",
      employeeId: "EMP-ABC123",
      firstName: "Sarah",
      lastName: "Johnson",
      profilePhoto: "",
      title: "Full-Stack Developer & UI/UX Designer",
      description: "Experienced developer with 5+ years in React, Node.js, and modern web technologies. Specialized in creating beautiful, responsive web applications.",
      hourlyRate: 85,
      location: "San Francisco, CA",
      rating: 4.9,
      totalReviews: 47,
      completedJobs: 152,
      totalEarnings: 125000,
      skills: ["React", "Node.js", "TypeScript", "UI/UX Design", "PostgreSQL"],
      verificationLevel: "verified",
      verifiedWorkHours: 2340,
      responseTime: "1 hour",
      successRate: 98,
      availability: "available",
      lastActive: "2 hours ago",
      portfolioItems: 12
    },
    {
      id: "2", 
      employeeId: "EMP-DEF456",
      firstName: "Michael",
      lastName: "Chen",
      profilePhoto: "",
      title: "Senior Mobile App Developer",
      description: "iOS and Android specialist with proven track record in fintech and e-commerce apps. Expert in React Native, Swift, and Kotlin.",
      hourlyRate: 95,
      location: "New York, NY",
      rating: 4.8,
      totalReviews: 63,
      completedJobs: 89,
      totalEarnings: 180000,
      skills: ["React Native", "iOS", "Android", "Swift", "Kotlin"],
      verificationLevel: "company_verified",
      verifiedWorkHours: 1890,
      responseTime: "30 minutes",
      successRate: 97,
      availability: "busy",
      lastActive: "1 hour ago",
      portfolioItems: 8
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

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available': return 'text-green-600';
      case 'busy': return 'text-yellow-600';
      case 'unavailable': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const filteredFreelancers = mockFreelancers.filter(freelancer => {
    const matchesSearch = searchTerm === "" || 
      freelancer.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      freelancer.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      freelancer.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <ClientNavHeader />
      
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900" data-testid="page-title">
              Find Freelancers
            </h1>
            <p className="text-gray-600 mt-1">
              Discover verified talent with authenticated work portfolios
            </p>
            <p className="text-sm text-green-600 font-medium mt-1">
              ⭐ All freelancers feature verified work diary portfolios - see real, authenticated work history
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Search & Filter Talent</CardTitle>
            <CardDescription>Find the perfect freelancer for your project</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search skills, titles, or keywords..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="search-freelancers"
                />
              </div>
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger data-testid="filter-category">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="development">Development</SelectItem>
                  <SelectItem value="design">Design & Creative</SelectItem>
                  <SelectItem value="writing">Writing</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                </SelectContent>
              </Select>

              <Select value={experienceFilter} onValueChange={setExperienceFilter}>
                <SelectTrigger data-testid="filter-experience">
                  <SelectValue placeholder="Experience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="entry">Entry Level</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="expert">Expert</SelectItem>
                </SelectContent>
              </Select>

              <Select value={verificationFilter} onValueChange={setVerificationFilter}>
                <SelectTrigger data-testid="filter-verification">
                  <SelectValue placeholder="Verification" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Verification</SelectItem>
                  <SelectItem value="verified">Fully Verified ⭐⭐⭐</SelectItem>
                  <SelectItem value="company_verified">Company Verified ⭐⭐</SelectItem>
                  <SelectItem value="basic">Basic ⭐</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger data-testid="sort-by">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Relevance</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="price_low">Price: Low to High</SelectItem>
                  <SelectItem value="price_high">Price: High to Low</SelectItem>
                  <SelectItem value="verified_hours">Most Verified Hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {filteredFreelancers.length} freelancers found
            </h2>
            <p className="text-gray-600">Showing verified professionals with authenticated portfolios</p>
          </div>
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            More Filters
          </Button>
        </div>

        {/* Freelancer Cards */}
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
          ) : filteredFreelancers.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No freelancers found</h3>
                <p className="text-gray-600">Try adjusting your search criteria or filters</p>
              </CardContent>
            </Card>
          ) : (
            filteredFreelancers.map((freelancer) => (
              <Card key={freelancer.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-6">
                    {/* Profile Section */}
                    <div className="flex-shrink-0">
                      <Avatar className="w-20 h-20">
                        <AvatarImage src={freelancer.profilePhoto} />
                        <AvatarFallback className="text-lg">
                          {freelancer.firstName[0]}{freelancer.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`text-center text-sm mt-2 ${getAvailabilityColor(freelancer.availability)}`}>
                        {freelancer.availability}
                      </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900" data-testid={`freelancer-name-${freelancer.id}`}>
                            {freelancer.firstName} {freelancer.lastName}
                          </h3>
                          <p className="text-lg text-gray-700 font-medium">{freelancer.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <MapPin className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-600">{freelancer.location}</span>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-600">Active {freelancer.lastActive}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">${freelancer.hourlyRate}/hr</div>
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="font-medium">{freelancer.rating}</span>
                            <span className="text-gray-600">({freelancer.totalReviews} reviews)</span>
                          </div>
                        </div>
                      </div>

                      {/* Verification and Stats */}
                      <div className="flex items-center gap-4 mb-3">
                        {getVerificationBadge(freelancer.verificationLevel)}
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Shield className="w-4 h-4 text-green-600" />
                          <span>{freelancer.verifiedWorkHours} verified hours</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <TrendingUp className="w-4 h-4" />
                          <span>{freelancer.successRate}% success rate</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>Responds in {freelancer.responseTime}</span>
                        </div>
                      </div>

                      <p className="text-gray-700 mb-4" data-testid={`freelancer-description-${freelancer.id}`}>
                        {freelancer.description}
                      </p>

                      {/* Skills */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {freelancer.skills.slice(0, 5).map((skill, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {freelancer.skills.length > 5 && (
                          <Badge variant="secondary" className="text-xs">
                            +{freelancer.skills.length - 5} more
                          </Badge>
                        )}
                      </div>

                      {/* Stats Row */}
                      <div className="grid grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                        <div>
                          <span className="font-medium">{freelancer.completedJobs}</span> jobs completed
                        </div>
                        <div>
                          <span className="font-medium">${freelancer.totalEarnings.toLocaleString()}</span> earned
                        </div>
                        <div>
                          <span className="font-medium">{freelancer.portfolioItems}</span> portfolio items
                        </div>
                        <div>
                          <span className="font-medium">{freelancer.verifiedWorkHours}</span> verified hours
                        </div>
                      </div>

                      {/* Signedwork Advantage */}
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                        <div className="flex items-center gap-2 text-green-800 text-sm font-medium">
                          <Shield className="w-4 h-4" />
                          Signedwork Verified Portfolio
                        </div>
                        <p className="text-green-700 text-sm mt-1">
                          This freelancer has {freelancer.verifiedWorkHours} hours of authenticated, fraud-proof work entries verified by company hierarchies.
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <Button variant="outline" size="sm" data-testid={`button-save-${freelancer.id}`}>
                        <Heart className="w-4 h-4 mr-1" />
                        Save
                      </Button>
                      <Button variant="outline" size="sm" data-testid={`button-message-${freelancer.id}`}>
                        <MessageSquare className="w-4 h-4 mr-1" />
                        Message
                      </Button>
                      <Link href={`/freelancers/${freelancer.id}`}>
                        <Button variant="outline" size="sm" className="w-full" data-testid={`button-view-${freelancer.id}`}>
                          <Eye className="w-4 h-4 mr-1" />
                          View Profile
                        </Button>
                      </Link>
                      <Link href={`/client/projects/new?freelancer=${freelancer.id}`}>
                        <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700" data-testid={`button-hire-${freelancer.id}`}>
                          Hire Now
                        </Button>
                      </Link>
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
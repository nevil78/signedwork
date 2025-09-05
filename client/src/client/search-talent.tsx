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
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
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
  TrendingUp,
  Zap,
  CheckCircle,
  Globe
} from "lucide-react";
import { Link } from "wouter";
import ClientNavHeader from "@/components/client-nav-header";

interface SearchFilters {
  query: string;
  category: string;
  skills: string[];
  hourlyRateMin: number;
  hourlyRateMax: number;
  rating: number;
  location: string;
  availability: string;
  verificationLevel: string;
  experienceLevel: string;
  responseTime: string;
  hasPortfolio: boolean;
  isOnline: boolean;
}

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
  isOnline: boolean;
  languages: string[];
  experienceYears: number;
  specializations: string[];
}

export default function SearchTalent() {
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    category: "all",
    skills: [],
    hourlyRateMin: 5,
    hourlyRateMax: 200,
    rating: 0,
    location: "all",
    availability: "all",
    verificationLevel: "all",
    experienceLevel: "all",
    responseTime: "all",
    hasPortfolio: false,
    isOnline: false
  });

  const [savedSearches, setSavedSearches] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  // Fetch freelancers based on search filters
  const { data: freelancers = [], isLoading } = useQuery({
    queryKey: ["/api/freelancers/search", filters],
  });

  // Mock data for demonstration
  const mockFreelancers: Freelancer[] = [
    {
      id: "1",
      employeeId: "EMP-ABC123",
      firstName: "Sarah",
      lastName: "Johnson",
      profilePhoto: "",
      title: "Senior React Developer & UI/UX Designer",
      description: "Full-stack developer with 6+ years of experience building scalable web applications. Specialized in React, Node.js, and cloud technologies.",
      hourlyRate: 85,
      location: "San Francisco, CA",
      rating: 4.9,
      totalReviews: 47,
      completedJobs: 152,
      totalEarnings: 125000,
      skills: ["React", "Node.js", "TypeScript", "AWS", "UI/UX Design", "PostgreSQL"],
      verificationLevel: "verified",
      verifiedWorkHours: 2340,
      responseTime: "1 hour",
      successRate: 98,
      availability: "available",
      lastActive: "2 hours ago",
      portfolioItems: 12,
      isOnline: true,
      languages: ["English", "Spanish"],
      experienceYears: 6,
      specializations: ["E-commerce", "SaaS", "Fintech"]
    },
    {
      id: "2", 
      employeeId: "EMP-DEF456",
      firstName: "Michael",
      lastName: "Chen",
      profilePhoto: "",
      title: "Mobile App Developer (iOS & Android)",
      description: "Native and cross-platform mobile developer with expertise in React Native, Swift, and Kotlin. Built 20+ apps with 500K+ downloads.",
      hourlyRate: 95,
      location: "Toronto, ON",
      rating: 4.8,
      totalReviews: 63,
      completedJobs: 89,
      totalEarnings: 180000,
      skills: ["React Native", "iOS", "Android", "Swift", "Kotlin", "Firebase"],
      verificationLevel: "company_verified",
      verifiedWorkHours: 1890,
      responseTime: "30 minutes",
      successRate: 97,
      availability: "busy",
      lastActive: "1 hour ago",
      portfolioItems: 8,
      isOnline: false,
      languages: ["English", "Mandarin"],
      experienceYears: 8,
      specializations: ["Fintech", "Healthcare", "Gaming"]
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

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      query: "",
      category: "all",
      skills: [],
      hourlyRateMin: 5,
      hourlyRateMax: 200,
      rating: 0,
      location: "all",
      availability: "all",
      verificationLevel: "all",
      experienceLevel: "all",
      responseTime: "all",
      hasPortfolio: false,
      isOnline: false
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ClientNavHeader />
      
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex gap-6">
          {/* Sidebar Filters */}
          <div className="w-80 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Search Filters
                </CardTitle>
                <CardDescription>Find the perfect freelancer for your project</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Search Query */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Search Keywords
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Skills, job titles, keywords..."
                      value={filters.query}
                      onChange={(e) => updateFilter('query', e.target.value)}
                      className="pl-10"
                      data-testid="search-input"
                    />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Category
                  </label>
                  <Select value={filters.category} onValueChange={(value) => updateFilter('category', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="development">Development & IT</SelectItem>
                      <SelectItem value="design">Design & Creative</SelectItem>
                      <SelectItem value="writing">Writing & Translation</SelectItem>
                      <SelectItem value="marketing">Sales & Marketing</SelectItem>
                      <SelectItem value="video">Video & Animation</SelectItem>
                      <SelectItem value="music">Music & Audio</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="data">Data</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Hourly Rate Range */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Hourly Rate: ${filters.hourlyRateMin} - ${filters.hourlyRateMax}
                  </label>
                  <div className="space-y-3">
                    <Slider
                      value={[filters.hourlyRateMin, filters.hourlyRateMax]}
                      onValueChange={([min, max]) => {
                        updateFilter('hourlyRateMin', min);
                        updateFilter('hourlyRateMax', max);
                      }}
                      max={200}
                      min={5}
                      step={5}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>$5</span>
                      <span>$200+</span>
                    </div>
                  </div>
                </div>

                {/* Verification Level */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Verification Level
                  </label>
                  <Select value={filters.verificationLevel} onValueChange={(value) => updateFilter('verificationLevel', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="verified">Fully Verified ⭐⭐⭐</SelectItem>
                      <SelectItem value="company_verified">Company Verified ⭐⭐</SelectItem>
                      <SelectItem value="basic">Basic ⭐</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Availability */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Availability
                  </label>
                  <Select value={filters.availability} onValueChange={(value) => updateFilter('availability', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Availability</SelectItem>
                      <SelectItem value="available">Available Now</SelectItem>
                      <SelectItem value="busy">Busy</SelectItem>
                      <SelectItem value="unavailable">Unavailable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Experience Level */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Experience Level
                  </label>
                  <Select value={filters.experienceLevel} onValueChange={(value) => updateFilter('experienceLevel', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="entry">Entry Level (0-2 years)</SelectItem>
                      <SelectItem value="intermediate">Intermediate (2-5 years)</SelectItem>
                      <SelectItem value="expert">Expert (5+ years)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Additional Filters */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700 block">
                    Additional Filters
                  </label>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="online"
                      checked={filters.isOnline}
                      onCheckedChange={(checked) => updateFilter('isOnline', checked)}
                    />
                    <label htmlFor="online" className="text-sm text-gray-700 flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Online Now
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="portfolio"
                      checked={filters.hasPortfolio}
                      onCheckedChange={(checked) => updateFilter('hasPortfolio', checked)}
                    />
                    <label htmlFor="portfolio" className="text-sm text-gray-700">
                      Has Portfolio
                    </label>
                  </div>
                </div>

                {/* Clear Filters */}
                <Button variant="outline" onClick={clearFilters} className="w-full">
                  Clear All Filters
                </Button>
              </CardContent>
            </Card>

            {/* Signedwork Advantage */}
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-green-800">Signedwork Advantage</h3>
                </div>
                <p className="text-sm text-green-700">
                  All freelancers feature verified work portfolios with multi-level authentication. 
                  See real, fraud-proof work history before hiring.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900" data-testid="page-title">
                  Search for Talent
                </h1>
                <p className="text-gray-600">
                  {mockFreelancers.length} verified freelancers found
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <Select value="relevance">
                  <SelectTrigger className="w-40">
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
            </div>

            {/* Results */}
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
              ) : (
                mockFreelancers.map((freelancer) => (
                  <Card key={freelancer.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-6">
                        {/* Profile Section */}
                        <div className="flex-shrink-0 relative">
                          <Avatar className="w-20 h-20">
                            <AvatarImage src={freelancer.profilePhoto} />
                            <AvatarFallback className="text-lg">
                              {freelancer.firstName[0]}{freelancer.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          {freelancer.isOnline && (
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                          )}
                          <div className={`text-center text-sm mt-2 font-medium ${getAvailabilityColor(freelancer.availability)}`}>
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
                              <div className="flex items-center gap-3 mt-1">
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4 text-gray-500" />
                                  <span className="text-gray-600">{freelancer.location}</span>
                                </div>
                                <span className="text-gray-400">•</span>
                                <span className="text-gray-600">Active {freelancer.lastActive}</span>
                                {freelancer.isOnline && (
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
                            {freelancer.skills.slice(0, 6).map((skill, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                            {freelancer.skills.length > 6 && (
                              <Badge variant="secondary" className="text-xs">
                                +{freelancer.skills.length - 6} more
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
                              <span className="font-medium">{freelancer.experienceYears}</span> years experience
                            </div>
                          </div>

                          {/* Signedwork Advantage */}
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                            <div className="flex items-center gap-2 text-green-800 text-sm font-medium">
                              <Shield className="w-4 h-4" />
                              Verified Portfolio Advantage
                            </div>
                            <p className="text-green-700 text-sm mt-1">
                              {freelancer.verifiedWorkHours} hours of authenticated work with fraud-proof verification chains. 
                              See real project history before hiring.
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
                              <Zap className="w-4 h-4 mr-1" />
                              Send Offer
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
      </div>
    </div>
  );
}